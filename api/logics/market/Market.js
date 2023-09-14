import randomService from "../../services/randomService.js";
import Logic from "../Logic.js";
import { MARKET_GAME_ADMIN, MARKET_GAME_KNOWS_ALL, MARKET_GAME_PRIV_SIG_ONLY, MARKET_GAME_PUB_SIG_ONLY } from "./MarketPlayer.js";
import MarketPhase from "./phases/MarketPhase.js";
import ResultPhase from "./phases/ResultPhase.js";
import WaitingPhase from './phases/WaitingPhase.js';

export default class Market extends Logic {

    constructor(data, record) {
        super(data, [WaitingPhase, MarketPhase, ResultPhase], 'Market', record);

        this.data.realValue = this.generateRealValue();

        this.data.publicSignal = this.generateSignal();

        console.log(`Market real value: ${this.data.realValue}`);
    }
    
    //Always overwritten
    getProfit(playerNumber, round) {
        if (this.data == null || this.data.results == null || this.data.results.length < round + 1) {
            return 0;
        }

        const roundObj = this.data.results[round];

        if (roundObj == null || roundObj.phase == null || roundObj.phase.length === 0) {
            return 0;
        }

        const resultPhase = roundObj.phase[roundObj.phase.length - 1];

        if (resultPhase.profits == null) {
            return 0;
        }

        const profitReport = resultPhase.profits.find(p => p.number === playerNumber);

        if (profitReport == null) {
            return 0;
        }

        return profitReport.profit;
    }

    getCurrentProfit(number) {
        if (this.data.currentRound.phase != 2) {
            return 0;
        }

        const resultPhase = this.data.currentPhase;

        if (resultPhase.results.profits == null) {
            return 0;
        }

        const profitReport = resultPhase.results.profits.find(p => p.number === number);

        if (profitReport == null) {
            return 0;
        }

        return profitReport.profit;
    }

    getExpectation(playerNumber, round) {
        return 0; //TODO
    }

    getRecoveryData(number) {
        const data = {
            game: {
                phase: this.data.currentRound.phase,
                ruleset: this.data.type,
                over: this.over,
                movementList: []
            }
        }

        const player = this.data.players.find(p => p.number === number);

        if (player != null) {
            data.player = {
                "number": player.number,
                "role": player.role,
                "signal": player.signal,
                "recovery": player.recovery,
                "wallet": player.wallet,
                "authority": player.authority,
                "profit": this.getCurrentProfit(number)
            }

            if (
                player.role === MARKET_GAME_ADMIN ||
                player.role === MARKET_GAME_KNOWS_ALL ||
                player.role === MARKET_GAME_PUB_SIG_ONLY
            ) {
                data.game.publicSignal = this.data.publicSignal;
            }
        }

        if (this.data.currentRound.phase === 1) {
            data.game.orders = this.data.currentPhase.orders;

            const movementList = this.data.currentPhase.movementList;

            movementList.forEach(tx => {
                data.game.movementList.push({
                    "from": tx.from.number,
                    "to": tx.to.number,
                    "price": tx.movement.price
                });
            });

            if (movementList.length > 0) {
                data.game.currentPrice = movementList[movementList.length - 1].movement.price;
            }
        }

        if (this.data.currentRound.phase > 1) {
            data.game.currentPrice = this.data.results.find(r => r.round === this.data.currentRound.number).phase[1].finalPrice;
        }

        if (this.data.currentPhase.timer.set === true) {
            data.timer = this.data.currentPhase.timer.visibleTimeout;
        }

        if (this.data.currentRound.phase === 2 || this.over === true) {
            data.game.realValue = this.data.realValue;
        }

        return data;
    }

    getRandomlyKnowsPrivateSignal() {
        const threshold = this.data.parameters.players_knowing_private_signal;

        if (this.data.players.filter(p => p.role != MARKET_GAME_ADMIN).length === 0) {
            return Math.random() * 100 > 100 - threshold;
        }

        const peopleKnowing = this.data.players.filter(p => p.role === MARKET_GAME_KNOWS_ALL || p.role === MARKET_GAME_PRIV_SIG_ONLY).length;

        /** What happens if I say a new player knowns the private signal?
         *  Does the ratio gets closer to or further from the threshold?
         *  I want it to be as close as possible
         */
        const ratioIfNewPlayerKnows = ( peopleKnowing + 1 ) / (this.data.players.length + 1) * 100;
        const ratioIfNewPlayerDoesnt = ( peopleKnowing ) / (this.data.players.length + 1) * 100;

        if (Math.abs(threshold - ratioIfNewPlayerKnows) < Math.abs(threshold - ratioIfNewPlayerDoesnt)) {
            return true;
        } else {
            return false;
        }
    }

    getRandomlyKnowsPublicSignal() {
        const threshold = this.data.parameters.players_knowing_public_signal;

        if (this.data.players.filter(p => p.role != MARKET_GAME_ADMIN).length === 0) {
            return Math.random() * 100 > 100 - threshold;
        }

        const peopleKnowing = this.data.players.filter(p => p.role === MARKET_GAME_KNOWS_ALL || p.role === MARKET_GAME_PUB_SIG_ONLY).length;

        /** What happens if I say a new player knowns the private signal?
         *  Does the ratio gets closer to or further from the threshold?
         *  I want it to be as close as possible
         */
        const ratioIfNewPlayerKnows = ( peopleKnowing + 1 ) / (this.data.players.length + 1) * 100;
        const ratioIfNewPlayerDoesnt = ( peopleKnowing ) / (this.data.players.length + 1) * 100;

        if (Math.abs(threshold - ratioIfNewPlayerKnows) < Math.abs(threshold - ratioIfNewPlayerDoesnt)) {
            return true;
        } else {
            return false;
        }
    }

    generateRealValue() {
        if (this.data.parameters.distribution_type === 'linear') {
            const value = randomService.getLinearlyDistributedNumber(
                this.data.parameters.linear_min,
                this.data.parameters.linear_max
            );

            return Math.round(value * 100) / 100;
        } else if (this.data.parameters.distribution_type === 'normal') {
            const value = randomService.getNormallyDistributedRandomNumber(
                this.data.parameters.mean,
                this.data.parameters.variance
            );

            return Math.round(value * 100) / 100;
        } else {
            throw new Error(`Expecting distribution type as linear or normal, but was ${this.data.parameters.distribution_type}`);
        }
    }

    generateSignal() {
        const absPercentageError = this.data.parameters.signal_error; //e.g.: 5

        const percentageError = absPercentageError * ( 1 - Math.random() * 2 ); //given absPercentageError = 5, a range from -5 to 5

        return Math.round( ( 100 + percentageError ) * this.data.realValue) / 100 ;
    }
}