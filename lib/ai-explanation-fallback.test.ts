/** @file Regression tests for truthful local-demo and post-provider fallback labels. */

import { describe, expect, it } from "vitest";
import { createAiExplanationFallback } from "./ai-explanation-fallback";
import { LIVE_AI_UNAVAILABLE_MESSAGE, toAiExplanationInput } from "./ai-explanation-schema";
import { sampleEmails } from "./sample-emails";

describe("createAiExplanationFallback", () => {
  it("returns the labeled local sample explanation only before a provider attempt", () => {
    const result = createAiExplanationFallback(toAiExplanationInput(sampleEmails[0]), "before-provider");

    expect(result.mode).toBe("demo");
  });

  it("returns only the generic unavailable response for custom text before a provider attempt", () => {
    const result = createAiExplanationFallback(
      toAiExplanationInput({ ...sampleEmails[0], body: `${sampleEmails[0].body} Edited.` }),
      "before-provider",
    );

    expect(result).toEqual({ mode: "unavailable", message: LIVE_AI_UNAVAILABLE_MESSAGE });
  });

  it("never returns a no-content-sent demo label after any provider attempt", () => {
    const result = createAiExplanationFallback(toAiExplanationInput(sampleEmails[0]), "after-provider");

    expect(result).toEqual({ mode: "unavailable", message: LIVE_AI_UNAVAILABLE_MESSAGE });
  });
});
