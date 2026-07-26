import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("App error boundary:", error, info);
  }
  reset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-accent" />
            </div>
            <h1 className="text-2xl font-black mb-2">Kuch galat ho gaya</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Screen crash ho gayi. Aapka data safe hai — bas refresh karke wapas try karo.
            </p>
            <Button onClick={this.reset} data-testid="error-reload" className="rounded-full bg-accent hover:bg-accent/90 font-black h-11 px-6">
              <RefreshCw className="h-4 w-4 mr-2" /> Reload App
            </Button>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer">Technical details</summary>
                <pre className="text-xs mt-2 p-3 bg-muted rounded-lg overflow-auto max-h-40">{String(this.state.error?.message || this.state.error)}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
