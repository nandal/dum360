FROM node:22-alpine
WORKDIR /app

COPY packages/shared/package.json /app/packages/shared/
COPY packages/shared/src/ /app/packages/shared/src/
COPY packages/shared/tsconfig.json /app/packages/shared/

COPY services/log/package.json /app/services/log/
COPY services/log/src/ /app/services/log/src/
COPY services/log/tsconfig.json /app/services/log/

COPY package.json turbo.json /app/

RUN npm install --ignore-scripts

WORKDIR /app/services/log
ENV PORT=8083
EXPOSE 8083
HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8083/health | grep -q healthy || exit 1
CMD ["npx", "tsx", "src/main.ts"]
