import React from 'react';
import { FaTriangleExclamation } from 'react-icons/fa6';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service like Sentry
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-200 dark:border-rose-800 p-6 text-center">
          <FaTriangleExclamation className="text-4xl text-rose-500 mb-4" />
          <h2 className="text-xl font-bold text-rose-800 dark:text-rose-300 mb-2">Component Failed to Load</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md">
            An unexpected error occurred while rendering this module. Please try refreshing the page or navigating to another tab.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold text-sm transition-colors shadow-md"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
