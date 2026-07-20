/**
 * @file components/product-sections.tsx
 *
 * Static educational content for the product site. These sections only explain
 * the existing, transparent local rules and documented privacy boundaries;
 * they do not evaluate email content or alter any application behavior.
 */

import {
  ArrowRight,
  BookOpenCheck,
  Database,
  Eye,
  Inbox,
  Link2Off,
  ListChecks,
  MailSearch,
  MousePointer2,
  Paperclip,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

const workflowSteps = [
  {
    icon: MousePointer2,
    step: "01",
    title: "Choose or paste",
    copy: "Start with a local synthetic example or paste email text into the workspace.",
  },
  {
    icon: MailSearch,
    step: "02",
    title: "Review local evidence",
    copy: "Read the configured observable patterns, the supporting text, and why each cue matters.",
  },
  {
    icon: ListChecks,
    step: "03",
    title: "Verify independently",
    copy: "Use a known website or trusted contact path instead of a link or contact detail supplied in the message.",
  },
  {
    icon: BookOpenCheck,
    step: "04",
    title: "Choose an explanation",
    copy: "After the local report, an optional explanation clearly states its source and cannot change the local findings.",
  },
] as const;

const signalCategories = [
  {
    title: "Pressure and stated consequences",
    copy: "Time limits, urgent instructions, and stated account or service consequences can make it harder to pause before acting.",
  },
  {
    title: "Credential and authentication requests",
    copy: "Requests for passwords, account codes, recovery codes, authentication links, or corroborated account details are shown with their exact text evidence.",
  },
  {
    title: "Financial requests",
    copy: "Payment, bank-detail, gift-card, crypto, or wire requests are useful prompts to confirm through a known vendor or contact path.",
  },
  {
    title: "Role or greeting paired with a request",
    copy: "A claimed authority role or broad salutation is shown only when it appears alongside pressure or a sensitive request.",
  },
  {
    title: "Account, refund, and reward pressure",
    copy: "Account restriction, refund, reward, or prize language is shown only when paired with a visible request or pressure cue.",
  },
  {
    title: "Sender-domain structure",
    copy: "The engine can show conservative digit-for-letter patterns, internationalized formats, or an unclear pasted address without inferring identity.",
  },
  {
    title: "Supplied URL structure",
    copy: "URL presence remains informational on its own. One visible structure detail, such as user information, an IP host, or an unusual port, may be shown separately without opening the URL.",
  },
  {
    title: "Referenced high-risk file types",
    copy: "A filename is shown only when message text asks the reader to open or download a high-risk extension. No attachment is opened or inspected.",
  },
  {
    title: "Sender and supplied-URL comparison",
    copy: "When locally comparable domains differ, the report shows that detail for independent verification. Different domains can have legitimate reasons.",
  },
] as const;

const doesNotDo = [
  { icon: ShieldAlert, title: "No definitive verdicts", copy: "Observable cues are learning prompts, not a definitive email verdict." },
  { icon: Link2Off, title: "No link destinations opened", copy: "PhishLens does not open, fetch, or inspect content at a supplied link's destination." },
  { icon: Paperclip, title: "No attachment processing", copy: "Attachments are not opened, executed, uploaded, or processed." },
  { icon: Inbox, title: "No inbox connection", copy: "The app does not connect to email accounts or mailboxes." },
  { icon: Database, title: "No content retention", copy: "PhishLens does not store submitted email content or add telemetry." },
] as const;

/** Explains the existing local learning workflow in a short, scannable sequence. */
function HowItWorksSection() {
  return (
    <section id="how-it-works" className="content-section" aria-labelledby="how-it-works-heading">
      <div className="section-intro">
        <p className="eyebrow">How it works</p>
        <h2 id="how-it-works-heading" className="section-title">A calm path from message to independent verification.</h2>
        <p className="section-copy">PhishLens keeps the learning sequence simple: local evidence first, independent verification next, and an optional explanation only after a report exists.</p>
      </div>
      <ol className="workflow-grid">
        {workflowSteps.map(({ icon: Icon, step, title, copy }) => (
          <li key={step} className="workflow-card">
            <div className="workflow-card-top">
              <span className="workflow-icon" aria-hidden="true"><Icon size={20} strokeWidth={1.7} /></span>
              <span className="workflow-step">{step}</span>
            </div>
            <h3>{title}</h3>
            <p>{copy}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Lists only the signal categories implemented by the deterministic local engine. */
function WhatItChecksSection() {
  return (
    <section className="content-section content-section-soft" aria-labelledby="checks-heading">
      <div className="section-intro section-intro-wide">
        <p className="eyebrow">What PhishLens checks</p>
        <h2 id="checks-heading" className="section-title">Configured observable patterns, shown with their evidence.</h2>
        <p className="section-copy">The browser-only engine evaluates the text you provide against a small, transparent rule set. It does not infer intent, identity, or a definitive outcome.</p>
      </div>
      <div className="signal-category-grid">
        {signalCategories.map((category, index) => (
          <article key={category.title} className="signal-category-card">
            <span className="signal-category-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <h3>{category.title}</h3>
            <p>{category.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Makes the product limits as visible as the learning capabilities. */
function SafetySection() {
  return (
    <section id="safety" className="content-section" aria-labelledby="safety-heading">
      <div className="section-intro section-intro-wide">
        <p className="eyebrow">Safety boundaries</p>
        <h2 id="safety-heading" className="section-title">Useful context without hidden access or certainty claims.</h2>
        <p className="section-copy">PhishLens is deliberately narrow. The local report helps a reader decide what to verify next without taking action on their behalf.</p>
      </div>
      <div className="safety-grid">
        <article className="safety-positive-card">
          <ShieldCheck aria-hidden="true" size={24} strokeWidth={1.7} />
          <h3>What stays in your control</h3>
          <p>Local deterministic analysis runs in the browser. The optional explanation is separate, requires explicit consent, and never replaces the local report.</p>
        </article>
        <div className="safety-boundary-list">
          <p>What PhishLens does not do</p>
          <ul className="boundary-list">
            {doesNotDo.map(({ icon: Icon, title, copy }) => (
              <li key={title}>
                <Icon aria-hidden="true" size={19} strokeWidth={1.7} />
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** States the prototype's purpose and points visitors to its real public project links. */
function AboutSection() {
  return (
    <section id="about" className="content-section about-section" aria-labelledby="about-heading">
      <div className="about-card">
        <div>
          <p className="eyebrow">About PhishLens</p>
          <h2 id="about-heading" className="section-title">An open-source learning prototype for transparent email triage.</h2>
          <p className="section-copy">PhishLens is a security-sensitive educational prototype built for transparent email triage—not a company or enterprise security product. Its code, local rules, and stated limits are meant to be inspectable.</p>
        </div>
        <div className="about-actions">
          <a className="button-primary" href="https://github.com/Arthur7Li/PhishLens" target="_blank" rel="noreferrer">
            Inspect the code
            <ArrowRight aria-hidden="true" size={17} strokeWidth={1.8} />
          </a>
          <a className="button-secondary" href="https://github.com/Arthur7Li/PhishLens/issues" target="_blank" rel="noreferrer">
            Report a problem
          </a>
          <p>Focused contributions are welcome when they preserve the deterministic-first, privacy, and security boundaries.</p>
        </div>
      </div>
      <div className="open-source-strip" aria-label="Open source links">
        <Eye aria-hidden="true" size={18} strokeWidth={1.7} />
        <div>
          <p className="open-source-label">Open source</p>
          <p>Explore the source, report a problem, or contribute a focused improvement.</p>
        </div>
        <a href="https://github.com/Arthur7Li/PhishLens" target="_blank" rel="noreferrer">Repository <ArrowRight aria-hidden="true" size={15} strokeWidth={1.8} /></a>
        <a href="https://github.com/Arthur7Li/PhishLens/issues" target="_blank" rel="noreferrer">Issues <ArrowRight aria-hidden="true" size={15} strokeWidth={1.8} /></a>
      </div>
    </section>
  );
}

/** Groups the static product-site sections after the immediately available analyzer. */
export function ProductSections() {
  return (
    <div className="product-sections">
      <HowItWorksSection />
      <WhatItChecksSection />
      <SafetySection />
      <AboutSection />
    </div>
  );
}
