import JoinablePhase from '../../JoinablePhase.js';

class End extends JoinablePhase {

    results = {
        standings: [],
        winningCondition: null
    };

    complete = false;

    constructor (game, wss) {
        super (game, wss, [], ['The results of this round are available']);
    }

    async onEnter () {
        await super.onEnter();

        console.log('PHASE 6');

        const self = this;

        const quorum = Math.ceil(self.game.players.filter(p => p.role === 3).length / 2);

        const developer = self.game.players.find(p => p.role === 2);

        self.game.conditions.forEach(c => {
            self.results.standings.push({
                "counter": 0,
                "id": c.id,
                "winner": false,
                "value": developer.property.v[c.id],
                "compensation": self.game.compensationOffers[c.id]
            });

            self.game.players.forEach(player => {
                if (player.role === 3 && player.compensationDecisions.includes(c.id)) {
                    self.results.standings[c.id].counter ++;
                }
            })
        });

        let standings = self.results.standings.filter(r => r.counter >= quorum).sort((f,s) => s.counter - f.counter);

        if (standings.length === 0) {
            self.results.standings[0].winner = true;
        } else if (standings.length === 1 || standings[0].counter > standings[1].counter) {
            standings[0].winner = true;
        } else {
            const maximum = standings[0].counter;

            standings = standings.filter(s => s.counter === maximum).sort((f,s) => s.value - f.value);

            standings[0].winner = true;
        }

        const winner = self.results.standings.find(r => r.winner === true);

        self.game.winningCondition = winner.id;
        self.results.winningCondition = winner.id;

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

        this.setTimer(30 * 1000, 30 * 1000);
    }

    testComplete () {
        return this.complete;
    }

    getData () {
        const self = this;

        return {
            "standings": self.results.standings,
            "winningCondition": self.results.winningCondition
        };
    }

    async onExit() {
        await super.onExit();

        this.game.players.forEach(p => {
            p.compensationRequests = null;
            p.submittedCompensationOffers = false;
            p.compensationDecisions = null;
            p.submittedCompensationOffers = false;
        })
    }
}

export default {
    create(game, wss) {
        return new End(game, wss);
    }
}