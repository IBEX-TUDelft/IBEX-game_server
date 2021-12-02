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
                console.log('PHASE 9');

                const self = this;

                self.wss.broadcastInfo(self.game.id, `Final phase. Tax rate: ${this.game.parameters.tax_rate_final}`);

                // 1. reconciliation

                // a. calculate D

                self.game.D = [0,0,0];

                self.game.properties.forEach(p => {
                    for (let j = 0; j < 3; j++) {
                        self.game.D[j] += p.d[j];
                    }
                });

                // b. determine the winning condition

                let winningCondition = self.game.winningCondition;
                let winningSum = self.game.D[winningCondition];

                console.log(`The winning condition is ${winningCondition}, with a sum of ${winningSum}. Here the full list: ${self.game.D}`);

                self.game.properties.forEach(p => {
                    try {
                        const owner = self.game.players.find(pl => pl.number === p.owner);

                        if (owner == null) {
                            console.log(`Player number ${p.owner} not found`);
                            return;
                        }

                        console.log('Creating land profit bill');

                        const landProfit = {
                            "round": self.game.currentRound.number,
                            "phase": 9,
                            "property": p.id,
                            "condition": winningCondition,
                            "value": p.v[winningCondition],
                            "declaration": p.d[winningCondition],
                            "sniped": false,
                            "speculator": null,
                            "snipeProfit": 0,
                            "taxes": p.d[winningCondition] * self.game.parameters.tax_rate_final / 100
                        }

                        console.log('Current land profit');
                        console.log(landProfit);

                        if (p.speculators != null) {
                            console.log('There are speculators');

                            const speculatorNumber = p.speculators[winningCondition];

                            console.log(`Number: ${speculatorNumber}`);

                            if (speculatorNumber != null) {
                                const speculator = self.game.players.find(pl => pl.number === speculatorNumber);

                                if (speculator != null) {
                                    console.log(`Speculator exists`);

                                    landProfit.sniped = true;
                                    landProfit.speculator = speculatorNumber;
                                    landProfit.snipeProfit = p.v[winningCondition] - Math.round(0.5 * (p.v[winningCondition] + p.d[winningCondition]));

                                    console.log('Land profit updated');

                                    if (speculator.profit == null) {
                                        speculator.profit =  [];
                                    }

                                    speculator.profit.push({
                                        "phase": 9,
                                        "amount": landProfit.snipeProfit,
                                        "context": {
                                            "type": "speculation",
                                            "property": {
                                                "id": p.id,
                                                "name": p.name
                                            },
                                            "condition": winningCondition
                                        }
                                    });

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
                                        "executed": true
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
                                        "profit": landProfit.snipeProfit
                                    });

                                    console.log('Profit added to the speculator');
                                }
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
                            "phase": 9,
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

                // 2. tax rate declared

                const taxPot = winningSum * this.game.parameters.tax_rate_final / 100;

                console.log(`Total taxes: ${taxPot}`);

                const totalShares = this.game.players.reduce((acc, p2) => acc + p2.shares, 0);

                console.log(`Total shares: ${totalShares}`);

                this.game.players.forEach(player => {
                    if (player.profit == null) {
                        player.profit = [];
                    }

                    player.profit.push({
                        "phase": 9,
                        "amount": Math.round(taxPot * player.shares / totalShares + player.balance - self.game.parameters.owner_balance),
                        "context": {
                            "type": "tax-income",
                            "condition": winningCondition
                        }
                    });

                    self.wss.sendEvent(
                        self.game.id,
                        player.number,
                        "tax-income",
                        {
                            "amount": Math.round(taxPot * player.shares / totalShares + player.balance - self.game.parameters.owner_balance),
                            "condition": winningCondition
                        }
                    );

                    console.log(player.profit);
                });

                this.game.players.forEach(player => {
                    const profit = player.profit.reduce((acc, p2) => acc + p2.amount, 0);

                    self.wss.sendEvent(
                        self.game.id,
                        player.number,
                        "total-profit",
                        {
                            "amount": profit
                        }
                    );
                });

                setTimeout(() => {
                    self.complete = true;
                }, 15000);
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