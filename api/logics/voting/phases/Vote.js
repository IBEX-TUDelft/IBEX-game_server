import JoinablePhase from '../../JoinablePhase.js';

class Vote extends JoinablePhase {

    complete = false;

    results = {
        compensationDecisions: []
    };

    constructor (game, wss, number) {
        super (game, wss, [{
            "type": "compensation-decision",
            "role": null,
            "action": function(ws, message, player, caller) {
                player.compensationDecisions = message.compensationDecisions;
                caller.results.compensationDecisions.push({
                    "number": player.number,
                    "compensationDecisions": message.compensationDecisions
                });

                const err = wss.sendEvent(
                    game.id,
                    player.number,
                    "compensation-decision-received",
                    {}
                );

                if (err != null) {
                    console.error(err);
                }
            }
        }], [
            '-',
            'Wait for all owners to submit their decisions on your offer',
            'Submit your final decision, remember to click on the submit button. Wait for all to submit.'
        ], number);
    }

    async onEnter () {
        await super.onEnter();
    }

    getData() {
        const self = this;

        return {
            "compensationDecisions": self.game.players.map(p => p.compensationDecisions)
        }
    }

    testComplete () {
        return this.game.players.find(p => p.role === 3 && p.compensationDecisions == null) == null;
    }

    async onExit() {
        await super.onExit();

        this.game.players.forEach(p => {
            if (p.role === 3 && p.compensationDecisions == null) {
                p.compensationDecisions = [];
            }
        });
    }
}

export default {
    create(game, wss, number) {
        return new Vote(game, wss, number);
    }
}