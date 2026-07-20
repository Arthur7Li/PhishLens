/**
 * Public entry point for PhishLens' browser-local deterministic rule set.
 *
 * Rule families live in focused modules so their evidence extraction, sender
 * parsing, URL handling, and tests stay auditable. This file deliberately
 * exports one ordered collection consumed by both the browser and server.
 */

import { domainSignalRules } from "./deterministic-analysis/domain-rules";
import { messageSignalRules } from "./deterministic-analysis/message-rules";
import type { SignalRule } from "./deterministic-analysis/rule-types";

/** The complete ordered rule set used by the shared deterministic evaluator. */
export const signalRules: readonly SignalRule[] = [
  ...messageSignalRules,
  ...domainSignalRules,
];

export type { SignalRule } from "./deterministic-analysis/rule-types";
export {
  getComparableDomain,
  getSenderDomain,
  getSuppliedUrlHost,
  haveDifferentComparableDomains,
  inspectSender,
  inspectSuppliedUrl,
} from "./deterministic-analysis/domain";
