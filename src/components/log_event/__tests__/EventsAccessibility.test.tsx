/**
 * Events UI Accessibility Tests
 * Tests WCAG AA compliance for the Events/Logging feature components
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LogEventForm } from "../LogEventForm";
import { EventList, EventListSkeleton } from "../EventList";
import type { DBEvent } from "../../../types/database";

// Mock Firebase services
vi.mock("@/services/firebase", () => ({
  getFirestore: vi.fn(() => ({})),
  getFirebaseApp: vi.fn(() => ({})),
}));

// Mock auth context
vi.mock("@/contexts", () => ({
  useAuthState: vi.fn(() => ({ user: { uid: "test-user-id" } })),
}));

// Mock notification store
vi.mock("@/stores", () => ({
  useNotificationActions: vi.fn(() => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  })),
}));

// Mock event hooks
vi.mock("@/hooks/api/useEvents", () => ({
  useCreateEvent: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

// Mock the UI components
vi.mock("@/components/ui", () => ({
  Card: vi.fn(({ children, className, role, ...props }) => (
    <div data-testid="card" className={className} role={role} {...props}>
      {children}
    </div>
  )),
  Button: vi.fn(
    ({ children, className, onClick, disabled, loading, ...props }) => (
      <button
        data-testid="button"
        className={className}
        onClick={onClick}
        disabled={disabled || loading}
        {...props}
      >
        {children}
      </button>
    ),
  ),
  Input: vi.fn(({ className, ...props }) => (
    <input data-testid="input" className={className} {...props} />
  )),
  Textarea: vi.fn(({ className, ...props }) => (
    <textarea data-testid="textarea" className={className} {...props} />
  )),
  Switch: vi.fn(({ checked, onCheckedChange, ...props }) => (
    <button
      role="switch"
      data-testid="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      {...props}
    />
  )),
  Tooltip: vi.fn(({ children }) => <>{children}</>),
}));

// Mock icons
vi.mock("@/utils/iconImport", () => ({
  FaPlus: () => <span data-testid="plus-icon">+</span>,
  FaHeart: () => <span data-testid="heart-icon">❤️</span>,
  FaFire: () => <span data-testid="fire-icon">🔥</span>,
  FaGamepad: () => <span data-testid="gamepad-icon">🎮</span>,
  FaTint: () => <span data-testid="tint-icon">💧</span>,
  FaSpinner: () => <span data-testid="spinner-icon">⏳</span>,
  FaCalendar: () => <span data-testid="calendar-icon">📅</span>,
}));

describe("Events UI Accessibility", () => {
  describe("LogEventForm - ARIA attributes and roles", () => {
    it("should have proper region role and heading for form", () => {
      render(<LogEventForm />);

      const region = screen.getByRole("region", { name: /log new event/i });
      expect(region).toBeInTheDocument();

      const heading = screen.getByRole("heading", { name: /log new event/i });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveAttribute("id", "log-event-heading");
    });

    it("should have proper form role and label", () => {
      render(<LogEventForm />);

      const form = screen.getByRole("form", { name: /log new event form/i });
      expect(form).toBeInTheDocument();
    });

    it("should have proper ARIA labels for event type selector", () => {
      render(<LogEventForm />);

      const eventTypeGroup = screen.getByRole("group", {
        name: /event type/i,
      });
      expect(eventTypeGroup).toBeInTheDocument();

      const buttons = screen.getAllByRole("button");
      const eventTypeButtons = buttons.filter(
        (btn) => btn.getAttribute("aria-pressed") !== null,
      );

      expect(eventTypeButtons.length).toBeGreaterThan(0);
      eventTypeButtons.forEach((button) => {
        expect(button).toHaveAttribute("aria-label");
        expect(button).toHaveAttribute("aria-pressed");
      });
    });

    it("should have proper submit button attributes", () => {
      render(<LogEventForm />);

      const submitButton = screen.getByRole("button", {
        name: /log new event/i,
      });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute("type", "submit");
    });
  });

  describe("EventList - ARIA attributes and roles", () => {
    const mockEvents: DBEvent[] = [
      {
        id: "1",
        userId: "user1",
        type: "orgasm",
        timestamp: new Date("2024-01-15T10:30:00"),
        details: {
          notes: "Test event 1",
          mood: "happy",
          intensity: 7,
          tags: ["test", "example"],
        },
        isPrivate: false,
        createdAt: new Date("2024-01-15T10:30:00"),
        updatedAt: new Date("2024-01-15T10:30:00"),
      } as DBEvent,
    ];

    it("should have proper feed role for event list", () => {
      render(<EventList events={mockEvents} />);

      const feed = screen.getByRole("feed", { name: /event list/i });
      expect(feed).toBeInTheDocument();
    });

    it("should have proper article role for each event item", () => {
      render(<EventList events={mockEvents} />);

      const articles = screen.getAllByRole("article");
      expect(articles).toHaveLength(mockEvents.length);

      articles.forEach((article) => {
        expect(article).toHaveAttribute("aria-label");
      });
    });

    it("should have proper status role for empty state", () => {
      render(<EventList events={[]} />);

      const status = screen.getByRole("status");
      expect(status).toBeInTheDocument();
      expect(status).toHaveTextContent(/no events logged yet/i);
    });
  });

  describe("Keyboard Navigation", () => {
    it("should have minimum touch target size for mobile", () => {
      const { container } = render(<LogEventForm />);

      const eventButtons = container.querySelectorAll(".event-button");
      eventButtons.forEach((button) => {
        expect(button.className).toContain("min-h-[44px]");
      });
    });
  });
});
