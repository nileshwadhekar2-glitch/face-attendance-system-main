import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: '2rem' }}>
                    <div className="card animate-up" style={{ padding: '3rem', maxWidth: '600px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid var(--border-light)' }}>
                        <AlertTriangle size={64} style={{ color: 'var(--danger)', marginBottom: '1.5rem', filter: 'drop-shadow(0 4px 10px rgba(239, 68, 68, 0.3))' }} />
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '1rem', letterSpacing: '-0.5px' }}>Application Error</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: 1.6 }}>
                            A critical error occurred while rendering this interface. This is typically caused by unexpected data overrides or browser memory constraints during biometric tracking.
                        </p>

                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '1rem', color: '#991b1b', textAlign: 'left', fontSize: '0.85rem', marginBottom: '2rem', overflowX: 'auto', fontFamily: 'monospace' }}>
                            <strong>{this.state.error && this.state.error.toString()}</strong>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', borderRadius: '50px', boxShadow: '0 10px 30px -5px rgba(37, 99, 235, 0.3)' }}
                            onClick={() => window.location.reload()}
                        >
                            <RefreshCw size={20} /> Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
