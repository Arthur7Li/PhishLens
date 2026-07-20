/**
 * @file lib/phishing-signal-engine.test.ts
 *
 * Unit tests for the deterministic Phase B engine. Test inputs are inline
 * fixtures only; they do not add visible samples to the application.
 */

import { describe, expect, it, vi } from "vitest";
import { analyzePhishingSignals } from "./phishing-signal-engine";
import { sampleEmails } from "./sample-emails";
import { analysisSchema, type EmailInput } from "./schemas";

const baseInput: EmailInput = {
  sender: "Jordan Lee <jordan@harbor-studio.example>",
  subject: "Planning notes",
  body: "Here are the notes from our planning session.",
  url: "",
};

/** Creates an isolated input fixture while keeping each test focused on one rule. */
function makeInput(overrides: Partial<EmailInput>): EmailInput {
  return { ...baseInput, ...overrides };
}

/** Returns the rule IDs from a report for concise rule-level assertions. */
function signalIds(input: EmailInput): string[] {
  return analyzePhishingSignals(input).signals.map((signal) => signal.id);
}

describe("analyzePhishingSignals", () => {
  it("detects urgency case-insensitively and preserves the matching evidence", () => {
    const input = makeInput({ subject: "URGENT: review today" });
    const report = analyzePhishingSignals(input);

    expect(signalIds(input)).toContain("urgency");
    expect(report.signals.find((signal) => signal.id === "urgency")).toMatchObject({ source: "subject", evidence: "“URGENT”", riskWeight: 1 });
  });

  it("detects credential and payment requests as separate observable cues", () => {
    const report = analyzePhishingSignals(makeInput({ body: "Enter your password and billing details immediately." }));

    expect(report.signals.map((signal) => signal.id)).toEqual(expect.arrayContaining(["credential-request", "payment-request", "urgency"]));
    expect(report.riskLevel).toBe("elevated");
  });

  it("evaluates the three existing synthetic samples without adding new visible fixtures", () => {
    const accountReview = analyzePhishingSignals(sampleEmails[0]);
    const invoiceAlert = analyzePhishingSignals(sampleEmails[1]);
    const routineUpdate = analyzePhishingSignals(sampleEmails[2]);

    expect(accountReview.signals.map((signal) => signal.id)).toEqual(expect.arrayContaining(["urgency", "credential-request", "lookalike-domain", "provided-url"]));
    expect(invoiceAlert.signals.map((signal) => signal.id)).toEqual(expect.arrayContaining(["urgency", "payment-request", "provided-url"]));
    expect(routineUpdate.signals).toHaveLength(0);
  });

  it("detects only conservative digit-for-letter substitutions in sender-domain tokens", () => {
    const report = analyzePhishingSignals(makeInput({ sender: "Account <support@micros0ft-verify.example>" }));

    expect(report.signals.find((signal) => signal.id === "lookalike-domain")).toMatchObject({ source: "sender", riskWeight: 2 });
    expect(report.signals.find((signal) => signal.id === "lookalike-domain")?.explanation).toContain("does not establish intent");
  });

  it("does not flag routine numeric sender labels as character substitutions", () => {
    expect(signalIds(makeInput({ sender: "Updates <news@service2026.example>" }))).not.toContain("lookalike-domain");
  });

  it("records a provided URL as a zero-weight caution without raising the report level", () => {
    const report = analyzePhishingSignals(makeInput({ url: "https://harbor-studio.example/sign-in" }));
    const urlSignal = report.signals.find((signal) => signal.id === "provided-url");

    expect(urlSignal).toMatchObject({ level: "caution", riskWeight: 0, source: "url" });
    expect(report.riskLevel).toBe("informational");
  });

  it("reports a locally parsed sender-to-URL domain mismatch without fetching the URL", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const report = analyzePhishingSignals(makeInput({ url: "https://billing.example/pay" }));

    expect(report.signals.map((signal) => signal.id)).toEqual(expect.arrayContaining(["provided-url", "sender-url-mismatch"]));
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("does not report a mismatch for related sender and URL subdomains", () => {
    expect(signalIds(makeInput({ sender: "Team <updates@harbor-studio.example>", url: "https://www.harbor-studio.example/notes" }))).not.toContain("sender-url-mismatch");
  });

  it("returns deterministic output without mutating the input", () => {
    const input = makeInput({ body: "Please sign in today.", url: "https://portal.example" });
    const before = structuredClone(input);

    expect(analyzePhishingSignals(input)).toEqual(analyzePhishingSignals(input));
    expect(input).toEqual(before);
  });

  it("uses one shared, schema-valid report for browser and server recomputation", () => {
    const input = makeInput({ body: "Urgent: confirm your password today.", url: "https://harbor-studio.example/login" });
    const browserResult = analyzePhishingSignals(input);
    const serverRecomputation = analyzePhishingSignals(structuredClone(input));

    expect(browserResult).toEqual(serverRecomputation);
    expect(analysisSchema.safeParse(browserResult).success).toBe(true);
  });

  it("does not treat an absence of configured signals as proof of safety", () => {
    const report = analyzePhishingSignals(baseInput);

    expect(report.signals).toHaveLength(0);
    expect(report.riskLevel).toBe("informational");
    expect(`${report.headline} ${report.summary}`.toLowerCase()).not.toContain("the email is safe");
    expect(`${report.headline} ${report.summary}`.toLowerCase()).not.toContain("detected");
  });
});
