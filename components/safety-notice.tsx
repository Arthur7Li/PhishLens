/**
 * @file components/safety-notice.tsx
 *
 * Persistent educational, privacy, and non-verdict notice. Its wording is
 * intentionally preserved; the product-site shell changes presentation only.
 */

/** Renders the core local-analysis and optional-consent boundaries near the analyzer. */
export function SafetyNotice() {
  return (
    <aside className="safety-notice" aria-labelledby="safety-notice-heading">
      <div className="safety-notice-heading">
        <div>
          <p className="eyebrow">Educational triage, not a verdict</p>
          <h2 id="safety-notice-heading">Use the evidence to decide what to verify next.</h2>
        </div>
        <p>PhishLens highlights observable cues. It does not determine that any email is safe or malicious.</p>
      </div>
      <div className="safety-notice-grid">
        <p><span>Always local</span> deterministic analysis stays in your browser and never fetches links, processes attachments, or connects to email.</p>
        <p><span>Only with consent</span> the optional AI explanation sends submitted content and server-recomputed findings to Groq. PhishLens does not store content or send telemetry.</p>
      </div>
    </aside>
  );
}
