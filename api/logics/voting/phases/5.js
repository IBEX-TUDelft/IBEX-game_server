import JoinablePhase from '../../JoinablePhase.js';

class Phase5 extends JoinablePhase {

    complete = false;

    constructor (game, wss) {
        super (game, wss, [{
            "type": "compensation-decision",
            "role": null,
            "action": function(ws, message, player, caller) {
                console.log(message);

                player.compensationDecisions = message.compensationDecisions;

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
        ]);
    }

    async onEnter () {
        await super.onEnter();

        console.log('PHASE 5');
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
        return new Phase5(game, wss);
    }
}