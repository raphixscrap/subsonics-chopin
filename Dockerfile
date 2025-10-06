FROM node:lts-alpine

WORKDIR /app

# Installer bash et autres outils utiles
RUN apk add --no-cache bash

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4000
CMD ["npm", "run", "start"]
