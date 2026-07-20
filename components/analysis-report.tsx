/**
 * @file components/analysis-report.tsx
 *
 * Presents the deterministic report as a calm learning sequence: overall local
 * context, observable evidence, why each cue matters, then a verification
 * checklist. It renders only data returned by the local evaluator.
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
    className: "tone-info",
  },
  caution: {
    label: "Caution",
    description: "A limited observable cue invites a careful pause.",
    className: "tone-caution",
  },
  review: {
    label: "Review",
    description: "Several observable cues deserve extra care.",
    className: "tone-review",
  },
  elevated: {
    label: "Elevated",
    description: "Multiple observable cues deserve extra care.",
    className: "tone-elevated",
  },
};

const levelPresentation: Record<SignalLevel, { label: string; marker: string; className: string }> = {
  caution: { label: "Caution cue", marker: "!", className: "tone-caution" },
  review: { label: "Review cue", marker: "!", className: "tone-review" },
  elevated: { label: "Elevated cue", marker: "↑", className: "tone-elevated" },
};

const sourceLabels: Record<SignalFinding["source"], string> = {
  sender: "Sender",
  subject: "Subject",
  body: "Email body",
  url: "Supplied URL",
};

/** Uses the existing zero weight to distinguish URL context without changing a rule or result. */
function getSignalPresentation(signal: SignalFinding) {
  if (signal.riskWeight === 0) {
    return {
      label: "Informational URL cue",
      marker: "i",
      description: "Does not raise overall local context.",
      className: "tone-info",
    };
  }

  return { ...levelPresentation[signal.level], description: null };
}

/** Renders an empty, local-review-in-progress, or completed deterministic report. */
export function AnalysisReport({ analysis, isAnalyzing, reportHeadingRef }: AnalysisReportProps) {
  if (!analysis && isAnalyzing) {
    return (
      <section className="workspace-panel report-placeholder report-status-panel" aria-labelledby="report-status-heading" aria-busy="true">
        <div>
          <p className="eyebrow">Local report</p>
          <h2 id="report-status-heading" className="placeholder-title">Reviewing observable cues locally…</h2>
          <p className="placeholder-copy" role="status">Your local deterministic report will remain the primary result.</p>
        </div>
      </section>
    );
  }

  if (!analysis) {
    return (
      <section className="workspace-panel report-placeholder" aria-labelledby="report-placeholder-heading">
        <div>
          <p className="eyebrow">Local report</p>
          <h2 id="report-placeholder-heading" className="placeholder-title">Start with a sample or paste an email to see a local evidence report.</h2>
          <p className="placeholder-copy">Review the message without opening its link or attachment, then use the report to choose what to verify next.</p>
        </div>
      </section>
    );
  }

  const context = contextPresentation[analysis.riskLevel];
  const findingCount = `${analysis.signals.length} observable finding${analysis.signals.length === 1 ? "" : "s"}`;

  return (
    <section className="workspace-panel report-panel" aria-labelledby="local-report-heading">
      <p className="sr-only" role="status">Local deterministic report ready. {findingCount} shown.</p>
      <div className="report-heading-row">
        <div>
          <p className="eyebrow">Local deterministic report</p>
          <h2 ref={reportHeadingRef} id="local-report-heading" tabIndex={-1} className="report-title">{analysis.headline}</h2>
        </div>
        <span className="report-primary-label">Primary evidence</span>
      </div>
      <p className="report-summary">{analysis.summary}</p>

      <div className={`report-context ${context.className}`}>
        <div>
          <p className="context-label">Overall local context</p>
          <p className="context-value">{context.label}</p>
          <p className="context-description">{context.description}</p>
        </div>
        <p className="finding-count">{findingCount}</p>
      </div>

      <div className="report-findings">
        <div className="report-section-heading">
          <div>
            <p className="section-label">Observable findings</p>
            <h3>What PhishLens observed locally</h3>
          </div>
          <p>These are local text patterns, not a verdict.</p>
        </div>
        {analysis.signals.length > 0 ? (
          <div className="signal-list">
            {analysis.signals.map((signal, index) => {
              const presentation = getSignalPresentation(signal);

              return (
                <article key={signal.id} className="signal-card">
                  <div className="signal-card-header">
                    <div>
                      <p className="signal-index">Finding {index + 1} of {analysis.signals.length}</p>
                      <h4>{signal.title}</h4>
                    </div>
                    <span className={`signal-level ${presentation.className}`}>
                      <span aria-hidden="true" className="signal-marker">{presentation.marker}</span>
                      {presentation.label}
                    </span>
                  </div>
                  {presentation.description && <p className="signal-context-note">{presentation.description}</p>}
                  <div className="evidence-block">
                    <p>Observed evidence <span>from {sourceLabels[signal.source]}</span></p>
                    <blockquote>{signal.evidence}</blockquote>
                  </div>
                  <div className="why-block">
                    <p>Why it matters</p>
                    <p>{signal.explanation}</p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="no-findings-card">
            <p>No configured observable cues are shown in this report.</p>
            <p>That absence is not a safety verdict. Use the verification checklist below whenever independent verification is appropriate.</p>
          </div>
        )}
      </div>

      <div className="report-guidance-grid">
        <div className="verification-card">
          <p className="section-label">Safer next action</p>
          <h3>Verification checklist</h3>
          <p>Use an independent route to verify the request rather than a link or contact detail supplied in the message.</p>
          <ol>
            {analysis.nextSteps.map((step, index) => (
              <li key={step}>
                <span aria-hidden="true">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <aside className="learning-note-card">
          <p className="section-label">Local learning note</p>
          <p>{analysis.learningNote}</p>
        </aside>
      </div>
    </section>
  );
}
