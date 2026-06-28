FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++

COPY packages/shared/package.json /app/packages/shared/
COPY packages/shared/src/ /app/packages/shared/src/
COPY packages/shared/tsconfig.json /app/packages/shared/

COPY services/registry/package.json /app/services/registry/
COPY services/registry/src/ /app/services/registry/src/
COPY services/registry/tsconfig.json /app/services/registry/
COPY services/registry/drizzle.config.ts /app/services/registry/

COPY package.json turbo.json /app/

RUN npm install --ignore-scripts

WORKDIR /app/services/registry
ENV PORT=8081
EXPOSE 8081
HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8081/health | grep -q healthy || exit 1
CMD ["npx", "tsx", "src/main.ts"]
