#!/bin/bash

node server.js 1>app.log 2>app.err &
PID=$!
disown $PID
echo $PID > APP_SERVER.PID

less +F app.log
