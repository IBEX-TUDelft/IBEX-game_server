import WS from '../helpers/websocket.js';
import MessageHandler from "./MessageHandler.js";

export default class JoinHandler extends MessageHandler {
    constructor() {
        super('join', null, false);
    }

    action (ws, message, p, phase) {
        console.log('CALLING JOIN HANDLER');
        const game = phase.game;
        const wss = phase.wss;

        console.log(`Assigned players: ${game.assignedPlayers}, Total players: ${game.parameters.total_players}`);

        console.log(`Player recovery ID: ${message.recovery}`);
        console.log("players", game.players.map(p => { return { "number": p.number, "recovery": p.recovery }; }));
        let player = game.players.find(p => p.recovery === message.recovery);

        let responseMessage;

        if (player == null) {
            if (game.assignedPlayers === game.parameters.total_players) {
                WS.error(ws, `Game ${message.gameId} is full (and no current player matching your recovery string). You cannot join`);
                return;
            }

            player = game.players[game.assignedPlayers];
            player.recovery = message.recovery;
            player.ready = false;

            game.assignedPlayers++;

            responseMessage = `Player ${player.name} joined. We have now ${game.assignedPlayers} players in the game.`
        } else {
            responseMessage = `Player ${player.number} rejoined the game`;
        }

        console.log(responseMessage)

        wss.joinGame(ws, game.id, player.role, player.number);

        /*WS.sendEvent(ws, "assign-name", {
            "name" : player.name,
            "number": player.number,
            "ruleset": game.type
        });

        console.log(`PHASE NUMBER ${phase.number}`);

        if (phase.number === 0) {
            const err = wss.sendEvent (
                game.id,
                player.number,
                "phase-instructions",
                {
                    "instructions": phase.instructions[1]
                },
            );

            if (err) {
                console.error(err);
            }
        }*/

        wss.broadcastInfo(game.id, responseMessage, null);
    }
}