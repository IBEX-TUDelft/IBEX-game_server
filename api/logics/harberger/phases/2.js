import WS from '../../../helpers/websocket.js';
import JoinablePhase from '../../JoinablePhase.js';

class Phase2 extends JoinablePhase {

    results = {
        declarations: [],
        expectations: null
    };

    constructor(game, wss) {
        super (game, wss, [{
            "type": "declare",
            "role": [2,3],
            "action": function(ws, message, player, caller) {
                console.log(`New Declaration from ${player.name}`);
                
                if (player.property == null) {
                    WS.error(ws, `Game ${message.gameId}: player ${ws.player.number} sent a declaration but does not own a property. This is a bug`);
                    return;
                }

                if (player.property.d != null) {
                    WS.warning(ws, `Game ${message.gameId}: player ${ws.player.number} sent a declaration update. This is not allowed`);
                    return;
                }

                const roles = [null, 'speculator', 'developer', 'owner'];

                for (let i = 0; i < game.conditions.length; i++) {
                    const condition = game.conditions[i];
                    const d = message.declaration[i];

                    const max = game.parameters[`${roles[player.role]}_${condition.parameter}_high`] * 2;

                    console.log(`Checking ${d} against ${roles[player.role]}_${condition.parameter}_high * 2 (${max})`);

                    if (d > max) {
                        wss.sendEvent(
                            game.id,
                            player.number,
                            "declaration-above-max",
                            {
                                "condition": condition.name,
                                "maximum": max
                            }
                        );

                        return;
                    }
                }

                player.property.d = message.declaration;

                caller.results.declarations.push({
                    "player": player.number,
                    "role": player.role,
                    "value": [...player.property.v],
                    "declaration": message.declaration,
                    "taxes": message.declaration.map(d => d * game.parameters.tax_rate_initial / 100)
                });

                wss.broadcastInfo(game.id, `Player ${player.name} submitted a declaration of values.`, null);

                wss.sendEvent(
                    game.id,
                    player.number,
                    "declaration-received",
                    {}
                );
            }
        }], [
            'Wait for all property owners to send their declarations',
            'Fill the declaration with a value under all conditions. Use the real value as a reference',
            'Fill the declaration with a value under all conditions. Use the real value as a reference'
        ]);
    }

    async onEnter () {
        await super.onEnter();

        console.log('PHASE 2');

        this.game.properties.forEach(p => {
            p.d = null;
        });

        this.results.expectations = [];

        const self = this;

        this.game.conditions.forEach((condition) => {
            const players = [];

            let sum = 0;

            self.game.players.forEach(p => {
                if (p.role === 1) {
                    return;
                }

                sum += p.property.v[condition.id];
            });

            const expectedShareValue = sum * self.game.parameters.tax_rate_final / 10000;

            this.game.players.forEach(player => {
                let profit = 0;
    
                if (player.role != 1) {
                    profit += player.property.v[condition.id];
                }
    
                profit += player.shares * expectedShareValue;

                players.push({
                    "number": player.number,
                    "profit": profit
                });
            });

            this.results.expectations.push({
                "condition": condition.id,
                "expectedShareValue": expectedShareValue,
                "players": players
            })
        });

        console.log('Expected result: ');
        console.log(this.results.expectations);
    }

    testComplete () {
        return this.game.properties.find(p => p.d == null) == null; //true when all properties have a declaration
    }

    getData() {
        return this.game.properties.map(p => {
            return {
                "id": p.id,
                "name": p.name,
                "declarations": p.d,
            }
        });
    }
}

export default {
    create(game, wss) {
        return new Phase2 (game, wss);
    }
}