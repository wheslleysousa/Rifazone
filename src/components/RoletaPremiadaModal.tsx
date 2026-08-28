import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, Trophy, X, PartyPopper, CheckCircle2, RotateCw } from 'lucide-react';
import { dispararExplosaoConfetes, limparConfetes } from '../utils/confettiUtils';
import { RoletaItem } from '../types';

interface Props {
  itens: RoletaItem[];
  compradorNome: string;
  onClose: () => void;
}

export const RoletaPremiadaModal: React.FC<Props> = ({ itens, compradorNome, onClose }) => {
  const [girando, setGirando] = useState(false);
  const [rotacao, setRotacao] = useState(0);
  const [itemGanhado, setItemGanhado] = useState<RoletaItem | null>(null);
  const [jaGirou, setJaGirou] = useState(false);

  // Limpa confetes ao desmontar o componente
  useEffect(() => {
    return () => {
      limparConfetes();
    };
  }, []);

  // Lista padrão de itens caso nenhum venha configurado
  const itensRoleta: RoletaItem[] = itens && itens.length > 0 ? itens : [
    { titulo: '🎟️ +5 Cotas Grátis', cor: '#10b981', chancePct: 30 },
    { titulo: '🎁 R$ 20 no Pix', cor: '#f59e0b', chancePct: 15 },
    { titulo: '⭐ Quase! Tente na próxima', cor: '#64748b', chancePct: 30 },
    { titulo: '🎟️ +10 Cotas Bônus', cor: '#8b5cf6', chancePct: 15 },
    { titulo: '🏆 Super Bônus R$ 50', cor: '#ec4899', chancePct: 10 },
  ];

  const totalSegmentos = itensRoleta.length;
  const anguloPorSegmento = 360 / totalSegmentos;

  const handleGirar = () => {
    if (girando || jaGirou) return;

    setGirando(true);
    // Sorteio baseado nas probabilidades
    const rand = Math.random() * 100;
    let acum = 0;
    let indexEscolhido = 0;

    for (let i = 0; i < itensRoleta.length; i++) {
      acum += itensRoleta[i].chancePct || (100 / totalSegmentos);
      if (rand <= acum) {
        indexEscolhido = i;
        break;
      }
    }

    // Calcula rotação: várias voltas completas (5 a 8 voltas) + ajuste para o ponteiro
    const voltas = 5 + Math.floor(Math.random() * 3);
    const anguloFinal = (voltas * 360) + (360 - (indexEscolhido * anguloPorSegmento) - (anguloPorSegmento / 2));
    
    setRotacao(anguloFinal);

    setTimeout(() => {
      setGirando(false);
      setJaGirou(true);
      setItemGanhado(itensRoleta[indexEscolhido]);
      
      dispararExplosaoConfetes();
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl text-white text-center overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Bônus Especial de Compra
        </div>

        <h3 className="text-xl font-black text-white mb-1">
          Roleta Premiada da Sorte! 🎰
        </h3>
        <p className="text-slate-300 text-xs mb-6">
          Olá <span className="text-emerald-400 font-bold">{compradorNome || 'Participante'}</span>, você ganhou 1 giro grátis para concorrer a prêmios extras!
        </p>

        {/* Roleta Visual Container */}
        <div className="relative w-64 h-64 mx-auto mb-6 flex items-center justify-center">
          {/* Ponteiro / Marcador */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-amber-400 drop-shadow-md" />

          {/* Roda giratória */}
          <div
            className="w-56 h-56 rounded-full border-4 border-amber-400/80 shadow-2xl relative overflow-hidden transition-transform duration-[4000ms] cubic-bezier(0.15, 0.9, 0.25, 1)"
            style={{
              transform: `rotate(${rotacao}deg)`,
              background: `conic-gradient(${itensRoleta
                .map((item, idx) => `${item.cor} ${idx * anguloPorSegmento}deg ${(idx + 1) * anguloPorSegmento}deg`)
                .join(', ')})`
            }}
          >
            {/* Divisões e textos */}
            {itensRoleta.map((item, idx) => {
              const angulo = (idx * anguloPorSegmento) + (anguloPorSegmento / 2);
              return (
                <div
                  key={idx}
                  className="absolute top-0 left-1/2 w-0 h-1/2 origin-bottom flex items-start justify-center pt-2 text-[10px] font-black text-white drop-shadow-sm select-none"
                  style={{
                    transform: `translateX(-50%) rotate(${angulo}deg)`
                  }}
                >
                  <span className="writing-vertical -rotate-90 origin-center truncate max-w-[70px]">
                    {item.titulo}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Centro da Roleta */}
          <div className="absolute z-10 w-12 h-12 rounded-full bg-slate-900 border-2 border-amber-400 shadow-md flex items-center justify-center">
            <Gift className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        {/* Resultado */}
        {itemGanhado && (
          <div className="mb-6 p-4 bg-purple-950/60 border border-purple-500/40 rounded-2xl animate-in zoom-in-95">
            <span className="text-xs text-purple-300 font-semibold uppercase block mb-1">
              Resultado do seu giro:
            </span>
            <div className="text-lg font-black text-amber-300 flex items-center justify-center gap-2">
              <PartyPopper className="w-5 h-5" />
              {itemGanhado.titulo}
            </div>
          </div>
        )}

        {/* Botão de Girar ou Concluir */}
        {!jaGirou ? (
          <button
            onClick={handleGirar}
            disabled={girando}
            className={`w-full py-3.5 px-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition ${
              girando
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-purple-500/25 active:scale-[0.98]'
            }`}
          >
            <RotateCw className={`w-4 h-4 ${girando ? 'animate-spin' : ''}`} />
            {girando ? 'GIRANDO A ROLETA...' : 'GIRAR ROLETA GRÁTIS! 🎲'}
          </button>
        ) : (
          <button
            onClick={onClose}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition"
          >
            Ver Meus Números da Campanha
          </button>
        )}
      </div>
    </div>
  );
};
