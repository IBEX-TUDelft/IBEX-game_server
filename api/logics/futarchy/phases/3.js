import WS from '../../../helpers/websocket.js';
import Utils from '../../../helpers/utils.js';

export default {
    create(game, wss) {
        const phase = {
            game: game,
            wss: wss,
            startTime: 0,
            results: {},
            onEnter: async function () {
                console.log('PHASE 3');

                const self = this;

                console.log(`Setting the timeout to ${self.game.parameters.minutes_for_sniping} minutes`);

                self.endTime = Date.now() + self.game.parameters.minutes_for_sniping * 60 * 1000;

                self.game.players.filter(p => p.role === 1).forEach(p => {p.doneSpeculating = false});

                self.wss.broadcastInfo(self.game.id, 'Click on the properties you are interested in. Be fast or the other speculators will take them first!', 1);
                self.wss.broadcastInfo(self.game.id, 'Check the table of declared values. If you think some property is undervalued, you can buy it and make profit', 1);
                self.wss.broadcastInfo(self.game.id, 'Wait for the speculators to do their move', 2);
                self.wss.broadcastInfo(self.game.id, 'Wait for the speculators to do their move', 3);

                // 1. calculate D

                self.game.D = [0,0,0];

                self.game.properties.forEach(p => {
                    for (let j = 0; j < 3; j++) {
                        self.game.D[j] += p.d[j];
                    }
                });

                // 2. calculate all public signals

                console.log('Calculating the public signal');

                this.game.publicSignal = [0, 0, 0];

                const r = self.game.parameters.tax_rate_final / 100;

                for(let conditionIndex = 0; conditionIndex < 3; conditionIndex++) {
                    /* S would be the total declared value if the declaration would not change later.
                        This yields S * r, the total tax virtual revenue at this stage.
                        We say there are 100 shares of it, not all distributed to player (e.g. 5 per player, 12 players = 60% redistributed),
                        so each share has a theoretical value of:
                    */
                    const S = self.game.D[conditionIndex];
                    this.game.publicSignal[conditionIndex] = S * r / 100;
                }

                // 3. send declarations
                const declatationData = [];

                game.players.forEach(p => {
                    const property = p.property;

                    if (property != null) {
                        declatationData.push({
                            "id": property.id,
                            "name": property.name,
                            "owner": p.name,
                            "role": p.role,
                            "number": p.number,
                            "d": property.d,
                            "available": [true, true, true]
                        });
                    }
                });

                let err = self.wss.broadcastEvent(
                    game.id,
                    "declarations-published",
                    {
                        "declarations": declatationData
                    }
                );

                if (err != null) {
                    console.log(err);
                }

                console.log('Setting the timer remotely to speculators');

                err = self.wss.broadcastEvent(
                    game.id,
                    "set-timer",
                    {
                        "end": self.endTime
                    },
                    1
                );

                if (err != null) {
                    console.log(err);
                }

                this.wss.broadcastEvent (
                    game.id,
                    "phase-instructions",
                    {
                        "instructions": "Analyse all declarations and choose which ones to target, under all conditions"
                    },
                    1
                );

                this.wss.broadcastEvent (
                    game.id,
                    "phase-instructions",
                    {
                        "instructions": "Wait for the speculators to make their decisions"
                    },
                    2
                );

                this.wss.broadcastEvent (
                    game.id,
                    "phase-instructions",
                    {
                        "instructions": "Wait for the speculators to make their decisions"
                    },
                    3
                );
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
                const err = this.wss.broadcastEvent(
                    game.id,
                    "reset-timer",
                    {},
                    1
                );

                if (err != null) {
                    console.log(err);
                }
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

                        self.wss.sendEvent(
                            self.game.id,
                            player.number,
                            "speculation-received",
                            {}
                        );

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