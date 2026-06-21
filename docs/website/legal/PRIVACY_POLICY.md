[DRAFT — AI-generated analysis, not legal advice. Must be reviewed by qualified Indian counsel before publishing. Placeholders marked TODO.]

# Privacy Policy

**Effective date:** TODO _(insert date this policy goes live)_
**Last updated:** TODO
**Applies to:** the DUM360 website at `dum360.com` (the "Site") and the contributor waitlist sign-up it hosts.

---

## 1. Who we are

This Site is operated by **TODO _(insert full legal entity name, e.g. "DUM360 Technologies Private Limited" or the proprietorship/founder name actually responsible)_** ("DUM360", "we", "us", "our"), based in India.

Registered/operating address: **TODO _(insert address)_**

For the purposes of India's **Digital Personal Data Protection Act, 2023 ("DPDP Act")**, when you give us your personal data through this Site we act as a **Data Fiduciary** — we decide what data is collected and why. This policy explains, in plain language, what we collect, why, where it is stored, who can touch it, and the rights you have.

> **Scope note (please read).** This policy covers **only this marketing/waitlist website**. The DUM360 **compute platform** (the node app, dashboards, and the orchestration of compute workloads) is a separate product that is not yet open to the public; it will have its own, separate privacy terms before it launches.

---

## 2. A quick, honest word on "Indian hosting"

DUM360's core promise is that the **DUM360 compute platform and all its operational, user, and workload data are hosted in India** and do not cross our borders. That promise is about the **platform**.

This **brochure website** is different, and we want to be precise rather than blur it:

- **The pages, images, and scripts of this Site** are served through **Firebase Hosting**, which is a **global content delivery network (CDN)**. That means the *static files that make up the website* may be cached on and delivered from edge servers located **outside India** so the Site loads quickly. These static files contain **no personal data** — they are just the web page.
- **The personal data you submit through the sign-up form** (your name, email, etc.) is **not** stored on that global CDN. It is written to **Cloud Firestore in the Mumbai region (`asia-south1`), in India.** Your sign-up details are stored in India.

So: the *website's delivery* uses a global CDN; your *personal data* stays in India. We tell you this openly rather than imply the whole Site is India-only hosted.

---

## 3. What personal data we collect, and why

We deliberately collect as little as possible. Through the waitlist sign-up form we collect:

| Data | Required? | Why we collect it (purpose) |
| --- | --- | --- |
| **Email address** | Yes | To contact you about DUM360 and as the unique key that identifies your sign-up |
| **Name** | Yes | To address you correctly in follow-up |
| **Audience / contributor type** (citizen, student, university, government/PSU, solar/green operator, enterprise/MSME, AI client, developer/contributor) | Yes | To route you to the right team and send relevant information |
| **Organisation** | Optional (asked of universities, government/PSU, enterprise/MSME, solar operators) | To understand who you represent for partnership follow-up |
| **Phone number** | Optional | Only if you prefer a call/WhatsApp follow-up |
| **Free-text message / workload or pilot details** | Optional | So you can tell us about your use-case, pilot, or workload |
| **Consent record** | Yes | Proof that you agreed to be contacted (DPDP requirement) |

We also automatically capture a small amount of **technical/source information** with your sign-up:

- the **source/referral information** of your visit (e.g. UTM campaign tags, referring page, and the page you signed up from), to understand which outreach is working; and
- a **coarse, hashed device/browser signal** used only to detect spam and abuse (not used to identify or profile you).

**Analytics data** (how the Site is used) is collected **only if you consent** — see Section 7.

We do **not** intentionally collect sensitive or special-category data, financial account details, or government identifiers through this Site. Please do not enter such information in the free-text field.

---

## 4. Our lawful basis: your consent

Under the DPDP Act we process your personal data on the basis of your **free, specific, informed, and unambiguous consent**, given by an affirmative action.

- The sign-up form has a **consent checkbox that is not pre-ticked**. You must actively tick it to submit.
- The consent is for a clear, limited purpose: **to add you to the DUM360 contributor/stakeholder waitlist and to contact you about DUM360.**
- **You can withdraw your consent at any time** (see Section 9). Withdrawing consent is as easy as giving it; we will then stop processing your data for this purpose and delete or anonymise it unless we are required by law to keep it. Withdrawal does not affect processing already done before withdrawal.

---

## 5. How we use your data (purpose limitation)

We use your data **only** to:

1. add you to our contributor/stakeholder waitlist, segmented by audience type;
2. contact you (by email, and by phone/WhatsApp only if you provided a number) about DUM360 — updates, your segment's rollout, pilots, briefings, or early access;
3. understand demand by audience type so our team and partners can follow up appropriately; and
4. keep the Site secure and prevent spam/abuse.

We will **not** use your data for unrelated purposes without asking you again.

---

## 6. We do NOT sell your data

**We do not sell, rent, or trade your personal data to anyone.** We do not share it with advertisers or data brokers. We share it only with the limited service providers (processors) described in Section 8, and only as needed to run the Site and contact you.

---

## 7. Cookies, analytics, and consent

We keep tracking to a minimum and gate it behind your consent. See the companion **[Analytics & Cookies Notice](ANALYTICS_AND_COOKIES.md)** for full detail. In short:

