import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker immediately with auto-update
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[MoneyMatters PWA] New update available, reload will apply changes.');
  },
  onOfflineReady() {
    console.log('[MoneyMatters PWA] App is ready for offline use.');
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
