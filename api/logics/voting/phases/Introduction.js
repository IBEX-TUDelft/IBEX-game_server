import JoinablePhase from '../../JoinablePhase.js';

class Introduction extends JoinablePhase {

    results = {
        players: []
    };

    constructor (game, wss, number) {
        super (game, wss, [], [
            'All players joined, the game will start shortly'
        ], number);
    }

    async onEnter () {
        await super.onEnter();

        const self = this;

        this.game.players.forEach(p => {
            self.results.players.push({
                "number": p.number,
                "values": [...p.property.v]
            });
        });

        self.game.boundaries = {};

        ['developer', 'owner'].forEach(role => {
            self.game.boundaries[role] = {};

            self.game.conditions.forEach(condition => {
                self.game.boundaries[role][condition.key] = {
                    "low": self.game.parameters[`${role}_${condition.parameter}_low`],
                    "high": self.game.parameters[`${role}_${condition.parameter}_high`]
                }
            });
        });

        for (let i = 0; i < this.game.players.length; i++) {
            const player = this.game.players[i];

            const err = self.wss.sendEvent(self.game.id, player.number, "assign-role", {
                "role": player.role,
                "property": player.property,
                "boundaries": self.game.boundaries,
                "id": i,
                "number": player.number,
                "tag": player.tag,
                "conditions": self.game.conditions
            });

            if (err != null) {
                console.error(err);
            }
        }

        const players = self.game.players.map( p => {
            return {
                "number": p.number,
                "role": p.role,
                "tag": p.tag
            }
        });

        self.wss.broadcastEvent(
            self.game.id,
            "players-known",
            {
                "players": players
            }
        );
    }

    getData() {
        const self = this;

        return {
            "players": self.results.players
        }
    }

    testComplete () {
        return this.complete;
    }
}

export default {
    create(game, wss) {
        return new Introduction(game, wss, 1);
    }
}