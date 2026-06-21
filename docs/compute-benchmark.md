# DUM360 — Where It Would Stand in Global Compute

*A sourced reality-check on AI/HPC capacity worldwide, India's national baseline,
and where an aggregated idle-compute mesh realistically lands. Researched and
fact-checked June 2026 against TOP500 primary data, C-DAC/PIB/MeitY government
sources, and peer-reviewed distributed-computing literature.*

> **Read the units carefully.** Two different yardsticks get mixed up constantly
> in this space:
> - **FP64 (double-precision) HPL** — the TOP500 supercomputer ranking metric.
>   Hard, sustained, scientific-grade.
> - **FP16 / mixed-precision "AI" peak** — what GPU clusters and our mesh are
>   actually good at. Roughly **40–50× larger numbers** for the same hardware,
>   and usually quoted as *peak*, not sustained.
>
> Comparing an "AI petaflop" to a "supercomputer petaflop" without saying so is
> the single most common way these comparisons mislead. This note keeps them
> separate.

---

## 1. The global frontier (centralized, mostly U.S.)

As of the **November 2025 (66th) TOP500 list**:

| System | Owner | FP64 (sustained, Rmax) |
| --- | --- | --- |
| **El Capitan** | LLNL, USA | **1.809 ExaFLOP/s** |
| **Frontier** | Oak Ridge, USA | **1.353 ExaFLOP/s** |
| **Aurora** | Argonne, USA | **1.012 ExaFLOP/s** |
| **JUPITER Booster** | Germany (EuroHPC) | **1.000 ExaFLOP/s** |

Only **four** FP64-exascale systems exist on Earth — **three U.S., one European.**
JUPITER (Nov 2025) is the first non-U.S. machine to cross the line.

**On the AI-precision yardstick the numbers are far bigger and concentrated in
private hands:**

- A **single Meta 100,000×H100 cluster** ≈ **~99 ExaFLOP/s dense FP16**
  (~198 EF/s quoted with sparsity). *One* such cluster out-muscles all four
  exascale supercomputers combined on AI-precision work.
- **xAI's Colossus** (Memphis) reached **200,000 GPUs by May 2025**, reportedly
  growing past half a million through 2026.
- Hyperscalers (AWS / Azure / Google) operate **many** clusters of this class —
  their *total* fleets run into the **hundreds of EF/s of FP16 and beyond**.

**Takeaway:** frontier AI compute today is measured in *tens to hundreds of
exaFLOP/s*, centralized, and overwhelmingly American.

---

## 2. India's national baseline (for context)

- **AIRAWAT** (C-DAC Pune), India's flagship — ranked **75th globally** (June 2023):
  **8.5 PF/s sustained FP64** (Rmax), 13 PF peak. That is **~150–210× below a
  single exascale machine** on FP64.
- Headline **AI** figure: **410 AI-petaflops** mixed-precision *peak*
  (AIRAWAT PoC 200 + PARAM Siddhi-AI 210), roadmap to ~790. Note this is *peak,
  low-precision* — ~48× the honest FP64 number.
- **National Supercomputing Mission** total: ~**37 systems, ~40 PF aggregate**
  FP64 deployed (late 2025).

So India's *entire* sovereign public HPC baseline is on the order of **0.04
ExaFLOP/s FP64** — three to four orders of magnitude below a single U.S.
exascale system, and even further below a hyperscaler AI fleet. **This is the gap
DUM360 is trying to address without building new data centres.**

---

## 3. The honest physics of a distributed mesh

This is the part that determines whether DUM360 is real or hype. Peer-reviewed
finding (Cunha et al., *Future Generation Computer Systems*):

> Parallel (MPI) applications on realistic volunteer / campus desktop-grid pools
> run **2–10× slower** than dedicated clusters, and **tightly-coupled workloads
> are largely unsuitable** for volunteer/consumer networks.

In plain terms:

