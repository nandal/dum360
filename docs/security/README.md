# DUM360 — Security Model

> **Status:** Initial design. Living document — contributions to threat modeling and security hardening are welcome.

---

## Security Principles

1. **Zero-trust on consumer hardware.** Any device outside a sovereign/enterprise network is assumed compromised. Workloads must be encrypted and integrity-verified end-to-end (NFR-2.1, NFR-3.1).
2. **Sovereignty by design.** No operational data, processing fragments, or control-plane traffic may cross Indian borders (NFR-1.1). DR zones are both within India (NFR-1.2).
3. **Defense in depth.** Transport encryption, confidential computing sandbox, redundancy cross-verification, identity attestation.
4. **Honest threat model.** We protect against: rogue node operators, network intercept, workload tampering, and unauthorized emergency-mode activation. State-level actors with physical access are out of scope for v1.

---

## Threat Model

### Assets

| Asset | Sensitivity | Location |
|-------|------------|----------|
| Client workload data (inference payloads) | High (client IP, possibly personal data) | In transit + in sandbox on edge nodes |
| Client model weights (for inference) | High (IP) | Sovereign core + sandbox on edge nodes |
| Node provider identity/PII | Medium (personal data under DPDP) | Sovereign DB (Mumbai) |
| Usage/payment ledger | Medium (financial) | Sovereign DB (Mumbai) |
| Rashtra Seva activation credentials | Critical (national security) | HSM / multi-party governed |

### Attack Surfaces

| Surface | Threat | Mitigation |
|---------|--------|------------|
| Rogue node operator reads workload data from RAM/disk | Data exfiltration | Encrypted confidential computing sandbox (NFR-2.1). Host OS cannot read sandbox memory. |
| Rogue node operator returns falsified computation results | Result forgery | >=3x deterministic redundancy cross-verification (NFR-3.1). |
| Network MITM between node and core | Data intercept / tampering | TLS 1.3 end-to-end (NFR-2.2). Mutual authentication. |
| Unauthorized Rashtra Seva activation | National resource hijack | Cryptographic multi-party authentication (FR-4.1). |
| Malicious workload exploits sandbox escape | Cross-tenant attack | Sandbox isolation. Workloads cannot access host or other workloads. |
| Node spoofing — attacker registers fake nodes | Resource fraud | Hardware integrity check + Secure Enclave attestation (FR-1.3). |
| Sovereign DB compromise | Data breach | Firestore in production mode with strict rules. PII never publicly readable. Admin access via Console / Admin SDK only. |
| Sign-up spam / abuse | Garbage data in waitlist | Firebase App Check (reCAPTCHA). Rate limiting. One-entry-per-Google-account. |

---

## Security Architecture

### 1. Confidential Computing Sandbox
Every workload on an untrusted node runs inside an encrypted execution environment. The host operator cannot read the RAM, disk, or network traffic of the running workload.

**Design options (open for ADR):**

| Approach | Trust level | Performance | Complexity |
|----------|------------|-------------|------------|
| Software enclave (Gramine, Enarx) | Medium | Good | Medium |
| AMD SEV / Intel TDX (hardware TEE) | High | Good | High (requires specific hardware) |
| Encrypted container + remote attestation | Medium-High | Best | Low-Medium |
| Sandboxed WASM (mobile tier only) | Medium | Good (mobile) | Low |

**Decision needed:** ADR-004 — Confidential Computing Approach.

### 2. Transport Security
- TLS 1.3 for all node-to-core and core-to-core communication (NFR-2.2)
- Mutual TLS (mTLS) for node authentication
- Certificate pinning for sovereign core endpoints

### 3. Identity & Attestation
**Node registration flow:**
1. User installs agent -> agent generates node identity keypair
2. Agent performs hardware integrity check (TPM/Secure Enclave attestation where available)
3. Agent registers with sovereign core -> core issues signed node certificate
4. Certificate renewed periodically; revoked on uninstall

**Google Sign-In for portal:**
- Firebase Authentication with Google provider
- One signup per verified Google account (doc ID = UID)
- Firestore rules enforce: user can only read/update their own doc

### 4. Rashtra Seva Emergency Protocol
- **Multi-party authorization:** No single entity can activate. Requires N-of-M authorized government credentials.
- **Audit trail:** Every activation attempt logged immutably.
- **Time-bound:** Defined duration; automatic de-escalation.
- **Workload eviction:** All commercial workloads immediately paused/deprioritized (FR-4.2).
- **Mass notification:** All enrolled nodes notified (FR-4.3).

**Status:** Protocol spec needed. Governance to be co-developed with NDMA/MeitY in Phase 2-3.

### 5. Redundancy & Integrity
- **Deterministic redundancy >=3x:** Each computation chunk dispatched to >=3 independent nodes (NFR-3.1)
- **Result cross-verification:** Results must match across redundancy group
- **Byzantine fault tolerance:** Tolerates up to f malicious nodes in a 3f+1 group

---

## Data Classification

| Classification | Examples | Storage | Access | Retention |
|---------------|----------|---------|--------|-----------|
| Public | Landing page, benchmark doc | Firebase CDN | Public | Indefinite |
| Internal | Signup metadata (audience type, no PII) | Firestore Mumbai | Authenticated portal users (own data) | 24 months or on request |
| Confidential | Signup PII (name, email, phone) | Firestore Mumbai | Admin only | 24 months or on request |
| Restricted | Workload data, model weights | Encrypted sandbox (transient) | Only within sandbox | Duration of job only |
| Critical | Rashtra Seva credentials | HSM / air-gapped | Multi-party governed | Defined by governance |

---

## Security Roadmap

### Phase 1 (Current — Waitlist)
- [x] Firestore security rules (PII-protected)
- [x] HTTPS/TLS via Firebase Hosting
- [x] Security headers (CSP, HSTS, X-Frame-Options)
- [x] Google Auth for portal
- [x] Gitleaks pre-commit hook + CI
- [ ] Firebase App Check site key

### Phase 2 (Node Agent Alpha)
- [ ] Confidential computing sandbox implementation
- [ ] Node identity & attestation pipeline
- [ ] >=3x redundancy cross-verification
- [ ] mTLS between node and core

### Phase 3 (National Scale)
- [ ] Rashtra Seva cryptographic trigger (multi-party)
- [ ] Audit logging for emergency activations
- [ ] HSM-backed key management
- [ ] External security audit
- [ ] Bug bounty program

---

## Contributing to Security

We need contributors with expertise in:
- Confidential computing: AMD SEV, Intel TDX, software enclaves
- Distributed systems security: BFT, redundancy verification
- Applied cryptography: Multi-party auth, HSM integration
- Threat modeling: Expanding attack trees
- DPDP compliance: Data protection impact assessments

Report vulnerabilities via [SECURITY.md](../../SECURITY.md).
