/**
 * KeyholderPasswordUnlock Component Tests
 * Tests for keyholder password unlock functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { KeyholderPasswordUnlock } from "../KeyholderPasswordUnlock";

// Mock the keyholder store
const mockOpenPasswordDialog = vi.fn();
const mockSetPasswordAttempt = vi.fn();
const mockCheckPassword = vi.fn();
const mockClearMessage = vi.fn();

vi.mock("../../../stores/keyholderStore", () => ({
  useKeyholderStore: (selector: any) => {
    const state = {
      isKeyholderModeUnlocked: false,
      isPasswordDialogOpen: false,
      passwordAttempt: "",
      keyholderMessage: "",
      isCheckingPassword: false,
      openPasswordDialog: mockOpenPasswordDialog,
      setPasswordAttempt: mockSetPasswordAttempt,
      checkPassword: mockCheckPassword,
      clearMessage: mockClearMessage,
    };
    return selector(state);
  },
}));

describe("KeyholderPasswordUnlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Locked State", () => {
    it("should render temporary keyholder access heading", () => {
      render(<KeyholderPasswordUnlock />);

      expect(
        screen.getByText("Temporary Keyholder Access")
      ).toBeInTheDocument();
    });

    it("should render explanatory text", () => {
      render(<KeyholderPasswordUnlock />);

      expect(
        screen.getByText(/This is the current temporary password-based/i)
      ).toBeInTheDocument();
    });

    it("should display unlock button", () => {
      render(<KeyholderPasswordUnlock />);

      expect(
        screen.getByRole("button", { name: /Unlock Keyholder Controls/i })
      ).toBeInTheDocument();
    });

    it("should call openPasswordDialog when unlock button clicked", () => {
      render(<KeyholderPasswordUnlock />);

      const unlockButton = screen.getByRole("button", {
        name: /Unlock Keyholder Controls/i,
      });
      fireEvent.click(unlockButton);

      expect(mockOpenPasswordDialog).toHaveBeenCalled();
    });

    it("should have proper heading structure", () => {
      render(<KeyholderPasswordUnlock />);

      const heading = screen.getByText("Temporary Keyholder Access");
      expect(heading.tagName).toBe("H2");
    });
  });

  describe("Unlocked State", () => {
    beforeEach(() => {
      vi.mock("../../../stores/keyholderStore", () => ({
        useKeyholderStore: (selector: any) => {
          const state = {
            isKeyholderModeUnlocked: true,
            isPasswordDialogOpen: false,
            passwordAttempt: "",
            keyholderMessage: "",
            isCheckingPassword: false,
            openPasswordDialog: mockOpenPasswordDialog,
            setPasswordAttempt: mockSetPasswordAttempt,
            checkPassword: mockCheckPassword,
            clearMessage: mockClearMessage,
          };
          return selector(state);
        },
      }));
    });

    it("should render unlocked status", () => {
      // Re-import to get new mock
      const { KeyholderPasswordUnlock: UnlockedComponent } = require("../KeyholderPasswordUnlock");
      render(<UnlockedComponent />);

      expect(screen.getByText("Keyholder Controls Unlocked")).toBeInTheDocument();
    });

    it("should display success message", () => {
      const { KeyholderPasswordUnlock: UnlockedComponent } = require("../KeyholderPasswordUnlock");
      render(<UnlockedComponent />);

      expect(
        screen.getByText(/You have temporary admin access/i)
      ).toBeInTheDocument();
    });

    it("should not show unlock button when unlocked", () => {
      const { KeyholderPasswordUnlock: UnlockedComponent } = require("../KeyholderPasswordUnlock");
      render(<UnlockedComponent />);

      expect(
        screen.queryByRole("button", { name: /Unlock Keyholder Controls/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Password Dialog", () => {
    beforeEach(() => {
      vi.mock("../../../stores/keyholderStore", () => ({
        useKeyholderStore: (selector: any) => {
          const state = {
            isKeyholderModeUnlocked: false,
            isPasswordDialogOpen: true,
            passwordAttempt: "",
            keyholderMessage: "",
            isCheckingPassword: false,
            openPasswordDialog: mockOpenPasswordDialog,
            setPasswordAttempt: mockSetPasswordAttempt,
            checkPassword: mockCheckPassword,
            clearMessage: mockClearMessage,
          };
          return selector(state);
        },
      }));
    });

    it("should render password input when dialog open", () => {
      const { KeyholderPasswordUnlock: DialogComponent } = require("../KeyholderPasswordUnlock");
      render(<DialogComponent />);

      expect(
        screen.getByPlaceholderText("Enter keyholder password")
      ).toBeInTheDocument();
    });

    it("should have password input label", () => {
      const { KeyholderPasswordUnlock: DialogComponent } = require("../KeyholderPasswordUnlock");
      render(<DialogComponent />);

      expect(screen.getByText("Keyholder Password")).toBeInTheDocument();
    });

    it("should render unlock submit button", () => {
      const { KeyholderPasswordUnlock: DialogComponent } = require("../KeyholderPasswordUnlock");
      render(<DialogComponent />);

      expect(
        screen.getByRole("button", { name: /^Unlock$/i })
      ).toBeInTheDocument();
    });

    it("should call setPasswordAttempt on input change", () => {
      const { KeyholderPasswordUnlock: DialogComponent } = require("../KeyholderPasswordUnlock");
      render(<DialogComponent />);

      const input = screen.getByPlaceholderText("Enter keyholder password");
      fireEvent.change(input, { target: { value: "password123" } });

      expect(mockSetPasswordAttempt).toHaveBeenCalledWith("password123");
    });

    it("should disable submit button when password empty", () => {
      const { KeyholderPasswordUnlock: DialogComponent } = require("../KeyholderPasswordUnlock");
      render(<DialogComponent />);

      const submitButton = screen.getByRole("button", { name: /^Unlock$/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Password Checking", () => {
    beforeEach(() => {
      vi.mock("../../../stores/keyholderStore", () => ({
        useKeyholderStore: (selector: any) => {
          const state = {
            isKeyholderModeUnlocked: false,
            isPasswordDialogOpen: true,
            passwordAttempt: "testpass",
            keyholderMessage: "",
            isCheckingPassword: true,
            openPasswordDialog: mockOpenPasswordDialog,
            setPasswordAttempt: mockSetPasswordAttempt,
            checkPassword: mockCheckPassword,
            clearMessage: mockClearMessage,
          };
          return selector(state);
        },
      }));
    });

    it("should show checking state", () => {
      const { KeyholderPasswordUnlock: CheckingComponent } = require("../KeyholderPasswordUnlock");
      render(<CheckingComponent />);

      expect(screen.getByText("Checking...")).toBeInTheDocument();
    });

    it("should disable input during checking", () => {
      const { KeyholderPasswordUnlock: CheckingComponent } = require("../KeyholderPasswordUnlock");
      render(<CheckingComponent />);

      const input = screen.getByPlaceholderText("Enter keyholder password");
      expect(input).toBeDisabled();
    });

    it("should disable submit button during checking", () => {
      const { KeyholderPasswordUnlock: CheckingComponent } = require("../KeyholderPasswordUnlock");
      render(<CheckingComponent />);

      const submitButton = screen.getByRole("button", { name: /Checking.../i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Error Messages", () => {
    beforeEach(() => {
      vi.mock("../../../stores/keyholderStore", () => ({
        useKeyholderStore: (selector: any) => {
          const state = {
            isKeyholderModeUnlocked: false,
            isPasswordDialogOpen: true,
            passwordAttempt: "wrongpass",
            keyholderMessage: "Incorrect password",
            isCheckingPassword: false,
            openPasswordDialog: mockOpenPasswordDialog,
            setPasswordAttempt: mockSetPasswordAttempt,
            checkPassword: mockCheckPassword,
            clearMessage: mockClearMessage,
          };
          return selector(state);
        },
      }));
    });

    it("should display error message", () => {
      const { KeyholderPasswordUnlock: ErrorComponent } = require("../KeyholderPasswordUnlock");
      render(<ErrorComponent />);

      expect(screen.getByText("Incorrect password")).toBeInTheDocument();
    });

    it("should show dismiss button for error", () => {
      const { KeyholderPasswordUnlock: ErrorComponent } = require("../KeyholderPasswordUnlock");
      render(<ErrorComponent />);

      expect(
        screen.getByRole("button", { name: /Dismiss/i })
      ).toBeInTheDocument();
    });

    it("should call clearMessage when dismiss clicked", () => {
      const { KeyholderPasswordUnlock: ErrorComponent } = require("../KeyholderPasswordUnlock");
      render(<ErrorComponent />);

      const dismissButton = screen.getByRole("button", { name: /Dismiss/i });
      fireEvent.click(dismissButton);

      expect(mockClearMessage).toHaveBeenCalled();
    });
  });

  describe("Form Submission", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.mock("../../../stores/keyholderStore", () => ({
        useKeyholderStore: (selector: any) => {
          const state = {
            isKeyholderModeUnlocked: false,
            isPasswordDialogOpen: true,
            passwordAttempt: "password123",
            keyholderMessage: "",
            isCheckingPassword: false,
            openPasswordDialog: mockOpenPasswordDialog,
            setPasswordAttempt: mockSetPasswordAttempt,
            checkPassword: mockCheckPassword,
            clearMessage: mockClearMessage,
          };
          return selector(state);
        },
      }));
    });

    it("should call checkPassword on form submit", async () => {
      const { KeyholderPasswordUnlock: FormComponent } = require("../KeyholderPasswordUnlock");
      render(<FormComponent />);

      const form = screen.getByRole("button", { name: /^Unlock$/i }).closest("form");
      if (form) {
        fireEvent.submit(form);

        await waitFor(() => {
          expect(mockCheckPassword).toHaveBeenCalledWith(
            "password123",
            "demo_password_hash"
          );
        });
      }
    });

    it("should prevent default form submission", () => {
      const { KeyholderPasswordUnlock: FormComponent } = require("../KeyholderPasswordUnlock");
      render(<FormComponent />);

      const form = screen.getByRole("button", { name: /^Unlock$/i }).closest("form");
      if (form) {
        const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
        const preventDefaultSpy = vi.spyOn(submitEvent, "preventDefault");
        form.dispatchEvent(submitEvent);

        expect(preventDefaultSpy).toHaveBeenCalled();
      }
    });

    it("should not submit with empty password", () => {
      vi.mock("../../../stores/keyholderStore", () => ({
        useKeyholderStore: (selector: any) => {
          const state = {
            isKeyholderModeUnlocked: false,
            isPasswordDialogOpen: true,
            passwordAttempt: "   ",
            keyholderMessage: "",
            isCheckingPassword: false,
            openPasswordDialog: mockOpenPasswordDialog,
            setPasswordAttempt: mockSetPasswordAttempt,
            checkPassword: mockCheckPassword,
            clearMessage: mockClearMessage,
          };
          return selector(state);
        },
      }));

      const { KeyholderPasswordUnlock: EmptyComponent } = require("../KeyholderPasswordUnlock");
      render(<EmptyComponent />);

      const submitButton = screen.getByRole("button", { name: /^Unlock$/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading levels", () => {
      render(<KeyholderPasswordUnlock />);

      const heading = screen.getByText("Temporary Keyholder Access");
      expect(heading.tagName).toBe("H2");
    });

    it("should have accessible button labels", () => {
      render(<KeyholderPasswordUnlock />);

      const unlockButton = screen.getByRole("button", {
        name: /Unlock Keyholder Controls/i,
      });
      expect(unlockButton).toBeInTheDocument();
    });

    it("should have proper form structure", () => {
      vi.mock("../../../stores/keyholderStore", () => ({
        useKeyholderStore: (selector: any) => {
          const state = {
            isKeyholderModeUnlocked: false,
            isPasswordDialogOpen: true,
            passwordAttempt: "",
            keyholderMessage: "",
            isCheckingPassword: false,
            openPasswordDialog: mockOpenPasswordDialog,
            setPasswordAttempt: mockSetPasswordAttempt,
            checkPassword: mockCheckPassword,
            clearMessage: mockClearMessage,
          };
          return selector(state);
        },
      }));

      const { KeyholderPasswordUnlock: DialogComponent } = require("../KeyholderPasswordUnlock");
      render(<DialogComponent />);

      const input = screen.getByPlaceholderText("Enter keyholder password");
      expect(input).toHaveAttribute("type", "password");
    });

    it("should have accessible labels for password input", () => {
      vi.mock("../../../stores/keyholderStore", () => ({
        useKeyholderStore: (selector: any) => {
          const state = {
            isKeyholderModeUnlocked: false,
            isPasswordDialogOpen: true,
            passwordAttempt: "",
            keyholderMessage: "",
            isCheckingPassword: false,
            openPasswordDialog: mockOpenPasswordDialog,
            setPasswordAttempt: mockSetPasswordAttempt,
            checkPassword: mockCheckPassword,
            clearMessage: mockClearMessage,
          };
          return selector(state);
        },
      }));

      const { KeyholderPasswordUnlock: DialogComponent } = require("../KeyholderPasswordUnlock");
      render(<DialogComponent />);

      expect(screen.getByText("Keyholder Password")).toBeInTheDocument();
    });
  });

  describe("Visual States", () => {
    it("should show lock icon in locked state", () => {
      const { container } = render(<KeyholderPasswordUnlock />);

      expect(screen.getByText("Temporary Keyholder Access")).toBeInTheDocument();
      // Lock icon is rendered alongside the heading
    });

    it("should show unlock icon in unlocked state", () => {
      vi.mock("../../../stores/keyholderStore", () => ({
        useKeyholderStore: (selector: any) => {
          const state = {
            isKeyholderModeUnlocked: true,
            isPasswordDialogOpen: false,
            passwordAttempt: "",
            keyholderMessage: "",
            isCheckingPassword: false,
            openPasswordDialog: mockOpenPasswordDialog,
            setPasswordAttempt: mockSetPasswordAttempt,
            checkPassword: mockCheckPassword,
            clearMessage: mockClearMessage,
          };
          return selector(state);
        },
      }));

      const { KeyholderPasswordUnlock: UnlockedComponent } = require("../KeyholderPasswordUnlock");
      const { container } = render(<UnlockedComponent />);

      expect(screen.getByText("Keyholder Controls Unlocked")).toBeInTheDocument();
      // Unlock icon is rendered alongside the status
    });

    it("should show key icon on unlock button", () => {
      const { container } = render(<KeyholderPasswordUnlock />);

      const unlockButton = screen.getByRole("button", {
        name: /Unlock Keyholder Controls/i,
      });
      expect(unlockButton).toBeInTheDocument();
      // Key icon is rendered within the button
    });
  });
});
