import WS from '../../../helpers/websocket.js';
import Utils from '../../../helpers/utils.js';

export default {
    create(game, wss) {
        const phase = {
            game: game,
            wss: wss,
            onEnter: async function () {
                console.log('PHASE 4');

                const self = this;

                self.wss.broadcastInfo(self.game.id, 'Reconciliation in progress ...');

                //TODO
                // 1. calculate D
                // 2. determine the winning condition
                // 3. resell lot under that condition
                // 4. transition to the next phase
            },
            onExit: async function () {
                this.game.player.filter(p => p.role === 1).forEach(p => { p.doneSpeculating = false; });
                this.game.properties.forEach(p => { p.speculators = null; });
            },
            testComplete: async function () {
                //return game.properties.find(p => p.d == null) == null; //true when all properties have a declaration
                return false;
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