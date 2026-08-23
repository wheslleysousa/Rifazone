import React, { useState, useEffect } from 'react';
import { CampanhaPublicaView } from './components/CampanhaPublicaView';

const AdminPanel = React.lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));

export default function App() {
  // A tela inicial (/) é o painel (login/cadastro -> dashboard).
  // A página pública de uma campanha só aparece em /c/{codigo}.
  const [currentRoute, setCurrentRoute] = useState<string>('admin');
  const [codigoCampanha, setCodigoCampanha] = useState<string>('');

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
        // Raiz (/), /admin e qualquer outra rota -> painel do organizador
        setCurrentRoute('admin');
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
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

  if (currentRoute === 'publica' && codigoCampanha) {
    return (
      <CampanhaPublicaView
        codigo={codigoCampanha}
        onNavigateAdmin={navigateToAdmin}
      />
    );
  }

  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-400">Carregando painel...</p>
        </div>
      </div>
    }>
      <AdminPanel onSelectCampanha={navigateToCampanha} />
    </React.Suspense>
  );
}
