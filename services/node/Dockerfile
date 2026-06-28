FROM node:22-alpine

RUN apk add --no-cache git openssh-client curl wget bash

# CLI stubs (MPP — production uses real gh, claude, codex, gemini)
RUN printf '#!/bin/sh\necho "[gh stub] $@"' | tee /usr/local/bin/gh > /dev/null && chmod +x /usr/local/bin/gh
RUN printf '#!/bin/sh\necho "[claude stub] Done."' | tee /usr/local/bin/claude > /dev/null && chmod +x /usr/local/bin/claude
RUN printf '#!/bin/sh\necho "[codex stub] \$@"' | tee /usr/local/bin/codex > /dev/null && chmod +x /usr/local/bin/codex
RUN printf '#!/bin/sh\necho "[gemini stub] \$@"' | tee /usr/local/bin/gemini > /dev/null && chmod +x /usr/local/bin/gemini

WORKDIR /app

COPY packages/shared/package.json /app/packages/shared/
COPY packages/shared/src/ /app/packages/shared/src/
COPY packages/shared/tsconfig.json /app/packages/shared/

COPY services/node/package.json /app/services/node/
COPY services/node/src/ /app/services/node/src/
COPY services/node/tsconfig.json /app/services/node/

COPY package.json turbo.json /app/

RUN npm install --ignore-scripts

RUN mkdir -p /tmp/dum360/workspaces

ENV NODE_VERSION=0.1.0
ENV POLL_INTERVAL=5
ENV HEARTBEAT_INTERVAL=15
ENV MAX_CONCURRENT_TASKS=1
ENV WORK_DIR=/tmp/dum360/workspaces
ENV LOCAL_API_PORT=9090

WORKDIR /app/services/node
EXPOSE 9090
HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:9090/health 2>/dev/null | grep -q healthy || exit 1
CMD ["npx", "tsx", "src/main.ts"]
