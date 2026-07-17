export function SafetyNotice() {
  return (
    <aside className="rounded-2xl border border-[#315272] bg-[#102940] p-4 text-sm text-[#c5d8e9]" aria-label="Safety and privacy notice">
      <p className="font-semibold text-[#e7f4ff]">Educational triage, not a verdict</p>
      <p className="mt-1 leading-6">PhishLens highlights observable cues to help you decide what to verify next. It does not determine that any email is safe or malicious.</p>
      <p className="mt-2 leading-6 text-[#9fbed7]">Phase A stays in your browser: it does not fetch links, process attachments, connect to email, store content, or send telemetry.</p>
    </aside>
  );
}
