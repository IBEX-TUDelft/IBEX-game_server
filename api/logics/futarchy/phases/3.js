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

                
                game.conditions.forEach((condition) => {
                    const conditionIndex = condition.id;

                    const conditionSnipes = message.snipe[conditionIndex];

                    console.log(`Condition ${conditionIndex} snipes: ${conditionSnipes.length}`);

                    if (conditionSnipes != null && conditionSnipes.length > 0) {
                        conditionSnipes.forEach(id => {
                            const lot = game.properties.find(p => p.id === id);

                            if (lot == null) {
                                WS.error(ws, `Game ${message.gameId}: lot ${id}} not found`);
                                console.log(`Game ${message.gameId}: lot ${id}} not found`);
                                return;
                            }
    
                            if (lot.speculators == null) {
                                lot.speculators = [[], [], []];
                            }

                            lot.speculators[conditionIndex].push(player.number);
    
                            console.log(`Property ${lot.name} was selected by a speculator: ${player.name} under condition ${conditionIndex}`);
                        });
                    }
                });

                wss.sendEvent(
                    game.id,
                    player.number,
                    "speculation-received",
                    {}
                );

                player.doneSpeculating = true;
            }
        }], [
            'Analyse all declarations under all conditions. Choose which, if any, properties you want to buy at the declared value.',
            'Wait for the speculators to make their decisions.',
            'Wait for the speculators to make their decisions.'
        ], number);
    }

    async onEnter () {
        await super.onEnter();

        this.game.properties.forEach(property => {
            property.speculators = [[], [], []];
        });
        
        console.log('PHASE 3');

        const self = this;

        console.log(`Setting the timeout to ${self.game.parameters.minutes_for_sniping} minutes`);

        self.endTime = Date.now() + self.game.parameters.minutes_for_sniping * 60 * 1000;

        self.game.players.filter(p => p.role === 1).forEach(p => {p.doneSpeculating = false});

        self.wss.broadcastInfo(self.game.id, 'Click on the properties you are interested in.', 1);
        self.wss.broadcastInfo(self.game.id, 'Check the table of declared values. Choose which, if any, properties you want to buy at the declared value.', 1);
        self.wss.broadcastInfo(self.game.id, 'Wait for the speculators to make their decisions.', 2);
        self.wss.broadcastInfo(self.game.id, 'Wait for the speculators to  make their decisions.', 3);

        // 1. calculate D

        self.game.D = [0,0,0];

        self.game.properties.forEach(p => {
            for (let j = 0; j < self.game.conditions.length; j++) {
                self.game.D[j] += p.d[j];
            }
        });

        // 2. calculate all public signals

        console.log('Calculating the public signal');

        this.game.publicSignal = [0, 0, 0];

        const r = self.game.parameters.tax_rate_final / 100;
        
        for(let conditionIndex = 0; conditionIndex < self.game.conditions.length; conditionIndex++) {
            /* S would be the total declared value if the declaration would not change later.
                This yields S * r, the total tax virtual revenue at this stage.
                We say there are 100 shares of it, not all distributed to player (e.g. 5 per player, 12 players = 60% redistributed),
                so each share has a theoretical value of:
            */
            const S = self.game.D[conditionIndex];
            
            this.game.publicSignal[conditionIndex] = S * r / 100;
        }

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
                "initialDeclarations": property == null ? self.game.conditions.map(c => 0) : property.d,
                "initialTaxes": property == null ? self.game.conditions.map(c => 0) : property.d.map(d => d * self.game.parameters.tax_rate_initial / 100),
            }

            p.summaries.push(summary);*/
        });

        let err = self.wss.broadcastEvent(
            self.game.id,
            "declarations-published",
            {
                "declarations": declatationData,
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
        return this.game.players.filter(p => p.role === 1).filter(p => !p.doneSpeculating).length == 0 || Date.now() >= this.endTime;
    }
}

export default {
    create(game, wss, number) {
        return new Phase3(game, wss, number);
    }
}