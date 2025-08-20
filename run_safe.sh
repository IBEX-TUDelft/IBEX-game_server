#!/bin/bash

git checkout feature/ts_support
chmod 777 db/*
docker compose -f build.docker-compose.yml up