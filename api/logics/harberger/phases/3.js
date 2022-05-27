import WS from '../../../helpers/websocket.js';
import JoinablePhase from '../../JoinablePhase.js';

class Phase3 extends JoinablePhase {
    startTime = 0;
    results = {};

    constructor(game, wss) {
        super (game, wss, [{
            "type": "done-speculating",
            "role": [1],
            "action": function(ws, message, player, caller) {
                console.log(`Player ${player.name} is done speculating`);

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

                console.log('Winning condition snipes: ' + winningConditionSnipes.length);

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
        ]);
    }

    async onEnter () {
        await super.onEnter();

        console.log('PHASE 3');

        const self = this;

        console.log(`Setting the timeout to ${self.game.parameters.minutes_for_sniping} minutes`);

        self.endTime = Date.now() + self.game.parameters.minutes_for_sniping * 60 * 1000;

        self.game.players.filter(p => p.role === 1).forEach(p => {p.doneSpeculating = false});

        self.wss.broadcastInfo(self.game.id, 'Click on the properties you are interested in. Be fast or the other speculators will take them first!', 1);
        self.wss.broadcastInfo(self.game.id, 'Check the table of declared values. If you think some property is undervalued, you can buy it and make profit', 1);
        self.wss.broadcastInfo(self.game.id, 'Wait for the speculators to do their move', 2);
        self.wss.broadcastInfo(self.game.id, 'Wait for the speculators to do their move', 3);

        // 1. calculate D

        self.game.D = [0,0,0];

        self.game.properties.forEach(p => {
            for (let j = 0; j < 3; j++) {
                self.game.D[j] += p.d[j];
            }
        });

        // 2. determine the winning condition

        let winningCondition = null;
        let winningSum = 0;

        for(let j = 0; j < 3; j++) {
            if (self.game.D[j] > winningSum) {
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

        err = self.wss.broadcastEvent(
            self.game.id,
            "set-timer",
            {
                "end": self.endTime
            },
            1
        );

        if (err != null) {
            console.log(err);
        }
    }

    onExit () {
        const err = this.wss.broadcastEvent(
            this.game.id,
            "reset-timer",
            {},
            1
        );

        if (err != null) {
            console.log(err);
        }
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
    create(game, wss) {
        return new Phase3(game, wss);
    }
}