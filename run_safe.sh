#!/bin/bash

git checkout feature/ts_support

if [ ! -f .env ]; then
    echo "WARNING: using .env.example to populate .env: better if you create your own .env file"
    cp .env.example .env
fi

echo "NOTICE: Changing the permissions of the database files to make sure the docker container can copy them"
chmod 777 db/*
docker compose -f build.docker-compose.yml up