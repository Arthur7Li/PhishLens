# Contributing to PhishLens

Focused, reviewable contributions are welcome to this security-sensitive educational prototype.

## Local setup

```bash
npm ci
npm run dev
```

Use [`.env.example`](.env.example) only to learn the required variable names. Create your own ignored `.env.local` when needed; never commit `.env.local`, credentials, API keys, or session secrets.

## Verify your change

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Issues and pull requests

Use the [Issues page](https://github.com/Arthur7Li/PhishLens/issues) for bugs or scoped proposals. Keep pull requests focused and explain user-visible behavior, test coverage, and any accessibility effect. Do not include submitted email content, credentials, API keys, or screenshots containing secrets.

## Preserve PhishLens boundaries

- Local deterministic analysis is canonical.
- An optional AI explanation must not override local findings.
- When changing a deterministic rule, add synthetic positive, routine counterexample, malformed-input, and shared browser/server-contract coverage; update the public rule documentation in the same change.
- Do not add URL fetching, attachment handling, inbox access, retention, telemetry, public accounts, external integrations, or definitive safe/malicious claims without an explicitly approved redesign.
- Preserve public-versus-admin Groq behavior and all consent, privacy, and server authorization boundaries.
