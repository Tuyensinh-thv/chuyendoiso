import React, { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppProvider } from './context/AppProvider';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RootErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '40px auto', background: '#FEF2F2', border: '1px solid #F87171', borderRadius: '12px', color: '#991B1B' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>⚠️ Ứng dụng gặp lỗi khởi chạy (Runtime Error)</h2>
          <p style={{ marginBottom: '16px', fontSize: '14px', color: '#7F1D1D' }}>
            {this.state.error?.toString()}
          </p>
          <pre style={{ background: '#450A0A', color: '#FEE2E2', padding: '16px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.stack}
            {'\n\nComponent Stack:\n'}
            {this.state.errorInfo?.componentStack}
          </pre>
          <button
            onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.reload(); }}
            style={{ marginTop: '16px', padding: '8px 16px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
          >
            Xóa bộ nhớ đệm (Clear Storage) & Tải lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </RootErrorBoundary>
  </StrictMode>,
);

