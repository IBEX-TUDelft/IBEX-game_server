import gameService from '../services/gameService.js';
import games from '../repositories/gameRepository.js';
import Controller from '../helpers/controller.js';
import WssManagement from '../services/wssGameService.js';
import GameManagement from '../services/gameManager.js';
import gameRepository from '../repositories/gameRepository.js';
import userRepository from '../repositories/userRepository.js';
import fs from 'fs';
import { AppEvents, PhaseBegins, PhaseComplete } from '../helpers/AppEvents.js';
import { v4 as uuidv4 } from 'uuid';
import { 
    MarketPlayer,
    MARKET_ADMIN,
    MARKET_PLAYER,
    MARKET_GAME_ADMIN,
    MARKET_GAME_KNOWS_ALL,
    MARKET_GAME_PRIV_SIG_ONLY,
    MARKET_GAME_PUB_SIG_ONLY,
    MARKET_GAME_KNOWS_NOTHING
}from '../logics/market/MarketPlayer.js';
import Utils from '../helpers/utils.js';
import { WebSocket } from 'ws';

const CHARACTERS ='abcdefghijklmnopqrstuvwxyz0123456789';

function generateString (length) {
    let result = '';

    const charactersLength = CHARACTERS.length;

    for ( let i = 0; i < length; i++ ) {
        result += CHARACTERS.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

export default {
    apply (app) {
        const wssManager = WssManagement.create();
        const gameManager = GameManagement.create();
        
        wssManager.init(gameManager);
        gameManager.init(wssManager);

        Controller.addPostRoute(app, '/api/v1/games/create', true, async (req, res) => {
            const gameId = await gameService.createGame(req.body.gameParameters);
            
            Controller.handleSuccess(res, { id : gameId }, 'Game created');
        });

        Controller.addPostRoute(app, '/api/v1/games/create-for-llm', false, async (req, res) => {
            console.log(`Logging in ${req.body.username}`);

            try {
              const user = await userRepository.login(req.body);

              if (user == null) {
                console.error(`User not found: ${req.body.username}`);

                return res.status(401).json({
                  data: {},
                  status: true,
                  message: 'Login failed'
                });
              }
            } catch(e) {
              console.error(`Error logging in ${req.body.username}`, e);
              return res.status(401).json({
                data: {},
                status: true,
                message: 'Login failed'
              });    
            }

            console.log(`Login of ${req.body.username} successful, creating the game`);

            try {
                const gameId = await gameService.createGame(req.body.gameParameters);
            
                console.log(`Game created for ${req.body.username}: ${gameId}, starting the game`);

                wssManager.startGame(gameId);
    
                const error = await gameManager.startGame(gameId);
    
                if (error != null) {
                    throw new Error(error);
                }

                console.log(`Game created for ${req.body.username}: ${gameId}, successfully started`);

                Controller.handleSuccess(res, { id : gameId }, 'Game created and started');
            } catch (e) {
                console.error('While creating and starting a new game', e);
                Controller.handleGenericError(res, e.message, 400);
            }
        });

        async function listGames() {
            const records = await games.list();

            const gs = gameManager.games.map(g => g.data).map(d => { return {
                "id": d.id,
                "title": d.title,
                "type": d.parameters.game_type,
                "assignedPlayers": d.assignedPlayers,
                "currentRound": d.currentRound
            }});

            for (let i = 0; i < records.length; i++) {
                const r = records[i];

                if (r === null) {
                    console.error('Null record in database');
                    continue;
                }

                try {
                    const recordGameData = JSON.parse(r.game_data);
                    if (recordGameData != null) {
                        if (recordGameData.type != null) {
                            r.type = recordGameData.type;
                        }

                        if (recordGameData.endedAt != null) {
                            r.ended_at = recordGameData.endedAt;
                        }
                    }
                } catch (errReadingData) {}


                if (r.type == null) {
                    r.type = await gameRepository.getGameType(r.id);
                }

                console.log(r.type);

                const game = gs.find(g => g.id === r.id);

                if (game == null) {
                    r.started = false;
                    continue;
                }
                
                r.started = true;

                if (game.currentRound != null) {
                    r.round_number = game.currentRound;
                }
            }

            return records;
        }

        Controller.addGetRoute(app, '/api/v1/games/list', true, async (req, res) => {
            const records = await listGames();

            Controller.handleSuccess(res, records, 'Data found');
        });

        Controller.addGetRoute(app, '/api/v1/games/status', false, async (req, res) => {
            const gameId = parseInt(req.query.id);
            const recovery = req.query.recovery;

            const game = gameManager.games.find(g => g.data.id === gameId);

            if (game == null) {
                console.log(gameManager.games);
                return Controller.handleGenericError(res, `Game with id ${gameId} not found`, 400);
            }

            const player = game.data.players.find(p => p.recovery === recovery);

            const data = {
                "found": false,
                "canJoin": true,
                "gameData": null,
                "ruleset": game.data.type
            }

            let message;

            if (player == null) {
                console.log(`Player with recovery ${recovery} not found in game ${gameId}`);

                console.log(`Current players: ${game.data.assignedPlayers}, Total players: ${game.data.parameters.total_players}`);

                if (game.data.assignedPlayers < game.data.parameters.total_players) {
                    // 1: player not found, can join
                    message = `Player not found but game ${gameId} can still be joined`;
                } else {
                    // 2: else player not found, but the game is already full
                    message = `Game ${gameId} is full`;
                    data.canJoin = false;
                }
            } else {
                console.log(`Player with recovery ${recovery} found in game ${gameId}: returning his data`);
                // 3: player found, here is yor data

                data.found = true;
                data.gameData = game.getRecoveryData(player.number);

                message = `Game ${gameId}: player found, recovery data will be returned`;
            }

            Controller.handleSuccess(res, data, message);
        });

        Controller.addGetRoute(app, '/api/v1/games/delete', true, async (req, res) => {
            const gameId = parseInt(req.query.game_id);

            await gameService.deleteById(gameId);

            await wssManager.deleteGame(gameId);

            await gameManager.deleteGame(gameId);

            const records = await listGames();

            console.log(records);

            Controller.handleSuccess(res, records, `Game ${gameId} deleted.`);
        });

        Controller.addPostRoute(app, '/api/v1/games/delete-programmatically', false, async (req, res) => {
            console.log(`Logging in ${req.body.username}`);

            try {
              const user = await userRepository.login(req.body);

              if (user == null) {
                console.error(`User not found: ${req.body.username}`);

                return res.status(401).json({
                  data: {},
                  status: true,
                  message: 'Login failed'
                });
              }
            } catch(e) {
              console.error(`Error logging in ${req.body.username}`, e);
              return res.status(401).json({
                data: {},
                status: true,
                message: 'Login failed'
              });    
            }

            console.log(`Login of ${req.body.username} successful, creating the game`);

            try {
                const gameId = parseInt(req.body.game_id);

                await gameService.deleteById(gameId);

                await wssManager.deleteGame(gameId);

                await gameManager.deleteGame(gameId);

                const records = await listGames();

                console.log(records);

                Controller.handleSuccess(res, records, `Game ${gameId} deleted.`);
            } catch (err) {
                console.error('While deleting a game', err);
                Controller.handleGenericError(res, err.message, 400);
            }
        });

        Controller.addGetRoute(app, '/api/v1/games/start', true, async (req, res) => {
            const gameId = parseInt(req.query.game_id);

            wssManager.startGame(gameId);

            const error = await gameManager.startGame(gameId);

            console.log(error);

            if (error == null) {
                Controller.handleSuccess(res, {}, 'Game started');
            } else {
                Controller.handleGenericError(res, error, 400);
            }
        });

        Controller.addGetRoute(app, '/api/v1/simulation-datasets/list', true, async (req, res) => {
            if (!fs.existsSync('../records') ) {
                return Controller.handleSuccess(res, [], 'No simulation datasets found');
            }

            fs.readdir('../records/', (error, files) => {
                if (error == null) {
                    Controller.handleSuccess(res, files, 'Simulation datasets found');
                } else {
                    console.error(error);
                    Controller.handleGenericError(res, error, 500);
                }
            });
        });

        Controller.addGetRoute(app, '/api/v1/simulation-datasets/play', true, async (req, res) => {
            const name = req.query.name;
            const title = req.query.title;

            console.log(`Gonna play ${name} as ${title}`);
            let dataset;

            try {
                console.log(`Reading dataset ${name} ...`);

                const raw = fs.readFileSync(`../records/${name}`);

                console.log(`Done. Parsing its content ...`);

                dataset = JSON.parse(raw);

                console.log(`Done. Checking if there is data ...`);

                if (dataset == null) {
                    throw new Error(`Simulation dataset ${name} is empty`)
                }

                console.log(`Done. Creating the game ...`);

                const gameId = await gameService.createForDataset(dataset, title);

                console.log(`Done. Starting the game ...`);

                const error = await gameManager.startGame(gameId, false);

                console.log(`Done.`);

                if (error != null) {
                    throw new Error(`Could not run simulation dataset ${name}: ${error}`);
                }

                const game = gameManager.games.find(g => g.data.id === gameId);

                if (game == null) {
                    throw(`Could not find ${gameId} in the game manager`);
                }
                
                let j = 0;
                
                function gameIsAhead(gameRound, event) {
                    if (gameRound.number < event.round) {
                        return false;
                    }

                    if (gameRound.number > event.round) {
                        return true;
                    }

                    return gameRound.phase > event.phase;
                }

                function gameIsBehind(gameRound, event) {
                    if (gameRound.number < event.round) {
                        return true;
                    }

                    if (gameRound.number > event.round) {
                        return false;
                    }

                    return gameRound.phase < event.phase;
                }

                while (j < dataset.log.length) {
                    const event = dataset.log[j];

                    if (gameIsAhead(game.data.currentRound, event)) {
                        console.error(`Out of sync, event behind. Event = ${event.round}:${event.phase}, game = ${game.data.currentRound.number}:${game.data.currentRound.phase}`);
                        console.error(event);
                        break;
                    }

                    if (gameIsBehind(game.data.currentRound, event)) {
                        console.log(`Event for ${event.round}:${event.phase}, waiting for the game (${game.data.currentRound.number}:${game.data.currentRound.phase}) to move to that phase`);

                        await new Promise(resolve => {
                            const listener = ({phase, round}) => {
                                console.log(`Game moved to phase ${round}:${phase}`);
    
                                if (!gameIsBehind(game.data.currentRound, event)) {
                                    AppEvents.get(gameId).removeListener(PhaseBegins, listener);
                                    resolve();
                                } else {
                                    console.log(`Waiting for ${event.round}:${event.phase},but still in (${game.data.currentRound.number}:${game.data.currentRound.phase}). Exiting ...`);
                                }
                            };

                            AppEvents.get(gameId).addListener(PhaseBegins, listener)
                        });
                    }

                    if (event.content != null) {
                        event.content.gameId = gameId;
                    }

                    console.log(`Playing event ${j}: ${event.type} for phase ${event.phase} in phase ${game.data.currentRound.phase}`);

                    if (event.type === "phase-timeout") {
                        AppEvents.get(gameId).emit(PhaseComplete, { //TODO not consistent with similar events, having phase and round instead of number
                            "number": event.phase
                        });

                        j++;

                        continue;
                    }

                    let ws = {
                        "send": function() {}
                    };

                    const player = game.data.players.find(p => p.number === event.number);

                    console.log(game.data.players);

                    if (event.number != null) {
                        ws.player = {
                            "number": event.number,
                            "role": player.role
                        }
                    }

                    await gameManager.handleMessage(ws, event.content);

                    j++;
                }

                Controller.handleSuccess(res, {
                    "id" : gameId,
                    "type": game.data.type.toLowerCase()
                }, 'Game created and run with your simulation dataset');
            } catch (e) {
                console.error(`Could not run simulation dataset ${name}`, e);
                Controller.handleGenericError(res, `Could not run simulation dataset ${name}: ${e.message}`, 500);
                return;
            }
        });

        Controller.addGetRoute(app, '/api/v1/games/started', false, async (req, res) => {
            const records = await gameRepository.list();

            const games = records
                .filter(r => r.ended_at == null)
                .filter(r => gameManager.games.find(g => g.data.id === r.id) != null)
                .map(r => {
                    return gameManager.games.find(g => g.data.id === r.id).data;
                }).map(d => { return {
                    "id": d.id,
                    "title": d.title,
                    "type": d.parameters.game_type,
                    "assignedPlayers": d.assignedPlayers,
                    "currentRound": d.currentRound
                }});

            Controller.handleSuccess(res, games, 'Data available');
        });

        Controller.addGetRoute(app, '/api/v1/games/data', false, async (req, res) => {
            const gameId = parseInt(req.query.game_id);

            const data = await gameService.findGameData(gameId);

            if (data != null) {
                data.ruleset = data.type;
            }

            Controller.handleSuccess(res, data, 'Data available');
        });

        Controller.addGetRoute(app, '/api/v1/games/get-recovery', false, async (req, res) => {
            const gameId = parseInt(req.query.game_id);

            const game = gameManager.games.find(g => g.data.id === gameId);

            if (game == null) {
                return Controller.handleGenericError(res, `Game ${gameId} was not found`, 400);
            }

            if (game == null) {
                return Controller.handleGenericError(res, `Game ${gameId} has no data!`, 500);
            }

            let recovery = generateString(64);

            while(true) {
                const player = game.data.players.find(p => p.recovery === recovery);

                if (player == null) {
                    break;
                }

                recovery = generateString(64);
            }

            Controller.handleSuccess(res, {"recovery": recovery}, 'Data available');
        });

        Controller.addGetRoute(app, '/api/v1/games/market-log', false, async (req, res) => {
            const gameId = parseInt(req.query.game_id);

            const game = await gameService.findGameData(gameId);

            const data = {
                "ruleset": game.type,
                "players": game.players.map(p => {
                    return {
                        "number": p.number,
                        "tag": p.tag
                    }
                }),
                "conditions": game.conditions,
                "marketLogs": game.results.filter(r => r.phase[6] != null).map(r => r.phase[6].log)
            };

            if (game.type === 'Futarchy') {
                data.winningConditions = game.results.filter(r => r.phase[6] != null).map(r => r.phase[6].winningCondition)
            } else if (game.type === 'Harberger') {
                data.winningConditions = game.results.filter(r => r.phase[3] != null).map(r => r.phase[3].winningCondition)
            }

            Controller.handleSuccess(res, data, 'Data available');
        });

        Controller.addGetRoute(app, '/api/v1/games/chat-log', false, async (req, res) => {
            const gameId = parseInt(req.query.game_id);

            //const game = gameManager.games.find(g => g.data.id  == gameId);
            const game = await gameService.findGameData(gameId);

            const data = {
                "ruleset": game.type,
                "players": game.players.map(p => {
                    return {
                        "number": p.number,
                        "tag": p.tag
                    }
                }),
                "results": game.results
            };

            Controller.handleSuccess(res, data, 'Data available');
        });

        Controller.addPostRoute(app, '/api/v1/games/survey', false, async (req, res) => {
            console.log(req.body);

            try {
                const id = gameService.saveSurvey(req.body);

                Controller.handleSuccess(res, { id }, 'Survery received');
            } catch(e) {
                Controller.handleGenericError(res, e, 500);
            }
        });

        Controller.addGetRoute(app, '/api/v1/games/surveys', true, async (req, res) => {
            const gameId = parseInt(req.query.game_id);

            //const game = gameManager.games.find(g => g.data.id  == gameId);

            const records = await gameService.findSurveys(gameId);

            const data = {
                //"ruleset": game.data.type,
                records
            }

            Controller.handleSuccess(res, data, 'Data available');
        });

        Controller.addGetRoute(app, '/api/v1/games/market/join', false, async (req, res) => {
            const gameId = parseInt(req.query.gameId);

            const game = gameManager.games.find(g => g.data.id === gameId);

            if (game == null) {
                console.log(gameManager.games);
                return Controller.handleGenericError(res, `Game with id ${gameId} not found`, 400);
            }

            const gameData = game.data;

            const player = new MarketPlayer();

            let verification;

            try {
                verification = Utils.verifyJWT(req.query.token);
            } catch (e) {
                console.log('New unathenticated player');
            }

            const desiredRatios = [
                gameData.parameters.players_knowing_both_signals,
                gameData.parameters.players_knowing_private_signal,
                gameData.parameters.players_knowing_public_signal,
                gameData.parameters.players_knowing_no_signal
            ];

            const getQuadraticDistance = (delta = [0, 0, 0, 0]) => {
                if (delta.length != 4) {
                    throw new Error(`Delta vector length not compatible. Must be 4, was ${delta.length}`);
                }

                const total = gameData.players.filter(p => p.role != MARKET_GAME_ADMIN).length
                     + delta[0] + delta[1] + delta[2] + delta[3];

                const currentRatios = [
                    (gameData.players.filter(p => p.role === MARKET_GAME_KNOWS_ALL).length + delta[0]) * 100 / total,
                    (gameData.players.filter(p => p.role === MARKET_GAME_PRIV_SIG_ONLY).length + delta[1]) * 100 / total,
                    (gameData.players.filter(p => p.role === MARKET_GAME_PUB_SIG_ONLY).length + delta[2]) * 100 / total,
                    (gameData.players.filter(p => p.role === MARKET_GAME_KNOWS_NOTHING).length + delta[3]) * 100 / total
                ];

                let distance = 0;

                for (let i = 0; i < currentRatios.length; i++) {
                    distance += Math.pow(Math.abs(currentRatios[i] - desiredRatios[i]), 2);
                }

                return distance;
            }

            if (verification == null || verification.role != 0)  {
                player.authority = MARKET_PLAYER;

                let best = null;
                let bestScore = null;

                const roles = [
                    MARKET_GAME_KNOWS_ALL,
                    MARKET_GAME_PRIV_SIG_ONLY,
                    MARKET_GAME_PUB_SIG_ONLY,
                    MARKET_GAME_KNOWS_NOTHING
                ];

                for (let i = 0; i < 4; i++) {
                    const delta = [0, 0, 0, 0];

                    delta[i] = 1;

                    const score = getQuadraticDistance(delta);

                    if (bestScore == null || score < bestScore) {
                        best = i;
                        bestScore = score;
                    }
                }

                player.role = roles[best];
            } else {
                player.authority = MARKET_ADMIN;
                player.role = MARKET_GAME_ADMIN;
            }

            player.gameId = gameId;

            while (
                player.recovery === '' ||
                gameData.players.find(p => p.recovery === player.recovery) != null
            ) {
                player.recovery = uuidv4();
            }

            player.wallet = {
                "balance": gameData.parameters.cash_per_player,
                "shares" : gameData.parameters.shares_per_player 
            }

            player.shares = gameData.parameters.shares_per_player;
            player.cash = gameData.parameters.cash_per_player;

            player.number = gameData.players.length;

            const knowsPrivateSignal = [MARKET_GAME_KNOWS_ALL, MARKET_GAME_PRIV_SIG_ONLY].includes(player.role);

            if (knowsPrivateSignal) {
                player.signal = game.generateSignal();
            }

            if (player.role === MARKET_GAME_ADMIN ) {
                player.signal = gameData.realValue;
            }

            gameData.players.push(player);
            gameData.assignedPlayers = gameData.players.length;

            Controller.handleSuccess(res, {
                "redirect": `/market/${gameId}/${player.recovery}`,
                "player": player
            }, 'Joined');
        });

        Controller.addGetRoute(app, '/api/v1/games/market/players', true, async (req, res) => {
            const gameId = parseInt(req.query.gameId);

            const game = gameManager.games.find(g => g.data.id === gameId);

            if (game == null) {
                console.log(gameManager.games);
                return Controller.handleGenericError(res, `Game with id ${gameId} not found`, 400);
            }

            const gameData = game.data;

            const sockets = Array.from(wssManager.wss.clients).filter(ws => {
                return ws.player?.gameId === gameId;
            });

            const players = gameData.players.map(p => {
                return {
                    "number": p.number,
                    "cash": p.cash,
                    "shares": p.shares,
                    "recovery": p.recovery,
                    "connected": false
                }
            });

            players.forEach(p => {
                const socket = sockets.find(ws => ws.player?.number === p.number);

                if (socket == null) {
                    console.log(`Player ${p.number} doesn't have an active web socket`);
                    return;
                }

                p.connected = socket.readyState === WebSocket.OPEN;

                if (p.connected) {
                    delete p.recovery;
                }
            });

            Controller.handleSuccess(res, {
                players
            }, `Player of game ${gameId}`);
        });

        Controller.addGetRoute(app, '/api/v1/games/json', true, async (req, res) => {
            const gameId = parseInt(req.query.gameId);

            //TODO: handle failure, file not found
            const raw = fs.readFileSync(`../records/${gameId}.log.json`);

            Controller.handleSuccess(res, raw.toString(), 'Data available');
        });

        Controller.addGetRoute(app, '/api/v1/games/repair', false, async (req, res) => {
            try {
                if (!fs.existsSync('../records') ) {
                    return Controller.handleSuccess(res, [], 'No record datasets found');
                }

                fs.readdir('../records', (err, files) => {
                    if (err) {
                        throw err;
                    }

                    files.forEach(async (file) => {
                        // get the details of the file
                        const parentId = parseInt(file.split('.')[0]);

                        if (isNaN(parentId)) {
                            console.error(`Simulation dataset ${file}'s parent is unknown. Could not repair`);
                            return;
                        }

                        const data = await gameService.findGameData(parentId);

                        if (data == null) {
                            console.error(`Simulation dataset ${file}'s parent data is not available. Could not repair`);
                            return;
                        }

                        const log = JSON.parse(fs.readFileSync(`../records/${file}`).toString());

                        let changed = false;

                        if (log.parameters.find(p => p.key === 'simulation_parent_id') == null) {
                            log.parameters.push({
                                "key": "simulation_parent_id",
                                "type": "number",
                                "value": parentId.toString()
                            });
                            changed = true;
                        }

                        if (log.parameters.find(p => p.key === 'simulation_reward_round') == null) {
                            log.parameters.push({
                                "key": "simulation_reward_round",
                                "type": "number",
                                "value": data.rewardRound.toString()
                            });
                            changed = true;
                        }

                        if (changed) {
                            console.log(`Adding parent id and reward round to simulation ${file} ...`);
                            fs.writeFileSync(`../records/${file}`, JSON.stringify(log));
                            console.log(`Done adding parent id and reward round to simulation ${file}`);
                        } else {
                            console.log(`Simulation ${file} already has parent id and reward round.`);
                        }

                        //console.log(log.parameters);
                    });
                });

                Controller.handleSuccess(res, {}, 'Repair script executed');
            } catch (e) {
                console.error(`Could not run the repair script`, e);
                Controller.handleGenericError(res, `Could not run the repair script: ${e.message}`, 500);
                return;
            }

            /*const records = await listGames();

            for (let i = 0; i < records.length; i++) {
                let g = records[i];

                const data = await gameService.findGameData(g.id);

                if (data == null) {
                    console.error(`Game ${g.id} not found`);
                    continue;
                }

                if (data.rewardRound != null || data.rewards == null || data.rewards.length == 0) {
                    continue;
                }

                data.rewardRound = data.rewards[0].round;

                await gameRepository.saveData(data.id, data);

                console.log(`Repaired rewardRound of game ${g.id}`);
            }*/
        });

        Controller.addGetRoute(app, '/api/v1/games/backups', true, async (req, res) => {
            const gamesInDb = await gameRepository.listCompact();

            let gamesInBackup = [];

            if (fs.existsSync('../backup') ) {
                gamesInBackup = fs.readdirSync('../backup');
            }

            let games = [];

            for (let i = 0; i < gamesInBackup.length; i++) {
                const backup = gamesInBackup[i];

                const game = JSON.parse(fs.readFileSync(`../backup/${backup}`));

                games.push({
                    "id": game.id,
                    "name": backup,
                    "title": game.title,
                    "type": game.parameters.game_type,
                    "exists": gamesInDb.find(g => g.id === game.id) != null
                });
            }

            games.sort((a, b) => b.id - a.id);
            
            Controller.handleSuccess(res, games, 'Data available');
        });

        Controller.addGetRoute(app, '/api/v1/games/restore', true, async (req, res) => {
            const name = req.query.name;

            const data = fs.readFileSync(`../backup/${name}`);

            const game = JSON.parse(data);

            console.log(game);

            await gameRepository.restore(game.id, game.title, game, game.endedAt);

            Controller.handleSuccess(res, {}, `Game with id ${game.id} restored.`);
        });
    }
};
