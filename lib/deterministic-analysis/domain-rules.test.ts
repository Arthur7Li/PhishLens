/** Synthetic, no-network coverage for conservative sender and URL observations. */

import { describe, expect, it, vi } from "vitest";
import { analyzePhishingSignals } from "../phishing-signal-engine";
import {
  getComparableDomain,
  getSenderDomain,
  getSuppliedUrlHost,
  inspectSender,
  inspectSuppliedUrl,
} from "./domain";
import type { EmailInput, SignalId } from "../schemas";

const baseInput: EmailInput = {
  sender: "Jordan Lee <jordan@harbor-studio.example>",
  subject: "Planning notes",
  body: "Here are the notes from our planning session.",
  url: "",
};

function ids(overrides: Partial<EmailInput>): SignalId[] {
  return analyzePhishingSignals({ ...baseInput, ...overrides }).signals.map((signal) => signal.id);
}

describe("sender structure", () => {
  it("keeps the existing conservative digit-for-letter sender rule", () => {
    expect(ids({ sender: "Account <support@micros0ft-verify.example>" })).toContain("lookalike-domain");
    expect(ids({ sender: "Updates <news@service2026.example>" })).not.toContain("lookalike-domain");
  });

  it("records internationalized sender formats as informational only", () => {
    const report = analyzePhishingSignals({ ...baseInput, sender: "Account <help@xn--microsft-9za.example>" });
    const signal = report.signals.find((item) => item.id === "internationalized-sender-domain");

    expect(signal).toMatchObject({ source: "sender", riskWeight: 0 });
    expect(report.riskLevel).toBe("informational");
  });

  it("flags only clearly unreadable pasted sender-address structures", () => {
    expect(ids({ sender: "Accounts <support@@portal.example>" })).toContain("malformed-sender-address");
    expect(ids({ sender: "Jordan Lee" })).not.toContain("malformed-sender-address");
  });

  it("parses Unicode sender domains locally without a network lookup", () => {
    expect(getSenderDomain("Miyuki <contact@例え.example>")).toBe("例え.example");
    expect(inspectSender("Miyuki <contact@例え.example>").malformedAddress).toBeNull();
  });
});

describe("supplied URL structure", () => {
  it.each([
    ["https://known.example@billing.example/pay", "URL contains text before its host"],
    ["https://%31%39%32.0.2.24/portal", "Encoded URL host text"],
    ["https://192.0.2.24/portal", "IP-literal URL host"],
    ["https://xn--paypa-4ve.example/portal", "Punycode URL host"],
    ["https://portal.example:8443/login", "Unusual URL port"],
    ["http://portal.example/login", "HTTP URL supplied"],
    ["https://one.two.three.four.example/login", "Deeply nested URL host"],
    ["javascript:alert(1)", "Non-web URL scheme supplied"],
  ])("records one local URL structure detail for %s", (url, title) => {
    const report = analyzePhishingSignals({ ...baseInput, url });

    expect(report.signals.find((signal) => signal.id === "provided-url")).toMatchObject({ riskWeight: 0 });
    expect(report.signals.find((signal) => signal.id === "url-structure")).toMatchObject({ title });
  });

  it("keeps URL presence informational when no additional structure rule applies", () => {
    const report = analyzePhishingSignals({ ...baseInput, url: "https://harbor-studio.example/notes" });

    expect(report.signals.map((signal) => signal.id)).toEqual(["provided-url"]);
    expect(report.riskLevel).toBe("informational");
  });

  it("does not fetch or resolve supplied URL text", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    analyzePhishingSignals({ ...baseInput, url: "https://192.0.2.24/portal" });

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("compares local comparable domains conservatively, including common multi-label suffixes", () => {
    expect(getComparableDomain("portal.example.co.uk")).toBe("example.co.uk");
    expect(ids({ sender: "Updates <news@harbor.example.co.uk>", url: "https://www.harbor.example.co.uk/notes" })).not.toContain("sender-url-mismatch");
    expect(ids({ sender: "Updates <news@harbor.example.co.uk>", url: "https://billing.other.co.uk/pay" })).toContain("sender-url-mismatch");
  });

  it("handles malformed URL text without throwing or inventing a structure cue", () => {
    const report = analyzePhishingSignals({ ...baseInput, url: "not a URL" });

    expect(report.signals.map((signal) => signal.id)).toEqual(["provided-url"]);
    expect(inspectSuppliedUrl("not a URL").url).toBeNull();
    expect(getSuppliedUrlHost("not a URL")).toBeNull();
  });
});
