import JoinHandler from "./JoinHandler.js";
import Phase from "./Phase.js";

export default class JoinablePhase extends Phase {
    number;

    constructor (game, wss, handlers, instructions, number) {
        super(game, wss, handlers, instructions);

        this.number = number;

        this.handlers.push(new JoinHandler());
    }

    async onEnter () {
        super.onEnter();

        console.log(this.game.parameters);
        
        const timer = this.game.parameters[`timer_phase_${this.number}`];

        console.log(`Timer: ${timer}s type = ${typeof timer}`);

        if (timer != null && typeof timer === 'number' && timer > 0) {
            this.setTimer(timer * 1000, timer * 1000);
        }
    }
}