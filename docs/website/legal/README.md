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
in India), which operates the DUM360 project; address = **#246, Ward-1, Jhajjar – 124103,
Haryana, India**; contact/grievance email = **info@balaji.it**; grievance officer = **Sandeep
Nandal (Proprietor)**; governing law / jurisdiction = **Jhajjar, Haryana, India**;
bot-protection = **Firebase App Check** (with reCAPTCHA).

**Defaults applied:** retention = until the relevant DUM360 product opens + up to **24 months**
(or on request, whichever is earlier); effective date / last updated = **22 June 2026**.

Open items that still block go-live (also tracked in `../PRD.md` §11): a **Significant Data
Fiduciary (SDF) assessment**, the **cookie "change your mind" mechanism** wording (depends on
the frontend consent UI), and a final **review by qualified Indian counsel**. Data-collection
facts the policy must reflect are in `../PRD.md` §8.
