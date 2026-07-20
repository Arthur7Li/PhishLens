/**
 * Evidence helpers for local deterministic rules.
 *
 * These utilities preserve the exact matching text from a submitted field so
 * each displayed cue can be traced back to user-provided content.
 */

import type { EmailInput, SignalSource } from "../schemas";

export type TextMatch = {
  source: Extract<SignalSource, "subject" | "body">;
  text: string;
};

type TextField = TextMatch["source"];

/** Returns the first matching subject/body fragment in the report display order. */
export function findFirstTextMatch(input: EmailInput, pattern: RegExp): TextMatch | null {
  const fields: Array<[TextField, string]> = [["subject", input.subject], ["body", input.body]];

  for (const [source, value] of fields) {
    const match = value.match(pattern);
    if (match?.[0]) return { source, text: match[0] };
  }

  return null;
}

/**
 * Returns an action-oriented match while skipping simple nearby negations such
 * as “do not share your password.” This deliberately narrow guard avoids
 * treating routine security guidance as a request.
 */
export function findFirstActionableTextMatch(input: EmailInput, pattern: RegExp): TextMatch | null {
  const fields: Array<[TextField, string]> = [["subject", input.subject], ["body", input.body]];
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;

  for (const [source, value] of fields) {
    const matcher = new RegExp(pattern.source, flags);
    let match: RegExpExecArray | null;

    while ((match = matcher.exec(value)) !== null) {
      const beforeMatch = value.slice(Math.max(0, match.index - 24), match.index);

      if (!/\b(?:do\s+not|don't|never|avoid|not\s+to)\s*$/iu.test(beforeMatch)) {
        return { source, text: match[0] };
      }

      if (match[0].length === 0) matcher.lastIndex += 1;
    }
  }

  return null;
}

/** Tests the subject and body without exposing any hidden or external context. */
export function hasTextMatch(input: EmailInput, pattern: RegExp): boolean {
  return findFirstTextMatch(input, pattern) !== null;
}

/** Wraps exact submitted text for calm, consistent evidence presentation. */
export function quoteEvidence(value: string): string {
  return `“${value}”`;
}

/** Combines two exact fragments when a rule requires an explicit relationship. */
export function combineEvidence(first: string, second: string): string {
  return `${quoteEvidence(first)} paired with ${quoteEvidence(second)}.`;
}
