import MessageHandler from "../../MessageHandler.js";
import { MARKET_GAME_ADMIN } from '../MarketPlayer.js';

export default class StartHandler extends MessageHandler {
    constructor() {
        super('start-game', [MARKET_GAME_ADMIN], true);
    }

    async action (ws, message, player, phase) {
        console.log(`Admin ${player.number} clicked Start`);

        phase.complete = true;
    }
}