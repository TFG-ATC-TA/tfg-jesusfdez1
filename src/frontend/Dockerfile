# Dockerfile para el frontend (Next.js)
FROM node:24-alpine AS base

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de manifiesto de paquetes
COPY package*.json ./

# Etapa para instalar todas las dependencias
FROM base AS deps
RUN npm install

# Etapa para construir la aplicación
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# La variable de entorno es necesaria para que el build no falle
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Etapa de producción final
FROM base AS runner
WORKDIR /app

# Copiar archivos de configuración y manifiesto
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/package.json ./

# Copiar artefactos de compilación y activos públicos
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

EXPOSE 3000

# Iniciar la aplicación
CMD ["npm", "start"]
