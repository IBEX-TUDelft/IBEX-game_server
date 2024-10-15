import { WebSocketServer } from 'ws';
import Utils from '../helpers/utils.js';
import WS from '../helpers/websocket.js';

export default {
    create() {
        const wssManager =  {
            wss: new WebSocketServer({ port: process.env.VUE_APP_WSS_PORT}),
            gameManager: null,
            allowedMessages: [ //TODO: belongs to the game logic
                [{"type": "join", "role": null}], //0
                [], //1
                [], //2
                [], //3
                [], //4
                [], //5
                [], //6
                [], //7
                [], //8
                []  //9
            ],
            games: [],
            interval: null,
            init: function (gameManager) {
                this.gameManager = gameManager;
                this.allowedMessages.forEach(array => array.push({"type": "rejoin", "role": null})); //Can rejoin in each phase

                const wss = this.wss;
                const self = this;

                wss.on('connection', function connection(ws) {
                    ws.isAlive = true;
                    ws.on('pong', () => {
                        ws.isAlive = true; 
                    });

                    ws.on('message', function (data) {
                        let message;

                        try {
                            message = JSON.parse(data.toString());
                            Utils.debug(message);
                        } catch(e) {
                            console.error(`Error caused by the following message: ${data.toString()}`, e);
                            WS.send(ws, {
                                "error": e.message
                            });
                            return;
                        }

                        const game = self.games.find(g => g.id  === message.gameId);
    
                        self.gameManager.handleMessage(ws, message);
                    });
                });

                this.interval = setInterval(function ping() {
                    wss.clients.forEach(function each(ws) {
                        if (ws.isAlive === false) {
                            return ws.terminate();
                        }
        
                        ws.isAlive = false;
                        ws.ping();
                    });
                }, process.env.VUE_APP_WSS_PING_INTERVAL);
            },
            broadcastEvent: function(id, type, data, role) {
                const game = this.games.find(g => g.id === id);

                if (game == null) {
                    Utils.debug('Game id null, broadcastEvent', data);
                    return `Game ${id} not found`;
                }

                game.players.forEach(ws => {
                    if (role == null || ws.player.role === role) {
                        WS.sendEvent(ws, type, data);
                    }
                });

                game.watchers.forEach(ws => {
                    WS.sendEvent(ws, type, data);
                });
            },
            sendEvent(gameId, playerNumber, type, data) {
                const game = this.games.find(g => g.id === gameId);

                if (game == null) {
                    Utils.debug('Game id null, sendEvent', data);
                    return `Game ${gameId} not found`;
                }

                const ws = game.players.find(ws => ws.player.number === playerNumber);

                if (ws == null) {
                    return `Game ${gameId}: player ${playerNumber}'s connection not found`;
                }

                WS.sendEvent(ws, type, data);

            },
            broadcastInfo(id, message, role) {
                this.broadcastMessage(id, "info", message, role);
            },
            broadcastNotice(id, message, role) {
                this.broadcastMessage(id, "notice", message, role);
            },
            broadcastWarning(id, message, role) {
                this.broadcastMessage(id, "warning", message, role);
            },
            broadcastError(id, message, role) {
                this.broadcastMessage(id, "error", message, role);
            },
            broadcastFatal(id, message, role) {
                this.broadcastMessage(id, "fatal", message, role);
            },
            broadcastMessage: function(id, type, message, role) {
                const game = this.games.find(g => g.id === id);

                if (game == null) {
                    Utils.debug('Game id null, broadcastMessage', {});
                    return `Game ${id} not found`;
                }

                game.players.forEach(ws => {
                    if (role == null || ws.player.role === role) {
                        WS.sendMessage(ws, type, message);
                    }
                });

                game.watchers.forEach(ws => {
                    WS.sendMessage(ws, type, message);
                });
            },
            joinGame: function (ws, id, role, number) {
                console.log(`Player ${number} is [re]joining game ${id}`);

                const game = this.games.find(g => g.id === id);

                if (game == null) {
                    Utils.debug('Game id null, joinGame', data);
                    return `Game ${id} not found`;
                }

                ws.player = {
                    gameId: id,
                    number: number,
                    role: role
                }

                const index = game.players.findIndex(w => w.player.number === number);

                if (index > -1) {
                    console.log(`Player ${number} rejoined with a new websocket`);
                    game.players.splice(index, 1);
                }

                game.players.push(ws);

                ws.on('close', function (code, reason) {
                    console.log(`Player ${ws.player.number} disconnected with code ${code}: ${reason}`)
                    //game.players.splice(game.players.indexOf(ws), 1);
                });
            },
            watchGame: function (ws, id) {
                const game = this.games.find(g => g.id === id);

                if (game == null) {
                    Utils.debug('Game id null, watchGame', data);
                    return `Game ${id} not found`;
                }

                ws.gameId = id;

                game.watchers.push(ws);

                ws.on('close', function () {
                    game.watchers.splice(game.watchers.indexOf(ws), 1);
                });
            },
            startGame: function (id, players) {
                const game = this.games.find(g => g.id === id);

                if (game != null) {
                    console.log(`Game ${id} has already started`);
                    return;
                }
                
                this.games.push({
                    id: id,
                    players: [],
                    watchers: []
                });
            },
            deleteGame: async function (id) {
                const game = this.games.find(g => g.id === id);

                if (game == null) {
                    return `Game ${id} not found inside the WSS manager`;
                }

                for (let i = 0; i < game.players.length; i++) {
                    game.players[i].terminate();
                }

                for (let i = 0; i < game.watchers.length; i++) {
                    game.watchers[i].terminate();
                }

                this.games.splice(this.games.indexOf(game), 1);
            },
            updateGame: function (id, round, phase) {
                const game = this.games.find(g => g.id === id);

                game.round = round;
                game.phase = phase;
            },
            shutdown: async function () {
                console.log('Closing the WSS server ..')

                wss.clients.forEach(ws => {
                    ws.terminate();
                });
                
                if (this.interval != null) {
                    clearInterval(interval);
                }

                await new Promise((resolve, reject) => {
                    wss.close((err) => {
                        if (err != null) {
                            reject(err);
                        } else {
                            console.log('WSS server closed.');
                            resolve();
                        }
                    });
                })
            }
        };

        return wssManager;
    }
}