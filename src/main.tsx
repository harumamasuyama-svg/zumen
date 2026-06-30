import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';

function showStartupError(error: unknown) {
  const root = document.getElementById('root');
  if (!root) return;
  const message = error instanceof Error ? error.message : String(error);
  root.innerHTML = '<div style="font-family: system-ui, sans-serif; padding: 24px; color: #1f2937;"><h1 style="font-size: 20px; margin: 0 0 12px;">ZUMEN startup error</h1><p style="white-space: pre-wrap;">' + message + '</p></div>';
}

window.addEventListener('error', (event) => showStartupError(event.error || event.message));
window.addEventListener('unhandledrejection', (event) => showStartupError(event.reason));

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  showStartupError(error);
}
