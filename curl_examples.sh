# 1. Login
#
# Server: 188.166.34.67
# You should reimplement this logic in python. Keep the login token for the subsequent call

BASE_ADDRESS=http://localhost:3080/api/v1
LOGIN_ADDRESS=auth/login

USERNAME=admin
PASSWORD=aaa

LOGIN_STRING="{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}"

echo "curl -X POST -d \"$LOGIN_STRING\" $BASE_ADDRESS/$LOGIN_ADDRESS -H \"Content-Type: application/json\""

TKN_STR=$(curl -X POST -d "$LOGIN_STRING" $BASE_ADDRESS/$LOGIN_ADDRESS -H "Content-Type: application/json")

echo "Login response: $TKN_STR"
# 2. Run a game in impersonation mode. It will return when it's your time to join

#PLAY_ADDRESS="impersonation/play"
TOKEN=$(echo $TKN_STR | jq -r ".data.token")
#NAME="2.log.json"
#TITLE="curl_test"
#IMPERSONATED_ID="3"

echo "Token: $TOKEN"

#COMPLETE_URL="$BASE_ADDRESS/$PLAY_ADDRESS?token=$TOKEN&name=$NAME&title=$TITLE&impersonated_id=$IMPERSONATED_ID"

echo "$BASE_ADDRESS/games/list"

GAME_STR=$(curl --get --data-urlencode "token=$TOKEN" "$BASE_ADDRESS/games/list")

echo "Game response: $GAME_STR"