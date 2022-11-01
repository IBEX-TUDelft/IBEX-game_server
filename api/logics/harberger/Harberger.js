import fs from 'fs';

import WaitToStartPhase from '../common/WaitToStartPhase.js';
import Phase1 from './phases/1.js';
import Phase2 from './phases/2.js';
import Phase3 from './phases/3.js';
import Phase4 from './phases/4.js'
import Phase5 from './phases/5.js';
import Phase6 from './phases/6.js';
import Phase7 from './phases/7.js';
import Phase8 from './phases/8.js';
import ShowResults from '../common/ShowResults.js';

import Logic from "../Logic.js";

export default class Harberger extends Logic {
    constructor(data) {
        super(data, [WaitToStartPhase, Phase1, Phase2, Phase3, Phase4,
            Phase5, Phase6, Phase7, Phase8, ShowResults], 'Harberger');

        const rawDictionary = fs.readFileSync('./resources/harberger.json');

        data.dictionary = JSON.parse(rawDictionary);
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

        console.log('PLAYER FROM GET SUMMARY');
        console.log(player);

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

                declarationData.push({
                    "id": p.property.id,
                    "name": p.property.name,
                    "owner": p.name,
                    "role": p.role,
                    "number": p.number,
                    "d": p.property.d
                });

                if (declarationData.d == null) {
                    if (player.secondDeclaration != null) {
                        declarationData.d = player.secondDeclaration;    
                    } else {
                        declarationData.d = player.firstDeclaration;
                    }
                }
            });

            game.declarations = declarationData;
            game.winningCondition = self.data.winningCondition;
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

        if (self.data.currentRound.phase > 4) {
            game.taxRate = self.data.parameters.tax_rate_final;
        }

        let timer = null;

        if (self.data.currentPhase.timer.set === true) {
            timer = self.data.currentPhase.timer.visibleTimeout
        }

        player.summaries = this.getSummaries(number);
        
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

        if (this.data.currentRound.phase <= 2) {
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


        if (this.data.currentRound.phase > 4) {
            let outcomes;

            if (playerData.role === 1) {
                outcomes = this.data.results.find(r => r.round === this.data.currentRound.number)
                    .phase[4].snipeOutcomes.filter(so => so.player.number === number);

                summary.firstRepurchase = outcomes.map(o => o.profit).reduce((a, b) => a + b, 0);
                summary.snipes = outcomes;
            } else {
                outcomes = this.data.results.find(r => r.round === this.data.currentRound.number)
                    .phase[4].snipeOutcomes.filter(so => so.target.number === number);

                summary.firstRepurchase = outcomes.map(o => o.profit).reduce((a, b) => a - b, 0);
                summary.snipes = outcomes;
            }
        }

        if (this.data.currentRound.phase > 6) {
            const playerWallets = this.data.results.find(r => r.round === this.data.currentRound.number)
                .phase[6].wallets.find(pw => pw.number === number);
            
            console.log('Player Wallets');
            console.log(playerWallets);

            const playerWallet = playerWallets.wallet[summary.condition];

            console.log(playerWallet);

            summary.market = {};

            summary.market.balance = playerWallet.balance;
            summary.market.shares = playerWallet.shares;
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