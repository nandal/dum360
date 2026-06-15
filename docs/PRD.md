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

DUM360 is India’s first decentralized, citizen-powered, eco-friendly edge supercomputer network. It aggregates the unutilized, idle compute capacity of consumer electronics (smartphones, desktops, gaming laptops) and specialized clean-energy setups (solar-grid attached compute rigs in regions like Rajasthan and Gujarat) into a massive, secure cloud infrastructure mesh.

### 1.2 Dual-Use Mandate

1. **Commercial Peace-Time Mode:** Provides hyper-affordable, localized AI training, LLM inference, and video rendering services to Indian startups and academics, paying everyday contributors direct micro-incentives via UPI.
2. **Sovereign Emergency Mode ("Rashtra Seva Mode"):** Instantly mobilizes the collective multi-ExaFLOP pool of national compute to solve public-good crises—such as disaster climate modeling, bio-defense sequencing, or cryptographic cybersecurity defense or even war like situations.

### 1.3 Infrastructure Constraint

**100% Indian Cloud/Data Center Hosting.** The core cluster management control planes, metadata databases, and secure relay proxies will run exclusively on domestic Indian cloud providers and data centers. No data or orchestration protocols will cross geographic borders.

---

## 2. Personas & Stakeholders

| Persona | Description | Primary Goal / Motivation |
| --- | --- | --- |
| **The Citizen Provider** | Everyday consumer with a smartphone, PC, or gaming laptop. | Earn passive income via UPI by enabling their idle device during specified off-hours (e.g., at night). |
| **The Solar Arbitrageur** | Operators/investors in solar-heavy states (GJ/RJ) with custom GPU hardware. | Monetize zero-cost surplus daytime solar energy by renting out computing cycles. |
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