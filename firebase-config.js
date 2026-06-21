/* =============================================================================
 * DUM360 — Firebase web config + signup bridge (modular SDK via CDN)
 * -----------------------------------------------------------------------------
 * The page works WITHOUT this being configured: if the placeholder values below
 * are not filled in, the sign-up form shows a friendly "signups opening soon"
 * message and Google sign-in degrades gracefully. Nothing throws.
 *
 * Firebase web-config keys are NOT secrets (they identify the project to the
 * client), but the project itself MUST be created by you. See docs/website/DEPLOY.md.
 *
 *   TODO (you must do this — see DEPLOY.md):
 *     1. Create a Firebase project + Firestore in asia-south1 (Mumbai).
 *     2. Register a Web app; paste its config into FIREBASE_CONFIG below.
 *     3. Enable Authentication → Google provider.
 *     4. Enable App Check (reCAPTCHA Enterprise / v3); paste the site key into
 *        APP_CHECK_SITE_KEY below.
 *     5. Deploy firestore.rules (it locks down PII reads).
 * ========================================================================== */

(function () {
  "use strict";

  /* ---- 1. PASTE YOUR FIREBASE WEB CONFIG HERE (placeholders => offline mode) ---- */
  const FIREBASE_CONFIG = {
    apiKey:            "TODO_FIREBASE_API_KEY",
    authDomain:        "TODO_PROJECT.firebaseapp.com",
    projectId:         "TODO_PROJECT",
    storageBucket:     "TODO_PROJECT.appspot.com",
    messagingSenderId: "TODO_SENDER_ID",
    appId:             "TODO_APP_ID"
    // measurementId: "TODO_MEASUREMENT_ID"  // optional (GA4)
  };

  /* ---- 2. PASTE YOUR APP CHECK reCAPTCHA SITE KEY HERE (bot protection) ---- */
  const APP_CHECK_SITE_KEY = "TODO_APP_CHECK_RECAPTCHA_SITE_KEY";

  const SIGNUPS_COLLECTION = "signups";
  const FB_VERSION = "10.12.2"; // Firebase JS SDK (modular, CDN)

  /* ---- Detect whether config is real ---- */
  function isConfigured() {
    return FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.projectId.indexOf("TODO") === -1;
  }

  // Lazily-loaded SDK handles
  let _app = null, _db = null, _auth = null, _fs = null, _authMod = null, _initPromise = null;

  async function ensureInit() {
    if (!isConfigured()) {
      const e = new Error("Firebase not configured");
      e.code = "not-configured";
      throw e;
    }
    if (_initPromise) return _initPromise;
    _initPromise = (async () => {
      const appMod = await import(`https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-app.js`);
      _app = appMod.initializeApp(FIREBASE_CONFIG);

      // App Check (bot protection) — only if a real site key is present
      if (APP_CHECK_SITE_KEY && APP_CHECK_SITE_KEY.indexOf("TODO") === -1) {
        try {
          const ac = await import(`https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-app-check.js`);
          ac.initializeAppCheck(_app, {
            provider: new ac.ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY),
            isTokenAutoRefreshEnabled: true
          });
        } catch (err) {
          console.warn("[DUM360] App Check init failed (continuing):", err);
        }
      } else {
        console.info("[DUM360] App Check not configured — set APP_CHECK_SITE_KEY in firebase-config.js for bot protection.");
      }

      _fs = await import(`https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-firestore.js`);
      _db = _fs.getFirestore(_app);

      _authMod = await import(`https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-auth.js`);
      _auth = _authMod.getAuth(_app);
      return true;
    })();
    return _initPromise;
  }

  /* ---- Public API used by index.html ---- */
  const DUM360 = {
    isConfigured,

    /**
     * Write a signup doc to Firestore. Resolves on success, or:
     *   - resolves {duplicate:true} if a doc with this email already exists (best-effort),
     *   - rejects with err.code === 'not-configured' if Firebase isn't set up,
     *   - rejects with a Firestore error otherwise.
     */
    async submitSignup(data) {
      await ensureInit();
      const {
        collection, addDoc, serverTimestamp, query, where, getDocs, limit
      } = _fs;

      // Best-effort duplicate check (rules DENY public reads of PII in production,
      // so this query may fail — we treat a failure as "not a duplicate" and proceed).
      try {
        const q = query(collection(_db, SIGNUPS_COLLECTION), where("email", "==", data.email), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) return { duplicate: true };
      } catch (_) { /* reads denied by rules in prod — ignore, proceed to create */ }

      const payload = {
        audience: data.audience || "other",
        name: data.name || null,
        email: data.email,
        organisation: data.organisation || null,
        phone: data.phone || null,
        message: data.message || null,
        // extra adaptive fields stored under `meta` to keep the top-level schema stable
        meta: {
          device: data.device || null,
          state: data.state || null,
          interest: data.interest || null,
          role: data.role || null,
          workload: data.workload || null,
          github: data.github || null
        },
        consent: data.consent === true,
        source: data.source || {},
        status: "new",
        uid: (_auth && _auth.currentUser) ? _auth.currentUser.uid : null,
        userAgentHash: await hashUA(),
        createdAt: serverTimestamp()
      };
      await addDoc(collection(_db, SIGNUPS_COLLECTION), payload);
      return { ok: true };
    },

    /** Optional Google sign-in. Returns the user, or rejects (err.code 'not-configured' if unset). */
    async signInWithGoogle() {
      await ensureInit();
      const { GoogleAuthProvider, signInWithPopup } = _authMod;
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(_auth, provider);
      return res.user;
    },

    async signOut() {
      if (!isConfigured() || !_auth) return;
      const { signOut } = _authMod;
      await signOut(_auth);
    },

    currentUser() { return _auth ? _auth.currentUser : null; }
  };

  /* Coarse, non-PII UA hash for abuse signals only. */
  async function hashUA() {
    try {
      const enc = new TextEncoder().encode(navigator.userAgent || "");
      const buf = await crypto.subtle.digest("SHA-256", enc);
      return Array.from(new Uint8Array(buf)).slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join("");
    } catch (_) { return null; }
  }

  window.DUM360 = DUM360;

  if (!isConfigured()) {
    console.info("[DUM360] Firebase is not configured yet (placeholder values in firebase-config.js). " +
      "The page renders fine; the sign-up form will show 'sign-ups opening soon'. See docs/website/DEPLOY.md.");
  }
})();
