import { GameOver, AppEvents } from "../../helpers/AppEvents.js";
import randomService from "../../services/randomService.js";
import Logic from "../Logic.js";
import WaitingPhase from '../market/phases/WaitingPhase.js';
import { GoodsMarketAuthority } from "./model/GoodsMarketTypes.ts";
import GoodsMarketPlayer from "./model/GoodsMarketPlayer.ts";
import MarketPhase from "./phases/MarketPhase.ts";
import ResultPhase from "./phases/ResultPhase.ts";

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

        console.log(`Parameters: ${JSON.stringify(data.parameters)}`);

        AppEvents.get(this.data.id).addListener(GameOver, () => {
            console.log('The game is over, sending a market statistics update to all admins');
            this.data.players.filter((p: GoodsMarketPlayer) => p.authority === GoodsMarketAuthority.ADMIN)
                .forEach((admin: GoodsMarketPlayer) => {
                    console.log(`Sending statistics to admin ${admin.number}`);

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

    getRecoveryData(number: number) {
        const data = {
            game: {
                phase: this.data.currentRound.phase,
                ruleset: this.data.type,
                over: this.over,
                movementList: [],
                orders: null,
                currentPrice: null,
                statistics: null,
                tickers: null,
                realValues: {
                    highQuality: null,
                    lowQuality: null
                }
            },
            player: {},
            timer: null
        }

        const player: GoodsMarketPlayer = this.data.players.find((p: GoodsMarketPlayer) => p.number === number);

        if (player != null) {
            data.player = {
                "number": player.number,
                "authority": player.authority,
                "role": player.role,
                "recovery": player.recovery,
                "wallet": player.wallet,
                "profit": this.getCurrentProfit(number),
                "signals": player.signals,
                "initialWallet": player.initialWallet
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

            data.game.tickers = movementList.map((m: { movement: { price: number, time: number }}) => ({
                "price": m.movement.price,
                "time": m.movement.time
            }));
        }

        if (this.data.currentRound.phase > 1) {
            data.game.currentPrice = this.data.results.find(r => r.round === this.data.currentRound.number).phase[1].finalPrice;

            if (player.authority === GoodsMarketAuthority.ADMIN) {
                data.game.statistics = this.getStatistics();
            }

            data.game.tickers = this.data.results.find(r => r.round === this.data.currentRound.number).phase[1].transactions.map(t => ({
                time: t.time,
                price: t.price
            }));
        }

        if (this.data.currentPhase.timer.set === true) {
            data.timer = this.data.currentPhase.timer.visibleTimeout;
        }

        if (this.data.currentRound.phase === 2 || this.over === true) {
            data.game.realValues.highQuality = this.data.parameters.high_quality_value;
            data.game.realValues.lowQuality = this.data.parameters.low_quality_value;
        }

        return data;
    }

    getStatistics() {
        const source = this.data.results.find(r => r.round === this.data.currentRound.number).phase[1];

        if (source == null || source.log == null || source.log.length === 0) {
            return {};
        }

        const buyers = this.data.players.filter((p: GoodsMarketPlayer) => p.authority === GoodsMarketAuthority.BUYER).map((p: GoodsMarketPlayer) => {
            return {
                "number": p.number,
                "profit": this.getCurrentProfit(p.number)
            };
        });

        buyers.sort((a: { profit: number; }, b: { profit: number; }) => b.profit - a.profit);

        const sellers = this.data.players.filter((p: GoodsMarketPlayer) => p.authority === GoodsMarketAuthority.SELLER).map((p: GoodsMarketPlayer) => {
            return {
                "number": p.number,
                "profit": this.getCurrentProfit(p.number)
            };
        });

        sellers.sort((a: { profit: number; }, b: { profit: number; }) => b.profit - a.profit);

        return {
            buyers,
            sellers
        };
    }
}