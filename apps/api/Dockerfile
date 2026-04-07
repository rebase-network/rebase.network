FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install --frozen-lockfile

FROM deps AS build
RUN pnpm --filter @rebase/shared build \
  && pnpm --filter @rebase/db build \
  && pnpm --filter @rebase/api build

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /app/tsconfig.base.json ./tsconfig.base.json
COPY --from=build /app/apps ./apps
COPY --from=build /app/packages ./packages
EXPOSE 8788
CMD ["sh", "-lc", "pnpm --filter @rebase/db migrate && node apps/api/dist/index.js"]
