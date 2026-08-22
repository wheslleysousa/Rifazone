import React, { useState, useEffect } from 'react';
import { CampanhaPublicaView } from './components/CampanhaPublicaView';
import { AdminPanel } from './components/AdminPanel';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('publica');
  const [codigoCampanha, setCodigoCampanha] = useState<string>('iphone-16-pro');

  useEffect(() => {
    const handleUrlChange = () => {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/admin')) {
        setCurrentRoute('admin');
      } else if (pathname.startsWith('/c/')) {
        const codigo = pathname.replace('/c/', '').split('/')[0];
        if (codigo) setCodigoCampanha(codigo);
        setCurrentRoute('publica');
      } else {
        setCurrentRoute('publica');
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setCurrentRoute('admin');
  };

  const navigateToCampanha = (codigo: string) => {
    window.history.pushState({}, '', `/c/${codigo}`);
    setCodigoCampanha(codigo);
    setCurrentRoute('publica');
  };

  if (currentRoute === 'admin') {
    return <AdminPanel onSelectCampanha={navigateToCampanha} />;
  }

  return (
    <CampanhaPublicaView
      codigo={codigoCampanha}
      onNavigateAdmin={navigateToAdmin}
    />
  );
}
