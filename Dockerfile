FROM node:22-slim AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:22-slim AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY nest-cli.json ./
COPY tsconfig*.json ./
COPY src ./src

RUN npm run build

FROM node:22-slim AS production

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

RUN mkdir -p uploads && chown -R node:node /app

USER node

EXPOSE 8000

# Run node directly (not via npm) so Docker's SIGTERM reaches PID 1
# and the cluster primary can gracefully shut down all workers
CMD ["node", "dist/main"]
