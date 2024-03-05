import { AppEvents, GameBegins, GameOver, PhaseTimeout, PlayerMessage } from "./AppEvents.js";
import gameParameterRepository from "../repositories/gameParameterRepository.js";

import fs from 'fs';

export class GameRecorder {
    log = [];

    constructor(gameId) {
        AppEvents.get(gameId).addListener(GameBegins, () => {
            this.log.push({
                "content": {},
                "type": GameBegins,
                "phase": 0,
                "round": 1,
                "time": Date.now()
            });
        });

        AppEvents.get(gameId).addListener(PlayerMessage, message => {
            this.log.push(message);
        });

        AppEvents.get(gameId).addListener(PhaseTimeout, message => {
            this.log.push({
                "content": message,
                "type": PhaseTimeout,
                "phase": message.phase,
                "round": message.round,
                "time": Date.now()
            });
        });

        AppEvents.get(gameId).addListener(GameOver, async (rewardRound) => {
            const parameters = await gameParameterRepository.findByGameId(gameId);

            parameters.push({
                "key": "simulation_parent_id",
                "type": "number",
                "value": gameId.toString()
            });

            parameters.push({
                "key": "simulation_reward_round",
                "type": "number",
                "value": rewardRound.toString()
            });

            parameters.push({
                "key": "impersonation_mode_compatible",
                "type": "boolean",
                "value": "true"
            });

            const dataset = {
                parameters,
                "log": this.log
            }

            fs.writeFileSync(`../records/${gameId}.log.json`, JSON.stringify(dataset));
        });
    }
}