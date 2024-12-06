import { AppEvents, GameOver, PhaseTimeout, PlayerMessage, ServerMessage } from "./AppEvents.js";
import gameParameterRepository from "../repositories/gameParameterRepository.js";

import fs from 'fs';

export class GameRecorder {
    log = [];
    serverLog = [];

    constructor(gameId) {
        AppEvents.get(gameId).addListener(PlayerMessage, message => {
            this.log.push(message);
        });

        AppEvents.get(gameId).addListener(ServerMessage, message => {
            this.serverLog.push(message);
        });

        AppEvents.get(gameId).addListener(PhaseTimeout, message => {
            this.log.push({
                "content": message,
                "type": PhaseTimeout,
                "phase": message.phase,
                "round": message.round
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

            const dataset = {
                parameters,
                "log": this.log,
                "server-log": this.serverLog
            }

            const dir = '../records';

            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(`${dir}/${gameId}.log.json`, JSON.stringify(dataset));
        });
    }
}