#!/usr/bin/env bash
# =============================================================================
# DUM360 — one-shot Firebase setup & deploy
# -----------------------------------------------------------------------------
# Automates everything that CAN be scripted after you have authenticated:
#   - points the repo at your project (.firebaserc)
#   - ensures a Web app exists and writes its SDK config into firebase-config.js
#   - creates Cloud Firestore in asia-south1 (Mumbai) — sovereignty-critical
#   - deploys firestore rules + indexes + hosting
#
# PREREQUISITES (interactive — do these first, once):
#   npm install -g firebase-tools
#   firebase login            # browser sign-in with the project's Google account
#   gcloud auth login         # only needed if this script creates the Firestore DB
#
# USAGE:
#   ./scripts/setup-firebase.sh <project-id> [--create]
#     <project-id>   e.g. dum360-web   (must be globally unique, all-lowercase)
#     --create       also create the Firebase project (omit if you made it in the Console)
#
# STILL MANUAL afterwards (Console only — see docs/website/DEPLOY.md):
#   - Authentication → Google provider → Enable (for the optional portal)
#   - App Check → register reCAPTCHA → paste site key into firebase-config.js → redeploy
#   - Hosting → Add custom domain dum360.com + DNS cutover from GitHub Pages
#
# This script is best-effort automation; if any step fails, fall back to the
# step-by-step Console runbook in docs/website/DEPLOY.md.
# =============================================================================
set -euo pipefail

PROJECT_ID="${1:-}"
CREATE_FLAG="${2:-}"

if [ -z "$PROJECT_ID" ]; then
  echo "Usage: $0 <project-id> [--create]" >&2
  exit 1
fi

command -v firebase >/dev/null 2>&1 || { echo "ERROR: firebase CLI not found. Run: npm install -g firebase-tools" >&2; exit 1; }
command -v node >/dev/null 2>&1     || { echo "ERROR: node not found." >&2; exit 1; }

# Confirm we're logged in
if ! firebase login:list 2>/dev/null | grep -qiE '@'; then
  echo "ERROR: not logged in. Run: firebase login" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# ---- 1. (optional) create the project ---------------------------------------
if [ "$CREATE_FLAG" = "--create" ]; then
  echo "==> Creating Firebase project: $PROJECT_ID"
  firebase projects:create "$PROJECT_ID" --display-name "DUM360" \
    || echo "    (could not create — it may already exist; continuing)"
fi

# ---- 2. point the repo at the project ---------------------------------------
echo "==> Writing .firebaserc -> $PROJECT_ID"
printf '{\n  "projects": {\n    "default": "%s"\n  }\n}\n' "$PROJECT_ID" > .firebaserc

# ---- 3. ensure a Web app exists, then fetch its SDK config -------------------
echo "==> Ensuring a Web app exists"
HAS_WEB_APP="$(firebase apps:list --project "$PROJECT_ID" --json 2>/dev/null \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const a=(j.result||[]).find(x=>(x.platform||"").toUpperCase()==="WEB");process.stdout.write(a?"yes":"no");}catch(e){process.stdout.write("no");}})')"
if [ "$HAS_WEB_APP" != "yes" ]; then
  echo "    creating Web app 'dum360-site'"
  firebase apps:create WEB "dum360-site" --project "$PROJECT_ID"
fi

echo "==> Fetching web SDK config and writing firebase-config.js"
SDK_JSON="$(firebase apps:sdkconfig WEB --project "$PROJECT_ID" --json)"
printf '%s' "$SDK_JSON" | node -e '
let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
  const fs=require("fs");
  const j=JSON.parse(s);
  const c=(j.result&&j.result.sdkConfig)||j.sdkConfig;
  if(!c||!c.projectId){console.error("Could not parse SDK config from CLI output");process.exit(1);}
  let f=fs.readFileSync("firebase-config.js","utf8");
  const set=(k,v)=>{ if(v==null) return; f=f.replace(new RegExp("("+k+":\\s*)\"[^\"]*\""), "$1"+JSON.stringify(v)); };
  set("apiKey",c.apiKey); set("authDomain",c.authDomain); set("projectId",c.projectId);
  set("storageBucket",c.storageBucket); set("messagingSenderId",c.messagingSenderId); set("appId",c.appId);
  fs.writeFileSync("firebase-config.js",f);
  console.log("    firebase-config.js updated for project:",c.projectId);
});
'

# ---- 4. create Firestore in asia-south1 (Mumbai) — PERMANENT region ----------
echo "==> Creating Cloud Firestore (default) in asia-south1 (Mumbai)"
if command -v gcloud >/dev/null 2>&1; then
  gcloud firestore databases create --location=asia-south1 --project "$PROJECT_ID" 2>/dev/null \
    || echo "    (Firestore DB may already exist, or gcloud not authed — verify region is asia-south1 in the Console)"
else
  echo "    gcloud not found — create Firestore in the Console: Build → Firestore → location asia-south1 (Mumbai)."
  echo "    ⚠️  The region is PERMANENT. Do not pick anything else."
fi

# ---- 5. deploy rules, indexes, hosting --------------------------------------
echo "==> Deploying Firestore rules + indexes + Hosting"
firebase deploy --only firestore:rules,firestore:indexes,hosting --project "$PROJECT_ID"

cat <<EOF

============================================================
DONE. Site should be live at:
  https://$PROJECT_ID.web.app
  https://$PROJECT_ID.firebaseapp.com

STILL MANUAL (Console — see docs/website/DEPLOY.md):
  1. Authentication → Sign-in method → Google → Enable
     (add dum360.com / www.dum360.com / $PROJECT_ID.web.app to Authorized domains)
  2. App Check → register reCAPTCHA → paste the site key into
     firebase-config.js (APP_CHECK_SITE_KEY) → re-run: firebase deploy --only hosting
     → then App Check → Cloud Firestore → Enforce
  3. Hosting → Add custom domain dum360.com (+ www), set the DNS records at your
     registrar, REPLACING the GitHub Pages records; then disable GitHub Pages.
  4. Before collecting real emails: finalise the legal pages with counsel.
============================================================
EOF
