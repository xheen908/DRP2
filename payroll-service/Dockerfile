# DRP2/payroll-service/Dockerfile (für Puppeteer, mit erweiterten Abhängigkeiten)
FROM node:18-alpine

# Installiere Chromium und seine Abhängigkeiten
# Erweitert um weitere potenzielle Abhängigkeiten für stabile GUI-Rendering-Bibliotheken.
# Diese Liste deckt häufig fehlende Pakete ab, die Chromium auf Alpine benötigt.
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    harfbuzz-icu \
    gdk-pixbuf \
    libwebp \
    libpng \
    libjpeg-turbo \
    pango \
    cairo

# Setze Umgebungsvariablen für Puppeteer
# Dies weist Puppeteer an, Chromium nicht herunterzuladen (da es bereits im Image ist)
# und den Pfad zur ausführbaren Chromium-Datei zu verwenden.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

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