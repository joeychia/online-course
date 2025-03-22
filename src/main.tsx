import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { getPerformance } from '@firebase/performance'
import { app } from './services/firebaseConfig'

// Initialize Firebase Performance Monitoring
getPerformance(app)

ReactDOM.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
  document.getElementById('root')
)

// Service Worker registration with keep-alive
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    let keepAliveInterval: NodeJS.Timeout;

    navigator.serviceWorker
      .register('/serviceWorker.js')
      .then((registration) => {
        const startKeepAlive = (worker: ServiceWorker) => {
          keepAliveInterval = setInterval(() => {
            worker.postMessage({ type: 'KEEP_ALIVE' });
          }, 5 * 60 * 1000); // 5 minutes
        };

        if (registration.active) {
          startKeepAlive(registration.active);
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                if (keepAliveInterval) clearInterval(keepAliveInterval);
                startKeepAlive(newWorker);
              }
            });
          }
        });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (keepAliveInterval) clearInterval(keepAliveInterval);
          if (navigator.serviceWorker.controller) {
            startKeepAlive(navigator.serviceWorker.controller);
          }
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
