/**
 * @file components/safety-notice.tsx
 *
 * Persistent educational, privacy, and non-verdict notice. This component's
 * wording is intentionally preserved; the refinement only improves its visual
 * hierarchy and responsive density.
 */

export function SafetyNotice() {
  return (
    <aside className="mt-4 rounded-2xl border border-[#315272] bg-[#102940] p-4 text-sm text-[#c5d8e9] sm:p-5" aria-labelledby="safety-notice-heading">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <p className="font-semibold text-[#e7f4ff]">Educational triage, not a verdict</p>
        <h2 id="safety-notice-heading" className="text-base font-semibold text-[#e7f4ff]">Use the evidence to decide what to verify next.</h2>
      </div>
      <p className="mt-2 leading-6">PhishLens highlights observable cues. It does not determine that any email is safe or malicious.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <p className="rounded-xl border border-[#315272] bg-[#0d2137] p-3 leading-6"><span className="font-semibold text-[#66e3c4]">Always local:</span> deterministic analysis stays in your browser and never fetches links, processes attachments, or connects to email.</p>
        <p className="rounded-xl border border-[#315272] bg-[#0d2137] p-3 leading-6"><span className="font-semibold text-[#ffd080]">Only with consent:</span> the optional AI explanation sends submitted content and server-recomputed findings to Groq. PhishLens does not store content or send telemetry.</p>
      </div>
    </aside>
  );
}
