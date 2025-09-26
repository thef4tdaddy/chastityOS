/**
 * Hash Utilities Tests
 * Tests for hash and code generation functions
 */

import { describe, it, expect } from "vitest";
import {
  sha256,
  generateBackupCode,
  generateId,
  generateUUID,
} from "../helpers/hash";

describe("Hash Utilities", () => {
  describe("sha256", () => {
    it("should generate consistent SHA-256 hash for same input", async () => {
      const input = "test string";
      const hash1 = await sha256(input);
      const hash2 = await sha256(input);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex string length
      expect(/^[a-f0-9]+$/.test(hash1)).toBe(true); // Only hex characters
    });

    it("should generate different hashes for different inputs", async () => {
      const hash1 = await sha256("input1");
      const hash2 = await sha256("input2");

      expect(hash1).not.toBe(hash2);
    });

    it("should handle empty string", async () => {
      const hash = await sha256("");

      expect(hash).toHaveLength(64);
      expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
    });
  });

  describe("generateBackupCode", () => {
    it("should generate 6-character backup code", () => {
      const code = generateBackupCode();

      expect(code).toHaveLength(6);
      expect(/^[A-Z2-9]+$/.test(code)).toBe(true);
    });

    it("should not include confusing characters", () => {
      // Generate multiple codes to test character exclusion
      for (let i = 0; i < 20; i++) {
        const code = generateBackupCode();
        expect(code).not.toMatch(/[01OI]/); // Should not contain 0, 1, O, I
      }
    });
  });

  describe("generateId", () => {
    it("should generate ID with default length", () => {
      const id = generateId();

      expect(id).toHaveLength(8);
      expect(/^[a-zA-Z0-9]+$/.test(id)).toBe(true);
    });

    it("should generate ID with custom length", () => {
      const id16 = generateId(16);
      expect(id16).toHaveLength(16);

      const id4 = generateId(4);
      expect(id4).toHaveLength(4);
    });
  });

  describe("generateUUID", () => {
    it("should generate valid UUID v4", () => {
      const uuid = generateUUID();

      // UUID v4 regex pattern
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidPattern.test(uuid)).toBe(true);
    });

    it("should generate different UUIDs on multiple calls", () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();

      expect(uuid1).not.toBe(uuid2);
    });
  });
});
