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
- Added visibly labeled local static explanations for the three unchanged synthetic samples when live generation is unavailable or capped; custom text receives only the unavailable notice in that state.
- Kept the no-URL-fetch, no-attachment-processing, no-storage, no-logging, no-authentication, no-analytics, and no-email-integration boundaries.
- Codex with GPT-5.6 was used to build and test the project. The optional runtime AI explanation uses the free Groq developer API and the open-weight `openai/gpt-oss-20b` model. The deterministic browser-only engine remains canonical.
