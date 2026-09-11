FROM node:22.22.3-bookworm-slim AS base

WORKDIR /opt/app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY patches ./patches
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build
RUN pnpm prune --prod

ENV NODE_ENV=production

EXPOSE 1337
CMD ["pnpm", "run", "start"]
