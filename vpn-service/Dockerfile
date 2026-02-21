FROM node:18-alpine

# Install WireGuard tools
RUN apk add --no-cache wireguard-tools

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3800
EXPOSE 51820/udp

CMD ["node", "server.js"]
