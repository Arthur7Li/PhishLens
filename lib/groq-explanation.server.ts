/**
 * @file lib/groq-explanation.server.ts
 *
 * Server-only Groq integration for the optional Phase C explanation. This file
 * is the sole location that reads GROQ_API_KEY. It sends no request until the
 * user explicitly opts in through the route handler.
 */

import "server-only";

import Groq from "groq-sdk";
import {
  AI_EXPLANATION_JSON_SCHEMA,
  type AiExplanation,
  type AiExplanationInput,
  validateAiExplanation,
} from "./ai-explanation-schema";
import { buildAiExplanationPrompt } from "./ai-explanation-prompt";
import type { Analysis } from "./schemas";

/** Current free-tier, strict-structured-output-capable model selected for the demo. */
export const GROQ_MODEL = "openai/gpt-oss-20b";

/** The small structural interface makes provider calls mockable without live requests in tests. */
export type GroqCompletionClient = {
  chat: {
    completions: {
      create: (request: {
        model: string;
        messages: Array<{ role: "system" | "user"; content: string }>;
        response_format: {
          type: "json_schema";
          json_schema: { name: string; strict: true; schema: Record<string, unknown> };
        };
        stream: false;
        temperature: number;
        max_completion_tokens: number;
        reasoning_effort: "low";
        reasoning_format: "hidden";
        store: false;
      }) => Promise<{ choices: Array<{ message: { content: string | null } }> }>;
    };
  };
};

/** Checks configuration without exposing or logging the secret value. */
export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

/** Creates the official client only inside the server-only module and only when configured. */
function createGroqClient(): GroqCompletionClient {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) throw new Error("Groq is not configured.");

  return new Groq({ apiKey }) as unknown as GroqCompletionClient;
}

/**
 * Requests a strictly structured, educational explanation and validates it a
 * second time with Zod plus canonical-finding semantic checks. Errors are
 * intentionally returned to the route without logging submitted content.
 */
export async function generateGroqExplanation(
  input: AiExplanationInput,
  analysis: Analysis,
  client: GroqCompletionClient = createGroqClient(),
): Promise<AiExplanation> {
  const prompt = buildAiExplanationPrompt(input, analysis);
  const completion = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "phishlens_ai_explanation",
        strict: true,
        schema: AI_EXPLANATION_JSON_SCHEMA,
      },
    },
    stream: false,
    temperature: 0,
    max_completion_tokens: 700,
    reasoning_effort: "low",
    reasoning_format: "hidden",
    store: false,
  });

  const content = completion.choices[0]?.message.content;

  if (!content) throw new Error("Groq returned no structured explanation.");

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(content);
  } catch {
    throw new Error("Groq returned invalid JSON.");
  }

  const validated = validateAiExplanation(parsedJson, analysis);

  if (!validated.success) throw new Error(validated.error);

  return validated.data;
}
