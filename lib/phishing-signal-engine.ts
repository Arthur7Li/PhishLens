/**
 * @file lib/phishing-signal-engine.ts
 *
 * Pure deterministic evaluator for PhishLens Phase B. The engine runs entirely
 * in the browser and converts user-entered text into transparent rule findings.
 * It has no I/O, persistence, URL fetching, attachment handling, or AI calls.
 */

import type { Analysis, AnalysisRiskLevel, EmailInput, SignalFinding } from "./schemas";
import { signalRules } from "./signal-rules";

const safeNextSteps = [
  "Avoid using links or phone numbers provided in the message until you verify them independently.",
  "Open the organization’s known website or a trusted internal directory instead of replying or clicking.",
  "If this reached a work account, use your organization’s established reporting process.",
];

/** Converts the nonzero rule weights into a transparent, non-verdict report level. */
export function getAnalysisRiskLevel(signals: readonly SignalFinding[]): AnalysisRiskLevel {
  const totalWeight = signals.reduce((sum, signal) => sum + signal.riskWeight, 0);

  if (totalWeight === 0) return "informational";
  if (totalWeight === 1) return "caution";
  if (totalWeight <= 3) return "review";
  return "elevated";
}

/** Creates a calibrated headline that never claims an email is safe or malicious. */
function createHeadline(riskLevel: AnalysisRiskLevel, signalCount: number): string {
  if (riskLevel === "informational" && signalCount === 0) return "No configured cues were detected in this local review.";
  if (riskLevel === "informational") return "An informational detail is available for independent verification.";
  if (riskLevel === "caution") return "A limited observable cue warrants a careful pause.";
  if (riskLevel === "review") return "Several observable cues warrant extra care.";
  return "Multiple observable cues warrant extra care.";
}

/** Builds the short report summary from the exact rules that matched. */
function createSummary(signals: readonly SignalFinding[]): string {
  if (signals.length === 0) {
    return "This local rule set did not detect its configured patterns. That absence is not a safety verdict; independent verification can still matter.";
  }

  const titles = signals.map((signal) => signal.title.toLowerCase()).join(", ");
  return `This local deterministic review found: ${titles}. These observations describe text patterns only and do not establish intent.`;
}

/** Evaluates every configured rule and returns a fully typed educational report. */
export function analyzePhishingSignals(input: EmailInput): Analysis {
  const signals = signalRules.flatMap((rule) => {
    const finding = rule.evaluate(input);
    return finding ? [finding] : [];
  });
  const riskLevel = getAnalysisRiskLevel(signals);

  return {
    riskLevel,
    headline: createHeadline(riskLevel, signals.length),
    summary: createSummary(signals),
    signals,
    nextSteps: safeNextSteps,
    learningNote: "Phase B uses transparent local rules only. It does not contact senders, open URLs, inspect attachments, store input, or make a definitive verdict.",
  };
}
