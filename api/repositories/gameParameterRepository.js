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
            this.pool.query(`INSERT INTO game_parameters (
                game_id,
                parameter_key,
                parameter_type,
                parameter_value
            ) VALUES (
                '${parameters.gameId}',
                '${parameters.key}',
                '${parameters.type}',
                '${parameters.value}'
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
    list: async function(gameId) {
        return await new Promise((resolve, reject) => {
            this.pool.query(`SELECT 
            parameter_key as key, 
            parameter_type as type,
            parameter_value as value,
        FROM game_parameters WHERE game_id = ${game.id} ORDER BY id DESC;`, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res.rows);
                }
            });
        });
    }
}