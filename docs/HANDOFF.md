# PhishLens handoff

## A. Purpose and release status

PhishLens is an open-source, security-sensitive educational prototype for transparent email triage. It identifies a small, documented set of observable text cues and suggests safer verification steps; it does not make definitive phishing or safety verdicts.

The code is release-candidate ready after the final audit. Before a public Build Week submission, the operator must make the Vercel deployment publicly reachable, choose a repository license, and complete the required Devpost submission details.

## B. Architecture and data flow

### Browser deterministic path

The analyzer in `components/triage-workspace.tsx` uses `lib/phishing-signal-engine.ts` and `lib/signal-rules.ts` in the browser. It evaluates only text the visitor entered or selected, produces the canonical local report, and does not send that local analysis to a provider, fetch URLs, inspect attachments, connect to an inbox, persist input, or make a definitive verdict.

### Public demo fallback path

After a local report, a public visitor may explicitly choose **Check available explanation**. The app route validates bounded fields and recomputes the local findings server-side, then stops before checking Groq configuration or making a provider call. An unchanged synthetic sample can receive the visibly labeled local demo explanation: “Demo explanation based on PhishLens’ local rules — no content was sent to Groq.” Custom or edited public input receives only the unavailable message.

### Admin-authenticated live Groq path

After an administrator signs in, every live request still requires a fresh **Generate AI explanation** consent action. The route checks same-origin POST, validates bounded input, recomputes canonical local findings, verifies the signed session, then checks provider configuration and the local capacity guard. Only then may it send the submitted fields and server-computed findings to Groq. The optional explanation uses `openai/gpt-oss-20b`, is validated with strict JSON Schema plus Zod and semantic checks, and cannot replace the local report. Any provider-attempt failure returns only the generic unavailable message.

## C. Module map

| Area | Ownership |
| --- | --- |
| `app/page.tsx`, `components/` | Single-page presentation, local-analysis interaction, source labels, themes, accessibility, and the discreet admin control. |
| `app/api/ai-explanation/route.ts` | Same-origin opt-in explanation route, authoritative server recomputation, public fallback, admin gate, no-store responses, and provider failure truthfulness. |
| `app/api/admin/login/route.ts`, `app/api/admin/logout/route.ts` | Single-admin sign-in/sign-out routes and session cookie lifecycle. |
| `lib/signal-rules.ts`, `lib/phishing-signal-engine.ts`, `lib/schemas.ts` | Canonical browser/server deterministic rules, report types, and input contracts. |
| `lib/ai-explanation-*.ts`, `lib/groq-explanation.server.ts` | Prompt boundary, schema/semantic validation, static fallback, and server-only Groq client. |
| `lib/admin-*.server.ts`, `lib/request-origin.server.ts`, `lib/demo-rate-limit.server.ts` | Session handling, login guard, origin verification, and best-effort in-memory limits. |
| `*.test.ts`, `app/api/ai-explanation/route.test.ts` | No-network Vitest coverage for rules, fallbacks, prompt/schema validation, session helpers, limits, origin checks, and route behavior. |
| `README.md`, `CONTRIBUTING.md`, `BUILD_LOG.md`, `docs/HANDOFF.md` | Setup, contributor expectations, build history, and continuation guidance. |

## D. Local development

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

The optional administrator/live-provider path requires these environment-variable names only:

```text
GROQ_API_KEY
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
```

Use an ignored `.env.local` for local development. Never commit, log, paste, or expose a value in client code.

## E. Vercel and Groq operator checklist

1. In Vercel, add the three variables above to the required environment scope. Use **Production** for the public release; add Preview only if preview admin testing is intentionally desired.
2. Redeploy after every environment-variable change. Verify the deployment URL is accessible without Vercel Login or Deployment Protection before sharing it with judges.
3. Create and manage the Groq key in Groq’s console. Rotate a compromised or replaced key there, update `GROQ_API_KEY` in Vercel, and redeploy.
4. Rotate `ADMIN_PASSWORD` if administrator access is suspected to be exposed; update Vercel and redeploy.
5. Rotate `ADMIN_SESSION_SECRET` to invalidate every signed admin session. Update Vercel and redeploy; users must sign in again.
6. Test public behavior first, then test administrator sign-in, explicit consent, a live explanation, provider-unavailable behavior, and sign-out. Do not use real sensitive email content for demo testing.

## F. Security model and non-goals

- The local deterministic engine is canonical. The optional model only explains server-computed findings.
- Sender, subject, body, and URL fields are hostile input. The server bounds them, uses explicit untrusted-data boundaries in the prompt, and ignores instructions inside submitted content.
- All state-changing routes require same-origin POST. Admin cookies are signed with `jose`, `HttpOnly`, `SameSite=Strict`, `Path=/`, production `Secure`, and an eight-hour maximum age.
- The project does not fetch supplied URLs, execute attachments, inspect headers, connect to inboxes, store or log email content, add analytics, retain submissions, create public accounts, or make definitive verdicts.
- Server responses for optional explanations and authentication are non-cacheable.

## G. Known caveats and limitations

- Vercel rate limits are process-local in-memory limits, not globally durable or shared across instances.
- The administrator model is one password and one role; there is no MFA, per-user revocation, or audit trail.
- PhishLens does not inspect email headers, URLs, attachments, or inboxes.
- Its deterministic rules are intentionally small heuristics for education, not a security verdict engine.
- Groq/model availability and structured-output quality can affect the optional explanation; the local report remains available.
- Public unchanged synthetic samples can receive a static local fallback. Public custom input does not receive a substitute explanation and never reaches Groq.
- No output is a definitive determination that an email is phishing, malicious, legitimate, or safe.

## H. Safe future roadmap

### Recommended next steps

- Keep tests and documentation synchronized with every observable rule or wording change.
- Add focused accessibility regression checks and maintain the 320px, keyboard, light/dark/system, and reduced-motion manual review.
- Choose and document an open-source license before broad public reuse.

### Changes that require a threat-model or security review first

- Durable/distributed rate limiting, storage, logging, telemetry, or any retention.
- Multiple administrators, roles, MFA, revocation, password reset, or audit trails.
- New providers, model capabilities, data destinations, or changes to prompt/data-flow boundaries.
- Email-header parsing, URL analysis, link following, attachment handling, or inbox integrations.

### Intentionally out of scope

- Automated phishing verdicts or claims of safety.
- Background scanning, email delivery, payment features, tracking, or advertising.
- Public accounts or enterprise security-management claims.

## I. Regression checklist

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Then manually verify:

1. The three samples and custom text run local analysis without any AI action.
2. A public unchanged sample receives only the labeled local demo explanation; public custom input receives only the unavailable message and does not reach Groq.
3. An authenticated administrator must explicitly consent before a configured live Groq request; sign-out removes that access.
4. A simulated provider failure returns the generic unavailable message, never the “no content was sent to Groq” label.
5. Cross-origin POST attempts are rejected; the login limiter, expiry, and cookie settings continue to pass tests.
6. Keyboard skip link, form-error focus, mobile navigation, theme choices, focus indicators, reduced motion, and 320px/375px/768px layouts remain usable.

## J. Notes for a fork or maintainer

Keep secrets server-only and out of commits, logs, screenshots, and client bundles. Preserve the deterministic-first authority, server-side recomputation, explicit consent, public-versus-admin separation, and the truthfulness rule that a no-content-sent demo label is possible only before a provider attempt. Treat any change that expands data collection, authorization, external calls, or email inspection as a security design decision rather than a routine feature.
