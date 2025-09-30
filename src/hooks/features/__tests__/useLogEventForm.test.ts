import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLogEventForm } from "../useLogEventForm";

describe("useLogEventForm", () => {
  it("should initialize with default state", () => {
    const { result } = renderHook(() => useLogEventForm());
    expect(result.current.formData.type).toBe("");
    expect(result.current.isSubmitting).toBe(false);
  });

  it("should update form data", () => {
    const { result } = renderHook(() => useLogEventForm());
    act(() => {
      result.current.setFormData({ type: "orgasm" });
    });
    expect(result.current.formData.type).toBe("orgasm");
  });

  it("should reset form", () => {
    const { result } = renderHook(() => useLogEventForm());
    act(() => {
      result.current.setFormData({ type: "orgasm" });
      result.current.resetForm();
    });
    expect(result.current.formData.type).toBe("");
  });
});
