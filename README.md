# PhishLens

PhishLens is an educational, evidence-first phishing triage prototype for OpenAI Build Week’s **Developer Tools** category. It helps a reader identify observable cues in an email, understand why they matter, and select a safer next step—without declaring an email safe or malicious.
[Deployment URL](https://phish-lens-self.vercel.app/) · [Repository](https://github.com/Arthur7Li/PhishLens) · [Report an issue](https://github.com/Arthur7Li/PhishLens/issues) · [MIT License](LICENSE)

Before sharing the deployment URL with judges, verify that Vercel Deployment Protection permits public access.

## Current boundaries

- One Next.js, TypeScript, and Tailwind page.
- Three local synthetic sample emails plus custom pasted email text.
- Transparent, deterministic in-browser signal engine is the canonical source of observable evidence.
- An optional, separate AI explanation can be requested only after a local report exists.
- No public accounts, registration, database, email integration, telemetry, persistence, URL fetching, or attachment processing.
- Local deterministic analysis stays in the browser. Public users can request only the clearly labeled local explanation for unchanged synthetic samples; custom public input never reaches Groq.
- One project administrator may sign in with a short-lived server-only session and explicitly consent to a live Groq explanation. The server route, not the UI, enforces that boundary.

## Product-site structure

The analyzer remains immediately available at [`#analyze`](#analyze). It is followed by concise sections for **How it works**, **What PhishLens checks**, **Safety boundaries**, **About**, and open-source participation. The local deterministic report remains the primary result throughout; the optional explanation stays separate and cannot change local findings.

## Experience and accessibility

- The first-run flow makes sample selection, local evidence, and independent verification easy to follow before any optional explanation.
- Light, dark, and system appearance modes are available. An explicit visual preference is stored locally only and is non-sensitive.
- Sticky anchor navigation, the native mobile navigation control, and the theme choices are keyboard operable. A skip link, landmarks, visible focus, and a clear heading hierarchy support keyboard reading.
- Keyboard users can reach the sample selector, form controls, local report, optional explanation, and discreet administrator control with visible focus indicators.
- A validation error moves focus to the relevant form control. On narrow screens, a completed local report receives focus through its heading so the result is easy to find without changing desktop reading flow.
- Layouts are designed for 320px, 375px, 768px, and desktop widths. Long evidence and URLs wrap rather than force horizontal scrolling.
- Informational, caution, review, and elevated presentations use text labels in addition to colour across both themes. Reduced-motion preferences remove nonessential transitions and smooth scrolling.
- The deterministic local report remains primary; the optional AI explanation is visually secondary and cannot change local findings.

## Run locally

Use Node.js 20.9.0 or later and npm. The public demo is a web application deployed on Vercel; the local workflow below uses the locked dependency tree.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

For operating, securing, and continuing the project, see [docs/HANDOFF.md](docs/HANDOFF.md).

## Validate

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Manual test path

1. Start the app and open the local URL.
2. Select **Account review request**, then choose **Analyze observable signals**. Confirm the report shows account-access pressure, a credential request, a sender-domain character cue, and the supplied URL without claiming intent.
3. Select **Overdue invoice notice**. Confirm the report shows payment pressure, the supplied URL, and the explicit time-pressure/payment combination note without claiming phishing certainty.
4. Select **Routine team update**. Confirm the report says no configured cues are shown and explicitly says that absence is not a safety verdict.
5. Enter the fictional regression fields `R8C@gmail.com`, `Account security alert`, and `Unknown sign in detected to your account. Please provide your account details to lock it right now. Or your money might be lost!!!`, with no URL. Confirm the report shows time pressure, a credential or account-information request, threat/loss-pressure language, and one combined local-context note. It must not draw a conclusion about the sender or email.
6. Edit the same body to neutral support wording such as `Please provide your account details so our support team can update your mailing preferences.` Confirm it does not create the credential finding or the combined local-context note.
7. With otherwise routine text, enter `https://harbor-studio.example/notes`. Confirm the supplied URL appears as an informational URL observation and the headline says an informational observation is available for independent verification.
8. After any local report, confirm the optional explanation panel explains that local findings remain canonical. In public mode, it states that custom input never reaches Groq and live Groq explanation requires administrator access.
9. As a public visitor, use each unchanged synthetic sample and choose **Check available explanation**. Confirm the visible label says: “Demo explanation based on PhishLens’ local rules — no content was sent to Groq.”
10. As a public visitor, enter custom text, analyze it, and choose **Check available explanation**. Confirm the only explanation result says: “Live AI explanation is unavailable in this public demo. Your local deterministic report remains available.”
11. Edit any field and verify the result and any explanation clear; press Analyze again and confirm the local deterministic report appears.
12. Use Tab, Enter, and Space to select examples, move through the form, submit the analysis, and reach the optional explanation button. Confirm focus is always visible and the validation error identifies its field.
13. At 320 px, 375 px, and 768 px viewport widths, confirm there is no horizontal scrolling and controls remain readable and usable.
14. Verify the educational, privacy, and non-definitive-verdict notices are visible before and after analysis.

### Product-site checks

- Confirm Light, Dark, and System appearance modes, including persistence of an explicit visual choice.
- Confirm header anchors, the mobile navigation control, the skip link, and the Repository and Issues links are keyboard operable.
- Confirm the reduced-motion preference removes nonessential transitions and smooth scrolling.

## Deterministic analysis

The browser-local evaluator is the canonical report used by both the browser and the server route. Every finding has a stable rule ID, source field, exact pasted evidence, explanation, level, and transparent weight. The engine observes only the sender, subject, body, and optional URL that the visitor provides.

It currently covers:

- time pressure, stated consequences or loss pressure, credential/authentication requests, and financial requests; account-detail requests require an accompanying local account-compromise or financial-loss claim rather than matching neutral support wording alone;
- authority or generic-salutation language only when paired with pressure or a sensitive request;
- account restriction, refund, reward, and prize language only when paired with a request or pressure;
- a referenced high-risk file extension only when the message text asks the reader to open or download it—no attachment is opened or inspected;
- conservative sender-domain character substitutions, internationalized sender-domain formats, and clearly unreadable pasted address structure;
- URL presence as a zero-weight informational observation, plus at most one local URL-structure detail (for example user-information text, an IP host, punycode, an unusual port, HTTP, deep subdomains, or encoded host text); and
- conservative sender/supplied-URL comparable-domain differences.

The report can add one documented combination point for time pressure paired with a credential or financial request, including a distinct loss-pressure combination when it is present, or authority language paired with a sensitive request. This relationship is shown in the report rather than hidden in a score. URL presence alone remains informational and cannot raise local context by itself.

These are limited, synthetic-fixture-tested heuristics for pasted text. They do not inspect authenticated email headers, sender reputation, URL reputation or destinations, attachments, inbox history, or external context. A local observation does not establish identity, intent, or a definitive outcome.

## Phase C: optional Groq explanation

The deterministic browser-only engine remains canonical. After it creates a report, an authenticated administrator may explicitly choose **Generate AI explanation**. Public visitors can receive only the local demo explanation for an unchanged synthetic sample; public custom input never reaches Groq. The server revalidates bounded submitted fields and recomputes deterministic findings instead of accepting findings from the browser, then may send those fields and canonical findings to Groq only for an authenticated administrator.

The optional runtime AI explanation uses the free Groq developer API and the open-weight `openai/gpt-oss-20b` model. It is educational only: it is constrained to explain the server-computed signals, cannot add or override findings, and must never declare an email safe or malicious. Responses use Groq strict JSON Schema structured output, then receive Zod and semantic validation on the server before returning to the browser.

### Privacy and security boundaries

- `GROQ_API_KEY` is read only in the server-only Groq module. It is never sent to the browser, printed, committed, or logged.
- Sender, subject, body, URL, and all text within them are hostile, untrusted data. The prompt serializes them inside explicit untrusted-data boundaries and instructs the model to ignore all instructions found there.
- The route limits raw request bodies to 10,000 characters and caps sender, subject, body, and URL fields before a provider call.
- The application does not fetch or visit supplied URLs, execute attachments, connect to inboxes, store submissions, log email content, or add analytics.
- Every optional-route response includes `Cache-Control: no-store`.
- Only before a provider attempt can begin—during public mode, when the key is unavailable, or when the local demo capacity guard rejects an administrator request—can an unchanged synthetic sample receive a visibly labeled local static explanation. Custom text receives no fallback content, only the unavailable message.
- After any Groq provider attempt, including an upstream rate limit, timeout, malformed response, or validation failure, the app returns only the generic unavailable message. It never labels that state as “no content was sent to Groq.”

### Public-demo rate limits

The live route applies a best-effort in-memory limiter: per runtime instance, per IP it permits 2 requests per minute and 10 requests per UTC day; per runtime instance it permits 50 live requests per UTC day across the demo. This state is not persistent or shared across Vercel instances, so it is not a globally durable limiter. Static local fallbacks do not consume live-provider allowances.

## Phase D: demo readiness and accessibility

Phase D adds a compact first-run workflow, clearer local-report hierarchy, visible local-versus-optional-AI boundaries, keyboard-friendly sample selection and form submission, field-associated validation errors, loading status, and responsive touch targets. It does not change the deterministic signal engine, the optional-consent boundary, or any no-fetch/no-storage restrictions.

## Phase E: single-admin live explanation access

Public visitors always retain browser-only deterministic analysis. They can receive the local static explanation only for an unchanged synthetic sample; custom public input returns the unavailable message and never reaches Groq. A discreet **Admin access** control lets the one project administrator sign in before explicitly requesting a live Groq explanation for valid custom content.

The server uses `jose` to issue an eight-hour signed session cookie with `HttpOnly`, `SameSite=Strict`, `Path=/`, and `Secure` in production. Login compares the password only on the server with a timing-safe comparison and uses a best-effort in-memory limit of five failed attempts per IP per 15 minutes. Login, logout, and the explanation route accept same-origin `POST` requests only. Sessions, login-attempt counters, submissions, and explanations are never persisted.

The explanation route processes requests in this order: same-origin check; bounded-input validation and local-report recomputation; signed-session validation; public fallback or unavailable response for a non-admin; then, only for an admin, provider configuration and local capacity checks before a possible Groq call. After any provider attempt, errors return only the generic unavailable message, never a label claiming no content was sent.

### Configure Groq safely

1. Create an API key in the [Groq Console](https://console.groq.com/keys) and copy it directly into a password manager. Do not put the key in a prompt, issue, commit, screenshot, or client-side variable.
2. For local development, create the ignored `.env.local` file from `.env.example`. Add the Groq key, administrator password, and session-signing secret only to that local file. Never commit `.env.local`.
3. In Vercel, open the project settings and add the three names in `.env.example` with their real secret values. Select **Production** only, save each entry, and redeploy the production deployment. Do not use a `NEXT_PUBLIC_` prefix or put any value in source control.

## Open source

PhishLens is an open-source, security-sensitive educational prototype for transparent email triage. It is not a company or enterprise security product. Review the [source code](https://github.com/Arthur7Li/PhishLens), [report a problem](https://github.com/Arthur7Li/PhishLens/issues), read the [MIT License](LICENSE), or open a focused contribution that preserves its deterministic-first, privacy, and security boundaries. See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup and contribution guidance.

## Build Week development note

Codex with GPT-5.6 was used to build and test the project. The optional runtime AI explanation uses the free Groq developer API and the open-weight `openai/gpt-oss-20b` model. The deterministic browser-only engine remains canonical. Judges can inspect the deterministic evaluator and tests directly in `lib/`.

## Build Week submission checklist

- [ ] Public repository URL (or share a private repository with the required judging addresses).
- [ ] MIT License present in the repository root.
- [ ] README with setup, samples, security boundaries, and explicit Codex/GPT-5.6 contribution notes.
- [ ] Runnable deployment or equally clear local test instructions.
- [ ] Public demo video under three minutes, showing the product and explaining Codex/GPT-5.6 use.
- [ ] Codex `/feedback` session ID entered in the Devpost form.
