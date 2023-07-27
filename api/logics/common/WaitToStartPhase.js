import JoinablePhase from "../JoinablePhase.js";

class WaitToStartPhase extends JoinablePhase {

    constructor (game, wss, number) {
        super (game, wss, [{
            "type": "player-is-ready",
            "role": null,
            "action": function(ws, message, player, caller) {
                player.ready = true;

                console.log('REALLY HERE');
                
                let err = wss.sendEvent(
                    game.id,
                    player.number,
                    "ready-received",
                    {}
                );

                if (err) {
                    console.error(err);
                }
            }
        }], [], 0);
    }

    testComplete () {
        return this.game.assignedPlayers === this.game.parameters.total_players && (this.game.players.find(p => p.ready != true) == null);
    }

    getData () {
        return this.game.players;
    }

    async onExit () {
        await super.onExit();

        this.game.players.forEach(player => {
            player.ready = false;
        });
    }
}

export default {
    create(game, wss) {
        return new WaitToStartPhase(game, wss, 0);
    }
}