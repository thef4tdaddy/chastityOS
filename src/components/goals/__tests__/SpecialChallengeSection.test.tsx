import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SpecialChallengeSection } from "../SpecialChallengeSection";

// Mock the useSpecialChallenges hook
vi.mock("@/hooks/useSpecialChallenges", () => ({
  useSpecialChallenges: vi.fn(() => ({
    challengeStatus: {
      locktober: {
        available: true,
        active: false,
        completed: false,
        goal: null,
      },
      noNutNovember: {
        available: false,
        active: false,
        completed: false,
        goal: null,
      },
    },
    isLoading: false,
    error: null,
    joinChallenge: vi.fn(),
    getChallengeProgress: vi.fn(() => 0),
  })),
}));

describe("SpecialChallengeSection", () => {
  it("should render special challenges section", () => {
    render(<SpecialChallengeSection userId="test-user" />);

    expect(screen.getByText("Special Challenges")).toBeInTheDocument();
    expect(screen.getByText("Locktober")).toBeInTheDocument();
    expect(screen.getByText("No Nut November")).toBeInTheDocument();
  });

  it("should show join button when challenge is available", () => {
    render(<SpecialChallengeSection userId="test-user" />);

    // Locktober should be available based on mock
    expect(screen.getByText("Join Challenge")).toBeInTheDocument();
  });
});
