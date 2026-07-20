/**
 * Pure, shared deterministic evaluator for PhishLens.
 *
 * This module runs unchanged in the browser and server route. It has no I/O,
 * persistence, URL fetching, attachment handling, reputation lookup, or AI
 * call; it turns pasted text into transparent local observations only.
 */

import { getContextModifiers, getVerificationSteps } from "./deterministic-analysis/context";
import type { Analysis, AnalysisRiskLevel, ContextModifier, EmailInput, SignalFinding } from "./schemas";
import { signalRules } from "./signal-rules";

/** Converts rule weights plus one explicit combination note into a non-verdict local context level. */
export function getAnalysisRiskLevel(
  signals: readonly SignalFinding[],
  contextModifiers: readonly ContextModifier[] = [],
): AnalysisRiskLevel {
  const totalWeight = [...signals, ...contextModifiers].reduce((sum, item) => sum + item.riskWeight, 0);

  if (totalWeight === 0) return "informational";
  if (totalWeight === 1) return "caution";
  if (totalWeight <= 3) return "review";
  return "elevated";
}

/** Creates a calibrated headline that describes local context without labelling an email. */
function createHeadline(riskLevel: AnalysisRiskLevel, signalCount: number): string {
  if (riskLevel === "informational" && signalCount === 0) return "No configured cues are shown in this local review.";
  if (riskLevel === "informational") return "An informational observation is available for independent verification.";
  if (riskLevel === "caution") return "A limited observable cue warrants a careful pause.";
  if (riskLevel === "review") return "Several observable cues warrant extra care.";
  return "Multiple observable cues warrant extra care.";
}

/** Builds a short report summary from the exact rules and any documented combination note. */
function createSummary(signals: readonly SignalFinding[], contextModifiers: readonly ContextModifier[]): string {
  if (signals.length === 0) {
    return "This local rule set does not show its configured patterns. That absence is not a safety verdict; independent verification can still matter.";
  }

  const titles = signals.map((signal) => signal.title.toLowerCase()).join(", ");
  const combination = contextModifiers[0];
  const combinationText = combination ? ` A documented combination also contributes to local context: ${combination.title.toLowerCase()}.` : "";

  return `This local deterministic review found: ${titles}.${combinationText} These observations describe pasted text and URL structure only; they do not establish intent.`;
}

/** Evaluates every configured rule once and returns the same typed report in browser and server contexts. */
export function analyzePhishingSignals(input: EmailInput): Analysis {
  const signals = signalRules.flatMap((rule) => {
    const finding = rule.evaluate(input);
    return finding ? [finding] : [];
  });
  const contextModifiers = getContextModifiers(signals);
  const riskLevel = getAnalysisRiskLevel(signals, contextModifiers);

  return {
    riskLevel,
    headline: createHeadline(riskLevel, signals.length),
    summary: createSummary(signals, contextModifiers),
    signals,
    contextModifiers,
    nextSteps: getVerificationSteps(signals),
    learningNote: "This browser-local analysis inspects only the pasted sender, subject, body, and optional URL. It does not open links, inspect attachments, contact senders, use reputation data, store input, or make a definitive verdict.",
  };
}
