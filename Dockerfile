FROM node:lts-alpine

WORKDIR /app

# 1. Installer les dépendances système requises
# python3 : indispensable pour faire tourner yt-dlp
# ffmpeg  : nécessaire pour certaines conversions audio ou formats spécifiques
# curl    : pour télécharger yt-dlp
RUN apk add --no-cache bash python3 ffmpeg curl

# 2. Installer yt-dlp (Dernière version officielle)
# On le place dans /usr/local/bin pour qu'il soit accessible globalement dans le PATH
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# 3. Installation des dépendances Node.js
COPY package*.json ./
RUN npm install

# 4. Copie du reste du code
COPY . .

EXPOSE 4000
CMD ["npm", "run", "start"]