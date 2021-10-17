import dotenv from 'dotenv';

dotenv.config();

import PG from 'pg';

const { Pool } = PG;

const pool = new Pool({
    user: process.env.VUE_APP_PGUSER,
    host: process.env.VUE_APP_PGHOST,
    database: process.env.VUE_APP_PGDATABASE,
    password: process.env.VUE_APP_PGPASSWORD,
    port: process.env.VUE_APP_PGPORT
});

export default {
    pool,
    async transaction(calls) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            for (let i = 0; i < calls.length; i++) {
                await client.query(calls[i].query, calls[i].params);
            }

            return await client.query('COMMIT');
        } catch (err) {
            console.error('Rollback', err);
            return await client.query('ROLLBACK');
        } finally {
            client.release();
        }
    },
    async execute(query, params) {
        const client = await pool.connect();

        try {
            const result = await client.query(query, params);

            return result.rows;
        } catch (e) {
            throw e;
        } finally {
            client.release();
        }
    }
}