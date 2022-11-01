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

        const self = this;

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
                "wallet": player.wallet,
                "property": player.property,
                "boundaries": self.game.boundaries,
                "taxRate": self.game.parameters.tax_rate_initial,
                "initialTaxRate": self.game.parameters.tax_rate_initial,
                "finalTaxRate": self.game.parameters.tax_rate_final,
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
        
        this.setTimer(15 * 1000, 15 * 1000); //Timer of 15 seconds requested by Sander
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