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
                console.log(message);

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

        console.log('PHASE 3 - Compensation Requests');

        // Broadcast instructions for submitting compensation requests
        const instructionMessage = {
            "type": "event",
            "eventType": "action-required",
            "data": {
                "instructions": "You are now required to submit your compensation request. Please reply with your compensation request in the following format: {\"gameId\":15,\"type\":\"compensation-request\",\"compensationRequests\":[null,X]}, where X is your request amount as an integer.",
                "format": "{\"gameId\":15,\"type\":\"compensation-request\",\"compensationRequests\":[null,X]}",
                "actionRequired": "Immediate response required."
            }
        };

        // Use your existing method to broadcast this event to all relevant players
        const err = this.wss.broadcastEvent(this.game.id, "instruction", instructionMessage);

        if (err != null) {
            console.error(`Error broadcasting compensation request instructions: ${err}`);
        }
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