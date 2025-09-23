# Dockerfile simple para el frontend (Next.js)
FROM node:24-alpine AS builder

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar todo el código fuente
COPY . .

# Configurar variables de entorno para el build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Ejecutar el build de la aplicación
RUN npm run build

# Imagen final de producción
FROM node:24-alpine

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

# Copiar archivos necesarios desde el builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./

# Exponer puerto
EXPOSE 3000

# Iniciar la aplicación
CMD ["npm", "run", "start:docker"]
