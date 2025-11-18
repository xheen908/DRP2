# Dockerfile für den Job Microservice

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

# Der Job Service lauscht intern auf Port 3002
EXPOSE 3002

CMD [ "npm", "start" ]