/**
 * @file components/email-triage-form.tsx
 *
 * Controlled input workspace for a local deterministic review. Sample previews
 * are presentation-only descriptions of existing synthetic fixtures; they do
 * not add rules or evaluate user-provided content.
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
  "account-review": ["Account pressure", "Credential request", "Domain character cue"],
  "invoice-alert": ["Payment request", "URL supplied"],
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

    // The workspace owns validation; the form moves focus to the field it identified.
    if (invalidField) window.requestAnimationFrame(() => fieldRefs.current[invalidField]?.focus());
  };

  return (
    <section id="input-workspace" className="workspace-panel triage-form-panel" aria-labelledby="input-workspace-heading">
      <div className="panel-intro">
        <div>
          <p className="eyebrow">Input workspace</p>
          <h2 id="input-workspace-heading" className="panel-title">Start with a sample or paste email text</h2>
        </div>
        <p className="panel-intro-copy">Try a local synthetic example, or paste your own email below.</p>
      </div>

      <form className="triage-form" onSubmit={submit} noValidate aria-busy={isAnalyzing}>
        <div id="sample-options" ref={sampleSelectorRef} tabIndex={-1} className="sample-selector">
          <fieldset>
            <legend>Choose a local synthetic example, or enter your own text below.</legend>
            <div className="sample-grid">
              {samples.map((sample) => {
                const isSelected = selectedSampleId === sample.id;

                return (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => onSample(sample)}
                    aria-pressed={isSelected}
                    className={`sample-card ${isSelected ? "is-selected" : ""}`}
                  >
                    <span className="sample-card-heading">
                      <span>{sample.label}</span>
                      {isSelected && <span className="selected-indicator">Selected</span>}
                    </span>
                    <span className="sample-description">{sample.description}</span>
                    <span className="sample-cues">
                      {sampleCuePreviews[sample.id].map((cue) => <span key={cue}>{cue}</span>)}
                    </span>
                    {isSelected && <span className="sample-loaded">Loaded below</span>}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="form-fields">
          {fields.map((field) => {
            const isInvalid = errorField === field.key;
            const errorId = isInvalid ? "email-input-error" : undefined;
            const urlHelperId = field.key === "url" ? "url-verification-helper" : undefined;
            const describedBy = [errorId, urlHelperId].filter(Boolean).join(" ") || undefined;
            const inputClassName = `field-control ${isInvalid ? "is-invalid" : ""}`;

            return (
              <label key={field.key} className="field-group">
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
                {field.key === "url" && <span id="url-verification-helper" className="field-helper">Paste a supplied URL only. Verify the destination independently rather than opening the link in the message.</span>}
              </label>
            );
          })}
        </div>

        {error && <p id="email-input-error" role="alert" className="form-error">{error}</p>}
        <button type="submit" disabled={isAnalyzing} className="button-primary form-submit">
          {isAnalyzing ? "Reviewing observable cues locally…" : "Analyze observable signals"}
        </button>
        {isAnalyzing && <p className="form-status" role="status">Reviewing observable cues locally…</p>}
      </form>
    </section>
  );
}
