/**
 * DUM360 Node Agent — bootstrap.
 *
 * Startup sequence:
 *   1. Load configuration
 *   2. Detect local capabilities (tools, runtimes, services)
 *   3. Register with server → get JWT + nodeId
 *   4. Start heartbeat loop (every 15s)
 *   5. Start task polling loop (every 5s)
 *   6. Start local management API (:9090)
 *   7. Handle graceful shutdown
 */
import { loadConfig } from './config';
import { ServerClient } from './server-client';
import { HeartbeatLoop } from './heartbeat';
import { TaskPoller } from './poller';
import { GitHubExecutor } from './executors/github.executor';
import { startLocalApi } from './api/local-api';
import { detectCapabilities } from './capabilities';

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════╗');
  console.log('║  DUM360 Node Agent  v0.1.0      ║');
  console.log('╚══════════════════════════════════╝');

  const config = loadConfig();

  // Validate required config
  if (!config.registrationToken) {
    console.error('FATAL: REGISTRATION_TOKEN not set');
    process.exit(1);
  }

  // Create server client
  const client = new ServerClient(config);

  // Detect local capabilities
  const capabilities = await detectCapabilities();

  // Register with server
  console.log(`[register] Registering as "${config.nodeName}" with ${config.serverUrl}...`);
  const registration = await client.register({
    name: config.nodeName,
    version: config.version,
    capabilities,
  });
  console.log(`[register] Registered! nodeId: ${registration.nodeId}`);
  console.log(`[register] Attested: ${JSON.stringify(Object.values(registration.attestedCapabilities).flat().map((c: { id: string }) => c.id))}`);
  if (registration.failedAttestations.length > 0) {
    console.warn(`[register] Failed attestations: ${JSON.stringify(registration.failedAttestations)}`);
  }

  // Register executor(s)
  const executors = [
    new GitHubExecutor({
      workDir: config.workDir,
      aiProvider: config.aiProvider,
    }),
  ];

  // Probe executors
  for (const executor of executors) {
    const probe = await executor.probe();
    console.log(`[executor] ${executor.id()}: ${probe.passed ? 'ready' : 'not available — ' + probe.reason}`);
  }

  // Start heartbeat loop
  const heartbeat = new HeartbeatLoop(client, config, () => poller.runningTaskCount);
  heartbeat.start();

  // Start task poller
  const poller = new TaskPoller(client, config, executors);
  poller.start();

  // Start local management API
  startLocalApi(config, client, () => poller.runningTaskCount);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[shutdown] Received ${signal} — shutting down...`);
    heartbeat.stop();
    poller.stop();

    // Send final offline heartbeat
    try {
      await client.heartbeat({
        status: 'offline',
        resources: { cpu: { used: 0, total: 0 }, ram: { used: '0GB', total: '0GB' } },
        runningTasks: 0,
        version: config.version,
      });
    } catch {
      // Ignore — server might already be down
    }

    console.log('[shutdown] Goodbye.');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  console.log('[node] Ready. Polling for tasks...');
}

main().catch((error) => {
  console.error('FATAL:', error);
  process.exit(1);
});
