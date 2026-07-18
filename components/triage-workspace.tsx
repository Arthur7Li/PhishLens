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
import { EmailTriageForm } from "@/components/email-triage-form";
import { SafetyNotice } from "@/components/safety-notice";
import { analyzePhishingSignals } from "@/lib/phishing-signal-engine";
import { sampleEmails } from "@/lib/sample-emails";
import { emailInputSchema, type Analysis, type EmailInput, type SampleEmail } from "@/lib/schemas";

const emptyInput: EmailInput = { sender: "", subject: "", body: "", url: "" };

export function TriageWorkspace() {
  const [input, setInput] = useState<EmailInput>(emptyInput);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof EmailInput, value: string) => {
    setInput((current) => ({ ...current, [field]: value }));
    setSelectedSampleId(null);
    setError(null);
  };

  const handleSample = (sample: SampleEmail) => {
    setInput({ sender: sample.sender, subject: sample.subject, body: sample.body, url: sample.url });
    setSelectedSampleId(sample.id);
    setAnalysis(null);
    setError(null);
  };

  const handleAnalyze = () => {
    const parsed = emailInputSchema.safeParse(input);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Please complete the form."); return; }
    setError(null);
    setAnalysis(analyzePhishingSignals(parsed.data));
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
      <header className="mb-8 flex flex-col justify-between gap-5 border-b border-[#27405f] pb-7 lg:flex-row lg:items-end">
        <div><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#66e3c4] text-xl font-black text-[#082019]">P</span><span className="text-xl font-bold tracking-tight">PhishLens</span><span className="rounded-full border border-[#315272] px-2.5 py-1 text-xs font-semibold text-[#9ec6de]">Phase B</span></div><h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">Pause, inspect the evidence, choose a safer next step.</h1><p className="mt-3 max-w-2xl leading-7 text-[#9bb0c5]">A private, educational workspace for examining observable email cues—without following links or treating any automated result as a definitive verdict.</p></div>
        <div className="rounded-xl border border-[#315272] bg-[#0d2137] px-4 py-3 text-sm text-[#b7cce0]"><span className="font-semibold text-[#66e3c4]">Local-only demo</span><br />No requests leave this page.</div>
      </header>
      <SafetyNotice />
      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"><EmailTriageForm input={input} samples={sampleEmails} selectedSampleId={selectedSampleId} error={error} onChange={handleChange} onSample={handleSample} onAnalyze={handleAnalyze} /><AnalysisReport analysis={analysis} /></div>
      <footer className="mt-10 border-t border-[#27405f] pt-5 text-sm leading-6 text-[#7694ad]">Built as a security-sensitive educational prototype. PhishLens does not fetch URLs, execute attachments, connect to inboxes, or retain submitted content.</footer>
    </main>
  );
}
