"use client";

import type { ChangeEvent } from "react";
import type { EmailInput, SampleEmail } from "@/lib/schemas";

type Props = {
  input: EmailInput;
  samples: SampleEmail[];
  selectedSampleId: string | null;
  error: string | null;
  onChange: (field: keyof EmailInput, value: string) => void;
  onSample: (sample: SampleEmail) => void;
  onAnalyze: () => void;
};

const fields: Array<{ key: keyof EmailInput; label: string; placeholder: string; multiline?: boolean }> = [
  { key: "sender", label: "Sender", placeholder: "Name <name@example.com>" },
  { key: "subject", label: "Subject", placeholder: "Email subject" },
  { key: "body", label: "Email body", placeholder: "Paste the message content here", multiline: true },
  { key: "url", label: "Optional URL", placeholder: "https://example.com" },
];

export function EmailTriageForm({ input, samples, selectedSampleId, error, onChange, onSample, onAnalyze }: Props) {
  const update = (field: keyof EmailInput) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(field, event.target.value);

  return (
    <section className="rounded-3xl border border-[#27405f] bg-[#0d1b2e]/90 p-5 shadow-2xl shadow-black/20 sm:p-7">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-[#66e3c4] uppercase">Input workspace</p>
          <h2 className="mt-1 text-xl font-semibold">Review an email without opening anything</h2>
        </div>
        <p className="text-sm text-[#9bb0c5]">Synthetic examples only in this demo</p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {samples.map((sample) => (
          <button key={sample.id} type="button" onClick={() => onSample(sample)} className={`rounded-xl border p-3 text-left transition ${selectedSampleId === sample.id ? "border-[#66e3c4] bg-[#173b4a]" : "border-[#315272] bg-[#102238] hover:border-[#5e86a8]"}`}>
            <span className="block text-sm font-semibold text-[#eff8ff]">{sample.label}</span>
            <span className="mt-1 block text-xs leading-5 text-[#a9c0d4]">{sample.description}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4">
        {fields.map((field) => (
          <label key={field.key} className="grid gap-2 text-sm font-medium text-[#d9e8f5]">
            {field.label}
            {field.multiline ? (
              <textarea value={input[field.key]} onChange={update(field.key)} rows={6} placeholder={field.placeholder} className="resize-y rounded-xl border border-[#315272] bg-[#091728] px-4 py-3 text-[#eef7ff] outline-none placeholder:text-[#66819b] focus:border-[#66e3c4] focus:ring-2 focus:ring-[#66e3c4]/20" />
            ) : (
              <input value={input[field.key]} onChange={update(field.key)} placeholder={field.placeholder} className="rounded-xl border border-[#315272] bg-[#091728] px-4 py-3 text-[#eef7ff] outline-none placeholder:text-[#66819b] focus:border-[#66e3c4] focus:ring-2 focus:ring-[#66e3c4]/20" />
            )}
          </label>
        ))}
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-[#ffc879]">{error}</p>}
      <button type="button" onClick={onAnalyze} className="mt-6 w-full rounded-xl bg-[#66e3c4] px-5 py-3.5 font-semibold text-[#082019] transition hover:bg-[#8aefd5] focus:outline-none focus:ring-4 focus:ring-[#66e3c4]/30">Analyze observable signals</button>
    </section>
  );
}
