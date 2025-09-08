import fs from "fs";
import GameManagement from '../services/gameManager.js';
import gameService from '../services/gameService.js';
import { AppEvents, PhaseBegins, PhaseComplete } from "../helpers/AppEvents.js";
import { MarketService } from "../services/MarketService.ts";
import Market from "../logics/market/Market.js";
import { GoodsMarket } from "../logics/goods_market/GoodsMarket.ts";
import { GoodsMarketService } from "../services/GoodsMarketService.ts";
import WssManagement from '../services/wssGameService.js';
import { EventEmitter } from "stream";

export const SimulationService = {
    wssManager: null,
    gameManager: null,

    init() {
        this.wssManager = WssManagement.create();
        this.gameManager = GameManagement.create();
        this.wssManager.init(this.gameManager);
        this.gameManager.init(this.wssManager);
    },
    async kill() {
        await this.wssManager.shutdown();
        this.gameManager = null;
        this.wssManager = null;
    },
    async run(name: string, title: string, dataSource: any) {
        console.log(`Gonna play ${name} as ${title}`);

        console.log(`Reading dataset ${name} ...`);

        const raw = fs.readFileSync(`../records/${name}`);

        console.log(`Done. Parsing its content ...`);

        const dataset = JSON.parse(raw.toString());

        const gameId = await this.createLoaded(dataset, name, title);

        return this.runLoaded(dataset, name, gameId, dataSource);
    },

    async createLoaded(dataset: any, name: string, title: string) {
        if (dataset == null) {
            throw new Error(`Simulation dataset ${name} is empty`)
        }

        console.log(`Done. Creating the game ...`);

        return  await gameService.createForDataset(dataset, title);
    },

    async runLoaded(dataset: any, name: string, gameId: number, dataSource: any) {
        if (dataset == null) {
            throw new Error(`Simulation dataset ${name} is empty`)
        }

        console.log(`Done. Starting the game ...`);

        const error = await this.gameManager.startGame(gameId, false, dataSource);

        console.log(`Done: game started`);

        if (error != null) {
            throw new Error(`Could not run simulation dataset ${name}: ${error}`);
        }

        const game = this.gameManager.games.find(g => g.data.id === gameId);

        if (game == null) {
            throw (`Could not find ${gameId} in the game manager`);
        } else {
            console.log(`Found game ${gameId} in the game manager. Players: ${game.data.players.map(p => p.name).join(", ")}`);
        }

        const emitter: EventEmitter = AppEvents.get(gameId);

        let j = 0;

        function gameIsAhead(gameRound, event) {
            if (gameRound.number < event.round) {
                return false;
            }

            if (gameRound.number > event.round) {
                return true;
            }

            return gameRound.phase > event.phase;
        }

        function gameIsBehind(gameRound, event) {
            if (gameRound.number < event.round) {
                return true;
            }

            if (gameRound.number > event.round) {
                return false;
            }

            return gameRound.phase < event.phase;
        }

        console.log(`Starting to play events ...`);

        while (j < dataset.log.length) {
            const event = dataset.log[j];

            if (gameIsAhead(game.data.currentRound, event)) {
                console.error(`Out of sync, event behind. Event = ${event.round}:${event.phase}, game = ${game.data.currentRound.number}:${game.data.currentRound.phase}`);
                console.error(event);
                break;
            }

            if (gameIsBehind(game.data.currentRound, event)) {
                console.log(`Event for ${event.round}:${event.phase}, waiting for the game (${game.data.currentRound.number}:${game.data.currentRound.phase}) to move to that phase`);

                await new Promise<void>(resolve => {
                    const listener = ({ phase, round }) => {
                        console.log(`Game moved to phase ${round}:${phase}`);

                        if (!gameIsBehind(game.data.currentRound, event)) {
                            emitter.removeListener(PhaseBegins, listener);
                            resolve();
                        } else {
                            console.log(`Waiting for ${event.round}:${event.phase},but still in (${game.data.currentRound.number}:${game.data.currentRound.phase}). Exiting ...`);
                        }
                    };

                    emitter.addListener(PhaseBegins, listener)
                });
            }

            if (event.content != null) {
                event.content.gameId = gameId;
            }

            console.log(`Playing event ${j}: ${event.type}/${event.content?.type} for phase ${event.phase} in phase ${game.data.currentRound.phase}`);

            if (event.type === "phase-timeout") {

                emitter.emit(PhaseComplete, { //TODO not consistent with similar events, having phase and round instead of number
                    "number": event.phase
                });

                j++;

                continue;
            }

            let player;

            if (event.content?.type === "join") {
                if (game instanceof Market && game.data.parameters.game_type === "market") {
                    player = await MarketService.join(gameId, null, event.content?.recovery,  dataSource);
                } else if (game instanceof GoodsMarket && game.data.parameters.game_type === "goods-market") {
                    player = await GoodsMarketService.join(gameId, null, event.content?.recovery, dataSource);
                }

                if (player != null && event.number != null) {
                    player.number = event.number;
                }
            }

            let ws = {
                "send": function () { },
                "player": null
            };

            if (player == null && event.number != null) {
                player = game.data.players.find(p => p.number === event.number);
            }

            if (player == null) {
                if (["market", "goods-market"].includes(game.data.parameters.game_type)) {
                    console.log(event);
                    console.log(game.data.players.map(p => p.number));
                    throw new Error(`Player ${event.number} not found`);
                }
            }

            if (
                (event.content?.type === "start-game" || event.content?.type === "end-game") &&
                (game.data.parameters.game_type === "market" || game.data.parameters.game_type === "goods-market")
            ) {
                player.role = 0;
            }

            if (event.number != null && player != null) {
                ws.player = {
                    "number": event.number,
                    "role": player.role
                }
            }

            await this.gameManager.handleMessage(ws, event.content);

            j++;
        }

        console.log(`Simulation of ${name} completed.`);

        return game;
    }
}