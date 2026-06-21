# DUM360 Website — Product Requirements Document

**Document:** Website / Landing-Site PRD (distinct from the platform PRD in [`../PRD.md`](../PRD.md))
**Version:** 1.0
**Owner:** CPO, DUM360
**Implements with:** Frontend lead (build + Firebase Hosting), Designer ([`DESIGN_SPEC.md`](DESIGN_SPEC.md) — visual/IA/UX detail)
**Source of truth for claims:** [`../compute-benchmark.md`](../compute-benchmark.md) — **no claim on this site may contradict it.**
**Status:** Approved for build (v1 static launch), pending CEO sign-off on the Firebase-region decision in §8.6.

---

## 0. How to read this document

This PRD specifies **what the website must say, contain, and do**, and the **technical/data plan** to ship it on Firebase. It deliberately does **not** specify visual design, spacing, colour systems, component anatomy, or motion — those live in [`DESIGN_SPEC.md`](DESIGN_SPEC.md). Where the two overlap (e.g. the mesh visualisation, the sign-up modal), this PRD owns *content + behaviour + data*, the design spec owns *look + interaction feel*.

The companion platform PRD ([`../PRD.md`](../PRD.md)) is the canonical product definition. This site is the **public front door** to that product. Where they could drift, the platform PRD wins on product facts and the benchmark wins on numbers.

---

## 1. Purpose & Goals

### 1.1 What this website is for

DUM360.com is the **single public entry point** to the project before any app or dashboard exists. Today it is a static GitHub Pages site whose every CTA points to a Google Form. This PRD replaces that with a **self-hosted, segmented contributor sign-up flow on Firebase**, and turns the page into a credible recruiting and partnership instrument.

The site has one job above all others: **convert the right person into a captured, segmented signal of intent** — a citizen who will install the node app, a university that will pilot a lab, a government contact who will take a meeting, an AI client who will try the compute, a developer who will contribute code.

### 1.2 Primary objective

> **Capture qualified contributor/stakeholder intent**, segmented by audience type, into our own datastore — so BD, Community, and the CEO can follow up with the right message, and so we can prove demand to partners and (later) investors.

The "conversion" is a completed waitlist sign-up tagged with audience type — **not** a vanity page-view.

### 1.3 Secondary objectives

1. **Establish credibility.** Communicate the idle-compute thesis and the *honest* scale claim so a technical or institutional reader trusts us rather than dismissing us as hype.
2. **Communicate sovereignty + green + dual-use** clearly enough that a government or university reader sees national value, not a crypto-flavoured side project.
3. **Pre-qualify and route.** Different audiences need different follow-ups; the site should sort them at sign-up so humans don't have to.
4. **Be a durable reference** BD can send to a Professor, a PSU CTO, or a solar operator and have it answer the obvious first questions.

### 1.4 Target outcomes (who we want to convert into what action)

| We want… | …to do this one action |
| --- | --- |
| Citizens with idle phones/PCs | Join the **provider waitlist** (notify me when the node app opens) |
| Students | Join as a **contributor/builder** (campus project + early node) |
| Universities / research institutions | Request a **founding-partner pilot** (1–2 labs, MoU) |
| Government / PSU | Request a **sovereignty / Rashtra-Seva briefing** |
| Solar / green-energy operators | Register **green capacity** interest |
| Enterprise / MSME | Register **off-hours capacity** interest |
| AI clients (demand side) | Join the **compute early-access** list (tell us your workload) |
| Open-source / developer contributors | Get pointed to the **repo + contributor list** |

All eight collapse into **one sign-up flow with an audience selector** (see §4.9).

---

## 2. Audiences

These are the contributor/stakeholder types from platform PRD §2, **plus** the two the platform PRD implies but the site must address explicitly: **demand-side AI clients** and **open-source/developer contributors**.

For each: what they care about, the friction/objection we must answer, and the single action we ask for.

| # | Audience | Cares most about | Must answer their objection | The one action |
| --- | --- | --- | --- | --- |
| 1 | **Citizen provider** (phone/PC/gaming rig) | Earning real money; not getting hacked, slowed, or billed for electricity-for-nothing | "Is this safe? Will it slow my device or read my data? Is the money real?" | Join provider waitlist |
| 2 | **Student** | A real, resume-worthy national systems project + being early | "Is this a serious project or a toy? What would I actually do?" | Join as builder/contributor |
| 3 | **University / research institution** | National research value, sovereignty, zero disruption to teaching, fair settlement | "Will this disrupt our labs or our security posture? What's the catch?" | Request founding-partner pilot |
| 4 | **Government / PSU** | Sovereignty, DPDP-alignment, emergency utility, who controls the trigger | "Is data truly Indian-hosted? Who can invoke Rashtra Seva, and how is it governed?" | Request a briefing |
| 5 | **Solar / green-energy operator** | Monetising surplus daytime/clean generation; predictable demand | "Is there real, paying demand for my cycles? Settlement terms?" | Register green capacity |
| 6 | **Enterprise / MSME** | Offsetting IT spend; security of letting jobs run on their machines | "What runs on my servers? How is it isolated? How do I get paid/credited?" | Register off-hours capacity |
| 7 | **AI client (demand side)** | Cheaper inference that actually fits their workload; honest about what won't work | "Can this really run *my* workload, or is it vapor? What's it good/bad at?" | Join compute early-access (describe workload) |
| 8 | **Open-source / developer contributor** | Interesting distributed-systems problems; open code; credit | "Is it open? Where's the code? How do I start?" | Go to repo / join contributor list |

