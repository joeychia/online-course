import React from 'react';

/**
 * Mock implementation of React Router's Navigate component for testing
 * Renders a div with navigation information for assertions
 */
export const MockNavigate = ({ to, replace }: { to: string; replace?: boolean }) => (
  <div 
    data-testid="navigate" 
    data-to={to} 
    data-replace={replace ? 'true' : 'false'}
  >
    Redirecting to {to}
  </div>
);

/**
 * Mock implementation of a Link component for testing
 */
export const MockLink = ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
  <a href={to} data-testid="mock-link" {...props}>
    {children}
  </a>
);
