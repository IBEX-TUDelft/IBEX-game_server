import WS from '../../../helpers/websocket.js';
import Phase from '../../Phase.js';

class Phase0 extends Phase {

    constructor (game, wss) {
        super (game, wss, [{
            "type": "join",
            "role": null,
            "action": function(ws, message) {
                console.log(`Assigned players: ${game.assignedPlayers}, Total players: ${game.parameters.total_players}`);

                if (game.assignedPlayers === game.parameters.total_players) {
                    WS.error(ws, `Game ${message.gameId} is full. You cannot join`);
                    return;
                }

                const player = game.players[game.assignedPlayers];

                game.assignedPlayers++;

                wss.joinGame(ws, game.id, player.role, player.number);

                console.log(player);

                WS.sendEvent(ws, "assign-name", {
                    "name" : player.name,
                    "number": player.number,
                    "recoveryString": player.recovery,
                    "ruleset": game.type
                });

                wss.broadcastInfo(game.id, `Player ${player.name} joined. We have now ${game.assignedPlayers} players in the game.`, null);
            }
        }]);
    }

    getPlayer () {
        return null;
    }

    testComplete () {
        return this.game.assignedPlayers === this.game.parameters.total_players;
    }

    getData () {
        return this.game.players;
    }
}

export default {
    create(game, wss) {
        return new Phase0(game, wss);
    }
}