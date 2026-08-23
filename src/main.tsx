import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercepts and silences unpreventable browser/extension fetch assignment errors in sandboxed preview environments.
if (typeof window !== 'undefined') {
  const handleFetchErrorText = (errorMsg: string): boolean => {
    if (!errorMsg) return false;
    const msgLower = errorMsg.toLowerCase();
    return (
      msgLower.includes('cannot set property fetch') ||
      msgLower.includes('property fetch of') ||
      msgLower.includes('has only a getter') ||
      msgLower.includes('redefine property: fetch')
    ) || false;
  };

  // 1. Standard window.onerror: Returning true completely suppresses the uncaught browser error
  const originalOnerror = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    const errorMsg = typeof message === 'string' ? message : (message?.toString() || '');
    const errorObjMsg = (error && error.message) || '';
    
    if (handleFetchErrorText(errorMsg) || handleFetchErrorText(errorObjMsg)) {
      console.info('[RifaZone Sandbox] Erro de escrita em window.fetch silenciado via window.onerror.');
      return true; // Suppresses the error entirely
    }
    
    if (originalOnerror) {
      return originalOnerror.apply(this, arguments as any);
    }
    return false;
  };

  // 2. Modern event listener fallback
  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    const errorObjMsg = (event.error && event.error.message) || '';
    
    if (handleFetchErrorText(msg) || handleFetchErrorText(errorObjMsg)) {
      try {
        event.preventDefault();
        event.stopPropagation();
      } catch (e) {}
      console.info('[RifaZone Sandbox] Erro de escrita em window.fetch silenciado via event listener.');
    }
  }, { capture: true });

  // 3. Promise rejection handling
  window.addEventListener('unhandledrejection', (event) => {
    const msg = (event.reason && event.reason.message) || '';
    if (handleFetchErrorText(msg)) {
      try {
        event.preventDefault();
        event.stopPropagation();
      } catch (e) {}
      console.info('[RifaZone Sandbox] Rejeição de escrita em window.fetch silenciada.');
    }
  }, { capture: true });
}

// Prevents third-party scripts (e.g. Meta/Facebook Pixel, analytics) from crashing when they try to monkey-patch window.fetch in sandboxed iframe environments where window.fetch is a getter-only property.
try {
  if (typeof window !== 'undefined' && window.fetch) {
    const originalFetch = window.fetch;
    let currentFetch = originalFetch;
    try {
      Object.defineProperty(window, 'fetch', {
        configurable: true,
        enumerable: true,
        get() {
          return currentFetch;
        },
        set(newFetch) {
          currentFetch = newFetch;
        }
      });
    } catch (definePropertyError) {
      console.warn('[RifaZone] Não foi possível definir getter/setter em window.fetch diretamente, tentando fallback.', definePropertyError);
      
      // Fallback: Check if Window.prototype.fetch exists and try to patch there
      const windowProto = Object.getPrototypeOf(window);
      if (windowProto && 'fetch' in windowProto) {
        try {
          Object.defineProperty(windowProto, 'fetch', {
            configurable: true,
            enumerable: true,
            get() {
              return currentFetch;
            },
            set(newFetch) {
              currentFetch = newFetch;
            }
          });
        } catch (protoError) {
          console.error('[RifaZone] Falha crítica ao tentar redefinir fetch no protótipo de Window:', protoError);
        }
      }
    }
  }
} catch (globalError) {
  console.error('[RifaZone] Erro na inicialização do wrapper de fetch:', globalError);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
