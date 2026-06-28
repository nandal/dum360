# DUM360 Node Agent - Blank Linux Machine (MVP)
FROM node:22-alpine

RUN apk add --no-cache git openssh-client curl wget bash

RUN echo '#!/bin/sh' > /tmp/gh-stub && echo 'echo "[gh stub] \$@"' >> /tmp/gh-stub && chmod +x /tmp/gh-stub && mv /tmp/gh-stub /usr/local/bin/gh
RUN echo '#!/bin/sh' > /tmp/cl-stub && echo 'echo "[claude stub] Done."' >> /tmp/cl-stub && chmod +x /tmp/cl-stub && mv /tmp/cl-stub /usr/local/bin/claude
RUN echo '#!/bin/sh' > /tmp/cx-stub && echo 'echo "[codex stub] \$@"' >> /tmp/cx-stub && chmod +x /tmp/cx-stub && mv /tmp/cx-stub /usr/local/bin/codex
RUN echo '#!/bin/sh' > /tmp/gm-stub && echo 'echo "[gemini stub] \$@"' >> /tmp/gm-stub && chmod +x /tmp/gm-stub && mv /tmp/gm-stub /usr/local/bin/gemini

WORKDIR /app
COPY package.json tsconfig.json ./
COPY src/ ./src/
RUN npm install

RUN mkdir -p /tmp/dum360/workspaces

ENV SERVER_URL=http://gateway:8080
ENV NODE_NAME=docker-node
ENV NODE_VERSION=0.1.0
ENV AI_PROVIDER=claude
ENV POLL_INTERVAL=5
ENV HEARTBEAT_INTERVAL=15
ENV MAX_CONCURRENT_TASKS=1
ENV WORK_DIR=/tmp/dum360/workspaces
ENV LOCAL_API_PORT=9090

EXPOSE 9090
HEALTHCHECK --interval=15s --timeout=5s --retries=3 CMD wget -qO= http://127.0.0.1:9090/health | grep -q healthy || exit 1

CMD ["npx", "tsx", "src/main.ts"]
