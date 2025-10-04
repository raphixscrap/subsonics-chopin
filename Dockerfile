FROM node:lts-alpine

# Crée un dossier de travail
WORKDIR /app

# Copie package.json et package-lock.json
COPY package*.json ./

# Installe les dépendances
RUN npm install

# Copie le code source (mais pas le dossier data, qui sera monté en volume)
COPY . .

# Expose le port backend
EXPOSE 4000

# Commande de démarrage
CMD ["npm", "run", "start"]
