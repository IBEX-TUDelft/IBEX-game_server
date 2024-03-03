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

    async onEnter() {
        super.onEnter();

        // Broadcasting the start of Phase 3 with clear instructions for all players
        this.wss.broadcastEvent(
            this.game.id,
            "phase-initiation",
            {
                "phase": "3",
                "title": "Compensation Request Phase",
                "instructions": "All owners are now required to submit their compensation requests. Please review the project proposals and submit your request using the format provided in the game interface.",
                "details": "Ensure your submission reflects your compensation expectations based on the developments proposed. This phase is crucial for setting the tone of negotiations."
            }
        );

        console.log('PHASE 3: Compensation Request Phase has begun.');
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
        super.onExit(); // await is not necessary unless you're calling an async function within super.onExit()

        // Providing feedback on the completion of compensation requests and guiding to the next steps
        this.wss.broadcastEvent(
            this.game.id,
            "phase-completion",
            {
                "phase": "3",
                "message": "The Compensation Request Phase is now complete. Thank you for your submissions. Please wait as we process the requests and move to the next phase where compensation offers will be made."
            }
        );

        // Handling the situation where players did not submit any requests
        this.game.players.forEach(p => {
            if (p.role === 3 && p.compensationRequests == null) {
                p.compensationRequests = [0, 0]; // Consider whether this default is appropriate for your game logic
            }
        });

        // Reset the timer for the next phase or provide any inter-phase instructions
        const err = this.wss.broadcastEvent(this.game.id, "reset-timer", {});
        if (err != null) {
            console.error("Error resetting timer for next phase:", err);
        }
    }
}

export default {
    create(game, wss, number) {
        return new Phase3(game, wss, number);
    }
}