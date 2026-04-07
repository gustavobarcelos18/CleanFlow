# WhatsApp Worker Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar apenas package.json primeiro para cache de camadas
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o restante do código fonte
COPY . .

# Compilar TypeScript para JavaScript
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runtime

WORKDIR /app

# Copiar apenas o necessário da stage de builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Variáveis de ambiente padrão (podem ser sobrescritas no docker-compose)
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Comando para iniciar o worker
CMD ["npm", "start"]
