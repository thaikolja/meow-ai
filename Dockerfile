# 🐾 The Cat-Container: Production Bun Dockerfile
FROM oven/bun:latest as build-stage

# Set the cat cave
WORKDIR /app

# Copy the yarn-ball and paws-cfg
COPY package.json bun.lock ./

# Install dependencies before any scratching
RUN bun install --frozen-lockfile

# Copy the rest of the cat's toys
COPY . .

# Build the purr-fect app
RUN bun run build

# Stage 2: The Final Kitty Landing
FROM oven/bun:latest

WORKDIR /app

# Copy the results of the build
COPY --from=build-stage /app/.output ./.output
COPY --from=build-stage /app/package.json ./package.json

# Environment variables for production
ENV PORT=3000
ENV NODE_ENV=production

# The final meow
EXPOSE 3000

# Start the purring
CMD ["bun", ".output/server/index.mjs"]
