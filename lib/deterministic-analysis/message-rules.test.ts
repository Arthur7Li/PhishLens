/** Synthetic, no-network coverage for message-language rule families and false-positive guards. */

import { describe, expect, it } from "vitest";
import { analyzePhishingSignals } from "../phishing-signal-engine";
import { fictionalUrgentAccountDetailsRegressionFixture } from "./regression-fixtures";
import type { EmailInput, SignalId } from "../schemas";

const baseInput: EmailInput = {
  sender: "Jordan Lee <jordan@harbor-studio.example>",
  subject: "Planning notes",
  body: "Here are the notes from our planning session.",
  url: "",
};

function analyze(overrides: Partial<EmailInput>) {
  return analyzePhishingSignals({ ...baseInput, ...overrides });
}

function ids(overrides: Partial<EmailInput>): SignalId[] {
  return analyze(overrides).signals.map((signal) => signal.id);
}

describe("message-language signal families", () => {
  it("records time pressure with the exact pasted evidence", () => {
    const report = analyze({ subject: "Action required: respond today" });

    expect(report.signals.find((signal) => signal.id === "urgency")).toMatchObject({
      source: "subject",
      evidence: "“Action required”",
      riskWeight: 1,
    });
  });

  it("covers credential, MFA, recovery-code, and authentication-link requests", () => {
    expect(ids({ body: "Provide your recovery code to continue." })).toContain("credential-request");
    expect(ids({ body: "Open the authentication link to continue." })).toContain("credential-request");
    expect(ids({ body: "Verify your MFA code now." })).toContain("credential-request");
  });

  it("records an account-details request only when local account-compromise or loss language corroborates it", () => {
    const report = analyze(fictionalUrgentAccountDetailsRegressionFixture);

    expect(report.signals.find((signal) => signal.id === "credential-request")).toMatchObject({
      source: "body",
      evidence: "“provide your account details”",
      riskWeight: 2,
    });
  });

  it("treats a direct request to act right now as an observable time-pressure cue", () => {
    const report = analyze({ body: "Please lock it right now." });

    expect(report.signals.find((signal) => signal.id === "urgency")).toMatchObject({
      source: "body",
      evidence: "“right now”",
      riskWeight: 1,
    });
  });

  it("does not turn routine security guidance into a credential request", () => {
    expect(ids({ body: "Never share your password or recovery code in a message." })).not.toContain("credential-request");
    expect(ids({ body: "Do not click the sign-in link in an unexpected email." })).not.toContain("credential-request");
  });

  it("does not treat neutral support account-details language as a sensitive request or compound context", () => {
    const report = analyze({
      subject: "Support profile update",
      body: "Please provide your account details so our support team can update your mailing preferences.",
    });

    expect(report.signals.map((signal) => signal.id)).not.toContain("credential-request");
    expect(report.contextModifiers).toHaveLength(0);
  });

  it("records stated loss pressure with exact evidence", () => {
    const report = analyze({ body: "Your money might be lost unless the issue is resolved." });

    expect(report.signals.find((signal) => signal.id === "threat-loss-pressure")).toMatchObject({
      source: "body",
      evidence: "“Your money might be lost”",
      riskWeight: 1,
    });
  });

  it("covers explicit payment, gift-card, crypto, and wire-transfer requests", () => {
    expect(ids({ body: "Purchase gift cards for the request today." })).toContain("payment-request");
    expect(ids({ body: "Send a wire transfer before close of business." })).toContain("payment-request");
    expect(ids({ body: "Transfer cryptocurrency to the new wallet." })).toContain("payment-request");
  });

  it("does not treat an ordinary invoice or finance discussion as a payment request", () => {
    expect(ids({ subject: "Invoice processing schedule", body: "The finance team will review the invoice in next week’s meeting." })).not.toContain("payment-request");
    expect(ids({ body: "Gift cards are listed in the annual event budget." })).not.toContain("payment-request");
  });

  it("requires both an authority role and a pressure or sensitive request", () => {
    expect(ids({ body: "IT support asks you to enter your one-time code." })).toContain("authority-pressure");
    expect(ids({ body: "The IT support team published its weekly maintenance notes." })).not.toContain("authority-pressure");
  });

  it("requires both a generic salutation and a pressure or sensitive request", () => {
    expect(ids({ body: "Dear customer, please enter your password today." })).toContain("generic-salutation-request");
    expect(ids({ body: "Dear customer, the office will be closed on Friday." })).not.toContain("generic-salutation-request");
  });

  it("requires a visible request or pressure alongside account, refund, reward, or prize language", () => {
    expect(ids({ body: "Claim your refund today to complete the request." })).toContain("account-or-reward-lure");
    expect(ids({ body: "Our newsletter explains the employee reward program." })).not.toContain("account-or-reward-lure");
  });

  it("records a high-risk filename only when the text asks the reader to open or download it", () => {
    expect(ids({ body: "Download the attached payroll-update.exe to continue." })).toContain("risky-attachment-reference");
    expect(ids({ body: "The policy says not to open payroll-update.exe from unexpected messages." })).not.toContain("risky-attachment-reference");
  });
});
