FROM node:22-alpine
WORKDIR /app

# Copy shared package (workspace dependency)
COPY packages/shared/package.json /app/packages/shared/
COPY packages/shared/src/ /app/packages/shared/src/
COPY packages/shared/tsconfig.json /app/packages/shared/

# Copy service
COPY services/gateway/package.json /app/services/gateway/
COPY services/gateway/src/ /app/services/gateway/src/
COPY services/gateway/tsconfig.json /app/services/gateway/

# Root workspace config
COPY package.json turbo.json /app/

# Install deps at root (npm workspaces hoists everything)
WORKDIR /app
RUN npm install --ignore-scripts

# Runtime
WORKDIR /app/services/gateway
ENV PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/health | grep -q healthy || exit 1
CMD ["npx", "tsx", "src/main.ts"]
