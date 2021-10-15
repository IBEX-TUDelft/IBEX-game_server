import gameRepository from '../repositories/gameRepository.js';
import gameParameterRepository from '../repositories/gameParameterRepository.js';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';
import gamePlayerRepository from '../repositories/gamePlayerRepository.js';

export default {
    createGame: async function (gameParameters) {

        //1 Create the game
        const gameId = await gameRepository.create(gameParameters);

        //2 Create the parameters
        const parameters = [
            {key: "game_type", type: "string", value: gameParameters.game_type},
            {key: "round_count", type: "number", value: gameParameters.round_count},
            {key: "minutes_for_trading", type: "number", value: gameParameters.minutes_for_trading},
            {key: "speculators_count", type: "number", value: gameParameters.speculators.count},
            {key: "speculator_balance", type: "number", value: gameParameters.speculators.balance},
            {key: "speculator_shares", type: "number", value: gameParameters.speculators.shares},
            {key: "developers_count", type: "number", value: gameParameters.developers.count},
            {key: "developer_balance", type: "number", value: gameParameters.developers.balance},
            {key: "developer_shares", type: "number", value: gameParameters.developers.shares},
            {key: "owners_count", type: "number", value: gameParameters.owners.count},
            {key: "owner_balance", type: "number", value: gameParameters.owners.balance},
            {key: "owner_shares", type: "number", value: gameParameters.owners.shares},
        ];

        for (let i = 0; i < parameters.length; i++) {
            const parameter = parameters[i];
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
                }),
                game_id: gameId,
                player_number: i + 1,
                balance: balance,
                shares: shares,
                player_role: role
            };

            await gamePlayerRepository.create(player);
        }

        return gameId;
    }
}
