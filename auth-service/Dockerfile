# Dockerfile für den Auth Microservice

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

# Der Auth Service lauscht intern auf Port 3001
EXPOSE 3001

CMD [ "npm", "start" ]