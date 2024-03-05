import JoinablePhase from '../../JoinablePhase.js';

class Phase3 extends JoinablePhase {

    results = {
        compensationRequests: []
    };

    complete = false;

    constructor (game, wss, number) {
        super (game, wss, [{
            "type": "compensation-request",
            "role": null,
            "action": function(ws, message, player, caller) {
                player.compensationRequests = message.compensationRequests;
                caller.results.compensationRequests.push({
                    "number": player.number,
                    "compensationRequests": message.compensationRequests
                });

                const err = wss.sendEvent(
                    game.id,
                    player.number,
                    "compensation-request-received",
                    {
                        "compensationRequests": message.compensationRequests
                    }
                );

                if (err != null) {
                    console.error(err);
                }
            }
        }], [
            '-',
            'Wait for all owners to submit their requests',
            'Submit a compensation request, remember to click on the submit button. Wait for all to submit.'
        ], number);
    }

    async onEnter () {
        await super.onEnter();
    }

    getData() {
        const self = this;

        return {
            "compensationRequests": self.game.players.map(p => p.compensationRequests)
        }
    }

    testComplete () {
        return this.game.players.find(p => p.role === 3 && p.compensationRequests == null) == null;
    }

    async onExit() {
        await super.onExit();

        this.game.players.forEach(p => {
            if (p.role === 3 && p.compensationRequests == null) {
                p.compensationRequests = [0, 0];
            }
        });

        const err = this.wss.broadcastEvent(
            this.game.id,
            "reset-timer",
            {}
        );

        if (err != null) {
            console.log(err);
        }
    }
}

export default {
    create(game, wss, number) {
        return new Phase3(game, wss, number);
    }
}