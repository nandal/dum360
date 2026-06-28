FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++

COPY packages/shared/package.json /app/packages/shared/
COPY packages/shared/src/ /app/packages/shared/src/
COPY packages/shared/tsconfig.json /app/packages/shared/

COPY services/orchestration/package.json /app/services/orchestration/
COPY services/orchestration/src/ /app/services/orchestration/src/
COPY services/orchestration/tsconfig.json /app/services/orchestration/
COPY services/orchestration/drizzle.config.ts /app/services/orchestration/

COPY package.json turbo.json /app/

RUN npm install --ignore-scripts

WORKDIR /app/services/orchestration
ENV PORT=8082
EXPOSE 8082
HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8082/health | grep -q healthy || exit 1
CMD ["npx", "tsx", "src/main.ts"]
