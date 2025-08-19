FROM node:22-alpine

WORKDIR /app


# Copy package.json first for caching
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm install

# Copy the rest of the app
COPY . .

# Build the app
RUN npm run build

EXPOSE ${API_PORT} ${VUE_APP_WSS_PORT}
CMD ["npm", "run", "start"]