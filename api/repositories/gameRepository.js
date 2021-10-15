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
        return await new Promise((resolve, reject) => {
            this.pool.query(`SELECT g.id, g.title, g.created_at, g.updated_at, g.ended_at 
            FROM games g ORDER BY id DESC LIMIT 50;`, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res.rows);
                }
            });
        });

        /*for (let i = 0; i < games.length; i++) {
            const game = games[i];

            game.parameters = await gameParameterRepository.list(game.id);
        }*/
    }
}