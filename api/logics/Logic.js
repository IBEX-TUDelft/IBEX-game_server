import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';

import GameRoundRepository from '../repositories/gameRoundRepository.js';
import GameRepository from '../repositories/gameRepository.js';
import GameService from "../services/gameService.js";
import Utils from '../helpers/utils.js';
import WS from '../helpers/websocket.js';
import fs from 'fs';

export default class {

    valueSeries = null;
    signalSeries = null;
    over = false;
    data;
    phases;
    wss = null;
    phaseCheckingInterval = null;

    constructor (data, phases, type) {
        if (data == null) {
            throw new Error('Game data is null');
        }

        if (phases == null) {
            throw new Error('Game phase classes not present');
        }

        if (!['Harberger', 'Futarchy', 'Voting'].includes(type)) {
            throw new Error(`The game type must be Harberger, Futarchy or Voting. It was ${type}`);
        }

        this.valueSeries = JSON.parse(fs.readFileSync('./resources/values.json'));
        this.signalSeries = JSON.parse(fs.readFileSync('./resources/signals.json'));

        this.data = data;
        this.phases = phases;
        this.data.type = type;
        this.data.properties = [];
    }

    async init () {
        const self = this;

        const rawProjects = fs.readFileSync('./resources/projects.json');
        this.data.conditions = JSON.parse(rawProjects);

        self.data.players.forEach(player => {
            player.summaries = [];

            switch (player.role) {
                case 1:
                    player.tag = `Speculator ${player.number - self.data.players.filter(p => p.role === 3).length - 1}`;
                    break;
                case 2:
                    player.tag = `Developer`;
                    break;
                case 3:
                    if (player.number === 1) {
                        player.tag = `Owner 1`;
                    } else {
                        player.tag = `Owner ${player.number - 1}`;
                    }
                    break;
                default:
                    throw new Error(`Player with unexpected role (should be 1, 2 or 3): ${player.role}`);
            }

            if (self.data.type != 'Voting') {
                player.S = [0, 0, 0];
            }

            if (player.role != 2 && player.role != 3) {
                console.log(`Not assigning a property to ${player.name}, because its role (${player.role}, ${typeof player.role}) is not 2 or 3`);
                return;
            }

            const property = {
                id: self.data.properties.length + 1,
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
                        low: self.data.parameters.developer_no_project_low,
                        fixed: self.data.parameters.developer_no_project_fixed,
                        high: self.data.parameters.developer_no_project_high
                    },
                    projectA: {
                        low: self.data.parameters.developer_project_a_low,
                        fixed: self.data.parameters.developer_project_a_fixed,
                        high: self.data.parameters.developer_project_a_high
                    },
                    projectB: {
                        low: self.data.parameters.developer_project_b_low,
                        fixed: self.data.parameters.developer_project_b_fixed,
                        high: self.data.parameters.developer_project_b_high
                    }
                }
            } else if (player.role === 3) {
                value = {
                    noProject: {
                        low: self.data.parameters.owner_no_project_low,
                        fixed: self.data.parameters.owner_no_project_fixed,
                        high: self.data.parameters.owner_no_project_high
                    },
                    projectA: {
                        low: self.data.parameters.owner_project_a_low,
                        fixed: self.data.parameters.owner_project_a_fixed,
                        high: self.data.parameters.owner_project_a_high
                    },
                    projectB: {
                        low: self.data.parameters.owner_project_b_low,
                        fixed: self.data.parameters.owner_project_b_fixed,
                        high: self.data.parameters.owner_project_b_high
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

            self.data.properties.push(property);
        });

        this.data.results = [];

        await GameRepository.saveData(self.data.id, self.data);
    }

    async pushMessage (ws, message) {
        if (message.type === 'watch') {
            const verification = Utils.verifyJWT(message.token);

            if (verification == null || verification.role != 0)  {
                WS.error(ws, 'Could not verify your token');
                return;
            }

            this.wss.watchGame(ws, data.id); //This admin ws will receive updates

            return;
        }

        if (this.over) {
            return;
        }

        const transition = await this.data.currentPhase.onMessage(ws, message);

        if (transition) {
            await this.nextPhase();
        }
    }

    async start (wss) {
        this.wss = wss;

        this.data.startTime = new Date().toLocaleString('nl', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'})

        if (this.data.parameters.practice_round === false) {
            this.data.results.push({
                "round": 0,
                "phase": []
            });
        }

        await this.beginRound();
    }

    async nextPhase () {
        if (this.phaseCheckingInterval != null) {
            clearInterval(this.phaseCheckingInterval);
        }

        await this.data.currentPhase.onExit();

        this.data.results[this.data.results.length - 1].phase.push(this.data.currentPhase.results);

        console.log(`Phase ${this.data.currentRound.phase} results:`);
        console.log(this.data.currentPhase.results);

        await GameService.addPhaseData(
            this.data.currentRound.id,
            this.data.currentRound.phase,
            this.data.currentPhase.getData()
        );

        if (this.data.currentRound.phase === this.phases.length - 1) {
            this.wss.broadcastEvent(this.data.id, "round-end", {
                "round": this.data.currentRound.number
            });
            
            console.log('Beginning a new round');

            await this.beginRound();
            
            return;
        }

        this.data.currentRound.phase += 1;

        console.log(`Preparing phase ${this.data.currentRound.phase}`);

        const Phase = this.phases[this.data.currentRound.phase];

        this.data.currentPhase = Phase.create(this.data, this.wss);
        
        await this.data.currentPhase.onEnter();

        console.log(`Phase ${this.data.currentRound.phase} of round ${this.data.currentRound.number} complete? ${this.data.currentPhase.testComplete()}`)

        await GameRepository.saveData(this.data.id, this.data);

        const evData = {
            "round": this.data.currentRound.number,
            "phase": this.data.currentRound.phase
        };

        let err = this.wss.broadcastEvent(this.data.id, "phase-transition", evData);

        if (err != null) {
            console.error(err);
        }

        err = this.wss.broadcastNotice(this.data.id, `Phase ${this.data.currentRound.phase} has begun.`);

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
    }

    async beginRound () {
        let number;

        if (this.data.currentRound != null) {
            this.addSummaries();

            number = this.data.currentRound.number + 1;

            this.data.rounds.push(this.data.currentRound);
        } else {
            if (this.data.parameters.practice_round === false) {
                number = 1;
            } else {
                number = 0;
            }
        }

        this.refreshWallet();
        
        let ownerCounter = 0;
        let speculatorCounter = 0;

        this.data.players.forEach(p => {
            if (p.role === 1) {
                if (this.data.type != 'Voting') {
                    p.S[0] = parseInt(this.signalSeries[number][0].speculator[speculatorCounter]);
                    p.S[1] = parseInt(this.signalSeries[number][1].speculator[speculatorCounter]);
                }

                speculatorCounter ++;
            } if (p.role === 2) {
                p.property.v[0] = parseInt(this.valueSeries[number][0].developer) * 1000;
                p.property.v[1] = parseInt(this.valueSeries[number][1].developer) * 1000;

                if (this.data.type != 'Voting') {
                    p.S[0] = parseInt(this.signalSeries[number][0].developer);
                    p.S[1] = parseInt(this.signalSeries[number][1].developer);
                }
            } else if (p.role === 3) {
                p.property.v[0] = parseInt(this.valueSeries[number][0].owner[ownerCounter]) * 1000;
                p.property.v[1] = parseInt(this.valueSeries[number][1].owner[ownerCounter]) * 1000;

                if (this.data.type != 'Voting') {
                    p.S[0] = parseInt(this.signalSeries[number][0].owner[ownerCounter]);
                    p.S[1] = parseInt(this.signalSeries[number][1].owner[ownerCounter]);
                }

                ownerCounter ++;
            }
        });

        //The pregenerated private signals are overridden with dynamically computed ones, that take in account the amount of players in game
        if (this.data.type != 'Voting' && this.data.parameters.generate_signals === true) {
            let V = [];

            for (let j = 0; j < 2; j++) {
                V[j] = 0;

                this.data.properties.forEach(p => {
                    V[j] += p.v[j];
                });
            }

            for (let i = 0; i < this.data.players.length; i++) {
                const player = this.data.players[i];

                for (let j = 0; j < 2; j++) {
                    const delta = (this.data.parameters.signal_high - this.data.parameters.signal_low) * Math.random();

                    const coefficient = this.data.parameters.signal_low + delta;

                    console.log(`delta1 = ${delta}, coefficient1 = ${coefficient}`);

                    const normalizedTaxRate = this.data.parameters.tax_rate_final / 100;

                    player.S[j] = Math.round(V[j] * coefficient * normalizedTaxRate / 100);
                }

                console.log(`${player.name} S = ${player.S}`);
            }
        }

        if (number > this.data.parameters.round_count ) {
            console.log('The game is over');
            this.wss.broadcastEvent(this.data.id, "game-over", {});
            this.over = true;
            clearInterval(this.phaseCheckingInterval);
            
            return;
        }

        this.data.results.push({
            "round": number,
            "phase": []
        });

        const data = this.data;

        const roundId = await GameRoundRepository.create({
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

        console.log('Data saved');

        this.data.currentPhase = this.phases[0].create(this.data, this.wss);

        console.log('Phase created');

        let err = this.wss.broadcastEvent(this.data.id, "phase-transition", {
            "round": this.data.currentRound.number,
            "phase": this.data.currentRound.phase
        });

        if (err) {
            console.error(err);
        }

        await this.data.currentPhase.onEnter();

        console.log('Should have entered the new phase');

        await GameRepository.saveData(data.id, data);
    }

    refreshWallet() {
        const self = this;

        self.data.players.forEach(player => {
            if (self.data.type != 'Voting') {
                player.wallet = [
                    {
                        "balance": player.balance,
                        "shares": player.shares,
                        "cashForSniping": player.cashForSniping
                    }, {
                        "balance": player.balance,
                        "shares": player.shares,
                        "cashForSniping": player.cashForSniping
                    }, {
                        "balance": player.balance,
                        "shares": player.shares,
                        "cashForSniping": player.cashForSniping
                    }
                ];
            }
        });
    }

    getRecoveryData(number) {
        return {
        };
    }

    getSummary(number) {
        return {
        };
    }

    getSummaries(number) {
        const playerData = this.data.players.find(p => p.number === number);

        return playerData.summaries == null ? [] : playerData.summaries.filter(s => s.round != 0).reverse();
    }

    addSummaries() {
        console.log(`Adding summaries (round ${this.data.currentRound.number})`);

        const self = this;

        this.data.players.forEach(player => {
            const playerSummary = self.getSummary(player.number);

            playerSummary.round = self.data.currentRound.number;

            if (player.summaries == null) {
                player.summaries = [];
            }

            player.summaries.push(playerSummary);

            const err = self.wss.sendEvent(
                self.data.id,
                player.number,
                "round-summary",
                playerSummary
            );

            if (err != null) {
                console.error(err);
            }    
        })
    }
}