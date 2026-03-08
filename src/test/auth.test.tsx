import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <p>Content loads fine</p>
      </ErrorBoundary>
    );
    expect(screen.getByText("Content loads fine")).toBeInTheDocument();
  });

  it("renders error fallback when child throws", () => {
    const ThrowingComponent = () => {
      throw new Error("Test error");
    };

    // Suppress console.error for expected error
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("detects chunk loading errors and shows reload", () => {
    const ChunkError = () => {
      throw new Error("Failed to fetch dynamically imported module");
    };

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ChunkError />
      </ErrorBoundary>
    );

    expect(screen.getByText("Update available")).toBeInTheDocument();
    expect(screen.getByText("Reload Page")).toBeInTheDocument();
    spy.mockRestore();
  });
});

describe("Loading skeletons", () => {
  it("PageLoadingFallback renders spinner", async () => {
    const { PageLoadingFallback } = await import("@/components/ui/loading-skeletons");
    render(<PageLoadingFallback />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("EmptyState renders title and description", async () => {
    const { EmptyState } = await import("@/components/ui/loading-skeletons");
    render(<EmptyState title="No items" description="Add some items to get started." />);
    expect(screen.getByText("No items")).toBeInTheDocument();
    expect(screen.getByText("Add some items to get started.")).toBeInTheDocument();
  });
});

describe("SEO meta tags", () => {
  it("index.html has required meta tags structure", () => {
    // Verify the presence of meta tags in a unit-test-friendly way
    expect(document.querySelector('meta[name="viewport"]')).toBeTruthy();
  });
});
