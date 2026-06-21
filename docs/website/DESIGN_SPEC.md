# DUM360 Website — Design & UX Specification

**Owner:** Lead UI/UX Designer
**Status:** v1.0 (draft for CEO/CPO review)
**Companion to:** `docs/website/PRD.md` (CPO — content, functionality, technical scope)
**Implemented by:** Frontend / Web Lead
**Source context:** `docs/PRD.md` (personas §2, tiers §3.1, inference §4.6), `docs/compute-benchmark.md` (honest framing), `docs/partnership-note.md`, current `index.html`.

> **Division of ownership.** The CPO's PRD owns *what the site says and does* and the technical stack. This document owns *how it looks, how it is structured, and how it feels to use* — visual system, information architecture, UX flows, component states, and microcopy. Where the two overlap (e.g. the sign-up flow), this spec defines the interaction and visual design; the PRD defines the data model and backend behaviour. No content strategy or roadmap is duplicated here.

---

## 0. The One Test (applied to every screen in this spec)

> **Would a first-year college student or a small-shop owner understand what to do without help?**

If a layout, label, or flow in this document fails that test, it is wrong and must be simplified. Every section below is written to pass it.

---

## 1. Design Principles & Brand Anchor

### 1.1 Brand anchor
**Calm, confident, national, green.** Quiet competence over loud hype. The site should feel like **trustworthy public infrastructure** — closer to a well-run national utility or a respected research institution than to a startup landing page or a crypto project.

### 1.2 The six site principles
1. **Radical simplicity.** One primary action per section. The next step is always obvious.
2. **Trust by transparency.** This system uses people's devices and money. Show plainly: data is sandboxed and never read, earnings are real, the device can be reclaimed instantly. Never hide how to pause, reclaim, or uninstall.
3. **Honesty in visuals.** Visuals must reflect `compute-benchmark.md`. The honest line is **"India's largest sovereign *inference* engine from already-paid-for idle hardware"** — never "we beat AWS," never "frontier training," never fabricated live counters. See §1.4.
4. **Fewer words, bigger type.** A label that needs explanation is the wrong label. Whitespace and typography carry the design, not decoration.
5. **National, not nationalist.** The tricolour cue is restrained (a single 🇮🇳 marker, "Made in India" eyebrow). Sovereignty is communicated through *facts* (Indian-hosted, DPDP-aligned), not flag-waving.
6. **Mobile-first, low-bandwidth-friendly.** Mid-range Android phones on patchy networks are a primary audience, not an afterthought.

### 1.3 What this brand is NOT (forbidden directions)
- **No web3 / crypto / token aesthetic.** No glowing coins, wallets, "mint," neon-on-black "blockchain" gradients, hexagon-token grids used as decoration.
- **No sci-fi clichés.** No HUD overlays, no "Matrix" code rain, no fake holograms, no spaceship dashboards, no glowing brains.
- **No hyperscaler-killer hype.** No "vs AWS" leaderboards, no "fastest supercomputer on Earth," no unqualified ExaFLOP counters presented as live/measured fact.
- **No stock-photo dishonesty.** No staged "diverse team pointing at screens," no server-room glamour shots implying we own data centres (we do not — we host on Indian partners).

### 1.4 Honesty rules for visuals (binding)
- Any large number (ExaFLOP/s, node counts) must be labelled **"target," "illustrative estimate,"** or carry a footnote, exactly as the benchmark doc does. Never present a projection as a live measurement.
- The current hero stat **"50% cheaper than hyperscalers"** is a Phase-2 *target* (PRD §6). It must be visually tagged as a target/goal, not a present-tense claim. (Open decision — see §11.)
- The mesh visualization is explicitly an **illustration/diagram**, not a live network feed. Label it as such (e.g. "Illustrative — how the mesh routes work").
- Inference capability copy must always pair throughput claims with the workload-fit caveat ("built for massively-parallel, latency-tolerant work; not frontier training").

---

## 2. Visual Design System

The current `index.html` palette is sound and stays. This section formalizes it into tokens, fixes accessibility gaps, and adds a dedicated green-energy accent.

### 2.1 Color tokens

**Brand & ink (unchanged from current site):**
| Token | Value | Role |
| --- | --- | --- |
| `--brand` | `#2f6bff` | Primary brand blue. Primary buttons, links, focus, "provider/dispatch" semantics. |
| `--brand-2` | `#00c2a8` | Teal. Secondary brand, gradients, "results/checkpoints" semantics. |
| `--accent` | `#ff7a1a` | Orange. **Reserved for Rashtra Seva / emergency / sovereign-action only.** Never a generic CTA color. |
| `--ink` | `#0b1020` | Primary text, dark surfaces (sovereign core, sovereignty banner). |
| `--ink-soft` | `#475069` | Secondary text / body. |
| `--muted` | `#8089a3` | Tertiary text, captions, hints. |
| `--line` | `#e7ebf3` | Borders, dividers. |
| `--bg` | `#ffffff` | Page background. |
| `--bg-soft` | `#f6f8fc` | Alternating section background. |

**New — green-energy accent (additive):**
| Token | Value | Role |
| --- | --- | --- |
| `--green` | `#1f9d57` | Dedicated **green-energy / sustainability** accent. Use ONLY for the green-energy section, the green-tier card, and the "clean cycles" sustainability mark. Distinguishes "eco" from the teal brand and from the success-green particle. |
| `--green-soft` | `#e8f6ee` | Green tint background for the green-energy section / chips. |

> **Why a new green and not just teal?** Teal (`--brand-2`) is a *brand* color used everywhere; it does not reliably read as "environmental." A distinct leaf-green prevents the sustainability story from being diluted, and keeps the green-energy section visually ownable. Keep usage disciplined so the palette doesn't bloat.

**Semantic / status:**
| Token | Value | Role | Contrast note |
| --- | --- | --- | --- |
| `--success` | `#1f9d57` | Success states, UPI-payout semantics (reuse `--green`). | 4.6:1 on white ✓ |
| `--warning` | `#b45309` | Warnings (amber-700, not yellow). | 4.7:1 on white ✓ |
| `--error` | `#c81e1e` | Errors, validation. | 5.9:1 on white ✓ |
| `--emergency` | `#ff3b3b` | Emergency-flow particle/banner in the mesh viz only. | Use with dark bg or as fill, not as text on white. |