> **Routing principle:** the site never makes a visitor self-diagnose into an architecture diagram. It offers human-language entry points ("I want to share a device," "I represent a university," "I need compute," "I want to build this") that map to the audiences above.

---

## 3. The Vision & Story

The narrative spine, in the order a first-time visitor should absorb it. Designer controls how this is paced visually; this is the *content* arc.

### 3.1 The thesis (idle compute)

> **Most of India's computing power is sitting idle right now.** Phones at night, gaming PCs after hours, university and PSU labs over evenings, weekends and vacations, MSME workstations outside business hours, surplus daytime solar GPU rigs. DUM360 pools all of it — consumer, institutional, government, commercial — into one secure, sovereign national mesh.

The emotional hook is *waste → value*: hardware the country has **already paid for**, put to work, and instantly reclaimable by its owner.

### 3.2 Sovereignty (100% Indian-hosted, DPDP-aligned)

> The orchestration core, metadata, and relay traffic run **exclusively on Indian clouds/data centres**. Sensitive data and national orchestration metadata never leave Indian soil — aligned with the Digital Personal Data Protection (DPDP) Act.

This is a *trust* message aimed at government, PSU, and university readers. It is also the differentiator vs foreign hyperscalers.

> **Honesty flag for the team:** the *platform* runs on Indian clouds. **This marketing website**, if hosted on Firebase, runs on Google infrastructure (see §8.6). We must not imply the *website's own hosting* is sovereign. The "100% Indian-hosted" claim is about the **DUM360 compute platform and its data**, not this brochure site. Keep the copy precise.

### 3.3 Green energy

> The cheapest, cleanest cycles come from **daytime solar GPU rigs in Gujarat/Rajasthan**, with an R&D track toward **seawater-cooled, floating coastal rigs** on tidal/wave/offshore-solar power for 24×7 clean baseload.

Honesty constraint (from platform PRD §3.1 and the benchmark): **floating-solar + seawater cooling is deployable today; tidal/wave is nascent in India and must be framed as a forward-looking R&D track, not near-term capacity.** Copy must not promise tidal capacity at launch.

### 3.4 Dual-use mandate

> **One mesh, two missions.** In peace-time it sells affordable AI inference and compute. In a crisis, a cryptographically-authenticated government trigger flips it into **Rashtra Seva mode** — a national strategic compute reserve for disaster modelling, bio-defence sequencing, and cyber-defence.

This is the line that makes the project *national* rather than commercial. It is also the most easily over-claimed — see §9 guardrails (do not imply the emergency system exists/operates today; it is a designed protocol).

### 3.5 The honest scale claim (load-bearing)

The story's credibility hinges on getting the numbers right. The site's headline scale framing, verbatim-aligned to the benchmark:

> **Not "we beat AWS."** DUM360 turns India's already-paid-for idle hardware into the country's **largest sovereign inference engine** — plausibly **a few exaFLOP/s of usable throughput**, on the order of **one to two orders of magnitude beyond India's entire current public supercomputing capacity** — **without building a single new data centre.** It is built for **inference and parallel workloads, not frontier model training**, which consumer networks physically cannot support.

See §5 and §9 for the exact comparison copy and the non-negotiable claim rules.

---

## 4. Functionality / Feature Requirements — Site Map

Single-page scrolling site (v1), with anchored sections, plus a small number of standalone routes added in later phases (`/thanks`, `/portal`). Section order below is the canonical content order; the Designer may adjust *visual* pacing but not omit a section.

For each section: **purpose**, **content requirements**, and **any functional behaviour**. Existing `index.html` already implements most of these as static content — this PRD treats that as the v1 content baseline and specifies the deltas (chiefly: comparison section, contributor-invitations section, FAQ, and the sign-up flow replacing the Google Form).

### 4.1 Global navigation + persistent CTA

- Sticky header: logo, anchor links (How it works · The mesh · AI inference · Green · Compare · For contributors · FAQ), and a **persistent primary CTA button** that opens the **sign-up modal** (§4.9) — *not* a Google Form link.
- Mobile: collapsed nav; primary CTA remains visible.
- **Delta from current site:** every `https://forms.gle/...` link is removed and replaced by the modal trigger.

### 4.2 Hero

- **Purpose:** state the thesis + honest scale in one screen; one primary action.
- **Content:** eyebrow ("Distributed Unified Mesh 360 · Made in India"); H1 ("India's citizen-powered **sovereign supercomputer**"); lede (idle-compute thesis, one sentence); trust microcopy ("100% Indian-hosted platform · UPI payouts · Confidential, sandboxed compute").
- **CTAs:** primary "Join the mesh" (opens sign-up modal); secondary "See how it works" (anchor).
- **Stat strip:** must use **honest, defensible** figures only. Allowed: `100% Indian-hosted`, `≥3× redundancy per task`, `1M+ target nodes` (clearly labelled *target*). **Review needed:** the current `50% cheaper than hyperscalers` stat is a Phase-2 *target metric* from the platform PRD, not a measured fact — on the site it MUST be labelled as a target/goal, or replaced. See §9.

