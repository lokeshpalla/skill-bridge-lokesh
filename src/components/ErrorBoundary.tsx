import React, { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, WifiOff } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: "" };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const isChunkError = error.message?.includes("Failed to fetch dynamically imported module") ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("Loading CSS chunk");

    return {
      hasError: true,
      error,
      errorInfo: isChunkError ? "chunk" : navigator.onLine ? "generic" : "offline",
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: "" });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const isOffline = this.state.errorInfo === "offline";
      const isChunkError = this.state.errorInfo === "chunk";

      return (
        <div className="flex items-center justify-center min-h-[50vh] p-6" role="alert">
          <div className="text-center max-w-md space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 mx-auto flex items-center justify-center">
              {isOffline ? (
                <WifiOff className="w-8 h-8 text-destructive" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-destructive" />
              )}
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {isOffline ? "You're offline" : isChunkError ? "Update available" : "Something went wrong"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isOffline
                ? "Check your internet connection and try again."
                : isChunkError
                  ? "A new version is available. Please reload the page."
                  : "An unexpected error occurred. Try refreshing the page."}
            </p>
            {!isOffline && !isChunkError && this.state.error && (
              <p className="text-xs text-muted-foreground/60 font-mono bg-secondary/30 rounded-lg p-3 text-left break-all">
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-2 justify-center">
              {isChunkError ? (
                <Button variant="hero" size="sm" className="gap-1.5" onClick={this.handleReload}>
                  <RefreshCw className="w-3.5 h-3.5" /> Reload Page
                </Button>
              ) : (
                <Button variant="hero" size="sm" className="gap-1.5" onClick={this.handleReset}>
                  <RefreshCw className="w-3.5 h-3.5" /> Try Again
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.location.href = "/dashboard"}>
                <Home className="w-3.5 h-3.5" /> Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
