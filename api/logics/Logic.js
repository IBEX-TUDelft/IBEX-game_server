import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';

import GameRoundRepository from '../repositories/gameRoundRepository.js';
import GameRepository from '../repositories/gameRepository.js';
import GameService from "../services/gameService.js";
import Utils from '../helpers/utils.js';
import WS from '../helpers/websocket.js';
import fs from 'fs';
import { AppEvents, GameOver, PhaseBegins, PhaseComplete, PhaseTimeout, ResultsSaved } from '../helpers/AppEvents.js';
import { GameRecorder } from '../helpers/GameRecorder.js';

export default class {

    valueSeries = null;
    signalSeries = null;
    over = false;
    data;
    phases;
    wss = null;
    phaseCheckingInterval = null;
    recorder;

    constructor (data, phases, type, record) {
        if (data == null) {
            throw new Error('Game data is null');
        }

        if (phases == null) {
            throw new Error('Game phase classes not present');
        }

        const allowedTypes = ['Harberger', 'Futarchy', 'Voting', 'Market', 'GoodsMarket'];

        if (!allowedTypes.includes(type)) {
            throw new Error(`Allowed types: ${allowedTypes.join(', ')}. It was ${type}`);
        }

        const sessions = JSON.parse(fs.readFileSync('./resources/sessions.json'));

        if (type != 'Market' && type != 'GoodsMarket') {
            const session = sessions.find(s => s.id === data.parameters.session_number);

            data.dataset = data.parameters.session_number;

            this.valueSeries = session.rounds.map(r => r.values);
            this.signalSeries = session.rounds.map(r => r.signals);
        }

        this.data = data;
        this.phases = phases;
        this.data.type = type;
        this.data.properties = [];

        if (record === true) {
            this.recorder = new GameRecorder(this.data.id);
        }
    }

    alphabet = "abcdefghijklmnopqrstuvwxyz".toUpperCase();

    generatePaymentToken() {
        return this.alphabet[Math.floor(Math.random() * this.alphabet.length)] +
            this.alphabet[Math.floor(Math.random() * this.alphabet.length)];
    }

