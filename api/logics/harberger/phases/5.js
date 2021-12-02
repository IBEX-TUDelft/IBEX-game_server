import WS from '../../../helpers/websocket.js';
import Utils from '../../../helpers/utils.js';

export default {
    create(game, wss) {
        const phase = {
            game: game,
            wss: wss,
            complete: false,
            onEnter: async function () {
                console.log('PHASE 5');

                const self = this;

                this.game.players.forEach(player => {
                    self.wss.sendEvent(
                        self.game.id,
                        player.number,
                        "value-signals",
                        {
                            "signals": player.S,
                            "condition": self.game.winningCondition,
                            "taxRate": self.game.parameters.tax_rate_final
                        }
                    );
                });

                self.wss.broadcastInfo(self.game.id, `Prepare for the trading phase`);

                setTimeout(() => {
                    self.complete = true;
                }, 5000);
            },
            getData() {
                return {};
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
                    if (!handler.role.includes(ws.player.role)) {
                        WS.error(ws, `Game ${message.gameId}: only ${handler.role} can send this message in this phase. You are ${ws.player.role}.`);
                        return;
                    }
                    
                    if (ws.player.role === 0) {
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