import WaitToStartPhase from '../common/WaitToStartPhase.js';
import Phase1 from '../harberger/phases/1.js'
import Phase2 from '../harberger/phases/2.js'
import Phase3 from './phases/3.js';
import Phase4 from './phases/4.js';
import Phase5 from './phases/5.js';
import Phase6 from './phases/6.js';
import Phase7 from '../harberger/phases/7.js';
import Phase8 from '../harberger/phases/8.js';
import ShowResults from '../common/ShowResults.js';

import Logic from "../Logic.js";

export default class Futarchy extends Logic {
    constructor(data) {
        super(data, [WaitToStartPhase, Phase1, Phase2, Phase3, Phase4,
            Phase5, Phase6, Phase7, Phase8, ShowResults], 'Futarchy');
    }

    getExpectation(playerNumber, round) {
        return this.data.results.find(r => r.round === round)
            .phase[2].expectations.find(e => e.condition === this.data.winningCondition)
            .players.find(p => p.number === playerNumber).profit;
    }

    getProfit(playerNumber, round) {
        const playerData = this.data.players.find(p => p.number === playerNumber);

        const summary = playerData.summaries.find(s => s.round === round);

        if (summary == null) {
            console.warn(`Could not find summary of round ${round} for player ${playerNumber}`);
            return;
        }

        let total = 0;

        if (summary.value != null) {
            total += summary.value;
        }

        if (summary.firstTaxes != null) {
            total -= summary.firstTaxes;
        }

        if (summary.secondTaxes != null) {
            total -= summary.secondTaxes;
        }

        if (summary.firstRepurchase != null) {
            total += summary.firstRepurchase;
        }

        if (summary.secondRepurchase != null) {
            total += summary.secondRepurchase;
        }

        if (summary.market != null && summary.market.balance != null) {
            total += summary.market.balance;
        }

        if (
            summary.market != null &&
            summary.market.shares != null &&
            summary.market.price != null
        ) {
            total += summary.market.shares * summary.market.price;
        }

        return total;
    }

    getRecoveryData(number) {
        const self = this;

        const playerData = self.data.players.find(p => p.number === number);

        const players = self.data.players.map( p => {
            return {
                "number": p.number,
                "role": p.role,
                "tag": p.tag
            }
        });

        const game = {
            "ruleset": "Harberger",
            "id": self.data.id,
            "round": self.data.currentRound.number,
            "phase": self.data.currentRound.phase,
            "boundaries": self.data.boundaries,
            "conditions": self.data.conditions,
            "players": players,
            "taxRate": self.data.parameters.tax_rate_initial,
            "over": self.over
        }

        const player = this.getSummary(number);
        player.instructions = self.data.currentPhase.instructions[playerData.role - 1];

        if (playerData != null) {
            player.name = playerData.name;
            player.tag = playerData.tag;
            player.number = playerData.number;
            player.role = playerData.role;
            player.recovery = playerData.recovery;
            player.ready = playerData.ready;
            player.wallet = playerData.wallet;

            if (playerData.role === 1) {
                player.doneSpeculating = playerData.doneSpeculating;
            }

            if (playerData.property != null) {
                player.hasToDeclare = playerData.property.d == null;
                player.property = playerData.property;
            }
        }

        if (self.data.currentRound.phase > 2) {
            const declarationData = [];

            self.data.players.forEach(p => {
                if (p.role === 1) {
                    return;
                }

                const firstDeclaration = this.data.results.find(r => r.round === this.data.currentRound.number)
                    .phase[2].declarations.find(d => d.player === p.number).declaration;

                declarationData.push({
                    "id": p.property.id,
                    "name": p.property.name,
                    "owner": p.name,
                    "role": p.role,
                    "number": p.number,
                    "d": firstDeclaration
                });
            });

            game.declarations = declarationData;
        }

        if (self.data.currentRound.phase === 6) {
            player.signals = playerData.S;
            game.publicSignal = self.data.publicSignal;

            game.orders = self.data.currentPhase.orders;
            game.movementList = [];
            
            self.data.currentPhase.movementList.forEach((conditionList, condition) => {
                const simplifiedConditionList = [];

                const median = self.medianLastSeven(conditionList);

                conditionList.forEach(tx => {
                    simplifiedConditionList.push({
                        "from": tx.from.number,
                        "to": tx.to.number,
                        "price": tx.movement.price,
                        "condition": condition,
                        "median": median
                    });
                });

                game.movementList.push(simplifiedConditionList);
            });
        }

        if (self.data.currentRound.phase >= 6) {
            game.taxRate = self.data.parameters.tax_rate_final;
        }

        if (self.data.currentRound.phase > 6) {
            game.winningCondition = self.data.winningCondition;
        }

        let timer = null;

        if (self.data.currentPhase.timer.set === true) {
            timer = self.data.currentPhase.timer.visibleTimeout
        }

        player.summaries = this.getSummaries(number);
        
        if (self.over === true) {
            game.reward = self.data.rewards.find(r => r.number === number);
        }

        const data = {
            "game": game,
            "player": player,
            "timer": timer
        };

        console.log(data);

        return data;
    }

