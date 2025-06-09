# Dockerfile para el backend (Node.js)
FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY . .

# Espera a que MongoDB esté disponible antes de iniciar el backend
RUN npm install -g wait-port

EXPOSE 3001

CMD ["sh", "-c", "wait-port mongo:27017 && node app.js"]
