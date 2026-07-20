/**
 * Local sender and URL parsing helpers.
 *
 * These helpers inspect only strings that were pasted into PhishLens. They do
 * not resolve DNS, fetch a URL, follow a redirect, or validate ownership.
 */

const bracketedAddressPattern = /<\s*([^<>\s]+@[^<>\s]+)\s*>/u;
const standaloneAddressPattern = /([^\s<>()@]+@[^\s<>()@]+)/u;
const unicodeDomainLabelPattern = /^[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?$/u;
const ipv4Pattern = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const multiLabelPublicSuffixes = new Set([
  "ac.uk", "co.uk", "gov.uk", "ltd.uk", "me.uk", "net.uk", "org.uk",
  "com.au", "net.au", "org.au", "edu.au", "gov.au",
  "co.nz", "org.nz", "govt.nz",
  "co.jp", "ne.jp", "or.jp",
  "co.in", "firm.in", "net.in", "org.in",
  "com.br", "com.mx", "com.sg", "com.tr",
]);
const digitSubstitutions: Record<string, string> = { "0": "o", "1": "i or l", "3": "e", "5": "s", "7": "t" };

export type SenderInspection = {
  address: string | null;
  domain: string | null;
  malformedAddress: string | null;
};

export type SuppliedUrlInspection = {
  raw: string;
  url: URL | null;
  host: string | null;
  rawHost: string | null;
};

/** Extracts the most explicit email-shaped value without assuming the display name is an address. */
function getAddressCandidate(sender: string): string | null {
  const bracketed = sender.match(bracketedAddressPattern)?.[1];
  if (bracketed) return bracketed;

  return sender.match(standaloneAddressPattern)?.[1] ?? null;
}

/** Validates only the local structure needed to read a domain; it does not verify delivery or identity. */
function getValidDomain(address: string): string | null {
  const firstAt = address.indexOf("@");
  const lastAt = address.lastIndexOf("@");

  if (firstAt <= 0 || firstAt !== lastAt || firstAt === address.length - 1) return null;

  const domain = address.slice(firstAt + 1).replace(/\.$/u, "").toLowerCase();
  const labels = domain.split(".");

  if (!domain || labels.some((label) => !unicodeDomainLabelPattern.test(label))) return null;

  return domain;
}

/** Returns parsed sender data while treating ambiguous display-only names as non-findings. */
export function inspectSender(sender: string): SenderInspection {
  const address = getAddressCandidate(sender);

  if (!address) {
    return {
      address: null,
      domain: null,
      malformedAddress: sender.includes("@") ? sender.trim() : null,
    };
  }

  const domain = getValidDomain(address);

  return {
    address,
    domain,
    malformedAddress: domain ? null : address,
  };
}

/** Extracts a sender domain locally without resolving it or inferring ownership. */
export function getSenderDomain(sender: string): string | null {
  return inspectSender(sender).domain;
}

/** Returns whether a sender domain visibly uses Unicode or its ASCII punycode form. */
export function isInternationalizedDomain(domain: string): boolean {
  return /(^|\.)xn--/iu.test(domain) || /[^\u0000-\u007f]/u.test(domain);
}

/** Finds one conservative digit-for-letter substitution in an otherwise alphabetic label token. */
export function findDigitSubstitution(domain: string): { token: string; digit: string; replacement: string } | null {
  for (const label of domain.split(".")) {
    for (const token of label.split("-")) {
      const digits = token.match(/[01357]/g) ?? [];
      const digit = digits[0];

      if (!digit || digits.length !== 1 || !/^[a-z0-9]+$/i.test(token) || token.length < 5) continue;

      const digitIndex = token.indexOf(digit);
      if (digitIndex === 0 || digitIndex === token.length - 1) continue;
      if (!/^[a-z]+$/i.test(token.replace(digit, ""))) continue;

      return { token, digit, replacement: digitSubstitutions[digit] };
    }
  }

  return null;
}

/** Parses a supplied URL locally and retains its raw host text for lexical-only observations. */
export function inspectSuppliedUrl(value: string): SuppliedUrlInspection {
  const raw = value.trim();
  const authority = raw.match(/^[a-z][a-z\d+.-]*:\/\/([^/?#]*)/iu)?.[1] ?? null;
  const rawHost = authority ? authority.replace(/^.*@/u, "").replace(/:\d+$/u, "") : null;

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^\[|\]$/gu, "").toLowerCase();
    return { raw, url, host: host || null, rawHost };
  } catch {
    return { raw, url: null, host: null, rawHost };
  }
}

/** Returns an HTTP(S) host only; no network request is made. */
export function getSuppliedUrlHost(value: string): string | null {
  const inspection = inspectSuppliedUrl(value);

  return inspection.url?.protocol === "http:" || inspection.url?.protocol === "https:"
    ? inspection.host
    : null;
}

/** Identifies an IPv4 or IPv6 literal without contacting it. */
export function isIpLiteralHost(host: string): boolean {
  if (ipv4Pattern.test(host)) return host.split(".").every((part) => Number(part) <= 255);

  return host.includes(":");
}

/**
 * Returns a conservative comparable domain for local sender/URL comparison.
 * The small suffix list handles common multi-label suffixes without claiming
 * complete Public Suffix List coverage; unknown formats simply use the last
 * two labels.
 */
export function getComparableDomain(host: string): string | null {
  const normalized = host.replace(/\.$/u, "").toLowerCase();

  if (!normalized || isIpLiteralHost(normalized)) return null;

  const labels = normalized.split(".").filter(Boolean);
  if (labels.length < 2) return null;

  const possibleSuffix = labels.slice(-2).join(".");
  const suffixLength = multiLabelPublicSuffixes.has(possibleSuffix) ? 2 : 1;

  return labels.length > suffixLength ? labels.slice(-(suffixLength + 1)).join(".") : null;
}

/** Compares local sender and URL domains only when both have a usable comparable domain. */
export function haveDifferentComparableDomains(senderDomain: string, urlHost: string): boolean {
  const senderComparable = getComparableDomain(senderDomain);
  const urlComparable = getComparableDomain(urlHost);

  return Boolean(senderComparable && urlComparable && senderComparable !== urlComparable);
}
