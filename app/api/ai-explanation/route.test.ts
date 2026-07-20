/** @file Public-route tests proving unauthenticated requests stop before Groq. */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { LIVE_AI_UNAVAILABLE_MESSAGE, toAiExplanationInput } from "@/lib/ai-explanation-schema";
import { sampleEmails } from "@/lib/sample-emails";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  hasValidAdminSession: vi.fn(),
  isGroqConfigured: vi.fn(),
  generateGroqExplanation: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/lib/admin-session.server", () => ({
  ADMIN_SESSION_COOKIE_NAME: "phishlens_admin_session",
  hasValidAdminSession: mocks.hasValidAdminSession,
}));
vi.mock("@/lib/groq-explanation.server", () => ({
  isGroqConfigured: mocks.isGroqConfigured,
  generateGroqExplanation: mocks.generateGroqExplanation,
}));

import { POST } from "./route";

function makeRequest(body: unknown): Request {
  return new Request("https://phishlens.example/api/ai-explanation", {
    method: "POST",
    headers: { Origin: "https://phishlens.example", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mocks.cookies.mockResolvedValue({ get: () => undefined });
  mocks.hasValidAdminSession.mockResolvedValue(false);
  mocks.isGroqConfigured.mockReset();
  mocks.isGroqConfigured.mockReturnValue(true);
  mocks.generateGroqExplanation.mockReset();
});

describe("POST /api/ai-explanation public behavior", () => {
  it("returns a local sample explanation without checking Groq configuration or calling the provider", async () => {
    const response = await POST(makeRequest(toAiExplanationInput(sampleEmails[0])));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ mode: "demo" });
    expect(mocks.isGroqConfigured).not.toHaveBeenCalled();
    expect(mocks.generateGroqExplanation).not.toHaveBeenCalled();
  });

  it("returns only the unavailable message for public custom content without calling the provider", async () => {
    const response = await POST(makeRequest(toAiExplanationInput({
      ...sampleEmails[0],
      body: `${sampleEmails[0].body} Custom local text.`,
    })));
    const body = await response.json();

    expect(body).toMatchObject({ mode: "unavailable" });
    expect(mocks.isGroqConfigured).not.toHaveBeenCalled();
    expect(mocks.generateGroqExplanation).not.toHaveBeenCalled();
  });

  it("returns only the generic unavailable response after an administrator provider attempt fails", async () => {
    mocks.hasValidAdminSession.mockResolvedValue(true);
    mocks.generateGroqExplanation.mockRejectedValue(new Error("provider unavailable"));

    const response = await POST(makeRequest(toAiExplanationInput(sampleEmails[0])));
    const body = await response.json();

    expect(body).toEqual({ mode: "unavailable", message: LIVE_AI_UNAVAILABLE_MESSAGE });
    expect(mocks.generateGroqExplanation).toHaveBeenCalledTimes(1);
  });
});
