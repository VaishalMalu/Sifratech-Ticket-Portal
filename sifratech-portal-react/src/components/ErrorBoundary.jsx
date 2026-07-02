import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '600px', textAlign: 'center' }}>
            <h1 style={{ color: '#e11d48', marginTop: 0 }}>Something went wrong.</h1>
            <p style={{ color: '#475569', marginBottom: '24px' }}>
              An unexpected error occurred in the application. Our team has been notified.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              style={{ padding: '10px 20px', backgroundColor: '#1A5FA8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>
              Reload Application
            </button>
            
            {process.env.NODE_ENV === 'development' && (
               <details style={{ marginTop: '20px', textAlign: 'left', whiteSpace: 'pre-wrap', color: '#dc2626', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '4px', fontSize: '12px', overflow: 'auto' }}>
                 <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details (Dev Only)</summary>
                 {this.state.error && this.state.error.toString()}
                 <br />
                 {this.state.errorInfo && this.state.errorInfo.componentStack}
               </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
