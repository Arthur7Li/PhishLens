/**
 * @file lib/signal-rules.ts
 *
 * Transparent, local-only signal rules for PhishLens Phase B.
 *
 * Every rule inspects only strings already present in `EmailInput`; none opens
 * URLs, contacts a sender, stores content, or calls an external service. Rules
 * report observable text patterns, not malicious intent or safety verdicts.
 */

import type { EmailInput, SignalFinding, SignalSource } from "./schemas";

/** A single deterministic rule that can return one transparent finding. */
export type SignalRule = {
  id: SignalFinding["id"];
  evaluate: (input: EmailInput) => SignalFinding | null;
};

type TextMatch = {
  source: SignalSource;
  evidence: string;
};

const urgencyPattern = /\b(urgent|immediately|action required|final notice|within\s+\d+\s+(?:minutes?|hours?)|(?:review|pay|respond|confirm|complete)\s+(?:by\s+)?today)\b/i;
const credentialPattern = /\b(password|passcode|verification code|security code|one-time code|login credentials|sign in)\b/i;
const paymentPattern = /\b(?:payment\s+(?:today|immediately|now)|pay\s+(?:today|immediately|now)|enter\s+(?:your\s+)?(?:billing|bank)\s+details|(?:billing|bank)\s+details)\b/i;
const emailAddressPattern = /[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})/i;
const digitSubstitutions: Record<string, string> = { "0": "o", "1": "i or l", "3": "e", "5": "s", "7": "t" };

/** Returns the first matching text fragment from the subject or body, in display order. */
function findTextMatch(input: EmailInput, pattern: RegExp): TextMatch | null {
  const fields: Array<[SignalSource, string]> = [["subject", input.subject], ["body", input.body]];

  for (const [source, value] of fields) {
    const match = value.match(pattern);
    if (match) return { source, evidence: `“${match[0]}”` };
  }

  return null;
}

/** Extracts an email domain from the displayed sender string without resolving it. */
export function getSenderDomain(sender: string): string | null {
  return sender.match(emailAddressPattern)?.[1]?.toLowerCase() ?? null;
}

/** Parses a user-supplied HTTP(S) URL locally and returns its hostname when valid. */
export function getSuppliedUrlHost(value: string): string | null {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.hostname.toLowerCase() : null;
  } catch {
    return null;
  }
}

/** Determines whether two hosts are identical or nested subdomains of one another. */
function areRelatedHosts(first: string, second: string): boolean {
  return first === second || first.endsWith(`.${second}`) || second.endsWith(`.${first}`);
}

/** Finds one conservative digit-for-letter substitution within a sender-domain token. */
function findLookalikeToken(domain: string): { token: string; replacement: string } | null {
  for (const label of domain.split(".")) {
    for (const token of label.split("-")) {
      const digits = token.match(/[01357]/g) ?? [];
      const digit = digits[0];

      // Require exactly one mapped digit, surrounded by at least four letters.
      // This avoids treating routine numeric labels such as `service2026` as look-alikes.
      if (!digit || digits.length !== 1 || !/^[a-z0-9]+$/i.test(token) || token.length < 5) continue;

      const digitIndex = token.indexOf(digit);
      if (digitIndex === 0 || digitIndex === token.length - 1) continue;
      if (!/^[a-z]+$/i.test(token.replace(digit, ""))) continue;

      return { token, replacement: digitSubstitutions[digit] };
    }
  }

  return null;
}

/** The complete, ordered rule set used by the Phase B deterministic evaluator. */
export const signalRules: readonly SignalRule[] = [
  {
    id: "urgency",
    evaluate(input) {
      const match = findTextMatch(input, urgencyPattern);
      return match ? {
        id: "urgency",
        title: "Time-sensitive language",
        source: match.source,
        evidence: match.evidence,
        explanation: "Time pressure can make it harder to pause and verify an unexpected request through a known channel.",
        level: "review",
        riskWeight: 1,
      } : null;
    },
  },
  {
    id: "credential-request",
    evaluate(input) {
      const match = findTextMatch(input, credentialPattern);
      return match ? {
        id: "credential-request",
        title: "Sensitive credential request",
        source: match.source,
        evidence: match.evidence,
        explanation: "Requests for passwords or codes should be verified independently before sharing any account information.",
        level: "elevated",
        riskWeight: 2,
      } : null;
    },
  },
  {
    id: "payment-request",
    evaluate(input) {
      const match = findTextMatch(input, paymentPattern);
      return match ? {
        id: "payment-request",
        title: "Sensitive payment request",
        source: match.source,
        evidence: match.evidence,
        explanation: "Payment or banking requests are worth confirming through a vendor record or known billing portal.",
        level: "elevated",
        riskWeight: 2,
      } : null;
    },
  },
  {
    id: "lookalike-domain",
    evaluate(input) {
      const domain = getSenderDomain(input.sender);
      const pattern = domain ? findLookalikeToken(domain) : null;
      return domain && pattern ? {
        id: "lookalike-domain",
        title: "Character substitution in sender domain",
        source: "sender",
        evidence: `The sender domain contains “${pattern.token}”, where “${pattern.token.match(/[01357]/)?.[0]}” can resemble “${pattern.replacement}”.`,
        explanation: "This is a character pattern that can be used to imitate familiar names. It does not establish intent or identity on its own.",
        level: "review",
        riskWeight: 2,
      } : null;
    },
  },
  {
    id: "provided-url",
    evaluate(input) {
      const value = input.url?.trim() ?? "";
      return value ? {
        id: "provided-url",
        title: "URL supplied in message",
        source: "url",
        evidence: `“${value}”`,
        explanation: "A supplied URL is noted for independent verification. Use a known website or trusted contact method instead of opening it from the message.",
        level: "caution",
        riskWeight: 0,
      } : null;
    },
  },
  {
    id: "sender-url-mismatch",
    evaluate(input) {
      const senderDomain = getSenderDomain(input.sender);
      const urlHost = getSuppliedUrlHost(input.url?.trim() ?? "");
      return senderDomain && urlHost && !areRelatedHosts(senderDomain, urlHost) ? {
        id: "sender-url-mismatch",
        title: "Sender and URL domains differ",
        source: "url",
        evidence: `Sender domain: “${senderDomain}”; supplied URL host: “${urlHost}”.`,
        explanation: "Different domains can have legitimate reasons, but this is a useful detail to verify through a known organization channel.",
        level: "review",
        riskWeight: 1,
      } : null;
    },
  },
];
