import React from 'react';

const isWeChatBrowser = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('micromessenger');
};

const WeChatBrowserWarning: React.FC = () => {
  const isVisible = isWeChatBrowser();
  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        color: 'white',
        textAlign: 'center'
      }}
    >
      <div style={{ fontSize: '1.2em', marginBottom: '20px' }}>
        偵測到您正在使用微信瀏覽器
      </div>
      <div>
        請點擊右上角選單，選擇「在瀏覽器中開啟」
      </div>
    </div>
  );
};

export default WeChatBrowserWarning;