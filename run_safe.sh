#!/bin/bash

git checkout feature/ts_support
cp .env.example .env
chmod 777 db/*
docker compose -f build.docker-compose.yml up