# Legal copy (drafted by General Counsel)

Authoritative, plain-language legal copy for the DUM360 website lives here as the
**source of truth**. It was drafted with AI assistance and is **DRAFT — pending review
by qualified Indian counsel**. Every `TODO` placeholder must be filled before launch.

Files:
- `PRIVACY_POLICY.md` — DPDP-aligned privacy policy (data collected, where stored
  [Firestore Mumbai / `asia-south1`], purpose, consent, retention, DPDP rights,
  grievance officer, contact).
- `TERMS_OF_SERVICE.md` — terms for the website + waitlist (non-binding expression of
  interest; forward-looking-statements disclaimer; governing law India).
- `ANALYTICS_AND_COOKIES.md` — consent-gated GA4 / cookies notice.

## Status: injected into the live pages

This copy has been rendered into the site page bodies:
- `PRIVACY_POLICY.md` → `/privacy.html`
- `TERMS_OF_SERVICE.md` → `/terms.html`
- `ANALYTICS_AND_COOKIES.md` → `/cookies.html`

Each page carries a visible "Draft — pending legal review" banner and renders every
`TODO` as a highlighted mark. **Keep these markdown files and the HTML pages in sync**:
edit the markdown here, get counsel sign-off, then mirror the change into the matching
`.html` file (and remove the draft banner + filled TODOs when finalised).

**Resolved:** operating entity = **BALAJI IT SOLUTIONS** (sole proprietorship, MSME-registered
in India), which operates the DUM360 project; all contact/grievance email = **info@balaji.it**.

Open items that still block go-live (also tracked in `../PRD.md` §11): registered/operating
address, named grievance officer individual (currently "The Proprietor"), retention period,
governing-law city, effective dates, bot-protection provider name, and an SDF assessment.
Data-collection facts the policy must reflect are in `../PRD.md` §8.
