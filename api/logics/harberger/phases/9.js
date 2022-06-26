import JoinablePhase from '../../JoinablePhase.js';

class Phase9 extends JoinablePhase {

    complete = false;

    constructor (game, wss) {
        super (game, wss, []);
    }

    async onEnter () {
        await super.onEnter();

        console.log('PHASE 9');

        this.setTimer(60 * 1000 * 10, 60 * 1000 * 10);
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
    create(game, wss) {
        return new Phase9(game, wss);
    }
}