### 4.3 Problem / thesis section ("One mesh. Two missions." + idle thesis)

- **Purpose:** establish *why this exists* — the idle-compute waste, and the dual-use mandate.
- **Content:** the idle-window table from platform PRD §1.4 (source → idle window → why it matters), and the two dual-mode cards (Peace-time / Rashtra Seva), as already present.
- **Behaviour:** static.

### 4.4 How it works

- **Purpose:** make the mechanism concrete and reassuring (especially "I can take my device back").
- **Content:** the 4-step flow already present — Install & verify → Pre-inform availability → Compute safely (sandboxed, ≥3× redundancy) → Get paid (UPI / credits, graceful 30-min drain).
- **Behaviour:** static.

### 4.5 The mesh (live visualisation)

- **Purpose:** show the network and the dual-mode switch viscerally.
- **Content/behaviour:** the existing interactive canvas (tier nodes → sovereign core; peace-time vs Rashtra-Seva toggle; hover tooltips; flow legend). Retain.
- **Constraint:** must respect `prefers-reduced-motion` (already handled) and remain decorative — no claim is *made* by the animation that isn't backed elsewhere.
- **Design ownership:** visual/motion detail → `DESIGN_SPEC.md`.

### 4.6 Supply tiers

- **Purpose:** show *who* powers the mesh and that each tier is scheduled for what it's good at.
- **Content:** the tier table from platform PRD §3.1 (Institutional / Government-PSU / Enterprise-MSME / Renewable / Consumer → interconnect → best-fit workloads), plus the design principle: *country-wide mesh for request-level parallelism (throughput); model-level parallelism confined to LAN/NKN clusters.*

### 4.7 Tiered AI inference, explained simply

- **Purpose:** explain how big models run *without* overclaiming, in plain language.
- **Content (the 3 cards, already present):**
  1. **Request-parallel (default)** — models that fit one node (7B–34B quantized) replicated; whole requests → whole nodes; scales to millions of concurrent inferences.
  2. **In-cluster sharding** — large models (70B–400B+) split *only inside* well-connected clusters (campus lab, GPU rig, PSU DC).
  3. **NKN cross-campus** — biggest models pipelined across institutions over the National Knowledge Network — an academic grid, not consumer broadband.
- **Plus:** speculative decoding line; and the explicit honest-fit statement: *built for massively-parallel, latency-tolerant, checkpointable workloads; not for tightly-coupled frontier training over consumer links.*

### 4.8 Green energy

- **Purpose:** communicate the clean-compute angle honestly.
- **Content:** daytime solar arbitrage (GJ/RJ, priority 10am–4pm); seawater-cooled floating rigs as **deployable-today** coastal compute; tidal/wave as **forward-looking R&D track** (predictable 24×7 clean baseload, *not* near-term capacity).
- **Guardrail:** do not present tidal/wave as available capacity. Use the platform PRD §3.1 green-energy honest-status language.

### 4.9 Comparison (NEW — see §5 for full copy)

- **Purpose:** answer "how is this different / better than X?" honestly, in a single scannable table.
- **Content:** the comparison table and framing copy specified in §5.
- **Behaviour:** static table; on mobile, becomes a stacked card list.

### 4.10 Usefulness / use-cases (NEW/expanded — see §6)

- **Purpose:** make the value concrete — what gets *done* with this compute, commercially and nationally.
- **Content:** the use-case grid in §6.

### 4.11 Contributor invitations (NEW — see §7 for full copy)

- **Purpose:** give every audience a clear "this is for you, here's the ask, here's what you get, here's the button."
- **Content:** the eight invitation blocks in §7, each ending in a CTA that opens the sign-up modal **pre-selected to that audience type**.
- **Behaviour:** clicking an invitation CTA deep-links the modal's audience selector (`?audience=university` etc.), so the segment is pre-filled.

### 4.12 Sovereignty banner

- **Purpose:** reinforce trust before the final ask.
- **Content:** Indian-cloud hosting of the platform, DPDP-alignment, DR zones (Mumbai primary · Bengaluru/NCR DR), TLS 1.3, zero cross-border routing — as present. Keep the named-providers line illustrative ("such as E2E Networks, CtrlS, Yotta, NIC") and not a claimed partnership unless legal/BD confirm one.

### 4.13 FAQ (NEW)

- **Purpose:** absorb the predictable objections so humans don't repeat them, and reinforce honesty.
- **Required Q&As (copy may be tightened by CMO):**
  - *Will this slow down or damage my device?* — No; you set the hours, jobs run in a sandbox, and cordon-and-drain returns your device 30 min before your scheduled exit.
  - *Can DUM360 read my files or data?* — No. Jobs run inside encrypted confidential sandboxes; the host cannot read the RAM or data being processed, and we never read your files.
  - *How do I get paid?* — Metered usage → rupees, paid to your UPI VPA; institutions settle as compute-grants/credits/revenue-share.
  - *Is my data really kept in India?* — The DUM360 compute platform's control plane, metadata and relay traffic run on Indian clouds. (Note: this marketing website may be served from a global CDN — see footer/legal.)
  - *Can DUM360 train GPT-class frontier models?* — No, and we don't claim to. Consumer networks can't support tightly-coupled frontier *training*. We're built for **inference and parallel workloads**. (Link to benchmark.)
  - *Who can trigger Rashtra Seva mode, and is it active now?* — It's a designed emergency protocol requiring a cryptographically-authenticated government credential; it is **not operational today** and governance is being developed with relevant authorities.
  - *Is it open source?* — Point to the repo / contributor section.
  - *When can I actually join?* — Phased rollout (campus alpha → beta → mobile). Sign up and we'll notify you for your segment.

