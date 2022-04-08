import WS from '../../../helpers/websocket.js';
import Phase from '../../Phase.js';

class Phase7 extends Phase {
    results = {
        declarations: []
    };

    constructor(game, wss) {
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
                
                player.property.d = message.declaration;

                phase.results.declarations.push({
                    "player": player.number,
                    "role": player.role,
                    "value": player.property.v,
                    "declaration": message.declaration,
                    "taxes": message.declaration.map(d => d * game.parameters.tax_rate_final / 100)
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

        console.log('PHASE 7');

        this.game.properties.forEach(p => {
            p.d = null;
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
    create(game, wss) {
        return new Phase7(game, wss);
    }
}