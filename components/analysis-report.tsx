/**
 * @file components/analysis-report.tsx
 *
 * Presents the existing deterministic report as a calm learning sequence:
 * overall local context, observable evidence, why each cue matters, then a
 * verification checklist. It only renders data already returned by the local
 * evaluator and makes no new inference.
 */

import type { RefObject } from "react";
import type { Analysis, AnalysisRiskLevel, SignalFinding, SignalLevel } from "@/lib/schemas";

type AnalysisReportProps = {
  analysis: Analysis | null;
  isAnalyzing: boolean;
  reportHeadingRef: RefObject<HTMLHeadingElement | null>;
};

const contextPresentation: Record<AnalysisRiskLevel, { label: string; description: string; className: string }> = {
  informational: {
    label: "Informational",
    description: "Local details for independent verification.",
    className: "border-[#4a7592] bg-[#102840] text-[#b6dff2]",
  },
  caution: {
    label: "Caution",
    description: "A limited observable cue invites a careful pause.",
    className: "border-[#4a7592] bg-[#102840] text-[#b6dff2]",
  },
  review: {
    label: "Review",
    description: "Several observable cues deserve extra care.",
    className: "border-[#a47b40] bg-[#342817] text-[#ffd080]",
  },
  elevated: {
    label: "Elevated",
    description: "Multiple observable cues deserve extra care.",
    className: "border-[#a55c5c] bg-[#351f25] text-[#ffadad]",
  },
};

const levelPresentation: Record<SignalLevel, { label: string; marker: string; className: string }> = {
  caution: { label: "Caution cue", marker: "!", className: "border-[#4a7592] bg-[#102840] text-[#b6dff2]" },
  review: { label: "Review cue", marker: "!", className: "border-[#a47b40] bg-[#342817] text-[#ffd080]" },
  elevated: { label: "Elevated cue", marker: "↑", className: "border-[#a55c5c] bg-[#351f25] text-[#ffadad]" },
};

/** Uses the existing zero weight to distinguish URL context without changing a rule or its result. */
function getSignalPresentation(signal: SignalFinding) {
  if (signal.riskWeight === 0) {
    return {
      label: "Informational URL cue",
      marker: "i",
      description: "Does not raise overall local context.",
      className: "border-[#4a7592] bg-[#102840] text-[#b6dff2]",
    };
  }

  return { ...levelPresentation[signal.level], description: null };
}

