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
        "deleteByGameId": "DELETE FROM game_players WHERE game_id = $1;"
    },
    create: async function(parameters) {
        if (parameters == null) {
            throw new Error('Cannot create a new user without game parameters');
        }

        //TODO: game parameters validation

        return await new Promise((resolve, reject) => {
            this.pool.query(`INSERT INTO game_players (
                name,
                recovery_string,
                game_id,
                player_number,
                balance,
                shares,
                player_role
            ) VALUES (
                '${parameters.name}',
                '${parameters.recovery_string}',
                '${parameters.game_id}',
                '${parameters.player_number}',
                '${parameters.balance}',
                '${parameters.shares}',
                '${parameters.player_role}'
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
    findByGameId: async function(gameId) {
        return await new Promise((resolve, reject) => {
            this.pool.query(`SELECT id, name, recovery_string as recovery, game_id, player_number as number, balance, shares, player_role as role 
            FROM game_players WHERE game_id = ${gameId};`, (err, res) => {
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
            this.pool.query(`DELETE FROM game_players WHERE game_id = ${gameId};`, (err, res) => {
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
 * CREATE TABLE IF NOT EXISTS game_players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    recovery_string VARCHAR(6) NOT NULL,
    game_id BIGINT NOT NULL,
    user_id BIGINT,
    player_number SMALLINT NOT NULL,
    balance BIGINT NOT NULL DEFAULT 0,
    player_role SMALLINT NOT NULL
);
 */