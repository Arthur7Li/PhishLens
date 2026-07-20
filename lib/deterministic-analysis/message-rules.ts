/**
 * Transparent rules for observable message-language cues.
 *
 * Each rule deliberately requires a concrete request, pressure pattern, or
 * visible filename. Brand names, ordinary greetings, and broad grammar are
 * not enough to create a local finding.
 */

import type { EmailInput } from "../schemas";
import { combineEvidence, findFirstActionableTextMatch, findFirstTextMatch, quoteEvidence, type TextMatch } from "./evidence";
import type { SignalRule } from "./rule-types";

const urgencyPattern = /\b(?:urgent|immediately|right\s+now|action required|final notice|within\s+\d+\s+(?:minutes?|hours?)|(?:review|pay|respond|confirm|complete)\s+(?:by\s+)?today|avoid\s+(?:service\s+)?(?:suspension|interruption)|account(?:\s+access)?\s+(?:has been|will be)\s+(?:suspended|limited|disabled|restricted))\b/i;
const credentialRequestPattern = /\b(?:enter|provide|share|submit|confirm|verify|reset)\s+(?:your\s+)?(?:password|passcode|verification code|security code|one-time code|mfa code|authentication code|recovery code|login credentials?)\b|\b(?:click|open|use)\s+(?:the\s+)?(?:sign-in|login|authentication)\s+(?:link|portal)\b/i;
const accountDetailsRequestPattern = /\b(?:provide|share|submit|confirm|verify)\s+(?:your\s+)?account\s+(?:details|information)\b/i;
const accountDetailsCorroborationPattern = /\b(?:account\s+security|security\s+alert|unknown\s+sign[\s-]?in|unrecognized\s+(?:sign[\s-]?in|login)|suspicious\s+(?:sign[\s-]?in|login|activity)|(?:money|funds)\s+(?:might|may|could|will)\s+be\s+lost|(?:lose|losing)\s+(?:your\s+)?(?:money|funds))\b/i;
const threatLossPressurePattern = /\b(?:(?:your\s+)?(?:money|funds|account|access|data)\s+(?:might|may|could|will)\s+be\s+(?:lost|locked|restricted|suspended|disabled)|(?:lose|losing)\s+(?:your\s+)?(?:money|funds|account|access|data)|(?:risk|avoid)\s+(?:losing|loss\s+of)\s+(?:your\s+)?(?:money|funds|account|access|data))\b/i;
const paymentRequestPattern = /\b(?:pay|send|transfer|wire|remit|purchase)\s+(?:an?\s+)?(?:payment|invoice|gift cards?|cryptocurrency|crypto|bitcoin|wire transfers?|bank details?|bank account)\b|\b(?:enter|update|confirm)\s+(?:your\s+)?(?:(?:password|passcode|code)\s+and\s+)?(?:billing|bank)\s+details\b|\b(?:immediate|urgent)\s+(?:payment|wire transfer)\b/i;
const authorityPattern = /\b(?:it\s+(?:support|department|team)|help\s*desk|security\s+team|fraud\s+department|government\s+agency|tax\s+office|delivery\s+service|executive\s+office|chief\s+executive|ceo|human\s+resources)\b/i;
const genericSalutationPattern = /^\s*(?:dear\s+(?:customer|user|member|account holder|client)|valued\s+customer)\b/i;
const lurePattern = /\b(?:account(?:\s+access)?\s+(?:has been|will be)\s+(?:suspended|locked|limited|disabled|restricted)|(?:refund|reward|prize|bonus)\s+(?:is\s+)?(?:available|pending|waiting)|claim\s+(?:your\s+)?(?:refund|reward|prize|bonus))\b/i;
const lureActionPattern = /\b(?:claim|click|respond|confirm|verify|complete)\b/i;
const riskyAttachmentPatterns = [
  /\b(?:open|download|run)\s+(?:the\s+)?(?:attached\s+)?(?:file\s+)?([a-z\d][a-z\d._ -]{0,80}\.(?:exe|scr|js|jse|vbs|vbe|bat|cmd|ps1|msi|jar|iso|img|lnk))\b/i,
  /\b(?:attached|attachment)\s*(?:file)?\s*[:\-]?\s*([a-z\d][a-z\d._ -]{0,80}\.(?:exe|scr|js|jse|vbs|vbe|bat|cmd|ps1|msi|jar|iso|img|lnk))\b/i,
];

/** Reads one exact sensitive-request excerpt without reinterpreting the sender or a URL. */
function findSensitiveRequest(input: EmailInput): TextMatch | null {
  return findCredentialRequest(input) ?? findFirstActionableTextMatch(input, paymentRequestPattern);
}

/** Applies a corroboration requirement so neutral support wording stays out of this cue. */
function findCredentialRequest(input: EmailInput): TextMatch | null {
  const directCredentialMatch = findFirstActionableTextMatch(input, credentialRequestPattern);
  if (directCredentialMatch) return directCredentialMatch;

  const accountDetailsMatch = findFirstActionableTextMatch(input, accountDetailsRequestPattern);

  // "Account details" can be routine support language. Treat it as a
  // credential-adjacent request only when the same pasted message also makes a
  // concrete account-compromise or financial-loss claim.
  return accountDetailsMatch && findFirstTextMatch(input, accountDetailsCorroborationPattern) ? accountDetailsMatch : null;
}

