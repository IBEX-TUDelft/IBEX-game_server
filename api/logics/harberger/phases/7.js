import WS from '../../../helpers/websocket.js';
import Utils from '../../../helpers/utils.js';

export default {
    create(game, wss) {
        const phase = {
            game: game,
            wss: wss,
            onEnter: async function () {
                console.log('PHASE 7');

                const self = this;

                
                self.wss.broadcastInfo(self.game.id, 'Wait for the developers and the owners to declare their property public values', 1);
                self.wss.broadcastInfo(self.game.id, 'Declare the values you assign to your property under each condition', 2);
                self.wss.broadcastInfo(self.game.id, 'Declare the values you assign to your property under each condition', 3);

                this.game.properties.forEach(p => {
                    p.d = null;
                });
            },
            onExit: async function () {
                
            },
            testComplete: async function () {
                return this.game.properties.find(p => p.d == null) == null; //true when all properties have a declaration
            },
            getData() {
                return game.properties.map(p => {
                    return {
                        "id": p.id,
                        "name": p.name,
                        "declarations": p.d,
                    }
                });
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
                const self = this;

                this.handlers.push({
                    "type": "declare",
                    "role": [2,3],
                    "action": function(ws, message) {
                        const player = self.game.players.find(p => p.number === ws.player.number);

                        if (player == null) {
                            WS.error(ws, `Game ${message.gameId}: player ${ws.player.number} not found`);
                            return;
                        }

                        console.log(`New Declaration from ${player.name}`);
                        
                        player.property.d = message.declaration;

                        self.wss.broadcastInfo(game.id, `Player ${player.name} submitted a declaration of values.`, null);
                    }
                });
            },
            handlers: []
        }

        phase.init();

        return phase;
    }
}