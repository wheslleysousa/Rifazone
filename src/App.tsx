import React, { useState, useEffect } from 'react';
import { CampanhaPublicaView } from './components/CampanhaPublicaView';
import { AdminPanel } from './components/AdminPanel';

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

  return <AdminPanel onSelectCampanha={navigateToCampanha} />;
}
