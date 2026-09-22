# Imagen del servicio de ventas (AD-007: TypeScript sobre Node 24). Ejecuta con tsx,
# igual que en desarrollo, porque el proyecto no tiene paso de compilación (noEmit).
# Contexto de build: la RAÍZ del monorepo (para incluir los workspaces de packages/).
FROM node:24-slim

WORKDIR /app

# Manifiestos primero para aprovechar la caché de capas de dependencias.
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/ventas/package.json ./apps/ventas/package.json

# Instala todo el workspace (incluye tsx, fastify, pg, ioredis, kafkajs, prom-client, otel).
RUN npm install

# Código de la aplicación y sus dependencias de dominio.
COPY apps/ventas/ ./apps/ventas/

ENV NODE_ENV=production
EXPOSE 3000

# Migraciones y semilla se corren como Jobs de Kubernetes; aquí solo el servicio.
CMD ["node", "--import", "tsx", "apps/ventas/src/main.ts"]
