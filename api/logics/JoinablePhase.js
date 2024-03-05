import JoinHandler from "./JoinHandler.js";
import Phase from "./Phase.js";
import { AppEvents } from '../helpers/AppEvents.js';

export default class JoinablePhase extends Phase {
    number;

    constructor (game, wss, handlers, instructions, number) {
        super(game, wss, handlers, instructions);

        this.number = number;

        this.handlers.push(new JoinHandler());
    }

    async onEnter () {
        super.onEnter();
        
        const timer = this.game.parameters[`timer_phase_${this.number}`];

        if (timer != null && typeof timer === 'number' && timer > 0) {
            this.setTimer(timer * 1000, timer * 1000);
            AppEvents.get(this.game.id).phaseTimeout(timer * 1000, {
                "phase": this.number,
                "round": this.game.currentRound.number
            });
        }
    }
}