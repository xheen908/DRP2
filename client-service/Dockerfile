# Dockerfile für den Client Microservice

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

# Der Client Service lauscht intern auf Port 3006
EXPOSE 3006

CMD [ "npm", "start" ]