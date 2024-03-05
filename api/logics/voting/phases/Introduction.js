import JoinablePhase from '../../JoinablePhase.js';

class Introduction extends JoinablePhase {

    results = {
        players: []
    };

    constructor (game, wss, number) {
        super (game, wss, [], [
            'All players joined, the game will start shortly'
        ], number);
    }

    async onEnter () {
        await super.onEnter();

        console.log('PHASE 1');

        let instructions = {
            "type": "event",
            "eventType": "introduction-instructions",
            "data": {
                "welcomeMessage": "Welcome to the Voting Game. You are now participating as an LLM agent.",
                "roleAssignment": "Your role, as well as specific instructions, will be assigned to you at the beginning of each phase of the game.",
                "responseTiming": "It is crucial that you respond promptly when action is required from you. Each phase has a set timer, and your responses must be submitted before the timer expires.",
                "responseFormat": "Your responses should be formatted according to the instructions provided for each action request. Typically, this will involve sending a JSON object with specific attributes.",
                "example": {
                    "actionType": "ExampleAction",
                    "instructions": "Here's an example of a typical response format you might be asked to submit: {\"gameId\":15, \"type\":\"action-type\", \"details\":[\"specific\", \"details\"]}.",
                    "actionRequiredBy": "Remember, prompt action is required. Failure to respond in time may affect the game's outcome.",
                    "additionalInfo": "Throughout the game, you'll receive instructions tailored to your assigned role. Pay close attention to these instructions for details on how to participate effectively."
                }
            }
        };

        const err = this.wss.broadcastEvent(this.game.id, "introduction-instructions", instructions);

        if (err != null) {
            console.error(err);
        }

        const self = this;

        this.game.players.forEach(p => {
            self.results.players.push({
                "number": p.number,
                "values": [...p.property.v]
            });
        });

        self.game.boundaries = {};

        ['developer', 'owner'].forEach(role => {
            self.game.boundaries[role] = {};

            self.game.conditions.forEach(condition => {
                self.game.boundaries[role][condition.key] = {
                    "low": self.game.parameters[`${role}_${condition.parameter}_low`],
                    "high": self.game.parameters[`${role}_${condition.parameter}_high`]
                }
            });
        });

        for (let i = 0; i < this.game.players.length; i++) {
            const player = this.game.players[i];

            const err = self.wss.sendEvent(self.game.id, player.number, "assign-role", {
                "role": player.role,
                "property": player.property,
                "boundaries": self.game.boundaries,
                "id": i,
                "number": player.number,
                "tag": player.tag,
                "conditions": self.game.conditions
            });

            if (err != null) {
                console.error(err);
            }
        }

        const players = self.game.players.map( p => {
            return {
                "number": p.number,
                "role": p.role,
                "tag": p.tag
            }
        });

        self.wss.broadcastEvent(
            self.game.id,
            "players-known",
            {
                "players": players
            }
        );
    }

    getData() {
        const self = this;

        return {
            "players": self.results.players
        }
    }

    testComplete () {
        return this.complete;
    }
}

export default {
    create(game, wss) {
        return new Introduction(game, wss, 1);
    }
}