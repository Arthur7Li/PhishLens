/** @file Unit tests for optional-explanation input, output, and semantic validation. */

import { describe, expect, it } from "vitest";
import {
  aiExplanationInputSchema,
  aiExplanationSchema,
  validateAiExplanation,
} from "./ai-explanation-schema";
import { analyzePhishingSignals } from "./phishing-signal-engine";
import { sampleEmails } from "./sample-emails";

const analysis = analyzePhishingSignals(sampleEmails[0]);

function validExplanation() {
  return {
    educationalSummary: "The local report identifies observable patterns that support an independent verification step.",
    signalExplanations: analysis.signals.map((signal) => ({
      signalId: signal.id,
      explanation: `This explanation discusses the local ${signal.id} finding without changing it.`,
    })),
    suggestedNextSteps: ["Use a known website or contact channel to verify the request."],
  };
}

describe("optional AI explanation schemas", () => {
  it("enforces conservative server-side input limits", () => {
    expect(aiExplanationInputSchema.safeParse({ ...sampleEmails[0], body: "x".repeat(6_001) }).success).toBe(false);
    expect(aiExplanationInputSchema.safeParse({ ...sampleEmails[0], unexpected: true }).success).toBe(false);
  });

  it("rejects extra provider output properties", () => {
    expect(aiExplanationSchema.safeParse({ ...validExplanation(), extra: "not allowed" }).success).toBe(false);
  });

  it("accepts an explanation for exactly the canonical local signal IDs", () => {
    expect(validateAiExplanation(validExplanation(), analysis)).toMatchObject({ success: true });
  });

  it("accepts the expanded local signal allowlist without letting the model add IDs", () => {
    const expandedAnalysis = analyzePhishingSignals({
      sender: "Support <help@micros0ft-verify.example>",
      subject: "Action required: account access will be limited today",
      body: "Dear customer, IT support says urgent: enter your password, send a wire transfer, claim your refund today, and download attached update.exe.",
      url: "https://known.example@billing.other.example:8443/pay",
    });
    const explanation = {
      educationalSummary: "The local report shows several observable patterns that support an independent verification step.",
      signalExplanations: expandedAnalysis.signals.map((signal) => ({
        signalId: signal.id,
        explanation: `This explanation discusses the local ${signal.id} finding without changing it.`,
      })),
      suggestedNextSteps: ["Use a known organization route to verify the request."],
    };

    expect(expandedAnalysis.signals.length).toBeLessThanOrEqual(12);
    expect(aiExplanationSchema.safeParse(explanation).success).toBe(true);
    expect(validateAiExplanation(explanation, expandedAnalysis)).toMatchObject({ success: true });
  });

  it("rejects duplicate, missing, or invented signal explanations", () => {
    const duplicate = validExplanation();
    duplicate.signalExplanations[1] = duplicate.signalExplanations[0];

    expect(validateAiExplanation(duplicate, analysis)).toMatchObject({ success: false });
    expect(validateAiExplanation({ ...validExplanation(), signalExplanations: [] }, analysis)).toMatchObject({ success: false });
  });

  it.each([
    "This email is malicious.",
    "This email is legitimate.",
    "This is phishing.",
    "This message is not phishing.",
    "This is a scam.",
  ])("rejects prohibited verdict language: %s", (summary) => {
    const verdict = validExplanation();
    verdict.educationalSummary = summary;

    expect(validateAiExplanation(verdict, analysis)).toMatchObject({ success: false });
  });
});