**Accessibility corrections (must implement):**
- `--brand #2f6bff` on white = **3.6:1** — **fails WCAG AA for normal-size body text (needs 4.5:1).** Acceptable for: large text (≥24px or ≥19px bold), UI component borders, and graphical objects (3:1). **Rule:** never use `--brand` for small body copy or small links on white. For inline text links use `--brand-ink #1d4fd0` (≈5.3:1) which is defined as the new link color.
- `--brand-2 #00c2a8` on white ≈ **2.1:1** — **fails for any text.** Teal is decoration/gradient/icon only, **never text on light backgrounds.** The gradient-text headings (`.grad`, `.stat .num`) currently use brand→teal as text; the teal end is borderline. Keep gradient headings only at large display sizes (≥28px) and ensure the brand-blue end leads; do not use the gradient for anything below 24px.
- `--muted #8089a3` ≈ **3.0:1** — fails for body text; acceptable for non-essential captions/hints only. Any caption that carries meaning (form helper text, error context) must use `--ink-soft` (7.0:1).
- White text on `--brand #2f6bff` (primary button) ≈ **4.0:1** — passes for large/bold button text (our buttons are 15px 600), but is borderline. **Darken primary-button background slightly to `--brand-strong #2a60e6` (≈4.6:1 with white)** for button surfaces to clear AA comfortably.

| New token | Value | Role |
| --- | --- | --- |
| `--brand-ink` | `#1d4fd0` | Accessible blue for **text links** and small text on white. |
| `--brand-strong` | `#2a60e6` | Accessible blue for **button fills** under white text. |

### 2.2 Typography (Inter)

Keep Inter (already loaded, weights 400–900). Formalize a type scale (fluid where it helps). Base = 16px, line-height 1.6 for body, 1.05–1.15 for display.

| Token | Size | Weight | LH | Use |
| --- | --- | --- | --- | --- |
| `display-1` | `clamp(38px, 6vw, 68px)` | 900 | 1.05 | Hero H1 |
| `display-2` | `clamp(28px, 4vw, 44px)` | 800 | 1.1 | CTA / section-hero H2 |
| `h2` | `clamp(28px, 4vw, 42px)` | 800 | 1.15 | Section heads |
| `h3` | `20–24px` | 700–800 | 1.25 | Card / mode titles |
| `h4` | `17–18px` | 700 | 1.3 | Sub-card titles, footer cols |
| `lede` | `clamp(17px, 2.2vw, 21px)` | 400 | 1.5 | Hero & section sub-paragraph |
| `body` | `15–16px` | 400 | 1.6 | Default paragraph |
| `body-sm` | `14px` | 400–500 | 1.55 | Card body, helper text |
| `caption` | `13px` | 500 | 1.5 | Hints, footnotes |
| `eyebrow` | `13px` | 600, `letter-spacing .04em`, uppercase | 1 | Section eyebrows |
| `num` | `clamp(28px, 4vw, 40px)` | 900 | 1 | Stat numbers |

**Rules:** never set body copy below 14px; on mobile, body stays ≥15px. Headlines use negative tracking (`-.02em` to `-.03em`) — already in place. Limit to 3 weights per viewport (400/600/800) to keep load light; 900 is hero-only.

### 2.3 Spacing system
8-point base scale. Tokens: `--s1:4 · --s2:8 · --s3:12 · --s4:16 · --s5:24 · --s6:32 · --s7:48 · --s8:64 · --s9:88px`.
- Section vertical padding: `--s9` (88px) desktop, `--s7` (48–56px) mobile.
- Card padding: 28–36px.
- Grid gaps: 20–24px.
- Content max-width: `1140px` (`.wrap`), prose blocks cap at ~680px for readability.

### 2.4 Radius & shadow tokens
| Token | Value | Use |
| --- | --- | --- |
| `--radius-sm` | `10–12px` | Buttons, inputs, chips, small icons |
| `--radius` | `16px` | Cards (default) |
| `--radius-lg` | `20–24px` | Mode cards, sovereignty banner, mesh stage |
| `--radius-pill` | `999px` | Eyebrows, chips, segmented controls |
| `--shadow` | `0 1px 2px rgba(11,16,32,.04), 0 12px 32px rgba(11,16,32,.06)` | Resting cards |
| `--shadow-lg` | `0 24px 60px rgba(11,16,32,.12)` | Hover, modals, banner |
| `--shadow-focus` | `0 0 0 4px rgba(47,107,255,.16)` | **Focus ring (new — required for a11y)** |

Shadows stay soft and low-contrast — "calm infrastructure," not floating cards everywhere.

### 2.5 Iconography style
- **Current state:** emoji icons (📱🎓🏛️☀️🌊). Emoji are fast, zero-payload, and render in any language — *acceptable for launch*. But they render inconsistently across OSes and can read as informal.
- **Direction:** migrate to a **single line-icon set** (e.g. Lucide/Phosphor, ~1.75px stroke, rounded caps) for visual consistency and a more "infrastructure-grade" tone. Two-tone allowed: stroke in `--ink`, accent fill in the relevant semantic color.
- **Rule:** one icon style across the whole site. Do not mix emoji and line icons in the same component. If emoji are kept for launch, keep them *everywhere* consistently and revisit in v2.
- Icon tiles keep the current treatment: 46px rounded square, subtle brand→teal gradient tint background.

### 2.6 Imagery & illustration direction

**Allowed:**
- **Diagrammatic illustration** — the mesh/network diagram, tier diagrams, the inference "made simple" diagram. Geometric, flat, on-brand colors.
- **Abstract soft gradients** (the radial brand/teal washes already in the hero) — calm, not neon.
- **Restrained data viz** — honest, labelled, illustrative.
- **Authentic context photography** *if* used later: real Indian campuses, solar fields in GJ/RJ, students — natural light, documentary tone, never staged stock.

**Forbidden:**
- Server-room glamour shots that imply we own hardware.
- Generic "tech" stock (glowing globes, circuit boards, binary, handshake-over-city).
- Crypto/sci-fi imagery (per §1.3).
- Faces/logos of partner institutions without permission.

