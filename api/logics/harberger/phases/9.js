import WS from '../../../helpers/websocket.js';
import Utils from '../../../helpers/utils.js';

export default {
    create(game, wss) {
        const phase = {
            game: game,
            wss: wss,
            onEnter: async function () {
                console.log('PHASE 9');

                const self = this;

                self.wss.broadcastInfo(self.game.id, `Final phase. Tax rate: ${this.game.parameters.tax_rate_final}`);

                // 1. reconciliation

                // a. calculate D

                self.game.D = [0,0,0];

                self.game.properties.forEach(p => {
                    for (let j = 0; j < 3; j++) {
                        self.game.D[j] += p.d[j];
                    }
                });

                // b. determine the winning condition

                let winningCondition = null;
                let winningSum = 0;

                for(let j = 0; j < 3; j++) {
                    if (self.game.D[j] > winningSum) {
                        winningSum = self.game.D[j];
                        winningCondition = j;
                    }
                }

                console.log(`The winning condition is ${winningCondition}, with a sum of ${winningSum}. Here the full list: ${self.game.D}`);

                // c. resell lot under that condition

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
                        console.log(`Player number ${p.owner} not found`);
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
                        "phase": 9,
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
                        "phase": 9,
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

                // 2. tax rate declared

                const taxPot = winningSum * this.game.parameters.tax_rate_final / 100;

                console.log(`Total taxes: ${taxPot}`);

                const totalShares = this.game.players.reduce((acc, p2) => acc + p2.shares, 0);

                console.log(`Total shares: ${totalShares}`);

                this.game.players.forEach(player => {
                    if (player.profit == null) {
                        player.profit = [];
                    }

                    player.profit.push({
                        "phase": 9,
                        "amount": Math.round(taxPot * player.shares / totalShares + player.balance - self.game.parameters.owner_balance),
                        "context": {
                            "type": "tax-income",
                            "condition": winningCondition
                        }
                    });

                    self.wss.sendEvent(
                        self.game.id,
                        player.number,
                        "tax-income",
                        {
                            "amount": Math.round(taxPot * player.shares / totalShares + player.balance - self.game.parameters.owner_balance),
                            "condition": winningCondition
                        }
                    );

                    console.log(player.profit);
                });

                this.game.players.forEach(player => {
                    const profit = player.profit.reduce((acc, p2) => acc + p2.amount, 0);

                    self.wss.sendEvent(
                        self.game.id,
                        player.number,
                        "total-profit",
                        {
                            "amount": profit
                        }
                    );
                });
            },
            onExit: async function () {
            },
            testComplete: async function () {
                return false;
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