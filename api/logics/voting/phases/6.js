import JoinablePhase from '../../JoinablePhase.js';

class Phase6 extends JoinablePhase {

    results = [];

    constructor (game, wss) {
        super (game, wss, []);
    }

    async onEnter () {
        await super.onEnter();

        console.log('PHASE 6');

        const self = this;

        const quorum = Math.ceil(self.game.players.length / 2);

        const developer = self.game.players.find(p => p.role === 2);

        self.game.conditions.forEach(c => {
            self.results.push({
                "counter": 0,
                "id": c.id,
                "winner": false,
                "value": developer.property.v[c.id],
                "compensation": self.game.compensationOffers[c.id]
            });

            self.game.players.forEach(player => {
                if (player.role === 2 || player.compensationDecisions[c.id] === true) {
                    self.results[c.id].counter ++;
                }
            })
        });

        const standings = self.results.filter(r => r.counter >= quorum).sort((f,s) => s.value - f.value);

        if (standings.length === 0) {
            self.results[0].winner = true;
        } else {
            standings[0].winner = true;
        }

        const winner = self.results.find(r => r.winner === true);

        console.log(this.results);

        self.game.players.forEach(player => {
            const err = self.wss.sendEvent(
                self.game.id,
                player.number,
                "final-profit",
                {
                    "condition": winner.id,
                    "tally": winner.counter,
                    "value": player.property.v[winner.id],
                    "compensation": (player.role === 2) ? - winner.compensation * (self.game.players.length - 1) : winner.compensation
                }
            );

            if (err != null) {
                console.error(err);
            }
        });
    }

    testComplete () {
        return this.game.assignedPlayers === this.game.parameters.total_players;
    }

    getData () {
        return {};
    }
}

export default {
    create(game, wss) {
        return new Phase6(game, wss);
    }
}