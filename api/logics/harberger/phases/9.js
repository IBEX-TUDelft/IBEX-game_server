import WS from '../../../helpers/websocket.js';
import Utils from '../../../helpers/utils.js';
import Phase from '../../Phase.js';

class Phase9 extends Phase {

    complete = false;
    results = {
        snipes: [],
        snipeOutcomes: []
    };

    constructor (game, wss) {
        super (game, wss, [], [
            'Take a look at the results of this round'
        ]);
    }

    async onEnter () {
        await super.onEnter();

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

        //const totalShares = this.game.players.reduce((acc, p2) => acc + p2.shares, 0);
        const totalShares = 100;

        console.log(`Total shares: ${totalShares}`);

        this.game.players.forEach(player => {
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
    }

    getData() {
        return this.game.players.map(p => {
            return {
                "id": p.id,
                "name": p.name,
                "profit": p.profit,
            }
        });
    }
    
    testComplete () {
        return this.complete;
    }
}

export default {
    create(game, wss) {
        return new Phase9(game, wss);
    }
}