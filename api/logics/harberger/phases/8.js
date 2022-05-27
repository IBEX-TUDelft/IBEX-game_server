import WS from '../../../helpers/websocket.js';
import JoinablePhase from '../../JoinablePhase.js';

class Phase8 extends JoinablePhase {

    startTime = 0;

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

        console.log('PHASE 8');

        const self = this;

        self.game.players.filter(p => p.role === 1).forEach(p => {p.doneSpeculating = false});

        self.endTime = Date.now() + self.game.parameters.minutes_for_sniping * 60 * 1000;

        self.wss.broadcastInfo(self.game.id, 'Click on the properties you are interested in. Be fast or the other speculators will take them first!', 1);
        self.wss.broadcastInfo(self.game.id, 'Check the table of declared values. If you think some property is undervalued, you can buy it and make profit', 1);
        self.wss.broadcastInfo(self.game.id, 'Wait for the speculators to do their move', 2);
        self.wss.broadcastInfo(self.game.id, 'Wait for the speculators to do their move', 3);

        const declarationData = [];

        this.game.players.forEach(p => {
            const property = p.property;

            if (property != null) {
                const declaration = {
                    "id": property.id,
                    "name": property.name,
                    "owner": p.name,
                    "role": p.role,
                    "number": p.number,
                    "d": property.d,
                    "available": [false, false, false]
                };

                declaration.available[self.game.winningCondition] = true;

                console.log('Winning condition declaration made available for sniping');

                declarationData.push(declaration);

                console.log('Declaration pushed');
            }
        });

        console.log('Broadcasting declarations');

        let err = self.wss.broadcastEvent(
            this.game.id,
            "declarations-published",
            {
                "declarations": declarationData,
                "winningCondition": self.game.winningCondition
            }
        );

        if (err != null) {
            console.log(err);
        }

        err = this.wss.broadcastEvent(
            this.game.id,
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
        return new Phase8(game, wss);
    }
}