# Dockerfile para el backend (Node.js)
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 5001

CMD ["sh", "-c", "NODE_ENV=production npm run start:docker"]