# PhishLens

PhishLens is an educational, evidence-first phishing triage prototype for OpenAI Build Week’s **Developer Tools** category. It helps a reader identify observable cues in an email, understand why they matter, and select a safer next step—without declaring an email safe or malicious.
Website Link: https://phish-lens-doraemon7.vercel.app/

## Current boundaries

- One Next.js, TypeScript, and Tailwind page.
- Three local, synthetic sample emails only.
- Transparent, deterministic in-browser signal engine; no model or API calls.
- No authentication, database, email integration, telemetry, persistence, URL fetching, or attachment processing.
- Nothing entered into the form leaves the browser.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validate

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Manual test path

1. Start the app and open the local URL.
2. Select **Account review request**, then choose **Analyze observable signals**. Confirm the report calls out the character substitution, urgency, credential request, and supplied URL without claiming intent.
3. Select **Overdue invoice notice**. Confirm the report identifies payment pressure and a supplied URL, while never claiming phishing is certain.
4. Select **Routine team update**. Confirm the report says no configured cues were detected and explicitly says that is not proof of safety.
5. With otherwise routine text, enter `https://harbor-studio.example/notes`. Confirm the supplied URL appears as a caution and the headline says an informational detail is available for independent verification.
6. Edit any field and verify the result clears; press Analyze again and confirm the local deterministic report appears.
7. Verify the educational, privacy, and non-definitive-verdict notices are visible before and after analysis.

## Phase B: transparent local signal engine

Phase B replaces Phase A's pre-written report mappings with a pure, typed evaluator. Each finding declares its rule ID, source field, evidence, explanation, severity, and transparent risk weight. A supplied URL is always a zero-weight caution: it is never fetched and cannot raise the report level by itself. The conservative character-substitution rule only recognizes one mapped digit inside an otherwise alphabetic sender-domain token.

The application still has no GPT/OpenAI API calls, authentication, database, persistence, email integration, telemetry, URL fetching, attachment handling, or external integrations. All entered content remains in the browser.

## Build Week development note

PhishLens was developed with Codex and GPT-5.6 for planning, project scaffolding, typed rule design, and verification. The deployed Phase B application itself does **not** send email content to OpenAI or any other external service. Judges can inspect the deterministic evaluator and unit tests directly in `lib/phishing-signal-engine.ts` and `lib/phishing-signal-engine.test.ts`.

## Build Week submission checklist

- [ ] Public repository URL (or share a private repository with the required judging addresses).
- [ ] README with setup, samples, security boundaries, and explicit Codex/GPT-5.6 contribution notes.
- [ ] Runnable deployment or equally clear local test instructions.
- [ ] Public demo video under three minutes, showing the product and explaining Codex/GPT-5.6 use.
- [ ] Codex `/feedback` session ID entered in the Devpost form.
