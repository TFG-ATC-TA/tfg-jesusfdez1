# Dockerfile para el frontend (Next.js)
# Configuración multi-etapa para optimizar el tamaño de la imagen
# Utiliza Node.js Alpine para reducir el tamaño de la imagen base

FROM node:24-alpine AS base

# Establecer el directorio de trabajo
# Define el directorio donde se ejecutará la aplicación
WORKDIR /app

# Copiar archivos de manifiesto de paquetes
# Incluye package.json y package-lock.json para gestión de dependencias
COPY package*.json ./

# Etapa para instalar todas las dependencias
# Instala todas las dependencias de desarrollo y producción
FROM base AS deps
RUN npm install

# Etapa para construir la aplicación
# Compila la aplicación Next.js para producción
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# La variable de entorno es necesaria para que el build no falle
# Deshabilita la telemetría de Next.js para builds más rápidos
ENV NEXT_TELEMETRY_DISABLED=1

# Configurar variables de entorno para el build
# Recibe argumentos de build para configurar la aplicación
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ARG NEXT_PUBLIC_API_URL
ARG INTERNAL_API_URL
ARG NEXT_PUBLIC_WSS_URL

# Establecer variables de entorno para el proceso de build
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV INTERNAL_API_URL=$INTERNAL_API_URL
ENV NEXT_PUBLIC_WSS_URL=$NEXT_PUBLIC_WSS_URL

# Ejecutar el build de la aplicación
RUN npm run build

# Etapa de producción final
# Crea la imagen final optimizada para producción
FROM base AS runner
WORKDIR /app

# Copiar archivos de configuración y manifiesto
# Incluye configuración de Next.js y package.json
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/package.json ./

# Copiar artefactos de compilación y activos públicos
# Incluye el build de Next.js y archivos estáticos
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

# Instalar solo dependencias de producción
# Reduce el tamaño de la imagen final eliminando dependencias de desarrollo
RUN npm ci --omit=dev

# Exponer el puerto de la aplicación
# Define el puerto donde se ejecutará la aplicación
EXPOSE 3000

# Iniciar la aplicación
# Ejecuta la aplicación en modo producción
CMD ["sh", "-c", "NODE_ENV=production npm run start:docker"]
