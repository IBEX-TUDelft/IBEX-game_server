CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    name varchar(50) not null,
    user_id bigint,
    student_id varchar(50) not null,
    bank_account varchar(50) not null,
    experiment_condition varchar(50) not null,
    session_number bigint not null,
    amount_earned bigint not null
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username varchar(50) not null,
    passwd varchar(256) not null,
    user_role smallint not null
);

CREATE TABLE IF NOT EXISTS login_tokens (
    id SERIAL PRIMARY KEY,
    token varchar(8) not null,
    expiry_time timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS estates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    estate_owner BIGINT
);

CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    title VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    ended_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_parameters (
    id SERIAL PRIMARY KEY,
    game_id BIGINT NOT NULL,
    parameter_key VARCHAR(50) NOT NULL,
    parameter_type VARCHAR(50) NOT NULL,
    parameter_value VARCHAR(256) NOT NULL
);

CREATE TABLE IF NOT EXISTS game_rounds (
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

CREATE TABLE IF NOT EXISTS game_players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    recovery_string VARCHAR(64) NOT NULL,
    game_id BIGINT NOT NULL,
    user_id BIGINT,
    player_number SMALLINT NOT NULL,
    balance BIGINT NOT NULL DEFAULT 0,
    shares BIGINT NOT NULL DEFAULT 0,
    player_role SMALLINT NOT NULL
);