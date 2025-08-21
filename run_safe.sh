#!/bin/bash

git checkout feature/ts_support
cp .env.example .env
cp api/.env.example api/.env
cp my_app/.env.example my_app/.env
chmod 777 db/*
docker compose -f build.docker-compose.yml up