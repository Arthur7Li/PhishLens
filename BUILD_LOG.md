# Build log

## July 16, 2026 — Phase A
- Defined PhishLens as an AI-assisted phishing-triage and education tool.
- Used Codex to scaffold the Next.js, TypeScript, and Tailwind project.
- Built the single-page email intake and static result workflow.
- Added three synthetic test emails and educational safety notices.
- Deferred all real model calls, external integrations, link fetching,
  attachment handling, and storage to keep user input isolated.
  
## July 18, 2026 — Phase B
- Replaced pre-written analysis mappings with a transparent, deterministic local signal engine.
- Added typed rules for urgency, credential requests, payment requests, conservative sender-domain character substitutions, supplied URLs, and sender-to-URL domain differences.
- Kept supplied URLs informational: they have zero risk weight, are never fetched, and cannot raise the report level alone.
- Added Vitest coverage for rule behavior, evidence, deterministic output, and the no-fetch boundary.
- Preserved the single-page UX, three synthetic samples, and all privacy and non-verdict notices.

## July 18, 2026 — Phase C
- Added a separately consented, server-side AI explanation route while preserving the browser-only deterministic report as canonical evidence.
- Integrated the official `groq-sdk` with the free Groq developer API and the open-weight `openai/gpt-oss-20b` model; no OpenAI API runtime call was added.
- Added strict provider JSON Schema output, Zod validation, canonical-signal semantic checks, bounded input fields, prompt-injection boundaries, and no-store responses.
- Added a best-effort in-memory per-instance demo limiter: 2 requests per IP per minute, 10 per IP per UTC day, and 50 live requests per UTC day across the instance. It is intentionally not globally durable across Vercel instances.
- Added visibly labeled local static explanations for the three unchanged synthetic samples before a provider call could begin; later phases further tightened fallback truthfulness. Custom text receives only the unavailable notice in that state.
- Phase C itself added no URL fetching, attachment processing, storage, logging, authentication, analytics, or email integration.
- Codex with GPT-5.6 was used to build and test the project. The optional runtime AI explanation uses the free Groq developer API and the open-weight `openai/gpt-oss-20b` model. The deterministic browser-only engine remains canonical.

## July 18, 2026 — Phase D
- Added a compact three-step orientation and clearer visual separation between local deterministic evidence and the optional Groq explanation.
- Improved deterministic finding cards, no-configured-cues messaging, safer-next-step scanability, mobile touch targets, keyboard focus, semantic form submission, sample selection state, validation associations, and loading status.
- Corrected fallback truthfulness: the local sample explanation labeled “no content was sent to Groq” is now possible only before a provider attempt, when the key is absent or the local capacity guard blocks the request. Post-attempt provider failures return only the generic unavailable message.
- Added unit coverage for the fallback-stage rule and preserved all existing privacy, no-fetch, no-storage, and non-verdict boundaries.

## July 18, 2026 â€” Phase E
- Added a deliberately narrow, server-enforced single-administrator session for optional live Groq explanations, while preserving fully local deterministic analysis for every public visitor.
- Added same-origin `POST` validation, timing-safe server-side password comparison, signed eight-hour `jose` session cookies, logout cookie clearing, and a best-effort in-memory five-failed-login-per-IP-per-15-minutes guard.
- Changed the Groq route authorization order so it validates bounded input and recomputes canonical local findings before session verification; non-admin requests return only public static-demo or unavailable behavior and never reach Groq, configuration checks, or capacity checks.
- Added a quiet footer sign-in control and kept explicit consent immediately before every administrator-initiated Groq explanation.
- Added no-network tests for the session helper, login limiter, same-origin guard, and public explanation route behavior. No public accounts, database, third-party authentication, analytics, persistence, URL fetching, or attachment processing were added.

## July 19, 2026 — Final UI/UX refinement
- Refined the first-run flow with a focused sample entry point, clearer sample selection, concise local-review status, and a calmer compact orientation sequence.
- Strengthened evidence hierarchy so the local context, observable findings, observed evidence, why-it-matters teaching, and verification checklist are easier to read in order.
- Improved keyboard focus handling for the sample entry point, validation errors, and narrow-screen report reveal; added responsive wrapping and reduced-motion support.
- Kept the optional AI panel visually secondary to the deterministic local report while clarifying public, demo, unavailable, and authenticated administrator presentation states.
- No backend, security, authorization, deterministic-analysis, Groq-behavior, rate-limit, session, environment, or privacy boundary changed.
- Codex was used to implement, review, and verify this frontend refinement.

## July 19, 2026 — Product-site and UI-system redesign

- Added a product-site shell that keeps the local analyzer immediately available while adding concise How it works, actual observable-signal, safety-boundary, about, and open-source sections.
- Added light, dark, and system appearance modes with a locally persisted, non-sensitive visual preference.
- Improved responsive layout, semantic navigation, keyboard flow, visible focus, text-plus-colour context labels, and reduced-motion handling.
- Kept the deterministic local report visually and conceptually primary; the optional AI explanation remains secondary.
- Added real repository, Issues, and contribution links with concise local contribution guidance.
- No backend route, security logic, authorization, session behavior, deterministic analysis, Groq behavior, rate limit, environment handling, privacy boundary, or data-flow logic changed.
- Codex was used to implement, review, and verify this product-site frontend refinement.
