import WS from '../../../helpers/websocket.js';
import Utils from '../../../helpers/utils.js';

export default {
    create(game, wss) {
        const phase = {
            game: game,
            wss: wss,
            complete: false,
            onEnter: async function () {
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
                                        "phase": 4,
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

                                    console.log('Profit added to the speculator');
                                }
                            }
                        }

                        console.log('Done with speculators');

                        const owner = self.game.players.find(pl => pl.number === p.owner);

                        if (owner == null) {
                            console.log(`Player number ${p.owner} not found`);
                            return;
                        }

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

                /*self.game.properties.forEach(p => {
                    if (p.speculators == null) {
                        console.log(`No speculation on ${p.name} this phase under any condition`);
                        return;
                    }

                    const speculatorNumber = p.speculators[winningCondition];

                    if (speculatorNumber == null) {
                        console.log(`No speculation on ${p.name} this phase under the winning condition ${winningCondition}`);
                        return;
                    }
                    
                    const speculator = self.game.players.find(pl => pl.number === speculatorNumber);

                    if (speculator == null) {
                        console.log(`PLayer number ${speculatorNumber} not found`);
                        return;
                    }

                    const owner = self.game.players.find(pl => pl.number === p.owner);

                    if (owner == null) {
                        console.log(`Player number ${p.owner} not found`);
                        return;
                    }

                    const speculatorProfit = p.v[winningCondition] - Math.round(0.5 * (p.v[winningCondition] + p.d[winningCondition]));

                    if (speculatorProfit == 0)  {
                        console.log(`The owner of ${p.name} declared the exact value for that property. No profit/loss from this speculation`);
                        return;
                    }

                    if (speculator.profit == null) {
                        speculator.profit =  [];
                    }

                    speculator.profit.push({
                        "phase": 4,
                        "amount": speculatorProfit,
                        "context": {
                            "type": "speculation",
                            "property": {
                                "id": p.id,
                                "name": p.name
                            },
                            "condition": winningCondition
                        }
                    });

                    self.wss.sendEvent(
                        self.game.id,
                        speculator.number,
                        "speculation-with-profit",
                        {
                            "profit": speculatorProfit,
                            "property": {
                                "id": p.id,
                                "name": p.name
                            },
                            "condition": winningCondition
                        }
                    );

                    if (owner.profit == null) {
                        owner.profit = [];
                    }

                    owner.profit.push({
                        "phase": 4,
                        "amount": -speculatorProfit,
                        "context": {
                            "type": "speculation",
                            "property": {
                                "id": p.id,
                                "name": p.name
                            },
                            "condition": winningCondition
                        }
                    });

                    self.wss.sendEvent(
                        self.game.id,
                        owner.number,
                        "speculation-with-profit",
                        {
                            "profit": -speculatorProfit,
                            "property": {
                                "id": p.id,
                                "name": p.name
                            },
                            "condition": winningCondition
                        }
                    );
                });*/

                // 4. transition to the next phase

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