### 2.7 The mesh / network visualization treatment
The existing animated canvas mesh is the site's signature asset and is well-built. Keep it, with these design rules:
- **Frame it honestly:** add a caption — *"Illustrative: how work, results and payouts flow across the mesh. Toggle to see emergency mobilization."* It is a diagram, not a live feed.
- **Calm by default:** particle density and speed already reasonable; ensure it never strobes. Emergency mode (red) is a *deliberate* state change the user triggers — it should feel purposeful, not alarmist on load. Default = peace-time.
- **prefers-reduced-motion:** the code already reads it and slows to `SP 0.4`. **Strengthen:** when reduced-motion is set, render a *static* diagram (nodes + faint spokes + a legend, no moving particles) rather than merely slower particles. See §7.4.
- **Low-end devices:** cap DPR at 2 (already done); pause `requestAnimationFrame` when the canvas is off-screen (IntersectionObserver) to save battery/CPU; provide a static SVG fallback if canvas is unsupported.
- **Color semantics in the viz** (keep, document): blue = workload dispatch, teal = results/checkpoints, green = UPI payout, purple = job request, red = emergency priority. These are legend-explained.
- **Touch:** hover tooltips don't exist on touch — on tap, show the node tooltip as a dismissible chip; ensure tap targets ≥44px.

### 2.8 Dark mode (consideration)
- The site is light-first; the **sovereign core, sovereignty banner, and mesh core already use the ink-dark surface** as intentional accents — that contrast is part of the brand and should stay even in a future dark mode.
- **Recommendation:** ship light-mode only for v1. Design tokens are structured so a dark theme is a later token-swap (introduce `--bg/--ink` inversions). Do **not** auto-switch to dark via `prefers-color-scheme` in v1 (the brand washes and the dark-accent sections are tuned for light). Track as v2.

---

## 3. Information Architecture & Page Map

### 3.1 Narrative arc for a first-time visitor
The order answers a visitor's questions in the order they ask them:

1. **What is this?** → Hero
2. **Why does it matter / is it real?** → Problem & thesis (idle compute, honest framing)
3. **How does it work for me?** → How it works (4 steps)
4. **Show me.** → The mesh visualization
5. **Who actually powers it?** → Supply tiers
6. **But can it really run AI?** → Tiered inference, made simple
7. **Is it good for the planet?** → Green energy
8. **How does it compare honestly?** → Comparison (vs status quo, framed honestly)
9. **What's it good for / not for?** → Use-cases & honest workload fit
10. **Can I trust it?** → Sovereignty & security
11. **How do I join?** → Contributor invitations (audience picker) → **Sign-up flow** (primary conversion)
12. **Open questions** → FAQ
13. **Footer**

(Dual-mode and roadmap from the current page fold into this arc: dual-mode lives inside/after the thesis; roadmap sits between use-cases and sovereignty, or in FAQ. CPO PRD decides final inclusion; design supports either.)

### 3.2 Section hierarchy & primary action (one per section)
| # | Section | Primary action | Secondary |
| --- | --- | --- | --- |
| 1 | Hero | **Join the mesh** | See how it works |
| 2 | Problem / thesis | (scroll) | — |
| 3 | How it works | (scroll) | — |
| 4 | Mesh viz | Toggle mode (engagement) | — |
| 5 | Supply tiers | **Find your tier** → jumps to invitations | — |
| 6 | Tiered inference | (scroll / learn) | Read the honest benchmark |
| 7 | Green energy | (scroll) | — |
| 8 | Comparison | **Join the mesh** | — |
| 9 | Use-cases | **Request compute** (AI client) | — |
| 10 | Sovereignty | (trust reinforcement) | — |
| 11 | Invitations + sign-up | **Sign up (by audience)** | — |
| 12 | FAQ | (expand) | Contact |
| 13 | Footer | Sign up | Links |

**Rule:** competing primary CTAs are not stacked. The hero, comparison, and invitations sections all funnel to the *same* sign-up flow; secondary actions are visually demoted (`btn-ghost`).

### 3.3 Navigation
- **Sticky top nav** (keep current blurred-glass treatment). Links: How it works · The mesh · AI inference · Tiers · Green · Sovereignty. Right side: `Become a provider` (ghost) + **`Join now`** (primary).
- **Mobile nav:** current design hides links and the ghost CTA at ≤880px, leaving only `Join now`. **Improve:** add a hamburger → full-screen menu (the current `.menu-toggle` exists but is unused). Menu lists all sections + both CTAs, large tap targets, closes on selection.
- **Scroll-spy:** active section highlighted in nav (subtle underline/weight), helps orientation on a long page.
- **Skip-to-content link** (a11y, currently missing) as first focusable element.
- One persistent path to sign-up from anywhere: nav `Join now` is always visible.

---

## 4. Section-by-Section UX

For each: **layout intent · key visual · CTA · microcopy guidance.**

### 4.1 Hero
- **Layout:** centered, generous top padding, radial brand/teal wash (keep). H1 → lede → two CTAs → trust note → 4 honest stats.
- **Key visual:** the gradient-word headline; the stat row.
- **CTA:** primary **"Join the mesh →"** ; secondary "See how it works."
- **Microcopy:** Keep the strong, honest H1. Lede stays factual (the national idle-compute story). **Fix:** tag the "50%" stat as a *target* (e.g. label "Phase-2 target: 50% cheaper"). Trust note keeps: "100% Indian-hosted · Earn via UPI · Confidential, sandboxed compute."
- **Stats honesty:** "1M+ target active nodes" already says target — good. Apply the same discipline to all four.

### 4.2 Problem / Thesis
- **Layout:** short, calm. A single strong statement + the idle-window table (PRD §1.4) rendered as a clean responsive table or 5 small stat-cards ("Phones at night · Labs on weekends · …").
- **Key visual:** the idle-window mini-table or a simple "what's idle right now" diagram (illustrative).
- **CTA:** none — this section sells the idea, then hands to "how."
- **Microcopy:** "At any moment, most of India's computing power sits idle. DUM360 puts it to work — safely, and gives it back instantly." Keep the honest tone; this is where we *earn* trust by not overclaiming.

### 4.3 How it works
- **Layout:** keep the 4-step numbered grid (Install & verify → Pre-inform availability → Compute safely → Get paid). 4 cols desktop → 2 → 1.
- **Key visual:** numbered tiles with the brand→teal number chips.
- **CTA:** none (educational); the section flows to the mesh.
- **Microcopy:** keep concise. Reinforce trust in step 3 ("jobs you can't read") and reclaim in step 4 ("graceful drain returns your device 30 min before exit"). Surface "pause / uninstall anytime" here — never hide reclaim.

