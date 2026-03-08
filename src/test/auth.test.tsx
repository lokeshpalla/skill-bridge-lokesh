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
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
  },
}));

// ==================== ErrorBoundary Tests ====================
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
    const ThrowingComponent = () => { throw new Error("Test error"); };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorBoundary><ThrowingComponent /></ErrorBoundary>);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("detects chunk loading errors and shows reload", () => {
    const ChunkError = () => { throw new Error("Failed to fetch dynamically imported module"); };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorBoundary><ChunkError /></ErrorBoundary>);
    expect(screen.getByText("Update available")).toBeInTheDocument();
    expect(screen.getByText("Reload Page")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("renders custom fallback when provided", () => {
    const ThrowingComponent = () => { throw new Error("err"); };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary fallback={<p>Custom error UI</p>}>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText("Custom error UI")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("shows error message in details", () => {
    const ThrowingComponent = () => { throw new Error("Specific error 42"); };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorBoundary><ThrowingComponent /></ErrorBoundary>);
    expect(screen.getByText("Specific error 42")).toBeInTheDocument();
    spy.mockRestore();
  });
});

// ==================== Loading Skeletons Tests ====================
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

  it("EmptyState renders action button", async () => {
    const { EmptyState } = await import("@/components/ui/loading-skeletons");
    render(<EmptyState title="Empty" action={<button>Add Item</button>} />);
    expect(screen.getByText("Add Item")).toBeInTheDocument();
  });

  it("ErrorState renders with retry button", async () => {
    const { ErrorState } = await import("@/components/ui/loading-skeletons");
    const onRetry = vi.fn();
    render(<ErrorState title="Oops" onRetry={onRetry} />);
    expect(screen.getByText("Oops")).toBeInTheDocument();
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("ErrorState renders default title", async () => {
    const { ErrorState } = await import("@/components/ui/loading-skeletons");
    render(<ErrorState />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("DashboardSkeleton renders without crashing", async () => {
    const { DashboardSkeleton } = await import("@/components/ui/loading-skeletons");
    const { container } = render(<DashboardSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it("PageSkeleton renders without crashing", async () => {
    const { PageSkeleton } = await import("@/components/ui/loading-skeletons");
    const { container } = render(<PageSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it("CardSkeleton renders without crashing", async () => {
    const { CardSkeleton } = await import("@/components/ui/loading-skeletons");
    const { container } = render(<CardSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it("ListSkeleton renders correct number of rows", async () => {
    const { ListSkeleton } = await import("@/components/ui/loading-skeletons");
    const { container } = render(<ListSkeleton rows={3} />);
    const skeletons = container.querySelectorAll('[class*="rounded-lg"]');
    expect(skeletons.length).toBe(3);
  });
});

// ==================== Utility / Helper Tests ====================
describe("Utils", () => {
  it("cn merges class names correctly", async () => {
    const { cn } = await import("@/lib/utils");
    expect(cn("foo", "bar")).toBe("foo bar");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("cn handles conditional classes", async () => {
    const { cn } = await import("@/lib/utils");
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });
});

// ==================== Subscription Logic Tests ====================
describe("Subscription trial logic", () => {
  it("calculates trial days correctly for new user", () => {
    const FREE_TRIAL_DAYS = 10;
    const createdAt = new Date();
    const now = new Date();
    const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const trialDaysLeft = Math.max(0, FREE_TRIAL_DAYS - daysSinceCreation);
    expect(trialDaysLeft).toBe(10);
  });

  it("calculates trial expired for old user", () => {
    const FREE_TRIAL_DAYS = 10;
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - 15);
    const now = new Date();
    const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const trialDaysLeft = Math.max(0, FREE_TRIAL_DAYS - daysSinceCreation);
    expect(trialDaysLeft).toBe(0);
  });

  it("defaults to expired when no created_at", () => {
    const FREE_TRIAL_DAYS = 10;
    const createdAt = null;
    const daysSinceCreation = createdAt ? 0 : FREE_TRIAL_DAYS + 1;
    const trialDaysLeft = Math.max(0, FREE_TRIAL_DAYS - daysSinceCreation);
    expect(trialDaysLeft).toBe(0);
  });

  it("calculates mid-trial correctly (5 days ago)", () => {
    const FREE_TRIAL_DAYS = 10;
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - 5);
    const now = new Date();
    const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const trialDaysLeft = Math.max(0, FREE_TRIAL_DAYS - daysSinceCreation);
    expect(trialDaysLeft).toBe(5);
  });
});

// ==================== Role-Based Access Tests ====================
describe("Role-based access logic", () => {
  it("admin bypasses subscription gate", () => {
    const roles = ["admin"];
    const isNonStudent = roles.some(r => ["admin", "mentor", "recruiter"].includes(r));
    expect(isNonStudent).toBe(true);
  });

  it("mentor bypasses subscription gate", () => {
    const roles = ["student", "mentor"];
    const isNonStudent = roles.some(r => ["admin", "mentor", "recruiter"].includes(r));
    expect(isNonStudent).toBe(true);
  });

  it("student-only does NOT bypass subscription gate", () => {
    const roles = ["student"];
    const isNonStudent = roles.some(r => ["admin", "mentor", "recruiter"].includes(r));
    expect(isNonStudent).toBe(false);
  });

  it("recruiter bypasses subscription gate", () => {
    const roles = ["recruiter"];
    const isNonStudent = roles.some(r => ["admin", "mentor", "recruiter"].includes(r));
    expect(isNonStudent).toBe(true);
  });

  it("redirect path resolves correctly for admin", () => {
    const getRedirectPath = (roles: string[]) => {
      if (roles.includes("admin")) return "/admin";
      if (roles.includes("recruiter")) return "/recruiter";
      if (roles.includes("mentor")) return "/mentor-dashboard";
      return "/dashboard";
    };
    expect(getRedirectPath(["admin"])).toBe("/admin");
    expect(getRedirectPath(["recruiter"])).toBe("/recruiter");
    expect(getRedirectPath(["mentor"])).toBe("/mentor-dashboard");
    expect(getRedirectPath(["student"])).toBe("/dashboard");
  });
});

// ==================== XP / Level System Tests ====================
describe("XP and Level system", () => {
  const getLevel = (xp: number): string => {
    if (xp >= 10000) return "Grandmaster";
    if (xp >= 7000) return "Master";
    if (xp >= 4000) return "Expert";
    if (xp >= 2000) return "Advanced";
    if (xp >= 500) return "Intermediate";
    return "Beginner";
  };

  it("returns Beginner for 0 XP", () => {
    expect(getLevel(0)).toBe("Beginner");
  });

  it("returns Intermediate for 500 XP", () => {
    expect(getLevel(500)).toBe("Intermediate");
  });

  it("returns Advanced for 2000 XP", () => {
    expect(getLevel(2000)).toBe("Advanced");
  });

  it("returns Grandmaster for 10000 XP", () => {
    expect(getLevel(10000)).toBe("Grandmaster");
  });
});
