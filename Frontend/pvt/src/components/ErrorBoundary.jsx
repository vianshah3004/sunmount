import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Unexpected application error',
    };
  }

  componentDidCatch() {
    // Intentionally silent in UI; backend telemetry can be wired separately.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface p-6 sm:p-10">
          <div className="mx-auto max-w-2xl rounded-[2rem] border border-error/20 bg-white/90 p-6 sm:p-8 shadow-[0px_18px_40px_rgba(0,87,194,0.06)]">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-error">Application error</p>
            <h1 className="mt-3 text-2xl font-black text-on-surface sm:text-3xl">Something went wrong</h1>
            <p className="mt-3 text-sm text-slate-600">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-2xl bg-primary px-4 py-3 text-sm font-black text-white transition-colors duration-150 hover:opacity-90"
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
