import dotenv from 'dotenv';

dotenv.config();

import PG from 'pg';

const { Pool, Client } = PG;

export default {
    client: new Client({
        user: VUE_APP_PGUSER,
        host: VUE_APP_PGHOST,
        database: VUE_APP_PGDATABASE,
        password: VUE_APP_PGPASSWORD,
        port: VUE_APP_PGPORT
    }),
    pool: new Pool({
        user: VUE_APP_PGUSER,
        host: VUE_APP_PGHOST,
        database: VUE_APP_PGDATABASE,
        password: VUE_APP_PGPASSWORD,
        port: VUE_APP_PGPORT
    }),
    create: async function(parameters) {
        if (parameters == null) {
            throw new Error('Cannot create a new user without parameters');
        }
    },
    list: async function(parameters) {
        return await new Promise((resolve, reject) => {
            this.pool.query(`SELECT g.id, g.title, g.created_at, g.updated_at, g.ended_at, p.phase_number 
            FROM games g, game_phases p WHERE g.id = p.game_id AND p.ended_at IS NULL;`, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res.rows);
                }
            });
        });
    }
}