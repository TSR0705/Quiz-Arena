import React from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { styles } from "../styles";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoDashboard = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d0d1e] text-white p-6">
          <div className="bg-[#1a1a2e] p-8 rounded-2xl border border-red-500/20 shadow-2xl max-w-lg w-full text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight">Application Error</h1>
              <p className="text-sm text-gray-400 leading-relaxed">
                Something went wrong while rendering this section of the application. The error has been logged securely.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-[#131326] p-4 rounded-xl border border-[#2a2a40] text-left">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Error Details</span>
                <p className="text-xs text-red-400 font-mono break-all mt-1">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#915EFF] hover:bg-[#a27eff] active:scale-95 text-white rounded-xl font-bold transition duration-200 cursor-pointer border-none"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Page</span>
              </button>
              <button
                onClick={this.handleGoDashboard}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#202038] hover:bg-[#2e2e4d] active:scale-95 text-gray-300 rounded-xl font-bold transition duration-200 cursor-pointer border border-[#2a2a40]"
              >
                <Home className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
