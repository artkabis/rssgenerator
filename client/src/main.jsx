import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Gestion du redirect SPA pour GitHub Pages
const redirect = sessionStorage.getItem('redirect')
if (redirect) {
  sessionStorage.removeItem('redirect')
  window.history.replaceState(null, '', redirect)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
