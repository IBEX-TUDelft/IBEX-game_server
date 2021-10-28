import dotenv from 'dotenv';

dotenv.config();

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
        "deleteByGameId": "DELETE FROM game_rounds WHERE game_id = $1;",
        "findById": `SELECT 
                round_number as number,
                phase_number as phase,
                game_id as gameId,
                updated_at as updatedAt,
                round_data as data 
            FROM game_rounds 
            WHERE id = $1;`,
        "updateDataById": "UPDATE game_rounds SET round_data = $2 WHERE id = $1;"
    },
    create: async function(parameters) {
        if (parameters == null) {
            throw new Error('Cannot create a new user without game parameters');
        }

        //TODO: game parameters validation

        return await new Promise((resolve, reject) => {
            this.pool.query(`INSERT INTO game_rounds (
                round_number,
                phase_number,
                game_id,
                updated_at,
                round_data
            ) VALUES (
                '${parameters.number}',
                '${parameters.phase}',
                '${parameters.gameId}',
                CURRENT_TIMESTAMP,
                '{}'
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
    findById: async function(id) {
        return await new Promise((resolve, reject) => {
            this.pool.query(`SELECT 
            round_number as number,
            phase_number as phase,
            game_id as gameId,
            updated_at as updatedAt,
            round_data as data
        FROM game_rounds WHERE id = ${id};`, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    if (res.rows.length === 0) {
                        reject(`Round ${id} not found`);
                    } else if (res.rows.length > 1) {
                        reject(`Round ${id} matched ${res.rows.length} records, one only was expected. Check the database`);
                    } else {
                        resolve(res.rows[0]);
                    }
                }
            });
        });
    },
    findByGameId: async function(gameId) {
        return await new Promise((resolve, reject) => {
            this.pool.query(`SELECT 
            round_number as number,
            phase_number as phase,
            game_id as gameId,
            updated_at as updatedAt,
            round_data as data
        FROM game_rounds WHERE game_id = ${gameId} ORDER BY id DESC;`, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res.rows);
                }
            });
        });
    },
    updateDataById: async function(id, data) {
        return await new Promise((resolve, reject) => {
            this.pool.query(`UPDATE game_rounds 
            SET round_data = '${JSON.stringify(data)}'
            WHERE id = ${id};`, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res.rows);
                }
            });
        });
    },
    deleteByGameId: async function(gameId) {
        return await new Promise((resolve, reject) => {
            this.pool.query(`DELETE FROM game_rounds WHERE game_id = ${gameId};`, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res.rows);
                }
            });
        });
    }
}

/**
 * CREATE TABLE IF NOT EXISTS game_rounds (
    id SERIAL PRIMARY KEY,
    round_number SMALLINT NOT NULL DEFAULT 1,
    phase_number SMALLINT NOT NULL DEFAULT 1,
    player_turn SMALLINT NOT NULL DEFAULT 1,
    notes TEXT,
    game_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    ended_at TIMESTAMP,
    round_data TEXT
);
 */