    async init () {
        const self = this;

        const rawProjects = fs.readFileSync('./resources/projects.json');
        this.data.conditions = JSON.parse(rawProjects);

        const paymentTokens = [];

        if (!['market', 'goods-market'].includes(self.data.parameters.game_type) ) {
            self.data.players.forEach(player => {
                let paymentToken = self.generatePaymentToken();
                
                while (paymentTokens.includes(paymentToken)) {
                    paymentToken = self.generatePaymentToken();
                }

                paymentTokens.push(paymentToken);

                player.paymentToken = paymentToken;

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
        }

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
    }

    async start (wss, record) {
        this.wss = wss;

        this.data.startTime = new Date().toLocaleString('nl', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'})

        if (this.data.parameters.practice_round === false) {
            this.data.results.push({
                "round": 0,
                "phase": []
            });
        }

        AppEvents.get(this.data.id).addListener(PhaseTimeout, (data) => {
            console.log(`Event ${PhaseTimeout} received with args: ${JSON.stringify(data)}`);

            if (data != null && data.phase != null && data.phase != this.data.currentRound.phase) {
                console.log(`In phase ${this.data.currentRound.phase}, gotten a ${PhaseTimeout} event from a different phase: ${data.phase}`)
                return;
            }

            this.nextPhase();
        });

        AppEvents.get(this.data.id).addListener(PhaseComplete, async (data) => {
            console.log(`Event ${PhaseComplete} received with args:`);

            if (data != null && data.number != null && data.number != this.data.currentRound.phase) {
                console.log(`In phase ${this.data.currentRound.phase}, gotten a ${PhaseComplete} event from a different phase: ${data.number}`)
                return;
            }

            await this.nextPhase();
        });

        await this.beginRound();
    }

    async nextPhase () {
        if (this.phaseCheckingInterval != null) {
            clearInterval(this.phaseCheckingInterval);
        }

        await this.data.currentPhase.onExit();

        this.data.results[this.data.results.length - 1].phase.push(this.data.currentPhase.results);

        const event = {
            "round": this.data.currentRound.number,
            "phase": this.data.currentRound.phase
        };

        AppEvents.get(this.data.id).emit(ResultsSaved, event);

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

        if (Phase.create != null) {
            this.data.currentPhase = Phase.create(this.data, this.wss, this.data.currentRound.phase);
        } else {
            this.data.currentPhase = new Phase(this.data, this.wss, this.data.currentRound.phase);
        }

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

        AppEvents.get(this.data.id).emit(PhaseBegins, {
           "phase": this.data.currentRound.phase,
           "round": this.data.currentRound.number
        });

        await this.data.currentPhase.updateAndTest();
    }

    async beginRound () {
        const self = this;

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
        
        if (number > this.data.parameters.round_count ) {
            console.log('The game is over');

            if (this.data.parameters.show_up_fee != null ) { //Reward mode on
                let chosenRound = this.data.parameters.simulation_reward_round;

                if (chosenRound == null) {
                    chosenRound = Math.floor(Math.random() * this.data.parameters.round_count) + 1;
                    console.log('Reward round drawn randomly');
                } else {
                    console.log('Reward round comes from the simulation dataset parameters');
                }

                this.data.rewardRound = chosenRound;

                const showupFee = this.data.parameters.show_up_fee;

                const rewards = [];

                this.data.players.forEach(p => {
                    if (this.data.parameters.game_type != 'market') {
                        let factor;
                        let basePoints;

                        switch(p.role) {
                            case 1:
                                factor = this.data.parameters.speculators_reward_scale_factor;
                                basePoints = this.data.parameters.speculators_base_points;
                                break;
                            case 2:
                                factor = this.data.parameters.developers_reward_scale_factor;
                                basePoints = this.data.parameters.developers_base_points;
                                break;
                            case 3:
                                factor = this.data.parameters.owners_reward_scale_factor;
                                basePoints = this.data.parameters.owners_base_points;
                                break;
                            default:
                                throw new Error(`Player ${p.number} role not clear: ${p.role}`);
                        }

                        const profit = self.getProfit(p.number, chosenRound);

                        const points = basePoints + profit;

                        const reward = {
                            "number": p.number,
                            "round": chosenRound,
                            "reward": Math.round(points * 100 / factor) / 100 + showupFee,
                            "basePoints": basePoints,
                            "showupFee": showupFee,
                            "gameFee": Math.round(points * 100 / factor) / 100,
                            "profit": profit,
                            "points": points,
                            "factor": factor,
                            "exchange": Math.round(1000000 / factor) / 1000000,
                            "paymentToken": p.paymentToken
                        };

                        const err = self.wss.sendEvent(
                            self.data.id,
                            p.number,
                            "reward",
                            reward
                        );
            
                        if (err != null) {
                            console.error(err);
                        }

                        rewards.push(reward);
                    }
                });

                this.data.rewards = rewards;

                AppEvents.get(this.data.id).emit(GameOver, chosenRound);
            } else {
                AppEvents.get(this.data.id).emit(GameOver, 1);
            }

            this.wss.broadcastEvent(this.data.id, "game-over", {});

            this.over = true;
            clearInterval(this.phaseCheckingInterval);
            
            await GameRepository.saveData(this.data.id, this.data);
            await GameRepository.endGame(this.data.id);

            await this.backup();

            return;
        } else {
            this.refreshWallet();
        }
        
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

        this.data.currentPhase = this.phases[0].create(this.data, this.wss, 0);

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

        AppEvents.get(this.data.id).emit(PhaseBegins, {
            "phase": this.data.currentRound.phase,
            "round": this.data.currentRound.number
        });
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

    //Always overwritten
    getProfit(playerNumber, round) {
        throw new Error('Method getProfit must always be overwritten');
    }

    getExpectation(playerNumber, round) {
        throw new Error('Method getExpectation must always be overwritten');
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

    async backup() {
        const game = await GameRepository.findOne(this.data.id);

        const data = JSON.parse(game.game_data);

        data.endedAt = game.ended_at;

        const dir = '../backup';

        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(`${dir}/${this.data.id}.json`, JSON.stringify(data));
    }
}