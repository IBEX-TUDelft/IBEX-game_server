import WS from '../../../helpers/websocket.js';
import JoinablePhase from '../../JoinablePhase.js';

class Phase3 extends JoinablePhase {
    startTime = 0;
    results = {
        winningCondition: null,
        snipes: []
    };

    constructor(game, wss, number) {
        super (game, wss, [{
            "type": "done-speculating",
            "role": [1],
            "action": function(ws, message, player, caller) {
                console.log(`Player ${player.name} is done speculating`);

                caller.results.snipes.push({
                    "player": player.number,
                    "snipe": message.snipe
                });

                console.log(message.snipe);
                console.log(typeof message.snipe);
                console.log(Array.isArray(message.snipe));
                console.log('Message snipe arrays (should be 3)' + message.snipe.length);

                if (message.snipe == null) {
                    console.error('The snipe object contains no arrays');
                    player.doneSpeculating = true;
                    return;
                }

                const winningConditionSnipes = message.snipe[game.winningCondition];

                if (winningConditionSnipes != null && winningConditionSnipes.length > 0) {
                    winningConditionSnipes.forEach(id => {
                        const lot = game.properties.find(p => p.id === id);

                        if (lot == null) {
                            WS.error(ws, `Game ${message.gameId}: lot ${id}} not found`);
                            console.log(`Game ${message.gameId}: lot ${id}} not found`);
                            return;
                        }

                        if (lot.speculators == null) {
                            lot.speculators = [[], [], []];
                        }

                        lot.speculators[game.winningCondition].push(player.number);

                        console.log(`Property ${lot.name} was selected by a speculator: ${player.name} under condition ${game.winningCondition}`);
                    });
                }

                wss.sendEvent(
                    game.id,
                    player.number,
                    "speculation-received",
                    {}
                );

                player.doneSpeculating = true;
            }
        }], [
            'Analyse all declarations and choose which ones to target, under all conditions',
            'Wait for the speculators to make their decisions',
            'Wait for the speculators to make their decisions'
        ], number);
    }

    async onEnter () {
        await super.onEnter();

        this.game.properties.forEach(property => {
            property.speculators = [[], [], []];
        });
        
        const self = this;

        self.endTime = Date.now() + self.game.parameters.minutes_for_sniping * 60 * 1000;

        self.game.players.filter(p => p.role === 1).forEach(p => {
            p.doneSpeculating = false
        });

        // 1. calculate D

        self.game.D = [0,0,0];

        self.game.properties.forEach(p => {
            for (let j = 0; j < self.game.conditions.length; j++) {
                self.game.D[j] += p.d[j];
            }
        });

        // 2. determine the winning condition

        let winningCondition = 0;
        let winningSum = self.game.D[0];

        for(let j = 1; j < self.game.conditions.length; j++) {
            if (self.game.D[j] > winningSum || (winningCondition === 0 && self.game.D[j] === winningSum)) {
                winningSum = self.game.D[j];
                winningCondition = j;
            }
        }

        this.game.publicSignal = [0, 0, 0];

        this.game.winningCondition = winningCondition;

        this.results.winningCondition = winningCondition;
        
        console.log(`The winning condition is ${winningCondition}, with a sum of ${winningSum}. Here the full list: ${self.game.D}`);

        console.log('Calculating the public signal');

        const S = winningSum;
        const r = self.game.parameters.tax_rate_final / 100;

        /* S would be the total declared value if the declaration would not change later.
            This yields S * r, the total tax virtual revenue at this stage.
            We say there are 100 shares of it, not all distributed to player (e.g. 5 per player, 12 players = 60% redistributed),
            so each share has a theoretical value of:
        */
        this.game.publicSignal[winningCondition] = S * r / 100;

        // 3. send declarations
        const declatationData = [];

        this.game.players.forEach(p => {
            const property = p.property;

            if (property != null) {
                declatationData.push({
                    "id": property.id,
                    "name": property.name,
                    "owner": p.name,
                    "role": p.role,
                    "number": p.number,
                    "d": property.d,
                    "available": [true, true, true]
                });
            }

            /*const summary = {
                "round": self.game.currentRound.number,
                "value": property == null ? 0 : property.v[winningCondition],
                "firstDeclaration": property == null ? 0 : property.d[winningCondition],
                "firstTaxes": property == null ? 0 : property.d[winningCondition] * self.game.parameters.tax_rate_initial / 100,
            }

            p.summaries.push(summary);*/
        });

        let err = self.wss.broadcastEvent(
            self.game.id,
            "declarations-published",
            {
                "declarations": declatationData,
                "winningCondition": winningCondition
            }
        );

        if (err != null) {
            console.log(err);
        }


        //this.setTimer(self.game.parameters.minutes_for_sniping * 60 * 1000, self.game.parameters.minutes_for_sniping * 60 * 1000);
    }

    getData() {
        return this.game.properties.map(p => {
            return {
                "id": p.id,
                "name": p.name,
                "speculators": p.speculators,
            }
        });
    }

    testComplete () {
        return this.game.players.filter(p => p.role === 1).filter(p => !p.doneSpeculating).length == 0;
    }
}

export default {
    create(game, wss, number) {
        return new Phase3(game, wss, number);
    }
}