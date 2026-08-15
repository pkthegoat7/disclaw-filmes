# the node version for running Disclaw
ARG NODE_VERSION=22-alpine
FROM node:$NODE_VERSION AS base

# Setup pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable
RUN apk add --no-cache git

# Meta
LABEL Description="Disclaw" Vendor="Smart Code OOD" Version="1.0.0"

RUN mkdir -p /var/www/disclaw
WORKDIR /var/www/disclaw

# Setup app
FROM base AS app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /var/www/disclaw
RUN pnpm i --frozen-lockfile

COPY . /var/www/disclaw
RUN pnpm build

# Setup server
FROM base AS server

RUN pnpm i express@4

# Finalize
FROM base

COPY http_server.js /var/www/disclaw
COPY --from=server /var/www/disclaw/node_modules /var/www/disclaw/node_modules
COPY --from=app /var/www/disclaw/build /var/www/disclaw/build

EXPOSE 8080
CMD ["node", "http_server.js"]
