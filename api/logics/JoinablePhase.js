import JoinHandler from "./JoinHandler.js";
import Phase from "./Phase.js";

export default class JoinablePhase extends Phase {
    constructor (game, wss, handlers, instructions) {
        super(game, wss, handlers, instructions);

        this.handlers.push(new JoinHandler());
    }
}