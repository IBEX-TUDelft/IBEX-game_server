import WS from '../../../helpers/websocket.js';
import Utils from '../../../helpers/utils.js';

export default {
    create(game, wss) {
        const phase = {
            game: game,
            wss: wss,
            complete: false,
            onEnter: async function () {
                console.log('PHASE 1');

                const self = this;

                const boundaries = {
                    developer: {
                        noProject: {
                            low: self.game.parameters.developer_no_project_low,
                            high: self.game.parameters.developer_no_project_high
                        },
                        projectA: {
                            low: self.game.parameters.developer_project_a_low,
                            high: self.game.parameters.developer_project_a_high
                        },
                        projectB: {
                            low: self.game.parameters.developer_project_b_low,
                            high: self.game.parameters.developer_project_b_high
                        }
                    },
                    owner: {
                        noProject: {
                            low: self.game.parameters.owner_no_project_low,
                            high: self.game.parameters.owner_no_project_high
                        },
                        projectA: {
                            low: self.game.parameters.owner_project_a_low,
                            high: self.game.parameters.owner_project_a_high
                        },
                        projectB: {
                            low: self.game.parameters.owner_project_b_low,
                            high: self.game.parameters.owner_project_b_high
                        }
                    }
                }

                for (let i = 0; i < this.game.players.length; i++) {
                    const player = this.game.players[i];

                    const err = self.wss.sendEvent(self.game.id, player.number, "assign-role", {
                        "role": player.role,
                        "balance": player.balance,
                        "shares": player.shares,
                        "wallet": player.wallet,
                        "property": player.property,
                        "boundaries": boundaries,
                        "taxRate": self.game.parameters.tax_rate_initial
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

                self.wss.broadcastInfo(self.game.id, 'Wait for the developers and the owners to become acquainted with their property', 1);
                self.wss.broadcastInfo(self.game.id, 'Get acquainted with your property, starting any project may be quite profitable for you', 2);
                self.wss.broadcastInfo(self.game.id, 'Get acquainted with your property, notice that if a project will start, its value will decrease', 3);

                setTimeout(() => {
                    self.complete = true;
                }, 5000);

                console.log(this.game.players);
            },
            getData() {
                return {}
            },            
            onExit: async function () {
                
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
                    if (handler.role != ws.player.role) {
                        WS.error(ws, `Game ${message.gameId}: only ${handler.role} can send this message in this phase. You are ${ws.player.role}.`);
                        return;
                    } if (handler.role === 0) {
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