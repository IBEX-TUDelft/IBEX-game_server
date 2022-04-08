import WS from '../../../helpers/websocket.js';
import Utils from '../../../helpers/utils.js';

export default {
    create(game, wss) {
        const phase = {
            game: game,
            wss: wss,
            complete: false,
            results: {
                snipes: [],
                snipeOutcomes: []
            },
            onEnter: async function () {
                //await super.onEnter();

                console.log('PHASE 4');

                const self = this;

                self.wss.broadcastInfo(self.game.id, 'Reconciliation in progress ...');

                const winningCondition = this.game.winningCondition;

                self.game.properties.forEach(p => {
                    try {
                        console.log('Creating land profit bill');

                        const landProfit = {
                            "round": self.game.currentRound.number,
                            "phase": 4,
                            "property": p.id,
                            "condition": winningCondition,
                            "value": p.v[winningCondition],
                            "declaration": p.d[winningCondition],
                            "sniped": false,
                            "speculator": null,
                            "snipeProfit": 0,
                            "taxes": p.d[winningCondition] * self.game.parameters.tax_rate_initial / 100
                        }

                        console.log('Current land profit');
                        console.log(landProfit);

                        const owner = self.game.players.find(pl => pl.number === p.owner);

                        if (owner == null) {
                            console.log(`Player number ${p.owner} not found`);
                            return;
                        }

                        if (p.speculators != null && p.speculators[winningCondition].length > 0) {
                            console.log('There are speculators');

                            const biddingSpeculators = p.speculators[winningCondition];

                            let winningBidderIndex = 0;
                            
                            if (biddingSpeculators.length >= 1) {
                                winningBidderIndex = Math.floor( Math.random() * biddingSpeculators.length );
                            }

                            console.log(`Speculator who won: ${biddingSpeculators[winningBidderIndex]}`);

                            for (let i = 0; i < biddingSpeculators.length; i++) {
                                const speculatorNumber = biddingSpeculators[i];
                                
                                const speculator = self.game.players.find(pl => pl.number === speculatorNumber);

                                if (speculator == null) {
                                    console.log(`Speculator with id ${speculatorNumber} not found`);
                                    continue;
                                }

                                if (i === winningBidderIndex) {
                                    landProfit.sniped = true;
                                    landProfit.speculator = speculatorNumber;
                                    landProfit.snipeProfit = p.v[winningCondition] - Math.round(0.5 * (p.v[winningCondition] + p.d[winningCondition]));

                                    console.log('Land profit updated');                                    
                                }

                                if (speculator.profit == null) {
                                    speculator.profit =  [];
                                }

                                self.results.snipes.push( {
                                    "player": {
                                        "number": speculator.number,
                                        "role": speculator.role
                                    },
                                    "target": {
                                        "number": owner.number,
                                        "role": owner.role
                                    },
                                    "snipes": [winningCondition === 0, winningCondition === 1, winningCondition === 2],
                                    "executed": i === winningBidderIndex
                                });

                                self.results.snipeOutcomes.push( {
                                    "player": {
                                        "number": speculator.number,
                                        "role": speculator.role
                                    },
                                    "target": {
                                        "number": owner.number,
                                        "role": owner.role
                                    },
                                    "profit": i === winningBidderIndex ? landProfit.snipeProfit : 0
                                });

                                speculator.profit.push({
                                    "phase": 4,
                                    "amount": i === winningBidderIndex ? landProfit.snipeProfit : 0,
                                    "context": {
                                        "type": "speculation",
                                        "property": {
                                            "id": p.id,
                                            "name": p.name
                                        },
                                        "condition": winningCondition
                                    }
                                });

                                console.log('Profit added to the speculator');
                            }
                        }

                        console.log('Done with speculators');

                        console.log('Owner found');
                        console.log(owner);

                        landProfit.owner = owner.number;
                        landProfit.role = owner.role;

                        landProfit.total = landProfit.value - landProfit.taxes - landProfit.snipeProfit;

                        if (owner.profit == null) {
                            owner.profit =  [];
                        }

                        owner.profit.push({
                            "phase": 4,
                            "amount": landProfit.total,
                            "context": {
                                "type": "speculation",
                                "property": {
                                    "id": p.id,
                                    "name": p.name
                                },
                                "condition": winningCondition
                            }
                        });

                        console.log('Added profit to owner');

                        if (landProfit.speculator != null) {
                            //TODO: remove extra info the speculators shouldn't know
                            self.wss.sendEvent(
                                self.game.id,
                                landProfit.speculator,
                                "profit",
                                landProfit
                            );

                            console.log('Sent message to speculator');
                        }

                        self.wss.sendEvent(
                            self.game.id,
                            owner.number,
                            "profit",
                            landProfit
                        );

                        console.log('Sent message to owner');
                    } catch(e) {
                        console.error(e);
                    }
                });

                setTimeout(() => {
                    self.complete = true;
                }, 5000);
            },
            getData() {
                return this.game.players.map(p => {
                    return {
                        "id": p.id,
                        "name": p.name,
                        "profit": p.profit,
                    }
                });
            },
            onExit: async function () {
                this.game.players.filter(p => p.role === 1).forEach(p => { p.doneSpeculating = false; });
                this.game.properties.forEach(p => { p.speculators = null; });
            },
            testComplete: async function () {
                return this.complete;
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
            },
            handlers: []
        }

        phase.init();

        return phase;
    }
}