/**
 * Named fictional fixtures for deterministic-analysis regressions.
 *
 * These inputs exist only in tests. They are not exposed as selectable public
 * samples, sent to a provider, or derived from a real message.
 */

import type { EmailInput } from "../schemas";

/**
 * Fictional incident fixture for the account-details false-negative reported
 * on July 20, 2026. It exercises three distinct, visible text patterns.
 */
export const fictionalUrgentAccountDetailsRegressionFixture: EmailInput = {
  sender: "R8C@gmail.com",
  subject: "Account security alert",
  body: "Unknown sign in detected to your account. Please provide your account details to lock it right now. Or your money might be lost!!!",
  url: "",
};
