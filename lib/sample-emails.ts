import type { SampleEmail } from "@/lib/schemas";

export const sampleEmails: SampleEmail[] = [
  {
    id: "account-review",
    label: "Account review request",
    description: "Synthetic example with urgency and a mismatched-looking sender.",
    sender: "Microsoft Account <account-security@micros0ft-verify.example>",
    subject: "Action required: account access will be limited today",
    body: "We noticed unusual sign-in activity. Review your account within 30 minutes to prevent a temporary restriction. Use the secure portal below to confirm your password.",
    url: "https://micros0ft-verify.example/account-review",
  },
  {
    id: "invoice-alert",
    label: "Overdue invoice notice",
    description: "Synthetic example with a payment request and unfamiliar link.",
    sender: "Billing Department <invoices@northstar-payments.example>",
    subject: "Final notice — invoice 004821 is now overdue",
    body: "Your outstanding balance requires immediate payment to avoid service interruption. Open the payment center and enter your billing details today.",
    url: "https://northstar-payments.example/pay/004821",
  },
  {
    id: "team-update",
    label: "Routine team update",
    description: "Synthetic low-signal example that still recommends normal verification.",
    sender: "Jordan Lee <jordan.lee@harbor-studio.example>",
    subject: "Notes from Tuesday’s planning session",
    body: "Hi team — here are the notes and action items we discussed. No action is needed today; we can review the list in our next meeting.",
    url: "",
  },
];