### 4.14 Final CTA

- **Purpose:** last conversion surface.
- **Content:** one-line value recap + primary "Join the mesh" (modal). Microcopy: "Under 2 minutes · No spam."

### 4.15 Footer

- **Content:** logo + one-liner; column links (Product / Network / Company); legal links — **Privacy Policy** and **Terms** (required once we collect emails; see §8.5); a precise hosting/data note (see §3.2 honesty flag); copyright; "Made in India".
- **Delta:** remove Google Form links; "Join now" → modal trigger; add Privacy/Terms links.

### 4.16 Contributor sign-up / waitlist flow (REPLACES the Google Form)

This is the core functional addition. It replaces every `forms.gle` link.

**Trigger:** any primary CTA, any invitation-block CTA, nav CTA, hero, final CTA.

**UI:** a modal (or `/join` route fallback) — **content/behaviour here; visual design in `DESIGN_SPEC.md`.**

**Fields (minimal — keep friction low):**

| Field | Required | Notes |
| --- | --- | --- |
| Audience type | Yes | Single-select; 8 options from §2; pre-filled from deep-link if present |
| Name | Yes | Free text |
| Email | Yes | Validated format; primary contact + dedupe key |
| Organisation | Conditional | Required for university / govt-PSU / enterprise-MSME / solar; hidden/optional for citizen/student/developer |
| Phone (optional) | No | For citizen providers who prefer WhatsApp/call follow-up |
| Short message / workload | Conditional | Shown for **AI client** ("describe your workload") and **university/govt** ("what would you pilot?"); optional otherwise |
| Consent checkbox | Yes | "I agree to be contacted about DUM360 and accept the Privacy Policy." Links to §8.5 policy. |

**Behaviour:**
1. Client-side validation (required fields, email format).
2. Bot/abuse check (§8.4) before write.
3. Write to Firestore `signups` collection (§8.3), tagged with audience type + timestamp + UTM/source.
4. On success: inline success state + redirect/anchor to `/thanks` content ("You're on the list. We'll reach out for the [audience] track."). Tailor the thank-you copy per audience.
5. On failure: graceful error, allow retry, never lose typed data.
6. **No third-party form.** Data lands in *our* datastore.

**Accessibility:** modal must be keyboard-navigable, focus-trapped, dismissible (Esc), with labelled inputs. (Detailed in design spec.)

---

## 5. Comparison (honest framing + actual copy)

**Section intro copy (use as-is or tighten):**

> **How DUM360 compares.** We're not claiming to out-build the world's hyperscalers — the physics of consumer networks won't allow it, and we won't pretend otherwise. What we *do* claim is specific and defensible: we turn India's already-paid-for idle hardware into the country's largest **sovereign inference** engine, without building a single new data centre.

**Comparison table (canonical copy — every cell must stay consistent with [`../compute-benchmark.md`](../compute-benchmark.md)):**

| | **Build new data centres** | **Foreign hyperscalers (AWS/Azure/GCP)** | **India's current public HPC (NSM/AIRAWAT)** | **DUM360** |
| --- | --- | --- | --- | --- |
| **Capital cost** | Very high; years to build | None to you (rented) | Public capex, fixed fleet | **~Zero new build** — harvests existing idle hardware |
| **Data sovereignty** | Yes, if built in India | **No** — foreign-controlled infra/jurisdiction | Yes | **Yes** — Indian-cloud control plane, DPDP-aligned |
| **Best at** | Whatever you build for | Everything, at a price | FP64 scientific HPC | **Inference + embarrassingly-parallel** workloads |
| **Frontier model *training*** | Possible if huge | Yes | Limited | **No — and we don't claim it** (consumer-network physics) |
| **Usable AI-inference scale** | Depends on spend | Effectively unlimited (paid) | ~India's NSM baseline (~0.04 EF/s FP64) | **A few exaFLOP/s usable** — *1–2 orders of magnitude beyond India's entire current public HPC* |
| **Green credentials** | Depends | Depends | Depends | **Solar-prioritised; coastal/green R&D track** |
| **Dual-use national reserve** | No | No | Partially | **Yes — Rashtra Seva emergency mode (designed)** |

**Mandatory honesty footnote under the table (verbatim intent):**

> Figures are our own bottom-up, clearly-labelled order-of-magnitude estimates (see the [compute benchmark](../compute-benchmark.md)), discounted for the verified 2–10× distributed-computing penalty — not measured results or a forecast. On AI-precision *peak* paper FLOPS the mesh could approach a single flagship AI cluster; **usable** throughput is a few exaFLOP/s. We do **not** claim to rival hyperscaler *total fleets* (hundreds of EF/s+) or to train frontier models.

