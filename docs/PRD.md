This Product Requirement Document (PRD) takes your original master-slave filesystems design and published research concepts and scales them into a localized, national infrastructure platform.

By partnering exclusively with **domestic Indian Cloud Providers and Data Centers** (such as E2E Networks, CtrlS, Yotta, or National Informatics Centre (NIC) public sector clouds), you solve data sovereignty laws (like India's Digital Personal Data Protection Act) right out of the gate. Sensitive government data and national orchestration metadata never leave Indian soil.

---

# Product Requirement Document (PRD)

## Project: DUM360 (Distributed Unified Mesh 360)

**Document Version:** 1.0

**Target Region:** India (Sovereign Infrastructure Only)

**Authors:** Sandeep Nandal

---

## 1. Executive Summary & Vision

### 1.1 Core Mission

DUM360 is India’s first decentralized, citizen-powered, eco-friendly edge supercomputer network. Its founding thesis is simple: **at any given moment, the vast majority of the nation's computing power sits idle** — phones at night, gaming PCs after hours, university and PSU labs over evenings, weekends and vacations, enterprise and MSME workstations outside business hours, and surplus daytime solar-powered GPU rigs. DUM360 aggregates **all of this idle capacity — consumer, institutional, governmental and commercial — across the entire country** into a single massive, secure, sovereign cloud infrastructure mesh.

It pools, among others: consumer electronics (smartphones, desktops, gaming laptops); university and research-institution labs (IITs, NITs, IIITs, central/state universities) interconnected over the National Knowledge Network (NKN); government and PSU compute labs and data centres; private enterprise, MSME and startup workstations and servers; and specialized clean-energy setups (solar-grid attached compute rigs in regions like Rajasthan and Gujarat).

### 1.2 Dual-Use Mandate

1. **Commercial Peace-Time Mode:** Provides hyper-affordable, localized AI training, LLM inference, and video rendering services to Indian startups and academics, paying everyday contributors direct micro-incentives via UPI.
2. **Sovereign Emergency Mode ("Rashtra Seva Mode"):** Instantly mobilizes the collective multi-ExaFLOP pool of national compute to solve public-good crises—such as disaster climate modeling, bio-defense sequencing, or cryptographic cybersecurity defense or even war like situations.

### 1.3 Infrastructure Constraint

**100% Indian Cloud/Data Center Hosting.** The core cluster management control planes, metadata databases, and secure relay proxies will run exclusively on domestic Indian cloud providers and data centers. No data or orchestration protocols will cross geographic borders.

### 1.4 The National Idle-Compute Thesis

DUM360 treats **every powered-on, under-utilized processor in India as latent national infrastructure.** Rather than relying on new data centres alone, it harvests capacity that already exists and is already paid for:

| Source | Typical idle window | Why it matters |
| --- | --- | --- |
| Consumer phones & PCs | Nights / off-hours | Largest device count; burst throughput |
| University & research labs (IIT/NIT/IIIT) | Evenings, weekends, vacations | LAN-clustered + NKN-linked → real parallelism |
| Government & PSU labs / data centres | Off-hours, spare capacity | High trust, sovereign by default |
| Enterprise / MSME / startup machines | Outside business hours | Wired, powered, predictable |
| Solar GPU rigs (GJ / RJ) | Daytime surplus generation | Cheapest, greenest cycles |

The goal is a **single national fabric** in which any idle cycle, anywhere in the country, can be safely and verifiably put to productive use — and instantly reclaimed by its owner.

---

## 2. Personas & Stakeholders

| Persona | Description | Primary Goal / Motivation |
| --- | --- | --- |
| **The Citizen Provider** | Everyday consumer with a smartphone, PC, or gaming laptop. | Earn passive income via UPI by enabling their idle device during specified off-hours (e.g., at night). |
| **The Solar Arbitrageur** | Operators/investors in solar-heavy states (GJ/RJ) with custom GPU hardware. | Monetize zero-cost surplus daytime solar energy by renting out computing cycles. |
| **The Institutional Provider** | Universities & research institutions (IITs, NITs, IIITs, central/state universities) and their IT/admin departments. | Convert idle lab & HPC capacity (nights, weekends, vacations) into compute-grants, institutional credits or revenue-share; advance national research. |
| **The Enterprise & MSME Provider** | Private firms, startups, MSMEs and PSUs with workstations, servers or labs idle outside business hours. | Offset IT spend by renting spare on-prem compute into a sovereign national pool. |
| **The Enterprise/AI Client** | Indian startups, researchers, and developers. | Access massively scalable GPU/CPU compute at a fraction of standard public cloud costs. |
| **The Sovereign Admin** | Verified Government officials / Disaster Management teams. | Trigger Emergency Mode to redirect national computing assets toward immediate crisis response. |

---

## 3. Product Architecture & Component Flow

```
+------------------------------------------------------------------------+
|                      SOVEREIGN CORE MANAGEMENT LAYER                   |
|          (Hosted Exclusively on Indian Public/Private Clouds)          |
|                                                                        |
|  +-----------------------+   +-------------------+   +--------------+  |
|  | Kubernetes Master C.P.|---|  Sovereign DB     |---|  UPI Billing |  |
|  | (K8s Control Plane)   |   |  & Metadata Store |   |  Engine      |  |
|  +-----------------------+   +-------------------+   +--------------+  |
+------------------------------------+-----------------------------------+
                                     |
                                     | (Encrypted Virtual Private Network / Mesh)
                                     |
+------------------------------------+-----------------------------------+
|                           DISTRIBUTED EDGE NODES                       |
|                                                                        |
|  [Daytime Solar GPU Grid]    [Overnight Gaming PCs]   [Consumer Phones]|
|     (Gujarat / Rajasthan)       (K3s Worker Agent)       (WASM Client) |
+------------------------------------------------------------------------+

```

### 3.1 The Compute Supply Tiers

DUM360 ingests idle capacity from every layer of the national compute stack. Each tier has a different capability, interconnect quality and trust profile, and the orchestrator schedules accordingly:

| Tier | Examples | Interconnect | Best-fit workloads |
| --- | --- | --- | --- |
| **Institutional labs** | IITs, NITs, IIITs, central/state universities | LAN within campus + **NKN** backbone across campuses | In-cluster & cross-campus model parallelism; HPC-style jobs |
| **Government / PSU** | Public-sector R&D labs, ministry data centres | Wired / sovereign networks | High-trust, sovereign and emergency workloads |
| **Enterprise / MSME** | Company servers, startup & MSME workstations | Wired business broadband | Off-hours batch inference, rendering, ETL |
| **Solar GPU rigs** | Custom multi-GPU rigs in GJ / RJ | Wired, often multi-GPU | Daytime green compute; in-rig big-model sharding |
| **Consumer devices** | Gaming PCs, desktops, phones | Consumer broadband | Burst, request-parallel inference, light tasks |

**Design principle:** use the *country-wide* mesh for **request-level parallelism (throughput)**, and confine **model-level parallelism** to LAN/NKN-connected clusters where the interconnect can sustain it.

---

## 4. Functional Requirements

### 4.1 Node Registration and Enrollment

* **FR-1.1 (Desktop/Laptop App):** Users must be able to download a lightweight installer for Windows, Linux, and macOS. The app background-installs a minimized, sandboxed Kubernetes node daemon (`K3s` or `KubeEdge`).
* **FR-1.2 (Mobile App):** Android/iOS app must feature a lightweight execution sandbox engine using WebAssembly (WASM).
* **FR-1.3 (Identity & Security Mapping):** All nodes must verify identity through secure, localized verification standards before fetching workloads. Devices must pass a hardware integrity check (Secure Enclave verification) to prevent rogue malicious hosts from manipulating calculation math.

### 4.2 Availability Scheduling ("Pre-Informing")

* **FR-2.1 (The Calendar Booking Switch):** Users can define recurring or one-off availability windows (e.g., Monday–Friday: 11:00 PM to 7:00 AM).
* **FR-2.2 (Predictive Scheduling):** The central orchestration layer must read these schedules 6 hours in advance to accurately map continuous workloads to specific guaranteed uptime windows.
* **FR-2.3 (Graceful Eviction / Draining):** 30 minutes before a user’s scheduled exit time, the central master cluster must issue a `Cordon and Drain` command. The node will stop receiving tasks, finish current active operations, upload checkpoints, and exit cleanly without causing processing lag for the user.

### 4.3 The Daytime Solar Arbitrage Mesh

* **FR-3.1 (Solar Zone Target):** The system must support high-throughput, always-on nodes situated alongside renewable energy grids in Western India.
* **FR-3.2 (Day/Night Cost Routing):** The orchestration algorithm must actively prioritize Solar Nodes between 10:00 AM and 4:00 PM IST due to lower environmental and power expenses, automatically swinging workloads to civilian laptops and mobile phones as night falls.

### 4.4 "Rashtra Seva" (Sovereign Emergency Protocol)

* **FR-4.1 (Emergency Override Switch):** A cryptographically authenticated government credential must be able to trigger "Emergency Mode" at a national level.
* **FR-4.2 (Workload Eviction):** Upon activation, all commercial workloads across the entire mesh must immediately pause or drop to lowest priority.
* **FR-4.3 (Mass Alert Push):** The platform must instantly notify all enrolled devices, moving their processing power straight into dedicated pipelines managed by national teams (e.g., NDMA for climate tracking, medical agencies for genetic tracking).

### 4.5 Financial Clearings (UPI Integration)

* **FR-5.1 (Micro-Transaction Logging):** The system must compute precise usage metrics (CPU cycle hours used, VRAM consumed, bytes processed) and map it to a rupee value.
* **FR-5.2 (UPI Direct Payouts):** The app must allow providers to input a secure VPA (Virtual Payment Address) to withdraw earnings via instant UPI transfers directly into their Indian bank account.
* **FR-5.3 (Institutional & Enterprise Settlement):** For non-individual providers (universities, PSUs, enterprises, MSMEs), the system must support organizational billing accounts — settling earnings as **compute-grants, platform credits, or bank/Net-banking revenue-share** rather than personal UPI — with per-department/per-lab usage reporting and electricity-cost reimbursement tracking.

### 4.6 Distributed Inference Architecture

DUM360 serves LLM and AI inference using a **tiered strategy that matches model size to interconnect quality**, rather than naively splitting one model across the public internet.

* **FR-6.1 (Request-Parallel Serving — default):** Models that fit on a single node (e.g. 7B–34B quantized) are replicated; the orchestrator routes **whole requests to whole nodes**. This is embarrassingly parallel and scales linearly to millions of concurrent inferences nationwide — the primary, highest-throughput mode.
* **FR-6.2 (Intra-Cluster Model Parallelism):** Genuinely large models (70B–400B+) are sharded **only within a well-connected cluster** — a campus lab over LAN, a solar GPU rig, or a PSU data centre — where tensor/pipeline parallelism has the bandwidth and microsecond latency it needs.
* **FR-6.3 (NKN-Backed Cross-Campus Parallelism):** For models exceeding a single cluster, pipeline parallelism may span institutions **over the National Knowledge Network (NKN)** academic backbone — forming a loosely-coupled national academic grid, not a consumer-broadband mesh.
* **FR-6.4 (Speculative Decoding):** Small models on phones/PCs draft tokens that larger cluster-hosted models verify, reducing load on scarce big-model capacity.
* **FR-6.5 (Honest Workload Fit):** The platform targets **massively-parallel, latency-tolerant, checkpointable** workloads (batch inference, rendering, sequencing, Monte-Carlo, parameter sweeps, cryptanalysis). It explicitly does **not** claim to match centralized GPU clusters for tightly-coupled, latency-critical training across consumer-grade links. *(Precedent: Folding@home reached ~exascale FP32 throughput as a distributed network in 2020.)*

---

## 5. Non-Functional Requirements (NFRs)

### 5.1 Data Sovereignty & Hosting

* **NFR-1.1:** Absolutely zero user operational data, processing fragments, or control plane coordination traffic may be hosted on or routed through servers physically located outside the Republic of India.
* **NFR-1.2:** Backup infrastructures and secondary nodes must be located within separate physical zones inside India (e.g., Central Data Center in Mumbai, Secondary DR Center in Bengaluru or Delhi-NCR).

### 5.2 Security & Privacy (Confidential Computing)

* **NFR-2.1:** All workloads dispatched to civilian hardware must run inside an encrypted virtual container sandbox. The host user must not have access to read the RAM or view the data packets undergoing calculations on their machine.
* **NFR-2.2:** End-to-end data traffic encryption using standard security certificates (such as TLS 1.3) must safeguard transport pipelines between individual worker components and the central sovereign data center networks.

### 5.3 Reliability and Churn Management

* **NFR-3.1:** The network must operate under a zero-trust model regarding consumer hardware uptime. Tasks distributed to standard consumer edge nodes must feature a **Deterministic Redundancy Factor ($\ge 3x$)**, meaning a calculation chunk is mirrored across multiple independent machines to prevent task failure when a user closes their device prematurely.

---

## 6. Success Metrics & Phases

### Phase 1: Alpha (Months 1–3)

* **Goal:** Launch the alpha desktop wrapper (`K3s` based) across 1,000 developer and student machines in select Indian colleges.
* **Target Metric:** Successfully run a split rendering or data extraction job using 100 concurrent nodes without data loss.

### Phase 2: Beta & Strategic Partnerships (Months 4–6)

* **Goal:** Partner with an established Indian cloud provider to deploy the central orchestration layer. Secure initial agreements with private solar-grid operators to attach compute nodes.
* **Target Metric:** Reach 50,000 active nodes; run commercial AI inference workloads for Indian startups at 50% less cost than foreign hyperscalers.

### Phase 3: National Scale & Mobile Launch (Months 7–12)

* **Goal:** Launch the native mobile WebAssembly app framework on the Google Play Store; establish formal advisory lines with national disaster groups for testing emergency protocols.
* **Target Metric:** Exceed 1 Million active nodes across the country, building a standby sovereign supercomputer ready for national service.