# Incident Response Playbook — gabrieltoth.com

## 1. Overview & Classification

This document details procedures for identifying, triaging, mitigating, and resolving operational incidents.

| Severity | Definition | Response Target | Example |
|----------|------------|-----------------|---------|
| **P1 - Critical** | Full site outage, data breach, API failure affecting authentication/payments | < 15 mins | Database down, SSL expired, payment webhook crash |
| **P2 - High** | Feature degraded (e.g. video upload failing, social publisher error) | < 1 hour | Meta API quota hit, YouTube OAuth token invalid |
| **P3 - Medium** | Minor visual glitch, non-critical localized bug | < 24 hours | Broken link, translation missing in non-default locale |
| **P4 - Low** | Cosmetical issue, minor documentation typo | Next sprint | Typo in footer, alignment offset |

---

## 2. Immediate Triage & Escalation Step-by-Step

1. **Detection**: Alert triggered via Discord Webhook or Vercel Runtime Log error spike.
2. **Status Check**:
   - Check Vercel deployment status: `https://vercel.com/dashboard`
   - Check Supabase project status: `https://supabase.com/dashboard`
3. **Mitigation**:
   - For bad deployments: Trigger Vercel Rollback to previous deployment.
   - For database connection issues: Verify connection pool settings in Supabase.
   - For rate limit spikes: Enable strict IP ban via Firewall middleware.

---

## 3. Post-Incident Review

- Conduct root cause analysis (RCA) within 48 hours.
- Document prevention steps and file GitHub Issue for long-term fix.
