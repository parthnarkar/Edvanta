import { describe, it, expect, beforeEach } from "vitest";
import {
  getCachedData,
  setCachedData,
  queueSyncAction,
  getSyncQueue,
  clearSyncQueue,
  setSessionIdMapping,
  getSessionIdMapping,
} from "./offlineStorage";

describe("offlineStorage Engine", () => {
  const testEmail = "testuser@edvanta.com";

  beforeEach(() => {
    localStorage.clear();
  });

  describe("Cache storage", () => {
    it("returns fallback if userEmail is null or empty", () => {
      expect(getCachedData(null, "user_stats", { empty: true })).toEqual({ empty: true });
      expect(getCachedData("", "user_stats", null)).toBeNull();
    });

    it("stores and retrieves cached data correctly", () => {
      const stats = { quizzesTaken: 5, roadmapsActive: 2 };
      setCachedData(testEmail, "user_stats", stats);

      const cached = getCachedData(testEmail, "user_stats");
      expect(cached).toEqual(stats);
    });

    it("returns fallback if key does not exist", () => {
      const result = getCachedData(testEmail, "non_existent_key", []);
      expect(result).toEqual([]);
    });
  });

  describe("Sync queue", () => {
    it("queues actions and retrieves the queue", () => {
      const actionId = queueSyncAction(testEmail, "DELETE_QUIZ", { quizId: "quiz-123" });
      expect(actionId).toBeDefined();

      const queue = getSyncQueue(testEmail);
      expect(queue).toHaveLength(1);
      expect(queue[0].type).toBe("DELETE_QUIZ");
      expect(queue[0].data).toEqual({ quizId: "quiz-123" });
    });

    it("clears the sync queue", () => {
      queueSyncAction(testEmail, "LOG_QUIZ_HISTORY", { score: 100 });
      expect(getSyncQueue(testEmail)).toHaveLength(1);

      clearSyncQueue(testEmail);
      expect(getSyncQueue(testEmail)).toHaveLength(0);
    });

    it("returns empty array for empty email", () => {
      expect(getSyncQueue(null)).toEqual([]);
    });
  });

  describe("Session ID mapping", () => {
    it("maps temporary IDs to real server IDs", () => {
      setSessionIdMapping(testEmail, "temp-123", "real-mongo-id-456");
      const mapped = getSessionIdMapping(testEmail, "temp-123");
      expect(mapped).toBe("real-mongo-id-456");
    });

    it("returns null for unmapped temporary ID", () => {
      const mapped = getSessionIdMapping(testEmail, "unknown-temp-id");
      expect(mapped).toBeNull();
    });
  });
});
