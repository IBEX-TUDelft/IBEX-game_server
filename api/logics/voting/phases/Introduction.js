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

    async onEnter() {
        await super.onEnter();
        console.log('PHASE 1 - Introduction');

        // Initialize player roles, properties, and game boundaries.
        this.initializePlayerRolesAndBoundaries();

        // Broadcast roles and initial instructions to players.
        this.broadcastPlayerRolesAndInstructions();
    }

    initializePlayerRolesAndBoundaries() {
        this.game.boundaries = {};
        ['developer', 'owner'].forEach(role => {
            this.game.boundaries[role] = {};
            this.game.conditions.forEach(condition => {
                this.game.boundaries[role][condition.key] = {
                    "low": this.game.parameters[`${role}_${condition.parameter}_low`],
                    "high": this.game.parameters[`${role}_${condition.parameter}_high`]
                };
            });
        });
    }

    broadcastPlayerRolesAndInstructions() {
        this.game.players.forEach((player, index) => {
            const roleMessage = this.createRoleAssignmentMessage(player, index);
            const err = this.wss.sendEvent(this.game.id, player.number, "assign-role", roleMessage);
            if (err != null) {
                console.error(`Error sending role assignment to player ${player.number}:`, err);
            }
        });

        const playersInfo = this.game.players.map(player => ({
            "number": player.number,
            "role": player.role,
            "tag": player.tag
        }));

        this.wss.broadcastEvent(this.game.id, "players-known", {
            "players": playersInfo,
            "instructions": "Review your role and prepare for the first phase. Specific instructions will follow."
        });
    }

    createRoleAssignmentMessage(player, index) {
        return {
            "role": player.role,
            "property": player.property,
            "boundaries": this.game.boundaries[player.role === 1 ? 'developer' : 'owner'],
            "id": index,
            "number": player.number,
            "tag": player.tag,
            "conditions": this.game.conditions.map(condition => ({
                "key": condition.key,
                "range": this.game.boundaries[player.role === 1 ? 'developer' : 'owner'][condition.key]
            })),
            "instructions": `You are a ${player.tag}. Please wait for further instructions on your next actions.`
        };
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