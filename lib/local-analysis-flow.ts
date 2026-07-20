/**
 * Browser-safe local-analysis submission helper.
 *
 * The client workspace calls this helper for every Analyze action rather than
 * retaining an earlier result. It validates and normalizes the current fields
 * before evaluating the same pure engine used by server recomputation.
 */

import { analyzePhishingSignals } from "./phishing-signal-engine";
import { emailInputSchema, type Analysis, type EmailInput } from "./schemas";

export type LocalAnalysisAttempt =
  | { success: true; input: EmailInput; analysis: Analysis }
  | { success: false; error: string; errorField: keyof EmailInput | null };

/** Narrows a Zod issue path to a visible email-input control. */
function toEmailInputField(value: unknown): keyof EmailInput | null {
  return value === "sender" || value === "subject" || value === "body" || value === "url" ? value : null;
}

/**
 * Evaluates exactly the input passed by the current form submit. No result is
 * cached here, so a later submit cannot reuse an earlier zero-finding report.
 */
export function runCurrentLocalAnalysis(input: EmailInput): LocalAnalysisAttempt {
  const parsed = emailInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Please complete the form.",
      errorField: toEmailInputField(parsed.error.issues[0]?.path[0]),
    };
  }

  return {
    success: true,
    input: parsed.data,
    analysis: analyzePhishingSignals(parsed.data),
  };
}
