import type { Analysis, EmailInput } from "@/lib/schemas";

const sharedSteps = [
  "Avoid using links or phone numbers provided in the message until you verify them independently.",
  "Open the organization’s known website or a trusted internal directory instead of replying or clicking.",
  "If this reached a work account, use your organization’s established reporting process.",
];

const sampleAnalyses: Record<string, Analysis> = {
  "account-review": {
    headline: "Several observable cues warrant extra care.",
    summary: "This synthetic message combines urgency, a credential request, and a sender domain that visually resembles a known brand.",
    signals: [
      { title: "Look-alike sender domain", evidence: "“micros0ft-verify.example” uses a zero in place of the letter o.", explanation: "Small character substitutions are commonly used to make an unfamiliar domain look familiar.", level: "elevated" },
      { title: "Time pressure", evidence: "“within 30 minutes” and “limited today”.", explanation: "Urgency can reduce the chance that a reader pauses to verify a request.", level: "review" },
      { title: "Password confirmation request", evidence: "“confirm your password”.", explanation: "Requests for credentials deserve independent verification through a known channel.", level: "elevated" },
    ],
    nextSteps: sharedSteps,
    learningNote: "A familiar display name is not proof of identity. Evaluate the full sender address and the requested action together.",
  },
  "invoice-alert": {
    headline: "Payment pressure and an unfamiliar destination deserve verification.",
    summary: "This synthetic message asks for payment details under a service-interruption deadline and directs the reader to a link.",
    signals: [
      { title: "Urgent financial request", evidence: "“immediate payment” and “avoid service interruption”.", explanation: "Pressure around money or access is a common cue to slow down and verify independently.", level: "elevated" },
      { title: "Billing information request", evidence: "“enter your billing details”.", explanation: "Payment details are sensitive and should only be entered through a known billing portal.", level: "elevated" },
      { title: "Unverified payment link", evidence: "The message supplies a “payment center” URL.", explanation: "A link can look plausible without being an approved destination; do not open it for verification.", level: "review" },
    ],
    nextSteps: sharedSteps,
    learningNote: "For invoices, start with the vendor record or bookmarked portal you already trust—not the link in a message.",
  },
  "team-update": {
    headline: "Few obvious pressure cues appear in this synthetic example.",
    summary: "The message has a routine topic, no request for credentials or money, and no supplied link. That is not a guarantee of safety.",
    signals: [
      { title: "No immediate-action request", evidence: "“No action is needed today”.", explanation: "The message does not rely on a deadline or ask you to disclose sensitive information.", level: "caution" },
      { title: "No supplied destination", evidence: "No URL is included.", explanation: "There is no link to assess in this example; keep using normal sender verification practices.", level: "caution" },
    ],
    nextSteps: ["Use normal organizational channels to confirm an unexpected message from a colleague.", "Do not treat the absence of obvious signals as proof that a message is safe."],
    learningNote: "Good triage avoids absolute verdicts. Context and independent verification still matter when a message appears routine.",
  },
};

export function getMockAnalysis(sampleId: string | null, input: EmailInput): Analysis {
  if (sampleId && sampleAnalyses[sampleId]) return sampleAnalyses[sampleId];

  const cues = [
    input.body.match(/urgent|immediate|today|hour/i) ? "time-sensitive language" : null,
    input.body.match(/password|code|verify|payment/i) ? "a potentially sensitive request" : null,
    input.url ? "a supplied destination link" : null,
  ].filter(Boolean);

  return {
    headline: "This local demo found cues to review carefully.",
    summary: cues.length ? `Observable cues include ${cues.join(", ")}. This deterministic Phase A result is educational only.` : "This deterministic Phase A result cannot determine whether a message is safe or malicious.",
    signals: [{ title: "Independent verification recommended", evidence: "This is a deterministic local demo, not a live threat verdict.", explanation: "Use trusted contact details or a known website to verify unexpected requests.", level: "caution" }],
    nextSteps: sharedSteps,
    learningNote: "Phase A deliberately does not contact the sender, open URLs, inspect attachments, or retain anything you enter.",
  };
}
