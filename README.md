# Voting, Harberger and Futarchy Setup

## Front-end

1. After checking the code out, Go to the my-app directory
2. Make sure your code is up to date, if it's not, run `git pull`
3. Copy the .env.example to .env: current values should be suitable in all cases.
4. Run `npm i` to download all dependencies
5. Run `npm run build` to build the static app: it will generate a dist directory with the static files.
6. Copy the content of dist to your server root. For example, if you use apache2 on Linux, that would be /var/www/html and the command to run would be
`sudo cp -R dist/* /var/www/html`
7. Make sure your server has the right configuration to be accessible from wherever you need.
8. You might want a deploy.sh script to be run each time you need to update the front-end after code changes:

```
#!/bin/bash

npm i
npm run build
sudo cp -R dist/* /var/www/html
```

## Back-end

1. Check the code out, go to the api directory and copy .env.example to .env
2. Install postgres
3. Create a user for the app matching the credential in your .env file.
4. Create a database matching the db name specified in the .env database, assign to the db user the required privileges (must be done using postgres commands)
5. Generate the tables, running `db/database.sql`with psql.
6. Run `npm i` to download all dependencies
7. Run the server `node server.js`
8. Maybe can help having some scripts to automate the process in the api directory like:

---
## start.sh
```
#!/bin/bash

node server.js 1>app.log 2>app.err &
PID=$!
disown $PID
echo $PID > APP_SERVER.PID
```

Will run the server in the background and direct logs and errors to specific files, accessible with less in following mode:

`less +F app.log`

`less +F app.err`

---
## kill.sh
```
#!/bin/bash

cat APP_SERVER.PID | xargs kill -9
```
Kills the running instance

---
## restart.sh
```
#!/bin/bash

./kill.sh
./start.sh
```

Combines the two

---
## deploy.sh
```
#!/bin/bash

./kill.sh

npm i
git pull

./start.sh
```

Stops the server, updates the code, updates the libraries and start it afresh.

## Server

You need to have an appropriate configuration to run the server. See the following configuration for `yary.eu` as an example, running the application locally doesn't require an ssl certificate.
Note that the `/api` and `/wss` have to be set for the communication between browser and server to work.

```
server {

        # SSL configuration
        #
        # listen 443 ssl default_server;
        # listen [::]:443 ssl default_server;
        #
        # Note: You should disable gzip for SSL traffic.
        # See: https://bugs.debian.org/773332
        #
        # Read up on ssl_ciphers to ensure a secure configuration.
        # See: https://bugs.debian.org/765782
        #
        # Self signed certs generated by the ssl-cert package
        # Don't use them in a production server!
        #
        # include snippets/snakeoil.conf;

        root /var/www/html;

        # Add index.php to the list if you are using PHP
        index index.html index.htm index.nginx-debian.html;
    server_name yary.eu; # managed by Certbot


        location / {
                # First attempt to serve request as file, then
                # as directory, then fall back to displaying a 404.
                # try_files $uri $uri/ =404;
                try_files $uri $uri/ /index.html;
        }

        location /api/ {
                proxy_pass http://localhost:3080/api/;
        }

        location /wss {
                proxy_pass http://localhost:3088;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "Upgrade";
                proxy_set_header Host $host;
        }

}

```

Try whenever possible to use automated action (see workflows)


## Game management for LLM and automation

### Create and start the game

Create and start a game sending a POST request `/api/v1/games/create-for-llm`. In resources there is an example how to create a futarchy game. Remember to change the username and password with valid credentials.

```
{
    "username": "an existing username",
    "password": "the matching password",
    "gameParameters": <see the example in resources/game.json>
}
```

Here is a curl example (remember to set the header application/json for sending a json request):

