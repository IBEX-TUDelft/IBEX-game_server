import gameRoundRepository from "../../repositories/gameRoundRepository.js";
import Utils from '../../helpers/utils.js';
import WS from '../../helpers/websocket.js';
import Phase0 from './phases/0.js';
import Phase1 from './phases/1.js';

import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';

export default {
    create(data) {
        //Creating the properties 1 per owner

        data.properties = [];

        data.type = 'Harberger';

        data.players.forEach(player => {
            if (player.role === 3) {
                const property = {
                    id: data.properties.length + 1,
                    value: 100000,
                    owner: player.number,
                    name: uniqueNamesGenerator({
                        dictionaries: [adjectives, animals],
                        separator: " ",
                        style: "capital"
                    }) + " Estate",
                    v: []
                }

                player.property = property;

                for (let i = 0; i < data.players.length; i++) {
                    const guesser = data.players[i];

                    const vi = [];

                    for (let j = 0; j < 3; j++) {
                        if (guesser.role === 1) {
                            vi.push(0);
                        } else {
                            const delta = Math.round((property.value / 5 * 2) * Math.random() - property.value / 5);

                            vi.push(property.value + delta);
                        }
                    }

                    property.v.push(vi);
                }

                data.properties.push(property);
            }
        });

        return {
            phases: [Phase0, Phase1],
            data: data,
            wss: null,
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
                await this.data.currentPhase.onExit();

                if (this.data.currentRound.phase == 9) {
                    this.wss.broadcastEvent(data.id, "round-end", {
                        "round": this.data.currentRound.number
                    });
                    return;
                }

                this.data.currentRound.phase += 1;

                console.log(`Preparing phase ${this.data.currentRound.phase}`);

                console.log(this.phases);

                const Phase = this.phases[this.data.currentRound.phase];

                console.log(Phase);

                this.data.currentPhase = Phase.create(this.data, this.wss);
                
                await this.data.currentPhase.onEnter();

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
            }
        };
    }
}