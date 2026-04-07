ARG BUN_VERSION=1.2
ARG NODE_VERSION=22-bookworm-slim

# Stage 1: install all dependencies (needed for the build)
FROM oven/bun:${BUN_VERSION} AS deps

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Stage 2: build the Nuxt/Nitro app
# The resulting .output/ directory is fully self-contained with its own
# node_modules, so no separate prod-deps stage is required.
FROM deps AS build

WORKDIR /app

COPY . .
RUN bun run build

# Stage 3: lean runtime image
FROM node:${NODE_VERSION} AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    NUXT_TELEMETRY_DISABLED=1 \
    HOST=0.0.0.0 \
    NITRO_HOST=0.0.0.0 \
    PORT=3000 \
    NITRO_PORT=3000

# Only copy the self-contained Nitro output — no outer node_modules needed.
COPY --from=build --chown=node:node /app/.output ./.output

# Persist provider and model data outside the container layer.
VOLUME ["/app/.data"]

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/auth/session').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", ".output/server/index.mjs"]