```
curl -X POST -H "Content-Type: application/json" -d '{"username":"a valid user","password":"the matching password","gameParameters":{"title":"a_trivial_test","tax_rate":{"initial":1,"final":33},"signal":{"low":0.95,"high":1.05,"generate":false},"speculators":{"count":6,"balance":50000,"shares":5,"max_lot_purchases":3,"cash_for_snipers":250000,"base_points":400000,"reward_scale_factor":20000},"developers":{"count":1,"balance":300000,"shares":30,"base_points":0,"reward_scale_factor":50000,"profit":{"no_project":{"low":200000,"fixed":350000,"high":500000},"project_a":{"low":500000,"fixed":1150000,"high":2750000},"project_b":{"low":1500000,"fixed":1750000,"high":2000000}}},"owners":{"count":5,"balance":60000,"shares":6,"base_points":200000,"reward_scale_factor":20000,"profit":{"no_project":{"low":350000,"fixed":425000,"high":600000},"project_a":{"low":150000,"fixed":275000,"high":350000},"project_b":{"low":100000,"fixed":150000,"high":200000}}},"timers":{"phase_0":null,"phase_1":15,"phase_2":90,"phase_3":120,"phase_4":3,"phase_5":3,"phase_6":270,"phase_7":60,"phase_8":90,"phase_9":15},"round_count":"1","game_type":"futarchy","practice":false,"minutes_for_trading":10,"minutes_for_sniping":2,"session_number":1,"seconds_for_deliberation":30,"show_up_fee":5}}' localhost:3080/api/v1/games/create-for-llm
```

The server will return a data structure containing the game id, which is immediately usable:

```
{
        "data": {
                "id":4
        },
        "status":true,
        "message":"Game created and started"
}
```

### Join a game with a websocket

You probably want to spin up a number of agents, each connecting to the game as a player. In order to do so, create as many agents as players you specified in the parameters (12 in the given example), then, for each, obtain a recovery code with the following GET call:

```
/api/v1/games/get-recovery?game_id=<id>
```

Notice that no admin authentication is required to play games. The game_id comes from the initial stage. The recovery code is in the response.

```
{
        "recovery": <recovery>
}
```

You may then send the join message via websocket:

```
{
    "gameId": <id>,              # Integer
    "type": "join",             # String
    "recovery": <recovery> # String (alphanumeric token)
}
```

# Working with containers

## Build and deploy

1. Checkout the code
2. Copy the .env.example to .env and configure according to your needs
3. run 

```
docker builder prune
docker compose -f build.docker-compose.yml up
```

## Deploying the available docker-compose

### Requirements

1. Docker installed with ability to run compose. You will need to use a console (powershell in Windows)
2. Free ports:
        8080 UI administration port
        18080 Database UI administration port
3. Access to internet and to the docker hub (no corporate restrictions)

### Installation

1. Download (and unzip) the zip file contained in the docker-compose directory, or checkout the directory itself.
2. Open a console, move to the docker-compose directory created in step 1
3. Run `docker compose up`

Following these instructions, docker will pull the required images and run all applications. You can then manage the whole contained app using Docker Desktop.

### User Interfaces

General Administration: localhost:8080
Database administration: localhost:18080

### Connection endpoints

You can connect to the following server endpoint with external clients

Server API: localhost:8080/api/v1
Websocket: localhost:8080/wss

### Admin credentials

Admin credentials are established once and for all at the moment of the installation on the machine, through the .env file located in the zip file. It can be modified to change the credentials.

For the database administration, use these credentials on localhost:18080. 

Database User: harb_docker_user
Database Pass: Tn3yn3h9cYds7Yhc5Q8641dOMvOYp05a
Database Name: harb_docker

The admin user is created in the db/admin.sql file in the installation directory, it allows to log in on localhost:8080

user: admin
pass: 5TK174F5JeyoxF5U6A0PJo76oL5X7oXW

Changing these credentials at installation time requires to modify the query generating the user in db/admin.sql with a new password that needs to be encrypted with brcrypt (use https://www.browserling.com/tools/bcrypt for example)

## Updating the containers

When you update the code, you should update the container affected by the changes and the package in docker-compose, if affected as well. The package is instructed to fetch always the latest version, which should trigger and update. In some cases, bracking changes will require to uninstall previous version of a container, with loss of data that should be exported before proceeding.
All shown commands assume the project containers still reside at the original developer's Docker Hub repository (yaryribero)

### nginx (frontend: Web server with UI)

If you change the frontend or the nginx configuration, rebuild the nginx container

`docker compose -f build.docker-compose.yml build nginx`
`docker push yaryribero/gs-nginx`

### backend

To update the backend container following code changes, just do as follows (notice that tagging with -t might be not necessary):

```
cd api
docker build -t yaryribero/yaryribero/gs-backend .
docker push yaryribero/yaryribero/gs-backend
```

### database

Reinstalling the database might cause data loss. You can add scripts to the docker-compose/db section or modify the existing ones, just remember to repackage everything after.

### packaging all

You can build all at the same time:

`docker compose -f build.docker-compose.yml build nginx`

Remember that two files with be used directly during the build process:

build.docker-compose.yml
.env

Modify them accordingly

