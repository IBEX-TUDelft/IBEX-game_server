import dotenv from 'dotenv';

dotenv.config();

import PG from 'pg';
import bcrypt from 'bcryptjs';

const { Pool, Client } = PG;


/**
 * USER ROLES:
 * 
 * 0: Admin
 * 1: Game master
 * 2: Owner
 * 3: Developer
 * 4: Speculator
 * 5: Player
 */

var saltRounds = parseInt(process.env.SALT_ROUNDS);

if (isNaN(saltRounds)) {
    saltRounds = 10;
}

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
    SALT_ROUNDS: saltRounds,
    create: async function(parameters) {
        if (parameters == null) {
            throw new Error('Cannot create a new user without parameters');
        }

        if (!isNaN(parseInt(parameters.role))) {
            throw new Error('New users must have a role');
        }

        if (parameters.role === 0) {
            throw new Error('It is not allowed to create an admin using this interface');
        }

        if (!parameters.username) {
            throw new Error('Cannot create a new user without an username');
        }

        if (!parameters.password) {
            console.warn('Creating an user without a password. It will only be able to log in using tokens');
        }
    },
    login: async function(parameters) {
        if (parameters == null) {
            throw new Error('Cannot login without parameters');
        }

        let record;

        if (parameters.password != null) {
            record = await this.loginWithPassword(parameters.username, parameters.password);
        } else {
            //TODO
        }

        console.log(record);

        return record;
    },
    loginWithPassword: async function(username, password) {
        console.log();

        const self = this;

        const record = await new Promise((resolve, reject) => {
            this.pool.query(`SELECT id, user_role, username, passwd FROM users WHERE username = '${username}'`, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res.rows[0]);
                }
            });
        });

        if (record == null || record.username != username) {
            return Promise.resolve(null);
        }

        return new Promise((resolve, reject) => {
            console.log('Comparing ' + password + ' with ' + record.passwd);
            bcrypt.compare(password, record.passwd, function(err, result) {
                console.log('Compared');
                if (err) {
                    reject(err);
                } else {
                    if (result) {
                        return resolve ({
                            username: record.username,
                            role: record.user_role,
                            id: record.id
                        });
                    }

                    resolve(null);
                }
            });
        });
    },
    hashPassword: async function(password)  {
        const self = this;

        const salt = await new Promise((resolve, reject) => {
            bcrypt.genSalt(self.SALT_ROUNDS, function(err, salt) {
                if (err) {
                    reject(err);
                } else {
                    resolve(salt);
                }
            });
        });

        return new Promise((resolve, reject) => {
            bcrypt.hash(password, salt, function(err, hash) {
                if (err) {
                    reject(err);
                } else {
                    resolve(hash);
                }
            });
        });
    }
}