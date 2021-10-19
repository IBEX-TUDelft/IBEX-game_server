import WS from '../../../helpers/websocket.js';
import Utils from '../../../helpers/utils.js';

export default {
    create(game, wss) {
        const phase = {
            game: game,
            wss: wss,
            complete: false,
            onEnter: async function () {
                console.log('PHASE 1');

                const self = this;

                for (let i = 0; i < this.game.players.length; i++) {
                    const player = this.game.players[i];

                    const err = self.wss.sendEvent(self.game.id, player.number, "assign-role", {
                        "role": player.role,
                        "balance": player.balance,
                        "shares": player.shares,
                        "property": player.property
                    });

                    if (err != null) {
                        console.error(err);
                    }
                }

                self.wss.broadcastInfo(self.game.id, 'Wait for the developers and the owners to become acquainted with their property', 1);
                self.wss.broadcastInfo(self.game.id, 'Get acquainted with your property, starting any project may be quite profitable for you', 2);
                self.wss.broadcastInfo(self.game.id, 'Get acquainted with your property, notice that if a project will start, its value will decrease', 3);

                setTimeout(() => {
                    self.complete = true;
                }, 15000);

                console.log(this.game.players);
            },
            onExit: async function () {
                
            },
            testComplete: async function () {
                return this.complete;
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
            },
            handlers: []
        }

        phase.init();

        return phase;
    }
}