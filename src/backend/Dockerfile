# Dockerfile para el backend (Node.js)
FROM node:24-alpine

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --omit=dev

# Copiar todo el código fuente
COPY . .

# Exponer puerto
EXPOSE 5001

# Iniciar la aplicación
CMD ["npm", "run", "start:docker"]