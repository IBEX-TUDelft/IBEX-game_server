import gameRoundRepository from "../../repositories/gameRoundRepository.js";
import Utils from '../../helpers/utils.js';
import WS from '../../helpers/websocket.js';
import Phase0 from './phases/0.js';

export default {
    create(data) {
        return {
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

                //TODO
            },
            beginRound: async function() {
                let number = 1;

                if (data.currentRound != null) {
                    number = data.currentRound.number + 1;

                    this.data.rounds.push(this.data.currentRound);
                }

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