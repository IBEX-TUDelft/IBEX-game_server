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
                console.log(message);

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

    async onEnter() {
        super.onEnter(); // No need to await if super.onEnter() is not async

        // Broadcasting the start of the voting phase with clear instructions
        this.wss.broadcastEvent(
            this.game.id,
            "phase-initiation",
            {
                "phase": "Voting",
                "title": "Voting on Compensation Offers",
                "instructions": "Review the compensation offers carefully. Vote on each offer based on your judgment. Your decision should reflect whether you accept or reject each compensation offer made by the developers. Please submit your vote using the provided interface.",
                "details": "This phase is critical for determining the compensation outcomes. Your decisions will directly influence the final compensation agreements."
            }
        );

        console.log('VOTING PHASE: Review and Vote on Compensation Offers');
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
        super.onExit(); // No need to await if super.onExit() is not async

        // Providing feedback on the completion of voting and guiding to the next steps
        this.wss.broadcastEvent(
            this.game.id,
            "phase-completion",
            {
                "phase": "Voting",
                "message": "The Voting Phase is now complete. Thank you for your participation. The results are being processed, and the outcome will be announced shortly. Please wait for the next instructions."
            }
        );

        // Ensure all players have their compensation decisions set
        this.game.players.forEach(p => {
            if (p.role === 3 && p.compensationDecisions == null) {
                p.compensationDecisions = []; // Consider whether a default decision is appropriate
            }
        });
    }
}

export default {
    create(game, wss, number) {
        return new Vote(game, wss, number);
    }
}