/** Returns one exact risky attachment-reference excerpt only when a request verb or label is visible. */
function findRiskyAttachmentReference(input: EmailInput): TextMatch | null {
  for (const pattern of riskyAttachmentPatterns) {
    const match = findFirstActionableTextMatch(input, pattern);
    if (match) return match;
  }

  return null;
}

/** Creates the message-language rules in a stable, deduplicated display order. */
export const messageSignalRules: readonly SignalRule[] = [
  {
    id: "urgency",
    evaluate(input) {
      const match = findFirstActionableTextMatch(input, urgencyPattern);

      return match ? {
        id: "urgency",
        title: "Time pressure or consequence language",
        source: match.source,
        evidence: quoteEvidence(match.text),
        explanation: "Time pressure or a stated consequence can make it harder to pause and use an independent verification path.",
        level: "review",
        riskWeight: 1,
      } : null;
    },
  },
  {
    id: "credential-request",
    evaluate(input) {
      const match = findCredentialRequest(input);

      return match ? {
        id: "credential-request",
        title: "Credential or account-information request",
        source: match.source,
        evidence: quoteEvidence(match.text),
        explanation: "A request for a password, account code, recovery code, authentication link, or corroborated account information is worth checking through a known service path before sharing information.",
        level: "elevated",
        riskWeight: 2,
      } : null;
    },
  },
  {
    id: "threat-loss-pressure",
    evaluate(input) {
      const match = findFirstActionableTextMatch(input, threatLossPressurePattern);

      return match ? {
        id: "threat-loss-pressure",
        title: "Threat or loss-pressure language",
        source: match.source,
        evidence: quoteEvidence(match.text),
        explanation: "A stated risk of losing money, access, or data can pressure a quick response. Verify the claimed issue through an independently found account or support route.",
        level: "review",
        riskWeight: 1,
      } : null;
    },
  },
  {
    id: "payment-request",
    evaluate(input) {
      const match = findFirstActionableTextMatch(input, paymentRequestPattern);

      return match ? {
        id: "payment-request",
        title: "Financial or payment request",
        source: match.source,
        evidence: quoteEvidence(match.text),
        explanation: "A request to pay, transfer funds, use gift cards or crypto, or change billing details should be confirmed through a known vendor record or payment channel.",
        level: "elevated",
        riskWeight: 2,
      } : null;
    },
  },
  {
    id: "authority-pressure",
    evaluate(input) {
      const authorityMatch = findFirstTextMatch(input, authorityPattern);
      const requestMatch = findFirstActionableTextMatch(input, urgencyPattern) ?? findSensitiveRequest(input);

      return authorityMatch && requestMatch ? {
        id: "authority-pressure",
        title: "Authority role paired with a request",
        source: authorityMatch.source,
        evidence: combineEvidence(authorityMatch.text, requestMatch.text),
        explanation: "An authority role is paired with time pressure or a sensitive request. Role language alone does not establish identity, so use a known contact path to check the request.",
        level: "review",
        riskWeight: 1,
      } : null;
    },
  },
  {
    id: "generic-salutation-request",
    evaluate(input) {
      const salutation = input.body.match(genericSalutationPattern)?.[0];
      const requestMatch = findFirstActionableTextMatch(input, urgencyPattern) ?? findSensitiveRequest(input);

      return salutation && requestMatch ? {
        id: "generic-salutation-request",
        title: "Generic salutation paired with a request",
        source: "body",
        evidence: combineEvidence(salutation, requestMatch.text),
        explanation: "A broad salutation is paired with time pressure or a sensitive request. That combination can be useful to verify independently, but it does not establish who sent the message.",
        level: "caution",
        riskWeight: 1,
      } : null;
    },
  },
  {
    id: "account-or-reward-lure",
    evaluate(input) {
      const lureMatch = findFirstActionableTextMatch(input, lurePattern);
      const hasPairedAction = findFirstActionableTextMatch(input, urgencyPattern) !== null || findFirstActionableTextMatch(input, lureActionPattern) !== null || findSensitiveRequest(input) !== null;

      return lureMatch && hasPairedAction ? {
        id: "account-or-reward-lure",
        title: "Account, refund, or reward pressure",
        source: lureMatch.source,
        evidence: quoteEvidence(lureMatch.text),
        explanation: "An account restriction, refund, reward, or prize message is paired with a request or time pressure. Use an independent route to check the account or offer rather than reacting through the message.",
        level: "review",
        riskWeight: 1,
      } : null;
    },
  },
  {
    id: "risky-attachment-reference",
    evaluate(input) {
      const match = findRiskyAttachmentReference(input);

      return match ? {
        id: "risky-attachment-reference",
        title: "Risky file type referenced in text",
        source: match.source,
        evidence: quoteEvidence(match.text),
        explanation: "The message text asks the reader to open or download a file with a high-risk extension. PhishLens has not opened or inspected any attachment; verify the request through a known contact path instead.",
        level: "elevated",
        riskWeight: 2,
      } : null;
    },
  },
];