**What the comparison must NOT say** (see §9): no "we beat AWS"; no unqualified "50% cheaper"; no implication the mesh rivals hyperscaler total capacity; no mixing FP16-peak with FP64-sustained without labels.

---

## 6. Usefulness / What We're Trying to Achieve

**Section intro:**

> What does India *do* with a sovereign inference engine made from its own idle hardware? Two things: power affordable AI for the people building here, and stand ready when the nation needs compute fast.

**Commercial / peace-time use-cases (grid):**

- **Affordable LLM inference** for Indian startups, researchers and academics — request-parallel serving at national scale.
- **Batch & video rendering** for studios, ed-tech, and media.
- **Scientific & ETL batch jobs** — parameter sweeps, Monte-Carlo, data extraction pipelines.
- **Genomic / sequencing pipelines** — embarrassingly-parallel, checkpointable.
- **Student & research compute** — labs accessing capacity they couldn't otherwise afford.

**National / strategic value:**

- **Largest sovereign inference capacity in India** — 1–2 orders of magnitude beyond current public HPC, with data kept in India.
- **A standby strategic reserve** — Rashtra Seva mode for disaster/climate modelling (NDMA), bio-defence sequencing, and cyber-defence.
- **Green compute leadership** — solar-prioritised scheduling and a coastal-green R&D track.
- **Economic inclusion** — UPI micro-income to citizens; compute-grants/credits to institutions; IT-spend offset for MSMEs.
- **Talent & capability** — a live national distributed-systems project for students and researchers.

Each use-case block in the invitation section (§7) should connect to the relevant audience CTA.

---

## 7. Invitations to Contributors (per-audience CTAs + value props)

One block per audience. Each: **the ask** (specific commitment) → **what they get** → **CTA** (opens sign-up modal pre-tagged to that audience). Copy below is launch-ready; CMO may tighten tone.

### 7.1 Citizen providers
- **Ask:** install the node app (when it opens) and set off-hours availability.
- **Get:** passive UPI income from idle cycles; full control (your hours, graceful 30-min return); confidential sandbox — we never read your data.
- **CTA:** "Notify me when the node app opens" → `audience=citizen`.

### 7.2 Students
- **Ask:** join the contributor community; run an early node on your campus; optionally take it on as a project.
- **Get:** a real national systems project (distributed scheduling, WASM/K3s agents, secure enclaves) for your resume; early access; community + mentorship.
- **CTA:** "Build DUM360 with us" → `audience=student`.

### 7.3 Universities / research institutions
- **Ask:** a no-risk pilot on 1–2 idle labs (overnight/weekend windows, graceful eviction, no disruption to teaching) under a simple MoU.
- **Get:** compute-grants / credits / revenue-share + electricity reimbursement; co-authored research on sovereign/green distributed computing; founding-partner status; NKN-linked national research capacity.
- **CTA:** "Become a founding university partner" → `audience=university`.

### 7.4 Government / PSU
- **Ask:** a briefing on sovereignty, DPDP-alignment, and Rashtra Seva governance; optionally contribute idle PSU-lab capacity.
- **Get:** a sovereign, Indian-hosted inference reserve; designed emergency-mode protocol you help govern; high-trust capacity by default.
- **CTA:** "Request a sovereignty briefing" → `audience=government`.

### 7.5 Solar / green-energy operators
- **Ask:** register surplus daytime/clean generation and GPU capacity for priority scheduling.
- **Get:** paid demand for otherwise-wasted surplus cycles; priority 10am–4pm routing; a green-compute story you can market.
- **CTA:** "Register green capacity" → `audience=solar`.

### 7.6 Enterprise / MSME
- **Ask:** enrol servers/workstations idle outside business hours into the sovereign pool.
- **Get:** offset IT spend via credits/revenue-share; confidential isolation of your machines; per-department usage reporting.
- **CTA:** "Register off-hours capacity" → `audience=enterprise`.

### 7.7 AI clients (demand side)
- **Ask:** tell us your workload and join compute early-access.
- **Get:** affordable, sovereign inference/parallel-compute; honest workload-fit guidance (we'll tell you if it *won't* fit); early-access pricing.
- **CTA:** "Get early access to compute" → `audience=ai_client`.

### 7.8 Open-source / developer contributors
- **Ask:** contribute to the node agent, orchestrator, SDK, or docs.
- **Get:** hard, interesting distributed-systems problems; open code; credit; a national-impact project.
- **CTA:** "See the code / join contributors" → `audience=developer` (and link to the repo).

---

## 8. Technical Requirements

Pragmatic, launch-oriented. Hosting on **Firebase Hosting**; optional **Cloud Firestore** for signups; optional **Google Authentication** for a later portal. Phased so v1 can ship as pure static.

### 8.1 Hosting — Firebase Hosting

