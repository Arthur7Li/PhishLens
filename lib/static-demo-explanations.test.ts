/** @file Tests for local-only fallback explanations; no provider key or calls are needed. */

import { describe, expect, it } from "vitest";
import { sampleEmails } from "./sample-emails";
import { getStaticDemoExplanation } from "./static-demo-explanations";

describe("getStaticDemoExplanation", () => {
  it("returns a deterministic explanation for each of the three unchanged synthetic samples", () => {
    for (const sample of sampleEmails) {
      expect(getStaticDemoExplanation(sample)).not.toBeNull();
    }
  });

  it("does not return substitute content for custom or edited input", () => {
    expect(getStaticDemoExplanation({ ...sampleEmails[0], body: `${sampleEmails[0].body} Extra text.` })).toBeNull();
  });
});
