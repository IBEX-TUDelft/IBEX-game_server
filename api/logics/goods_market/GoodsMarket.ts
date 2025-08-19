import { GameOver, AppEvents } from "../../helpers/AppEvents.js";
import randomService from "../../services/randomService.js";
import Logic from "../Logic.js";
import WaitingPhase from '../market/phases/WaitingPhase.js';
import { GoodsMarketAuthority } from "./GoodsMarketAuthority.js";
import GoodsMarketPlayer from "./GoodsMarketPlayer.js";
import MarketPhase from "./phases/MarketPhase.js";
import ResultPhase from "./phases/ResultPhase.js";

/**
 * Expected game parameters for the goods market.
 * - `cash_per_player`: The initial cash each player receives.
 * - `bad_quality_ratio`: The probability of a good being of bad quality.
 * - `timer_phase_1`: The duration of the market phase in seconds.
 * - `title`: Game title.
 * - `player_max_number`: Maximum number of players in the game.
 * - `player_min_number`: Minimum number of players in the game.
 * - `use_bots`: Whether to use bots in the game.
 */
export default class GoodsMarket extends Logic {

    constructor(data, record) {
        super(data, [WaitingPhase, MarketPhase, ResultPhase], 'GoodsMarket', record);

        AppEvents.get(this.data.id).addListener(GameOver, () => {
            this.data.players.filter((p: GoodsMarketPlayer) => p.authority === GoodsMarketAuthority.ADMIN)
                .forEach((admin: GoodsMarketPlayer) => {
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
    getProfit(playerNumber: number, round: number) {
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

    getCurrentProfit(number: number) {
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
                movementList: [],
                orders: null,
                currentPrice: null,
                statistics: null,
                realValue: null
            },
            player: {},
            timer: null
        }

        const player: GoodsMarketPlayer = this.data.players.find(p => p.number === number);

        if (player != null) {
            data.player = {
                "number": player.number,
                "authority": player.authority,
                "recovery": player.recovery,
                "wallet": player.wallet,
                "profit": this.getCurrentProfit(number)
            };
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

            if (player.authority === GoodsMarketAuthority.ADMIN) {
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

    getStatistics() {
        const source = this.data.results.find(r => r.round === this.data.currentRound.number).phase[1];

        const statistics = {
        };

        if (source == null || source.log == null || source.log.length === 0) {
            return statistics;
        }

        const players = this.data.players;

        return statistics;
    }
}