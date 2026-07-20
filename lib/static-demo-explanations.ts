/**
 * @file lib/static-demo-explanations.ts
 *
 * Local, pre-authored explanation fallbacks for the three synthetic samples.
 * These are returned only before a provider attempt can begin (public mode,
 * a missing key, or a local capacity guard), and their origin is always
 * labeled separately by the API response contract.
 */

import { analyzePhishingSignals } from "./phishing-signal-engine";
import { sampleEmails } from "./sample-emails";
import type { EmailInput } from "./schemas";
import type { AiExplanation } from "./ai-explanation-schema";

const signalGuidance: Record<AiExplanation["signalExplanations"][number]["signalId"], string> = {
  urgency: "Time-sensitive wording can make it harder to pause. Use a known contact path before acting on an unexpected deadline.",
  "credential-request": "Requests for a password, account code, or account information should be checked through the service's known website or support channel before sharing information.",
  "threat-loss-pressure": "Language about losing money, access, or data can pressure a quick response. Check the claim through an independently found account or support route.",
  "payment-request": "Payment or billing requests are worth confirming against a vendor record or a known billing portal before entering financial details.",
  "authority-pressure": "A claimed authority role is paired with a request, so checking through a known organization channel is useful before acting.",
  "generic-salutation-request": "A broad greeting paired with a request is a detail to verify independently; it does not establish who sent the message.",
  "account-or-reward-lure": "An account or reward message is paired with pressure or a request, so use a known account route to check it instead of reacting through the message.",
  "lookalike-domain": "The sender domain contains a character pattern that can be used to imitate familiar names, so checking the address through a known channel is useful.",
  "internationalized-sender-domain": "An internationalized sender-domain format is an informational detail. It can be legitimate, so compare it with a known contact path when verification is appropriate.",
  "malformed-sender-address": "The pasted sender text does not form a locally readable address. Check the contact through a trusted directory or known organization channel.",
  "provided-url": "A supplied URL is an informational detail. Verify it independently by using a known website rather than opening the link from the message.",
  "url-structure": "A visible URL structure detail is worth checking through a known website. PhishLens has not opened or contacted the supplied URL.",
  "sender-url-mismatch": "Different sender and URL domains can have legitimate reasons, but they are useful details to verify through a known organization channel.",
  "risky-attachment-reference": "The message text refers to a high-risk file type. PhishLens has not opened or inspected an attachment, so confirm the request through a known contact path.",
};

const summaryBySampleId: Record<(typeof sampleEmails)[number]["id"], string> = {
  "account-review": "This synthetic example combines account-access pressure, a credential request, and a sender-domain character cue that support pausing and independently verifying the request before sharing account information.",
  "invoice-alert": "This synthetic example combines time pressure and a payment request, which are useful prompts to verify billing details through a known channel.",
  "team-update": "This synthetic example did not match the local rule set. That result is not a safety verdict, so normal independent verification still applies when needed.",
};

/** Compares all submitted fields so only the unchanged local samples receive a static fallback. */
function isExactSample(input: EmailInput, sample: (typeof sampleEmails)[number]): boolean {
  return (
    input.sender === sample.sender &&
    input.subject === sample.subject &&
    input.body === sample.body &&
    (input.url ?? "") === sample.url
  );
}

/** Returns a clearly local, deterministic explanation for one of the three sample fixtures. */
export function getStaticDemoExplanation(input: EmailInput): AiExplanation | null {
  const sample = sampleEmails.find((item) => isExactSample(input, item));

  if (!sample) return null;

  const analysis = analyzePhishingSignals(sample);

  return {
    educationalSummary: summaryBySampleId[sample.id],
    signalExplanations: analysis.signals.map((signal) => ({
      signalId: signal.id,
      explanation: signalGuidance[signal.id],
    })),
    suggestedNextSteps: analysis.nextSteps.slice(0, 3),
  };
}