- **Platform:** Firebase Hosting (static + global CDN). Custom domain `dum360.com` (currently a GitHub Pages CNAME — migrate DNS to Firebase, retain `CNAME`/domain).
- **Build:** v1 is essentially the existing single `index.html` (inline CSS/JS) plus added sections. No framework required for v1; if the team prefers, a light static setup (Vite) is acceptable but **not** mandated. Keep zero/low-spend bias (CPO mandate): Firebase free Spark tier is sufficient for launch traffic.
- **Config:** `firebase.json` with `public` dir, single-page rewrites only if/when routes (`/join`, `/thanks`, `/portal`) are added, cache headers for static assets, and a `404.html`.
- **HTTPS:** automatic via Firebase.
- **CI (optional, phase 2+):** GitHub Action `firebase-hosting-merge` on `main` for auto-deploy + PR preview channels.

### 8.2 When to use Firestore vs static

| Phase | Sign-up backend |
| --- | --- |
| **Phase 1 (static launch)** | Sign-up modal writes to Firestore via the Firebase Web SDK (client-side) **OR**, if we want zero backend at first, a `mailto:`/lightweight fallback. **Recommended: ship Firestore from day one** — it's the whole point of leaving the Google Form, and Spark tier covers it. |
| **Phase 2** | Firestore is canonical store; add Cloud Function (or client-side with strict rules) for validation + spam checks + notification email to BD. |
| **Phase 3** | Add Google Auth + contributor portal reading/writing the same collections. |

### 8.3 Firestore data model (proposed)

Pragmatic, denormalised for a launch. Collections:

**`signups`** (one doc per submission; auto-ID):

| Field | Type | Notes |
| --- | --- | --- |
| `audience` | string (enum) | `citizen` \| `student` \| `university` \| `government` \| `solar` \| `enterprise` \| `ai_client` \| `developer` |
| `name` | string | |
| `email` | string | lowercased; used for dedupe |
| `organisation` | string \| null | required for university/government/enterprise/solar |
| `phone` | string \| null | optional |
| `message` | string \| null | workload/pilot description; cap length (e.g. 2000 chars) |
| `consent` | boolean | must be `true` to write |
| `source` | map | `{ utm_source, utm_medium, utm_campaign, referrer, landing_path }` |
| `status` | string | `new` (default) → BD updates to `contacted`/`qualified`/`closed` (portal/admin) |
| `createdAt` | timestamp | server timestamp |
| `uid` | string \| null | set only if signed in via Google Auth (Phase 3); null for anonymous |
| `userAgentHash` | string \| null | coarse abuse signal, not PII-heavy |

**`signups_meta`** (optional, for cheap public counters without exposing PII):

| Field | Type | Notes |
| --- | --- | --- |
| `total` | number | incremented via transaction/Function; can power a "N people joined" stat *only if real* |
| `byAudience` | map | counts per audience |

> Do **not** surface a live counter on the site unless the number is real and not embarrassingly small at launch — defer to CMO/CEO. The `1M+` figure must stay labelled *target*.

**Later (Phase 3, portal):** `users/{uid}` doc mirroring a signer's own record so they can view/edit their signup. No new collection strictly required — can be a query on `signups where uid == auth.uid`.

### 8.4 Security rules & spam/abuse protection

- **Firestore Security Rules** (not optional):
  - `signups`: allow `create` if the payload validates (required fields present, `consent == true`, `audience` in enum, field types/lengths correct, no arbitrary extra fields). **Disallow client `read`/`list`** of `signups` entirely (it contains PII) — reads are admin-only (Console / Cloud Function with admin SDK / authenticated portal restricted to own `uid`).
  - `update`/`delete`: denied to clients in Phase 1–2; in Phase 3, a signed-in user may update only their own doc (matched by `uid`), and only non-admin fields.
  - `signups_meta`: public `read` allowed (counts only, no PII); writes server-side only.
- **Spam/abuse:**
  - **Bot protection:** integrate a CAPTCHA before write. **Recommended: Cloudflare Turnstile** (privacy-friendly, free) or **Firebase App Check with reCAPTCHA Enterprise**. App Check is the more Firebase-native choice and should gate Firestore writes. (Decision flagged for CEO in summary — both are free at our scale.)
  - **Rate-limiting:** App Check + a Cloud Function that rejects > N submissions per IP/email per window (Phase 2). Client-side honeypot field as a cheap first filter.
  - **Validation:** enforce email format and field length both client-side and in rules/Function.
  - **Dedupe:** soft — accept duplicates but BD-side dedupe by lowercased email; optionally a Function checks for an existing email and merges/flags.

### 8.5 Privacy, consent & sovereignty considerations

- **We are now a data fiduciary** under DPDP the moment we collect names/emails. Required before Phase-1 launch:
  - A **Privacy Policy** (what we collect, why, retention, contact, rights) and **Terms** — linked in footer and the sign-up consent line. (General Counsel to draft/approve; CPO provides the data-collection facts above.)
  - **Explicit consent checkbox** (no pre-tick) in the form (§4.16).
  - **Purpose limitation:** data used only to contact about DUM360; no sale/sharing.
- **Sovereignty tension (must be flagged honestly — see §8.6).** Our headline is "100% Indian-hosted." Firebase Hosting + Firestore run on **Google Cloud**, which raises a genuine data-residency question for the *signup PII*. We resolve it three ways:
  1. **Choose an Indian Firestore region** where possible (see §8.6).
  2. **Be precise in copy:** "100% Indian-hosted" describes the **DUM360 compute platform and its operational data** (platform PRD NFR-1.1), *not necessarily this marketing site and its waitlist*. The footer/Privacy Policy must state plainly where signup data is stored.
  3. **Minimise PII** collected (name, email, org, optional phone) and offer deletion on request.

