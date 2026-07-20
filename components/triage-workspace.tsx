/**
 * @file components/triage-workspace.tsx
 *
 * Client-side coordinator for the single-page learning flow. It keeps the
 * deterministic report first, then presents the optional explanation only
 * after a local report exists. No email content leaves this component during
 * local analysis.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { AnalysisReport } from "@/components/analysis-report";
import { AiExplanationPanel } from "@/components/ai-explanation-panel";
import { EmailTriageForm } from "@/components/email-triage-form";
import { SafetyNotice } from "@/components/safety-notice";
import { runCurrentLocalAnalysis } from "@/lib/local-analysis-flow";
import { sampleEmails } from "@/lib/sample-emails";
import { type Analysis, type EmailInput, type SampleEmail } from "@/lib/schemas";

const emptyInput: EmailInput = { sender: "", subject: "", body: "", url: "" };

type TriageWorkspaceProps = {
  /** Server-verified state used only to tailor the optional explanation panel. */
  isAdminAuthenticated: boolean;
};

/** Coordinates local form state, deterministic scheduling, and report-focused keyboard flow. */
export function TriageWorkspace({ isAdminAuthenticated }: TriageWorkspaceProps) {
  const [input, setInput] = useState<EmailInput>(emptyInput);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysisVersion, setAnalysisVersion] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [focusReportOnReveal, setFocusReportOnReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<keyof EmailInput | null>(null);
  const analysisFrameRef = useRef<number | null>(null);
  const analysisRequestRef = useRef(0);
  const sampleSelectorRef = useRef<HTMLDivElement>(null);
  const reportHeadingRef = useRef<HTMLHeadingElement>(null);

  /** Cancels a queued local render when the user changes course before it runs. */
  const cancelPendingAnalysis = () => {
    analysisRequestRef.current += 1;

    if (analysisFrameRef.current !== null) {
      window.cancelAnimationFrame(analysisFrameRef.current);
      analysisFrameRef.current = null;
    }

    setIsAnalyzing(false);
  };

  useEffect(() => () => {
    if (analysisFrameRef.current !== null) window.cancelAnimationFrame(analysisFrameRef.current);
  }, []);

  useEffect(() => {
    if (analysis && focusReportOnReveal) reportHeadingRef.current?.focus();
  }, [analysis, focusReportOnReveal]);

  const clearVisibleReport = () => {
    setAnalysis(null);
    setFocusReportOnReveal(false);
  };

  const handleChange = (field: keyof EmailInput, value: string) => {
    cancelPendingAnalysis();
    setInput((current) => ({ ...current, [field]: value }));
    setSelectedSampleId(null);
    clearVisibleReport();
    setError(null);
    setErrorField(null);
  };

  const handleSample = (sample: SampleEmail) => {
    cancelPendingAnalysis();
    setInput({ sender: sample.sender, subject: sample.subject, body: sample.body, url: sample.url });
    setSelectedSampleId(sample.id);
    clearVisibleReport();
    setError(null);
    setErrorField(null);
  };

  /** Validates immediately, then yields one browser frame so the local status can be announced honestly. */
  const handleAnalyze = (): keyof EmailInput | null => {
    const attempt = runCurrentLocalAnalysis(input);

    if (!attempt.success) {
      setError(attempt.error);
      setErrorField(attempt.errorField);
      return attempt.errorField;
    }

    cancelPendingAnalysis();
    setError(null);
    setErrorField(null);
    setIsAnalyzing(true);
    const requestId = analysisRequestRef.current;

    // This is not a delay or remote request. Scheduling one frame lets the
    // browser paint the truthful local-review status before rendering the report.
    analysisFrameRef.current = window.requestAnimationFrame(() => {
      // A field edit or another submit invalidates this frame. This keeps a
      // prior report from replacing the result of the current Analyze action.
      if (requestId !== analysisRequestRef.current) return;

      const shouldFocusOnNarrowScreen = window.matchMedia("(max-width: 767px)").matches;

      setAnalysis(attempt.analysis);
      setAnalysisVersion((current) => current + 1);
      setFocusReportOnReveal(shouldFocusOnNarrowScreen);
      setIsAnalyzing(false);
      analysisFrameRef.current = null;
    });

    return null;
  };

  /** Lets the prominent start action preserve its anchor fallback while moving keyboard focus. */
  const focusSampleSelector = () => {
    window.requestAnimationFrame(() => sampleSelectorRef.current?.focus());
  };

  return (
    <section id="analyze" className="analyzer-section" aria-labelledby="analyzer-heading">
      <header className="analyzer-hero">
        <div className="analyzer-hero-copy">
          <p className="eyebrow">Evidence-first email triage</p>
          <h1 id="analyzer-heading">Understand an email before you act.</h1>
          <p>Choose a local synthetic example or paste email text. PhishLens helps you review observable cues locally and choose an independent way to verify the request.</p>
          <div className="hero-actions">
            <a href="#sample-options" onClick={focusSampleSelector} className="button-primary" aria-describedby="analyzer-action-note">
              Analyze observable signals
              <span aria-hidden="true">↓</span>
            </a>
            <a href="#how-it-works" className="button-secondary">How it works</a>
          </div>
          <p id="analyzer-action-note" className="hero-action-note">Start with a sample or paste an email below. The local report comes first.</p>
        </div>
        <aside className="local-first-card" aria-label="Analysis order">
          <span className="local-first-label">Local report first</span>
          <p>Observable evidence stays primary. An AI explanation is separate, optional, and cannot change the local findings.</p>
        </aside>
      </header>

      <div className="trust-strip" aria-label="PhishLens privacy and workflow boundaries">
        <p><span>Browser-local deterministic analysis</span> Your initial report is produced in the browser.</p>
        <p><span>Explicit-consent AI explanation</span> The optional layer is requested separately after a local report.</p>
        <p><span>No link, attachment, or inbox access</span> PhishLens does not open supplied links or connect to email.</p>
      </div>

      <SafetyNotice />

      <div className="analysis-layout">
        <EmailTriageForm
          input={input}
          samples={sampleEmails}
          selectedSampleId={selectedSampleId}
          error={error}
          errorField={errorField}
          isAnalyzing={isAnalyzing}
          sampleSelectorRef={sampleSelectorRef}
          onChange={handleChange}
          onSample={handleSample}
          onAnalyze={handleAnalyze}
        />
        <div className="analysis-results-column">
          <AnalysisReport
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            reportHeadingRef={reportHeadingRef}
          />
          {analysis && <AiExplanationPanel key={analysisVersion} input={input} analysis={analysis} isAdminAuthenticated={isAdminAuthenticated} />}
        </div>
      </div>
    </section>
  );
}
