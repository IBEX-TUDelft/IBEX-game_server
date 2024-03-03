import JoinablePhase from '../../JoinablePhase.js';

class Phase4 extends JoinablePhase {

    complete = false;

    compensationOffers;

    results = {
        compensationOffers: []
    };

    constructor(game, wss, number) {
        super(game, wss, [{
            "type": "compensation-offer",
            "role": 2,
            "action": function (ws, message, player, caller) {
                console.log(message);

                caller.results.compensationOffers = message.compensationOffers;
                game.compensationOffers = message.compensationOffers;

                player.submittedCompensationOffers = true;

                const err = wss.sendEvent(
                    game.id,
                    player.number,
                    "compensation-offer-received",
                    {
                        "compensationOffers": message.compensationOffers
                    }
                );

                if (err != null) {
                    console.error(err);
                }
            }
        }], [
            '-',
            'Submit your compensation offers (click the submit button)',
            'Wait for the developer to submit a compensation offer'
        ], number);
    }

    async onEnter() {
        await super.onEnter();

        console.log('PHASE 4: Submit Compensation Offers');

        // Broadcasting the initiation of compensation offer phase with clear instructions
        const err = this.wss.broadcastEvent(
            this.game.id,
            "phase-initiation",
            {
                "phase": "Compensation Offer",
                "instructions": "As a developer, submit your compensation offers now using the provided format."
            }
        );

        if (err != null) {
            console.error(err);
        }
    }

    getData() {
        const self = this;

        return {
            "compensationOffers": self.results.compensationOffers
        }
    }

    testComplete() {
        return this.game.players.find(p => p.role === 2 && p.submittedCompensationOffers === true) != null;
    }

    async onExit() {
        await super.onExit();
        // When exiting, provide a summary or next steps
        this.game.players.filter(p => p.role === 3).forEach(p => {
            // Assuming compensationOffers has been correctly populated
            let compensationOffers = this.results.compensationOffers || [0, 0];

            this.wss.sendEvent(
                this.game.id,
                p.number,
                "phase-completion",
                {
                    "phase": "Compensation Offer",
                    "message": "Compensation offers submitted. Review the offers and prepare for the next phase.",
                    "compensationOffers": compensationOffers
                }
            );
        });
    }
}

export default {
    create(game, wss, number) {
        return new Phase4(game, wss, number);
    }
}