### 8.6 Firebase region & the sovereignty decision (NEEDS CEO CONFIRMATION)

- **Firestore region:** Cloud Firestore offers `asia-south1` (**Mumbai**) and `asia-south2` (**Delhi**). **Recommendation: provision Firestore in `asia-south1` (Mumbai)** so signup PII physically resides in India — directly supporting the sovereignty narrative and easing the DPDP story. **Firestore region is permanent once set — set it correctly at creation.**
- **Firebase Hosting:** is a **global CDN/Anycast** — content is edge-cached worldwide; you cannot pin Hosting to India only. This is acceptable for *static brochure assets* (no PII), but means we must **not** claim the *website itself* is India-only hosted.
- **Honest position to confirm with CEO:** *"The DUM360 platform's operational/sovereign data is Indian-hosted (platform requirement). This marketing site is served from a global CDN; its waitlist data is stored in Firestore Mumbai (`asia-south1`). We will say so plainly rather than blur it."* — If the CEO judges even the brochure-site CDN to be an unacceptable sovereignty optic, the alternative is an Indian-cloud static host (e.g. an Indian provider/object storage + CDN) at higher ops cost; **default recommendation is Firebase + Mumbai Firestore + precise copy.**

### 8.7 Google Authentication (Phase 3 — contributor portal)

- **Purpose:** let a signer return to **view/manage their own signup** (update org, change audience, withdraw) and, later, access provider/client onboarding.
- **When required vs anonymous:**
  - **Anonymous (no auth):** initial waitlist sign-up. We do **not** force account creation to join — that would kill conversion. (App Check still gates the write.)
  - **Google Auth required:** only to access the **portal** (`/portal`) to manage one's own record, or for any future authenticated provider/client dashboard.
- **Mechanism:** Firebase Authentication with Google provider (one-tap/Google sign-in). On first portal login, link the session `uid` to the existing `signups` doc(s) matching the verified email (Cloud Function performs the match/claim).
- **Rules:** authenticated user can read/update **only** docs where `uid == auth.uid` (post-claim). No cross-user reads.
- **Scope discipline:** the portal is **out of scope for v1**; specified here so the data model (`uid` field, status field) is forward-compatible from day one.

### 8.8 Analytics approach

- **Tool:** Firebase Analytics / Google Analytics 4 (free, native). Lightweight; respect consent.
- **Privacy:** load analytics only after a basic consent acknowledgement (cookie/consent banner) per DPDP/best practice; anonymise IP; no PII in event params.
- **Key events to track:**
  - `cta_click` (param: location — hero/nav/invitation/final; audience if deep-linked)
  - `signup_modal_open`
  - `signup_submit` (param: audience) — **primary conversion event**
  - `signup_success` / `signup_error`
  - section scroll-depth / section views (which sections drive conversion)
- **Funnel of record:** modal-open → submit → success, segmented by audience and by traffic source. This is how we judge §10 success metrics.
- **No heavy third-party trackers** (zero/low-spend + privacy bias).

### 8.9 Performance, SEO, accessibility (non-functional)

- **Performance:** keep the single-page asset light; defer/lazy the mesh canvas; the page must remain usable with JS disabled for core content (sign-up degrades to a `mailto:` or static contact). Target good Core Web Vitals (LCP/CLS/INP).
- **SEO:** retain/extend existing meta + Open Graph; add `og:image`; semantic headings; descriptive `<title>`/meta per the honest positioning.
- **Accessibility:** keyboard-navigable nav + modal; sufficient contrast (design spec); `prefers-reduced-motion` honoured for the mesh; labelled form inputs; alt text. WCAG AA as the bar.
- **i18n:** v1 English-only. Hindi/regional language is a **non-goal for v1** (§10.2) but copy should be written so it's translatable later.

---

## 9. Content Honesty Guardrails (non-negotiable)

Restated from [`../compute-benchmark.md`](../compute-benchmark.md) and the CPO honesty mandate. **No page, stat, animation, meta tag, or social card may violate these.** If marketing copy and these rules conflict, these rules win.

