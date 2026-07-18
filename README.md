# PhishLens

PhishLens is an educational, evidence-first phishing triage prototype for OpenAI Build Week’s **Developer Tools** category. It helps a reader identify observable cues in an email, understand why they matter, and select a safer next step—without declaring an email safe or malicious.
Website Link: https://phish-lens-doraemon7.vercel.app/

## Phase A boundaries

- One Next.js, TypeScript, and Tailwind page.
- Three local, synthetic sample emails only.
- Deterministic in-browser mock analysis; no model or API call in Phase A.
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
npm run build
```

## Manual test path

1. Start the app and open the local URL.
2. Select **Account review request**, then choose **Analyze observable signals**. Confirm the report calls out the look-alike domain, urgency, and credential request.
3. Select **Overdue invoice notice**. Confirm the report identifies payment pressure and a supplied link, while never claiming phishing is certain.
4. Select **Routine team update**. Confirm the report says few obvious pressure cues appear and explicitly says that is not proof of safety.
5. Edit any field and verify the result clears; press Analyze again and confirm the Phase A local-demo report appears.
6. Verify the educational, privacy, and non-definitive-verdict notices are visible before and after analysis.

## Phase B direction

Phase B can add a server-only OpenAI call with a strict typed response contract. It must retain the present safety boundaries: email text is untrusted data; no URL fetches, attachments, external tools, email storage, or absolute safety/maliciousness verdicts.

## Build Week submission checklist

- [ ] Public repository URL (or share a private repository with the required judging addresses).
- [ ] README with setup, samples, security boundaries, and explicit Codex/GPT-5.6 contribution notes.
- [ ] Runnable deployment or equally clear local test instructions.
- [ ] Public demo video under three minutes, showing the product and explaining Codex/GPT-5.6 use.
- [ ] Codex `/feedback` session ID entered in the Devpost form.
