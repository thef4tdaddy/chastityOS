/**
 * Example Component Test
 * Demonstrates how to test React components with Testing Library
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../test/utils";

// Mock a simple component for testing purposes
const ExampleComponent = ({
  title = "Default Title",
  onButtonClick = () => {},
  loading = false,
}: {
  title?: string;
  onButtonClick?: () => void;
  loading?: boolean;
}) => {
  return (
    <div>
      <h1>{title}</h1>
      {loading ? (
        <div data-testid="loading">Loading...</div>
      ) : (
        <button onClick={onButtonClick} data-testid="action-button">
          Click me
        </button>
      )}
    </div>
  );
};

describe("ExampleComponent", () => {
  it("should render with default props", () => {
    render(<ExampleComponent />);

    expect(screen.getByText("Default Title")).toBeInTheDocument();
    expect(screen.getByTestId("action-button")).toBeInTheDocument();
  });

  it("should render custom title", () => {
    render(<ExampleComponent title="Custom Title" />);

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    render(<ExampleComponent loading={true} />);

    expect(screen.getByTestId("loading")).toBeInTheDocument();
    expect(screen.queryByTestId("action-button")).not.toBeInTheDocument();
  });

  it("should call onButtonClick when button is clicked", () => {
    const mockClick = vi.fn();
    render(<ExampleComponent onButtonClick={mockClick} />);

    fireEvent.click(screen.getByTestId("action-button"));

    expect(mockClick).toHaveBeenCalledOnce();
  });

  it("should handle accessibility requirements", () => {
    render(<ExampleComponent title="Accessible Title" />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Accessible Title");

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("should work with providers", () => {
    render(
      <ExampleComponent title="Provider Test" />,
      // This would use the renderWithProviders wrapper if needed
    );

    expect(screen.getByText("Provider Test")).toBeInTheDocument();
  });
});

// Example of testing with async operations
describe("ExampleComponent - Async Operations", () => {
  it("should handle async state changes", async () => {
    const AsyncComponent = () => {
      const [loading, setLoading] = React.useState(true);

      React.useEffect(() => {
        setTimeout(() => setLoading(false), 100);
      }, []);

      return <ExampleComponent loading={loading} title="Async Test" />;
    };

    render(<AsyncComponent />);

    // Initially loading
    expect(screen.getByTestId("loading")).toBeInTheDocument();

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByTestId("action-button")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
  });
});
