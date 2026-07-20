/**
 * Shared rule contract for the browser-local deterministic engine.
 *
 * Rules inspect only the submitted fields and return one traceable finding at
 * most. Keeping the contract separate from the rule families prevents browser
 * and server code from drifting into different evaluators.
 */

import type { EmailInput, SignalFinding } from "../schemas";

/** A deterministic, no-I/O rule that returns one observable cue or no finding. */
export type SignalRule = {
  id: SignalFinding["id"];
  evaluate: (input: EmailInput) => SignalFinding | null;
};
