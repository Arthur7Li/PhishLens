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
 * - `SignalFinding` – inferred from `signalSchema`, including its rule ID and source
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

/** Identifies the local rule that produced a signal, making every result auditable. */
export const signalIdSchema = z.enum([
  "urgency",
  "credential-request",
  "payment-request",
  "authority-pressure",
  "generic-salutation-request",
  "account-or-reward-lure",
  "lookalike-domain",
  "internationalized-sender-domain",
  "malformed-sender-address",
  "provided-url",
  "url-structure",
  "sender-url-mismatch",
  "risky-attachment-reference",
]);
export type SignalId = z.infer<typeof signalIdSchema>;

/** Identifies the user-provided field that supplied the displayed evidence. */
export const signalSourceSchema = z.enum(["sender", "subject", "body", "url"]);
export type SignalSource = z.infer<typeof signalSourceSchema>;

export const signalSchema = z.object({
  id: signalIdSchema,
  title: z.string(),
  source: signalSourceSchema,
  evidence: z.string(),
  explanation: z.string(),
  level: signalLevelSchema,
  riskWeight: z.number().int().min(0).max(2),
});
export type SignalFinding = z.infer<typeof signalSchema>;

/** Summarizes only configured rule weights; it never labels an email safe or malicious. */
export const analysisRiskLevelSchema = z.enum(["informational", "caution", "review", "elevated"]);
export type AnalysisRiskLevel = z.infer<typeof analysisRiskLevelSchema>;

/** Identifies a documented relationship between otherwise distinct local cues. */
export const contextModifierIdSchema = z.enum([
  "urgency-credential-combination",
  "urgency-payment-combination",
  "authority-sensitive-request-combination",
]);
export type ContextModifierId = z.infer<typeof contextModifierIdSchema>;

/**
 * A small, explainable context adjustment. It never creates a new finding or
 * verdict: it documents why a particular combination deserves extra care.
 */
export const contextModifierSchema = z.object({
  id: contextModifierIdSchema,
  title: z.string(),
  explanation: z.string(),
  relatedSignalIds: z.array(signalIdSchema).min(2).max(3),
  riskWeight: z.literal(1),
});
export type ContextModifier = z.infer<typeof contextModifierSchema>;

export const analysisSchema = z.object({
  riskLevel: analysisRiskLevelSchema,
  headline: z.string(),
  summary: z.string(),
  signals: z.array(signalSchema),
  contextModifiers: z.array(contextModifierSchema),
  nextSteps: z.array(z.string()),
  learningNote: z.string(),
});

export type Analysis = z.infer<typeof analysisSchema>;

export type SampleEmail = EmailInput & {
  id: "account-review" | "invoice-alert" | "team-update";
  label: string;
  description: string;
};
