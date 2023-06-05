import JoinablePhase from "../JoinablePhase.js";

class Phase9 extends JoinablePhase {

    constructor (game, wss, number) {
        super (game, wss, [], [], number);
    }

    getData() {
        return this.game.players.map(p => {
            return {
                "id": p.id,
                "name": p.name,
                "profit": p.profit,
            }
        });
    }
    
    testComplete () {
        return this.complete;
    }
}

export default {
    create(game, wss, number) {
        return new Phase9(game, wss, number);
    }
}