    getSummary(number) {
        const summary = {};

        summary.round = this.data.currentRound.number;

        if (this.data.winningCondition == null) {
            return summary;
        }

        const playerData = this.data.players.find(p => p.number === number);

        summary.condition = this.data.winningCondition;

        console.log(`Winning condition: ${summary.condition}`);

        if (playerData.role != 1) {
            summary.value = playerData.property.v[this.data.winningCondition];
            summary.firstDeclaration = this.data.results.find(r => r.round === this.data.currentRound.number)
                .phase[2].declarations.find(pd => pd.player === number).declaration[this.data.winningCondition];
            summary.firstTaxes = summary.firstDeclaration * this.data.parameters.tax_rate_initial / 100;
        }

        if (this.data.currentRound.phase > 6) {
            let outcomes;

            if (playerData.role === 1) {
                outcomes = this.data.results.find(r => r.round === this.data.currentRound.number)
                    .phase[6].snipeOutcomes.filter(so => so.player.number === number);

                summary.firstRepurchase = outcomes.map(o => o.profit).reduce((a, b) => a + b, 0);
                summary.snipes = outcomes;
            } else {
                outcomes = this.data.results.find(r => r.round === this.data.currentRound.number)
                    .phase[6].snipeOutcomes.filter(so => so.target.number === number);

                summary.firstRepurchase = outcomes.map(o => o.profit).reduce((a, b) => a - b, 0);
                summary.snipes = outcomes;
            }

            const playerWallets = this.data.results.find(r => r.round === this.data.currentRound.number)
                .phase[6].wallets.find(pw => pw.number === number);
            
            console.log('Player Wallets');
            console.log(playerWallets);

            const playerWallet = playerWallets.wallet[summary.condition];

            console.log(playerWallet);

            summary.market = {};

            summary.market.balance = playerWallet.balance;
            summary.market.shares = playerWallet.shares;

            if (playerData.role != 1 && playerData.property.d != null) {
                summary.secondDeclaration = playerData.property.d[this.data.winningCondition];
            }
        }

        if (this.data.currentRound.phase > 7) {
            if (playerData.role != 1) {
                summary.secondDeclaration = this.data.results.find(r => r.round === this.data.currentRound.number)
                    .phase[7].declarations.find(pd => pd.player === number).declaration[this.data.winningCondition];

                summary.secondTaxes = summary.secondDeclaration * this.data.parameters.tax_rate_final / 100;
            }
        }

        if (this.data.currentRound.phase > 8) {
            let outcomes;

            if (playerData.role === 1) {
                outcomes = this.data.results.find(r => r.round === this.data.currentRound.number)
                    .phase[8].snipeOutcomes.filter(so => so.player.number === number);

                summary.secondRepurchase = outcomes.map(o => o.profit).reduce((a, b) => a + b, 0);
                summary.snipes = outcomes;
            } else {
                outcomes = this.data.results.find(r => r.round === this.data.currentRound.number)
                    .phase[8].snipeOutcomes.filter(so => so.target.number === number);

                summary.secondRepurchase = outcomes.map(o => o.profit).reduce((a, b) => a - b, 0);
                summary.snipes = outcomes;
            }

            summary.market.price = this.data.results.find(r => r.round === this.data.currentRound.number)
                .phase[8].finalPrice;
        }

        return summary;
    }

    medianLastSeven(list) {
        const values = list.map(m => m.movement.price).slice(-7);

        if (values.length === 0) {
            return null;
        }

        values.sort(function(a,b){
            return a-b;
        });

        var half = Math.floor(values.length / 2);
  
        if (values.length % 2)
            return values[half];
        
        return (values[half - 1] + values[half]) / 2.0;
    }
}
