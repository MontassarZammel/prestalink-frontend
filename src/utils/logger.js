// Frontend logger — sends logs to backend which writes them to /logs/frontend-*.log

const sendLog = async (type, payload) => {
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...payload, userAgent: navigator.userAgent, url: window.location.href, ts: new Date().toISOString() }),
    });
  } catch (_) { /* never block the app */ }
};

// Log page navigation (access)
export const logAccess = (path) => {
  sendLog('access', { path, referrer: document.referrer });
};

// Log frontend JS errors
export const logError = (message, source = '', stack = '') => {
  sendLog('error', { message, source, stack });
};

// Global error listeners — call this once in main.jsx
export const initFrontendLogger = () => {
  // Unhandled JS errors
  window.addEventListener('error', (e) => {
    logError(e.message, e.filename + ':' + e.lineno, e.error?.stack || '');
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (e) => {
    logError(
      String(e.reason?.message || e.reason || 'Unhandled rejection'),
      'promise',
      e.reason?.stack || ''
    );
  });

  // Log initial page access
  logAccess(window.location.pathname);
};
