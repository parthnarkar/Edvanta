import { describe, expect, it } from "vitest";
import { APIClient, ErrorTypes } from "./api";

describe("APIClient", () => {
  it("defines all standard error types", () => {
    expect(ErrorTypes.NETWORK_ERROR).toBe("NETWORK_ERROR");
    expect(ErrorTypes.SERVER_ERROR).toBe("SERVER_ERROR");
    expect(ErrorTypes.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ErrorTypes.AUTH_ERROR).toBe("AUTH_ERROR");
    expect(ErrorTypes.NOT_FOUND).toBe("NOT_FOUND");
    expect(ErrorTypes.TIMEOUT).toBe("TIMEOUT");
  });

  it("processes successful JSON response properly", async () => {
    const client = new APIClient("http://localhost:5000");
    const mockResponse = {
      ok: true,
      status: 200,
      headers: {
        get: () => "application/json",
      },
      json: async () => ({ success: true, message: "OK" }),
    };

    const result = await client.processResponse(mockResponse, "/test");
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ success: true, message: "OK" });
    expect(result.status).toBe(200);
  });

  it("processes 401/403 errors as AUTH_ERROR", async () => {
    const client = new APIClient("http://localhost:5000");
    const mockResponse = {
      ok: false,
      status: 401,
      headers: {
        get: () => "application/json",
      },
      json: async () => ({ error: "Unauthorized" }),
    };

    const result = await client.processResponse(mockResponse, "/api/chat/loadChat");
    expect(result.success).toBe(false);
    expect(result.error.type).toBe(ErrorTypes.AUTH_ERROR);
    expect(result.error.message).toBe("Unauthorized");
  });

  it("processes 400 validation error properly", async () => {
    const client = new APIClient("http://localhost:5000");
    const mockResponse = {
      ok: false,
      status: 400,
      headers: {
        get: () => "application/json",
      },
      json: async () => ({ error: "Topic is required" }),
    };

    const result = await client.processResponse(mockResponse, "/api/quizzes/generate");
    expect(result.success).toBe(false);
    expect(result.error.type).toBe(ErrorTypes.VALIDATION_ERROR);
    expect(result.error.message).toBe("Topic is required");
  });

  it("appends query parameters correctly in delete requests", async () => {
    const client = new APIClient("http://localhost:5000");
    let calledUrl = "";
    let calledOptions = null;

    client.call = async (url, options) => {
      calledUrl = url;
      calledOptions = options;
      return { success: true };
    };

    await client.delete("/api/quiz-history", { user_email: "test@example.com" });
    expect(calledUrl).toBe("/api/quiz-history?user_email=test%40example.com");
    expect(calledOptions.method).toBe("DELETE");
  });
});

