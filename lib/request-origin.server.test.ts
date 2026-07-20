/** @file Unit tests for the same-origin guard used by every state-changing route. */

import { describe, expect, it } from "vitest";
import { isSameOriginPost } from "./request-origin.server";

describe("isSameOriginPost", () => {
  it("accepts only a POST whose Origin exactly matches the request origin", () => {
    const request = new Request("https://phishlens.example/api/admin/login", {
      method: "POST",
      headers: { Origin: "https://phishlens.example" },
    });

    expect(isSameOriginPost(request)).toBe(true);
  });

  it("rejects missing, mismatched, and non-POST requests", () => {
    expect(isSameOriginPost(new Request("https://phishlens.example/api", { method: "POST" }))).toBe(false);
    expect(isSameOriginPost(new Request("https://phishlens.example/api", {
      method: "POST",
      headers: { Origin: "https://other.example" },
    }))).toBe(false);
    expect(isSameOriginPost(new Request("https://phishlens.example/api", {
      method: "GET",
      headers: { Origin: "https://phishlens.example" },
    }))).toBe(false);
  });
});
