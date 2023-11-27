import dotenv from 'dotenv';
import Database from '../helpers/database.js'
dotenv.config();
import * as util from 'util' // has no default export
import PG from 'pg';

const { Pool, Client } = PG;

export default {
    client: new Client({
        user: process.env.VUE_APP_PGUSER,
        host: process.env.VUE_APP_PGHOST,
        database: process.env.VUE_APP_PGDATABASE,
        password: process.env.VUE_APP_PGPASSWORD,
        port: process.env.VUE_APP_PGPORT
    }),
    pool: new Pool({
        user: process.env.VUE_APP_PGUSER,
        host: process.env.VUE_APP_PGHOST,
        database: process.env.VUE_APP_PGDATABASE,
        password: process.env.VUE_APP_PGPASSWORD,
        port: process.env.VUE_APP_PGPORT
    }),
    queries: {
        "create": "INSERT INTO games (title) VALUES ($1) RETURNING id;",
        "deleteById": "DELETE FROM games WHERE id = $1;"
    },
    create: async function(gameParameters) {
        if (gameParameters == null) {
            throw new Error('Cannot create a new user without game parameters');
        }

        //TODO: game parameters validation

        return await new Promise((resolve, reject) => {
            this.pool.query(`INSERT INTO games (
                title
            ) VALUES (
                '${gameParameters.title}'
            ) RETURNING id;`,
                (err, res) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(res.rows[0].id);
                    }
                }
            );
        });
    },
    saveSurvey: async function (content) {
        if (content == null) {
            throw new Error('No content');
        }

        if (content.number == null) {
            throw new Error('No player number');
        }

        if (content.gameId == null) {
            throw new Error('No game ID');
        }

        console.log('GOING TO FIND');

        console.log(`SELECT count(*) FROM game_surveys
        WHERE player_number = ${parseInt(content.number)}
        AND game_id = ${parseInt(content.gameId)};`);

        const found = await new Promise((resolve, reject) => {
            this.pool.query(`SELECT count(*) as total FROM game_surveys
                WHERE player_number = ${parseInt(content.number)}
                AND game_id = ${parseInt(content.gameId)};`,
                (err, res) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(res.rows[0].total);
                    }
                }
            );
        });

        console.log(found);

        if (found > 0) {
            return Promise.resolve(-1);
        }

        const query = `INSERT INTO game_surveys (
            player_number,
            game_id,
            content
        ) VALUES (
            ${parseInt(content.number)},
            ${parseInt(content.gameId)},
            '${JSON.stringify(content)}'
        ) RETURNING id;`;

        console.log(query);

        return await new Promise((resolve, reject) => {
            this.pool.query(
                query,
                (err, res) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(res.rows[0].id);
                    }
                }
            );
        });
    },
    findSurveys: async function(gameId) {
        const result = await Database.execute(`SELECT gs.content
            FROM game_surveys gs WHERE gs.game_id = ${gameId} ORDER BY gs.player_number ASC;`);

        console.log(result);

        return result;
    },
    list: async function(parameters) {
        return await Database.execute(`SELECT g.id, g.title, g.created_at, g.updated_at, g.ended_at, game_data  
            FROM games g ORDER BY id DESC LIMIT 50;`);
    },
    findOne: async function(gameId) {
        console.log('Game ID: ' + gameId + " Typeof: " + typeof gameId);
        
        return await new Promise((resolve, reject) => {
            this.pool.query(
                `SELECT id, title, created_at, updated_at, ended_at, game_data FROM games WHERE id = ${gameId};`,
                (err, res) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (res.rows == null || res.rows.length === 0) {
                            resolve(null);
                        } else if (res.rows.length === 1) {
                            resolve(res.rows[0]);
                        } else {
                            console.error(`${res.rows.length} games found with id ${gameId}. RED ALERT: check the database.`);
                        }
                    }
            });
        });
    },
    deleteById: async function(gameId) {
        return await new Promise((resolve, reject) => {
            this.pool.query(`DELETE FROM games WHERE id = ${gameId};`, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res.rows);
                }
            });
        });
    },
    saveData: async function(gameId, data) {
        const currentPhase = data.currentPhase;
        data.currentPhase = null;

        await new Promise((resolve, reject) => {
            this.pool.query(`UPDATE games 
            SET game_data = '${JSON.stringify(data)}'
            WHERE id = ${gameId};`, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res.rows);
                }
            });
        });

        data.currentPhase = currentPhase;
    },
    findGameData: async function(gameId) {
        return await new Promise((resolve, reject) => {
            this.pool.query(
                `SELECT game_data FROM games WHERE id = ${gameId};`,
                (err, res) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (res.rows == null || res.rows.length === 0) {
                            resolve(null);
                        } else if (res.rows.length === 1) {
                            resolve(res.rows[0].game_data);
                        } else {
                            console.error(`${res.rows.length} games found with id ${gameId}. RED ALERT: check the database.`);
                        }
                    }
            });
        }); 
    },
    getGameType: async function(gameId) {
        return await new Promise((resolve, reject) => {
            this.pool.query(
                `select parameter_value from game_parameters where parameter_key = 'game_type' and game_id = ${gameId};`,
                (err, res) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (res.rows == null || res.rows.length === 0) {
                            resolve(null);
                        } else if (res.rows.length === 1) {
                            resolve(res.rows[0].parameter_value);
                        } else {
                            console.error(`${res.rows.length} games found with id ${gameId}. RED ALERT: check the database.`);
                        }
                    }
            });
        });
    },
    endGame: async function(gameId) {
        return await new Promise((resolve, reject) => {
            this.pool.query(
                `update games set ended_at = NOW() where id = ${gameId} ;`,
                (err, res) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(res);
                        resolve();
                    }
            });
        });
    }
}