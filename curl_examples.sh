# 1. Login
#
# Server: 188.166.34.67
# You should reimplement this logic in python. Keep the login token for the subsequent call

BASE_ADDRESS=http://188.166.34.67/api/v1
LOGIN_ADDRESS=auth/login

USERNAME=jasper
PASSWORD=dteMpzfEnS7B8fX3nph3smy54bZffRVS

LOGIN_STRING="{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}"

echo "curl -X POST -d \"$LOGIN_STRING\" $BASE_ADDRESS/$LOGIN_ADDRESS -H \"Content-Type: application/json\""

TKN_STR=$(curl -X POST -d "$LOGIN_STRING" $BASE_ADDRESS/$LOGIN_ADDRESS -H "Content-Type: application/json")

# 2. Run a game in impersonation mode. It will return when it's your time to join

PLAY_ADDRESS="impersonation/play"
TOKEN=$(echo $TKN_STR | jq -r ".data.token")
NAME="2.log.json"
TITLE="curl_test"
IMPERSONATED_ID="3"

COMPLETE_URL="$BASE_ADDRESS/$PLAY_ADDRESS?token=$TOKEN&name=$NAME&title=$TITLE&impersonated_id=$IMPERSONATED_ID"

echo $COMPLETE_URL

GAME_STR=$(curl --get \
    --data-urlencode "token=$TOKEN" \
    --data-urlencode "name=$NAME" \
    --data-urlencode "title=$TITLE" \
    --data-urlencode "impersonated_id=$IMPERSONATED_ID" \
    "$BASE_ADDRESS/$PLAY_ADDRESS")

#Example answer: {"data":{"id":6,"type":"voting"}
#TODO: should contain a join string

# 3. Join the game

###
# Then you can open a websocket and join with the following message
#
#        {
#            "content": {
#                "gameId": <The one returned from the previous call>,
#                "type": "join",
#                "recovery": "zsyclz4b8izyq77n028zmgrxs3eutjqe8y0wt4ivtx8g06j85perwxslqif1ffc0"
#            },
#            "phase": 0,
#            "round": 1,
#            "type": "message"
#        },

GAME_ID=$(echo $GAME_STR | jq -r ".data.id")

SET_SPEED_ADDRESS="impersonation/set-speed"

sleep 5

curl --get \
    --data-urlencode "token=$TOKEN" \
    --data-urlencode "id=$GAME_ID" \
    --data-urlencode "speed=5" \
    "$BASE_ADDRESS/$SET_SPEED_ADDRESS"