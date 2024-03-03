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
        await super.onEnter();

        console.log('VOTING PHASE');

        // Broadcast instructions for making a compensation decision
        const instructionMessage = {
            "type": "event",
            "eventType": "action-required",
            "data": {
                "instructions": "It's time to make your compensation decision. Please submit your vote regarding the project proposal. To vote for the project, reply with '1'. To vote against the project, reply with '0'. Use the following format for your response: {\"gameId\":15,\"type\":\"compensation-decision\",\"compensationDecisions\":[1]} for voting in favor, or {\"gameId\":15,\"type\":\"compensation-decision\",\"compensationDecisions\":[0]} to vote against.",
                "format": "{\"gameId\":15,\"type\":\"compensation-decision\",\"compensationDecisions\":[X]}",
                "actionRequired": "Please submit your decision promptly.",
            }
        };

        // Use your existing method to broadcast this event to all relevant players
        const err = this.wss.broadcastEvent(this.game.id, "instruction", instructionMessage);

        if (err != null) {
            console.error(`Error broadcasting voting instructions: ${err}`);
        }
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