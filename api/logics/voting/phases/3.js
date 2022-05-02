import JoinablePhase from '../../JoinablePhase.js';

class Phase3 extends JoinablePhase {

    results = {
        compensationRequests: []
    };

    complete = false;

    constructor (game, wss) {
        super (game, wss, [{
            "type": "compensation-request",
            "role": null,
            "action": function(ws, message, player, caller) {
                console.log(message);

                player.compensationRequests = message.compensationRequests;
                caller.results.compensationRequests.push({
                    "number": player.number,
                    "compensationDecisions": message.compensationRequests
                });

                const err = wss.sendEvent(
                    game.id,
                    player.number,
                    "compensation-request-received",
                    {}
                );

                if (err != null) {
                    console.error(err);
                }
            }
        }], [
            '-',
            'Wait for all owners to submit their requests',
            'Submit a compensation request, remember to click on the submit button. Wait for all to submit.'
        ]);
    }

    async onEnter () {
        await super.onEnter();

        console.log('PHASE 3');
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

    onExit() {
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
    create(game, wss) {
        return new Phase3(game, wss);
    }
}