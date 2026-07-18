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

  it("rejects duplicate, missing, or invented signal explanations", () => {
    const duplicate = validExplanation();
    duplicate.signalExplanations[1] = duplicate.signalExplanations[0];

    expect(validateAiExplanation(duplicate, analysis)).toMatchObject({ success: false });
    expect(validateAiExplanation({ ...validExplanation(), signalExplanations: [] }, analysis)).toMatchObject({ success: false });
  });

  it("rejects prohibited safety or maliciousness verdicts", () => {
    const verdict = validExplanation();
    verdict.educationalSummary = "This email is malicious.";

    expect(validateAiExplanation(verdict, analysis)).toMatchObject({ success: false });
  });
});
