/**
 * @file components/triage-workspace.tsx
 *
 * Root client component that wires together the entire PhishLens single-page UI.
 *
 * `TriageWorkspace` owns all shared state and acts as the orchestrator between
 * the three visible child components and the analysis library:
 *
 * State
 * ─────
 * - `input`            – the current value of all four email fields (sender,
 *                        subject, body, optional URL)
 * - `selectedSampleId` – the `id` of the active sample fixture, or `null` when
 *                        the user has typed their own content
 * - `analysis`         – the `Analysis` object returned after clicking "Analyze",
 *                        or `null` before any analysis has been run
 * - `error`            – a validation error string shown below the form, or `null`
 *
 * Event handlers
 * ──────────────
 * - `handleChange`  – updates a single field; clears `selectedSampleId` and
 *                     `error` so the sample selection and report stay in sync
 * - `handleSample`  – populates all four fields from a `SampleEmail` fixture and
 *                     tracks which sample is active; clears any prior analysis
 * - `handleAnalyze` – validates the form with `emailInputSchema`, sets `error`
 *                     on failure, or runs the local deterministic signal engine
 *
 * Layout
 * ──────
 * The component renders a full-height `<main>` containing:
 *   1. A branded page header with the app name, phase badge, and privacy callout
 *   2. `<SafetyNotice>` – persistent educational disclaimer
 *   3. A two-column grid: `<EmailTriageForm>` (left) | `<AnalysisReport>` (right)
 *   4. A footer repeating the privacy / non-verdict statement
 *
 * @see components/email-triage-form.tsx
 * @see components/analysis-report.tsx
 * @see components/safety-notice.tsx
 * @see lib/phishing-signal-engine.ts
 */

"use client";

import { useState } from "react";
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

export function TriageWorkspace({ initialAdminAuthenticated }: TriageWorkspaceProps) {
  const [input, setInput] = useState<EmailInput>(emptyInput);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysisVersion, setAnalysisVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<keyof EmailInput | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(initialAdminAuthenticated);

  const handleChange = (field: keyof EmailInput, value: string) => {
    setInput((current) => ({ ...current, [field]: value }));
    setSelectedSampleId(null);
    setAnalysis(null);
    setError(null);
    setErrorField(null);
  };

  const handleSample = (sample: SampleEmail) => {
    setInput({ sender: sample.sender, subject: sample.subject, body: sample.body, url: sample.url });
    setSelectedSampleId(sample.id);
    setAnalysis(null);
    setError(null);
    setErrorField(null);
  };

  const handleAnalyze = () => {
    const parsed = emailInputSchema.safeParse(input);
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      setError(parsed.error.issues[0]?.message ?? "Please complete the form.");
      setErrorField(field === "sender" || field === "subject" || field === "body" || field === "url" ? field : null);
      return;
    }
    setError(null);
    setErrorField(null);
    setAnalysis(analyzePhishingSignals(parsed.data));
    setAnalysisVersion((current) => current + 1);
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
      <header className="mb-7 flex flex-col justify-between gap-5 border-b border-[#27405f] pb-7 lg:flex-row lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#66e3c4] text-xl font-black text-[#082019]">P</span><span className="text-xl font-bold tracking-tight">PhishLens</span><span className="rounded-full border border-[#315272] px-2.5 py-1 text-xs font-semibold text-[#9ec6de]">Phase D</span></div>
          <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">Pause, inspect the evidence, choose a safer next step.</h1>
          <p className="mt-3 max-w-2xl leading-7 text-[#9bb0c5]">Review observable email cues without opening links, treating any result as a verdict, or losing sight of what to verify next.</p>
        </div>
        <div className="rounded-xl border border-[#315272] bg-[#0d2137] px-4 py-3 text-sm leading-6 text-[#b7cce0]"><span className="font-semibold text-[#66e3c4]">Local report first</span><br />AI explanation is separate and optional.</div>
      </header>
      <section className="rounded-2xl border border-[#27405f] bg-[#0b1829]/80 p-4 sm:p-5" aria-labelledby="how-it-works-heading">
        <p className="text-sm font-semibold tracking-[0.18em] text-[#66e3c4] uppercase">Start here</p>
        <h2 id="how-it-works-heading" className="mt-1 text-xl font-semibold text-white">Understand the workflow in three steps.</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          <li className="rounded-xl border border-[#294663] bg-[#0d1b2e] p-3"><span className="text-xs font-bold tracking-[0.14em] text-[#66e3c4] uppercase">1 · Choose or paste</span><p className="mt-1 text-sm leading-6 text-[#b8cde0]">Use a local example or enter the sender, subject, body, and optional URL.</p></li>
          <li className="rounded-xl border border-[#294663] bg-[#0d1b2e] p-3"><span className="text-xs font-bold tracking-[0.14em] text-[#66e3c4] uppercase">2 · Review local cues</span><p className="mt-1 text-sm leading-6 text-[#b8cde0]">See the exact observable patterns and safer next steps in your browser.</p></li>
          <li className="rounded-xl border border-[#294663] bg-[#0d1b2e] p-3"><span className="text-xs font-bold tracking-[0.14em] text-[#66e3c4] uppercase">3 · Optional explanation</span><p className="mt-1 text-sm leading-6 text-[#b8cde0]">Choose whether to send content to Groq for an educational explanation.</p></li>
        </ol>
      </section>
      <SafetyNotice />
      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"><EmailTriageForm input={input} samples={sampleEmails} selectedSampleId={selectedSampleId} error={error} errorField={errorField} onChange={handleChange} onSample={handleSample} onAnalyze={handleAnalyze} /><div className="space-y-7"><AnalysisReport analysis={analysis} />{analysis && <AiExplanationPanel key={analysisVersion} input={input} analysis={analysis} isAdminAuthenticated={isAdminAuthenticated} />}</div></div>
      <footer className="mt-10 flex flex-col gap-4 border-t border-[#27405f] pt-5 text-sm leading-6 text-[#7694ad] sm:flex-row sm:items-start sm:justify-between sm:gap-8"><p className="max-w-4xl">Built as a security-sensitive educational prototype. Local deterministic analysis stays in the browser. The optional AI explanation sends submitted content to Groq only after you choose it. PhishLens does not fetch URLs, execute attachments, connect to inboxes, or retain submitted content.</p><AdminAccess isAdminAuthenticated={isAdminAuthenticated} onSessionChange={setIsAdminAuthenticated} /></footer>
    </main>
  );
}
