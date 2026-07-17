/**
 * @file lib/schemas.ts
 *
 * Zod validation schemas and TypeScript type definitions used across PhishLens.
 *
 * This module is the single source of truth for every data shape in the app.
 * Zod schemas serve dual purpose: runtime validation at the form boundary and
 * compile-time TypeScript types (inferred via `z.infer`).
 *
 * Exported schemas
 * ────────────────
 * - `emailInputSchema`   – validates the four fields a user types into the triage form
 * - `signalLevelSchema`  – discriminated union of the three risk-signal severity tiers
 * - `signalSchema`       – a single observable cue extracted from an email
 * - `analysisSchema`     – the complete analysis report returned by the analysis engine
 *
 * Exported types
 * ──────────────
 * - `EmailInput`   – inferred from `emailInputSchema`
 * - `SignalLevel`  – inferred from `signalLevelSchema` ("caution" | "review" | "elevated")
 * - `Analysis`     – inferred from `analysisSchema`
 * - `SampleEmail`  – `EmailInput` extended with display metadata for the sample selector
 */

import { z } from "zod";

export const emailInputSchema = z.object({
  sender: z.string().trim().min(1, "Add a sender or display name."),
  subject: z.string().trim().min(1, "Add an email subject."),
  body: z.string().trim().min(1, "Add the email body."),
  url: z.string().trim().optional(),
});

export type EmailInput = z.infer<typeof emailInputSchema>;

export const signalLevelSchema = z.enum(["caution", "review", "elevated"]);
export type SignalLevel = z.infer<typeof signalLevelSchema>;

export const signalSchema = z.object({
  title: z.string(),
  evidence: z.string(),
  explanation: z.string(),
  level: signalLevelSchema,
});

export const analysisSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  signals: z.array(signalSchema),
  nextSteps: z.array(z.string()),
  learningNote: z.string(),
});

export type Analysis = z.infer<typeof analysisSchema>;

export type SampleEmail = EmailInput & {
  id: "account-review" | "invoice-alert" | "team-update";
  label: string;
  description: string;
};
