'use client';

import { useEffect } from 'react';
import { Button, Result } from 'antd';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      padding: 20 
    }}>
      <Result
        status="error"
        title="Something went wrong"
        subTitle={error.message || 'An unexpected error occurred'}
        extra={[
          <Button type="primary" key="retry" onClick={reset}>
            Try Again
          </Button>,
          <Button key="home" onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>,
        ]}
      />
    </div>
  );
}
