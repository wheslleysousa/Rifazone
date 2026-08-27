import React from 'react';

/**
 * React.lazy com auto-recuperação.
 *
 * Quando sai um deploy novo, o Vite troca o hash dos arquivos (ex:
 * TemaBuilderView-<hash>.js). Uma aba que ainda está com o index.html antigo
 * tenta buscar o arquivo velho, que não existe mais, e o import dinâmico falha
 * com "Failed to fetch dynamically imported module".
 *
 * Este wrapper detecta essa falha e recarrega a página UMA vez para pegar a
 * versão nova. Um flag em sessionStorage evita loop infinito de reload (caso a
 * falha seja por outro motivo, como estar offline).
 */
export function lazyWithRetry(factory: () => Promise<any>): any {
  return (React as any).lazy(async () => {
    const KEY = 'rz_chunk_reloaded';
    try {
      const mod = await factory();
      try { window.sessionStorage.removeItem(KEY); } catch (e) {}
      return mod;
    } catch (err) {
      let jaRecarregou = false;
      try { jaRecarregou = window.sessionStorage.getItem(KEY) === '1'; } catch (e) {}
      if (!jaRecarregou) {
        try { window.sessionStorage.setItem(KEY, '1'); } catch (e) {}
        window.location.reload();
        // Mantém o carregamento "pendente" enquanto a página recarrega.
        return new Promise(() => {});
      }
      // Já tentou recarregar e ainda falhou: propaga para o ErrorBoundary.
      throw err;
    }
  });
}
