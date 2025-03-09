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
