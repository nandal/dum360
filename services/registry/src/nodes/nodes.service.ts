import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
  Inject,
} from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { eq, and, sql, desc, isNull, type SQL } from 'drizzle-orm';
import { DRIZZLE_DB, type JwtNodePayload } from '@dum360/shared';
import {
  OFFLINE_THRESHOLD,
  type RegisterNodeRequest,
  type RegisterNodeResponse,
  type DeclaredCapability,
  type FailedAttestation,
  type NodeDetail,
} from '@dum360/shared';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schema';
import type { AttestationService } from '../attestation/attestation.service';

@Injectable()
export class NodesService {
  private readonly logger = new Logger(NodesService.name);

  constructor(
    @Inject(DRIZZLE_DB) private db: PostgresJsDatabase<typeof schema>,
    private readonly jwtService: JwtService,
    private readonly attestation: AttestationService,
  ) {}

  // ─── Registration ────────────────────────────────────────────────────

  async register(req: RegisterNodeRequest): Promise<RegisterNodeResponse> {
    // Check name uniqueness
    const existing = await this.db
      .select({ id: schema.nodes.id })
      .from(schema.nodes)
      .where(eq(schema.nodes.name, req.name))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`Node "${req.name}" already registered`);
    }

    // Create node
    const [node] = await this.db
      .insert(schema.nodes)
      .values({ name: req.name, version: req.version })
      .returning();

    // Register capabilities
    await this.registerCapabilities(node.id, req.capabilities);

    // Run attestation
    const { attested, failed } = await this.attestation.attest(
      node.id,
      req.capabilities,
    );

    // Generate JWT
    const payload: JwtNodePayload = {
      sub: node.id,
      name: node.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 604800, // 7 days
    };
    const jwt = await this.jwtService.signAsync(payload);

    this.logger.log(`Node registered: ${node.name} (${node.id})`);

    return {
      nodeId: node.id,
      jwt,
      heartbeatInterval: 15,
      pollInterval: 5,
      attestedCapabilities: attested,
      failedAttestations: failed,
    };
  }

  private async registerCapabilities(
    nodeId: string,
    declared: RegisterNodeRequest['capabilities'],
  ): Promise<void> {
    const allCapabilities: DeclaredCapability[] = [
      ...declared.executors,
      ...declared.resources,
      ...declared.tools,
      ...declared.runtimes,
      ...declared.services,
    ];

    for (const cap of allCapabilities) {
      // Upsert capability into catalog
      const [existing] = await this.db
        .select({ id: schema.capabilities.id })
        .from(schema.capabilities)
        .where(
          and(
            eq(schema.capabilities.name, cap.id),
            // infer category — simplified: treat all as 'tool' for catalog
            // real implementation: pass category from registration payload
          ),
        )
        .limit(1);

      let capabilityId: string;
      if (existing) {
        capabilityId = existing.id;
      } else {
        const [inserted] = await this.db
          .insert(schema.capabilities)
          .values({
            category: 'tool', // simplified — real impl infers from payload structure
            name: cap.id,
            version: cap.version ?? null,
          })
          .returning();
        capabilityId = inserted.id;
      }

      // Link capability to node
      await this.db
        .insert(schema.nodeCapabilities)
        .values({
          nodeId,
          capabilityId,
          value: cap.value ?? null,
        })
        .onConflictDoUpdate({
          target: [schema.nodeCapabilities.nodeId, schema.nodeCapabilities.capabilityId],
          set: { value: cap.value ?? null, attestedAt: new Date() },
        });
    }
  }

  // ─── Queries ─────────────────────────────────────────────────────────

  async listNodes(filters: { status?: string }): Promise<{
    nodes: NodeDetail[];
    total: number;
  }> {
    const conditions: SQL[] = [];
    if (filters.status) {
      const s = filters.status as typeof schema.nodeStatusEnum.enumValues[number];
      conditions.push(eq(schema.nodes.status, s));
    }

    const rows = await this.db
      .select()
      .from(schema.nodes)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(schema.nodes.registeredAt));

    const nodes = rows.map((row) => ({
      ...row,
      capabilities: {
        executors: [],
        resources: [],
        tools: [],
        runtimes: [],
        services: [],
      },
      resources: { cpu: { used: 0, total: 0 }, ram: { used: '0GB', total: '0GB' } },
      taskHistory: { total: 0, completed: 0, failed: 0 },
    }));

    return { nodes, total: rows.length };
  }

  async getNode(nodeId: string): Promise<NodeDetail> {
    const [row] = await this.db
      .select()
      .from(schema.nodes)
      .where(eq(schema.nodes.id, nodeId))
      .limit(1);

    if (!row) throw new NotFoundException(`Node ${nodeId} not found`);

    // Fetch capabilities
    const caps = await this.db
      .select()
      .from(schema.nodeCapabilities)
      .innerJoin(
        schema.capabilities,
        eq(schema.nodeCapabilities.capabilityId, schema.capabilities.id),
      )
      .where(eq(schema.nodeCapabilities.nodeId, nodeId));

    const executors: DeclaredCapability[] = [];
    const resources: DeclaredCapability[] = [];
    const tools: DeclaredCapability[] = [];
    const runtimes: DeclaredCapability[] = [];
    const services: DeclaredCapability[] = [];

    for (const c of caps) {
      const d: DeclaredCapability = {
        id: c.capabilities.name,
        value: c.node_capabilities.value ?? undefined,
        version: c.capabilities.version ?? undefined,
      };
      switch (c.capabilities.category) {
        case 'executor': executors.push(d); break;
        case 'resource': resources.push(d); break;
        case 'tool': tools.push(d); break;
        case 'runtime': runtimes.push(d); break;
        case 'service': services.push(d); break;
      }
    }

    return {
      ...row,
      capabilities: { executors, resources, tools, runtimes, services },
      resources: { cpu: { used: 0, total: 0 }, ram: { used: '0GB', total: '0GB' } },
      taskHistory: { total: 0, completed: 0, failed: 0 },
    };
  }

  /** Find online/busy nodes whose last heartbeat is within the offline threshold. */
  async findAvailableNodes(): Promise<{ id: string; status: string }[]> {
    const threshold = new Date(Date.now() - OFFLINE_THRESHOLD * 1000);
    return this.db
      .select({ id: schema.nodes.id, status: schema.nodes.status })
      .from(schema.nodes)
      .where(
        and(
          sql`${schema.nodes.status} IN ('online', 'busy')`,
          sql`${schema.nodes.lastHeartbeatAt} > ${threshold}`,
          isNull(schema.nodes.currentTaskId),
        ),
      );
  }

  async updateNodeStatus(
    nodeId: string,
    status: typeof schema.nodeStatusEnum.enumValues[number],
  ): Promise<void> {
    await this.db
      .update(schema.nodes)
      .set({ status, lastHeartbeatAt: new Date() })
      .where(eq(schema.nodes.id, nodeId));
  }

  async setCurrentTask(nodeId: string, taskId: string | null): Promise<void> {
    await this.db
      .update(schema.nodes)
      .set({ currentTaskId: taskId })
      .where(eq(schema.nodes.id, nodeId));
  }
}
