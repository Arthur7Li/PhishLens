/**
 * @file components/email-triage-form.tsx
 *
 * Controlled input workspace for a local deterministic review. Sample previews
 * are presentation-only descriptions of the existing synthetic fixtures; they
 * neither add rules nor evaluate any user-provided content.
 */

"use client";

import { useRef, type ChangeEvent, type FormEvent, type RefObject } from "react";
import type { EmailInput, SampleEmail } from "@/lib/schemas";

type FieldControl = HTMLInputElement | HTMLTextAreaElement;

type Props = {
  input: EmailInput;
  samples: SampleEmail[];
  selectedSampleId: string | null;
  error: string | null;
  errorField: keyof EmailInput | null;
  isAnalyzing: boolean;
  sampleSelectorRef: RefObject<HTMLDivElement | null>;
  onChange: (field: keyof EmailInput, value: string) => void;
  onSample: (sample: SampleEmail) => void;
  onAnalyze: () => keyof EmailInput | null;
};

const fields: Array<{ key: keyof EmailInput; label: string; placeholder: string; multiline?: boolean }> = [
  { key: "sender", label: "Sender", placeholder: "Name <name@example.com>" },
  { key: "subject", label: "Subject", placeholder: "Email subject" },
  { key: "body", label: "Email body", placeholder: "Paste the message content here", multiline: true },
  { key: "url", label: "Optional URL", placeholder: "https://example.com" },
];

const sampleCuePreviews: Record<SampleEmail["id"], readonly string[]> = {
  "account-review": ["Urgency", "Credential request"],
  "invoice-alert": ["Payment request", "Supplied URL"],
  "team-update": ["Routine message", "Verify normally"],
};

/** Renders sample selection, manual fields, and the truthful local-review state. */
export function EmailTriageForm({
  input,
  samples,
  selectedSampleId,
  error,
  errorField,
  isAnalyzing,
  sampleSelectorRef,
  onChange,
  onSample,
  onAnalyze,
}: Props) {
  const fieldRefs = useRef<Partial<Record<keyof EmailInput, FieldControl | null>>>({});

  const update = (field: keyof EmailInput) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(field, event.target.value);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invalidField = onAnalyze();

    if (invalidField) window.requestAnimationFrame(() => fieldRefs.current[invalidField]?.focus());
  };

  return (
    <section className="rounded-3xl border border-[#27405f] bg-[#0d1b2e]/90 p-5 shadow-2xl shadow-black/20 sm:p-7" aria-labelledby="input-workspace-heading">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-[#66e3c4] uppercase">Input workspace</p>
          <h2 id="input-workspace-heading" className="mt-1 text-xl font-semibold text-white">Start with a sample or paste email text</h2>
        </div>
        <p className="max-w-xs text-sm leading-6 text-[#9bb0c5]">Try a local synthetic example, or paste your own email below.</p>
      </div>

      <form className="mt-5" onSubmit={submit} noValidate aria-busy={isAnalyzing}>
        <div id="sample-options" ref={sampleSelectorRef} tabIndex={-1} className="rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#66e3c4]/30">
          <fieldset>
            <legend className="text-sm font-medium text-[#d9e8f5]">Choose a local synthetic example, or enter your own text below.</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {samples.map((sample) => {
                const isSelected = selectedSampleId === sample.id;

                return (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => onSample(sample)}
                    aria-pressed={isSelected}
                    className={`min-h-36 rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#66e3c4]/30 motion-reduce:transition-none ${isSelected ? "border-[#66e3c4] bg-[#173b4a]" : "border-[#315272] bg-[#102238] hover:border-[#5e86a8] hover:bg-[#132b43]"}`}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold text-[#eff8ff]">{sample.label}</span>
                      {isSelected && <span className="shrink-0 rounded-full border border-[#66e3c4] px-2 py-0.5 text-xs font-semibold text-[#9df1dc]">Selected</span>}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[#a9c0d4]">{sample.description}</span>
                    <span className="mt-3 flex flex-wrap gap-1.5">
                      {sampleCuePreviews[sample.id].map((cue) => <span key={cue} className="rounded-full border border-[#41617d] bg-[#091b2d] px-2 py-1 text-[0.7rem] font-semibold leading-4 text-[#c5d8e9]">{cue}</span>)}
                    </span>
                    {isSelected && <span className="mt-3 block text-xs font-medium text-[#9df1dc]">Loaded below</span>}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="mt-6 grid gap-4">
          {fields.map((field) => {
            const isInvalid = errorField === field.key;
            const errorId = isInvalid ? "email-input-error" : undefined;
            const urlHelperId = field.key === "url" ? "url-verification-helper" : undefined;
            const describedBy = [errorId, urlHelperId].filter(Boolean).join(" ") || undefined;
            const inputClassName = `min-h-12 min-w-0 rounded-xl border bg-[#091728] px-4 py-3 text-[#eef7ff] outline-none placeholder:text-[#66819b] focus-visible:border-[#66e3c4] focus-visible:ring-2 focus-visible:ring-[#66e3c4]/20 ${isInvalid ? "border-[#ffc879]" : "border-[#315272]"}`;

            return (
              <label key={field.key} className="grid min-w-0 gap-2 text-sm font-medium text-[#d9e8f5]">
                {field.label}
                {field.multiline ? (
                  <textarea
                    id={`email-field-${field.key}`}
                    ref={(element) => { fieldRefs.current[field.key] = element; }}
                    value={input[field.key]}
                    onChange={update(field.key)}
                    rows={6}
                    placeholder={field.placeholder}
                    aria-invalid={isInvalid || undefined}
                    aria-describedby={describedBy}
                    className={`resize-y ${inputClassName}`}
                  />
                ) : (
                  <input
                    id={`email-field-${field.key}`}
                    ref={(element) => { fieldRefs.current[field.key] = element; }}
                    value={input[field.key]}
                    onChange={update(field.key)}
                    placeholder={field.placeholder}
                    aria-invalid={isInvalid || undefined}
                    aria-describedby={describedBy}
                    className={inputClassName}
                  />
                )}
                {field.key === "url" && <span id="url-verification-helper" className="text-xs font-normal leading-5 text-[#9bb0c5]">Paste a supplied URL only. Verify the destination independently rather than opening the link in the message.</span>}
              </label>
            );
          })}
        </div>

        {error && <p id="email-input-error" role="alert" className="mt-4 text-sm leading-6 text-[#ffc879]">{error}</p>}
        <button type="submit" disabled={isAnalyzing} className="mt-6 min-h-12 w-full rounded-xl bg-[#66e3c4] px-5 py-3.5 font-semibold text-[#082019] transition hover:bg-[#8aefd5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#66e3c4]/30 disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none">
          {isAnalyzing ? "Reviewing observable cues locally…" : "Analyze observable signals"}
        </button>
        {isAnalyzing && <p className="mt-3 text-sm leading-6 text-[#9ec6de]" role="status">Reviewing observable cues locally…</p>}
      </form>
    </section>
  );
}
