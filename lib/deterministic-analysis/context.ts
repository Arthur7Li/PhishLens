/**
 * Transparent local-context calculation and verification guidance.
 *
 * Context is derived only from the ordered rule findings. A single documented
 * combination can add one point when two distinct cues together justify extra
 * care; it never produces a phishing or safety verdict.
 */

import type { ContextModifier, SignalFinding } from "../schemas";

/** Returns one explainable combination note, prioritizing credential/payment pressure over broader role language. */
export function getContextModifiers(signals: readonly SignalFinding[]): ContextModifier[] {
  const ids = new Set(signals.map((signal) => signal.id));

  if (ids.has("urgency") && ids.has("credential-request")) {
    return [{
      id: "urgency-credential-combination",
      title: "Time pressure paired with a credential request",
      explanation: "The local report shows both a time-pressure cue and a request for account information. Seeing both together is why the overall local context is raised by one additional transparent point.",
      relatedSignalIds: ["urgency", "credential-request"],
      riskWeight: 1,
    }];
  }

  if (ids.has("urgency") && ids.has("payment-request")) {
    return [{
      id: "urgency-payment-combination",
      title: "Time pressure paired with a payment request",
      explanation: "The local report shows both a time-pressure cue and a financial request. Seeing both together is why the overall local context is raised by one additional transparent point.",
      relatedSignalIds: ["urgency", "payment-request"],
      riskWeight: 1,
    }];
  }

  if (ids.has("authority-pressure") && (ids.has("credential-request") || ids.has("payment-request"))) {
    const sensitiveId = ids.has("credential-request") ? "credential-request" : "payment-request";

    return [{
      id: "authority-sensitive-request-combination",
      title: "Authority language paired with a sensitive request",
      explanation: "The local report shows a claimed authority role alongside a sensitive request. Seeing both together is why the overall local context is raised by one additional transparent point.",
      relatedSignalIds: ["authority-pressure", sensitiveId],
      riskWeight: 1,
    }];
  }

  return [];
}

/** Builds a short verification checklist tailored to the exact observable cue families. */
export function getVerificationSteps(signals: readonly SignalFinding[]): string[] {
  const ids = new Set(signals.map((signal) => signal.id));
  const steps: string[] = [];

  if (ids.has("credential-request")) {
    steps.push("Do not share passwords or account codes through the message; open the organization’s known sign-in route yourself.");
  }

  if (ids.has("payment-request")) {
    steps.push("Confirm payment, bank-detail, gift-card, crypto, or wire requests through a known vendor record or trusted contact path.");
  }

  if (ids.has("risky-attachment-reference")) {
    steps.push("Do not open the referenced file until the request is confirmed through a known contact path.");
  }

  if (ids.has("provided-url") || ids.has("url-structure") || ids.has("sender-url-mismatch")) {
    steps.push("Avoid using a supplied link or contact detail; type a known website address or use a trusted directory instead.");
  }

  if (ids.has("lookalike-domain") || ids.has("internationalized-sender-domain") || ids.has("malformed-sender-address") || ids.has("authority-pressure")) {
    steps.push("Compare the sender and claimed role with a trusted directory, saved contact, or independently located organization channel.");
  }

  steps.push("If this reached a work account, use your organization’s established reporting process.");

  return [...new Set(steps)].slice(0, 4);
}
