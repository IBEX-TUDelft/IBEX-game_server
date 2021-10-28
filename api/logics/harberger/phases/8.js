import WS from '../../../helpers/websocket.js';
import Utils from '../../../helpers/utils.js';

export default {
    create(game, wss) {
        const phase = {
            game: game,
            wss: wss,
            onEnter: async function () {
                console.log('PHASE 8');

                const self = this;

                self.game.players.filter(p => p.role === 1).forEach(p => {p.doneSpeculating = false});

                self.wss.broadcastInfo(self.game.id, 'Click on the properties you are interested in. Be fast or the other speculators will take them first!', 1);
                self.wss.broadcastInfo(self.game.id, 'Check the table of declared values. If you think some property is undervalued, you can buy it and make profit', 1);
                self.wss.broadcastInfo(self.game.id, 'Wait for the speculators to do their move', 2);
                self.wss.broadcastInfo(self.game.id, 'Wait for the speculators to do their move', 3);

                const declatationData = [];

                game.players.forEach(p => {
                    const property = p.property;

                    if (property != null) {
                        const declaration = {
                            "id": property.id,
                            "name": property.name,
                            "owner": p.name,
                            "d": property.d,
                            "available": [false, false, false]
                        };

                        declaration.available[self.game.winningCondition] = true;

                        declatationData.push(declaration);
                    }
                });

                const err = self.wss.broadcastEvent(
                    game.id,
                    "declarations-published",
                    declatationData
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
                return this.game.players.filter(p => p.role === 1).filter(p => !p.doneSpeculating).length == 0;
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
                    "type": "purchase-lot",
                    "role": [1],
                    "action": function(ws, message) {
                        const player = self.game.players.find(p => p.number === ws.player.number);

                        if (player == null) {
                            WS.error(ws, `Game ${message.gameId}: player ${ws.player.number} not found`);
                            return;
                        }

                        const lot = self.game.properties.find(p => p.id === message.lot.id);

                        if (lot == null) {
                            WS.error(ws, `Game ${message.gameId}: lot ${message.lot.id}} not found`);
                            return;
                        }

                        if (lot.speculators == null) {
                            lot.speculators = [null, null, null];
                        }

                        if (lot.speculators[message.lot.condition] != null) {
                            WS.error(ws, `Game ${message.gameId}: lot ${message.lot.id} is not for sale any more`);
                            return;
                        }

                        lot.speculators[message.lot.condition] = player.number;

                        console.log(`Property ${lot.name} was bought by a speculator: ${player.name} under condition ${message.lot.condition}`);

                        self.wss.broadcastEvent (
                            game.id,
                            "lot-sold-to-speculator",
                            {
                                "id": lot.id,
                                "condition": message.lot.condition
                            }
                        );
                    }
                }, {
                    "type": "done-speculating",
                    "role": [1],
                    "action": function(ws, message) {
                        const player = self.game.players.find(p => p.number === ws.player.number);

                        if (player == null) {
                            WS.error(ws, `Game ${message.gameId}: player ${ws.player.number} not found`);
                            return;
                        }

                        console.log(`Player ${player.name} is done speculating`);

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