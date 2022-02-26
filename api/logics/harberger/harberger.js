import gameRoundRepository from "../../repositories/gameRoundRepository.js";
import gameRepository from "../../repositories/gameRepository.js";
import gameService from "../../services/gameService.js";
import Utils from '../../helpers/utils.js';
import WS from '../../helpers/websocket.js';
import Phase0 from './phases/0.js';
import Phase1 from './phases/1.js';
import Phase2 from './phases/2.js';
import Phase3 from './phases/3.js';
import Phase4 from './phases/4.js';
import Phase5 from './phases/5.js';
import Phase6 from './phases/6.js';
import Phase7 from './phases/7.js';
import Phase8 from './phases/8.js';
import Phase9 from './phases/9.js';

import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';

export default {
    async create(data) {
        //Creating the properties 1 per owner

        data.properties = [];

        data.type = 'Harberger';

        data.players.forEach(player => {
            player.S = [0, 0, 0];

            if (player.role != 2 && player.role != 3) {
                console.log(`Not assigning a property to ${player.name}, because its role (${player.role}, ${typeof player.role}) is not 2 or 3`);
                return;
            }

            const property = {
                id: data.properties.length + 1,
                owner: player.number,
                name: uniqueNamesGenerator({
                    dictionaries: [adjectives, animals],
                    separator: " ",
                    style: "capital"
                }) + " Lot",
                v: []
            }

            player.property = property;

            let value;

            if (player.role === 2) {
                value = {
                    noProject: {
                        low: data.parameters.developer_no_project_low,
                        fixed: data.parameters.developer_no_project_fixed,
                        high: data.parameters.developer_no_project_high
                    },
                    projectA: {
                        low: data.parameters.developer_project_a_low,
                        fixed: data.parameters.developer_project_a_fixed,
                        high: data.parameters.developer_project_a_high
                    },
                    projectB: {
                        low: data.parameters.developer_project_b_low,
                        fixed: data.parameters.developer_project_b_fixed,
                        high: data.parameters.developer_project_b_high
                    }
                }
            } else if (player.role === 3) {
                value = {
                    noProject: {
                        low: data.parameters.owner_no_project_low,
                        fixed: data.parameters.owner_no_project_fixed,
                        high: data.parameters.owner_no_project_high
                    },
                    projectA: {
                        low: data.parameters.owner_project_a_low,
                        fixed: data.parameters.owner_project_a_fixed,
                        high: data.parameters.owner_project_a_high
                    },
                    projectB: {
                        low: data.parameters.owner_project_b_low,
                        fixed: data.parameters.owner_project_b_fixed,
                        high: data.parameters.owner_project_b_high
                    }
                }
            }

            const conditions = ['noProject', 'projectA', 'projectB'];

            for (let j = 0; j < 3; j++) {
                const boundaries = value[conditions[j]];

                let vj;

                if (boundaries.fixed != null) {
                    vj = boundaries.fixed;
                } else {
                    vj = boundaries.low + Math.round((boundaries.high - boundaries.low) / 5000 * Math.random()) * 5000;
                }

                property.v.push(vj);
            }

            data.properties.push(property);
        });

        data.V = [0, 0, 0];

        data.properties.forEach(p => {
            for (let j = 0; j < 3; j++) {
                data.V[j] += p.v[j];
            }    
        });

        console.log(`V = ${data.V}`);

        //TODO: for the moment the signals are pregenerated and last for the whole game. Shall we regenerate them at each turn?
        for (let i = 0; i < data.players.length; i++) {
            const player = data.players[i];

            for (let j = 0; j < 3; j++) {
                const delta = (data.parameters.signal_high - data.parameters.signal_low) * Math.random();

                const coefficient = data.parameters.signal_low + delta;

                console.log(`delta1 = ${delta}, coefficient1 = ${coefficient}`);

                const normalizedTaxRate = data.parameters.tax_rate_final / 100;

                player.S[j] = Math.round(data.V[j] * coefficient * normalizedTaxRate / 100);
            }

            console.log(`${player.name} S = ${player.S}`);
        }

        await gameRepository.saveData(data.id, data);

        return {
            phases: [Phase0, Phase1, Phase2, Phase3, Phase4,
                Phase5, Phase6, Phase7, Phase8, Phase9],
            data: data,
            wss: null,
            phaseCheckingInterval: null,
            results: [],
            pushMessage: async function(ws, message) {
                if (message.type === 'watch') {
                    const verification = Utils.verifyJWT(message.token);
    
                    if (verification == null || verification.role != 0)  {
                        WS.error(ws, 'Could not verify your token');
                        return;
                    }

                    this.wss.watchGame(ws, data.id); //This admin ws will receive updates

                    return;
                }

                const transition = await this.data.currentPhase.onMessage(ws, message);

                if (transition) {
                    await this.nextPhase();
                }
            },
            start: async function (wss) {
                this.wss = wss;

                await this.beginRound();
            },
            nextPhase: async function() {
                if (this.phaseCheckingInterval != null) {
                    clearInterval(this.phaseCheckingInterval);
                }

                await this.data.currentPhase.onExit();

                this.results.push(this.data.currentPhase.results);

                console.log(`Phase ${this.data.currentRound.phase} results:`);
                console.log(this.data.currentPhase.results);

                await gameService.addPhaseData(
                    this.data.currentRound.id,
                    this.data.currentRound.phase,
                    this.data.currentPhase.getData()
                );

                if (this.data.currentRound.phase == 9) {
                    this.wss.broadcastEvent(data.id, "round-end", {
                        "round": this.data.currentRound.number
                    });
                    return;
                }

                this.data.currentRound.phase += 1;

                console.log(`Preparing phase ${this.data.currentRound.phase}`);

                const Phase = this.phases[this.data.currentRound.phase];

                this.data.currentPhase = Phase.create(this.data, this.wss);
                
                await this.data.currentPhase.onEnter();

                await gameRepository.saveData(data.id, data);

                let err = this.wss.broadcastEvent(data.id, "phase-transition", {
                    "round": this.data.currentRound.number,
                    "phase": this.data.currentRound.phase
                });

                if (err != null) {
                    console.error(err);
                }

                err = this.wss.broadcastNotice(data.id, `Phase ${this.data.currentRound.phase} has begun.`);

                if (err != null) {
                    console.error(err);
                }

                const self = this;

                this.phaseCheckingInterval = setInterval(async () => {
                    const transition = await self.data.currentPhase.testComplete();

                    if (transition) {
                        try {
                            await self.nextPhase();
                        } catch(e) {
                            console.error(`Could not transition to phase ${self.data.currentRound.phase}`, e);
                        }
                    }
                }, 5000);
            },
            beginRound: async function() {
                let number = 1;

                if (this.data.currentRound != null) {
                    number = this.data.currentRound.number + 1;

                    this.data.rounds.push(this.data.currentRound);
                }

                const data = this.data;

                const roundId = await gameRoundRepository.create({
                    "number": number,
                    "phase": 0,
                    "gameId": data.id
                });

                this.data.currentRound = {
                    "id": roundId,
                    "number": number,
                    "phase": 0,
                    "gameId": data.id
                }

                this.data.currentPhase = Phase0.create(this.data, this.wss);

                await this.data.currentPhase.onEnter();

                await gameRepository.saveData(data.id, data);
            }
        };
    }
}