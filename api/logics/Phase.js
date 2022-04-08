import WS from '../helpers/websocket.js';
import Utils from '../helpers/utils.js';

export default class Phase {
    handlers = [];
    game = null;
    wss = null;
    instructions = [];

    constructor (game, wss, handlers, instructions) {
        this.game = game;
        this.wss = wss;

        if (handlers != null && handlers.length != 0) {
            this.handlers.push(...handlers);
        }

        if (instructions != null && instructions.length > 0) {
            if (instructions.length === 1) {
                this.instructions.push(instructions[0], instructions[0], instructions[0]); //Same for all roles
            } else if (instructions.length === 3) {
                this.instructions.push(...instructions);
            } else {
                throw new Error(`You can provide one instruction (same for all) or 3, no other amounts. It was: ${instructions.length}, ${instructions}`);
            }
        }

        console.log(this.handlers);
    }

    async onEnter() {
        const self = this;

        if (this.instructions.length > 0) {
            for (let i = 0; i < 3; i++) {
                const err = this.wss.broadcastEvent (
                    self.game.id,
                    "phase-instructions",
                    {
                        "instructions": this.instructions[i]
                    },
                    i + 1 //role
                );

                if (err != null) {
                    console.error(err);
                }
            }
        }
    }

    async onExit() {
        
    }

    async testComplete() {

    }

    getData () {

    }

    getPlayer(ws, message) {
        const player = this.game.players.find(p => p.number === ws.player.number);

        if (player == null) {
            throw new Error(ws, `Game ${message.gameId}: player ${ws.player.number} not found`);
        }

        return player;
    }

    async onMessage(ws, message) {
        console.log(this.handlers);

        const handler = this.handlers.find(m => m.type === message.type);

        if (handler == null) {
            WS.error(ws, `Game ${message.gameId}: could not find an handler for ${message.type}`);
            return;
        }

        if (handler.role != null) {
            if ((Array.isArray(handler.role) && !handler.role.includes(ws.player.role)) && handler.role != ws.player.role) {
                WS.error(ws, `Game ${message.gameId}: only ${handler.role} can send this message in this phase. You are ${ws.player.role}.`);
                return;
            }
            
            if (handler.role === 0) {
                const verification = Utils.verifyJWT(message.token);

                if (verification == null || verification.role != 0)  {
                    WS.error(ws, 'Could not verify your token');
                    return;
                }
            }
        }

        let player;

        try {
            player = this.getPlayer(ws, message);
            console.log(player);
        } catch (err) {
            console.err(err);
            WS.error(ws, err.message);
        }

        await handler.action(ws, message, player, this);

        return await this.testComplete();
    }
}
