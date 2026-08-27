import React, { useState, useEffect } from 'react';
import { CampanhaPublicaView } from './components/CampanhaPublicaView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AlertTriangle, Copy, X, Check } from 'lucide-react';
import { lazyWithRetry } from './lib/lazy-retry';

const AdminPanel = lazyWithRetry(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('admin');
  const [codigoCampanha, setCodigoCampanha] = useState<string>('');

  // Sistema de Erros Global e Copiável
  const [globalError, setGlobalError] = useState<{
    message: string;
    source?: string;
    lineno?: number;
    colno?: number;
    stack?: string;
    type?: string;
  } | null>(null);
  const [copiadoError, setCopiadoError] = useState(false);

  useEffect(() => {
    const handleUrlChange = () => {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/c/')) {
        const codigo = pathname.replace('/c/', '').split('/')[0];
        if (codigo) {
          setCodigoCampanha(codigo);
          setCurrentRoute('publica');
        } else {
          setCurrentRoute('admin');
        }
      } else {
        setCurrentRoute('admin');
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);

    // Captura de Erros de Runtime Javascript
    const handleGlobalError = (event: ErrorEvent) => {
      // Ignorar erros benignos de websocket de desenvolvimento
      if (event.message?.includes('websocket') || event.message?.includes('HMR')) return;
      setGlobalError({
        message: event.message || 'Erro inesperado de execução',
        source: event.filename ? event.filename.split('/').pop() : 'Código Interno',
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack || 'Sem rastreamento extra de pilha disponível.',
        type: 'Erro de Execução (Runtime)'
      });
    };

    // Captura de Rejeições de Promessas não tratadas
    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (reason?.message?.includes('websocket') || reason?.message?.includes('HMR')) return;
      setGlobalError({
        message: reason?.message || String(reason) || 'Falha em operação de rede (Promise Rejection)',
        stack: reason?.stack || JSON.stringify(reason, null, 2) || 'Sem rastreamento de pilha.',
        type: 'Falha de API / Conexão Assíncrona'
      });
    };

    // Captura de Erros Customizados despachados pelo aplicativo
    const handleCustomAppError = (event: CustomEvent) => {
      setGlobalError({
        message: event.detail?.message || 'Erro disparado pelo sistema',
        source: event.detail?.source || 'Módulo do Aplicativo',
        stack: event.detail?.stack || 'Sem detalhes técnicos fornecidos.',
        type: event.detail?.type || 'Erro do Aplicativo'
      });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);
    window.addEventListener('app-error', handleCustomAppError as EventListener);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
      window.removeEventListener('app-error', handleCustomAppError as EventListener);
    };
  }, []);

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/');
    setCurrentRoute('admin');
  };

  const navigateToCampanha = (codigo: string) => {
    window.history.pushState({}, '', `/c/${codigo}`);
    setCodigoCampanha(codigo);
    setCurrentRoute('publica');
  };

  const formatCopyableError = () => {
    if (!globalError) return '';
    return `[DIAGNÓSTICO RIFAZONE]
Tipo de Erro: ${globalError.type || 'Desconhecido'}
Mensagem: ${globalError.message}
Origem: ${globalError.source || 'Não especificado'}${globalError.lineno ? ` (Linha ${globalError.lineno}:${globalError.colno})` : ''}
Detalhes / Stack Trace:
${globalError.stack || 'Sem mais detalhes'}`;
  };

  return (
    <>
      {currentRoute === 'publica' && codigoCampanha ? (
        <CampanhaPublicaView
          codigo={codigoCampanha}
          onNavigateAdmin={navigateToAdmin}
        />
      ) : (
        <React.Suspense fallback={
          <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-slate-400">Carregando painel...</p>
            </div>
          </div>
        }>
          <ErrorBoundary titulo="Erro no painel">
            <AdminPanel onSelectCampanha={navigateToCampanha} />
          </ErrorBoundary>
        </React.Suspense>
      )}

      {/* OVERLAY DE ERROS GLOBAL E COPIÁVEL */}
      {globalError && (
        <div className="fixed bottom-6 right-6 z-[9999] max-w-md w-full bg-slate-900 border-2 border-rose-500/40 rounded-3xl p-5 shadow-2xl shadow-rose-950/20 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/25 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-rose-300 uppercase tracking-wider">{globalError.type || 'Erro Detectado'}</h4>
                <p className="text-[10px] text-slate-400">Ocorreu um problema no processamento</p>
              </div>
            </div>
            <button
              onClick={() => setGlobalError(null)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Fechar Alerta"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5 mt-3 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">O que aconteceu:</span>
              <p className="text-white font-semibold leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/50">
                {globalError.message}
              </p>
            </div>

            {globalError.source && (
              <div className="flex justify-between items-center text-[10px] bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/40">
                <span className="text-slate-500">Local do Erro:</span>
                <span className="font-mono text-rose-300 font-bold">
                  {globalError.source} {globalError.lineno ? `(Linha ${globalError.lineno})` : ''}
                </span>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pilha de Execução (Logs):</span>
              <pre className="text-[9px] bg-slate-950 p-2.5 rounded-xl text-slate-400 font-mono overflow-x-auto max-h-32 custom-scrollbar select-text leading-tight whitespace-pre-wrap border border-slate-800/50">
                {globalError.stack}
              </pre>
            </div>

            <div className="flex gap-2 pt-1 border-t border-slate-800">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(formatCopyableError());
                  setCopiadoError(true);
                  setTimeout(() => setCopiadoError(false), 2000);
                }}
                className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 text-xs font-bold rounded-xl border border-rose-500/30 flex items-center justify-center gap-1.5 transition"
              >
                {copiadoError ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copiado para Área de Transferência!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar Diagnóstico para Suporte
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
