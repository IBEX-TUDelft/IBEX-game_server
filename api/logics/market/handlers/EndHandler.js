import { MessageHandler } from "../../messaging/MessageHandler.ts";
import { MARKET_GAME_ADMIN } from '../MarketPlayer.js';

export default class EndHandler extends MessageHandler {
    constructor() {
        super('end-game', [MARKET_GAME_ADMIN], true);
    }

    async action (ws, message, player, phase) {
        console.log(`Admin ${player.number} clicked End`);

        phase.complete = true;
    }
}