ARG BUN_VERSION=1.3.11
ARG NODE_VERSION=22-bookworm-slim

FROM oven/bun:${BUN_VERSION} AS deps

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS build

WORKDIR /app

COPY . .
RUN bun run build

FROM oven/bun:${BUN_VERSION} AS prod-deps

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM node:${NODE_VERSION} AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    NUXT_TELEMETRY_DISABLED=1 \
    HOST=0.0.0.0 \
    NITRO_HOST=0.0.0.0 \
    PORT=3000 \
    NITRO_PORT=3000

COPY --from=build --chown=node:node /app/.output ./.output
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules

USER node

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
