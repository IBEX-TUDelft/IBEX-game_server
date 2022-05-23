import WS from '../helpers/websocket.js';
import Utils from '../helpers/utils.js';

export default class Phase {
    handlers = [];
    game = null;
    wss = null;
    instructions = [];

    timer = {
        "set": false,
        "visibleTimeout": null,
        "realTimeout": null
    }

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
        if (this.timer.set === true) {
            const err = this.wss.broadcastEvent(
                this.game.id,
                "reset-timer",
                {}
            );
    
            if (err != null) {
                console.log(err);
            }
        }
    }

    async testComplete() {

    }

    getData () {

    }

    getPlayer(ws, message) {
        if (ws.player != null) {
            return this.game.players.find(p => p.number === ws.player.number);
        } else {
            return null;
        }
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

        let player = this.getPlayer(ws, message);

        if (player == null && handler.requiresAuthentication != false) {
            const errMessage = `Handler ${handler.type} requires authentication. Player ${ws.player.number} not found in game ${message.gameId}`;
            console.error(errMessage);
            return WS.error(ws, errMessage);
        }

        await handler.action(ws, message, player, this);

        return await this.testComplete();
    }

    setTimer(visibleTimeout, realTimeout) {
        const self = this;

        this.timer.set = true;

        setTimeout(() => {
            self.complete = true;
        }, realTimeout );

        this.timer.visibleTimeout = Date.now() + visibleTimeout;
        this.timer.realTimeout = Date.now() + realTimeout;

        const err = self.wss.broadcastEvent(
            self.game.id,
            "set-timer",
            {
                "end": self.timer.visibleTimeout
            }
        );

        if (err != null) {
            console.log(err);
        }
    }
}
