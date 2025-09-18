import { UserMessage } from "../../../../generated/UserMessage.ts";
import { MessageHandler } from "../../messaging/MessageHandler.ts";
import MarketPhase from "../phases/MarketPhase.ts";

export default class EndHandler extends MessageHandler <UserMessage>{
    constructor() {
        super('end-game', [0], true);
    }

    async action (ws, message: UserMessage, player, phase: MarketPhase) {
        console.log(`Admin ${player.number} clicked End`);

        phase.complete = true;
    }
}