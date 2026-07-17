"use client";

import { useState } from "react";
import { AnalysisReport } from "@/components/analysis-report";
import { EmailTriageForm } from "@/components/email-triage-form";
import { SafetyNotice } from "@/components/safety-notice";
import { getMockAnalysis } from "@/lib/mock-analysis";
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
    setAnalysis(getMockAnalysis(selectedSampleId, parsed.data));
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
      <header className="mb-8 flex flex-col justify-between gap-5 border-b border-[#27405f] pb-7 lg:flex-row lg:items-end">
        <div><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#66e3c4] text-xl font-black text-[#082019]">P</span><span className="text-xl font-bold tracking-tight">PhishLens</span><span className="rounded-full border border-[#315272] px-2.5 py-1 text-xs font-semibold text-[#9ec6de]">Phase A</span></div><h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">Pause, inspect the evidence, choose a safer next step.</h1><p className="mt-3 max-w-2xl leading-7 text-[#9bb0c5]">A private, educational workspace for examining observable email cues—without following links or treating any automated result as a definitive verdict.</p></div>
        <div className="rounded-xl border border-[#315272] bg-[#0d2137] px-4 py-3 text-sm text-[#b7cce0]"><span className="font-semibold text-[#66e3c4]">Local-only demo</span><br />No requests leave this page.</div>
      </header>
      <SafetyNotice />
      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"><EmailTriageForm input={input} samples={sampleEmails} selectedSampleId={selectedSampleId} error={error} onChange={handleChange} onSample={handleSample} onAnalyze={handleAnalyze} /><AnalysisReport analysis={analysis} /></div>
      <footer className="mt-10 border-t border-[#27405f] pt-5 text-sm leading-6 text-[#7694ad]">Built as a security-sensitive educational prototype. PhishLens does not fetch URLs, execute attachments, connect to inboxes, or retain submitted content.</footer>
    </main>
  );
}
