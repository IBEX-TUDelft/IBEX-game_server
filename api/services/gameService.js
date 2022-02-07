import gameRepository from '../repositories/gameRepository.js';
import gameParameterRepository from '../repositories/gameParameterRepository.js';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';
import gamePlayerRepository from '../repositories/gamePlayerRepository.js';
import gameRoundRepository from '../repositories/gameRoundRepository.js';
import Database from '../helpers/database.js'

export default {
    createGame: async function (gameParameters) {

        //1 Create the game
        const gameId = await gameRepository.create(gameParameters);

        //2 Create the parameters
        const parameters = [
            {key: "game_type", type: "string", value: gameParameters.game_type},
            {key: "round_count", type: "number", value: gameParameters.round_count},
            {key: "minutes_for_trading", type: "number", value: gameParameters.minutes_for_trading},
            {key: "minutes_for_sniping", type: "number", value: gameParameters.minutes_for_sniping},
            {key: "tax_rate_initial", type: "number", value: gameParameters.tax_rate.initial},
            {key: "tax_rate_final", type: "number", value: gameParameters.tax_rate.final},
            {key: "signal_low", type: "float", value: gameParameters.signal.low},
            {key: "signal_high", type: "float", value: gameParameters.signal.high},

            {key: "speculators_count", type: "number", value: gameParameters.speculators.count},
            {key: "speculator_balance", type: "number", value: gameParameters.speculators.balance},
            {key: "speculator_shares", type: "number", value: gameParameters.speculators.shares},
            {key: "max_lot_purchases", type: "number", value: gameParameters.speculators.max_lot_purchases},

            {key: "developers_count", type: "number", value: gameParameters.developers.count},
            {key: "developer_balance", type: "number", value: gameParameters.developers.balance},
            {key: "developer_shares", type: "number", value: gameParameters.developers.shares},
            {key: "developer_no_project_low", type: "number", value: gameParameters.developers.profit.no_project.low},
            {key: "developer_no_project_fixed", type: "number", value: gameParameters.developers.profit.no_project.fixed},
            {key: "developer_no_project_high", type: "number", value: gameParameters.developers.profit.no_project.high},
            {key: "developer_project_a_low", type: "number", value: gameParameters.developers.profit.project_a.low},
            {key: "developer_project_a_fixed", type: "number", value: gameParameters.developers.profit.project_a.fixed},
            {key: "developer_project_a_high", type: "number", value: gameParameters.developers.profit.project_a.high},
            {key: "developer_project_b_low", type: "number", value: gameParameters.developers.profit.project_b.low},
            {key: "developer_project_b_fixed", type: "number", value: gameParameters.developers.profit.project_b.fixed},
            {key: "developer_project_b_high", type: "number", value: gameParameters.developers.profit.project_b.high},

            {key: "owners_count", type: "number", value: gameParameters.owners.count},
            {key: "owner_balance", type: "number", value: gameParameters.owners.balance},
            {key: "owner_shares", type: "number", value: gameParameters.owners.shares},
            {key: "owner_no_project_low", type: "number", value: gameParameters.owners.profit.no_project.low},
            {key: "owner_no_project_fixed", type: "number", value: gameParameters.owners.profit.no_project.fixed},
            {key: "owner_no_project_high", type: "number", value: gameParameters.owners.profit.no_project.high},
            {key: "owner_project_a_low", type: "number", value: gameParameters.owners.profit.project_a.low},
            {key: "owner_project_a_fixed", type: "number", value: gameParameters.owners.profit.project_a.fixed},
            {key: "owner_project_a_high", type: "number", value: gameParameters.owners.profit.project_a.high},
            {key: "owner_project_b_low", type: "number", value: gameParameters.owners.profit.project_b.low},
            {key: "owner_project_b_fixed", type: "number", value: gameParameters.owners.profit.project_b.fixed},
            {key: "owner_project_b_high", type: "number", value: gameParameters.owners.profit.project_b.high}


        ];

        for (let i = 0; i < parameters.length; i++) {
            const parameter = parameters[i];

            console.log(`${parameter.key} (${parameter.type} vs ${typeof parameter.value}): ${parameter.value}`);

            if (parameter.type === 'number' && (parameter.value == null || parameter.value === "")) {
                continue;
            }

            parameter.gameId = gameId;

            const parameterId = await gameParameterRepository.create(parameter);
        }

        //3 Create the players
        /* Roles:
         *
         * 1: Speculator
         * 2: Developer
         * 3: Owner
         */
        const roles = [];
        const usedNames = [];

        for (let i = 0; i < gameParameters.speculators.count; i++) {
            roles.push(1);
        }

        for (let i = 0; i < gameParameters.developers.count; i++) {
            roles.push(2);
        }

        for (let i = 0; i < gameParameters.owners.count; i++) {
            roles.push(3);
        }

        const playersCount = roles.length;

        console.log('Creating players');

        for (let i = 0; i < playersCount; i++) {
            const role = roles.splice(Math.floor(Math.random() * roles.length), 1)[0];
            let name = null;

            while (name == null || usedNames.includes(name)) {
                name = uniqueNamesGenerator({
                    dictionaries: [colors],
                    style: "capital"
                });    
            }

            usedNames.push(name);

            let balance;
            let shares;

            switch (role) {
                case 1:
                    balance = gameParameters.speculators.balance;
                    shares = gameParameters.speculators.shares;
                    break;
                case 2:
                    balance = gameParameters.developers.balance;
                    shares = gameParameters.developers.shares;
                    break;
                case 3:
                    balance = gameParameters.owners.balance;
                    shares = gameParameters.owners.shares;
                    break;
            }

            const player = {
                name: name,
                recovery_string: uniqueNamesGenerator({
                    dictionaries: [adjectives, animals],
                    style: "lowerCase",
                    separator: " "
                }),        /* Roles:
                *
                * 1: Speculator
                * 2: Developer
                * 3: Owner
                */
                game_id: gameId,
                player_number: i + 1,
                balance: balance,
                shares: shares,
                player_role: role
            };

            await gamePlayerRepository.create(player);
        }

        return gameId;
    },
    deleteById: async function(gameId) {
        return await Database.transaction([
            {
                "query": gameRoundRepository.queries.deleteByGameId,
                "params": [gameId]
            },{
                "query": gamePlayerRepository.queries.deleteByGameId,
                "params": [gameId]
            },{
                "query": gameParameterRepository.queries.deleteByGameId,
                "params": [gameId]
            },{
                "query": gameRepository.queries.deleteById,
                "params": [gameId]
            }
        ]);
    },
    addPhaseData: async function(roundId, phaseNumber, phaseData) {
        let round;

        try {
            round = await gameRoundRepository.findById(roundId);

            if (round == null) {
                return `Round ${roundId} not found`;
            }

            const currentData = JSON.parse(round.data);

            if (currentData.phases == null) {
                currentData.phases = [];
            }

            currentData.phases.push({
                "number": phaseNumber,
                "data": phaseData
            });

            await gameRoundRepository.updateDataById(roundId, currentData);
        } catch (e) {
            console.error(`Could not update data of round ${roundId}`, e);
            if (round != null) {
                console.error('Previous data:');
                console.error(round.data);
            }
            console.error('Data to be integrated:');
            console.error(phaseData);

            return e.message;
        }

        return null;
    }
}
