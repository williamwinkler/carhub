"use client";

import React, { Component, ReactNode } from "react";
import { handleError } from "../utils/error-handling";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    handleError(error, {
      component: "ErrorBoundary",
      action: "componentDidCatch",
      metadata: {
        componentStack: errorInfo.componentStack,
      },
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
          <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-slate-200 mb-4">
              Something went wrong
            </h1>
            <p className="text-slate-400 mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            {this.state.error && process.env.NODE_ENV === "development" && (
              <details className="text-left mb-6">
                <summary className="text-slate-300 cursor-pointer mb-2">
                  Error details (development only)
                </summary>
                <pre className="text-xs text-slate-400 bg-slate-900/50 p-4 rounded overflow-auto">
                  {this.state.error.toString()}
                  {this.state.error.stack && (
                    <>
                      {"\n\n"}
                      {this.state.error.stack}
                    </>
                  )}
                </pre>
              </details>
            )}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200"
              >
                Refresh Page
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="px-6 py-2 bg-slate-600/50 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-all duration-200"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
