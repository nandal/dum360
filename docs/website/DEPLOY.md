# DUM360 Website — Deploy & Firebase Setup

Exact, copy-pasteable steps to take the site from this repo to **dum360.com on Firebase Hosting**, with signups landing in **Cloud Firestore (Mumbai, asia-south1)**, bot protection via **App Check**, and optional **Google Sign-In**.

The site is a no-build static page (`index.html` + a few standalone HTML files + `firebase-config.js`). There is **no bundler** — the Firebase JS SDK is loaded modularly from the gstatic CDN at runtime. Nothing here requires Node tooling except the Firebase CLI.

> **The page works before any of this is done.** With placeholder config, the page renders normally and the sign-up form shows a friendly "sign-ups opening soon" message instead of crashing. Do these steps to make sign-ups live.

---

## Fast path (scripted)

Most of this is automated by `scripts/setup-firebase.sh`. Do the two interactive logins, then run it:

```bash
npm install -g firebase-tools     # if not already installed
firebase login                    # browser sign-in (the project's Google account)
gcloud auth login                 # only needed for the scripted Firestore-DB creation

# create the project + wire everything + deploy, in one go:
./scripts/setup-firebase.sh dum360-web --create
# (omit --create if you already made the project in the Console)
```

The script: writes `.firebaserc`, ensures a Web app + writes its SDK keys into `firebase-config.js`, creates **Firestore in asia-south1 (Mumbai)**, and deploys rules + indexes + hosting. It then prints the Console-only steps that remain (Google Auth, App Check key, custom domain/DNS). The manual walkthrough below documents every step the script performs, plus those Console-only bits.

---

## 0. Prerequisites

```bash
npm install -g firebase-tools     # Firebase CLI
firebase --version                # confirm it's installed
firebase login                    # opens a browser; sign in with the project's Google account
```

---

## 1. Create the Firebase project

