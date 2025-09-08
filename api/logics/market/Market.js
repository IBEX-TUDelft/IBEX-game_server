import { GameOver, AppEvents } from "../../helpers/AppEvents.js";
import randomService from "../../services/randomService.js";
import Logic from "../Logic.js";
import { MARKET_GAME_ADMIN, MARKET_GAME_KNOWS_ALL, MARKET_GAME_PRIV_SIG_ONLY, MARKET_GAME_PUB_SIG_ONLY } from "./MarketPlayer.js";
import MarketPhase from "./phases/MarketPhase.js";
import ResultPhase from "./phases/ResultPhase.js";
import WaitingPhase from './phases/WaitingPhase.js';

export default class Market extends Logic {

    constructor(data, record,dataSource = null) {
        super(data, [WaitingPhase, MarketPhase, ResultPhase], 'Market', record);

        this.data.realValue = this.generateRealValue(dataSource, 'realValue');

        this.data.publicSignal = this.generateSignal(dataSource, 'publicSignal');

        console.log(`Market real value: ${this.data.realValue}`);

        AppEvents.get(this.data.id).addListener(GameOver, () => {
            this.data.players.filter(p => p.role === MARKET_GAME_ADMIN).forEach(admin => {
                this.wss.sendEvent(
                    this.data.id,
                    admin.number,
                    "market-statistics",
                    this.getStatistics()
                );
            });
        });
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

            if (player.role === MARKET_GAME_ADMIN) {
                data.game.statistics = this.getStatistics();
            }
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

    generateRealValue(dataSource = null, tag = null) {
        if (this.data.parameters.distribution_type === 'linear') {
            const value = randomService.getLinearWithDataSource(
                this.data.parameters.linear_min,
                this.data.parameters.linear_max,
                dataSource,
                tag
            );

            return Math.round(value * 100) / 100;
        } else if (this.data.parameters.distribution_type === 'normal') {
            const value = randomService.getNormalWithDataSource(
                this.data.parameters.mean,
                this.data.parameters.variance,
                dataSource,
                tag
            );

            return Math.round(value * 100) / 100;
        } else {
            throw new Error(`Expecting distribution type as linear or normal, but was ${this.data.parameters.distribution_type}`);
        }
    }

    generateSignal(dataSource = null, tag = null) {
        return randomService.getLinearWithDataSource(
            this.data.realValue - this.data.parameters.signal_error,
            this.data.realValue + this.data.parameters.signal_error,
            dataSource,
            tag
        );
    }

    getStatistics() {
        const source = this.data.results.find(r => r.round === this.data.currentRound.number).phase[1];

        const statistics = {
            "buyers": {
                "count": [0, 0, 0, 0, 0],
                "averagePrivateSignal": 0
            },
            "sellers":  {
                "count": [0, 0, 0, 0, 0],
                "averagePrivateSignal": 0
            }
        };

        if (source == null || source.log == null || source.log.length === 0) {
            return statistics;
        }

        const players = this.data.players;

        const buyers = [];
        const sellers = [];

        source.log.filter(l => ['Sell', 'Buy'].includes(l.action)).forEach(l => {
            const buyer = players.find(p => p.number === l.buyer.number);
            const seller = players.find(p => p.number === l.seller.number);

            if (buyers.find(b => b.number === buyer.number) == null) {
                buyers.push(buyer);
            }

            statistics.buyers.count[buyer.role] ++;

            if (sellers.find(s => s.number === seller.number) == null) {
                sellers.push(seller);
            }

            statistics.sellers.count[seller.role] ++;
        });

        const buyersWithPrivateSignal = buyers
            .filter(b => b.role != MARKET_GAME_ADMIN)
            .filter(b => b.signal != null);

        const avgBuyersPvtSignal = buyersWithPrivateSignal
            .map(b => b.signal)
            .reduce((a,n) => {return a + n}, 0) / buyersWithPrivateSignal.length;

        const sellersWithPrivateSignal = sellers
            .filter(b => b.role != MARKET_GAME_ADMIN)
            .filter(b => b.signal != null);

        const avgSellersPvtSignal = sellersWithPrivateSignal
            .map(b => b.signal)
            .reduce((a,n) => {return a + n}, 0) / sellersWithPrivateSignal.length;

        statistics.buyers.averagePrivateSignal = Math.round(avgBuyersPvtSignal * 100) / 100;
        statistics.sellers.averagePrivateSignal = Math.round(avgSellersPvtSignal * 100) / 100;

        return statistics;
    }
}