### 4.4 Mesh visualization
- **Layout:** keep. Mode toggle (segmented control) above the stage; legend below; hint line.
- **Key visual:** the canvas mesh.
- **CTA:** the peace/emergency toggle is the engagement action.
- **Microcopy:** add the "Illustrative" caption (§2.7). Hint adapts on touch: "Tap any node to see its role · switch modes."

### 4.5 Supply tiers
- **Layout:** the 5 tiers from PRD §3.1 as **tier cards** (see §8.4), each showing: tier name, examples, interconnect, best-fit workloads, and a "who this is" line. Distinct from persona cards — these explain *capability*, personas explain *people*.
- **Key visual:** tier cards, possibly arranged from "highest-capability core" (institutional) to "burst edge" (consumer) to teach the model-vs-request parallelism idea visually.
- **CTA:** **"Find your tier"** → scrolls to the audience picker / sign-up.
- **Microcopy:** carry the PRD design principle plainly: "Country-wide mesh for throughput; tightly-connected clusters for big models." Mark the institutional tier as the credible core (it is — per benchmark doc).

### 4.6 Tiered inference — made simple & visual
This is where honesty matters most and where most visitors get lost. **Goal: make the request-parallel vs in-cluster vs NKN idea understandable to a non-expert in one glance.**
- **Layout:** a **3-step visual diagram**, not a wall of text:
  1. **Small models → whole requests to whole nodes** (drawn as many phones each handling one request) → "scales to millions at once."
  2. **Big models → split inside one well-connected cluster** (drawn as one campus lab, shards inside).
  3. **Biggest models → pipeline across campuses over NKN** (drawn as 2–3 campuses linked).
- **Key visual:** the diagram above; each step has a one-line plain-language caption.
- **CTA:** secondary "Read the honest benchmark" → links to `compute-benchmark.md` (or a /honesty page). This *builds* credibility.
- **Microcopy (binding honesty):** include the workload-fit line — **"Built for massively-parallel, latency-tolerant work (inference, rendering, simulation). Not for training frontier models across home internet — the physics doesn't allow it, and we won't pretend it does."** This sentence is a brand asset; keep it.

### 4.7 Green energy
- **Layout:** a distinct **green-themed** band (`--green-soft` background, `--green` accents) — the one place the green palette is used. Two parts: (a) **deployable today** — daytime solar in GJ/RJ, seawater-cooled floating compute; (b) **forward-looking R&D** — tidal/wave as 24×7 clean baseload.
- **Key visual:** a simple day/night routing diagram (sun → solar nodes by day, devices by night) — directly illustrates FR-3.2.
- **CTA:** for solar/green operators → "Monetize surplus cycles" → sign-up (green-operator type).
- **Microcopy (honesty):** mirror the PRD's honest status box — **clearly separate "deployable today" from "nascent / R&D track."** Do not imply tidal capacity exists at scale. Example: "Solar arbitrage runs today. Tidal & wave power are an early R&D track for round-the-clock clean baseload — promising, not yet at scale."

### 4.8 Comparison (honest)
- **Layout:** a **3-column comparison table** framed as *positioning, not a leaderboard.* Columns: **DUM360 · Foreign hyperscaler · India's current public HPC.** Rows chosen to make DUM360 win *only where it honestly wins*, and to concede where it doesn't. See ASCII wireframe §4.8.1 and component §8.5.
- **Key visual:** the table, with honest "✓ / — / ✗" and one explicitly conceded row.
- **CTA:** **"Join the mesh."**
- **Microcopy (binding):** the table MUST include a conceded row, e.g. *"Frontier model training"* → DUM360 "Not our job ✗", hyperscaler "✓". This single honest concession makes every other ✓ believable. A caption: "We're honest about what we're not. Numbers are targets/illustrative — see the benchmark."

#### 4.8.1 ASCII wireframe — Comparison section
```
┌───────────────────────────────────────────────────────────────────────────┐
│  EYEBROW: Honest comparison                                                  │
│  H2:  Where DUM360 actually fits                                             │
│  Sub:  We turn India's already-paid-for idle hardware into its largest       │
│        sovereign inference engine. Here's the honest picture.               │
│                                                                             │
│  ┌─────────────────────────┬──────────────┬──────────────┬──────────────┐  │
│  │                         │  ★ DUM360    │  Foreign     │  India public │  │
│  │                         │  (sovereign) │  hyperscaler │  HPC today    │  │
│  ├─────────────────────────┼──────────────┼──────────────┼──────────────┤  │
│  │ Data stays in India     │      ✓       │      ✗       │      ✓        │  │
│  │ AI inference at scale   │      ✓       │      ✓       │   limited     │  │
│  │ Cost (target)           │  ~½ of cloud*│   baseline   │      n/a      │  │
│  │ Uses existing hardware  │      ✓       │      ✗       │      ✗        │  │
│  │ Greener (idle + solar)  │      ✓       │   varies     │   varies      │  │
│  │ Emergency mobilization  │      ✓       │      ✗       │   partial     │  │
│  │ Frontier model TRAINING │   ✗ not us   │      ✓       │   limited     │  │  ← conceded row
│  └─────────────────────────┴──────────────┴──────────────┴──────────────┘  │
│                                                                             │
│  caption: *Phase-2 target. Figures illustrative — see the honest benchmark. │
│                                                                             │
│            [  Join the mesh →  ]   (primary, centered)                      │
└───────────────────────────────────────────────────────────────────────────┘
On mobile: the table collapses to stacked "row cards" — each row becomes a
small card listing the 3 columns vertically (no horizontal scroll). The
DUM360 column is visually emphasized (brand tint) in every collapsed card.
```

### 4.9 Use-cases / usefulness
- **Layout:** card grid of honest workloads (batch inference, video rendering, simulation/Monte-Carlo, sequencing, parameter sweeps, research compute), plus the dual-use note (commercial peace-time + Rashtra Seva). Optionally a small "not built for" line for credibility.
- **Key visual:** workload cards with line icons.
- **CTA:** **"Request compute"** (AI-client path) as primary here; "Become a provider" secondary.
- **Microcopy:** concrete, not abstract — "Run a million inference requests overnight," "Render a film sequence across campus labs," "Climate models for disaster response (Rashtra Seva)."

