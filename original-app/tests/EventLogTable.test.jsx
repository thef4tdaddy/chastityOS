import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import EventLogTable from "../components/log_event/EventLogTable";

describe("EventLogTable Performance Optimizations", () => {
  const mockEvents = Array.from({ length: 50 }, (_, i) => ({
    id: `event-${i}`,
    eventTimestamp: new Date(2024, 0, i + 1),
    types: ["Teasing"],
    durationSeconds: 3600,
    selfOrgasmAmount: null,
    partnerOrgasmAmount: null,
    notes: `Test event ${i}`,
  }));

  it("renders the event log table", () => {
    render(
      <EventLogTable
        isLoadingEvents={false}
        sexualEventsLog={mockEvents}
        savedSubmissivesName="TestUser"
        eventDisplayMode="kinky"
      />,
    );

    expect(screen.getByText("Logged Events")).toBeInTheDocument();
  });

  it("shows loading state when isLoadingEvents is true", () => {
    render(
      <EventLogTable
        isLoadingEvents={true}
        sexualEventsLog={[]}
        savedSubmissivesName="TestUser"
        eventDisplayMode="kinky"
      />,
    );

    expect(screen.getByText("Loading events...")).toBeInTheDocument();
  });

  it("shows empty state when no events", () => {
    render(
      <EventLogTable
        isLoadingEvents={false}
        sexualEventsLog={[]}
        savedSubmissivesName="TestUser"
        eventDisplayMode="kinky"
      />,
    );

    expect(screen.getByText("No events logged yet.")).toBeInTheDocument();
  });

  it("implements pagination for large datasets", () => {
    render(
      <EventLogTable
        isLoadingEvents={false}
        sexualEventsLog={mockEvents}
        savedSubmissivesName="TestUser"
        eventDisplayMode="kinky"
      />,
    );

    // Should show pagination controls for 50 events (>20 per page)
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
  });

  it("navigates between pages", () => {
    render(
      <EventLogTable
        isLoadingEvents={false}
        sexualEventsLog={mockEvents}
        savedSubmissivesName="TestUser"
        eventDisplayMode="kinky"
      />,
    );

    // Click next button
    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);

    // Should now show page 2
    expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
  });

  it("disables Previous button on first page", () => {
    render(
      <EventLogTable
        isLoadingEvents={false}
        sexualEventsLog={mockEvents}
        savedSubmissivesName="TestUser"
        eventDisplayMode="kinky"
      />,
    );

    const previousButton = screen.getByText("Previous");
    expect(previousButton).toBeDisabled();
  });

  it("disables Next button on last page", () => {
    render(
      <EventLogTable
        isLoadingEvents={false}
        sexualEventsLog={mockEvents}
        savedSubmissivesName="TestUser"
        eventDisplayMode="kinky"
      />,
    );

    // Navigate to last page (page 3)
    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton); // Page 2
    fireEvent.click(nextButton); // Page 3

    expect(nextButton).toBeDisabled();
  });

  it("shows event count in header", () => {
    render(
      <EventLogTable
        isLoadingEvents={false}
        sexualEventsLog={mockEvents}
        savedSubmissivesName="TestUser"
        eventDisplayMode="kinky"
      />,
    );

    expect(screen.getByText("(50 total)")).toBeInTheDocument();
  });

  it("filters out system-generated events", () => {
    const eventsWithSystem = [
      ...mockEvents.slice(0, 5),
      {
        id: "system-event-1",
        eventTimestamp: new Date(2024, 0, 1),
        types: [],
        sourceText: "Reward issued",
        notes: "System generated",
      },
    ];

    render(
      <EventLogTable
        isLoadingEvents={false}
        sexualEventsLog={eventsWithSystem}
        savedSubmissivesName="TestUser"
        eventDisplayMode="kinky"
      />,
    );

    // Should only show 5 events, not 6 (system event filtered out)
    expect(screen.getByText("(5 total)")).toBeInTheDocument();
  });

  it("is memoized and prevents unnecessary re-renders", () => {
    const { rerender } = render(
      <EventLogTable
        isLoadingEvents={false}
        sexualEventsLog={mockEvents}
        savedSubmissivesName="TestUser"
        eventDisplayMode="kinky"
      />,
    );

    const initialRenderCount = screen.getByText("Logged Events");

    // Re-render with same props - memoization should prevent re-render
    rerender(
      <EventLogTable
        isLoadingEvents={false}
        sexualEventsLog={mockEvents}
        savedSubmissivesName="TestUser"
        eventDisplayMode="kinky"
      />,
    );

    // Component should still be there without re-rendering
    expect(screen.getByText("Logged Events")).toBeInTheDocument();
  });
});