/** Renders an empty, local-review-in-progress, or completed deterministic report. */
export function AnalysisReport({ analysis, isAnalyzing, reportHeadingRef }: AnalysisReportProps) {
  if (!analysis && isAnalyzing) {
    return (
      <section className="flex min-h-64 items-center justify-center rounded-3xl border border-[#315272] bg-[#0b1829]/70 p-8 text-center" aria-labelledby="report-status-heading" aria-busy="true">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-[#66e3c4] uppercase">Local report</p>
          <h2 id="report-status-heading" className="mt-2 text-lg font-semibold text-[#d7e9f9]">Reviewing observable cues locally…</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#89a6bf]" role="status">Your local deterministic report will remain the primary result.</p>
        </div>
      </section>
    );
  }

  if (!analysis) {
    return (
      <section className="flex min-h-64 items-center justify-center rounded-3xl border border-dashed border-[#315272] bg-[#0b1829]/70 p-8 text-center sm:min-h-80" aria-labelledby="report-placeholder-heading">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-[#66e3c4] uppercase">Local report</p>
          <h2 id="report-placeholder-heading" className="mt-2 text-lg font-semibold text-[#d7e9f9]">Start with a sample or paste an email to see a local evidence report.</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#89a6bf]">Review the message without opening its link or attachment, then use the report to choose what to verify next.</p>
        </div>
      </section>
    );
  }

  const context = contextPresentation[analysis.riskLevel];
  const findingCount = `${analysis.signals.length} observable finding${analysis.signals.length === 1 ? "" : "s"}`;

  return (
    <section className="rounded-3xl border border-[#27405f] bg-[#0d1b2e]/90 p-5 shadow-2xl shadow-black/20 sm:p-7" aria-labelledby="local-report-heading">
      <p className="sr-only" role="status">Local deterministic report ready. {findingCount} shown.</p>
      <p className="text-sm font-semibold tracking-[0.18em] text-[#66e3c4] uppercase">Local deterministic report</p>
      <h2 ref={reportHeadingRef} id="local-report-heading" tabIndex={-1} className="mt-2 text-2xl font-semibold text-white focus:outline-none focus:ring-4 focus:ring-[#66e3c4]/30">{analysis.headline}</h2>
      <p className="mt-3 leading-7 text-[#b6cadb]">{analysis.summary}</p>

      <div className={`mt-5 flex flex-col justify-between gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center ${context.className}`}>
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] uppercase">Overall local context</p>
          <p className="mt-1 text-lg font-semibold">{context.label}</p>
          <p className="mt-1 text-sm leading-6">{context.description}</p>
        </div>
        <p className="rounded-full border border-current/40 px-3 py-1.5 text-sm font-semibold">{findingCount}</p>
      </div>

      <div className="mt-7">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-semibold text-white">What PhishLens observed locally</h3>
          <p className="text-sm text-[#89a6bf]">These are local text patterns, not a verdict.</p>
        </div>
        {analysis.signals.length > 0 ? (
          <div className="mt-3 space-y-3">
            {analysis.signals.map((signal, index) => {
              const presentation = getSignalPresentation(signal);

              return (
                <article key={signal.id} className="rounded-2xl border border-[#294663] bg-[#0a192a] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.14em] text-[#9ec6de] uppercase">Finding {index + 1} of {analysis.signals.length}</p>
                      <h4 className="mt-1 font-semibold text-[#eff8ff]">{signal.title}</h4>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${presentation.className}`}>
                      <span aria-hidden="true" className="grid h-4 w-4 place-items-center rounded-full border border-current/50 text-[0.65rem] leading-none">{presentation.marker}</span>
                      {presentation.label}
                    </span>
                  </div>
                  {presentation.description && <p className="mt-3 text-sm font-medium leading-6 text-[#9ec6de]">{presentation.description}</p>}
                  <div className="mt-3 rounded-xl border border-[#294663] bg-[#102740] p-3">
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#9ec6de] uppercase">Observed evidence</p>
                    <blockquote className="mt-1 break-words text-sm italic leading-6 text-[#d2e5f4] [overflow-wrap:anywhere]">{signal.evidence}</blockquote>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#9ec6de] uppercase">Why it matters</p>
                    <p className="mt-1 break-words text-sm leading-6 text-[#a9c0d4] [overflow-wrap:anywhere]">{signal.explanation}</p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-[#315272] bg-[#102840] p-4">
            <p className="font-semibold text-[#eff8ff]">No configured observable cues are shown in this report.</p>
            <p className="mt-1 text-sm leading-6 text-[#b8cde0]">That absence is not a safety verdict. Use the verification checklist below whenever independent verification is appropriate.</p>
          </div>
        )}
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="rounded-2xl border border-[#294663] bg-[#0a192a] p-4">
          <h3 className="font-semibold text-white">Verification checklist</h3>
          <p className="mt-1 text-sm leading-6 text-[#9bb0c5]">Use an independent route to verify the request rather than a link or contact detail supplied in the message.</p>
          <ol className="mt-4 space-y-3">
            {analysis.nextSteps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-6 text-[#c2d4e2]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#2b6d6c] bg-[#1a4651] text-xs font-bold text-[#66e3c4]">{index + 1}</span>
                <span className="break-words [overflow-wrap:anywhere]">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-2xl border border-[#315272] bg-[#102840] p-4"><h3 className="font-semibold text-[#eff8ff]">Local learning note</h3><p className="mt-2 text-sm leading-6 text-[#b8cde0]">{analysis.learningNote}</p></div>
      </div>
    </section>
  );
}
