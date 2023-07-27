import { AppEvents, GameOver, PhaseTimeout, PlayerMessage } from "./AppEvents.js";
import gameParameterRepository from "../repositories/gameParameterRepository.js";

import fs from 'fs';

export class GameRecorder {
    log = [];

    constructor(gameId) {
        AppEvents.get(gameId).addListener(PlayerMessage, message => {
            this.log.push(message);
        });

        AppEvents.get(gameId).addListener(PhaseTimeout, message => {
            this.log.push({
                "content": message,
                "type": PhaseTimeout,
                "phase": message.phase,
                "round": message.round
            });
        });

        AppEvents.get(gameId).addListener(GameOver, async () => {
            const parameters = await gameParameterRepository.findByGameId(gameId);

            const dataset = {
                parameters,
                "log": this.log
            }

            fs.writeFileSync(`../records/${gameId}.log.json`, JSON.stringify(dataset));
        });
    }
}