- **You cannot train a frontier model on phones over consumer internet.** The
  network latency kills tightly-coupled training. Anyone claiming otherwise is
  selling something. (Several optimistic "volunteer training matches a GPU
  cluster" claims were tested in this research and *failed* verification.)
- **What a mesh IS good at is "embarrassingly parallel" work** — millions of
  independent inference requests, batch rendering, simulations, ETL. Here the
  2–10× penalty mostly doesn't apply, because the jobs don't need to talk to
  each other.

**So peak aggregate FLOPS must be discounted heavily** — by online-rate, duty
cycle, and the coupling penalty — to get *usable* throughput.

---

## 4. Where DUM360 would actually stand

*The figures below are our own bottom-up, clearly-labelled illustrative estimate
— the research deliberately refused to certify any unverified aggregate, so these
are engineering order-of-magnitude bounds, not a forecast. They use public
per-device specs × device counts × the verified 2–10× distributed discount.*

**Tier A — Institutional (the credible core).** A few hundred institutes
(IITs/NITs/IIITs/universities/PSU labs), each contributing on the order of
hundreds of GPUs/workstations on overnight/weekend windows, LAN- and NKN-linked:

- **Peak FP16:** plausibly **tens of ExaFLOP/s** on paper.
- **Effective (batch inference, NKN-coupled):** **low single-digit ExaFLOP/s.**
- This tier alone could deliver **more usable AI-inference throughput than India's
  entire national HPC fleet**, every single night.

**Tier B — Consumer (5% opt-in).** ~tens of millions of phones + millions of PCs:

- **Peak FP16:** another **tens of ExaFLOP/s** on paper (huge device count).
- **Effective (inference only):** realistically **1–5 ExaFLOP/s** after online-rate
  and duty-cycle discounts; **~0 for coupled training.**

**Combined, illustrative:**

| Metric | DUM360 (our estimate) | Reference point |
| --- | --- | --- |
| Peak FP16 (paper) | **~50–100 EF/s** | ≈ **one** Meta 100k-H100 cluster (~99 EF/s) |
| Effective FP16 inference | **~3–10 EF/s** | A meaningful **fraction of one** flagship AI cluster |
| Effective coupled FP64 training | **low — below AIRAWAT** | Network penalty dominates |
| vs India national HPC (inference) | **1–2 orders of magnitude larger** | NSM ≈ 0.04 EF/s FP64 |
| vs hyperscaler *total* fleets | **a few percent** | Hundreds of EF/s+, centralized |

### The one-line verdict

> **For frontier model *training*, DUM360 cannot rival a hyperscaler — the physics
> of consumer networks forbids it.** But **for AI *inference* and parallel
> workloads, an aggregated national mesh could plausibly reach the same
> order of magnitude as a single flagship AI cluster on paper, deliver a few
> exaFLOP/s of genuinely usable throughput, and exceed India's entire current
> public supercomputing capacity by one to two orders of magnitude — without
> building a single new data centre.**

That is the honest, defensible pitch: **not "we beat AWS," but "we turn India's
already-paid-for idle hardware into the country's largest sovereign inference
engine, and a strategic reserve for emergencies."** The institutional tier is
what makes it credible — which is exactly why university partners matter most.

---

## Sources

- TOP500, 66th list (Nov 2025) — top500.org/lists/top500/2025/11/ and the
  El Capitan/JUPITER announcement.
- Epoch AI GPU-cluster tracker (Meta H100 cluster); HPCwire (xAI Colossus 200k, May 2025).
- C-DAC, PIB (PRID 1926942), IndiaAI/MeitY — AIRAWAT 8.5 PF Rmax, 410 AI-PF, rank 75.
- National Supercomputing Mission deployment reporting (37 systems / ~40 PF, late 2025).
- Cunha et al., *Future Generation Computer Systems* — 2–10× desktop-grid slowdown
  (the effective-vs-peak constraint).

*Caveats: TOP500 = sustained FP64; Meta/Colossus/AIRAWAT AI figures = peak
mixed-precision (not directly comparable). Meta's headline figure is sparse-peak
(~2× dense). Cluster sizes grow fast — Colossus figures are the May-2025 verified
milestone. DUM360 aggregate figures in §4 are our own illustrative order-of-
magnitude estimates, not verified measurements.*
