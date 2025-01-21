import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import WeChatBrowserWarning from '../components/WeChatBrowserWarning';
import { afterEach } from 'vitest';

describe('WeChatBrowserWarning', () => {
  const originalUserAgent = window.navigator.userAgent;

  afterEach(() => {
    // Reset userAgent after each test
    Object.defineProperty(window.navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true
    });
  });

  it('should show warning when using WeChat browser', () => {
    // Mock WeChat browser user agent
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'mozilla/5.0 (iphone; cpu iphone os 14_0 like mac os x) applewebkit/605.1.15 (khtml, like gecko) mobile/15e148 micromessenger/7.0.17',
      configurable: true
    });

    render(<WeChatBrowserWarning />);

    expect(screen.getByText('偵測到您正在使用微信瀏覽器')).toBeInTheDocument();
    expect(screen.getByText('請點擊右上角選單，選擇「在瀏覽器中開啟」')).toBeInTheDocument();
  });

  it('should not show warning when using regular browser', () => {
    // Mock regular browser user agent
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'mozilla/5.0 (macintosh; intel mac os x 10_15_7) applewebkit/537.36 (khtml, like gecko) chrome/91.0.4472.124 safari/537.36',
      configurable: true
    });

    render(<WeChatBrowserWarning />);

    expect(screen.queryByText('偵測到您正在使用微信瀏覽器')).not.toBeInTheDocument();
    expect(screen.queryByText('請點擊右上角選單，選擇「在瀏覽器中開啟」')).not.toBeInTheDocument();
  });
});