You can do this in the [Firebase Console](https://console.firebase.google.com/) (easiest) or via CLI.

**Console:** "Add project" → name it (e.g. `dum360-web`) → you may disable Google Analytics for now (or enable GA4 if you want the funnel events later).

Note the **Project ID** it assigns (e.g. `dum360-web`).

Then point this repo at it — edit **`.firebaserc`**:

```json
{ "projects": { "default": "dum360-web" } }
```

---

## 2. Create Firestore in Mumbai (asia-south1) — PERMANENT, get it right

In the Console: **Build → Firestore Database → Create database**.

- **Location:** select **`asia-south1` (Mumbai)**. ⚠️ **The region cannot be changed later.** This is the sovereignty-critical choice (PRD §8.6) — signup PII physically resides in India.
- **Mode:** Start in **production mode** (locked). We ship our own rules in step 4.

---

## 3. Register a Web app & fill `firebase-config.js`

Console: **Project settings (gear) → General → Your apps → Add app → Web (`</>`)**.

- Register with a nickname (e.g. `dum360-site`). You do **not** need Firebase Hosting auto-setup here.
- Copy the `firebaseConfig` object it shows you.

Open **`firebase-config.js`** in the repo root and paste the values into `FIREBASE_CONFIG`, replacing every `TODO_…`:

```js
const FIREBASE_CONFIG = {
  apiKey:            "AIza…",
  authDomain:        "dum360-web.firebaseapp.com",
  projectId:         "dum360-web",
  storageBucket:     "dum360-web.appspot.com",
  messagingSenderId: "…",
  appId:             "1:…:web:…"
};
```

> These web-config keys are **not secrets** — they identify the project to the browser. Security is enforced by Firestore rules (step 5) + App Check (step 6), not by hiding these.

---

## 4. Enable Google Authentication (for the optional portal)

Console: **Build → Authentication → Get started → Sign-in method → Google → Enable** → set a support email → Save.

Add your domains under **Authentication → Settings → Authorized domains**: `dum360.com`, `www.dum360.com`, and `<project>.web.app`. (Not required to join the waitlist — only for the contributor portal.)

---

## 5. Deploy the Firestore security rules & indexes

The repo ships `firestore.rules` (validates signup writes; **denies public read of PII**; owner-only portal reads) and `firestore.indexes.json`.

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Verify in **Console → Firestore → Rules** that the rules match. The key guarantees:
- anyone can **create** a signup with a valid payload (`consent==true`, valid `audience`, correct field types/sizes, no extra fields);
- **no public read/list** of `signups` (PII protected);
- in the portal, a signed-in user can read/update/delete **only** their own doc (`uid == auth.uid`).

---

## 6. Enable App Check (bot protection — recommended default)

Console: **Build → App Check**.

1. **Register the web app** with the **reCAPTCHA Enterprise** (or reCAPTCHA v3) provider. Create a reCAPTCHA key in Google Cloud if prompted, scoped to your domains.
2. Copy the **site key** and paste it into `firebase-config.js` → `APP_CHECK_SITE_KEY` (replace `TODO_…`).
3. In **App Check → APIs → Cloud Firestore**, set enforcement to **Enforce** (after you've confirmed legit signups work — start in "Monitor" if you want a soft rollout).

If `APP_CHECK_SITE_KEY` is left as a placeholder, the page still works but writes are **not** bot-protected — set it before launch.

---

## 7. Test locally

```bash
firebase emulators:start --only hosting        # serves the static site on http://localhost:5000
```

Or just open `index.html` with any static server (e.g. `python3 -m http.server`). With real config, submit a test signup and confirm a doc appears in **Console → Firestore → `signups`**. With placeholder config, the form should show "sign-ups opening soon" and the console logs a clear note — no crash.

---

## 8. Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
# or everything at once:
firebase deploy --only hosting,firestore:rules,firestore:indexes
```

This deploys to `https://<project>.web.app` and `https://<project>.firebaseapp.com`. Test those URLs before touching DNS.

`firebase.json` is already configured: `public: "."`, clean URLs, security headers (CSP, HSTS, X-Frame-Options, etc.), a `404.html`, and it **ignores** `docs/`, markdown, `firebase-config.js` caching exception, and the `CNAME` file.

---

## 9. Custom domain & DNS migration (GitHub Pages → Firebase Hosting)

The domain `dum360.com` currently points at **GitHub Pages** (that's what the `CNAME` file is for). To move it to Firebase:

1. **Console → Hosting → Add custom domain → `dum360.com`** (add `www.dum360.com` too, redirect www→apex or vice-versa as you prefer).
2. Firebase gives you DNS records to set at your **domain registrar / DNS provider** (the place that controls dum360.com DNS — *not* GitHub):
   - For the apex `dum360.com`: usually **two A records** to Firebase's IPs (Firebase shows the exact IPs), **replacing** the GitHub Pages A records (185.199.108–111.153).
   - A **TXT record** for domain verification (temporary).
   - For `www`: a **CNAME** to `<project>.web.app` (or the apex), replacing any GitHub `www` CNAME.
3. Wait for verification + SSL provisioning (Firebase auto-issues a cert; can take up to ~24h, usually much less).
4. Confirm `https://dum360.com` serves the Firebase site (check the response headers — you should see our CSP/HSTS headers).

### What to do with the `CNAME` file
- The repo-root `CNAME` file is a **GitHub Pages** mechanism (it tells GH Pages which custom domain to serve). Firebase Hosting ignores it (and `firebase.json` already excludes it from the deploy).
- **Recommended:** disable GitHub Pages for this repo (Repo → Settings → Pages → set Source to None) once DNS points at Firebase, to avoid two hosts fighting over the domain. You may then **delete the `CNAME` file** (it's harmless if left, since it's excluded from the Firebase deploy, but it's cleanest to remove it after the cutover).
- Do the DNS change during a low-traffic window; keep the old GitHub Pages DNS noted in case you need to roll back quickly.

---

## 10. Replace remaining placeholders before launch

- [ ] `firebase-config.js` → real `FIREBASE_CONFIG` + `APP_CHECK_SITE_KEY`
- [ ] `.firebaserc` → real project id
- [ ] **Privacy Policy & Terms**: inject the General-Counsel-approved copy from `docs/website/legal/` into `privacy.html` and `terms.html`, replacing the "Legal content pending" blocks. (Blocker for collecting real emails.)
- [ ] The "honest benchmark" link in `index.html` (`[data-benchmark]`, currently `https://github.com/`) → a real public benchmark/`/honesty` URL.
- [ ] `og:image` (`/og-image.png`) — add a real share image (referenced in `<head>`).
- [ ] Email addresses (`hello@dum360.com`, `privacy@dum360.com`) — make sure they route somewhere.

---

## Phased follow-ups (not required for v1 launch)

- **Phase 2:** Cloud Function for server-side validation, rate-limiting, dedupe, and a BD notification email on new signups; GitHub Action (`firebase-hosting-merge`) for auto-deploy + PR preview channels; GA4 + consent banner.
- **Phase 3:** Finish the contributor portal (`portal.html`) — claim the user's `signups` doc(s) by verified email, render real details, wire edit/withdraw. Rules already enforce per-`uid` isolation and owner delete.
