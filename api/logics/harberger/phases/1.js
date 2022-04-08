import Phase from '../../Phase.js';

class Phase1 extends Phase {

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

        const boundaries = {
            developer: {
                noProject: {
                    low: self.game.parameters.developer_no_project_low,
                    high: self.game.parameters.developer_no_project_high
                },
                projectA: {
                    low: self.game.parameters.developer_project_a_low,
                    high: self.game.parameters.developer_project_a_high
                },
                projectB: {
                    low: self.game.parameters.developer_project_b_low,
                    high: self.game.parameters.developer_project_b_high
                }
            },
            owner: {
                noProject: {
                    low: self.game.parameters.owner_no_project_low,
                    high: self.game.parameters.owner_no_project_high
                },
                projectA: {
                    low: self.game.parameters.owner_project_a_low,
                    high: self.game.parameters.owner_project_a_high
                },
                projectB: {
                    low: self.game.parameters.owner_project_b_low,
                    high: self.game.parameters.owner_project_b_high
                }
            }
        }

        for (let i = 0; i < this.game.players.length; i++) {
            const player = this.game.players[i];

            const err = self.wss.sendEvent(self.game.id, player.number, "assign-role", {
                "role": player.role,
                "balance": player.balance,
                "shares": player.shares,
                "wallet": player.wallet,
                "property": player.property,
                "boundaries": boundaries,
                "taxRate": self.game.parameters.tax_rate_initial
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

        console.log(this.game.players);
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