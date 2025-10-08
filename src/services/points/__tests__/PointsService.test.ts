/**
 * Points Service Tests
 * Tests for point calculation and awarding
 */

import { describe, it, expect } from "vitest";
import { PointsService } from "../PointsService";

describe("PointsService", () => {
  describe("calculateTaskPoints", () => {
    it("should calculate base points for medium priority task", () => {
      const points = PointsService.calculateTaskPoints({
        priority: "medium",
        hasEvidence: false,
      });

      expect(points).toBe(10);
    });

    it("should apply high priority multiplier", () => {
      const points = PointsService.calculateTaskPoints({
        priority: "high",
        hasEvidence: false,
      });

      expect(points).toBe(20); // 10 * 2
    });

    it("should apply critical priority multiplier", () => {
      const points = PointsService.calculateTaskPoints({
        priority: "critical",
        hasEvidence: false,
      });

      expect(points).toBe(30); // 10 * 3
    });

    it("should apply low priority multiplier", () => {
      const points = PointsService.calculateTaskPoints({
        priority: "low",
        hasEvidence: false,
      });

      expect(points).toBe(5); // 10 * 0.5
    });

    it("should add evidence bonus", () => {
      const points = PointsService.calculateTaskPoints({
        priority: "medium",
        hasEvidence: true,
      });

      expect(points).toBe(15); // 10 + 5
    });

    it("should add deadline bonus for tasks completed before deadline", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const points = PointsService.calculateTaskPoints({
        priority: "medium",
        hasEvidence: false,
        dueDate: futureDate,
      });

      expect(points).toBe(15); // 10 + 5
    });

    it("should not add deadline bonus for tasks completed after deadline", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const points = PointsService.calculateTaskPoints({
        priority: "medium",
        hasEvidence: false,
        dueDate: pastDate,
      });

      expect(points).toBe(10);
    });

    it("should combine all bonuses correctly", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const points = PointsService.calculateTaskPoints({
        priority: "high",
        hasEvidence: true,
        dueDate: futureDate,
      });

      // (10 * 2) + 5 (evidence) + 5 (deadline) = 30
      expect(points).toBe(30);
    });

    it("should return whole numbers only", () => {
      const points = PointsService.calculateTaskPoints({
        priority: "low",
        hasEvidence: false,
      });

      expect(Number.isInteger(points)).toBe(true);
      expect(points).toBe(5);
    });
  });
});
