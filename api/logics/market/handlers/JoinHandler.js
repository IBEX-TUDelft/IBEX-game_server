import WS from '../../../helpers/websocket.js';
import { MessageHandler } from "../../messaging/MessageHandler.ts";

export default class JoinHandler extends MessageHandler {
    constructor() {
        super('join', null, false);
    }

    action (ws, message, player, phase) {
        const game = phase.game;
        const wss = phase.wss;

        if (player == null) {
            WS.error(ws, 'Player not found');
            return;
        }

        wss.joinGame(ws, game.id, player.role, player.number);

        WS.sendEvent(ws, 'player-joined', {
            authority: player.authority,
            number: player.number,
            shares: player.shares,
            cash: player.cash,
            wallet: player.wallet,
            gameId: player.gameId,
            role: player.role
        })
    }
}