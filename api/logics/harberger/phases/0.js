import JoinablePhase from '../../JoinablePhase.js';

class Phase0 extends JoinablePhase {

    constructor (game, wss) {
        super (game, wss, []);
    }

    getPlayer () {
        return null;
    }

    testComplete () {
        return this.game.assignedPlayers === this.game.parameters.total_players;
    }

    getData () {
        return this.game.players;
    }
}

export default {
    create(game, wss) {
        return new Phase0(game, wss);
    }
}