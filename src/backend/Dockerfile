# Dockerfile para el backend (Node.js)
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 3001

RUN npm run start