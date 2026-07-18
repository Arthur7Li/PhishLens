/**
 * @file app/api/ai-explanation/route.ts
 *
 * Explicit opt-in server route for the Phase C educational explanation. It
 * accepts only bounded email fields, recomputes canonical local findings, uses
 * no logging or persistence, and returns no-store responses.
 */

import {
  DEMO_EXPLANATION_NOTICE,
  LIVE_AI_UNAVAILABLE_MESSAGE,
  MAX_AI_REQUEST_BODY_CHARS,
  aiExplanationInputSchema,
  type AiExplanationInput,
  type AiExplanationResponse,
} from "@/lib/ai-explanation-schema";
import { checkAndConsumeDemoRequest, getClientIp } from "@/lib/demo-rate-limit.server";
import { generateGroqExplanation, isGroqConfigured } from "@/lib/groq-explanation.server";
import { analyzePhishingSignals } from "@/lib/phishing-signal-engine";
import { getStaticDemoExplanation } from "@/lib/static-demo-explanations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
};

/** Returns a compact JSON response that is never cacheable by the browser or CDN. */
function jsonResponse(body: AiExplanationResponse | { error: string }, status = 200): Response {
  return Response.json(body, { status, headers: noStoreHeaders });
}

/**
 * Keeps samples usable during a missing key, a provider failure, or a demo cap,
 * while custom submissions never receive substitute content that could be
 * mistaken for a live provider result.
 */
function createFallback(input: AiExplanationInput): AiExplanationResponse {
  const explanation = getStaticDemoExplanation(input);

  if (explanation) {
    return { mode: "demo", notice: DEMO_EXPLANATION_NOTICE, explanation };
  }

  return { mode: "unavailable", message: LIVE_AI_UNAVAILABLE_MESSAGE };
}

/** Handles a same-origin opt-in request without accepting client-supplied analysis or sample IDs. */
export async function POST(request: Request): Promise<Response> {
  let requestText: string;

  try {
    requestText = await request.text();
  } catch {
    return jsonResponse({ error: "The optional AI explanation request could not be read." }, 400);
  }

  if (requestText.length > MAX_AI_REQUEST_BODY_CHARS) {
    return jsonResponse(
      { error: "Submitted content is too large for the optional AI explanation. Your local deterministic report remains available." },
      413,
    );
  }

  let requestBody: unknown;

  try {
    requestBody = JSON.parse(requestText);
  } catch {
    return jsonResponse({ error: "The optional AI explanation request must contain valid JSON." }, 400);
  }

  const parsedInput = aiExplanationInputSchema.safeParse(requestBody);

  if (!parsedInput.success) {
    return jsonResponse(
      { error: "Submitted content does not meet the optional AI explanation limits. Your local deterministic report remains available." },
      400,
    );
  }

  const input = parsedInput.data;
  const analysis = analyzePhishingSignals(input);

  if (!isGroqConfigured()) return jsonResponse(createFallback(input));

  const rateLimit = checkAndConsumeDemoRequest(
    getClientIp(request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip")),
  );

  if (!rateLimit.allowed) return jsonResponse(createFallback(input));

  try {
    const explanation = await generateGroqExplanation(input, analysis);
    return jsonResponse({ mode: "live", explanation });
  } catch {
    return jsonResponse(createFallback(input));
  }
}
