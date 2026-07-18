/** @file Mocked official-client tests that make no live Groq API requests. */

import { describe, expect, it, vi } from "vitest";
import { toAiExplanationInput } from "./ai-explanation-schema";
import { generateGroqExplanation, GROQ_MODEL, type GroqCompletionClient } from "./groq-explanation.server";
import { analyzePhishingSignals } from "./phishing-signal-engine";
import { sampleEmails } from "./sample-emails";

const input = toAiExplanationInput(sampleEmails[1]);
const analysis = analyzePhishingSignals(input);

function validProviderJson(): string {
  return JSON.stringify({
    educationalSummary: "The local patterns support taking time to independently verify this request.",
    signalExplanations: analysis.signals.map((signal) => ({
      signalId: signal.id,
      explanation: `This explains the local ${signal.id} signal without changing the evidence.`,
    })),
    suggestedNextSteps: ["Verify the request through a known billing contact or website."],
  });
}

function makeClient(content: string): GroqCompletionClient {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({ choices: [{ message: { content } }] }),
      },
    },
  };
}

describe("generateGroqExplanation", () => {
  it("uses strict structured output and validates a mocked provider result", async () => {
    const client = makeClient(validProviderJson());
    const result = await generateGroqExplanation(input, analysis, client);

    expect(result.educationalSummary).toContain("local patterns");
    expect(client.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({
      model: GROQ_MODEL,
      response_format: expect.objectContaining({ type: "json_schema" }),
      stream: false,
      store: false,
    }));
  });

  it("rejects malformed provider content without making a live request", async () => {
    await expect(generateGroqExplanation(input, analysis, makeClient("not json"))).rejects.toThrow("invalid JSON");
  });
});
