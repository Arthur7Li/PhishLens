/** Tests for explicit combination notes and tailored verification guidance. */

import { describe, expect, it } from "vitest";
import { analyzePhishingSignals } from "../phishing-signal-engine";
import { fictionalUrgentAccountDetailsRegressionFixture } from "./regression-fixtures";
import type { EmailInput } from "../schemas";

const baseInput: EmailInput = {
  sender: "Jordan Lee <jordan@harbor-studio.example>",
  subject: "Planning notes",
  body: "Here are the notes from our planning session.",
  url: "",
};

describe("local context relationships", () => {
  it("uses one non-stacking context note for the fictional urgent account-details regression fixture", () => {
    const report = analyzePhishingSignals(fictionalUrgentAccountDetailsRegressionFixture);

    expect(report.contextModifiers).toEqual([
      expect.objectContaining({
        id: "urgency-credential-loss-pressure-combination",
        relatedSignalIds: ["urgency", "credential-request", "threat-loss-pressure"],
        riskWeight: 1,
      }),
    ]);
    expect(report.contextModifiers).toHaveLength(1);
    expect(report.riskLevel).toBe("elevated");
  });

  it("makes urgency plus a credential request explicit and raises local context by one transparent point", () => {
    const report = analyzePhishingSignals({ ...baseInput, body: "Urgent: confirm your password today." });

    expect(report.contextModifiers).toEqual([expect.objectContaining({
      id: "urgency-credential-combination",
      riskWeight: 1,
      relatedSignalIds: ["urgency", "credential-request"],
    })]);
    expect(report.riskLevel).toBe("elevated");
  });

  it("records at most one combination note to avoid stacking relationship points", () => {
    const report = analyzePhishingSignals({
      ...baseInput,
      body: "IT support says urgent: enter your password and send a wire transfer today.",
    });

    expect(report.contextModifiers).toHaveLength(1);
    expect(report.nextSteps).toEqual(expect.arrayContaining([
      expect.stringContaining("passwords, account codes, or requested account information"),
      expect.stringContaining("payment, bank-detail, gift-card, crypto, or wire"),
    ]));
  });

  it("keeps unrelated informational URL presence out of context-raising combinations", () => {
    const report = analyzePhishingSignals({ ...baseInput, url: "https://harbor-studio.example/notes" });

    expect(report.contextModifiers).toEqual([]);
    expect(report.riskLevel).toBe("informational");
  });
});
