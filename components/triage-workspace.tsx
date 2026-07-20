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
import { AdminAccess } from "@/components/admin-access";
import { EmailTriageForm } from "@/components/email-triage-form";
import { SafetyNotice } from "@/components/safety-notice";
import { analyzePhishingSignals } from "@/lib/phishing-signal-engine";
import { sampleEmails } from "@/lib/sample-emails";
import { emailInputSchema, type Analysis, type EmailInput, type SampleEmail } from "@/lib/schemas";

const emptyInput: EmailInput = { sender: "", subject: "", body: "", url: "" };

type TriageWorkspaceProps = {
  /** Server-verified state used only to tailor the quiet administrator control. */
  initialAdminAuthenticated: boolean;
};

/** Returns a valid email field key only when Zod points at one of the visible controls. */
function toEmailInputField(value: unknown): keyof EmailInput | null {
  return value === "sender" || value === "subject" || value === "body" || value === "url" ? value : null;
}

/** Coordinates local form state, deterministic scheduling, and report-focused keyboard flow. */
export function TriageWorkspace({ initialAdminAuthenticated }: TriageWorkspaceProps) {
  const [input, setInput] = useState<EmailInput>(emptyInput);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysisVersion, setAnalysisVersion] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [focusReportOnReveal, setFocusReportOnReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<keyof EmailInput | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(initialAdminAuthenticated);
  const analysisFrameRef = useRef<number | null>(null);
  const sampleSelectorRef = useRef<HTMLDivElement>(null);
  const reportHeadingRef = useRef<HTMLHeadingElement>(null);

  /** Cancels a queued local render when the user changes course before it runs. */
  const cancelPendingAnalysis = () => {
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
    const parsed = emailInputSchema.safeParse(input);

    if (!parsed.success) {
      const field = toEmailInputField(parsed.error.issues[0]?.path[0]);
      setError(parsed.error.issues[0]?.message ?? "Please complete the form.");
      setErrorField(field);
      return field;
    }

    cancelPendingAnalysis();
    setError(null);
    setErrorField(null);
    setIsAnalyzing(true);

    // This is not a delay or remote request. Scheduling one frame lets the
    // browser paint the truthful local-review status before rendering the report.
    analysisFrameRef.current = window.requestAnimationFrame(() => {
      const shouldFocusOnNarrowScreen = window.matchMedia("(max-width: 767px)").matches;

      setAnalysis(analyzePhishingSignals(parsed.data));
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
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-7 sm:px-8 sm:py-10">
      <header className="mb-6 flex flex-col justify-between gap-5 border-b border-[#27405f] pb-6 lg:flex-row lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#66e3c4] text-xl font-black text-[#082019]" aria-hidden="true">P</span>
            <span className="text-xl font-bold tracking-tight">PhishLens</span>
            <span className="rounded-full border border-[#315272] px-2.5 py-1 text-xs font-semibold text-[#9ec6de]">Educational demo</span>
          </div>
          <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">Understand an email before you act.</h1>
          <p className="mt-3 max-w-2xl leading-7 text-[#9bb0c5]">Start with a local synthetic example or paste email text. Review observable cues locally, then choose an independent way to verify the request.</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <a href="#sample-options" onClick={focusSampleSelector} className="inline-flex min-h-11 items-center rounded-xl bg-[#66e3c4] px-4 py-2 text-sm font-bold text-[#082019] transition hover:bg-[#8aefd6] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#66e3c4]/30 motion-reduce:transition-none">Start with a sample</a>
            <span className="text-sm text-[#9bb0c5]">Or paste email text below.</span>
          </div>
        </div>
        <div className="rounded-xl border border-[#315272] bg-[#0d2137] px-4 py-3 text-sm leading-6 text-[#b7cce0]"><span className="font-semibold text-[#66e3c4]">Local report first</span><br />AI explanation is separate and optional.</div>
      </header>

      <section className="rounded-2xl border border-[#27405f] bg-[#0b1829]/80 px-4 py-4 sm:px-5" aria-labelledby="how-it-works-heading">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-[#66e3c4] uppercase">Start here</p>
            <h2 id="how-it-works-heading" className="mt-1 text-xl font-semibold text-white">Start with a sample, then inspect what PhishLens observed locally.</h2>
          </div>
          <p className="text-sm text-[#9bb0c5]">Evidence first. Optional explanation second.</p>
        </div>
        <ol className="mt-4 grid gap-2 sm:grid-cols-3">
          <li className="rounded-xl border border-[#294663] bg-[#0d1b2e] px-3 py-2.5 text-sm leading-6 text-[#b8cde0]"><span className="font-semibold text-[#66e3c4]">1. Choose or paste</span><span className="block">Use a sample or enter email text.</span></li>
          <li className="rounded-xl border border-[#294663] bg-[#0d1b2e] px-3 py-2.5 text-sm leading-6 text-[#b8cde0]"><span className="font-semibold text-[#66e3c4]">2. Review local evidence</span><span className="block">See the observed patterns and why they matter.</span></li>
          <li className="rounded-xl border border-[#294663] bg-[#0d1b2e] px-3 py-2.5 text-sm leading-6 text-[#b8cde0]"><span className="font-semibold text-[#66e3c4]">3. Verify independently</span><span className="block">Use an independent path for next steps.</span></li>
        </ol>
      </section>

      <SafetyNotice />

      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
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
        <div className="space-y-7">
          <AnalysisReport
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            reportHeadingRef={reportHeadingRef}
          />
          {analysis && <AiExplanationPanel key={analysisVersion} input={input} analysis={analysis} isAdminAuthenticated={isAdminAuthenticated} />}
        </div>
      </div>

      <footer className="mt-10 flex flex-col gap-4 border-t border-[#27405f] pt-5 text-sm leading-6 text-[#7694ad] sm:flex-row sm:items-start sm:justify-between sm:gap-8"><p className="max-w-4xl">Built as a security-sensitive educational prototype. Local deterministic analysis stays in the browser. The optional AI explanation sends submitted content to Groq only after you choose it. PhishLens does not fetch URLs, execute attachments, connect to inboxes, or retain submitted content.</p><AdminAccess isAdminAuthenticated={isAdminAuthenticated} onSessionChange={setIsAdminAuthenticated} /></footer>
    </main>
  );
}
