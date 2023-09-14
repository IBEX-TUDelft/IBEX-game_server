import StartHandler from "../handlers/StartHandler.js";
import GamePhase from "./GamePhase.js";

import RandomService from "../../../services/randomService.js";
import { MARKET_GAME_ADMIN, MARKET_GAME_KNOWS_ALL, MARKET_GAME_PUB_SIG_ONLY } from "../MarketPlayer.js";

class WaitingPhase extends GamePhase {

    results = {
        publicSignal: null
    }

    constructor (game, wss) {
        super (game, wss, [new StartHandler()]);
    }

    testComplete () {
        return this.complete === true;
    }

    getData () {
        return this.game.players;
    }

    async onEnter() {
        await super.onEnter();

        this.results.publicSignal = this.game.publicSignal;
    }

    async onExit () {
        await super.onExit();

        this.game.players.filter(player => {
            player.role === MARKET_GAME_ADMIN ||
            player.role === MARKET_GAME_KNOWS_ALL ||
            player.role === MARKET_GAME_PUB_SIG_ONLY
        }).forEach(player => {
            this.wss.sendEvent(
                this.game.id,
                player.number,
                "public-signal",
            {
                "publicSignal": this.game.publicSignal
            }
            );
        });
    }
}

export default {
    create(game, wss) {
        return new WaitingPhase(game, wss, 0);
    }
}