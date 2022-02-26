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
    list: async function(parameters) {
        return await Database.execute(`SELECT g.id, g.title, g.created_at, g.updated_at, g.ended_at 
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

        console.log('GAME DATA');

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

        console.log(data);
    }
}