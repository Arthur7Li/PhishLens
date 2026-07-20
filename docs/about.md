## About the project

# PhishLens: making suspicious emails show their cards

Most phishing emails do not arrive wearing a villain costume. They arrive sounding almost reasonable: a locked account, an overdue invoice, a request from “IT,” or a message engineered to make one bad decision feel urgent.

That is what inspired **PhishLens**.

The project began with a simple question: *What if an email-triage tool did not rush to declare a message safe or malicious, but instead made its pressure tactics visible before someone clicked?* PhishLens is built around that idea. It turns pasted email content into an evidence-first local review: what the message asks for, which observable patterns deserve caution, and what a safer verification step looks like.

The goal is not to replace an enterprise email gateway, a SOC analyst, or a user’s judgment. It is to help people pause at the moment a scam is trying hardest to make them panic.

## The hard truth behind phishing

Phishing is effective partly because it exploits normal human behavior, not because users are careless. Messages create urgency, imitate trusted organizations, demand credentials or money, and frame hesitation as dangerous.

At first, the project had a much simpler ruleset. During testing, that limitation became obvious: an intentionally fictional message claiming an account sign-in, demanding account details “right now,” and threatening financial loss did not produce the local cues it should have.

That was a useful failure.

Instead of hiding it behind a more confident AI response, PhishLens was reworked around a stronger deterministic engine. The fix was not “add more scary keywords.” The challenge was to make the engine recognize combinations of evidence while remaining conservative:

- Pressure or urgency should be visible.
- Requests for credentials, account details, MFA/recovery codes, or sensitive information should be visible.
- Payment, invoice, wire-transfer, gift-card, crypto, and financial-loss pressure should be visible.
- Sender and URL characteristics can be useful observations, but they cannot prove identity or maliciousness.
- A URL appearing in an email is not automatically dangerous.
- No configured cues are **not** a safety verdict.

That last point matters most. PhishLens is designed to surface reasons to verify, not manufacture certainty.

## How PhishLens works

PhishLens has two deliberately separated layers.

### 1. Local deterministic analysis

The browser analyzes the submitted sender, subject, body, and optional supplied URL using transparent, deterministic rules. It looks for configured observable signal families such as:

- Urgency, threats, and pressure language
- Credential or sensitive-information requests
- Payment and financial-pressure requests
- Account-security, reward, refund, or suspension lures
- Impersonation language when paired with a relevant request
- Generic greetings combined with sensitive pressure
- Sender-domain and character-substitution cues
- URL lexical and structural cues, without opening or fetching links
- Sender/URL domain mismatches where a conservative comparison is possible
- Risky attachment filenames or extensions when they appear in pasted text

The output keeps the reasoning inspectable. Each finding shows the relevant evidence, explains why it may warrant caution, and contributes to a local context such as informational, caution, review, or elevated.

The system also treats compound patterns carefully. For example, an urgent request for account credentials paired with a claim of financial loss deserves more attention than either phrase in isolation. At the same time, PhishLens avoids double-counting the same evidence and does not turn a local context label into a phishing verdict.

### 2. Optional AI explanation

After the local report exists, an optional explanation layer can help translate the deterministic findings into plain language. It is intentionally secondary.

The public demo remains useful without sending custom content to an AI provider. For controlled administrator use, an explicit-consent flow can send the submitted text and server-recomputed findings to a Groq-hosted `openai/gpt-oss-20b` model. The model is constrained to explain existing local findings; it cannot invent signals, override the deterministic report, or return a “safe” or “malicious” verdict.

That separation is the core design decision of PhishLens:

> **Local evidence is canonical. AI can explain it, but cannot replace it.**

## Building with Codex

PhishLens was built iteratively with **Codex and GPT-5.6** as development partners.

Codex accelerated the project at every stage: planning the Next.js architecture, refining TypeScript types, strengthening validation, designing focused tests, improving accessibility, reviewing security boundaries, and helping turn rough ideas into implementation-ready tasks. GPT-5.6 was especially valuable for reasoning through system design trade-offs: how to keep browser and server analysis equivalent, how to make an AI feature optional rather than authoritative, and how to document the difference between a useful heuristic and a real security guarantee.

The project also used Codex for adversarial thinking. The final work included testing false negatives, benign counterexamples, malformed input, Unicode and URL edge cases, signal deduplication, client/server equivalence, provider-failure behavior, and the distinction between a local demo explanation and a provider request that may have already been attempted.

The runtime AI model is **not GPT-5.6**. GPT-5.6 and Codex were used to build, test, refine, and document PhishLens; the optional runtime explanation uses Groq-hosted GPT-OSS 20B. Build Week allows runtime models other than GPT-5.6 as long as Codex and GPT-5.6 were genuinely used in the project’s development. [openai.devpost](https://openai.devpost.com/updates/45282-openai-build-week-submissions-are-open-plugin-launch)

## Security by restraint

A surprising amount of PhishLens’ work is about what it refuses to do.

It does not:

- Open, fetch, resolve, or reputation-check links
- Execute or scan attachments
- Connect to Gmail, Outlook, or any inbox
- Inspect SPF, DKIM, or DMARC authentication unless such information is explicitly available as pasted data
- Retain submitted email content
- Promise a definitive phishing verdict
- Expose the Groq API key to the browser
- Allow public custom input to trigger the live AI path

The optional live explanation is protected with server-side validation, server recomputation of local findings, strict structured output, semantic checks, origin validation, short-lived admin sessions, explicit consent, and no-store responses. The project also documents its limitations honestly: in-memory serverless rate limiting is best-effort, the administrator flow is intentionally single-user, and a pasted-text heuristic cannot replace full email-security infrastructure.

## Challenges and lessons

The hardest part was not making the interface look polished or adding an LLM button. It was resisting the temptation to make PhishLens sound more certain than it is.

A stronger product is not always the one that claims to detect everything. In security, a misleading “safe” result can be worse than no result at all. The most important lesson from building PhishLens was that helpful security tooling should make uncertainty legible:

- Show the evidence.
- Explain the limitation.
- Give a safe next step.
- Never let persuasive language masquerade as proof.

The final product became more than an email form with AI attached. It became an open-source experiment in making cybersecurity reasoning visible, testable, and a little less intimidating.

## What’s next

PhishLens is intentionally a prototype with clear boundaries, not a finished enterprise security platform. Future directions could include a carefully designed raw-header analysis mode, richer offline URL parsing, more adversarial test fixtures, accessibility feedback from real users, and optional integrations that undergo a separate privacy and threat-model review.

For now, its promise is smaller—and more honest:

> **Before an email convinces you to act, PhishLens helps you ask what it is really asking for.**
