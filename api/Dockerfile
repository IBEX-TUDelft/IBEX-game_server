FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE ${API_PORT} ${VUE_APP_WSS_PORT}
CMD ["node", "server.js"]