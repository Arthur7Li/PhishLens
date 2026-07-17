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
