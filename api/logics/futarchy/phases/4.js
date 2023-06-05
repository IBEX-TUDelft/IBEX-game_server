import JoinablePhase from '../../JoinablePhase.js';

class Phase4 extends JoinablePhase {

    complete = false;
    results = {
        snipes: [],
        snipeOutcomes: []
    };

    constructor(game, wss, number) {
        super(game, wss, [], [], number);
    }

    async onEnter () {
        await super.onEnter();

        //this.setTimer(5 * 1000, 5 * 1000);
    }

    getData() {
        return {};
    }

    testComplete () {
        return this.complete;
    }
}

export default {
    create(game, wss, number) {
        return new Phase4(game, wss, number);
    }
}