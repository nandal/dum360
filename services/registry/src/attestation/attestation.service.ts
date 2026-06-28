import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_DB } from '@dum360/shared';
import type {
  DeclaredCapabilities,
  DeclaredCapability,
  FailedAttestation,
} from '@dum360/shared';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schema';

/**
 * Capability attestation service.
 * MVP: all capabilities pass (node self-declaration trusted).
 * Post-MVP: pluggable attestors probe actual binaries.
 */
@Injectable()
export class AttestationService {
  private readonly logger = new Logger(AttestationService.name);

  constructor(
    @Inject(DRIZZLE_DB) private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async attest(
    nodeId: string,
    declared: DeclaredCapabilities,
  ): Promise<{
    attested: DeclaredCapabilities;
    failed: FailedAttestation[];
  }> {
    const all: DeclaredCapability[] = [
      ...declared.executors,
      ...declared.resources,
      ...declared.tools,
      ...declared.runtimes,
      ...declared.services,
    ];

    const attested: DeclaredCapabilities = {
      executors: [],
      resources: [],
      tools: [],
      runtimes: [],
      services: [],
    };
    const failed: FailedAttestation[] = [];

    for (const cap of all) {
      const result = await this.probeCapability(cap);

      // Find the capability row by name
      const [capRow] = await this.db
        .select({ id: schema.capabilities.id })
        .from(schema.capabilities)
        .where(eq(schema.capabilities.name, cap.id))
        .limit(1);

      if (capRow) {
        // Record attestation result
        await this.db.insert(schema.attestationResults).values({
          nodeId,
          capabilityId: capRow.id,
          passed: result.passed,
          reason: result.reason ?? null,
        });
      }

      if (result.passed) {
        if (declared.executors.some((e) => e.id === cap.id))
          attested.executors.push(cap);
        else if (declared.resources.some((r) => r.id === cap.id))
          attested.resources.push(cap);
        else if (declared.tools.some((t) => t.id === cap.id))
          attested.tools.push(cap);
        else if (declared.runtimes.some((r) => r.id === cap.id))
          attested.runtimes.push(cap);
        else if (declared.services.some((s) => s.id === cap.id))
          attested.services.push(cap);
      } else {
        failed.push({ id: cap.id, reason: result.reason ?? 'Unknown' });
      }
    }

    this.logger.log(
      `Attestation: ${nodeId} — ${all.length - failed.length}/${all.length} passed`,
    );

    return { attested, failed };
  }

  /** Probe a single capability. MVP: trust node self-declaration. */
  private async probeCapability(
    _cap: DeclaredCapability,
  ): Promise<{ passed: boolean; reason?: string }> {
    // MVP: trust the node
    // Post-MVP: exec(`${cap.id} --version`)
    return { passed: true };
  }
}
