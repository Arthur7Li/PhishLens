/**
 * @file components/analysis-report.tsx
 *
 * Display component that renders a completed `Analysis` as a structured report.
 *
 * The component has two rendering modes:
 *
 * **Empty state** (`analysis === null`)
 *   Renders a dashed placeholder card with a short prompt, shown before the user
 *   has clicked "Analyze observable signals" for the first time.
 *
 * **Report state** (`analysis !== null`)
 *   Renders the full structured report in four sections:
 *   1. **Headline & summary** – a one-sentence verdict-free headline and a prose
 *      paragraph summarising the observable cues.
 *   2. **Signal cards** – one `<article>` per `Signal` in `analysis.signals`.
 *      Each card shows the signal title, a colour-coded severity badge, an
 *      indented evidence quote, and an educational explanation.
 *   3. **Safe next steps** – a numbered ordered list of `analysis.nextSteps`
 *      actions the user can take without following links or opening attachments.
 *   4. **Why this matters** – `analysis.learningNote`, a short educational takeaway
 *      displayed in a tinted callout box alongside the numbered steps.
 *
 * Signal severity is mapped to display strings and Tailwind colour classes via
 * the `labels` and `colors` lookup tables:
 *   - `caution`  → "Worth noting"     (blue tones)
 *   - `review`   → "Review carefully" (amber tones)
 *   - `elevated` → "Higher concern"   (red tones)
 *
 * The `<section>` uses `aria-live="polite"` so screen readers announce the report
 * when it appears after the user clicks "Analyze".
 *
 * Props
 * ─────
 * @prop analysis – the `Analysis` object to render, or `null` for the empty state
 */

import type { Analysis, SignalLevel } from "@/lib/schemas";

const labels: Record<SignalLevel, string> = { caution: "Worth noting", review: "Review carefully", elevated: "Higher concern" };
const colors: Record<SignalLevel, string> = { caution: "border-[#4a7592] text-[#b6dff2]", review: "border-[#a47b40] text-[#ffd080]", elevated: "border-[#a55c5c] text-[#ffadad]" };

export function AnalysisReport({ analysis }: { analysis: Analysis | null }) {
  if (!analysis) {
    return <section className="flex min-h-96 items-center justify-center rounded-3xl border border-dashed border-[#315272] bg-[#0b1829]/70 p-8 text-center"><div><p className="text-lg font-semibold text-[#d7e9f9]">Your evidence-first report will appear here.</p><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#89a6bf]">Select one of the three local examples, or enter an email without opening its link or attachment.</p></div></section>;
  }

  return (
    <section aria-live="polite" className="rounded-3xl border border-[#27405f] bg-[#0d1b2e]/90 p-5 shadow-2xl shadow-black/20 sm:p-7">
      <p className="text-sm font-semibold tracking-[0.18em] text-[#66e3c4] uppercase">Triage report</p>
      <h2 className="mt-2 text-2xl font-semibold text-white">{analysis.headline}</h2>
      <p className="mt-3 leading-7 text-[#b6cadb]">{analysis.summary}</p>

      <div className="mt-7 space-y-3">
        {analysis.signals.map((signal) => (
          <article key={signal.title} className="rounded-2xl border border-[#294663] bg-[#0a192a] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-[#eff8ff]">{signal.title}</h3><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${colors[signal.level]}`}>{labels[signal.level]}</span></div>
            <p className="mt-3 rounded-lg bg-[#102740] p-3 text-sm italic leading-6 text-[#d2e5f4]">Evidence: {signal.evidence}</p>
            <p className="mt-3 text-sm leading-6 text-[#a9c0d4]">{signal.explanation}</p>
          </article>
        ))}
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <div><h3 className="font-semibold text-white">Safe next steps</h3><ol className="mt-3 space-y-3">{analysis.nextSteps.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-6 text-[#c2d4e2]"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1a4651] text-xs font-bold text-[#66e3c4]">{index + 1}</span>{step}</li>)}</ol></div>
        <div className="rounded-2xl border border-[#315272] bg-[#102840] p-4"><h3 className="font-semibold text-[#eff8ff]">Why this matters</h3><p className="mt-2 text-sm leading-6 text-[#b8cde0]">{analysis.learningNote}</p></div>
      </div>
    </section>
  );
}
