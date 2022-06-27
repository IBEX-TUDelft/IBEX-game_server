import JoinablePhase from '../../JoinablePhase.js';

class Phase5 extends JoinablePhase {

    complete = false;
    results = {
        signals: []
    };

    constructor(game, wss) {
        super(game, wss,[{
            "type": "complete-current-phase",
            "role": null,
            "action": function(ws, message, player, caller) {
                caller.complete = true;
            }
        }], []);
    }

    async onEnter () {
        console.log('PHASE 5');

        const self = this;

        this.game.players.forEach(player => {
            self.wss.sendEvent(
                self.game.id,
                player.number,
                "value-signals",
                {
                    "signals": player.S,
                    "publicSignal": self.game.publicSignal,
                    "taxRate": self.game.parameters.tax_rate_final
                }
            );
        });

        self.wss.broadcastInfo(self.game.id, `Prepare for the trading phase`);

        self.results.signals = {
            publicSignal: self.game.publicSignal,
            privateSignals: self.game.players.map(p => { return p.S; })
        };
        
        this.setTimer(5 * 1000, 5 * 1000);
    }

    getData() {
        const self = this;

        return {
            publicSignal: self.game.publicSignal,
            privateSignals: self.game.players.map(p => { return p.S; })
        };
    }

    testComplete () {
        return this.complete;
    }
}

export default {
    create(game, wss) {
        return new Phase5(game, wss);
    }
}