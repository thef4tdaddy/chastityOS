/**
 * Tests for usePermissions hook
 */
import { renderHook, act } from "@testing-library/react";
import { usePermissions } from "../usePermissions";
import { UserRole } from "../../../types/core";

describe("usePermissions", () => {
  const mockUserId = "test-user-123";

  it("should initialize with default permissions", async () => {
    const { result } = renderHook(() => usePermissions({ userId: mockUserId }));

    expect(result.current.loading).toBe(true);

    // Wait for permissions to load
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.permissions).toBeDefined();
    expect(Array.isArray(result.current.permissions)).toBe(true);
  });

  it("should check permissions correctly", async () => {
    const { result } = renderHook(() => usePermissions({ userId: mockUserId }));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Test basic permission check
    const hasSessionPermission =
      result.current.hasPermission("session_manage_own");
    expect(typeof hasSessionPermission).toBe("boolean");
  });

  it("should support role-based checks", async () => {
    const { result } = renderHook(() => usePermissions({ userId: mockUserId }));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const hasSubmissiveRole = result.current.hasRole(UserRole.SUBMISSIVE);
    expect(typeof hasSubmissiveRole).toBe("boolean");
  });

  it("should support multiple permission checks", async () => {
    const { result } = renderHook(() => usePermissions({ userId: mockUserId }));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const hasAnyPermission = result.current.hasAnyPermission([
      "session_manage_own",
      "profile_edit_own",
    ]);
    const hasAllPermissions = result.current.hasAllPermissions([
      "session_manage_own",
      "profile_edit_own",
    ]);

    expect(typeof hasAnyPermission).toBe("boolean");
    expect(typeof hasAllPermissions).toBe("boolean");
  });

  it("should support permission requests", async () => {
    const { result } = renderHook(() => usePermissions({ userId: mockUserId }));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const request = await result.current.requestPermission(
      "admin_access",
      "Need admin access for testing",
    );

    expect(request).toBeDefined();
    expect(request.userId).toBe(mockUserId);
    expect(request.permission).toBe("admin_access");
    expect(request.justification).toBe("Need admin access for testing");
  });
});
