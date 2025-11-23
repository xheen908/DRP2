# Basisimage
FROM node:18-alpine

# Arbeitsverzeichnis im Container setzen
WORKDIR /app

# package.json und package-lock.json kopieren
COPY package*.json ./

# Abhängigkeiten installieren
RUN npm install

# Rest des Anwendungscodes kopieren
COPY . .

# Port exponieren, auf dem die App läuft
EXPOSE 3009

# Startbefehl
CMD ["npm", "start"]