import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag } from 'lucide-react';

/**
 * Toast flutuante de "prova social" — simula compras recentes para gerar urgência.
 * Lê a configuração de campanha.checkout.notificacoesSociais.
 * Não dispara em modo preview.
 */
const NOMES = ['Maria S.', 'João P.', 'Ana L.', 'Carlos M.', 'Fernanda R.', 'Lucas A.', 'Patrícia G.', 'Rafael T.', 'Juliana C.', 'Bruno F.', 'Camila D.', 'Diego N.'];
const CIDADES = ['São Paulo/SP', 'Rio de Janeiro/RJ', 'Belo Horizonte/MG', 'Curitiba/PR', 'Salvador/BA', 'Fortaleza/CE', 'Recife/PE', 'Porto Alegre/RS', 'Manaus/AM', 'Goiânia/GO'];

function posClasses(posicao?: string): string {
  switch (posicao) {
    case 'topo-esq': return 'top-4 left-4';
    case 'topo-dir': return 'top-4 right-4';
    case 'base-dir': return 'bottom-4 right-4';
    case 'base-esq':
    default: return 'bottom-4 left-4';
  }
}

export const SocialNotifications: React.FC<any> = ({ config, campanhaTitulo }) => {
  const [visivel, setVisivel] = useState(false);
  const [texto, setTexto] = useState('');
  const timerRef = useRef<any>(null);

  const mensagens: string[] | undefined = config?.mensagens;
  const intervaloMs = Math.max(4, Number(config?.intervalo) || 12) * 1000;

  useEffect(() => {
    const gerar = () => {
      let msg: string;
      if (mensagens && mensagens.length > 0) {
        msg = mensagens[Math.floor(Math.random() * mensagens.length)];
      } else {
        const nome = NOMES[Math.floor(Math.random() * NOMES.length)];
        const cidade = CIDADES[Math.floor(Math.random() * CIDADES.length)];
        const qtd = [5, 10, 20, 50, 100][Math.floor(Math.random() * 5)];
        const min = Math.floor(Math.random() * 12) + 1;
        msg = `${nome} de ${cidade} comprou ${qtd} cotas há ${min} min`;
      }
      setTexto(msg);
      setVisivel(true);
      timerRef.current = setTimeout(() => setVisivel(false), 5000);
    };

    // Primeira aparição após um pequeno atraso, depois em loop
    const inicial = setTimeout(gerar, 3500);
    const loop = setInterval(gerar, intervaloMs);
    return () => {
      clearTimeout(inicial);
      clearInterval(loop);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [intervaloMs, mensagens]);

  if (!texto) return null;

  return (
    <div
      className={`fixed z-40 max-w-[300px] transition-all duration-500 ${posClasses(config?.posicao)} ${
        visivel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
      aria-live="polite"
    >
      <div className="flex items-center gap-3 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 px-3.5 py-2.5">
        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <ShoppingBag className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-bold leading-tight truncate">{texto}</p>
          <p className="text-[10px] text-slate-500 truncate">{campanhaTitulo || 'Compra confirmada'} · agora</p>
        </div>
      </div>
    </div>
  );
};
