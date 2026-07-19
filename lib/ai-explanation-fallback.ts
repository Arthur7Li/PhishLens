/**
 * @file lib/ai-explanation-fallback.ts
 *
 * Truthful fallback selection for the optional AI explanation route. A local
 * sample explanation can say that no content was sent to Groq only before a
 * provider attempt begins; every post-attempt failure uses the generic
 * unavailable response instead.
 */

import {
  DEMO_EXPLANATION_NOTICE,
  LIVE_AI_UNAVAILABLE_MESSAGE,
  type AiExplanationInput,
  type AiExplanationResponse,
} from "./ai-explanation-schema";
import { getStaticDemoExplanation } from "./static-demo-explanations";

/** Identifies whether a Groq provider call could already have received content. */
export type AiExplanationFallbackStage = "before-provider" | "after-provider";

/** Returns the only generic fallback that never implies whether a provider saw the content. */
function createUnavailableResponse(): AiExplanationResponse {
  return { mode: "unavailable", message: LIVE_AI_UNAVAILABLE_MESSAGE };
}

/**
 * Creates an honest fallback response for the requested stage. Static sample
 * content is available only when a missing key or local capacity guard stops
 * the request before `generateGroqExplanation` can begin.
 */
export function createAiExplanationFallback(
  input: AiExplanationInput,
  stage: AiExplanationFallbackStage,
): AiExplanationResponse {
  if (stage === "after-provider") return createUnavailableResponse();

  const explanation = getStaticDemoExplanation(input);

  if (explanation) {
    return { mode: "demo", notice: DEMO_EXPLANATION_NOTICE, explanation };
  }

  return createUnavailableResponse();
}
