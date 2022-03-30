import WS from '../../../helpers/websocket.js';
import Utils from '../../../helpers/utils.js';

export default {
    create(game, wss) {
        const phase = {
            game: game,
            wss: wss,
            startTime: 0,
            onEnter: async function () {
                console.log('PHASE 8');

                const self = this;

                self.game.players.filter(p => p.role === 1).forEach(p => {p.doneSpeculating = false});

                self.endTime = Date.now() + self.game.parameters.minutes_for_sniping * 60 * 1000;

                self.wss.broadcastInfo(self.game.id, 'Click on the properties you are interested in. Be fast or the other speculators will take them first!', 1);
                self.wss.broadcastInfo(self.game.id, 'Check the table of declared values. If you think some property is undervalued, you can buy it and make profit', 1);
                self.wss.broadcastInfo(self.game.id, 'Wait for the speculators to do their move', 2);
                self.wss.broadcastInfo(self.game.id, 'Wait for the speculators to do their move', 3);

                const declarationData = [];

                game.players.forEach(p => {
                    const property = p.property;

                    if (property != null) {
                        const declaration = {
                            "id": property.id,
                            "name": property.name,
                            "owner": p.name,
                            "role": p.role,
                            "number": p.number,
                            "d": property.d,
                            "available": [false, false, false]
                        };

                        declaration.available[self.game.winningCondition] = true;

                        console.log('Winning condition declaration made available for sniping');

                        declarationData.push(declaration);

                        console.log('Declaration pushed');
                    }
                });

                console.log('Broadcasting declarations');

                const err = self.wss.broadcastEvent(
                    game.id,
                    "declarations-published",
                    {
                        "declarations": declarationData,
                        "winningCondition": self.game.winningCondition
                    }
                );

                if (err != null) {
                    console.log(err);
                }
            },
            getData() {
                return game.properties.map(p => {
                    return {
                        "id": p.id,
                        "name": p.name,
                        "speculators": p.speculators,
                    }
                });
            },
            onExit: async function () {
            },
            testComplete: async function () {
                return this.game.players.filter(p => p.role === 1).filter(p => !p.doneSpeculating).length == 0 || Date.now() >= this.endTime;
            },
            onMessage: async function(ws, message) {
                const handler = this.handlers.find(m => m.type === message.type);

                if (handler == null) {
                    WS.error(ws, `Game ${message.gameId} is full. You cannot join`);
                    return;
                }

                if (handler.role != null) {
                    if (!handler.role.includes(ws.player.role)) {
                        WS.error(ws, `Game ${message.gameId}: only ${handler.role} can send this message in this phase. You are ${ws.player.role}.`);
                        return;
                    }
                    
                    if (ws.player.role === 0) {
                        const verification = Utils.verifyJWT(message.token);
    
                        if (verification == null || verification.role != 0)  {
                            WS.error(ws, 'Could not verify your token');
                            return;
                        }
                    }
                }

                await handler.action(ws, message);

                return await this.testComplete();
            },
            init: function () {
                const self = this;

                this.handlers.push({
                    "type": "done-speculating",
                    "role": [1],
                    "action": function(ws, message) {
                        const player = self.game.players.find(p => p.number === ws.player.number);

                        if (player == null) {
                            WS.error(ws, `Game ${message.gameId}: player ${ws.player.number} not found`);
                            return;
                        }

                        console.log(`Player ${player.name} is done speculating`);

                        console.log(message.snipe);
                        console.log(typeof message.snipe);
                        console.log(Array.isArray(message.snipe));
                        console.log(message.snipe.length);

                        if (message.snipe == null) {
                            console.error('The snipe object contains no arrays');
                            player.doneSpeculating = true;
                            return;
                        }

                        for (let conditionIndex = 0; conditionIndex < 3; conditionIndex ++) {
                            const conditionSnipes = message.snipe[conditionIndex];

                            console.log(`Condition ${conditionIndex} snipes: ${conditionSnipes.length}`);
    
                            if (conditionSnipes != null && conditionSnipes.length > 0) {
                                conditionSnipes.forEach(id => {
                                    const lot = self.game.properties.find(p => p.id === id);
    
                                    if (lot == null) {
                                        WS.error(ws, `Game ${message.gameId}: lot ${id}} not found`);
                                        console.log(`Game ${message.gameId}: lot ${id}} not found`);
                                        return;
                                    }
            
                                    if (lot.speculators == null) {
                                        lot.speculators = [[], [], []];
                                    }

                                    lot.speculators[conditionIndex].push(player.number);
            
                                    console.log(`Property ${lot.name} was selected by a speculator: ${player.name} under condition ${conditionIndex}`);
                                });
                            }
                        }

                        player.doneSpeculating = true;
                    }
                });
            },
            handlers: []
        }

        phase.init();

        return phase;
    }
}