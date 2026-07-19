/**
 * @file components/safety-notice.tsx
 *
 * Persistent educational disclaimer shown at the top of every session.
 *
 * `SafetyNotice` is a stateless presentational component that renders an
 * `<aside>` with two pieces of text:
 *
 * 1. **Non-verdict statement** – makes clear that PhishLens surfaces observable
 *    cues to aid the user's own judgement; it does not label any email as safe
 *    or malicious.
 * 2. **Privacy/scope statement** – reinforces Phase A's in-browser-only boundary:
 *    no network fetches, no attachment processing, no email connection, no
 *    data storage, no telemetry.
 *
 * This component has no props and no internal state. It is imported once by
 * `TriageWorkspace` and rendered above the main two-column workspace grid.
 */

export function SafetyNotice() {
  return (
    <aside className="mt-4 rounded-2xl border border-[#315272] bg-[#102940] p-4 text-sm text-[#c5d8e9]" aria-labelledby="safety-notice-heading">
      <p className="font-semibold text-[#e7f4ff]">Educational triage, not a verdict</p>
      <h2 id="safety-notice-heading" className="mt-1 text-base font-semibold text-[#e7f4ff]">Use the evidence to decide what to verify next.</h2>
      <p className="mt-1 leading-6">PhishLens highlights observable cues. It does not determine that any email is safe or malicious.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <p className="rounded-xl border border-[#315272] bg-[#0d2137] p-3 leading-6"><span className="font-semibold text-[#66e3c4]">Always local:</span> deterministic analysis stays in your browser and never fetches links, processes attachments, or connects to email.</p>
        <p className="rounded-xl border border-[#315272] bg-[#0d2137] p-3 leading-6"><span className="font-semibold text-[#ffd080]">Only with consent:</span> the optional AI explanation sends submitted content and server-recomputed findings to Groq. PhishLens does not store content or send telemetry.</p>
      </div>
    </aside>
  );
}