- **No analytics or non-essential cookies load until you consent** via the consent banner.
- If you consent, we use **Google Analytics 4 (GA4)** to understand aggregate usage (which sections work, where sign-ups come from). We configure it to **anonymise IP addresses** and we do **not** put personal data (your name/email) into analytics events.
- You can decline analytics and still use the Site and sign up normally.
- A small number of **strictly necessary** items (e.g. remembering your consent choice, security/anti-abuse) may be used regardless, as they are required for the Site to function safely.

---

## 8. Third-party processors we rely on

We use a small set of trusted service providers ("Data Processors") who handle data **on our behalf and under our instructions**:

| Processor | What they do for us | Where |
| --- | --- | --- |
| **Google / Firebase** (Google Cloud / Firebase Hosting) | Serves the website's static files via global CDN; **no personal data** stored here | Global edge network |
| **Google / Firebase** (Cloud Firestore) | Stores your sign-up personal data | **Mumbai, India (`asia-south1`)** |
| **Google** (Google Analytics 4) | Aggregate, consent-gated usage analytics | Google infrastructure (consent-gated; IP-anonymised) |
| **Google** (Firebase Authentication / Google Sign-In) | **Only** powers an optional future contributor portal where you can manage your own record. **Never required to join the waitlist.** | Google infrastructure |
| Bot/abuse protection provider | Detects automated/spam submissions | TODO _(confirm whether Firebase App Check / reCAPTCHA Enterprise or Cloudflare Turnstile is used; update this row)_ |

Each of these providers operates under its own privacy and security commitments. We choose the **Mumbai (India) region** for the data store that holds your personal data.

If, in future, we engage any other processor that handles your personal data, we will update this policy.

---

## 9. Your rights under the DPDP Act

As a **Data Principal** under the DPDP Act, you have the right to:

- **Access** — ask what personal data of yours we hold and how we have processed it (a summary).
- **Correction & updating** — have inaccurate or incomplete data corrected, completed, or updated.
- **Erasure** — ask us to delete your personal data when it is no longer needed for the purpose, or when you withdraw consent (subject to any legal retention obligation).
- **Withdraw consent** — at any time, as easily as you gave it.
- **Grievance redressal** — raise a complaint with our Grievance Officer (Section 11) and have it addressed.
- **Nominate** — nominate another individual to exercise your rights in the event of your death or incapacity.

**How to exercise any of these rights:** email us at **TODO _(insert rights/privacy contact email, e.g. privacy@dum360.com)_** with your request and the email address you signed up with (so we can locate your record). We will respond within a reasonable period and in any case within timelines required by applicable law. We may need to verify your identity before acting on a request.

If you are not satisfied with how we handle your request or grievance, you have the right to escalate to the **Data Protection Board of India** once it is operational, as provided under the DPDP Act.

---

## 10. Data retention

We keep your sign-up data only for as long as needed for the waitlist and follow-up purpose, and then delete or anonymise it.

- **Retention period:** TODO _(CEO/Counsel to choose a defined period — e.g. "until the relevant DUM360 product opens to you and for up to 24 months thereafter, or until you ask us to delete it, whichever is earlier." A concrete, stated period is required.)_
- We delete or anonymise data sooner if you **withdraw consent** or ask for **erasure**, unless a law requires us to retain it.
- Aggregate, **non-identifying** statistics (e.g. "how many people signed up") may be retained indefinitely as they are not personal data.

---

## 11. Data Protection / Grievance Officer

In line with the DPDP Act, you can contact our Grievance Officer for any privacy question, request, or complaint:

- **Name:** TODO _(insert Grievance/Data Protection Officer name)_
- **Email:** TODO _(insert officer email)_
- **Postal address:** TODO _(insert address)_

_(Note for internal review: if DUM360 is later classified as a Significant Data Fiduciary, appointment of a Data Protection Officer based in India and additional obligations may apply — Counsel to assess.)_

---

## 12. Children's data

This Site and the DUM360 waitlist are intended for **adults (18 years or older)** and for institutional/organisational representatives. We do not knowingly collect personal data of children (defined under the DPDP Act as individuals under 18).

Under the DPDP Act, processing a child's data requires verifiable parental/guardian consent, and we do not undertake tracking, behavioural monitoring, or targeted advertising directed at children. If you believe a child has provided us personal data, contact our Grievance Officer (Section 11) and we will delete it.

---

## 13. How we protect your data (security)

We take reasonable security safeguards to protect your data, including:

- storing sign-up personal data in **Cloud Firestore (Mumbai, India)** with **security rules that prevent public reading** of sign-up records — entries cannot be listed or read by other visitors;
- **encryption in transit** (HTTPS / TLS) for all data sent to and from the Site, and encryption at rest as provided by our cloud processor;
- **collecting the minimum** data necessary;
- **bot/abuse protection** on the sign-up form; and
- limiting access to sign-up data to authorised team members who need it for follow-up.

No system is perfectly secure, but we work to protect your data and will act promptly on any issue. In the event of a personal data breach, we will notify the Data Protection Board of India and affected individuals as required by the DPDP Act.

---

## 14. Changes to this policy

We may update this policy as the Site or the law evolves. When we make a material change we will update the "Last updated" date above and, where appropriate, notify you. The current version always governs.

---

## 15. Contact us

Questions about this policy or your data:

- **General contact:** TODO _(insert contact email)_
- **Grievance Officer:** see Section 11.
- **Address:** TODO _(insert address)_

---

_This document is a draft prepared with AI assistance and does not constitute legal advice. It must be reviewed and finalised by qualified Indian counsel before publication._
