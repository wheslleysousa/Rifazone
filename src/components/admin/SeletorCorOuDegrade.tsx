import React, { useState, useEffect } from 'react';
import { Palette, Sparkles, ArrowRight, ArrowDown, ArrowUp, ArrowLeft, Disc, RefreshCw } from 'lucide-react';

export interface SeletorCorOuDegradeProps {
  label?: string;
  descricao?: string;
  valor: string | undefined;
  onChange: (novoValor: string) => void;
  permitirDegrade?: boolean;
  className?: string;
}

export interface GradientParsed {
  tipo: 'linear' | 'radial';
  direcao: string;
  cores: string[];
}

export function converterParaHexLocal(cor: string | undefined, padrao = '#10b981'): string {
  if (!cor) return padrao;
  const c = cor.trim();
  if (c.startsWith('#')) {
    if (c.length === 9) return c.substring(0, 7);
    return c;
  }
  if (c.startsWith('rgba') || c.startsWith('rgb')) {
    const match = c.match(/\d+/g);
    if (match && match.length >= 3) {
      const r = parseInt(match[0], 10);
      const g = parseInt(match[1], 10);
      const b = parseInt(match[2], 10);
      const toHex = (x: number) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
  }
  // Se for hex sem hash (ex: '10b981' ou 'fff')
  if (/^[0-9A-Fa-f]{3,8}$/.test(c)) {
    return `#${c}`;
  }
  return padrao;
}

export function parseColorOrGradient(input: string | undefined, defaultColor = '#10b981'): { isGradient: boolean; color: string; gradient: GradientParsed } {

  if (!input) {
    return {
      isGradient: false,
      color: defaultColor,
      gradient: { tipo: 'linear', direcao: 'to bottom', cores: [defaultColor, '#047857'] }
    };
  }

  const trimmed = input.trim();

  // Linear gradient
  if (trimmed.startsWith('linear-gradient(')) {
    const content = trimmed.slice(16, -1).trim();
    const parts = content.split(/,(?![^(]*\))/).map(s => s.trim());
    let direcao = 'to bottom';
    let cores: string[] = [];

    if (parts.length > 0) {
      if (
        parts[0].startsWith('to ') ||
        parts[0].includes('deg') ||
        parts[0].startsWith('circle') ||
        parts[0].startsWith('ellipse')
      ) {
        direcao = parts[0];
        cores = parts.slice(1);
      } else {
        cores = parts;
      }
    }

    if (cores.length === 0) cores = [defaultColor, '#000000'];
    if (cores.length === 1) cores.push('#000000');

    return {
      isGradient: true,
      color: cores[0] || defaultColor,
      gradient: { tipo: 'linear', direcao, cores }
    };
  }

  // Radial gradient
  if (trimmed.startsWith('radial-gradient(')) {
    const content = trimmed.slice(16, -1).trim();
    const parts = content.split(/,(?![^(]*\))/).map(s => s.trim());
    const cores = parts.length >= 2 ? parts : [defaultColor, '#000000'];

    return {
      isGradient: true,
      color: cores[0] || defaultColor,
      gradient: { tipo: 'radial', direcao: 'circle', cores }
    };
  }

  return {
    isGradient: false,
    color: trimmed,
    gradient: { tipo: 'linear', direcao: 'to bottom', cores: [trimmed, '#0f172a'] }
  };
}

export function buildGradientString(gradient: GradientParsed): string {
  if (gradient.tipo === 'radial') {
    return `radial-gradient(circle at center, ${gradient.cores.join(', ')})`;
  }
  return `linear-gradient(${gradient.direcao || 'to bottom'}, ${gradient.cores.join(', ')})`;
}

const DIRECOES = [
  { id: 'to right', label: 'Esq ➔ Dir', icon: ArrowRight },
  { id: 'to left', label: 'Dir ➔ Esq', icon: ArrowLeft },
  { id: 'to bottom', label: 'Cima ➔ Baixo', icon: ArrowDown },
  { id: 'to top', label: 'Baixo ➔ Cima', icon: ArrowUp },
  { id: 'to bottom right', label: 'Diagonal ↘', icon: ArrowRight },
  { id: 'to bottom left', label: 'Diagonal ↙', icon: ArrowLeft },
  { id: 'to top right', label: 'Diagonal ↗', icon: ArrowRight },
  { id: 'to top left', label: 'Diagonal ↖', icon: ArrowLeft },
  { id: 'radial', label: 'Radial 🔘', icon: Disc },
];

const PRESETS_DEGRADE = [
  { nome: 'Esmeralda', grad: 'linear-gradient(to right, #10b981, #047857)' },
  { nome: 'Rubi Fogo', grad: 'linear-gradient(to right, #ef4444, #991b1b)' },
  { nome: 'Ouro Real', grad: 'linear-gradient(to right, #f59e0b, #b45309)' },
  { nome: 'Violeta Neon', grad: 'linear-gradient(to right, #8b5cf6, #4c1d95)' },
  { nome: 'Dark Luxo', grad: 'linear-gradient(to bottom, #1e293b, #090d16)' },
  { nome: 'Sombra Negra', grad: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.4) 60%, transparent 100%)' },
  { nome: 'Sunset', grad: 'linear-gradient(to right, #f97316, #ec4899)' },
  { nome: 'Oceano Azul', grad: 'linear-gradient(to right, #06b6d4, #1e40af)' },
];

