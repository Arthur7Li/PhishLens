/**
 * Sender and supplied-URL rules for the browser-local deterministic engine.
 *
 * URL rules are lexical and structural only. They never open a destination,
 * look up a domain, assess reputation, or claim that a URL is harmful.
 */

import type { EmailInput, SignalFinding } from "../schemas";
import { quoteEvidence } from "./evidence";
import {
  findDigitSubstitution,
  getSenderDomain,
  getSuppliedUrlHost,
  haveDifferentComparableDomains,
  inspectSender,
  inspectSuppliedUrl,
  isInternationalizedDomain,
  isIpLiteralHost,
} from "./domain";
import type { SignalRule } from "./rule-types";

type UrlStructure = Pick<SignalFinding, "title" | "evidence" | "explanation" | "level" | "riskWeight">;

/** Returns one highest-priority URL structure observation to avoid double-counting one link. */
function getUrlStructure(input: EmailInput): UrlStructure | null {
  const inspection = inspectSuppliedUrl(input.url ?? "");
  const { raw, url, host, rawHost } = inspection;

  if (!raw || !url) return null;

  if (["javascript:", "data:", "file:"].includes(url.protocol)) {
    return {
      title: "Non-web URL scheme supplied",
      evidence: quoteEvidence(url.protocol),
      explanation: "The supplied text uses a non-web URL scheme. PhishLens does not open it; use a known route to verify why that scheme was included.",
      level: "review",
      riskWeight: 1,
    };
  }

  if (url.username) {
    return {
      title: "URL contains text before its host",
      evidence: quoteEvidence(raw),
      explanation: "The supplied URL contains an @-style user-information section before its host. This is a structural detail worth checking by using a known website instead of the supplied link.",
      level: "elevated",
      riskWeight: 2,
    };
  }

  if (rawHost && /%[\da-f]{2}/iu.test(rawHost)) {
    return {
      title: "Encoded URL host text",
      evidence: quoteEvidence(rawHost),
      explanation: "The host portion of the supplied URL contains percent-encoded text. This local observation does not resolve the destination, so use a known website rather than interpreting the link text.",
      level: "review",
      riskWeight: 2,
    };
  }

  if (host && isIpLiteralHost(host)) {
    return {
      title: "IP-literal URL host",
      evidence: quoteEvidence(host),
      explanation: "The supplied URL uses a numeric network address instead of a domain name. This is a structural detail to verify independently; PhishLens has not contacted that address.",
      level: "review",
      riskWeight: 1,
    };
  }

  if (host && /(^|\.)xn--/iu.test(host)) {
    return {
      title: "Punycode URL host",
      evidence: quoteEvidence(host),
      explanation: "The supplied URL host uses an ASCII internationalized-domain encoding. That format can be legitimate, so this is a local detail for independent verification rather than a conclusion about the destination.",
      level: "review",
      riskWeight: 1,
    };
  }

  if (url.port && url.port !== "80" && url.port !== "443") {
    return {
      title: "Unusual URL port",
      evidence: quoteEvidence(`${host ?? "URL host"}:${url.port}`),
      explanation: "The supplied URL specifies a non-default network port. This is a structural detail worth checking through a known website or contact path.",
      level: "caution",
      riskWeight: 1,
    };
  }

  if (url.protocol === "http:") {
    return {
      title: "HTTP URL supplied",
      evidence: quoteEvidence("http:"),
      explanation: "The supplied URL uses HTTP rather than HTTPS. That does not establish anything about the destination, but it is a reason to use a known website instead of the supplied link.",
      level: "caution",
      riskWeight: 1,
    };
  }

  if (host && host.split(".").filter(Boolean).length >= 5) {
    return {
      title: "Deeply nested URL host",
      evidence: quoteEvidence(host),
      explanation: "The supplied URL host has many dot-separated labels. This is a lexical detail that can be hard to read, so use a known website to verify the intended destination.",
      level: "caution",
      riskWeight: 1,
    };
  }

  return null;
}

/** Creates sender and URL rules in a stable order after message-language cues. */
export const domainSignalRules: readonly SignalRule[] = [
  {
    id: "lookalike-domain",
    evaluate(input) {
      const domain = getSenderDomain(input.sender);
      const pattern = domain ? findDigitSubstitution(domain) : null;

      return domain && pattern ? {
        id: "lookalike-domain",
        title: "Character substitution in sender domain",
        source: "sender",
        evidence: `The sender domain contains ${quoteEvidence(pattern.token)}, where ${quoteEvidence(pattern.digit)} can resemble ${quoteEvidence(pattern.replacement)}.`,
        explanation: "This is a character pattern that can be used to imitate familiar names. It does not establish intent or identity on its own.",
        level: "review",
        riskWeight: 2,
      } : null;
    },
  },
  {
    id: "internationalized-sender-domain",
    evaluate(input) {
      const domain = getSenderDomain(input.sender);

      return domain && isInternationalizedDomain(domain) ? {
        id: "internationalized-sender-domain",
        title: "Internationalized sender-domain format",
        source: "sender",
        evidence: quoteEvidence(domain),
        explanation: "The sender domain uses Unicode characters or its punycode representation. Internationalized domains can be legitimate, so this is an informational detail for independent verification.",
        level: "caution",
        riskWeight: 0,
      } : null;
    },
  },
  {
    id: "malformed-sender-address",
    evaluate(input) {
      const inspection = inspectSender(input.sender);

      return inspection.malformedAddress ? {
        id: "malformed-sender-address",
        title: "Unclear sender-address structure",
        source: "sender",
        evidence: quoteEvidence(inspection.malformedAddress),
        explanation: "The pasted sender text contains an @ sign but does not form a locally readable address. This can be a formatting issue, so check the sender through a trusted directory or known contact method.",
        level: "caution",
        riskWeight: 1,
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
        evidence: quoteEvidence(value),
        explanation: "A supplied URL is noted for independent verification. Use a known website or trusted contact method instead of opening it from the message.",
        level: "caution",
        riskWeight: 0,
      } : null;
    },
  },
  {
    id: "url-structure",
    evaluate(input) {
      const structure = getUrlStructure(input);

      return structure ? {
        id: "url-structure",
        source: "url",
        ...structure,
      } : null;
    },
  },
  {
    id: "sender-url-mismatch",
    evaluate(input) {
      const senderDomain = getSenderDomain(input.sender);
      const urlHost = getSuppliedUrlHost(input.url?.trim() ?? "");

      return senderDomain && urlHost && haveDifferentComparableDomains(senderDomain, urlHost) ? {
        id: "sender-url-mismatch",
        title: "Sender and URL domains differ",
        source: "url",
        evidence: `Sender domain: ${quoteEvidence(senderDomain)}; supplied URL host: ${quoteEvidence(urlHost)}.`,
        explanation: "Different domains can have legitimate reasons, but this is a useful detail to verify through a known organization channel.",
        level: "review",
        riskWeight: 1,
      } : null;
    },
  },
];
