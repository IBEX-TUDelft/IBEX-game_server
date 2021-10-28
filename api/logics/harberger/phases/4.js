import WS from '../../../helpers/websocket.js';
import Utils from '../../../helpers/utils.js';

export default {
    create(game, wss) {
        const phase = {
            game: game,
            wss: wss,
            complete: false,
            onEnter: async function () {
                console.log('PHASE 4');

                const self = this;

                self.wss.broadcastInfo(self.game.id, 'Reconciliation in progress ...');

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

                this.game.winningCondition = winningCondition;

                console.log(`The winning condition is ${winningCondition}, with a sum of ${winningSum}. Here the full list: ${self.game.D}`);

                // 3. resell lot under that condition

                self.game.properties.forEach(p => {
                    if (p.speculators == null) {
                        console.log(`No speculation on ${p.name} this phase under any condition`);
                        return;
                    }

                    const speculatorNumber = p.speculators[winningCondition];

                    if (speculatorNumber == null) {
                        console.log(`No speculation on ${p.name} this phase under the winning condition ${winningCondition}`);
                        return;
                    }
                    
                    const speculator = self.game.players.find(pl => pl.number === speculatorNumber);

                    if (speculator == null) {
                        console.log(`PLayer number ${speculatorNumber} not found`);
                        return;
                    }

                    const owner = self.game.players.find(pl => pl.number === p.owner);

                    if (owner == null) {
                        console.log(`PLayer number ${p.owner} not found`);
                        return;
                    }

                    const speculatorProfit = p.v[winningCondition] - Math.round(0.5 * (p.v[winningCondition] + p.d[winningCondition]));

                    if (speculatorProfit == 0)  {
                        console.log(`The owner of ${p.name} declared the exact value for that property. No profit/loss from this speculation`);
                        return;
                    }

                    if (speculator.profit == null) {
                        speculator.profit =  [];
                    }

                    speculator.profit.push({
                        "phase": 4,
                        "amount": speculatorProfit,
                        "context": {
                            "type": "speculation",
                            "property": {
                                "id": p.id,
                                "name": p.name
                            },
                            "condition": winningCondition
                        }
                    });

                    self.wss.sendEvent(
                        self.game.id,
                        speculator.number,
                        "speculation-with-profit",
                        {
                            "profit": speculatorProfit,
                            "property": {
                                "id": p.id,
                                "name": p.name
                            },
                            "condition": winningCondition
                        }
                    );

                    if (owner.profit == null) {
                        owner.profit = [];
                    }

                    owner.profit.push({
                        "phase": 4,
                        "amount": -speculatorProfit,
                        "context": {
                            "type": "speculation",
                            "property": {
                                "id": p.id,
                                "name": p.name
                            },
                            "condition": winningCondition
                        }
                    });

                    self.wss.sendEvent(
                        self.game.id,
                        owner.number,
                        "speculation-with-profit",
                        {
                            "profit": -speculatorProfit,
                            "property": {
                                "id": p.id,
                                "name": p.name
                            },
                            "condition": winningCondition
                        }
                    );
                });

                // 4. transition to the next phase

                setTimeout(() => {
                    self.complete = true;
                }, 5000);
            },
            getData() {
                return this.game.players.map(p => {
                    return {
                        "id": p.id,
                        "name": p.name,
                        "profit": p.profit,
                    }
                });
            },
            onExit: async function () {
                this.game.players.filter(p => p.role === 1).forEach(p => { p.doneSpeculating = false; });
                this.game.properties.forEach(p => { p.speculators = null; });
            },
            testComplete: async function () {
                return this.complete;
            },
            onMessage: async function(ws, message) {
                const handler = this.handlers.find(m => m.type === message.type);

                if (handler == null) {
                    WS.error(ws, `Game ${message.gameId} is full. You cannot join`);
                    return;
                }

                if (handler.role != null) {
                    if (!handler.role.includes(ws.player.role)) {
                        WS.error(ws, `Game ${message.gameId}: only ${handler.role} can send this message in this phase. You are ${ws.player.role}.`);
                        return;
                    }
                    
                    if (ws.player.role === 0) {
                        const verification = Utils.verifyJWT(message.token);
    
                        if (verification == null || verification.role != 0)  {
                            WS.error(ws, 'Could not verify your token');
                            return;
                        }
                    }
                }

                await handler.action(ws, message);

                return await this.testComplete();
            },
            init: function () {
            },
            handlers: []
        }

        phase.init();

        return phase;
    }
}