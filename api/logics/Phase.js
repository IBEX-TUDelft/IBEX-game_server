import WS from '../helpers/websocket.js';
import Utils from '../helpers/utils.js';
import { AppEvents, PhaseComplete, PlayerMessage } from '../helpers/AppEvents.js';

export default class Phase {
    number;
    handlers = [];
    game = null;
    wss = null;
    instructions = [];
    complete = false;

    phasePlayers = [];

    timer = {
        "set": false,
        "visibleTimeout": null,
        "realTimeout": null
    }

    constructor (game, wss, handlers, instructions) {
        this.game = game;
        this.wss = wss;
        this.number = game.currentRound.phase;

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

        this.phasePlayers.push(...this.game.players.map(p => {
            return {
                "number": p.number
            };
        }));
    }

    async onEnter() {
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

    async updateAndTest() {
        const complete = await this.testComplete();

        if (complete) {
            AppEvents.get(this.game.id).emit(PhaseComplete, {
                "phase": this.game.currentRound.phase,
                "round": this.game.currentRound.round
            });
        }
    }

    /**
     * @returns {Promise<boolean>}
     */
    async testComplete() {
        return this.complete;
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
        let player = this.getPlayer(ws, message);

        AppEvents.get(this.game.id).emit(PlayerMessage, {
            "content": message,
            "number": player?.number,
            "tag": player?.tag,
            "phase": this.game.currentRound.phase,
            "round": this.game.currentRound.number,
            "type": "message"
        });

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

        if (player == null && handler.requiresAuthentication != false) {
            const errMessage = `Handler ${handler.type} requires authentication. Player ${ws.player == null ? 'unknown' : ws.player.number} not found in game ${message.gameId}`;
            console.error(errMessage);
            return WS.error(ws, errMessage);
        }

        await handler.action(ws, message, player, this);

        this.updateAndTest();

        return false;
    }

    setTimer(visibleTimeout, realTimeout) {
        const self = this;

        this.timer.set = true;

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
