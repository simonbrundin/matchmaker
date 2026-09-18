FROM oven/bun:1-alpine

# Install Python for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY src/nuxt/package.json src/nuxt/bun.lock* ./
RUN bun install

COPY src/nuxt/ .
COPY environments/common/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
