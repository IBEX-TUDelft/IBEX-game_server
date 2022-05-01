import JoinablePhase from '../../JoinablePhase.js';

class Phase1 extends JoinablePhase {

    complete = false;

    constructor (game, wss) {
        super (game, wss, [], [
            'All players joined, the game will start shortly'
        ]);
    }

    async onEnter () {
        await super.onEnter();

        console.log('PHASE 1');

        const self = this;

        this.game.conditions = [{
                "name": "No Project",
                "id": 0,
                "parameter": "no_project",
                "key": "noProject"
            }, {
                "name": "Project A",
                "id": 1,
                "parameter": "project_a",
                "key": "projectA"
            }, {
                "name": "Project B",
                "id": 2,
                "parameter": "project_b",
                "key": "projectB"
            }
        ];

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

        setTimeout(() => {
            self.complete = true;
        }, 5000);
    }

    getData() {
        return {}
    }

    testComplete () {
        return this.complete;
    }
}

export default {
    create(game, wss) {
        return new Phase1(game, wss);
    }
}