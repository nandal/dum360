# Security Policy

## Reporting a Vulnerability

DUM360 takes security seriously. If you discover a security vulnerability, please report it responsibly.

**Do NOT open a public GitHub issue.** Instead:

1. **Email:** [hello@dum360.com](mailto:hello@dum360.com) with subject line "SECURITY: [brief description]"
2. Include:
   - A detailed description of the vulnerability
   - Steps to reproduce
   - Affected components/versions
   - Any suggested fix (if available)
3. Allow up to 72 hours for an initial response.
4. We will keep you informed of our progress and coordinate public disclosure with you.

## Scope

### In Scope
- The DUM360 website (dum360.com) and Firebase backend
- Firestore security rules and Firebase configuration
- The contributor portal (portal.html)
- Any future platform code in this repository
- Open-source dependencies used by the project

### Out of Scope
- Third-party services (Firebase, Google Cloud) — report to them directly
- Social engineering attacks
- Physical security of partner infrastructure
- Denial of service attacks

## Recognition

We maintain a Security Hall of Fame for researchers who responsibly disclose vulnerabilities. With your permission, we'll credit you publicly.

## Security Documentation

See [docs/security/README.md](docs/security/README.md) for the full security model and threat analysis.

## Supported Versions

| Version | Supported |
|---------|-----------|
| main branch (current) | ✅ |
| All earlier versions | ❌ |

We are in Phase 1 (Waitlist). Security patches are applied to the main branch only.
