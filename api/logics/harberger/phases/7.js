import WS from '../../../helpers/websocket.js';
import JoinablePhase from '../../JoinablePhase.js';

class Phase7 extends JoinablePhase {
    results = {
        declarations: []
    };

    constructor(game, wss, number) {
        super (game, wss, [{
            "type": "declare",
            "role": [2,3],
            "action": function(ws, message, player, phase) {
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

                phase.results.declarations.push({
                    "player": player.number,
                    "role": player.role,
                    "value": [...player.property.v],
                    "declaration": message.declaration,
                    "taxes": message.declaration.map(d => d * game.parameters.tax_rate_final / 100),
                    "declared": true
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
        ], number);
    }

    async onEnter () {
        await super.onEnter();

        this.game.properties.forEach(p => {
            p.d = null;
        });
    }

    async onExit() {
        await super.onExit();

        const self = this;

        this.game.players.forEach(player => {
            const property = player.property;

            if (property == null || (property.d != null && property.d.length > 0)) {
                //No property: then no need of default declaration
                //There are already declarations: then no need of default declaration
                return;
            }

            property.d = [0, 0];

            const roles = [null, 'speculator', 'developer', 'owner'];

            for (let i = 0; i < self.game.conditions.length; i++) {
                const condition = self.game.conditions[i];
                
                const high = self.game.parameters[`${roles[player.role]}_${condition.parameter}_high`];
                const low = self.game.parameters[`${roles[player.role]}_${condition.parameter}_low`];

                //property.d[i] = low + Math.round((high - low) * Math.random());
                property.d[i] = low;
            }

            self.results.declarations.push({
                "player": player.number,
                "role": player.role,
                "value": [...player.property.v],
                "declaration": property.d,
                "taxes": property.d.map(d => d * self.game.parameters.tax_rate_final / 100),
                "declared": false
            });
        });
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
    create(game, wss, number) {
        return new Phase7(game, wss, number);
    }
}