1. **Never "we beat AWS" / never rival hyperscaler *total* fleets.** We are a **few percent** of hyperscaler total fleets. Allowed framing: "largest *sovereign* inference engine," "fraction of one flagship AI cluster."
2. **Inference, not frontier training.** Explicitly state we do **not** train frontier models over consumer networks — the physics forbids it. This is a feature of our honesty, not a hidden caveat.
3. **"A few exaFLOP/s usable."** Use this for *usable* throughput. Peak/paper FP16 (~50–100 EF/s) may be cited **only** when labelled *peak, paper, illustrative*.
4. **"1–2 orders of magnitude beyond India's public HPC."** This is the headline scale comparison — use it; it's the strongest *true* claim.
5. **Don't mix yardsticks.** Never compare an FP16-peak number to an FP64-sustained number without labelling both. (El Capitan etc. are FP64-sustained; AI-cluster figures are FP16-peak.)
6. **Estimates are estimates.** Any aggregate figure must be presented as our own **bottom-up, illustrative order-of-magnitude estimate**, discounted for the verified 2–10× distributed penalty — never as measured or forecast.
7. **Green energy honesty.** Floating-solar/seawater-cooling = deployable today; **tidal/wave = nascent R&D track**, not near-term capacity. Don't sell tidal as available.
8. **Rashtra Seva is a *designed* protocol**, not a live, operational national system. Don't imply it's running today; don't imply unilateral control — governance is being developed with authorities.
9. **"50% cheaper than hyperscalers" is a Phase-2 *target*, not a measured fact.** On the site it must be labelled a target/goal or omitted. Do not state it as current reality.
10. **Sovereignty precision.** "100% Indian-hosted" = the DUM360 **platform and its operational data**. Do **not** let it imply this marketing site/CDN or the waitlist store are India-only without the §8.5–8.6 caveat stated plainly.
11. **No fabricated social proof.** No fake user counts, logos of partners we don't have, or testimonials. Named clouds (E2E/CtrlS/Yotta/NIC) are *illustrative examples*, not claimed partnerships, unless BD/Legal confirm.

---

## 10. Success Metrics, Non-Goals, Rollout

### 10.1 Success metrics

**North-star:** number of **qualified, segmented sign-ups** captured in Firestore.

| Metric | Definition | v1 launch target (directional — CEO to set) |
| --- | --- | --- |
| Total sign-ups | `signups` docs created | Establish baseline first 30 days |
| Audience mix | sign-ups per audience | ≥1 sign-up in each of the 8 segments; healthy **university + AI-client** share (the credible-core + demand-side) |
| Conversion rate | `signup_success` / unique visitors | Track and improve; no vanity number set pre-launch |
| Modal funnel | open → submit → success drop-off | Submit→success ≥ 90% (form quality), open→submit improving over time |
| Quality | % sign-ups BD marks `qualified` | Quality > raw volume — esp. universities, govt, AI clients |
| Spam rate | rejected/bot submissions | < 5% of stored docs are junk |
| Performance | Core Web Vitals | LCP < 2.5s, CLS < 0.1, INP < 200ms |

### 10.2 Non-goals / out of scope (v1)

- **No provider/client dashboard or onboarding flow** (that's the platform app, not this site).
- **No payments, UPI, or earnings UI** on the website.
- **No live network telemetry/real node counts** — the mesh viz stays illustrative.
- **No Google Auth / portal** in v1 (Phase 3).
- **No live "N joined" counter** unless the number is real and non-trivial.
- **No multilingual (Hindi/regional)** in v1.
- **No blog/CMS/docs portal** in v1 (the `docs/` markdown remains the doc home).
- **No e-commerce/quoting** for compute.

### 10.3 Phased rollout

**Phase 1 — Static launch (replace the Google Form).**
- Migrate `dum360.com` to Firebase Hosting.
- Add the new sections: **Comparison (§5), Use-cases (§6), Contributor invitations (§7), FAQ (§4.13)**.
- Remove all `forms.gle` links; ship the **sign-up modal → Firestore** (`asia-south1`/Mumbai) with **App Check/Turnstile**, security rules locking down `signups` reads, consent checkbox, Privacy Policy + Terms.
- GA4 with consent banner; primary `signup_submit` event live.
- **Exit criteria:** a citizen and a university contact can both sign up; data lands in Firestore segmented; no PII publicly readable; Privacy Policy live.

**Phase 2 — Hardened signups + ops.**
- Cloud Function: server-side validation, rate-limiting, dedupe, and **notification email to BD** on new sign-up (esp. university/govt/AI-client).
- PR preview channels + auto-deploy CI.
- Optional `/thanks` and `/join` routes; richer per-audience thank-you content.
- Admin view of `signups` (Firebase Console or a minimal protected page).
- **Exit criteria:** zero PII leakage, spam < 5%, BD gets notified and can triage by segment.

**Phase 3 — Google Auth contributor portal.**
- Firebase Auth (Google) + `/portal`: signer signs in, claims their `signups` doc(s) by verified email, can view/edit/withdraw.
- Forward-compatible with future authenticated provider/client onboarding handoff to the platform app.
- **Exit criteria:** a user can sign in and manage only their own record; rules enforce per-`uid` isolation.

---

## 11. Open questions for CEO / cross-team

1. **Firebase region & sovereignty optics** (§8.6) — confirm Firebase Hosting (global CDN) + Firestore **Mumbai** + precise copy is acceptable, vs an Indian-cloud static host at higher cost.
2. **Bot protection choice** (§8.4) — **Firebase App Check** (native) vs **Cloudflare Turnstile**. Both free at our scale; CPO leans App Check for Firebase-native simplicity.
3. **"50% cheaper" stat** (§9.9 / hero) — relabel as target, or remove from the hero stat strip?
4. **Named cloud providers** (§4.12) — keep as illustrative examples, or has BD confirmed any real partnership to name?
5. **Privacy Policy / Terms** — General Counsel to draft before Phase-1 launch (blocker for collecting emails).
6. **Live counter** (§8.3) — do we ever want a public sign-up count, or keep `1M+` as the only (clearly-labelled target) number?
