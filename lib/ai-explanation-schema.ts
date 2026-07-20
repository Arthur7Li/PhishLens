/**
 * @file lib/ai-explanation-schema.ts
 *
 * Shared runtime contracts for the optional Phase C explanation layer. These
 * schemas deliberately keep the provider response narrower than the local
 * report: the model may explain canonical findings, but cannot add findings or
 * return a verdict.
 */

import { z } from "zod";
import { signalIdSchema, type Analysis, type EmailInput } from "./schemas";

/** Limits the raw JSON request before parsing so hostile input cannot consume unbounded work. */
export const MAX_AI_REQUEST_BODY_CHARS = 10_000;

/** Exact label shown when a synthetic sample receives a local static fallback. */
export const DEMO_EXPLANATION_NOTICE =
  "Demo explanation based on PhishLens’ local rules — no content was sent to Groq.";

/** Exact message shown for custom text when live generation cannot run. */
export const LIVE_AI_UNAVAILABLE_MESSAGE =
  "Live AI explanation is unavailable in this public demo. Your local deterministic report remains available.";

/**
 * Conservative server-side limits for content that a user explicitly chooses
 * to send for an optional explanation. The browser's local report has no need
 * to use these limits because it never transmits the content.
 */
export const aiExplanationInputSchema = z
  .object({
    sender: z.string().trim().min(1, "Add a sender or display name.").max(320),
    subject: z.string().trim().min(1, "Add an email subject.").max(500),
    body: z.string().trim().min(1, "Add the email body.").max(6_000),
    url: z.string().trim().max(2_048).optional(),
  })
  .strict();

export type AiExplanationInput = z.infer<typeof aiExplanationInputSchema>;

/** The only explanation shape accepted from Groq after JSON Schema enforcement. */
export const aiExplanationSchema = z
  .object({
    educationalSummary: z.string().trim().min(1).max(600),
    signalExplanations: z
      .array(
        z
          .object({
            signalId: signalIdSchema,
            explanation: z.string().trim().min(1).max(320),
          })
          .strict(),
      )
      .max(6),
    suggestedNextSteps: z.array(z.string().trim().min(1).max(220)).min(1).max(3),
  })
  .strict();

export type AiExplanation = z.infer<typeof aiExplanationSchema>;

/**
 * The client-facing result is intentionally explicit about its origin. A demo
 * result is never represented as a live Groq result, and an unavailable custom
 * request contains no substitute analysis content.
 */
export const aiExplanationResponseSchema = z.discriminatedUnion("mode", [
  z
    .object({
      mode: z.literal("live"),
      explanation: aiExplanationSchema,
    })
    .strict(),
  z
    .object({
      mode: z.literal("demo"),
      notice: z.literal(DEMO_EXPLANATION_NOTICE),
      explanation: aiExplanationSchema,
    })
    .strict(),
  z
    .object({
      mode: z.literal("unavailable"),
      message: z.literal(LIVE_AI_UNAVAILABLE_MESSAGE),
    })
    .strict(),
]);

export type AiExplanationResponse = z.infer<typeof aiExplanationResponseSchema>;

/**
 * Strict JSON Schema sent to Groq. Every object requires all fields and rejects
 * extra properties so the provider and Zod enforce the same compact contract.
 */
export const AI_EXPLANATION_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["educationalSummary", "signalExplanations", "suggestedNextSteps"],
  properties: {
    educationalSummary: { type: "string" },
    signalExplanations: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["signalId", "explanation"],
        properties: {
          signalId: {
            type: "string",
            enum: [
              "urgency",
              "credential-request",
              "payment-request",
              "lookalike-domain",
              "provided-url",
              "sender-url-mismatch",
            ],
          },
          explanation: { type: "string" },
        },
      },
    },
    suggestedNextSteps: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: { type: "string" },
    },
  },
};

const verdictTerms = "(?:safe|unsafe|malicious|phishing|legitimate|benign|trustworthy|fraudulent|scam)";

/**
 * Rejects clear verdict assertions rather than attempting to infer risk from
 * free-form model prose. The optional explanation fails closed when a model
 * labels the submitted message, even if it uses a negated or softened form.
 */
const prohibitedVerdictPatterns = [
  new RegExp(
    `\\b(?:this|the)\\s+(?:email|message)\\s+(?:is|was|appears|seems|looks|remains|isn't|wasn't)\\s+(?:not\\s+)?(?:a\\s+)?${verdictTerms}\\b`,
    "i",
  ),
  new RegExp(
    `\\bthis\\s+(?:is|was|appears|seems|looks|remains|isn't|wasn't)\\s+(?:not\\s+)?(?:a\\s+)?${verdictTerms}\\b`,
    "i",
  ),
  new RegExp(
    `\\b(?:this|the)\\s+(?:email|message)\\s+(?:has\\s+been\\s+)?(?:confirmed|proven|verified|determined)\\s+(?:to\\s+be\\s+)?(?:not\\s+)?(?:a\\s+)?${verdictTerms}\\b`,
    "i",
  ),
  new RegExp(
    `\\b(?:definitively|definitely|certainly|clearly|confirmed|proven)\\s+(?:not\\s+)?(?:a\\s+)?${verdictTerms}\\b`,
    "i",
  ),
];

/** Returns true when model prose crosses the non-verdict boundary. */
function containsProhibitedVerdict(text: string): boolean {
  return prohibitedVerdictPatterns.some((pattern) => pattern.test(text));
}

/**
 * Applies semantic checks that a JSON Schema cannot express. The model must
 * explain exactly the signal IDs generated by the server's canonical local
 * evaluator and must not turn its education into a safety or maliciousness verdict.
 */
export function validateAiExplanation(
  value: unknown,
  analysis: Analysis,
): { success: true; data: AiExplanation } | { success: false; error: string } {
  const parsed = aiExplanationSchema.safeParse(value);

  if (!parsed.success) {
    return { success: false, error: "The model response did not match the required explanation format." };
  }

  const expectedIds = analysis.signals.map((signal) => signal.id).sort();
  const returnedIds = parsed.data.signalExplanations.map((item) => item.signalId);
  const sortedReturnedIds = [...returnedIds].sort();

  if (new Set(returnedIds).size !== returnedIds.length || expectedIds.join("|") !== sortedReturnedIds.join("|")) {
    return { success: false, error: "The model response did not explain the canonical local findings exactly." };
  }

  const allText = [
    parsed.data.educationalSummary,
    ...parsed.data.signalExplanations.map((item) => item.explanation),
    ...parsed.data.suggestedNextSteps,
  ].join(" ");

  if (containsProhibitedVerdict(allText)) {
    return { success: false, error: "The model response attempted to make a prohibited verdict." };
  }

  return { success: true, data: parsed.data };
}

/** Converts a locally validated email into the narrow shape accepted by the optional route. */
export function toAiExplanationInput(input: EmailInput): AiExplanationInput {
  return {
    sender: input.sender,
    subject: input.subject,
    body: input.body,
    url: input.url,
  };
}
