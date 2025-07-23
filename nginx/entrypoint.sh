#!/bin/sh

envsubst '${BACKEND_HOST} ${API_PORT} ${VUE_APP_WSS_PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g "daemon off;"