export const SeletorCorOuDegrade: React.FC<SeletorCorOuDegradeProps> = ({
  label,
  descricao,
  valor = '#10b981',
  onChange,
  permitirDegrade = true,
  className = ''
}) => {
  const parsed = parseColorOrGradient(valor);
  const [modo, setModo] = useState<'solida' | 'degrade'>(parsed.isGradient ? 'degrade' : 'solida');
  const [corSolida, setCorSolida] = useState<string>(converterParaHexLocal(parsed.color) || '#10b981');
  const [direcao, setDirecao] = useState<string>(parsed.gradient.direcao || 'to bottom');
  const [coresDegrade, setCoresDegrade] = useState<string[]>(
    (parsed.gradient.cores.length >= 2 ? parsed.gradient.cores : [parsed.color || '#10b981', '#0f172a']).map(c => converterParaHexLocal(c))
  );
  const [qtdCores, setQtdCores] = useState<number>(coresDegrade.length >= 3 ? 3 : 2);
  const [expandido, setExpandido] = useState(false);

  useEffect(() => {
    const atual = parseColorOrGradient(valor);
    setModo(atual.isGradient ? 'degrade' : 'solida');
    if (!atual.isGradient) {
      setCorSolida(converterParaHexLocal(atual.color));
    } else {
      setDirecao(atual.gradient.direcao);
      setCoresDegrade(atual.gradient.cores.map(c => converterParaHexLocal(c)));
      setQtdCores(atual.gradient.cores.length >= 3 ? 3 : 2);
    }
  }, [valor]);

  const normalizarCor = (input: string): string => {
    return converterParaHexLocal(input);
  };

  const aplicarSolida = (cor: string) => {
    const hex = converterParaHexLocal(cor);
    setCorSolida(hex);
    setModo('solida');
    onChange(hex);
  };

  const aplicarDegrade = (novaDir: string, novasCores: string[]) => {
    setDirecao(novaDir);
    const coresNorm = novasCores.map(c => normalizarCor(c));
    setCoresDegrade(coresNorm);
    setModo('degrade');
    const gradStr = buildGradientString({
      tipo: novaDir === 'radial' ? 'radial' : 'linear',
      direcao: novaDir,
      cores: coresNorm
    });
    onChange(gradStr);
  };

  const alterarCorDegrade = (index: number, novaCor: string) => {
    const copia = [...coresDegrade];
    copia[index] = novaCor;
    aplicarDegrade(direcao, copia);
  };

  const inverterCores = () => {
    const invertidas = [...coresDegrade].reverse();
    aplicarDegrade(direcao, invertidas);
  };

  const alterarQtdCores = (qtd: number) => {
    setQtdCores(qtd);
    if (qtd === 2 && coresDegrade.length > 2) {
      aplicarDegrade(direcao, [coresDegrade[0], coresDegrade[coresDegrade.length - 1]]);
    } else if (qtd === 3 && coresDegrade.length < 3) {
      aplicarDegrade(direcao, [coresDegrade[0], '#4f46e5', coresDegrade[1] || '#0f172a']);
    }
  };

  return (
    <div className={`p-3.5 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-3 ${className}`}>
      {/* Header com Label e Switch de Modo */}
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          {label && <label className="text-xs font-black text-slate-200 block">{label}</label>}
          {descricao && <span className="text-[10px] text-slate-400 block leading-tight">{descricao}</span>}
        </div>

        {permitirDegrade && (
          <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => {
                setModo('solida');
                aplicarSolida(corSolida);
              }}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer ${
                modo === 'solida'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Palette className="w-3 h-3" />
              Cor Única
            </button>
            <button
              type="button"
              onClick={() => {
                setModo('degrade');
                aplicarDegrade(direcao, coresDegrade);
                setExpandido(true);
              }}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer ${
                modo === 'degrade'
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Degradê
            </button>
          </div>
        )}
      </div>

      {/* MODO COR ÚNICA */}
      {modo === 'solida' && (
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <input
              type="color"
              value={corSolida.startsWith('#') && corSolida.length === 7 ? corSolida : '#10b981'}
              onChange={e => aplicarSolida(e.target.value)}
              className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0 shadow-inner"
            />
          </div>
          <input
            type="text"
            value={corSolida}
            onChange={e => aplicarSolida(e.target.value)}
            placeholder="#10B981"
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center text-white uppercase focus:outline-none focus:border-emerald-500 tracking-wider"
          />
        </div>
      )}

      {/* MODO DEGRADÊ */}
      {modo === 'degrade' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {/* Prévia ao vivo do Degradê */}
          <div
            className="w-full h-12 rounded-xl border border-white/20 shadow-lg relative overflow-hidden flex items-center justify-between px-3"
            style={{ background: buildGradientString({ tipo: direcao === 'radial' ? 'radial' : 'linear', direcao, cores: coresDegrade }) }}
          >
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-full text-white border border-white/10 shadow">
              Prévia do Degradê
            </span>

            <button
              type="button"
              onClick={inverterCores}
              title="Inverter ordem das cores"
              className="px-2 py-1 bg-black/60 hover:bg-black/80 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 border border-white/15 backdrop-blur-md transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Inverter
            </button>
          </div>

          {/* Seletores de Cores do Degradê */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300">Cores do Degradê ({qtdCores} cores):</span>
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => alterarQtdCores(2)}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                    qtdCores === 2 ? 'bg-purple-500 text-white' : 'text-slate-400'
                  }`}
                >
                  2 Cores
                </button>
                <button
                  type="button"
                  onClick={() => alterarQtdCores(3)}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                    qtdCores === 3 ? 'bg-purple-500 text-white' : 'text-slate-400'
                  }`}
                >
                  3 Cores
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Cor 1 (Início) */}
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                <label className="text-[10px] font-black text-purple-300 uppercase tracking-wider block">Cor 1 (Início)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={coresDegrade[0]?.startsWith('#') ? coresDegrade[0] : '#10b981'}
                    onChange={e => alterarCorDegrade(0, e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  />
                  <input
                    type="text"
                    value={coresDegrade[0] || ''}
                    onChange={e => alterarCorDegrade(0, e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Cor 2 (Meio - se 3 cores) */}
              {qtdCores === 3 && (
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                  <label className="text-[10px] font-black text-pink-300 uppercase tracking-wider block">Cor 2 (Meio)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={coresDegrade[1]?.startsWith('#') ? coresDegrade[1] : '#6366f1'}
                      onChange={e => alterarCorDegrade(1, e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={coresDegrade[1] || ''}
                      onChange={e => alterarCorDegrade(1, e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Cor Final */}
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                <label className="text-[10px] font-black text-amber-300 uppercase tracking-wider block">
                  {qtdCores === 3 ? 'Cor 3 (Fim)' : 'Cor 2 (Fim)'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={
                      (qtdCores === 3 ? coresDegrade[2] : coresDegrade[1])?.startsWith('#')
                        ? (qtdCores === 3 ? coresDegrade[2] : coresDegrade[1])
                        : '#047857'
                    }
                    onChange={e => alterarCorDegrade(qtdCores === 3 ? 2 : 1, e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  />
                  <input
                    type="text"
                    value={(qtdCores === 3 ? coresDegrade[2] : coresDegrade[1]) || ''}
                    onChange={e => alterarCorDegrade(qtdCores === 3 ? 2 : 1, e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-mono text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Direção do Degradê */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-bold text-slate-300 block">Direção / Ângulo do Efeito:</label>
            <div className="grid grid-cols-3 gap-1.5">
              {DIRECOES.map(d => {
                const isSelected = direcao === d.id;
                const IconComponent = d.icon;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => aplicarDegrade(d.id, coresDegrade)}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border transition cursor-pointer ${
                      isSelected
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <IconComponent className="w-3 h-3" />
                    <span>{d.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paletas / Presets Rápidos */}
          <div className="space-y-1.5 pt-1 border-t border-slate-900">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Modelos Prontos de Degradê:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS_DEGRADE.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChange(p.grad)}
                  className="px-2 py-1 rounded-lg border border-slate-700 text-[9px] font-bold text-white shadow-sm flex items-center gap-1.5 hover:scale-105 transition cursor-pointer"
                  style={{ background: p.grad }}
                >
                  <span className="bg-black/50 px-1 py-0.5 rounded backdrop-blur-sm">{p.nome}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
