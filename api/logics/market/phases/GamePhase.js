import JoinHandler from "../handlers/JoinHandler.js";
import { AppEvents, PlayerMessage, PhaseComplete } from "../../../helpers/AppEvents.js";
import WS from '../../../helpers/websocket.js';

export default class GamePhase {

    number;
    handlers = [];
    game = null;
    wss = null;
    complete = false;

    timer = {
        "set": false,
        "visibleTimeout": null,
        "realTimeout": null
    }

    constructor (game, wss, handlers) {
        this.game = game;
        this.wss = wss;
        this.number = game.currentRound.phase;

        this.handlers.push(new JoinHandler());

        if (handlers != null && handlers.length != 0) {
            this.handlers.push(...handlers);
        }
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

    async testComplete() {
    }

    getData () {

    }

    async onMessage(ws, message) {
        if (ws.player == null) {
            console.log(`Player not yet bound to the websocket. Trying by recovery: ${message.recovery}`);
            ws.player = this.game.players.find(p => p.recovery === message.recovery);
            
            if (ws.player == null) {
                console.log('Anonymous message');
            } else {
                console.log(`Player bound to the websocket: nr ${ws.player.number}`);
            }
        }

        const player = ws.player;
        
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
                WS.error(ws, `Game ${message.gameId}: only ${handler.role} can send this message in this phase. You are ${ws.player?.role}.`);
                return;
            }
        }

        if (player == null && handler.requiresAuthentication != false) {
            const errMessage = `Handler ${handler.type} requires authentication. Player ${ws.player?.number} not found in game ${message.gameId}`;
            console.error(errMessage);
            return WS.error(ws, errMessage);
        }

        let playerData = null;

        if (ws.player != null) {
            playerData = this.game.players.find(p => p.number === ws.player.number);
        }

        await handler.action(ws, message, playerData, this);

        this.updateAndTest();
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