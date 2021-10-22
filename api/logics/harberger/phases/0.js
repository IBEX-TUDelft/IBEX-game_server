import WS from '../../../helpers/websocket.js';
import Utils from '../../../helpers/utils.js';

export default {
    create(game, wss) {
        const phase = {
            game: game,
            wss: wss,
            onEnter: async function () {
                console.log('PHASE 0');

                console.log(this.game.players);
            },
            onExit: async function () {
                
            },
            testComplete: async function () {
                return this.game.assignedPlayers === this.game.parameters.total_players;
            },
            onMessage: async function(ws, message) {
                const handler = this.handlers.find(m => m.type === message.type);

                if (handler == null) {
                    WS.error(ws, `Game ${message.gameId} is full. You cannot join`);
                    return;
                }

                if (handler.role != null) {
                    if (handler.role != ws.player.role) {
                        WS.error(ws, `Game ${message.gameId}: only ${handler.role} can send this message in this phase. You are ${ws.player.role}.`);
                        return;
                    } if (handler.role === 0) {
                        const verification = Utils.verifyJWT(message.token);
    
                        if (verification == null || verification.role != 0)  {
                            WS.error(ws, 'Could not verify your token');
                            return;
                        }
                    }
                }

                await handler.action(ws, message);

                return await this.testComplete();
            },
            init: function () {
                const self = this;

                this.handlers.push({
                    "type": "join",
                    "role": null,
                    "action": function(ws, message) {
                        if (self.game.assignedPlayers === self.game.parameters.total_players) {
                            WS.error(ws, `Game ${message.gameId} is full. You cannot join`);
                            return;
                        }

                        const player = self.game.players[self.game.assignedPlayers];

                        self.game.assignedPlayers++;

                        self.wss.joinGame(ws, game.id, player.role, player.number);

                        console.log(player);

                        WS.sendEvent(ws, "assign-name", {
                            "name" : player.name,
                            "number": player.number,
                            "recoveryString": player.recovery,
                            "ruleset": self.game.type
                        });

                        self.wss.broadcastInfo(game.id, `Player ${player.name} joined. We have now ${self.game.assignedPlayers} players in the game.`, null);
                    }
                });
            },
            handlers: []
        }

        phase.init();

        return phase;
    }
}