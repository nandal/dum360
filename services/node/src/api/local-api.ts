/**
 * Local Node API — serves health, status, and operational endpoints on :9090.
 * Bound to 127.0.0.1 — not exposed to the internet.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { NodeConfig } from '../config';
import type { ServerClient } from '../server-client';

export function startLocalApi(
  config: NodeConfig,
  client: ServerClient,
  getRunningTasks: () => number,
): void {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? '/', `http://localhost:${config.localApiPort}`);

    if (req.method === 'GET' && url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        version: config.version,
        nodeId: client.getNodeId(),
        serverConnected: !!client.getJwt(),
      }));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        nodeId: client.getNodeId(),
        name: config.nodeName,
        version: config.version,
        serverUrl: config.serverUrl,
        runningTasks: getRunningTasks(),
        aiProvider: config.aiProvider,
      }));
      return;
    }

    res.writeHead(404);
    res.end();
  });

  server.listen(config.localApiPort, '127.0.0.1', () => {
    console.log(`[api] Local API on http://127.0.0.1:${config.localApiPort}`);
  });
}
