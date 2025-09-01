import gameRepository from '../repositories/gameRepository.js';
import gameParameterRepository from '../repositories/gameParameterRepository.js';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';
import gamePlayerRepository from '../repositories/gamePlayerRepository.js';
import gameRoundRepository from '../repositories/gameRoundRepository.js';
import Database from '../helpers/database.js'
import fs from 'fs';

export default {
    createGame: async function (gameParameters) {

        //1 Create the game
        const gameId = await gameRepository.create(gameParameters);

        let parameters;

        //2 Create the parameters

        if (gameParameters.game_type === 'goods-market') {
            parameters = [
                {key: "game_type", type: "string", value: gameParameters.game_type},
                {key: "player_max_number", type: "number", value: gameParameters.player_max_number},
                {key: "player_min_number", type: "number", value: gameParameters.player_min_number},
                {key: "use_bots", type: "boolean", value: gameParameters.use_bots},
                {key: "bad_quality_ratio", type: "number", value: gameParameters.bad_quality_ratio},
                {key: "cash_per_player", type: "number", value: gameParameters.cash_per_player},
                {key: "high_quality_value", type: "number", value: gameParameters.high_quality_value},
                {key: "high_quality_delta", type: "number", value: gameParameters.high_quality_delta},
                {key: "low_quality_value", type: "number", value: gameParameters.low_quality_value},
                {key: "low_quality_delta", type: "number", value: gameParameters.low_quality_delta},
                {key: "timer_phase_1", type: "number", value: gameParameters.timer_phase_1},
                {key: "round_count", type: "number", value: 1},
                {key: "practice_round", type: "boolean", value: false}
            ]
        } else if (gameParameters.game_type === 'market') {
            parameters = [
                {key: "round_count", type: "number", value: 1}, //TODO: decide in game?
                {key: "practice_round", type: "boolean", value: false}, //TODO: decide in game?
                {key: "game_type", type: "string", value: gameParameters.game_type},
                {key: "player_max_number", type: "number", value: gameParameters.player_max_number},
                {key: "player_min_number", type: "number", value: gameParameters.player_min_number},
                {key: "use_bots", type: "boolean", value: gameParameters.use_bots},
                {key: "shares_per_player", type: "number", value: gameParameters.shares_per_player},
                {key: "cash_per_player", type: "number", value: gameParameters.cash_per_player},
                {key: "market_timer", type: "number", value: gameParameters.market_timer},
                {key: "distribution_type", type: "string", value: gameParameters.distribution_type},
                {key: "players_knowing_private_signal", type: "number", value: gameParameters.players_knowing_private_signal},
                {key: "players_knowing_public_signal", type: "number", value: gameParameters.players_knowing_public_signal},
                {key: "players_knowing_both_signals", type: "number", value: gameParameters.players_knowing_both_signals},
                {key: "players_knowing_no_signal", type: "number", value: gameParameters.players_knowing_no_signal},
                {key: "seller_transaction_cost", type: "number", value: gameParameters.seller_transaction_cost},
                {key: "buyer_transaction_cost", type: "number", value: gameParameters.buyer_transaction_cost},
                {key: "mean", type: "number", value: gameParameters.mean},
                {key: "variance", type: "number", value: gameParameters.variance},
                {key: "linear_min", type: "number", value: gameParameters.linear_min},
                {key: "linear_max", type: "number", value: gameParameters.linear_max},
                {key: "signal_error", type: "number", value: gameParameters.signal_error}
            ];
        } else {
            parameters = [
                {key: "game_type", type: "string", value: gameParameters.game_type},
                {key: "session_number", type: "number", value: gameParameters.session_number},
                {key: "round_count", type: "number", value: gameParameters.round_count},
                {key: "practice_round", type: "boolean", value: gameParameters.practice},
                {key: "minutes_for_trading", type: "number", value: gameParameters.minutes_for_trading},
                {key: "minutes_for_sniping", type: "number", value: gameParameters.minutes_for_sniping},
                {key: "tax_rate_initial", type: "number", value: gameParameters.tax_rate.initial},
                {key: "tax_rate_final", type: "number", value: gameParameters.tax_rate.final},
                {key: "signal_low", type: "float", value: gameParameters.signal.low},
                {key: "signal_high", type: "float", value: gameParameters.signal.high},
                {key: "generate_signals", type: "boolean", value: gameParameters.signal.generate},
                {key: "agents_only", type: "boolean", value: gameParameters.agents_only},

                {key: "speculators_count", type: "number", value: gameParameters.speculators.count},
                {key: "speculator_balance", type: "number", value: gameParameters.speculators.balance},
                {key: "speculator_shares", type: "number", value: gameParameters.speculators.shares},
                {key: "max_lot_purchases", type: "number", value: gameParameters.speculators.max_lot_purchases},
                {key: "cash_for_snipers", type: "number", value: gameParameters.speculators.cash_for_snipers},
                {key: "speculators_base_points", type: "number", value: gameParameters.speculators.base_points},
                {key: "speculators_reward_scale_factor", type: "number", value: gameParameters.speculators.reward_scale_factor},

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
                {key: "developers_base_points", type: "number", value: gameParameters.developers.base_points},
                {key: "developers_reward_scale_factor", type: "number", value: gameParameters.developers.reward_scale_factor},

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
                {key: "owner_project_b_high", type: "number", value: gameParameters.owners.profit.project_b.high},
                {key: "owners_base_points", type: "number", value: gameParameters.owners.base_points},
                {key: "owners_reward_scale_factor", type: "number", value: gameParameters.owners.reward_scale_factor},

                {key: "seconds_for_deliberation", type: "number", value: gameParameters.seconds_for_deliberation},

                {key: "timer_phase_0", type: "number", value: gameParameters.timers.phase_0},
                {key: "timer_phase_1", type: "number", value: gameParameters.timers.phase_1},
                {key: "timer_phase_2", type: "number", value: gameParameters.timers.phase_2},
                {key: "timer_phase_3", type: "number", value: gameParameters.timers.phase_3},
                {key: "timer_phase_4", type: "number", value: gameParameters.timers.phase_4},
                {key: "timer_phase_5", type: "number", value: gameParameters.timers.phase_5},
                {key: "timer_phase_6", type: "number", value: gameParameters.timers.phase_6},
                {key: "timer_phase_7", type: "number", value: gameParameters.timers.phase_7},
                {key: "timer_phase_8", type: "number", value: gameParameters.timers.phase_8},
                {key: "timer_phase_9", type: "number", value: gameParameters.timers.phase_9},

                {key: "show_up_fee", type: "number", value: gameParameters.show_up_fee}
            ];
        }

        for (let i = 0; i < parameters.length; i++) {
            const parameter = parameters[i];

            console.log(`${parameter.key} (${parameter.type} vs ${typeof parameter.value}): ${parameter.value}`);

            if (parameter.type === 'number' && (parameter.value == null || parameter.value === "")) {
                continue;
            }

            parameter.gameId = gameId;

            const parameterId = await gameParameterRepository.create(parameter);
        }

        if (gameParameters.game_type === 'market' || gameParameters.game_type === 'goods-market') {
            return gameId;
        }

        //3 Create the players
        /* Roles:
         *
         * 1: Speculator
         * 2: Developer
         * 3: Owner
         */
        const roles = [3,2]; //It starts with an owner, then a developer
        const usedNames = [];

        /*for (let i = 0; i < gameParameters.developers.count; i++) {
            roles.push(2);
        }*/

        for (let i = 1; i < gameParameters.owners.count; i++) {
            roles.push(3);
        }

        for (let i = 0; i < gameParameters.speculators.count; i++) {
            roles.push(1);
        }

        const playersCount = roles.length;

        console.log('Creating players');

        for (let i = 0; i < playersCount; i++) {
            //const role = roles.splice(Math.floor(Math.random() * roles.length), 1)[0];
            const role = roles.splice(0, 1)[0];

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
            let cashForSniping = 0;

            switch (role) {
                case 1:
                    balance = gameParameters.speculators.balance;
                    shares = gameParameters.speculators.shares;
                    cashForSniping = gameParameters.speculators.cash_for_snipers;
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
                cashForSniping: cashForSniping,
                player_role: role
            };

            await gamePlayerRepository.create(player);
        }

        return gameId;
    },
    createForDataset: async function (dataset, title) {
        const gameId = await gameRepository.create({ "title": title});

        const parameters = {};

        for (let i = 0; i < dataset.parameters.length; i++) {
            const parameter = dataset.parameters[i];

            switch(parameter.type) {
                case 'number':
                    parameters[parameter.key] = parseInt(parameter.value);
                    break;;
                default:
                    parameters[parameter.key] = parameter.value;
            }

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
        const roles = [3,2]; //It starts with an owner, then a developer
        const usedNames = [];

        /*for (let i = 0; i < gameParameters.developers.count; i++) {
            roles.push(2);
        }*/

        for (let i = 1; i < parameters.owners_count; i++) {
            roles.push(3);
        }

        for (let i = 0; i < parameters.speculators_count; i++) {
            roles.push(1);
        }

        const playersCount = roles.length;

        console.log('Creating players');

        for (let i = 0; i < playersCount; i++) {
            //const role = roles.splice(Math.floor(Math.random() * roles.length), 1)[0];
            const role = roles.splice(0, 1)[0];

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
            let cashForSniping = 0;

            switch (role) {
                case 1:
                    balance = parameters.speculator_balance;
                    shares = parameters.speculator_shares;
                    cashForSniping = parameters.cash_for_snipers;
                    break;
                case 2:
                    balance = parameters.developer_balance;
                    shares = parameters.developer_shares;
                    break;
                case 3:
                    balance = parameters.owner_balance;
                    shares = parameters.owner_shares;
                    break;
            }

            if (balance == null) {
                balance = 0;
            }

            if (shares == null) {
                shares = 0;
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
                cashForSniping: cashForSniping,
                player_role: role
            };

            console.log(player);

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
    },
    saveSurvey: async function(survey) {
        return await gameRepository.saveSurvey(survey);
    },
    findSurveys: async function(gameId) {
        const rows = await gameRepository
            .findSurveys(gameId);
        
        console.log(rows);

        return rows.map(s => JSON.parse(s.content));
    },
    findGameData: async function (gameId) {
        try {
            const data = await gameRepository.findGameData(gameId);

            return JSON.parse(data);
        } catch(e) {
            return {
                "error": `While looking for ${gameId} data: ${e.message}`
            };
        }
    }
}
