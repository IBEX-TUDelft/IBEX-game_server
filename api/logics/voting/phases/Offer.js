import JoinablePhase from '../../JoinablePhase.js';

class Phase4 extends JoinablePhase {

    complete = false;

    compensationOffers;

    results = {
        compensationOffers: []
    };

    constructor (game, wss, number) {
        super (game, wss, [{
            "type": "compensation-offer",
            "role": 2,
            "action": function(ws, message, player, caller) {
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

    async onEnter () {
        await super.onEnter();

        const self = this;

        console.log('PHASE 4');

        const err = self.wss.broadcastEvent(
            self.game.id,
            "compensation-requests-received",
            {
                "compensationRequests": self.game.players.map(p => {
                    return {
                        "number": p.number,
                        "compensationRequests": p.compensationRequests
                    }
                })
            },
            2
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

    testComplete () {
        return this.game.players.find(p => p.role === 2 && p.submittedCompensationOffers === true) != null;
    }

    async onExit() {
        await super.onExit();
        
        const self = this;

        this.game.players.filter(p => p.role === 3).forEach(p => {
            let compensationOffers = self.results.compensationOffers;

            if (compensationOffers == null || compensationOffers.length === 0) {
                compensationOffers = [0 ,0];
            }

            const err = self.wss.sendEvent(
                self.game.id,
                p.number,
                "compensation-offer-made",
                {
                    "compensationOffers": compensationOffers
                }
            );

            if (err != null) {
                console.error(err);
            }
        });

        if (this.results.compensationOffers == null) {
            this.results.compensationOffers = [];
            this.game.compensationOffers = [];
        }
    }
}

export default {
    create(game, wss, number) {
        return new Phase4(game, wss, number);
    }
}