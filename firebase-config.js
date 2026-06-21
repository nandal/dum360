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
    apiKey:            "AIzaSyD0Ba_-89nUfmxgrl21WenRUt20ikP9E4U",
    authDomain:        "dum360-com.firebaseapp.com",
    projectId:         "dum360-com",
    storageBucket:     "dum360-com.firebasestorage.app",
    messagingSenderId: "441199958635",
    appId:             "1:441199958635:web:2af917bf97ea39c020ef2e"
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
     *   - rejects with err.code === 'auth-required' if the user is not signed in,
     *   - rejects with a Firestore error otherwise.
     *
     * Google sign-in is MANDATORY (anti-spam): the doc's uid + email are forced to
     * the authenticated account so they always match the Firestore security rules.
     */
    async submitSignup(data) {
      await ensureInit();

      const user = _auth && _auth.currentUser;
      if (!user) {
        const e = new Error("Sign in with Google to continue");
        e.code = "auth-required";
        throw e;
      }

      const { doc, getDoc, setDoc, serverTimestamp } = _fs;

      // Email is bound to the verified Google account verbatim — the security rule
      // requires it to equal request.auth.token.email exactly (no case-folding).
      const email = user.email || "";

      // One signup per Google account: the doc ID IS the uid. This makes the
      // duplicate check reliable (an owner may read their own doc) and caps spam
      // at one entry per real account.
      const ref = doc(_db, SIGNUPS_COLLECTION, user.uid);
      try {
        const existing = await getDoc(ref);
        if (existing.exists()) return { duplicate: true };
      } catch (_) { /* read hiccup — proceed; setDoc is still bounded to this uid */ }

      const payload = {
        audience: data.audience || "other",
        name: data.name || user.displayName || null,
        email: email,
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
        uid: user.uid,
        userAgentHash: await hashUA(),
        createdAt: serverTimestamp()
      };
      await setDoc(ref, payload);
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

    currentUser() { return _auth ? _auth.currentUser : null; },

    /**
     * Subscribe to auth-state changes. The callback fires once with the current
     * user (or null) and again on every sign-in/sign-out — used by the page to
     * gate the form behind a mandatory Google sign-in.
     *
     * If Firebase isn't configured, the callback is invoked once with null and a
     * no-op unsubscribe is returned (the form then shows "sign-ups opening soon").
     */
    async onAuthChange(cb) {
      if (!isConfigured()) { try { cb(null); } catch (_) {} return () => {}; }
      await ensureInit();
      const { onAuthStateChanged } = _authMod;
      return onAuthStateChanged(_auth, cb);
    }
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
