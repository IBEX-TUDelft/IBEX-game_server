import WS from '../../../helpers/websocket.js';
import JoinablePhase from '../../JoinablePhase.js';

class Phase8 extends JoinablePhase {

    startTime = 0;
    results = {
        cashForSniping: [],
        snipes: [],
        snipeOutcomes: [],
        finalPrice: null
    };

    constructor(game, wss, number) {
        super (game, wss, [{
            "type": "done-speculating",
            "role": [1],
            "action": function(ws, message, player, caller) {
                console.log(`Player ${player.name} is done speculating`);

                console.log(message.snipe);
                console.log(typeof message.snipe);
                console.log(Array.isArray(message.snipe));
                console.log('Message snipe arrays (should be 3)' + message.snipe.length);

                if (message.snipe == null) {
                    console.error('The snipe object contains no arrays');
                    player.doneSpeculating = true;
                    return;
                }

                const winningConditionSnipes = message.snipe[game.winningCondition];

                console.log('Winning condition snipes: ' + winningConditionSnipes.length);

                if (winningConditionSnipes != null && winningConditionSnipes.length > 0) {
                    winningConditionSnipes.forEach(id => {
                        const lot = game.properties.find(p => p.id === id);

                        if (lot == null) {
                            WS.error(ws, `Game ${message.gameId}: lot ${id}} not found`);
                            console.log(`Game ${message.gameId}: lot ${id}} not found`);
                            return;
                        }

                        if (lot.speculators == null) {
                            lot.speculators = [[], [], []];
                        }

                        lot.speculators[game.winningCondition].push(player.number);

                        console.log(`Property ${lot.name} was selected by a speculator: ${player.name} under condition ${game.winningCondition}`);
                    });
                }

                wss.sendEvent(
                    game.id,
                    player.number,
                    "speculation-received",
                    {}
                );

                player.doneSpeculating = true;
            }
        }], [
            'Analyse all declarations and choose which ones to target, under all conditions',
            'Wait for the speculators to make their decisions',
            'Wait for the speculators to make their decisions'
        ], number);
    }

    async onEnter () {
        await super.onEnter();

        this.game.properties.forEach(property => {
            property.speculators = [[], [], []];
        });

        const self = this;

        self.game.players.filter(p => p.role === 1).forEach(p => {p.doneSpeculating = false});

        const declarationData = [];

        this.game.players.forEach(p => {
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

        let err = self.wss.broadcastEvent(
            this.game.id,
            "declarations-published",
            {
                "declarations": declarationData,
                "winningCondition": self.game.winningCondition
            }
        );

        if (err != null) {
            console.log(err);
        }

        //this.setTimer(self.game.parameters.minutes_for_sniping * 60 * 1000, self.game.parameters.minutes_for_sniping * 60 * 1000);
    }

    async onExit() {
        await super.onExit();

        const self = this;

        self.wss.broadcastInfo(self.game.id, `Final phase. Tax rate: ${this.game.parameters.tax_rate_final}`);

        // 1. reconciliation

        // a. calculate D

        self.game.D = [];

        self.game.properties.forEach(p => {
            for (let j = 0; j < self.game.conditions.length; j++) {
                if (self.game.D[j] == null) {
                    self.game.D[j] = 0;
                }
                
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

                if (p.speculators != null && p.speculators[winningCondition].length > 0) {
                    console.log('There are speculators');

                    const biddingSpeculators = p.speculators[winningCondition];

                    const speculationProfit = (p.v[winningCondition] - p.d[winningCondition]) / (2  * biddingSpeculators.length);

                    landProfit.sniped = true;
                    landProfit.speculator = biddingSpeculators;
                    landProfit.snipeProfit = speculationProfit;

                    for (let i = 0; i < biddingSpeculators.length; i++) {
                        const speculatorNumber = biddingSpeculators[i];
                        
                        const speculator = self.game.players.find(pl => pl.number === speculatorNumber);

                        if (speculator == null) {
                            console.log(`Speculator with id ${speculatorNumber} not found`);
                            continue;
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
                            "profit": speculationProfit
                        });

                        speculator.profit.push({
                            "phase": 4,
                            "amount": speculationProfit,
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

                        self.wss.sendEvent(
                            self.game.id,
                            speculatorNumber,
                            "profit",
                            {
                                "round": self.game.currentRound.number,
                                "owner": owner.number,
                                "sniped": true,
                                "snipeProfit": speculationProfit,
                                "condition": winningCondition,
                                "declaration": p.d[winningCondition]
                            }
                        );
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

        const totalShares = 100;

        console.log(`Total shares: ${totalShares}`);

        self.results.finalPrice = taxPot / totalShares;

        let err = self.wss.broadcastEvent(
            self.game.id,
            "final-price",
            {
                "price": self.results.finalPrice,
                "winningCondition": self.game.winningCondition
            }
        );

        if (err != null) {
            console.log(err);
        }

        this.game.players.forEach(player => {
            self.results.cashForSniping.push({
                "number": player.number,
                "cashForSniping": player.cashForSniping
            });

            if (player.profit == null) {
                player.profit = [];
            }

            player.profit.push({
                "phase": 9,
                "amount": Math.round(taxPot * player.wallet[winningCondition].shares / totalShares + player.wallet[winningCondition].balance - self.game.parameters.owner_balance),
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
                    "amount": Math.round(taxPot * player.wallet[winningCondition].shares / totalShares + player.wallet[winningCondition].balance - self.game.parameters.owner_balance),
                    "condition": winningCondition
                }
            );
            
            const taxProfit = Math.round(taxPot * player.wallet[winningCondition].shares / totalShares + player.wallet[winningCondition].balance - self.game.parameters.owner_balance);

            const taxProfitBill = {
                "round": self.game.currentRound.number,
                "phase": 9,
                "condition": winningCondition,
                "owner": player.number,
                "role": player.role,
                "taxes": 0,
                "snipeProfit": (player.role === 1 ? taxProfit : 0),
                "total": (player.role === 1 ? 0 : taxProfit)
            }

            self.wss.sendEvent(
                self.game.id,
                player.number,
                "profit",
                taxProfitBill
            );
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

        this.game.players.forEach(player => {
            const secondSnipes = self.results.snipeOutcomes
                .filter(so => so.player.number === player.number || so.target.number === player.number);

            self.wss.sendEvent(
                self.game.id,
                player.number,
                "second-snipes",
                {
                    "snipes": secondSnipes
                }
            );
        });
    }

    getData() {
        return this.game.properties.map(p => {
            return {
                "id": p.id,
                "name": p.name,
                "speculators": p.speculators,
            }
        });
    }

    testComplete () {
        return this.game.players.filter(p => p.role === 1).filter(p => !p.doneSpeculating).length == 0;
    }
}

export default {
    create(game, wss, number) {
        return new Phase8(game, wss, number);
    }
}