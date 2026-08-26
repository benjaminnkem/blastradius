FROM node:22-alpine AS base
WORKDIR /app
RUN npm install -g pnpm turbo

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN turbo run build --filter=@blastradius/api

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app /app
EXPOSE 4000
CMD ["pnpm", "--filter", "@blastradius/api", "start"]