### 4.10 Contributor invitations (audience picker)
- **Layout:** the conversion gateway. A grid of **audience cards** (one per contributor type, §6), each with an icon, a one-line value prop tailored to that audience, and a CTA that *pre-selects that type in the sign-up flow.*
- **Key visual:** 8 audience cards (citizen, student, university, govt/PSU, solar/green operator, enterprise/MSME, AI client, developer-contributor).
- **CTA:** each card → "Join as a [type] →" opening the sign-up with the type pre-filled.
- **Microcopy:** see §6 for per-audience copy.

### 4.11 Sovereignty & security
- **Layout:** keep the dark `sov` banner (it's a strong trust anchor). Chips: DPDP-aligned · TLS 1.3 · Mumbai primary / Bengaluru-NCR DR · Zero cross-border routing · Confidential computing.
- **Key visual:** dark banner with chips; optionally a tiny India map marker for the two data-center zones (restrained, not nationalist).
- **CTA:** none (trust reinforcement before the final sign-up).
- **Microcopy:** factual, calm. "Hosted exclusively on Indian clouds. Nothing crosses the border."

### 4.12 FAQ
- **Layout:** accordion (single-column, max ~720px). Questions the One-Test personas actually ask.
- **Key visual:** clean expand/collapse list.
- **CTA:** "Still have a question? Email us."
- **Microcopy (essential FAQs):** "Is it safe to run on my device?" · "How much can I earn?" · "How do I pause or uninstall?" · "Will it slow my computer / drain my battery?" · "When will it launch?" · "Is this crypto?" (answer: **No — it's national compute infrastructure, paid in rupees via UPI**). The "Is this crypto?" question is important to preempt the wrong mental model.

### 4.13 Footer
- **Layout:** keep current 3-column + brand blurb + bottom bar.
- **Microcopy:** add legal/links the CPO PRD specifies (Privacy, DPDP note, Contact). "Made in India 🇮🇳" stays as the single restrained national mark.

---

## 5. Contributor Sign-up / Waitlist UX (replaces the Google Form)

This replaces the external `forms.gle` link with a native, on-brand flow backed by **Firebase Firestore + Google Auth**. Designed to pass the One Test: a citizen finishes in under a minute; an institution gives the detail it needs to.

### 5.1 Goals & principles
- **Anonymous-first.** Anyone can join the waitlist with just an email — **Google Sign-In is optional**, offered as a convenience and as the gateway to the contributor portal. Never block sign-up behind auth.
- **Audience-aware.** The form adapts its fields to the selected audience type — a citizen sees 2 fields; a university sees a few more. Never show an institution's fields to a citizen.
- **Progressive disclosure.** Step 1 = who you are; Step 2 = minimal details; done. Optional Step 3 = create an account to manage your sign-up.
- **Trust copy at the point of action.** "No spam. Your data stays in India. We'll only email about early access."
- **Every state designed:** empty, focus, filling, validating, loading/submitting, success, error, already-submitted.

### 5.2 The flow (overview)
```
Entry points (hero / comparison / invitations / nav "Join now")
        │
        ▼
[ Step 1 · Pick audience type ]  ──(if launched from an audience card, pre-selected & skipped)
        │
        ▼
[ Step 2 · Short form (fields adapt to type) ]
        │
        ├── Submit anonymously ───────────────┐
        │                                      ▼
        └── (optional) Continue with Google  [ Success state ]
                     │                          │
                     ▼                          ▼
            [ Google Auth ]            "You're on the list"  + (if signed in)
                     │                  ↳ link to Contributor Portal
                     ▼
            [ Step 2 prefilled w/ name+email ] → Submit → Success → Portal
```

### 5.3 Wireframe — Step 1: Audience picker (modal or dedicated section)
```
┌──────────────────────────────────────────────────────────────┐
│  Join the mesh                                          [ ✕ ]  │
│  Tell us who you are — we'll tailor the next step.            │
│                                                              │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐    │
│  │ 📱        │ │ 🎓        │ │ 🏫        │ │ 🏛️        │    │
│  │ Citizen   │ │ Student   │ │ University│ │ Govt / PSU│    │
│  │ Earn from │ │ Build +   │ │ Idle lab  │ │ Sovereign │    │
│  │ idle dvce │ │ contribute│ │ compute   │ │ capacity  │    │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘    │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐    │
│  │ ☀️        │ │ 🏢        │ │ 🧪        │ │ 💻        │    │
│  │ Solar /   │ │ Enterprise│ │ AI client │ │ Developer │    │
│  │ green op  │ │ / MSME    │ │ buy compute│ │ contribute│    │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘    │
│                                                              │
│  Not sure? [ I just want updates → ]  (generic waitlist)     │
└──────────────────────────────────────────────────────────────┘
Cards: ≥44px tap targets, keyboard-navigable (arrow keys + Enter),
selected card gets brand ring. On mobile → 2 columns, scrollable.
```

### 5.4 Wireframe — Step 2: Adaptive form (example: Citizen)
```
┌──────────────────────────────────────────────────────────────┐
│  ← Back              Join as a Citizen Provider        [ ✕ ]  │
│  Earn passive UPI income from your idle phone or PC.         │
│                                                              │
│  Name (optional)                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│  Email *                                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ you@example.com                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│  Device(s) you'd share   [ ▼ Phone / PC / Both ]            │
│  State            [ ▼ Select state ]   (helps us plan rollout)│
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Join the waitlist                            │ │  ← primary
│  └────────────────────────────────────────────────────────┘ │
│  ──────────────────  or  ──────────────────                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  [G]  Continue with Google                              │ │  ← optional
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  🔒 No spam. Your data stays in India. Early-access emails   │
│     only. You can pause or leave anytime.                    │
└──────────────────────────────────────────────────────────────┘
```
**Field sets per audience (design intent — final fields w/ CPO):**
| Audience | Beyond name+email |
| --- | --- |
| Citizen | Device type, State |
| Student | College/University, Interest (use device / build platform / both) |
| University | Institution name, Role, # labs / approx machines, NKN-connected? |
| Govt / PSU | Organization, Department, Role, Sovereign/emergency interest |
| Solar / green operator | Org/site, State, Approx GPU capacity, Energy source |
| Enterprise / MSME | Company, Size, Machines idle off-hours, Settlement pref (credits/bank) |
| AI client | Org, Workload type (inference/render/batch), Approx scale |
| Developer-contributor | GitHub/portfolio (optional), Skills/interest area |

> **Design rule:** never more than ~5 fields visible; only email is required for any audience. Org-type audiences may add fields but keep one "everything else later" promise. Use selects/chips over free text where possible (lower friction, better data, easier on mobile keyboards).

### 5.5 Google Sign-In — when and how
- **Always optional, never a wall.** Shown as a secondary path under the primary "Join the waitlist" button (see §5.4), plus inside the success state as "Create an account to manage your sign-up."
- **Anonymous path (default):** email → Firestore waitlist doc → success. No account created. Lowest friction; right for most citizens.
- **Authenticated path:** "Continue with Google" → Firebase Google Auth → prefill name+email → submit → success **+ access to the Contributor Portal** (§5.7). Right for people who want to edit details, change availability interest, or who'll become real providers.
- **Why offer it:** reduces typing on mobile, verifies email, and is the on-ramp to the portal — without ever forcing it. Microcopy: "Optional — lets you edit your details later."
- **Privacy framing:** "We only read your name and email. Your data stays on Indian-hosted infrastructure." (DPDP-aligned; legal to confirm exact wording.)

### 5.6 Form states (every one specified)
| State | Visual | Microcopy |
| --- | --- | --- |
| **Empty** | Placeholder text, no errors. | Helper: "Only your email is required." |
| **Focus** | Input border `--brand`, `--shadow-focus` ring. | — |
| **Validating (inline)** | Real-time on blur; valid = subtle ✓; invalid = `--error` border + message below. | "Enter a valid email so we can reach you." |
| **Submitting / loading** | Button → spinner + label, disabled, non-destructive (no layout shift). | "Joining…" |
| **Success** | Replace form with success card (✓ in `--success`), confetti-free, calm. Offer Google account + share. | "You're on the list. We'll email you as we open access in your area." |
| **Error (network/server)** | Inline banner above button, `--error`, retry button; form data preserved. | "Couldn't submit — check your connection and try again." |
| **Already submitted** (same email) | Friendly, not a hard error. | "You're already on the list 🎉 We'll be in touch. Want to update your details? [Sign in]" |
| **Auth error** | Toast/banner; fall back to anonymous path. | "Google sign-in didn't work — you can still join with your email." |

### 5.7 Contributor Portal (lightweight, post-auth)
A minimal authenticated view to manage one's own sign-up. **Not** a provider dashboard (earnings/jobs come later with the actual app) — this is "manage my waitlist entry / express my intent." Backed by the same Firestore doc + Auth.

```
┌──────────────────────────────────────────────────────────────┐
│  DUM360                          Hi, Priya ▾   [ Sign out ]    │
│ ─────────────────────────────────────────────────────────────│
│                                                              │
│  ✓ You're on the list                                        │
│  Joined as: Citizen Provider · 12 Jun 2026                   │
│                                                              │
│  ┌─────────────────────────────┐ ┌────────────────────────┐ │
│  │  Your details            ✎ │ │  Your interest          │ │
│  │  Name   Priya S.            │ │  Devices  Phone + PC    │ │
│  │  Email  priya@…             │ │  State    Rajasthan     │ │
│  │  [ Edit details ]           │ │  Window   Nights (intent)│ │
│  └─────────────────────────────┘ └────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  What happens next                                     │  │
│  │  1. We're onboarding campuses first (Phase 1).         │  │
│  │  2. You'll get an email when the citizen app opens.    │  │
│  │  3. Then: install, set your hours, earn via UPI.       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [ Change audience type ]   [ Leave the waitlist ]          │
│   (destructive action → confirm modal)                       │
└──────────────────────────────────────────────────────────────┘
```
- **Portal principles:** show exactly what we hold (transparency), let the user edit or leave easily (never hide reclaim — same principle as the device), set honest expectations about timing (Phase 1 = campuses first).
- **Empty/edge states:** if a signed-in user has no waitlist entry → prompt to join. If entry exists for a different email → reconcile via the signed-in email.
- **"Leave the waitlist"** → confirm modal → deletes the Firestore doc → calm confirmation ("You've been removed. You can rejoin anytime."). This is the trust-mirror of "uninstall anytime."
- **Mobile:** single column, cards stack, all actions ≥44px.

### 5.8 Sign-up presentation: modal vs page
- **Default: modal** triggered by any "Join" CTA, so the visitor never loses context/scroll. The audience picker (§5.3) is step 1 inside it.
- **Also a standalone route** (`/join` and `/join?type=university`) for: deep links from the audience cards, partner outreach emails (the partnership-note can link `/join?type=university`), and no-JS fallback.
- Modal must be: focus-trapped, `Esc`-closable, scroll-locked behind, dismissible by overlay click, returns focus to the trigger on close.

---

## 6. Audience-Tailored CTAs & Value Props

Each contributor type gets one tailored card (invitations section §4.10) and a pre-filled sign-up. Tone: plain, benefit-first, honest.

| Audience | Icon | One-line value prop | CTA label | Pre-fill |
| --- | --- | --- | --- | --- |
| **Citizen** | phone | "Turn your idle phone or PC into nightly income — paid in rupees via UPI." | Start earning → | `type=citizen` |
| **Student** | grad-cap | "Earn from your laptop and help build India's sovereign compute mesh." | Join as a student → | `type=student` |
| **University** | building | "Convert idle lab nights into compute-grants, credits and research — no daytime disruption." | Partner your campus → | `type=university` |
| **Govt / PSU** | bank | "Contribute sovereign capacity and stand up Rashtra Seva for emergencies." | Talk to us → | `type=govt` |
| **Solar / green operator** | sun | "Monetize surplus daytime solar by renting clean GPU cycles." | Monetize cycles → | `type=solar` |
| **Enterprise / MSME** | office | "Offset IT spend — rent machines idle outside business hours into a sovereign pool." | Rent spare compute → | `type=enterprise` |
| **AI client** | flask | "Affordable, India-hosted inference and rendering at scale." | Request compute → | `type=client` |
| **Developer-contributor** | code | "Build distributed scheduling, WASM/K3s agents, secure enclaves — on real national infra." | Contribute code → | `type=developer` |

**Design treatment of the invitation grid:**
- Provider-type cards (citizen, student, university, govt, solar, enterprise) share a neutral/brand treatment; **AI client** card uses a subtly different tint (it *buys* rather than *provides*) so the two sides of the marketplace are visually distinguishable; **govt** card may carry a restrained `--accent` edge (sovereign).
- Each card states the *benefit*, not the mechanism. The benefit-first labels above replace generic "Sign up."
- "Talk to us" (govt, large university, large enterprise) routes to a contact-style sign-up (more fields, expects human follow-up) rather than self-serve waitlist — high-touch audiences get a high-touch path.

---

## 7. Responsive & Accessibility

### 7.1 Mobile-first behavior
- Single-column from the start; multi-column grids are progressive enhancement at breakpoints (existing breakpoints 880/820/720/520 are reasonable — consolidate to a documented set: `sm 520 · md 720 · lg 880 · xl 1140`).
- Tap targets ≥44×44px (buttons, nav, audience cards, form controls, mesh nodes on touch).
- Sticky nav stays slim on mobile; hamburger menu (§3.3).
- Stats: 4→2 cols; mode cards/tiers/personas → 1 col; comparison table → stacked row-cards (§4.8.1).
- Forms: full-width inputs, native selects, numeric/email keyboards via correct `inputmode`/`type`, labels above inputs (never placeholder-only).

### 7.2 Low-bandwidth / low-end-device
- **Keep the page lightweight:** the current single-file HTML + canvas approach is good. Budget: HTML+CSS+JS critical path well under ~150KB gz; defer the mesh script; lazy-init canvas on scroll.
- Self-host or `font-display: swap` Inter (already swap); consider subsetting to Latin + Devanagari for multilingual.
- No heavy hero images; gradients are CSS. Any future photos must be responsive `srcset` + lazy + modern formats (AVIF/WebP).
- Mesh animation pauses off-screen and on reduced-motion/low-power.
- Graceful no-JS: sign-up works via the `/join` route (server/Firebase form) even if the modal JS fails.

### 7.3 Multilingual readiness (Hindi + regional)
- **Design for ~30% text expansion** (Hindi/Devanagari and regional scripts run longer/taller). Don't pack lines tightly; avoid fixed-height buttons/cards that clip; give line-height headroom for Devanagari matras (use ≥1.3 LH on headings when Hindi is active).
- All UI strings externalized (i18n keys), no text baked into images. Mesh node labels translatable.
- Language switcher in nav/footer (start: English / हिन्दी; architecture ready for Tamil, Telugu, Bengali, Marathi, etc.).
- Number/currency formatting in Indian conventions (lakh/crore, ₹).
- Logical-property CSS (`margin-inline`, `padding-block`) so layouts are robust; LTR for now but no hard-coded left/right that would block future needs.

### 7.4 Motion & prefers-reduced-motion
- **Reveal-on-scroll:** honor `prefers-reduced-motion: reduce` → elements appear without transform/opacity animation (currently the `.reveal` animation runs regardless — **fix: disable transitions under reduced-motion**).
- **Mesh:** under reduced-motion render a **static labelled diagram** (no particle motion), not just slowed particles (§2.7).
- **Hover lifts/transforms:** disabled or minimized under reduced-motion.
- Nothing flashes more than 3×/sec (seizure safety) — the emergency banner pulses gently, verify rate.

### 7.5 WCAG / a11y checklist (target: WCAG 2.1 AA)
- **Contrast:** apply §2.1 corrections (`--brand-ink` for links/small text, `--brand-strong` for button fills, `--ink-soft` for meaningful captions). Verify all pairs ≥4.5:1 (text) / 3:1 (large/UI).
- **Focus:** visible focus ring (`--shadow-focus`) on every interactive element — currently buttons rely on hover only. Add `:focus-visible` styles globally.
- **Keyboard:** full keyboard operability — nav, mode toggle, audience cards (arrow-key roving), modal (focus trap + Esc), forms, accordion.
- **Semantics:** real landmarks (`<header><nav><main><section aria-labelledby><footer>`), one `<h1>`, ordered headings, `<button>` for actions (not `<a href="#">`), labelled form controls, `aria-live` for form success/error and the emergency banner.
- **Skip link** to main content.
- **Mesh canvas:** provide `role="img"` + descriptive `aria-label` and a visually-hidden text summary of what the diagram shows (canvas content is invisible to screen readers).
- **Images/icons:** decorative icons `aria-hidden`; meaningful ones get labels.
- **Reduced motion** respected (§7.4).
- **Touch + zoom:** allow pinch-zoom (no `maximum-scale=1`), reflow at 320px / 200% zoom without horizontal scroll.

---

## 8. Component Specs & States

### 8.1 Buttons
| Variant | Use | States |
| --- | --- | --- |
| **Primary** (`btn-primary`) | One per section. Fill `--brand-strong`, white text, soft brand shadow. | default · hover (lift 2px, deeper shadow) · **focus-visible (ring)** · active (press) · disabled (60% opacity, no shadow, `not-allowed`) · loading (spinner + label, disabled). |
| **Ghost** (`btn-ghost`) | Secondary. White fill, `--line` border, ink text. | default · hover (border→brand, text→`--brand-ink`) · focus-visible · disabled. |
| **Emergency** | Mesh toggle / Rashtra Seva only. `--accent`. | as primary, accent-tinted. Never a generic CTA. |
| **Google** | Sign-in. White, `--line` border, "G" mark, ink text. | default · hover · focus · loading. Follows Google branding rules. |
| **Text/link** | Inline. `--brand-ink`, underline on hover/focus. | default · hover · focus · visited. |
Min height 44px; loading state must not change width (reserve space).

### 8.2 Cards (generic)
Resting: white, `--line` border, `--radius`, `--shadow`. Hover: lift 4px + `--shadow-lg` (disabled under reduced-motion). Focus-within: ring if interactive. Keep current treatment.

### 8.3 Icon tiles
46px, `--radius-sm`, brand→teal gradient tint, line-icon centered. Consistent across all cards.

### 8.4 Tier cards (new)
Layout: tier name (h3) · examples (chips or comma list) · two labelled rows ("Interconnect" / "Best-fit work") · a "Who: …" line · optional capability badge ("Credible core" on institutional). States: default, hover-lift, focus-within. Visually graded so institutional reads as "core" and consumer as "edge."

### 8.5 Comparison table
- Desktop: semantic `<table>`, sticky-ish header row, DUM360 column highlighted (brand tint, ★). ✓ = `--success`, — = `--muted`, ✗ = `--error`/muted depending on row (conceded row uses calm muted ✗ + "not us", not alarming red).
- Mobile: collapses to stacked row-cards (no horizontal scroll) — each row card shows the 3 values vertically with DUM360 emphasized.
- Must be screen-reader navigable (proper `<th scope>`).

### 8.6 Forms (inputs, selects, chips)
- Inputs: label above, 12px radius, `--line` border; focus = brand border + `--shadow-focus`; error = `--error` border + message (`aria-describedby`); success = subtle ✓. 44px min height.
- Selects: native on mobile; styled but accessible on desktop.
- Chips/segmented (device type, audience): roving tabindex, selected = brand fill/ring.
- States enumerated in §5.6.

### 8.7 Navigation
- Sticky, blurred glass, `--line` bottom border. Scroll-spy active state. Mobile hamburger → full-screen menu (focus-trapped, Esc/overlay close). `Join now` always visible.

### 8.8 Modals
- Centered, `--radius-lg`, `--shadow-lg`, dimmed scrim. Focus-trapped, Esc-close, overlay-click close, scroll-lock, return focus to trigger. Used for: sign-up flow, "leave the waitlist" confirm, mobile node tooltip (optional). `aria-modal`, labelled by its heading.

### 8.9 Toasts
- Bottom (mobile) / top-right (desktop), `--radius-sm`, auto-dismiss ~5s, manual close, `aria-live="polite"` (assertive for errors). Variants: success (`--success`), error (`--error`), info (`--ink`). Used for auth fallback, "details saved," etc.

### 8.10 Accordion (FAQ)
- Single-column; each item a `<button>` header (`aria-expanded`) + region. One or many open (designer pref: many). Smooth height transition (disabled under reduced-motion). Chevron rotates.

---

## 9. Microcopy (tone & examples)

**Voice:** plain, warm, confident, never hype. Speak to one person. Indian-English, no jargon. A sentence a shop-owner reads once and gets.

**Buttons:** benefit-first verbs — "Join the mesh," "Start earning," "Partner your campus," "Request compute," "Monetize cycles," "Continue with Google," "Join the waitlist." Avoid "Submit," "Click here."

**Empty / helper:**
- "Only your email is required."
- "Pick who you are — we'll keep the next step short."

**Loading:** "Joining…" · "Saving…" · "Signing you in…"

**Success:**
- "You're on the list. We'll email you as we open access in your area."
- "Saved. Your details are up to date."
- "You've been removed. You can rejoin anytime." (leave-waitlist)

**Error:**
- "Couldn't submit — check your connection and try again." (network)
- "Enter a valid email so we can reach you." (validation)
- "Google sign-in didn't work — you can still join with your email." (auth fallback)
- "You're already on the list 🎉 Want to update your details? [Sign in]" (duplicate — friendly, not an error)

**Trust lines (reuse near actions):**
- "No spam. Your data stays in India. Early-access emails only."
- "You can pause, edit, or leave anytime."
- "Confidential, sandboxed compute — your data is never read on someone's device."

**Honesty lines (brand assets, reuse verbatim where apt):**
- "Built for massively-parallel work — not frontier training. We won't pretend home internet is a supercomputer."
- "We turn India's already-paid-for idle hardware into its largest sovereign inference engine."
- "We're honest about what we're not." (comparison caption)
- "No, this isn't crypto. It's national compute, paid in rupees via UPI." (FAQ)

---

## 10. Handoff notes to Frontend

- Tokenize the additions (`--green`, `--green-soft`, `--brand-ink`, `--brand-strong`, `--shadow-focus`, semantic statuses) in `:root`; the existing token structure already supports this.
- Apply the contrast corrections in §2.1 before launch — these are accessibility blockers, not nice-to-haves.
- Sign-up: build `/join` route + modal sharing one component; Firestore schema and Auth wiring per CPO PRD; design states per §5.6.
- Replace all four `forms.gle/...` links with the native flow (nav, hero, CTA section, footer "Join now").
- Add: skip link, focus-visible styles, reduced-motion guards (reveal + mesh), mobile hamburger, scroll-spy, canvas `aria-label` + off-screen pause.
- Keep it a fast, mostly-static page; the mesh and sign-up are the only meaningful JS.

---

## 11. Open Design Decisions for CEO / CPO

1. **The "50% cheaper" hero stat.** It's a Phase-2 *target*, not current reality (PRD §6). Keep it but visibly tag as a target, soften to "up to ~50%," or move it out of the hero into the comparison (where it's footnoted)? **Designer recommendation: tag as target + footnote; don't lead the hero with a number we can't yet prove.**
2. **Green palette addition.** Introduce a dedicated `--green` for the sustainability story, or keep using brand teal? **Recommendation: add it, used sparingly (green-energy section + green tier only).**
3. **Iconography:** ship with emoji (zero cost, multilingual, informal) for v1 and migrate to a line-icon set in v2, or invest in line icons now for an infrastructure-grade tone? **Recommendation: migrate to line icons before any partner/govt outreach; emoji read too casual for that audience.**
4. **High-touch vs self-serve sign-up for govt / large university / enterprise.** Should these route to a "Talk to us" contact path (human follow-up) instead of the self-serve waitlist? **Recommendation: yes — these are relationship sales, and the partnership-note already implies a human process.**
5. **Contributor portal scope for v1.** Ship the minimal "manage your waitlist entry" portal now, or wait until the real provider app exists? **Recommendation: ship the minimal portal — it justifies Google Auth, builds trust (transparency + easy leave), and is cheap.**
6. **Dark mode:** confirm light-only for v1 (tokens structured for later dark theme). **Recommendation: light-only v1.**
7. **Comparison table framing & the conceded row.** Confirm we're comfortable explicitly conceding "frontier training" on the public site. **Designer recommendation: strongly yes — the concession is what makes every other claim credible and is true to the benchmark doc.**
8. **A `/honesty` page** linking the benchmark doc publicly — does the CEO want the honest framing surfaced to all visitors (great for trust with technical/academic audiences), or kept as a link only? **Recommendation: surface it; it's a differentiator with universities.**
