/**
 * @file app/api/ai-explanation/route.ts
 *
 * Explicit opt-in server route for the Phase C educational explanation. It
 * accepts only bounded email fields, recomputes canonical local findings, uses
 * no logging or persistence, and returns no-store responses.
 */

import { cookies } from "next/headers";
import { MAX_AI_REQUEST_BODY_CHARS, aiExplanationInputSchema, type AiExplanationResponse } from "@/lib/ai-explanation-schema";
import { createAiExplanationFallback } from "@/lib/ai-explanation-fallback";
import { ADMIN_SESSION_COOKIE_NAME, hasValidAdminSession } from "@/lib/admin-session.server";
import { checkAndConsumeDemoRequest, getClientIp } from "@/lib/demo-rate-limit.server";
import { generateGroqExplanation, isGroqConfigured } from "@/lib/groq-explanation.server";
import { analyzePhishingSignals } from "@/lib/phishing-signal-engine";
import { isSameOriginPost } from "@/lib/request-origin.server";

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

/** Handles a same-origin opt-in request without accepting client-supplied analysis or sample IDs. */
export async function POST(request: Request): Promise<Response> {
  // State-changing requests must originate from this deployment. Cookies use
  // SameSite=Strict as a second, browser-enforced boundary.
  if (!isSameOriginPost(request)) {
    return jsonResponse({ error: "Request could not be completed." }, 403);
  }

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

  // Validate the signed, expiring admin session only after bounded input has
  // been parsed and the canonical local report recomputed. Non-admin callers
  // always receive public behavior and can never reach Groq or configuration checks.
  const cookieStore = await cookies();
  const isAdmin = await hasValidAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value);

  if (!isAdmin) {
    return jsonResponse(createAiExplanationFallback(input, "before-provider"));
  }

  // A missing key stops the request before any provider call, so unchanged
  // synthetic samples may truthfully receive their local demo explanation.
  if (!isGroqConfigured()) {
    return jsonResponse(createAiExplanationFallback(input, "before-provider"));
  }

  const rateLimit = checkAndConsumeDemoRequest(
    getClientIp(request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip")),
  );

  // The local capacity guard runs before Groq receives content, preserving the
  // truthful no-content-sent label for unchanged synthetic samples.
  if (!rateLimit.allowed) {
    return jsonResponse(createAiExplanationFallback(input, "before-provider"));
  }

  try {
    const explanation = await generateGroqExplanation(input, analysis);
    return jsonResponse({ mode: "live", explanation });
  } catch {
    // Groq may already have received content once this attempt begins. Never
    // return a local sample label that says no content was sent in this state.
    return jsonResponse(createAiExplanationFallback(input, "after-provider"));
  }
}
