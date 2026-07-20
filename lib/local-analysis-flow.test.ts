/** No-DOM coverage for the current-input local submission contract. */

import { describe, expect, it } from "vitest";
import { fictionalUrgentAccountDetailsRegressionFixture } from "./deterministic-analysis/regression-fixtures";
import { runCurrentLocalAnalysis } from "./local-analysis-flow";
import type { EmailInput } from "./schemas";

const zeroFindingInput: EmailInput = {
  sender: "Jordan Lee <jordan@harbor-studio.example>",
  subject: "Planning notes",
  body: "Here are the notes from our planning session.",
  url: "",
};

describe("runCurrentLocalAnalysis", () => {
  it("evaluates the current submit input instead of reusing an earlier zero-finding result", () => {
    const firstAttempt = runCurrentLocalAnalysis(zeroFindingInput);
    const editedAndSubmittedAttempt = runCurrentLocalAnalysis(fictionalUrgentAccountDetailsRegressionFixture);

    expect(firstAttempt).toMatchObject({ success: true });
    expect(firstAttempt.success && firstAttempt.analysis.signals).toHaveLength(0);
    expect(editedAndSubmittedAttempt).toMatchObject({ success: true });
    expect(editedAndSubmittedAttempt.success && editedAndSubmittedAttempt.analysis.signals.map((signal) => signal.id)).toEqual([
      "urgency",
      "credential-request",
      "threat-loss-pressure",
    ]);
  });

  it("normalizes the current fields before the local evaluator runs", () => {
    const attempt = runCurrentLocalAnalysis({
      ...fictionalUrgentAccountDetailsRegressionFixture,
      sender: "  R8C@gmail.com  ",
      url: undefined,
    });

    expect(attempt).toMatchObject({ success: true });
    expect(attempt.success && attempt.input.sender).toBe("R8C@gmail.com");
    expect(attempt.success && attempt.analysis.signals.map((signal) => signal.id)).toContain("credential-request");
  });
});
