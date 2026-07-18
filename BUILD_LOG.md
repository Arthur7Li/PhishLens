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
- - Used Codex to implement the typed evaluator, generate the Vitest test plan,
  preserve the existing UI contract, and run lint, typecheck, test, and build verification.
