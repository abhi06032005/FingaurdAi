# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev) to build TypeScript
RUN pnpm install --frozen-lockfile

COPY src ./src/
RUN pnpm run build

# Remove development dependencies
RUN pnpm prune --prod

# Stage 2: Runtime
FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000

ENV NODE_ENV=production

CMD ["pnpm", "run", "start"]
