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
    list: async function(parameters) { //TODO change, this is copied and pasted
        return await new Promise((resolve, reject) => {
            this.pool.query(`SELECT g.id, g.title, g.created_at, g.updated_at, g.ended_at, p.phase_number 
            FROM games g, game_rounds p WHERE g.id = p.game_id AND p.ended_at IS NULL;`, (err, res) => {
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