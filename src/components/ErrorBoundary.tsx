'use client';

import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  section?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`ErrorBoundary [${this.props.section || 'unknown'}]:`, error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-6 text-center">
          <div className="text-3xl mb-3">⚠️</div>
          <h3 className="text-lg font-semibold text-red-300 mb-1">
            {this.props.section ? `${this.props.section} failed to load` : 'Something went wrong'}
          </h3>
          <p className="text-sm text-red-400/80 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-red-800/50 hover:bg-red-700/50 text-red-200 rounded-lg text-sm font-medium transition-colors border border-red-700/30"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
