import JoinablePhase from '../../JoinablePhase.js';

class Phase4 extends JoinablePhase {

    complete = false;
    results = {
        snipes: [],
        snipeOutcomes: []
    };

    constructor(game, wss) {
        super(game, wss, [], []);
    }

    async onEnter () {
        await super.onEnter();

        this.setTimer(5 * 1000, 5 * 1000);
    }

    getData() {
        return {};
    }

    testComplete () {
        return this.complete;
    }
}

export default {
    create(game, wss) {
        return new Phase4(game, wss);
    }
}