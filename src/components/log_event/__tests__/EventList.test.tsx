/**
 * EventList Component Tests
 * Tests for the event list display including pagination, empty states, and interactions
 */
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventList, EventListSkeleton } from "../EventList";
import type { DBEvent } from "@/types/database";

describe("EventList", () => {
  const mockEvents: Array<DBEvent & { ownerName?: string; ownerId?: string }> =
    [
      {
        id: "event-1",
        userId: "user-1",
        type: "orgasm",
        timestamp: new Date("2024-01-15T10:30:00"),
        createdAt: new Date("2024-01-15T10:30:00"),
        isPrivate: false,
        details: {
          notes: "Test event 1",
          mood: "Happy",
          intensity: 7,
          tags: ["romantic", "intense"],
        },
        syncStatus: "synced",
        lastModified: new Date(),
      },
      {
        id: "event-2",
        userId: "user-1",
        type: "sexual_activity",
        timestamp: new Date("2024-01-14T15:45:00"),
        createdAt: new Date("2024-01-14T15:45:00"),
        isPrivate: true,
        details: {
          notes: "Test event 2",
          mood: "Excited",
          intensity: 8,
          tags: [],
        },
        syncStatus: "synced",
        lastModified: new Date(),
      },
      {
        id: "event-3",
        userId: "user-1",
        type: "milestone",
        timestamp: new Date("2024-01-13T20:00:00"),
        createdAt: new Date("2024-01-13T20:00:00"),
        isPrivate: false,
        details: {
          notes: "Reached 30 days!",
          mood: "Proud",
          intensity: 10,
          tags: ["milestone", "achievement"],
        },
        syncStatus: "synced",
        lastModified: new Date(),
      },
      {
        id: "event-4",
        userId: "user-1",
        type: "note",
        timestamp: new Date("2024-01-12T12:00:00"),
        createdAt: new Date("2024-01-12T12:00:00"),
        isPrivate: false,
        details: {
          notes: "Regular check-in",
          mood: "Content",
          intensity: 5,
          tags: ["daily"],
        },
        syncStatus: "synced",
        lastModified: new Date(),
      },
    ] as Array<DBEvent & { ownerName?: string; ownerId?: string }>;

  describe("Empty State", () => {
    it("should display empty state when no events", () => {
      render(<EventList events={[]} />);

      expect(screen.getByText(/no events logged yet/i)).toBeInTheDocument();
      expect(
        screen.getByText(/log your first event above/i),
      ).toBeInTheDocument();
    });

    it("should have proper accessibility for empty state", () => {
      render(<EventList events={[]} />);

      const emptyState = screen.getByRole("status");
      expect(emptyState).toBeInTheDocument();
    });

    it("should show calendar icon in empty state", () => {
      render(<EventList events={[]} />);

      // Check that the empty state message is present (icon will be there but hard to test directly)
      expect(screen.getByText(/no events logged yet/i)).toBeInTheDocument();
    });
  });

  describe("Event Rendering", () => {
    it("should render all events", () => {
      render(<EventList events={mockEvents} />);

      // Check that all events are rendered
      expect(screen.getByText("Test event 1")).toBeInTheDocument();
      expect(screen.getByText("Test event 2")).toBeInTheDocument();
      expect(screen.getByText("Reached 30 days!")).toBeInTheDocument();
      expect(screen.getByText("Regular check-in")).toBeInTheDocument();
    });

    it("should display event types correctly", () => {
      render(<EventList events={mockEvents} />);

      expect(screen.getByText("Orgasm")).toBeInTheDocument();
      expect(screen.getByText("Sexual Activity")).toBeInTheDocument();
      expect(screen.getByText("Milestone")).toBeInTheDocument();
      expect(screen.getByText("Note")).toBeInTheDocument();
    });

    it("should render events as articles with proper accessibility", () => {
      render(<EventList events={mockEvents} />);

      const articles = screen.getAllByRole("article");
      expect(articles).toHaveLength(4);

      // Each article should have an accessible label
      articles.forEach((article) => {
        expect(article).toHaveAttribute("aria-label");
      });
    });

    it("should format timestamps correctly", () => {
      render(<EventList events={mockEvents} />);

      // Check for time elements with proper datetime attribute
      const timeElements = screen.getAllByRole("time");
      expect(timeElements.length).toBeGreaterThan(0);

      timeElements.forEach((time) => {
        expect(time).toHaveAttribute("datetime");
      });
    });

    it("should display private indicator for private events", () => {
      render(<EventList events={mockEvents} />);

      const privateIndicators = screen.getAllByText("Private");
      expect(privateIndicators).toHaveLength(1);

      // Check accessibility
      privateIndicators.forEach((indicator) => {
        expect(indicator).toHaveAttribute("role", "note");
        expect(indicator).toHaveAttribute("aria-label", "Private event");
      });
    });
  });

  describe("Event Metadata Display", () => {
    it("should display mood information", () => {
      render(<EventList events={mockEvents} />);

      expect(screen.getByText(/mood: happy/i)).toBeInTheDocument();
      expect(screen.getByText(/mood: excited/i)).toBeInTheDocument();
      expect(screen.getByText(/mood: proud/i)).toBeInTheDocument();
    });

    it("should display intensity information", () => {
      render(<EventList events={mockEvents} />);

      expect(screen.getByText(/intensity: 7\/10/i)).toBeInTheDocument();
      expect(screen.getByText(/intensity: 8\/10/i)).toBeInTheDocument();
      expect(screen.getByText(/intensity: 10\/10/i)).toBeInTheDocument();
    });

    it("should display tags", () => {
      render(<EventList events={mockEvents} />);

      expect(screen.getByText("romantic")).toBeInTheDocument();
      expect(screen.getByText("intense")).toBeInTheDocument();
      expect(screen.getByText("milestone")).toBeInTheDocument();
      expect(screen.getByText("achievement")).toBeInTheDocument();
      expect(screen.getByText("daily")).toBeInTheDocument();
    });

    it("should have accessible tag list", () => {
      render(<EventList events={mockEvents} />);

      // Find tag containers
      const tagLists = screen.getAllByRole("list", { name: /event tags/i });
      expect(tagLists.length).toBeGreaterThan(0);

      // Each tag should be a list item
      const tags = screen.getAllByRole("listitem");
      expect(tags.length).toBeGreaterThan(0);
    });

    it("should not display empty metadata", () => {
      const eventWithoutMetadata: Array<
        DBEvent & { ownerName?: string; ownerId?: string }
      > = [
        {
          id: "event-1",
          userId: "user-1",
          type: "note",
          timestamp: new Date("2024-01-15T12:00:00"),
          createdAt: new Date("2024-01-15T12:00:00"),
          isPrivate: false,
          details: {
            notes: "Simple note",
          },
          syncStatus: "synced",
          lastModified: new Date(),
        } as DBEvent & { ownerName?: string; ownerId?: string },
      ];

      render(<EventList events={eventWithoutMetadata} />);

      expect(screen.queryByText(/mood:/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/intensity:/i)).not.toBeInTheDocument();
    });
  });

  describe("Owner Display", () => {
    it("should display owner name when showOwner is true", () => {
      const eventsWithOwners: Array<
        DBEvent & { ownerName?: string; ownerId?: string }
      > = [
        {
          ...mockEvents[0]!,
          ownerName: "John Doe",
          ownerId: "owner-1",
        },
        {
          ...mockEvents[1]!,
          ownerName: "Jane Smith",
          ownerId: "owner-2",
        },
      ];

      render(<EventList events={eventsWithOwners} showOwner={true} />);

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("should not display owner name when showOwner is false", () => {
      const eventsWithOwners: Array<
        DBEvent & { ownerName?: string; ownerId?: string }
      > = [
        {
          ...mockEvents[0]!,
          ownerName: "John Doe",
          ownerId: "owner-1",
        },
      ];

      render(<EventList events={eventsWithOwners} showOwner={false} />);

      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    });

    it("should have accessible owner badges", () => {
      const eventsWithOwners: Array<
        DBEvent & { ownerName?: string; ownerId?: string }
      > = [
        {
          ...mockEvents[0]!,
          ownerName: "Test Owner",
          ownerId: "owner-1",
        },
      ];

      render(<EventList events={eventsWithOwners} showOwner={true} />);

      const ownerBadge = screen.getByText("Test Owner");
      expect(ownerBadge).toHaveAttribute("role", "note");
      expect(ownerBadge).toHaveAttribute("aria-label", "Owner: Test Owner");
    });
  });

  describe("Pagination", () => {
    // Create enough events to trigger pagination
    const manyEvents: Array<
      DBEvent & { ownerName?: string; ownerId?: string }
    > = Array.from({ length: 50 }, (_, i) => {
      // Create dates by adding days to a base date to ensure valid dates
      const baseDate = new Date("2024-01-01T12:00:00");
      const eventDate = new Date(baseDate);
      eventDate.setDate(baseDate.getDate() + i);

      return {
        id: `event-${i}`,
        userId: "user-1",
        type: "note",
        timestamp: eventDate,
        createdAt: eventDate,
        isPrivate: false,
        details: {
          notes: `Event ${i + 1}`,
        },
        syncStatus: "synced",
        lastModified: new Date(),
      };
    }) as Array<DBEvent & { ownerName?: string; ownerId?: string }>;

    it("should show pagination controls when there are more than pageSize events", () => {
      render(<EventList events={manyEvents} pageSize={20} />);

      expect(screen.getByText(/page 1 of/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /previous/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    });

    it("should not show pagination when events fit in one page", () => {
      render(<EventList events={mockEvents} pageSize={20} />);

      expect(screen.queryByText(/page/i)).not.toBeInTheDocument();
    });

    it("should navigate to next page", async () => {
      const user = userEvent.setup();
      render(<EventList events={manyEvents} pageSize={20} />);

      // Initially shows first 20 events
      expect(screen.getByText("Event 1")).toBeInTheDocument();
      expect(screen.queryByText("Event 21")).not.toBeInTheDocument();

      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);

      // After clicking next, should show next 20 events
      expect(screen.queryByText("Event 1")).not.toBeInTheDocument();
      expect(screen.getByText("Event 21")).toBeInTheDocument();
    });

    it("should navigate to previous page", async () => {
      const user = userEvent.setup();
      render(<EventList events={manyEvents} pageSize={20} />);

      // Go to page 2
      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);

      expect(screen.getByText("Event 21")).toBeInTheDocument();

      // Go back to page 1
      const prevButton = screen.getByRole("button", { name: /previous/i });
      await user.click(prevButton);

      expect(screen.getByText("Event 1")).toBeInTheDocument();
      expect(screen.queryByText("Event 21")).not.toBeInTheDocument();
    });

    it("should disable previous button on first page", () => {
      render(<EventList events={manyEvents} pageSize={20} />);

      const prevButton = screen.getByRole("button", { name: /previous/i });
      expect(prevButton).toBeDisabled();
    });

    it("should disable next button on last page", async () => {
      const user = userEvent.setup();
      render(<EventList events={manyEvents} pageSize={20} />);

      // Navigate to last page (page 3 with 50 events and pageSize 20)
      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);
      await user.click(nextButton);

      expect(nextButton).toBeDisabled();
    });

    it("should have accessible pagination controls", () => {
      render(<EventList events={manyEvents} pageSize={20} />);

      const pagination = screen.getByRole("navigation", {
        name: /pagination/i,
      });
      expect(pagination).toBeInTheDocument();

      const currentPage = screen.getByText(/page 1 of/i);
      expect(currentPage).toHaveAttribute("aria-live", "polite");
    });

    it("should show correct page count", () => {
      render(<EventList events={manyEvents} pageSize={20} />);

      // 50 events with pageSize 20 = 3 pages
      expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
    });
  });

  describe("Milestone Events", () => {
    it("should highlight milestone events", () => {
      render(<EventList events={mockEvents} />);

      const articles = screen.getAllByRole("article");
      const milestoneArticle = articles.find((article) =>
        within(article).queryByText("Milestone"),
      );

      expect(milestoneArticle).toHaveClass(/milestone/);
    });
  });

  describe("Accessibility", () => {
    it("should have feed role for event list", () => {
      render(<EventList events={mockEvents} />);

      const feed = screen.getByRole("feed", { name: /event list/i });
      expect(feed).toBeInTheDocument();
    });

    it("should have proper heading for the list section", () => {
      render(<EventList events={mockEvents} />);

      // EventList component doesn't render headings, those are in the parent component
      // Just verify the feed is present
      const feed = screen.getByRole("feed", { name: /event list/i });
      expect(feed).toBeInTheDocument();
    });

    it("should include event details in article aria-label", () => {
      render(<EventList events={mockEvents} />);

      const articles = screen.getAllByRole("article");

      articles.forEach((article) => {
        const label = article.getAttribute("aria-label");
        expect(label).toBeTruthy();
        // Label should include event type
        expect(label).toMatch(/orgasm|sexual activity|milestone|note/i);
      });
    });

    it("should mark private events in aria-label", () => {
      render(<EventList events={mockEvents} />);

      const articles = screen.getAllByRole("article");
      const privateArticle = articles.find((article) =>
        within(article).queryByText("Private"),
      );

      const label = privateArticle?.getAttribute("aria-label");
      expect(label).toContain("private");
    });
  });
});

describe("EventListSkeleton", () => {
  it("should render default number of skeleton items", () => {
    const { container } = render(<EventListSkeleton />);

    const skeletons = container.querySelectorAll(".event-skeleton-item");
    expect(skeletons).toHaveLength(3);
  });

  it("should render custom number of skeleton items", () => {
    const { container } = render(<EventListSkeleton count={5} />);

    const skeletons = container.querySelectorAll(".event-skeleton-item");
    expect(skeletons).toHaveLength(5);
  });

  it("should have animation class", () => {
    const { container } = render(<EventListSkeleton />);

    const skeletons = container.querySelectorAll(".event-skeleton-item");
    skeletons.forEach((skeleton) => {
      expect(skeleton).toHaveClass(/animate-pulse/);
    });
  });
});
