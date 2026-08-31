import { confirmar } from '../../lib/confirm';
import { toast } from '../../lib/toast';
import React, { useState, useEffect } from 'react';
import { CelebrationPreview } from './CelebrationPreview';
import { Campanha, TemaCampanha, TEMA_PADRAO, EstiloSalvo, CheckoutConfig, DEFAULT_CHECKOUT_CONFIG, GOOGLE_FONTS_LIST } from '../../types';
import { CampanhaPublicaView } from '../CampanhaPublicaView';
import { ErrorBoundary } from '../ErrorBoundary';
import { 
  Palette, Sparkles, Smartphone, Eye, GripVertical, Check, 
  RotateCcw, Save, Trash2, ArrowUp, ArrowDown, ArrowLeft, Layers, 
  Type, MousePointer, ShieldCheck, ChevronRight, Layout, 
  Sliders, X, RefreshCw, Bookmark, FolderHeart, CheckCircle2,
  CreditCard, QrCode, FileText, CheckCheck, AlertCircle, Shield, Image as ImageIcon, Video, User, ShoppingCart,
  Trophy, Gift, Ticket, Zap, TrendingUp, Users, Info, Plus, Minus, Package, Box, SlidersHorizontal, Maximize2, Slash,
  ChevronUp, ChevronDown, AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { dispararExplosaoConfetes } from '../../utils/confettiUtils';
import { 
  ICON_SETS, 
  getSectionIcon, 
  calcularEstiloBotao, 
  calcularEstiloCard,
  TipoEstiloBotao,
  hexToRgba,
  obterFundoCss,
  gerarGradientDegradeBanner
} from '../../lib/temaHelpers';
import { SeletorCorOuDegrade } from './SeletorCorOuDegrade';

const MODELOS_PRONTOS_REGRA = [
  { id: 'm1', label: 'Padrão Simples', modelo: 'A partir de {valor} cada cota fica por {desconto}' },
  { id: 'm2', label: 'Compre Acima De', modelo: 'Leve cotas por apenas {desconto} comprando acima de {valor}' },
  { id: 'm3', label: 'Aviso de Queda', modelo: 'Aviso: A partir de {valor} o valor da cota cai para {desconto}' },
  { id: 'm4', label: 'Super Desconto', modelo: 'Super Desconto: A partir de {valor} cada cota sai por {desconto}' },
  { id: 'm5', label: 'Economia Garantida', modelo: 'Economize! Cotas por apenas {desconto} a partir de {valor}' },
  { id: 'custom', label: '✏️ Modelo Personalizado', modelo: '' },
];

const SeletorFonteCard = ({ valor, onChange }: { valor: string; onChange: (fonte: string) => void }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white text-left hover:border-purple-500/50 transition cursor-pointer"
      >
        <span style={{ fontFamily: valor || 'inherit' }}>
          {valor || 'Usar Fonte Padrão do Tema'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 space-y-0.5 custom-scrollbar">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="w-full text-left p-2 rounded-lg hover:bg-slate-900/80 transition text-xs font-bold text-slate-400"
            >
              Usar Fonte Padrão do Tema
            </button>
            {GOOGLE_FONTS_LIST.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  onChange(f);
                  setOpen(false);
                }}
                className={`w-full text-left p-2 rounded-lg hover:bg-slate-900 transition text-xs font-bold flex flex-col ${
                  valor === f ? 'bg-purple-500/10 border border-purple-500/30 text-purple-300' : 'text-slate-300'
                }`}
                style={{ fontFamily: f }}
              >
                <span>{f}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const PRESETS = [
  {
    nome: 'Dark Moderno',
    tema: { ...TEMA_PADRAO }
  },
  {
    nome: 'Padrão Claro',
    tema: { ...TEMA_PADRAO, cores: { ...TEMA_PADRAO.cores, primaria: '#10b981', destaque: '#059669', fundo: '#f8fafc', texto: '#0f172a', titulos: '#020617', descricoes: '#475569', botao: '#10b981', textoBotao: '#ffffff', cardFundo: '#ffffff', cardBorda: '#e2e8f0', faviconFundo: '#10b981', iconeCor: '#10b981' } }
  },
  {
    nome: 'Oceano Azul',
    tema: { ...TEMA_PADRAO, cores: { ...TEMA_PADRAO.cores, primaria: '#3b82f6', destaque: '#2563eb', fundo: '#0a192f', texto: '#e2e8f0', titulos: '#ffffff', descricoes: '#94a3b8', botao: '#3b82f6', textoBotao: '#ffffff', cardFundo: '#112240', cardBorda: '#1e293b', faviconFundo: '#3b82f6', iconeCor: '#3b82f6' } }
  },
  {
    nome: 'Floresta Verde',
    tema: { ...TEMA_PADRAO, cores: { ...TEMA_PADRAO.cores, primaria: '#22c55e', destaque: '#16a34a', fundo: '#064e3b', texto: '#ecfdf5', titulos: '#ffffff', descricoes: '#a7f3d0', botao: '#22c55e', textoBotao: '#064e3b', cardFundo: '#065f46', cardBorda: '#047857', faviconFundo: '#22c55e', iconeCor: '#22c55e' } }
  },
  {
    nome: 'Dourado Escuro',
    tema: { ...TEMA_PADRAO, cores: { ...TEMA_PADRAO.cores, primaria: '#eab308', destaque: '#ca8a04', fundo: '#18181b', texto: '#fafafa', titulos: '#ffffff', descricoes: '#a1a1aa', botao: '#eab308', textoBotao: '#18181b', cardFundo: '#27272a', cardBorda: '#3f3f46', faviconFundo: '#eab308', iconeCor: '#eab308' } }
  },
  {
    nome: 'Roxo Escuro',
    tema: { ...TEMA_PADRAO, cores: { ...TEMA_PADRAO.cores, primaria: '#a855f7', destaque: '#9333ea', fundo: '#2e1065', texto: '#f3e8ff', titulos: '#ffffff', descricoes: '#d8b4fe', botao: '#a855f7', textoBotao: '#ffffff', cardFundo: '#3b0764', cardBorda: '#581c87', faviconFundo: '#a855f7', iconeCor: '#a855f7' } }
  },
  {
    nome: 'Pôr do Sol',
    tema: { ...TEMA_PADRAO, cores: { ...TEMA_PADRAO.cores, primaria: '#f97316', destaque: '#ea580c', fundo: '#1c1917', texto: '#fff7ed', titulos: '#ffffff', descricoes: '#fdba74', botao: '#f97316', textoBotao: '#ffffff', cardFundo: '#292524', cardBorda: '#44403c', faviconFundo: '#f97316', iconeCor: '#fb923c' } }
  },
  {
    nome: 'Verde Escuro',
    tema: { ...TEMA_PADRAO, cores: { ...TEMA_PADRAO.cores, primaria: '#10b981', destaque: '#059669', fundo: '#022c22', texto: '#d1fae5', titulos: '#ffffff', descricoes: '#6ee7b7', botao: '#10b981', textoBotao: '#022c22', cardFundo: '#064e3b', cardBorda: '#065f46', faviconFundo: '#10b981', iconeCor: '#34d399' } }
  }
];


const SeletorAlinhamento = ({
  valor = 'esquerda',
  onChange,
  label = 'Alinhamento do Texto na Página:'
}: {
  valor?: 'esquerda' | 'centro' | 'direita';
  onChange: (val: 'esquerda' | 'centro' | 'direita') => void;
  label?: string;
}) => (
  <div className="flex items-center justify-between pt-1 pb-1">
    <label className="text-[11px] font-bold text-slate-300">{label}</label>
    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
      {[
        { id: 'esquerda', label: 'À Esquerda', Icon: AlignLeft },
        { id: 'centro', label: 'Centralizado', Icon: AlignCenter },
        { id: 'direita', label: 'À Direita', Icon: AlignRight },
      ].map(opt => {
        const active = (valor || 'esquerda') === opt.id;
        const Icon = opt.Icon;
        return (
          <button
            key={opt.id}
            type="button"
            title={opt.label}
            onClick={() => onChange(opt.id as any)}
            className={`p-1.5 rounded-lg transition flex items-center justify-center cursor-pointer ${
              active
                ? 'bg-purple-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  </div>
);

const SectionTextConfig = ({
  titulo,
  subtitulo,
  fonteTitulo,
  fonteSubtitulo,
  tamanhoTitulo = 16,
  tamanhoSubtitulo = 12,
  alinhamento = 'esquerda',
  alinhamentoTitulo,
  alinhamentoSubtitulo,
  onTituloChange,
  onSubtituloChange,
  onFonteTituloChange,
  onFonteSubtituloChange,
  onTamanhoTituloChange,
  onTamanhoSubtituloChange,
  onAlinhamentoChange,
  onAlinhamentoTituloChange,
  onAlinhamentoSubtituloChange,
  placeholderTitulo = "Digite o título do bloco...",
  placeholderSubtitulo = "Digite o subtítulo do bloco..."
}: {
  titulo: string;
  subtitulo: string;
  fonteTitulo: string;
  fonteSubtitulo: string;
  tamanhoTitulo?: number;
  tamanhoSubtitulo?: number;
  alinhamento?: 'esquerda' | 'centro' | 'direita';
  alinhamentoTitulo?: 'esquerda' | 'centro' | 'direita';
  alinhamentoSubtitulo?: 'esquerda' | 'centro' | 'direita';
  onTituloChange: (val: string) => void;
  onSubtituloChange: (val: string) => void;
  onFonteTituloChange?: (val: string) => void;
  onFonteSubtituloChange?: (val: string) => void;
  onTamanhoTituloChange?: (val: number) => void;
  onTamanhoSubtituloChange?: (val: number) => void;
  onAlinhamentoChange?: (val: 'esquerda' | 'centro' | 'direita') => void;
  onAlinhamentoTituloChange?: (val: 'esquerda' | 'centro' | 'direita') => void;
  onAlinhamentoSubtituloChange?: (val: 'esquerda' | 'centro' | 'direita') => void;
  placeholderTitulo?: string;
  placeholderSubtitulo?: string;
}) => {
  const [tituloAtivo, setTituloAtivo] = useState(titulo.trim() !== '');
  const [subtituloAtivo, setSubtituloAtivo] = useState(subtitulo.trim() !== '');

  const alinTit = alinhamentoTitulo || alinhamento;
  const alinSub = alinhamentoSubtitulo || alinhamento;

  return (
    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-purple-400 shrink-0" />
          <h4 className="text-xs font-black text-white uppercase tracking-wider">Textos, Fontes e Alinhamento</h4>
        </div>
        <span className="text-[10px] text-slate-500 font-medium">Ative/desative títulos e edite a tipografia</span>
      </div>

      {/* Textos & Toggles do Bloco */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TÍTULO */}
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Título do Bloco</span>
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setTituloAtivo(false);
                  onTituloChange('');
                }}
                className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition ${
                  !tituloAtivo && titulo.trim() === ''
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Desativado
              </button>
              <button
                type="button"
                onClick={() => {
                  setTituloAtivo(true);
                }}
                className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition ${
                  tituloAtivo || titulo.trim() !== ''
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Ativado
              </button>
            </div>
          </div>

          {(tituloAtivo || titulo.trim() !== '') ? (
            <div className="space-y-2">
              <input
                type="text"
                value={titulo}
                onChange={e => onTituloChange(e.target.value)}
                placeholder={placeholderTitulo}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />

              {(onAlinhamentoTituloChange || onAlinhamentoChange) && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10.5px] font-medium text-slate-400">Alinhamento do Título:</span>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {[
                      { id: 'esquerda', label: 'À Esquerda', Icon: AlignLeft },
                      { id: 'centro', label: 'Centralizado', Icon: AlignCenter },
                      { id: 'direita', label: 'À Direita', Icon: AlignRight },
                    ].map(opt => {
                      const active = alinTit === opt.id;
                      const Icon = opt.Icon;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          title={opt.label}
                          onClick={() => {
                            if (onAlinhamentoTituloChange) onAlinhamentoTituloChange(opt.id as any);
                            else if (onAlinhamentoChange) onAlinhamentoChange(opt.id as any);
                          }}
                          className={`p-1.5 rounded-lg transition flex items-center justify-center cursor-pointer ${
                            active
                              ? 'bg-purple-600 text-white shadow-md font-bold'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-2.5 text-center bg-slate-950/60 rounded-xl border border-slate-800/80">
              <p className="text-[11px] text-slate-500">Título desativado para este bloco.</p>
            </div>
          )}
        </div>

        {/* SUBTÍTULO */}
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Subtítulo do Bloco</span>
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSubtituloAtivo(false);
                  onSubtituloChange('');
                }}
                className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition ${
                  !subtituloAtivo && subtitulo.trim() === ''
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Desativado
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubtituloAtivo(true);
                }}
                className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition ${
                  subtituloAtivo || subtitulo.trim() !== ''
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Ativado
              </button>
            </div>
          </div>

          {(subtituloAtivo || subtitulo.trim() !== '') ? (
            <div className="space-y-2">
              <input
                type="text"
                value={subtitulo}
                onChange={e => onSubtituloChange(e.target.value)}
                placeholder={placeholderSubtitulo}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />

              {(onAlinhamentoSubtituloChange || onAlinhamentoChange) && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10.5px] font-medium text-slate-400">Alinhamento do Subtítulo:</span>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {[
                      { id: 'esquerda', label: 'À Esquerda', Icon: AlignLeft },
                      { id: 'centro', label: 'Centralizado', Icon: AlignCenter },
                      { id: 'direita', label: 'À Direita', Icon: AlignRight },
                    ].map(opt => {
                      const active = alinSub === opt.id;
                      const Icon = opt.Icon;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          title={opt.label}
                          onClick={() => {
                            if (onAlinhamentoSubtituloChange) onAlinhamentoSubtituloChange(opt.id as any);
                            else if (onAlinhamentoChange) onAlinhamentoChange(opt.id as any);
                          }}
                          className={`p-1.5 rounded-lg transition flex items-center justify-center cursor-pointer ${
                            active
                              ? 'bg-purple-600 text-white shadow-md font-bold'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-2.5 text-center bg-slate-950/60 rounded-xl border border-slate-800/80">
              <p className="text-[11px] text-slate-500">Subtítulo desativado para este bloco.</p>
            </div>
          )}
        </div>
      </div>

      {/* Fontes e Tamanhos da Seção */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
        {/* Título */}
        <div className="space-y-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 block">Fonte do Título</label>
            {onFonteTituloChange && <SeletorFonteCard valor={fonteTitulo} onChange={onFonteTituloChange} />}
          </div>

          {onTamanhoTituloChange && (
            <div className="space-y-1 pt-1 border-t border-slate-800/60">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-slate-400">Tamanho da Fonte (Título):</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onTamanhoTituloChange(Math.max(10, tamanhoTitulo - 1))}
                    className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-xs flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="10"
                    max="48"
                    value={tamanhoTitulo}
                    onChange={e => onTamanhoTituloChange(Math.min(48, Math.max(10, Number(e.target.value) || 10)))}
                    className="w-12 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-center font-mono text-purple-400 font-bold text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => onTamanhoTituloChange(Math.min(48, tamanhoTitulo + 1))}
                    className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-xs flex items-center justify-center"
                  >
                    +
                  </button>
                  <span className="text-slate-500 text-[10px] font-mono">px</span>
                </div>
              </div>
              <input
                type="range"
                min="10"
                max="36"
                step="1"
                value={tamanhoTitulo}
                onPointerDown={e => e.stopPropagation()}
                onTouchStart={e => e.stopPropagation()}
                onChange={e => onTamanhoTituloChange(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Subtítulo */}
        <div className="space-y-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 block">Fonte do Subtítulo</label>
            {onFonteSubtituloChange && <SeletorFonteCard valor={fonteSubtitulo} onChange={onFonteSubtituloChange} />}
          </div>

          {onTamanhoSubtituloChange && (
            <div className="space-y-1 pt-1 border-t border-slate-800/60">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-slate-400">Tamanho da Fonte (Subtítulo):</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onTamanhoSubtituloChange(Math.max(8, tamanhoSubtitulo - 1))}
                    className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-xs flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="8"
                    max="32"
                    value={tamanhoSubtitulo}
                    onChange={e => onTamanhoSubtituloChange(Math.min(32, Math.max(8, Number(e.target.value) || 8)))}
                    className="w-12 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-center font-mono text-purple-400 font-bold text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => onTamanhoSubtituloChange(Math.min(32, tamanhoSubtitulo + 1))}
                    className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-xs flex items-center justify-center"
                  >
                    +
                  </button>
                  <span className="text-slate-500 text-[10px] font-mono">px</span>
                </div>
              </div>
              <input
                type="range"
                min="8"
                max="32"
                step="1"
                value={tamanhoSubtitulo}
                onPointerDown={e => e.stopPropagation()}
                onTouchStart={e => e.stopPropagation()}
                onChange={e => onTamanhoSubtituloChange(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


interface Props {
  campanha: Partial<Campanha>;
  onChangeCampanha?: (updater: (prev: Partial<Campanha>) => Partial<Campanha>) => void;
  tema: TemaCampanha;
  onChangeTema: (novoTema: TemaCampanha) => void;
  onSalvar?: (e?: React.FormEvent) => void;
  salvando?: boolean;
  mostrarPreview?: boolean;
}

interface BlocoConfig {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
}

const BLOCOS_DISPONIVEIS: BlocoConfig[] = [
  { id: 'banner', nome: 'Banner & Título', descricao: 'Foto de destaque e título do sorteio', icone: '🖼️' },
  { id: 'barraProgresso', nome: 'Barra de Progresso', descricao: 'Porcentagem de cotas vendidas em tempo real', icone: '📊' },
  { id: 'cotas', nome: 'Seleção de Cotas & Pacotes', descricao: 'Combos de desconto e seletor de bilhetes', icone: '🎟️' },
  { id: 'premios', nome: 'Prêmios Oficiais', descricao: 'Premiação de 1º, 2º, 3º lugar e extras', icone: '🏆' },
  { id: 'premiadas', nome: 'Cotas Premiadas Instantâneas', descricao: 'Bilhetes premiados na hora via Pix', icone: '⚡' },
  { id: 'ranking', nome: 'Top Compradores / Ranking', descricao: 'Lista dos maiores participantes do sorteio', icone: '👑' },
  { id: 'regulamento', nome: 'Descrição & Regulamento', descricao: 'Texto explicativo e regras oficiais da campanha', icone: '📜' },
  { id: 'ganhadores', nome: 'Ganhadores / Apuração', descricao: 'Exibição do ganhador contemplado', icone: '🎉' },
];

const converterParaHex = (cor: string | undefined, padrao: string): string => {
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
  return padrao.startsWith('rgba') ? '#10b981' : padrao;
};

export const TemaBuilderView: React.FC<Props> = ({
  campanha,
  onChangeCampanha,
  tema,
  onChangeTema,
  onSalvar,
  salvando = false,
  mostrarPreview = true
}) => {
  const [visualizacaoMobile, setVisualizacaoMobile] = useState<'controles' | 'preview'>('controles');
  const [previewDispositivo, setPreviewDispositivo] = useState<'mobile' | 'desktop'>('mobile');
  const [secaoEditor, setSecaoEditor] = useState<'menu' | 'geral' | 'tipografia' | 'blocos' | 'estilos'>('menu');
  const [subAbaGeral, setSubAbaGeral] = useState<'cores' | 'botoes' | 'icones' | 'logo' | null>(null);
  const [subAbaBotao, setSubAbaBotao] = useState<'compra' | 'pacotes' | 'controles' | 'cotas' | 'por_apenas' | 'progresso' | 'titulosPremiados' | 'cards' | null>(null);
  const [secaoIconeAberta, setSecaoIconeAberta] = useState<string>('premios');
  const [secaoCardAberta, setSecaoCardAberta] = useState<string | null>(null);
  const [previewAnimacao, setPreviewAnimacao] = useState<'confetes' | 'estrela' | 'fogo' | 'coracao' | 'moeda' | 'trofeu' | 'diamante' | 'raio' | 'coroa' | 'foguete' | null>(null);

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const [estilosSalvos, setEstilosSalvos] = useState<EstiloSalvo[]>([]);
  const [carregandoEstilos, setCarregandoEstilos] = useState(false);
  const [salvandoEstilo, setSalvandoEstilo] = useState(false);
  const [nomeNovoEstilo, setNomeNovoEstilo] = useState('');
  const [modalNovoEstiloAberto, setModalNovoEstiloAberto] = useState(false);
  const [painelModelosRegraAberto, setPainelModelosRegraAberto] = useState(false);
  const [modoCustomRegra, setModoCustomRegra] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Garante valores seguros de tema com todos os novos campos
  const temaSeguro: TemaCampanha = React.useMemo(() => ({
    cores: {
      primaria: tema?.cores?.primaria || TEMA_PADRAO.cores.primaria,
      destaque: tema?.cores?.destaque || TEMA_PADRAO.cores.destaque,
      fundo: tema?.cores?.fundo || TEMA_PADRAO.cores.fundo,
      texto: tema?.cores?.texto || TEMA_PADRAO.cores.texto,
      titulos: tema?.cores?.titulos || TEMA_PADRAO.cores.titulos,
      descricoes: tema?.cores?.descricoes || TEMA_PADRAO.cores.descricoes,
      botao: tema?.cores?.botao || TEMA_PADRAO.cores.botao,
      textoBotao: tema?.cores?.textoBotao || TEMA_PADRAO.cores.textoBotao,
      cardFundo: tema?.cores?.cardFundo || TEMA_PADRAO.cores.cardFundo,
      cardBorda: tema?.cores?.cardBorda || TEMA_PADRAO.cores.cardBorda,
      faviconFundo: tema?.cores?.faviconFundo || TEMA_PADRAO.cores.faviconFundo,
      iconeCor: tema?.cores?.iconeCor || TEMA_PADRAO.cores.iconeCor,
      iconePremios: tema?.cores?.iconePremios || tema?.cores?.iconeCor || TEMA_PADRAO.cores.iconePremios || '#10b981',
      iconeRegulamento: tema?.cores?.iconeRegulamento || tema?.cores?.iconeCor || TEMA_PADRAO.cores.iconeRegulamento || '#10b981',
      iconeCotasPremiadas: tema?.cores?.iconeCotasPremiadas || tema?.cores?.iconeCor || TEMA_PADRAO.cores.iconeCotasPremiadas || '#10b981',
      iconeTopCompradores: tema?.cores?.iconeTopCompradores || tema?.cores?.iconeCor || TEMA_PADRAO.cores.iconeTopCompradores || '#10b981',
      iconeGanhadores: tema?.cores?.iconeGanhadores || tema?.cores?.iconeCor || TEMA_PADRAO.cores.iconeGanhadores || '#10b981',
      iconeMeusNumeros: tema?.cores?.iconeMeusNumeros || tema?.cores?.iconeCor || TEMA_PADRAO.cores.iconeMeusNumeros || '#10b981',
      iconeSorteio: tema?.cores?.iconeSorteio || tema?.cores?.iconeCor || TEMA_PADRAO.cores.iconeSorteio || '#10b981',
      barraProgressoFundo: tema?.cores?.barraProgressoFundo || TEMA_PADRAO.cores.barraProgressoFundo,
      barraProgressoPreenchimento: tema?.cores?.barraProgressoPreenchimento || TEMA_PADRAO.cores.barraProgressoPreenchimento,
      barraProgressoTexto: tema?.cores?.barraProgressoTexto || TEMA_PADRAO.cores.barraProgressoTexto,
      cardBarraProgressoFundo: tema?.cores?.cardBarraProgressoFundo || TEMA_PADRAO.cores.cardBarraProgressoFundo,
      botaoCotasFundo: tema?.cores?.botaoCotasFundo || TEMA_PADRAO.cores.botaoCotasFundo,
      botaoCotasTexto: tema?.cores?.botaoCotasTexto || TEMA_PADRAO.cores.botaoCotasTexto,
      botaoCotasNumero: tema?.cores?.botaoCotasNumero || TEMA_PADRAO.cores.botaoCotasNumero,
      botaoCotasBorda: tema?.cores?.botaoCotasBorda || tema?.cores?.cardBorda || TEMA_PADRAO.cores.botaoCotasBorda || '#334155',
      controlesFundo: tema?.cores?.controlesFundo || TEMA_PADRAO.cores.controlesFundo,
      controlesTexto: tema?.cores?.controlesTexto || TEMA_PADRAO.cores.controlesTexto,
      controlesInputFundo: tema?.cores?.controlesInputFundo || TEMA_PADRAO.cores.controlesInputFundo || '#0f172a',
      controlesInputTexto: tema?.cores?.controlesInputTexto || TEMA_PADRAO.cores.controlesInputTexto || '#ffffff',
      controlesBorda: tema?.cores?.controlesBorda || tema?.cores?.cardBorda || TEMA_PADRAO.cores.controlesBorda || '#334155',
      textoPrecoBarra: tema?.cores?.textoPrecoBarra || TEMA_PADRAO.cores.textoPrecoBarra,
      subtituloCor: tema?.cores?.subtituloCor || TEMA_PADRAO.cores.subtituloCor,
      localSorteioCor: tema?.cores?.localSorteioCor || TEMA_PADRAO.cores.localSorteioCor,
      seloBannerFundo: tema?.cores?.seloBannerFundo || TEMA_PADRAO.cores.seloBannerFundo || '#f59e0b',
      seloBannerTexto: tema?.cores?.seloBannerTexto || TEMA_PADRAO.cores.seloBannerTexto || '#022c22',
      seloPopularFundo: tema?.cores?.seloPopularFundo || TEMA_PADRAO.cores.seloPopularFundo || '#f59e0b',
      seloPopularTexto: tema?.cores?.seloPopularTexto || TEMA_PADRAO.cores.seloPopularTexto || '#022c22',
      botaoDestaqueFundo: tema?.cores?.botaoDestaqueFundo || tema?.cores?.primaria || TEMA_PADRAO.cores.botaoDestaqueFundo || '#10b981',
      botaoDestaqueTexto: tema?.cores?.botaoDestaqueTexto || TEMA_PADRAO.cores.botaoDestaqueTexto || '#022c22',
      premioFundo: tema?.cores?.premioFundo || tema?.cores?.controlesFundo || TEMA_PADRAO.cores.premioFundo || '#0f172a',
      premioTexto: tema?.cores?.premioTexto || tema?.cores?.texto || TEMA_PADRAO.cores.premioTexto || '#ffffff',
      premioBadgeFundo: tema?.cores?.premioBadgeFundo || tema?.cores?.primaria || TEMA_PADRAO.cores.premioBadgeFundo || '#10b981',
      premioBadgeTexto: tema?.cores?.premioBadgeTexto || TEMA_PADRAO.cores.premioBadgeTexto || '#022c22',
      premioBorda: tema?.cores?.premioBorda || tema?.cores?.cardBorda || TEMA_PADRAO.cores.premioBorda || '#1e293b',
      cardBannerFundo: tema?.cores?.cardBannerFundo || tema?.cores?.cardFundo || TEMA_PADRAO.cores.cardBannerFundo || '#0f172a',
      cardBannerBorda: tema?.cores?.cardBannerBorda || tema?.cores?.cardBorda || TEMA_PADRAO.cores.cardBannerBorda || '#1e293b',
      cardProgressoFundo: tema?.cores?.cardProgressoFundo || tema?.cores?.cardBarraProgressoFundo || tema?.cores?.cardFundo || TEMA_PADRAO.cores.cardProgressoFundo || '#0f172a',
      cardProgressoBorda: tema?.cores?.cardProgressoBorda || tema?.cores?.cardBorda || TEMA_PADRAO.cores.cardProgressoBorda || '#1e293b',
      cardCotasFundo: tema?.cores?.cardCotasFundo || tema?.cores?.cardFundo || TEMA_PADRAO.cores.cardCotasFundo || '#0f172a',
      cardCotasBorda: tema?.cores?.cardCotasBorda || tema?.cores?.cardBorda || TEMA_PADRAO.cores.cardCotasBorda || '#1e293b',
      cardCotasTexto: tema?.cores?.cardCotasTexto || tema?.cores?.texto || TEMA_PADRAO.cores.cardCotasTexto || '#ffffff',
      cardPremiosFundo: tema?.cores?.cardPremiosFundo || tema?.cores?.cardFundo || TEMA_PADRAO.cores.cardPremiosFundo || '#0f172a',
      cardPremiosBorda: tema?.cores?.cardPremiosBorda || tema?.cores?.cardBorda || TEMA_PADRAO.cores.cardPremiosBorda || '#1e293b',
      cardCotasPremiadasFundo: tema?.cores?.cardCotasPremiadasFundo || tema?.cores?.cardFundo || TEMA_PADRAO.cores.cardCotasPremiadasFundo || '#0f172a',
      cardCotasPremiadasBorda: tema?.cores?.cardCotasPremiadasBorda || tema?.cores?.cardBorda || TEMA_PADRAO.cores.cardCotasPremiadasBorda || '#1e293b',
      cardRankingFundo: tema?.cores?.cardRankingFundo || tema?.cores?.cardFundo || TEMA_PADRAO.cores.cardRankingFundo || '#0f172a',
      cardRankingBorda: tema?.cores?.cardRankingBorda || tema?.cores?.cardBorda || TEMA_PADRAO.cores.cardRankingBorda || '#1e293b',
      cardRegulamentoFundo: tema?.cores?.cardRegulamentoFundo || tema?.cores?.cardFundo || TEMA_PADRAO.cores.cardRegulamentoFundo || '#0f172a',
      cardRegulamentoBorda: tema?.cores?.cardRegulamentoBorda || tema?.cores?.cardBorda || TEMA_PADRAO.cores.cardRegulamentoBorda || '#1e293b',
      cardRegulamentoTexto: tema?.cores?.cardRegulamentoTexto || tema?.cores?.descricoes || TEMA_PADRAO.cores.cardRegulamentoTexto || '#cbd5e1',
      cardGanhadoresFundo: tema?.cores?.cardGanhadoresFundo || tema?.cores?.cardFundo || TEMA_PADRAO.cores.cardGanhadoresFundo || '#0f172a',
      cardGanhadoresBorda: tema?.cores?.cardGanhadoresBorda || tema?.cores?.cardBorda || TEMA_PADRAO.cores.cardGanhadoresBorda || '#1e293b',
    },
    secaoIcones: {
      premios: tema?.secaoIcones?.premios || TEMA_PADRAO.secaoIcones.premios,
      cotasPremiadas: tema?.secaoIcones?.cotasPremiadas || TEMA_PADRAO.secaoIcones.cotasPremiadas,
      topCompradores: tema?.secaoIcones?.topCompradores || TEMA_PADRAO.secaoIcones.topCompradores,
      ganhadores: tema?.secaoIcones?.ganhadores || TEMA_PADRAO.secaoIcones.ganhadores,
      regulamento: tema?.secaoIcones?.regulamento || TEMA_PADRAO.secaoIcones.regulamento,
      descricao: tema?.secaoIcones?.descricao || TEMA_PADRAO.secaoIcones.descricao,
      meusNumeros: tema?.secaoIcones?.meusNumeros || TEMA_PADRAO.secaoIcones.meusNumeros || 'Ticket',
      sorteio: tema?.secaoIcones?.sorteio || TEMA_PADRAO.secaoIcones.sorteio || 'Calendar',
      botaoCompra: tema?.secaoIcones?.botaoCompra || tema?.botao?.iconeCompra || TEMA_PADRAO.secaoIcones?.botaoCompra || 'Sparkles',
    },
    botao: {
      formato: tema?.botao?.formato || TEMA_PADRAO.botao.formato,
      raioBorda: tema?.botao?.raioBorda ?? TEMA_PADRAO.botao.raioBorda,
      tamanhoAltura: tema?.botao?.tamanhoAltura ?? TEMA_PADRAO.botao.tamanhoAltura,
      tamanhoTexto: tema?.botao?.tamanhoTexto ?? TEMA_PADRAO.botao.tamanhoTexto,
      estilo: tema?.botao?.estilo || TEMA_PADRAO.botao.estilo,
      sombraAltura: tema?.botao?.sombraAltura ?? TEMA_PADRAO.botao.sombraAltura ?? 4,
      sombraLargura: tema?.botao?.sombraLargura ?? TEMA_PADRAO.botao.sombraLargura ?? 4,
      corSombra: tema?.botao?.corSombra || TEMA_PADRAO.botao.corSombra || '#047857',
      textoCompra: tema?.botao?.textoCompra || TEMA_PADRAO.botao.textoCompra,
      iconeCompra: tema?.botao?.iconeCompra || tema?.secaoIcones?.botaoCompra || TEMA_PADRAO.botao?.iconeCompra || 'Sparkles',
      possuirBorda: tema?.botao?.possuirBorda ?? false,
      larguraBorda: tema?.botao?.larguraBorda ?? 1,
      corBorda: tema?.botao?.corBorda || tema?.cores?.cardBorda || '#334155',
      // Pacotes
      estiloPacotes: tema?.botao?.estiloPacotes || TEMA_PADRAO.botao.estiloPacotes || 'solido',
      colunasPacotesMobile: tema?.botao?.colunasPacotesMobile ?? (TEMA_PADRAO.botao?.colunasPacotesMobile ?? 2),
      colunasPacotesDesktop: tema?.botao?.colunasPacotesDesktop ?? (TEMA_PADRAO.botao?.colunasPacotesDesktop ?? 4),
      raioBordaPacotes: tema?.botao?.raioBordaPacotes ?? TEMA_PADRAO.botao.raioBordaPacotes ?? 12,
      tamanhoAlturaPacotes: tema?.botao?.tamanhoAlturaPacotes ?? TEMA_PADRAO.botao.tamanhoAlturaPacotes ?? 12,
      sombraAlturaPacotes: tema?.botao?.sombraAlturaPacotes ?? TEMA_PADRAO.botao.sombraAlturaPacotes ?? 3,
      corSombraPacotes: tema?.botao?.corSombraPacotes || TEMA_PADRAO.botao.corSombraPacotes || '#047857',
      possuirBordaPacotes: tema?.botao?.possuirBordaPacotes ?? false,
      larguraBordaPacotes: tema?.botao?.larguraBordaPacotes ?? 1,
      corBordaPacotes: tema?.botao?.corBordaPacotes || tema?.cores?.botaoCotasBorda || '#334155',
      // Controles
      estiloControles: tema?.botao?.estiloControles || TEMA_PADRAO.botao.estiloControles || 'solido',
      raioBordaControles: tema?.botao?.raioBordaControles ?? TEMA_PADRAO.botao.raioBordaControles ?? 12,
      tamanhoControles: tema?.botao?.tamanhoControles ?? TEMA_PADRAO.botao.tamanhoControles ?? 44,
      sombraAlturaControles: tema?.botao?.sombraAlturaControles ?? TEMA_PADRAO.botao.sombraAlturaControles ?? 3,
      corSombraControles: tema?.botao?.corSombraControles || TEMA_PADRAO.botao.corSombraControles || '#047857',
      possuirBordaControles: tema?.botao?.possuirBordaControles ?? false,
      larguraBordaControles: tema?.botao?.larguraBordaControles ?? 1,
      corBordaControles: tema?.botao?.corBordaControles || tema?.cores?.controlesBorda || '#334155',
      // Cotas
      estiloCotas: tema?.botao?.estiloCotas || TEMA_PADRAO.botao.estiloCotas || 'solido',
      raioBordaCotas: tema?.botao?.raioBordaCotas ?? TEMA_PADRAO.botao.raioBordaCotas ?? 8,
      sombraAlturaCotas: tema?.botao?.sombraAlturaCotas ?? TEMA_PADRAO.botao.sombraAlturaCotas ?? 2,
      corSombraCotas: tema?.botao?.corSombraCotas || TEMA_PADRAO.botao.corSombraCotas || '#047857',
      // Cards
      estiloCards: tema?.botao?.estiloCards || TEMA_PADRAO.botao.estiloCards || 'solido',
      raioBordaCards: tema?.botao?.raioBordaCards ?? TEMA_PADRAO.botao.raioBordaCards ?? 16,
      sombraAlturaCards: tema?.botao?.sombraAlturaCards ?? TEMA_PADRAO.botao.sombraAlturaCards ?? 4,
      corSombraCards: tema?.botao?.corSombraCards || TEMA_PADRAO.botao.corSombraCards || '#0f172a',
      possuirBordaCards: tema?.botao?.possuirBordaCards ?? true,
      larguraBordaCards: tema?.botao?.larguraBordaCards ?? 1,
      // Título e Subtítulos por módulo (preserva string vazia para ocultar)
      tituloCompra: tema?.botao?.tituloCompra ?? TEMA_PADRAO.botao.tituloCompra,
      subtituloCompra: tema?.botao?.subtituloCompra ?? TEMA_PADRAO.botao.subtituloCompra,
      tituloPacotes: tema?.botao?.tituloPacotes ?? TEMA_PADRAO.botao.tituloPacotes,
      subtituloPacotes: tema?.botao?.subtituloPacotes ?? TEMA_PADRAO.botao.subtituloPacotes,
      tituloControles: tema?.botao?.tituloControles ?? TEMA_PADRAO.botao.tituloControles,
      subtituloControles: tema?.botao?.subtituloControles ?? TEMA_PADRAO.botao.subtituloControles,
      tituloCotas: tema?.botao?.tituloCotas ?? TEMA_PADRAO.botao.tituloCotas,
      subtituloCotas: tema?.botao?.subtituloCotas ?? TEMA_PADRAO.botao.subtituloCotas,
      tituloProgresso: tema?.botao?.tituloProgresso ?? TEMA_PADRAO.botao.tituloProgresso,
      subtituloProgresso: tema?.botao?.subtituloProgresso ?? TEMA_PADRAO.botao.subtituloProgresso,
      tituloPremiado: tema?.botao?.tituloPremiado ?? TEMA_PADRAO.botao.tituloPremiado,
      subtituloPremiado: tema?.botao?.subtituloPremiado ?? TEMA_PADRAO.botao.subtituloPremiado,
    },
    bannerConfig: {
      fullWidth: tema?.bannerConfig?.fullWidth ?? true,
      overlayDegradeAtivo: tema?.bannerConfig?.overlayDegradeAtivo ?? true,
      overlayDegrade: tema?.bannerConfig?.overlayDegrade || 'linear-gradient(to top, rgba(0, 0, 0, 0.92) 0%, rgba(0, 0, 0, 0.6) 60%, transparent 100%)',
      overlayAltura: tema?.bannerConfig?.overlayAltura ?? 100,
      overlayDirecao: tema?.bannerConfig?.overlayDirecao || TEMA_PADRAO.bannerConfig?.overlayDirecao || 'to-top',
      overlayTipo: tema?.bannerConfig?.overlayTipo || TEMA_PADRAO.bannerConfig?.overlayTipo || 'gradiente',
      overlayCor: tema?.bannerConfig?.overlayCor || TEMA_PADRAO.bannerConfig?.overlayCor || '#000000',
      seloAnimado: tema?.bannerConfig?.seloAnimado ?? false,
      seloEstilo: tema?.bannerConfig?.seloEstilo || 'estatico',
      seloFundo: tema?.bannerConfig?.seloFundo || tema?.cores?.seloBannerFundo || '#f59e0b',
      seloTexto: tema?.bannerConfig?.seloTexto || tema?.cores?.seloBannerTexto || '#022c22',
      seloBordaAtiva: tema?.bannerConfig?.seloBordaAtiva ?? false,
      seloBordaCor: tema?.bannerConfig?.seloBordaCor || '#ffffff',
      seloBordaEspessura: tema?.bannerConfig?.seloBordaEspessura ?? 1,
      seloPosicao: tema?.bannerConfig?.seloPosicao || 'topo-esquerda'
    },
    tipografia: {
      fonteTitulo: tema?.tipografia?.fonteTitulo || TEMA_PADRAO.tipografia.fonteTitulo,
      fonteTexto: tema?.tipografia?.fonteTexto || TEMA_PADRAO.tipografia.fonteTexto,
      tamanhoTitulo: (tema?.tipografia?.tamanhoTitulo ?? TEMA_PADRAO.tipografia.tamanhoTitulo),
      tamanhoTexto: (tema?.tipografia?.tamanhoTexto ?? TEMA_PADRAO.tipografia.tamanhoTexto),
      fonteBotaoCompraTitulo: tema?.tipografia?.fonteBotaoCompraTitulo || TEMA_PADRAO.tipografia.fonteBotaoCompraTitulo || 'Inter',
      fonteBotaoCompraSubtitulo: tema?.tipografia?.fonteBotaoCompraSubtitulo || TEMA_PADRAO.tipografia.fonteBotaoCompraSubtitulo || 'Inter',
      fontePacotesTitulo: tema?.tipografia?.fontePacotesTitulo || TEMA_PADRAO.tipografia.fontePacotesTitulo || 'Inter',
      fontePacotesSubtitulo: tema?.tipografia?.fontePacotesSubtitulo || TEMA_PADRAO.tipografia.fontePacotesSubtitulo || 'Inter',
      fonteControlesTitulo: tema?.tipografia?.fonteControlesTitulo || TEMA_PADRAO.tipografia.fonteControlesTitulo || 'Inter',
      fonteControlesSubtitulo: tema?.tipografia?.fonteControlesSubtitulo || TEMA_PADRAO.tipografia.fonteControlesSubtitulo || 'Inter',
      tamanhoPacotesTitulo: tema?.tipografia?.tamanhoPacotesTitulo ?? 16,
      tamanhoPacotesSubtitulo: tema?.tipografia?.tamanhoPacotesSubtitulo ?? 12,
      tamanhoControlesTitulo: tema?.tipografia?.tamanhoControlesTitulo ?? 16,
      tamanhoControlesSubtitulo: tema?.tipografia?.tamanhoControlesSubtitulo ?? 12,
      fonteCotasTitulo: tema?.tipografia?.fonteCotasTitulo || TEMA_PADRAO.tipografia.fonteCotasTitulo || 'Inter',
      fonteCotasSubtitulo: tema?.tipografia?.fonteCotasSubtitulo || TEMA_PADRAO.tipografia.fonteCotasSubtitulo || 'Inter',
      fonteCardProgresso: tema?.tipografia?.fonteCardProgresso || TEMA_PADRAO.tipografia.fonteCardProgresso || 'Inter',
      fonteCardProgressoSubtitulo: tema?.tipografia?.fonteCardProgressoSubtitulo || TEMA_PADRAO.tipografia.fonteCardProgressoSubtitulo || 'Inter',
      fonteCardCotasPremiadas: tema?.tipografia?.fonteCardCotasPremiadas || TEMA_PADRAO.tipografia.fonteCardCotasPremiadas || 'Inter',
      fonteCardCotasPremiadasSubtitulo: tema?.tipografia?.fonteCardCotasPremiadasSubtitulo || TEMA_PADRAO.tipografia.fonteCardCotasPremiadasSubtitulo || 'Inter',
      fonteCardBanner: tema?.tipografia?.fonteCardBanner || TEMA_PADRAO.tipografia.fonteCardBanner || 'Inter',
      fonteCardBannerSubtitulo: tema?.tipografia?.fonteCardBannerSubtitulo || TEMA_PADRAO.tipografia.fonteCardBannerSubtitulo || 'Inter',
      alinhamentoPacotes: tema?.tipografia?.alinhamentoPacotes || 'esquerda',
      alinhamentoControles: tema?.tipografia?.alinhamentoControles || 'esquerda',
      alinhamentoCotas: tema?.tipografia?.alinhamentoCotas || 'esquerda',
      alinhamentoProgresso: tema?.tipografia?.alinhamentoProgresso || 'esquerda',
      alinhamentoCompra: tema?.tipografia?.alinhamentoCompra || 'centro',
      alinhamentoPremiado: tema?.tipografia?.alinhamentoPremiado || 'esquerda',
    },
    barraProgresso: {
      titulo: tema?.barraProgresso?.titulo ?? TEMA_PADRAO.barraProgresso?.titulo ?? 'Progresso do sorteio',
      subtitulo: tema?.barraProgresso?.subtitulo ?? TEMA_PADRAO.barraProgresso?.subtitulo ?? '',
      textoInterno: tema?.barraProgresso?.textoInterno ?? TEMA_PADRAO.barraProgresso?.textoInterno ?? '{pct}% vendido',
      rodape: tema?.barraProgresso?.rodape ?? TEMA_PADRAO.barraProgresso?.rodape ?? '',
      mostrarTipo: tema?.barraProgresso?.mostrarTipo ?? TEMA_PADRAO.barraProgresso?.mostrarTipo ?? 'porcentagem',
      altura: tema?.barraProgresso?.altura ?? TEMA_PADRAO.barraProgresso?.altura ?? 16,
      raioBorda: tema?.barraProgresso?.raioBorda ?? TEMA_PADRAO.barraProgresso?.raioBorda ?? 9999,
      larguraMax: tema?.barraProgresso?.larguraMax ?? TEMA_PADRAO.barraProgresso?.larguraMax ?? '100%',
      estiloProgresso: tema?.barraProgresso?.estiloProgresso ?? TEMA_PADRAO.barraProgresso?.estiloProgresso ?? 'solido',
    },
    fundoMidia: {
      tipo: tema?.fundoMidia?.tipo || TEMA_PADRAO.fundoMidia?.tipo || 'cor',
      url: tema?.fundoMidia?.url || TEMA_PADRAO.fundoMidia?.url || '',
    },
    organizadorCabecalho: {
      logoAlinhamento: tema?.organizadorCabecalho?.logoAlinhamento || TEMA_PADRAO.organizadorCabecalho?.logoAlinhamento || 'centro',
    },
    ganhadorCelebracaoEstilo: tema?.ganhadorCelebracaoEstilo || TEMA_PADRAO.ganhadorCelebracaoEstilo || 'confetes',
    cotasConfig: {
      ...TEMA_PADRAO.cotasConfig,
      ...tema?.cotasConfig,
      textoPorApenas: tema?.cotasConfig?.textoPorApenas ?? TEMA_PADRAO.cotasConfig?.textoPorApenas ?? 'Por apenas',
      porApenasFundo: tema?.cotasConfig?.porApenasFundo || TEMA_PADRAO.cotasConfig?.porApenasFundo || '#064e3b',
      porApenasTexto: tema?.cotasConfig?.porApenasTexto || TEMA_PADRAO.cotasConfig?.porApenasTexto || '#10b981',
      porApenasBorda: tema?.cotasConfig?.porApenasBorda || TEMA_PADRAO.cotasConfig?.porApenasBorda || '#059669',
      porApenasLayout: tema?.cotasConfig?.porApenasLayout || TEMA_PADRAO.cotasConfig?.porApenasLayout || 'vertical',
      posicaoExibicao: tema?.cotasConfig?.posicaoExibicao || 'proximo_cotas',
      estiloContainer: tema?.cotasConfig?.estiloContainer || 'texto_e_botao',
      porApenasAlinhamento: tema?.cotasConfig?.porApenasAlinhamento || 'centro',
      porApenasTamanhoValor: tema?.cotasConfig?.porApenasTamanhoValor ?? TEMA_PADRAO.cotasConfig?.porApenasTamanhoValor ?? 24,
      porApenasTamanhoTexto: tema?.cotasConfig?.porApenasTamanhoTexto ?? TEMA_PADRAO.cotasConfig?.porApenasTamanhoTexto ?? 14,
      exibirBlocoPromocao: tema?.cotasConfig?.exibirBlocoPromocao ?? (TEMA_PADRAO.cotasConfig?.exibirBlocoPromocao ?? true),
      promoBlocoFundo: tema?.cotasConfig?.promoBlocoFundo || TEMA_PADRAO.cotasConfig?.promoBlocoFundo || '#0f172a',
      promoBlocoBorda: tema?.cotasConfig?.promoBlocoBorda || TEMA_PADRAO.cotasConfig?.promoBlocoBorda || '#334155',
      promoTituloDestaque: tema?.cotasConfig?.promoTituloDestaque ?? TEMA_PADRAO.cotasConfig?.promoTituloDestaque ?? '📢 Promoção',
      promoSubtituloDestaque: tema?.cotasConfig?.promoSubtituloDestaque ?? TEMA_PADRAO.cotasConfig?.promoSubtituloDestaque ?? 'Compre mais barato!',
      promoTextoInformativo: tema?.cotasConfig?.promoTextoInformativo ?? TEMA_PADRAO.cotasConfig?.promoTextoInformativo ?? 'Quanto mais títulos, mais chances de ganhar!',
      promoTituloCor: tema?.cotasConfig?.promoTituloCor || TEMA_PADRAO.cotasConfig?.promoTituloCor || '#fbbf24',
      promoTituloFundo: tema?.cotasConfig?.promoTituloFundo || TEMA_PADRAO.cotasConfig?.promoTituloFundo || '#78350f',
      promoSubtituloCor: tema?.cotasConfig?.promoSubtituloCor || TEMA_PADRAO.cotasConfig?.promoSubtituloCor || '#ffffff',
      promoTextoCor: tema?.cotasConfig?.promoTextoCor || TEMA_PADRAO.cotasConfig?.promoTextoCor || '#94a3b8',
      promoBadgeFundo: tema?.cotasConfig?.promoBadgeFundo || TEMA_PADRAO.cotasConfig?.promoBadgeFundo || '#064e3b',
      promoBadgeTexto: tema?.cotasConfig?.promoBadgeTexto || TEMA_PADRAO.cotasConfig?.promoBadgeTexto || '#6ee7b7',
      promoBadgeBorda: tema?.cotasConfig?.promoBadgeBorda || TEMA_PADRAO.cotasConfig?.promoBadgeBorda || '#059669',
      promoTituloTamanho: tema?.cotasConfig?.promoTituloTamanho ?? (TEMA_PADRAO.cotasConfig?.promoTituloTamanho ?? 14),
      promoSubtituloTamanho: tema?.cotasConfig?.promoSubtituloTamanho ?? (TEMA_PADRAO.cotasConfig?.promoSubtituloTamanho ?? 12),
      // Personalizações da Regra de Desconto
      regraDescontoEstilo: tema?.cotasConfig?.regraDescontoEstilo || TEMA_PADRAO.cotasConfig?.regraDescontoEstilo || 'badge',
      regraDescontoFundo: tema?.cotasConfig?.regraDescontoFundo || TEMA_PADRAO.cotasConfig?.regraDescontoFundo || 'rgba(16, 185, 129, 0.1)',
      regraDescontoTextoCor: tema?.cotasConfig?.regraDescontoTextoCor || TEMA_PADRAO.cotasConfig?.regraDescontoTextoCor || '#34d399',
      regraDescontoDestaqueCor: tema?.cotasConfig?.regraDescontoDestaqueCor || TEMA_PADRAO.cotasConfig?.regraDescontoDestaqueCor || '#ffffff',
      regraDescontoBordaCor: tema?.cotasConfig?.regraDescontoBordaCor || TEMA_PADRAO.cotasConfig?.regraDescontoBordaCor || 'rgba(16, 185, 129, 0.3)',
      regraDescontoTemBorda: tema?.cotasConfig?.regraDescontoTemBorda ?? TEMA_PADRAO.cotasConfig?.regraDescontoTemBorda ?? true,
      regraDescontoEspessuraBorda: tema?.cotasConfig?.regraDescontoEspessuraBorda ?? TEMA_PADRAO.cotasConfig?.regraDescontoEspessuraBorda ?? 1,
      regraDescontoRaioBorda: tema?.cotasConfig?.regraDescontoRaioBorda ?? TEMA_PADRAO.cotasConfig?.regraDescontoRaioBorda ?? 9999,
      regraDescontoFonte: tema?.cotasConfig?.regraDescontoFonte || TEMA_PADRAO.cotasConfig?.regraDescontoFonte || 'Inter',
      regraDescontoTamanhoFonte: tema?.cotasConfig?.regraDescontoTamanhoFonte ?? tema?.cotasConfig?.regraDescontoTamanhoTexto ?? TEMA_PADRAO.cotasConfig?.regraDescontoTamanhoFonte ?? 12,
      regraDescontoTamanhoTexto: tema?.cotasConfig?.regraDescontoTamanhoTexto ?? tema?.cotasConfig?.regraDescontoTamanhoFonte ?? TEMA_PADRAO.cotasConfig?.regraDescontoTamanhoTexto ?? 12,
      regraDescontoPadding: tema?.cotasConfig?.regraDescontoPadding ?? TEMA_PADRAO.cotasConfig?.regraDescontoPadding ?? 6,
      regraDescontoPaddingY: tema?.cotasConfig?.regraDescontoPaddingY ?? TEMA_PADRAO.cotasConfig?.regraDescontoPaddingY ?? 4,
      regraDescontoAlinhamento: tema?.cotasConfig?.regraDescontoAlinhamento || TEMA_PADRAO.cotasConfig?.regraDescontoAlinhamento || 'centro',
      regraDescontoIconeAtivo: tema?.cotasConfig?.regraDescontoIconeAtivo ?? TEMA_PADRAO.cotasConfig?.regraDescontoIconeAtivo ?? true,
      regraDescontoMostrarIcone: tema?.cotasConfig?.regraDescontoMostrarIcone ?? tema?.cotasConfig?.regraDescontoIconeAtivo ?? TEMA_PADRAO.cotasConfig?.regraDescontoMostrarIcone ?? true,
      regraDescontoIcone: tema?.cotasConfig?.regraDescontoIcone || TEMA_PADRAO.cotasConfig?.regraDescontoIcone || 'Zap',
      regraDescontoTextoModelo: tema?.cotasConfig?.regraDescontoTextoModelo || tema?.cotasConfig?.regraDescontoModeloTexto || TEMA_PADRAO.cotasConfig?.regraDescontoModeloTexto || 'A partir de {valor} cada cota fica por {desconto}',
    },
    layout: {
      ordem: (tema?.layout?.ordem && tema.layout.ordem.length > 0)
        ? tema.layout.ordem
        : TEMA_PADRAO.layout.ordem,
      visivel: { ...TEMA_PADRAO.layout.visivel, ...(tema?.layout?.visivel || {}) }
    }
  }), [tema]);

  const carregarEstilos = async () => {
    try {
      setCarregandoEstilos(true);
      const u = auth.currentUser;
      if (!u) return;
      const token = await u.getIdToken();
      const res = await fetch('/api/admin/estilos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setEstilosSalvos(json);
      }
    } catch (err) {
      console.warn('Erro ao carregar estilos:', err);
    } finally {
      setCarregandoEstilos(false);
    }
  };

  useEffect(() => {
    carregarEstilos();
  }, []);

  const exibirToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const atualizarTema = (parcial: Partial<TemaCampanha>) => {
    const novoTema: TemaCampanha = {
      ...temaSeguro,
      ...parcial,
      cores: { ...temaSeguro.cores, ...(parcial.cores || {}) },
      botao: { ...temaSeguro.botao, ...(parcial.botao || {}) },
      bannerConfig: { ...temaSeguro.bannerConfig, ...(parcial.bannerConfig || {}) },
      tipografia: { ...temaSeguro.tipografia, ...(parcial.tipografia || {}) },
      fundoMidia: { ...temaSeguro.fundoMidia, ...(parcial.fundoMidia || {}) },
      organizadorCabecalho: { ...temaSeguro.organizadorCabecalho, ...(parcial.organizadorCabecalho || {}) },
      cotasConfig: { ...temaSeguro.cotasConfig, ...(parcial.cotasConfig || {}) },
      layout: {
        ordem: parcial.layout?.ordem || temaSeguro.layout.ordem,
        visivel: { ...temaSeguro.layout.visivel, ...(parcial.layout?.visivel || {}) }
      }
    };
    onChangeTema(novoTema);
    if (onChangeCampanha) {
      onChangeCampanha(prev => ({ ...prev, tema: novoTema }));
    }
  };

  const handleRestaurarPadrao = async () => {
    if (await confirmar({ mensagem: 'Deseja restaurar todas as cores, botão e layout para o Tema Padrão?', perigo: true, confirmarLabel: 'Restaurar' })) {
      onChangeTema(TEMA_PADRAO);
      if (onChangeCampanha) {
        onChangeCampanha(prev => ({ ...prev, tema: TEMA_PADRAO }));
      }
      exibirToast('Tema Padrão restaurado com sucesso!');
    }
  };

  const ordemAtual = [...temaSeguro.layout.ordem];
  BLOCOS_DISPONIVEIS.forEach(b => {
    if (!ordemAtual.includes(b.id)) {
      ordemAtual.push(b.id);
    }
  });

  const moverBloco = (idx: number, direcao: 'cima' | 'baixo') => {
    const novaOrdem = [...ordemAtual];
    const targetIdx = direcao === 'cima' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= novaOrdem.length) return;
    const [removido] = novaOrdem.splice(idx, 1);
    novaOrdem.splice(targetIdx, 0, removido);
    atualizarTema({
      layout: { ...temaSeguro.layout, ordem: novaOrdem }
    });
  };

  const handleSalvarEstilo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeNovoEstilo.trim()) return;
    try {
      setSalvandoEstilo(true);
      const u = auth.currentUser;
      if (!u) {
        toast('Faça login para salvar seus estilos.');
        return;
      }
      const token = await u.getIdToken();
      const res = await fetch('/api/admin/estilos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: nomeNovoEstilo.trim(),
          tema: temaSeguro
        })
      });

      if (res.ok) {
        const novo = await res.json();
        setEstilosSalvos(prev => [novo, ...prev]);
        setNomeNovoEstilo('');
        setModalNovoEstiloAberto(false);
        exibirToast(`Estilo "${novo.nome}" salvo com sucesso!`);
      } else {
        const err = await res.json();
        toast(err.error || 'Erro ao salvar estilo.');
      }
    } catch (err: any) {
      toast('Falha ao conectar com o servidor para salvar o estilo.');
    } finally {
      setSalvandoEstilo(false);
    }
  };

  const handleAplicarEstilo = (estilo: EstiloSalvo) => {
    onChangeTema(estilo.tema);
    if (onChangeCampanha) {
      onChangeCampanha(prev => ({ ...prev, tema: estilo.tema }));
    }
    exibirToast(`Estilo "${estilo.nome}" aplicado à campanha!`);
  };

  const campanhaPreview: Campanha = React.useMemo(() => ({
    id: campanha.id || 'preview-campanha',
    codigo: campanha.codigo || 'sorteio-preview',
    titulo: campanha.titulo || 'iPhone 16 Pro Max 256GB Titanium',
    subtitulo: campanha.subtitulo || 'Por apenas R$ 0,50! Frete grátis para todo o Brasil.',
    descricao: campanha.descricao || 'Participe do nosso sorteio oficial baseado na extração da Loteria Federal. Quanto mais cotas você adquirir, maiores são as suas chances de ganhar!',
    bannerUrl: campanha.bannerUrl || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
    fotosCarrossel: campanha.fotosCarrossel || [],
    youtubeUrl: campanha.youtubeUrl || null,
    modelo: campanha.modelo || 'aleatorio',
    totalCotas: Number(campanha.totalCotas) || 10000,
    valorCota: Number(campanha.valorCota) || 0.50,
    minPorCompra: Number(campanha.minPorCompra) || 5,
    maxPorCompra: Number(campanha.maxPorCompra) || 10000,
    localSorteio: campanha.localSorteio || 'Loteria Federal',
    dataSorteio: campanha.dataSorteio || null,
    tempoReservaMin: Number(campanha.tempoReservaMin) || 15,
    exigirEmail: campanha.exigirEmail ?? false,
    exigirCpf: campanha.exigirCpf ?? false,
    numeroSorteado: campanha.numeroSorteado || null,
    ganhador: campanha.ganhador || null,
    selo: campanha.selo || '🔥 Corre que essa vai rápido!',
    exibirSelo: campanha.exibirSelo ?? true,
    exibirRanking: campanha.exibirRanking ?? true,
    exibirBarraProgresso: campanha.exibirBarraProgresso ?? true,
    exibirPaginaGanhadores: campanha.exibirPaginaGanhadores ?? true,
    exibirPremios: campanha.exibirPremios ?? true,
    exibirCotasPremiadas: campanha.exibirCotasPremiadas ?? true,
    status: campanha.status || 'publicada',
    premios: (campanha.premios && campanha.premios.length > 0) ? campanha.premios : [
      { posicao: 1, descricao: 'iPhone 16 Pro Max 256GB Lacrado' },
      { posicao: 2, descricao: 'R$ 2.500,00 no Pix Instantâneo' },
      { posicao: 3, descricao: 'AirPods Pro 2ª Geração' }
    ],
    cotasPremiadas: (campanha.cotasPremiadas && campanha.cotasPremiadas.length > 0) ? campanha.cotasPremiadas : [
      { numero: '00123', premio: 'R$ 500 no Pix', status: 'disponivel', pedidoId: null },
      { numero: '04567', premio: 'R$ 250 no Pix', status: 'disponivel', pedidoId: null },
      { numero: '08999', premio: 'R$ 100 no Pix', status: 'disponivel', pedidoId: null }
    ],
    promocoes: (campanha.promocoes && campanha.promocoes.length > 0) ? campanha.promocoes : [
      { quantidade: 10, valor: 4.50, destaque: false },
      { quantidade: 50, valor: 20.00, destaque: true },
      { quantidade: 100, valor: 35.00, destaque: false }
    ],
    descontoPorValorTotal: campanha.descontoPorValorTotal || [
      { aPartirDeValor: 20, valorCotaComDesconto: 0.35 }
    ],
    ofertasRelampago: campanha.ofertasRelampago || [],
    checkout: (campanha as any).checkout || DEFAULT_CHECKOUT_CONFIG,
    criadaEm: campanha.criadaEm || new Date().toISOString(),
    tema: temaSeguro
  }), [campanha, temaSeguro]);

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          {toastMsg}
        </div>
      )}

      {/* Header do Builder com Controles Globais */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">Editor de tema</h2>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 truncate max-w-[200px]">
                {campanha.titulo}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Personalize a aparência, botões, cores e layout em tempo real.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-2.5 flex-wrap">
          {/* Restaurar padrão e Salvar alterações lado a lado */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestaurarPadrao}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-700"
              title="Restaurar padrão"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restaurar Padrão</span>
            </button>

            {onSalvar && (
              <button
                type="button"
                onClick={onSalvar}
                disabled={salvando}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <Save className="w-4 h-4" />
                <span>{salvando ? 'Salvando...' : 'Atualizar / Salvar Alterações'}</span>
              </button>
            )}
          </div>

          {/* Salvar como estilo mais discretamente no canto */}
          <button
            type="button"
            onClick={() => setModalNovoEstiloAberto(true)}
            className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 border border-slate-800 rounded-xl transition"
            title="Salvar tema como estilo reutilizável"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toggle Mobile: Controles vs Prévia */}
      <div className="lg:hidden flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
        <button
          type="button"
          onClick={() => setVisualizacaoMobile('controles')}
          className={`flex-1 py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
            visualizacaoMobile === 'controles'
              ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Editor de Estilo</span>
        </button>
        <button
          type="button"
          onClick={() => setVisualizacaoMobile('preview')}
          className={`flex-1 py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
            visualizacaoMobile === 'preview'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Prévia ao Vivo</span>
        </button>
      </div>

      {/* Layout Split-Screen Principal */}
      <div className={`grid grid-cols-1 ${mostrarPreview ? 'lg:grid-cols-12' : 'lg:grid-cols-1'} gap-6 items-start`}>
        
        {/* COLUNA DA ESQUERDA: CONTROLES DO TEMA */}
        <div className={`${mostrarPreview ? 'lg:col-span-7' : 'w-full'} space-y-4 ${visualizacaoMobile === 'preview' ? 'hidden lg:block' : 'block'}`}>
          
          {/* BARRA DE NAVEGAÇÃO SUPERIOR & BREADCRUMBS DO EDITOR */}
          {secaoEditor !== 'menu' && (
            <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-2xl animate-in fade-in">
              <button
                type="button"
                onClick={() => {
                  if (subAbaBotao !== null) {
                    setSubAbaBotao(null);
                  } else if (subAbaGeral !== null) {
                    setSubAbaGeral(null);
                  } else {
                    setSecaoEditor('menu');
                  }
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                <span>
                  {subAbaBotao !== null
                    ? 'Voltar para Botões & Elementos'
                    : subAbaGeral !== null
                    ? 'Voltar para Geral'
                    : 'Voltar ao Menu Principal'}
                </span>
              </button>

              {/* Breadcrumb Trail */}
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 overflow-x-auto custom-scrollbar">
                <button 
                  type="button"
                  onClick={() => { setSecaoEditor('menu'); setSubAbaGeral(null); setSubAbaBotao(null); }} 
                  className="hover:text-emerald-400 transition cursor-pointer"
                >
                  Editor
                </button>
                <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                {secaoEditor === 'geral' && (
                  <>
                    <button 
                      type="button"
                      onClick={() => { setSubAbaGeral(null); setSubAbaBotao(null); }} 
                      className={`transition cursor-pointer ${subAbaGeral === null ? 'text-emerald-400 font-black' : 'hover:text-emerald-400'}`}
                    >
                      Geral
                    </button>
                    {subAbaGeral && (
                      <>
                        <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                        <button
                          type="button"
                          onClick={() => setSubAbaBotao(null)}
                          className={`transition cursor-pointer ${subAbaBotao === null ? 'text-emerald-400 font-black' : 'hover:text-emerald-400'}`}
                        >
                          {subAbaGeral === 'cores' && 'Cores & Fundo'}
                          {subAbaGeral === 'botoes' && 'Botões & Elementos'}
                          {subAbaGeral === 'icones' && 'Ícones'}
                          {subAbaGeral === 'vendas' && 'Vendas & Progresso'}
                        </button>
                      </>
                    )}
                    {subAbaBotao && (
                      <>
                        <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                        <span className="text-emerald-400 font-black">
                          {subAbaBotao === 'compra' && 'Botão de Compra'}
                          {subAbaBotao === 'pacotes' && 'Pacotes Promocionais'}
                          {subAbaBotao === 'controles' && 'Controles (+ / -)'}
                          {subAbaBotao === 'cotas' && 'Grade de Cotas'}
                          {subAbaBotao === 'cards' && 'Cards das Seções'}
                        </span>
                      </>
                    )}
                  </>
                )}
                {secaoEditor === 'tipografia' && <span className="text-emerald-400 font-black">Fontes & Tipografia</span>}
                {secaoEditor === 'blocos' && <span className="text-emerald-400 font-black">Layout & Blocos</span>}
                {secaoEditor === 'estilos' && <span className="text-emerald-400 font-black">Estilos & Presets</span>}
              </div>
            </div>
          )}

          {/* 1. MENU PRINCIPAL DO EDITOR DE ESTILOS (4 BOTÕES EM CARD) */}
          {secaoEditor === 'menu' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Editor de Tema & Visual</h3>
                <p className="text-xs text-slate-300">Escolha uma categoria abaixo para editar as configurações da sua campanha:</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  {
                    id: 'geral',
                    label: 'Geral',
                    desc: 'Cores primárias, fundo da página, botões e elementos, ícones, logo e cabeçalho, vendas e progresso.',
                    icon: Palette,
                    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
                    badges: ['Cores & Fundo', 'Botões & Elementos', 'Ícones', 'Logo & Cabeçalho', 'Vendas & Progresso']
                  },
                  {
                    id: 'tipografia',
                    label: 'Fontes',
                    desc: 'Tipografia, seleção de fontes do Google Fonts para títulos e textos, cores e tamanhos de letra.',
                    icon: Type,
                    color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400',
                    badges: ['Google Fonts', 'Títulos', 'Textos', 'Tamanhos']
                  },
                  {
                    id: 'blocos',
                    label: 'Layout',
                    desc: 'Reordenação visual dos blocos da página, visibilidade das seções e mídia de fundo (vídeo ou imagem).',
                    icon: Layout,
                    color: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-400',
                    badges: ['Reordenação de Blocos', 'Visibilidade', 'Vídeo / Imagem de Fundo']
                  },
                  {
                    id: 'estilos',
                    label: 'Estilos',
                    desc: 'Escolha temas prontos (presets) ou salve modelos personalizados na nuvem para reutilizar.',
                    icon: FolderHeart,
                    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
                    badges: ['Temas Prontos', 'Salvar Novo Estilo', 'Estilos da Nuvem']
                  },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSecaoEditor(item.id as any);
                        if (item.id === 'geral') {
                          setSubAbaGeral(null);
                          setSubAbaBotao(null);
                        }
                      }}
                      className="p-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 rounded-2xl text-left transition duration-200 group flex items-start justify-between gap-4 shadow-sm cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${item.color} border flex items-center justify-center shrink-0 group-hover:scale-105 transition duration-200`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="text-base font-black text-white group-hover:text-emerald-400 transition flex items-center gap-2">
                            {item.label}
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {item.desc}
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {item.badges.map((b, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-400">
                                {b}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition shrink-0 mt-2" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. MENU DA ABA GERAL (5 OPÇÕES PRINCIPAIS) */}
          {secaoEditor === 'geral' && subAbaGeral === null && (
            <div className="space-y-3 animate-in fade-in">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Configurações Gerais</h3>
                <p className="text-xs text-slate-300">Escolha qual área geral você deseja configurar:</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  {
                    id: 'cores',
                    label: 'Cores & Fundo',
                    desc: 'Cor primária, cor de destaque, fundo da página (sólido, imagem ou vídeo), textos e títulos.',
                    icon: Palette,
                    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  },
                  {
                    id: 'botoes',
                    label: 'Botões & Elementos',
                    desc: 'Edite individualmente o Botão de Compra (CTA), Pacotes Promocionais, Controles (+/-), Cotas, Card de Progresso e Cards das Seções.',
                    icon: MousePointer,
                    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                  },
                  {
                    id: 'icones',
                    label: 'Ícones',
                    desc: 'Personalize os 20 ícones por seção da rifa e suas cores exclusivas.',
                    icon: Sparkles,
                    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSubAbaGeral(item.id as any);
                        if (item.id === 'botoes') {
                          setSubAbaBotao(null);
                        }
                      }}
                      className="p-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 rounded-2xl text-left transition duration-200 group flex items-center justify-between gap-4 shadow-sm cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`p-3 rounded-xl border ${item.color} flex items-center justify-center shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                            {item.label}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 1. SEÇÃO GERAL (CORES, BOTÕES, ÍCONES, LOGO E VENDAS) */}
          {secaoEditor === 'geral' && subAbaGeral !== null && (
            <div className="space-y-4 animate-in fade-in">

              {/* SUB-ABA 1: CORES & FUNDO */}
              {subAbaGeral === 'cores' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-sm space-y-5 animate-in fade-in">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Palette className="w-4 h-4 text-emerald-400" />
                      Cores Principais & Fundo
                    </h3>
                    <p className="text-xs text-slate-400">
                      Defina a paleta de cores primária, fundo da página e tons de texto.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                      <SeletorCorOuDegrade
                        label="Fundo da Página (Cor Única ou Degradê)"
                        valor={temaSeguro.cores.fundo}
                        onChange={novo => atualizarTema({ cores: { ...temaSeguro.cores, fundo: novo } })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {[
                        { key: 'primaria', label: 'Cor Primária', desc: 'Destaques e badges' },
                        { key: 'destaque', label: 'Cor de Destaque', desc: 'Alertas e brilhos' },
                        { key: 'texto', label: 'Texto Geral', desc: 'Cor dos parágrafos' },
                        { key: 'titulos', label: 'Títulos', desc: 'Cor dos cabeçalhos' },
                        { key: 'descricoes', label: 'Descrições', desc: 'Textos secundários' },
                      ].map(item => {
                        const val = (temaSeguro.cores as any)[item.key];
                        return (
                          <div key={item.key} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{item.label}</label>
                              <span className="text-[10px] text-slate-500 font-mono uppercase">{val}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={val?.startsWith('#') ? val : '#10b981'}
                                onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, [item.key]: e.target.value } })}
                                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                              />
                              <input
                                type="text"
                                value={val}
                                onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, [item.key]: e.target.value } })}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}



              {/* SUB-ABA 3: ÍCONES DAS SEÇÕES */}
              {subAbaGeral === 'icones' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-sm space-y-6 animate-in fade-in">
                  <div className="border-b border-slate-800 pb-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        Ícones & Símbolos do Sistema
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                        20 Opções por Seção
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Personalize o ícone e a cor exclusiva de cada seção da sua campanha.
                    </p>
                  </div>

                  {/* Seletor de Seções de Ícones */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'premios', label: 'Premiação', iconKey: temaSeguro.secaoIcones.premios, corKey: 'iconePremios' },
                      { id: 'regulamento', label: 'Regulamento', iconKey: temaSeguro.secaoIcones.regulamento, corKey: 'iconeRegulamento' },
                      { id: 'cotasPremiadas', label: 'Cotas Premiadas', iconKey: temaSeguro.secaoIcones.cotasPremiadas, corKey: 'iconeCotasPremiadas' },
                      { id: 'topCompradores', label: 'Top Ranking', iconKey: temaSeguro.secaoIcones.topCompradores, corKey: 'iconeTopCompradores' },
                      { id: 'ganhadores', label: 'Ganhadores', iconKey: temaSeguro.secaoIcones.ganhadores, corKey: 'iconeGanhadores' },
                      { id: 'meusNumeros', label: 'Meus Números', iconKey: temaSeguro.secaoIcones.meusNumeros, corKey: 'iconeMeusNumeros' },
                      { id: 'sorteio', label: 'Data do Sorteio', iconKey: temaSeguro.secaoIcones.sorteio, corKey: 'iconeSorteio' },
                      { id: 'botaoCompra', label: 'Botão de Compra', iconKey: temaSeguro.botao.iconeCompra || temaSeguro.secaoIcones.botaoCompra || 'Sparkles', corKey: 'textoBotao' },
                      { id: 'regraDesconto', label: 'Regra de Desconto', iconKey: temaSeguro.cotasConfig?.regraDescontoIcone || 'Zap', corKey: 'iconeCor' },
                    ].map(secao => {
                      const IconComp = getSectionIcon(secao.iconKey, Slash) || Slash;
                      const isAtiva = secaoIconeAberta === secao.id;
                      const corAtual = (temaSeguro.cores as any)[secao.corKey] || temaSeguro.cores.iconeCor || '#10b981';

                      return (
                        <button
                          key={secao.id}
                          type="button"
                          onClick={() => setSecaoIconeAberta(secao.id)}
                          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                            isAtiva
                              ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500/50 shadow-md shadow-emerald-500/10'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/10"
                              style={{ backgroundColor: `${corAtual}20`, color: corAtual }}
                            >
                              <IconComp className="w-4 h-4" />
                            </div>
                            {isAtiva && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            )}
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-white block truncate">{secao.label}</span>
                            <span className="text-[9px] text-slate-400 font-mono block truncate">{secao.iconKey}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Editor Detalhado da Seção Selecionada */}
                  {(() => {
                    const configMap: Record<string, { label: string; desc: string; iconKey: string; corKey: string; iconListKey: keyof typeof ICON_SETS }> = {
                      premios: { label: 'Seção de Premiação', desc: 'Exibido no card de prêmios principais da rifa', iconKey: 'premios', corKey: 'iconePremios', iconListKey: 'premios' },
                      regulamento: { label: 'Seção Regulamento & Informações', desc: 'Exibido no cabeçalho do regulamento e regras', iconKey: 'regulamento', corKey: 'iconeRegulamento', iconListKey: 'regulamento' },
                      cotasPremiadas: { label: 'Cotas Premiadas (Instantâneas)', desc: 'Exibido nas cotas com prêmio instantâneo no Pix', iconKey: 'cotasPremiadas', corKey: 'iconeCotasPremiadas', iconListKey: 'cotasPremiadas' },
                      topCompradores: { label: 'Top Compradores / Ranking', desc: 'Exibido no pódio dos maiores compradores', iconKey: 'topCompradores', corKey: 'iconeTopCompradores', iconListKey: 'topCompradores' },
                      ganhadores: { label: 'Ganhadores & Apuração', desc: 'Exibido na área de apuração e comemoração', iconKey: 'ganhadores', corKey: 'iconeGanhadores', iconListKey: 'ganhadores' },
                      meusNumeros: { label: 'Meus Números / Consulta', desc: 'Exibido nos botões e modais de busca de cotas', iconKey: 'meusNumeros', corKey: 'iconeMeusNumeros', iconListKey: 'meusNumeros' },
                      sorteio: { label: 'Data & Local do Sorteio', desc: 'Exibido no bloco de data e extração da Loteria Federal', iconKey: 'sorteio', corKey: 'iconeSorteio', iconListKey: 'sorteio' },
                      botaoCompra: { label: 'Botão de Compra (CTA Principal)', desc: 'Exibido no botão principal de compra ("Participar do Sorteio"). Selecione "Nenhum" para ocultar o ícone.', iconKey: 'botaoCompra', corKey: 'textoBotao', iconListKey: 'botaoCompra' },
                      regraDesconto: { label: 'Card da Regra de Desconto (Evento)', desc: 'Exibido nos avisos de desconto progressivo de cotas. Selecione "Nenhum" para ocultar o ícone.', iconKey: 'regraDesconto', corKey: 'iconeCor', iconListKey: 'regraDesconto' },
                    };

                    const cfg = configMap[secaoIconeAberta] || configMap.premios;
                    const iconeSelecionado = cfg.iconKey === 'botaoCompra' 
                      ? (temaSeguro.botao.iconeCompra || temaSeguro.secaoIcones.botaoCompra || 'Sparkles') 
                      : cfg.iconKey === 'regraDesconto'
                      ? (temaSeguro.cotasConfig?.regraDescontoIcone || 'Zap')
                      : ((temaSeguro.secaoIcones as any)[cfg.iconKey] || 'Trophy');
                    const corAtual = (temaSeguro.cores as any)[cfg.corKey] || temaSeguro.cores.iconeCor || '#10b981';
                    const listaIcones = ICON_SETS[cfg.iconListKey] || ICON_SETS.premios;
                    const IconeAtivoComp = getSectionIcon(iconeSelecionado, Slash) || Slash;

                    return (
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                        {/* Header do Editor de Ícone */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner transition-all"
                              style={{ backgroundColor: `${corAtual}25`, borderColor: `${corAtual}50`, color: corAtual }}
                            >
                              <IconeAtivoComp className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-white">{cfg.label}</h4>
                              <p className="text-[11px] text-slate-400">{cfg.desc}</p>
                            </div>
                          </div>

                          {/* Seletor de Cor Individual deste Ícone */}
                          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
                            <span className="text-[10px] font-bold text-slate-400 pl-2">Cor:</span>
                            <input
                              type="color"
                              value={corAtual}
                              onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, [cfg.corKey]: e.target.value } })}
                              className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                              title="Escolha a cor do ícone"
                            />
                            <input
                              type="text"
                              value={corAtual}
                              onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, [cfg.corKey]: e.target.value } })}
                              className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Grade das 20 Opções de Ícones */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[11px] font-black text-slate-300 uppercase tracking-wider">
                              Selecione um dos 20 Ícones para esta Seção:
                            </label>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold">
                              {iconeSelecionado}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[320px] overflow-y-auto custom-scrollbar p-1">
                            {listaIcones.map(op => {
                              const IconComp = op.icon;
                              const isSelected = iconeSelecionado === op.id;

                              return (
                                <button
                                  key={op.id}
                                  type="button"
                                  onClick={() => {
                                    if (cfg.iconKey === 'botaoCompra') {
                                      atualizarTema({
                                        botao: { ...temaSeguro.botao, iconeCompra: op.id },
                                        secaoIcones: { ...temaSeguro.secaoIcones, botaoCompra: op.id }
                                      });
                                    } else if (cfg.iconKey === 'regraDesconto') {
                                      const isNone = op.id === 'none';
                                      atualizarTema({
                                        cotasConfig: {
                                          ...temaSeguro.cotasConfig,
                                          regraDescontoIcone: op.id as any,
                                          regraDescontoMostrarIcone: !isNone
                                        }
                                      });
                                    } else {
                                      atualizarTema({ secaoIcones: { ...temaSeguro.secaoIcones, [cfg.iconKey]: op.id } });
                                    }
                                  }}
                                  className={`p-2.5 rounded-xl border text-left transition flex flex-col items-center justify-center gap-1.5 group ${
                                    isSelected
                                      ? 'bg-emerald-500/15 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                                  }`}
                                >
                                  <div 
                                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                                    style={{ 
                                      backgroundColor: isSelected ? `${corAtual}30` : 'rgba(255,255,255,0.04)',
                                      color: isSelected ? corAtual : '#94a3b8' 
                                    }}
                                  >
                                    <IconComp className="w-5 h-5" />
                                  </div>
                                  <span className={`text-[10px] text-center font-bold truncate max-w-full ${isSelected ? 'text-emerald-400 font-black' : 'text-slate-400 group-hover:text-white'}`}>
                                    {op.nome}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* SUB-ABA 4: LOGO & CABEÇALHO */}
              {subAbaGeral === 'logo' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-sm space-y-5 animate-in fade-in">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-400" />
                      Configuração da Logo e Cabeçalho
                    </h3>
                    <p className="text-xs text-slate-400">
                      Defina o tamanho, alinhamento e o comportamento do clique na logo do organizador.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 block">Alinhamento da Logo no Topo</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'esquerda', label: 'Esquerda' },
                          { id: 'centro', label: 'Centro' },
                          { id: 'direita', label: 'Direita' },
                        ].map(al => (
                          <button
                            key={al.id}
                            type="button"
                            onClick={() => atualizarTema({ organizadorCabecalho: { ...temaSeguro.organizadorCabecalho, logoAlinhamento: al.id as any } })}
                            className={`py-2 px-2 text-xs font-bold border rounded-xl transition ${
                              temaSeguro.organizadorCabecalho?.logoAlinhamento === al.id
                                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                                : 'border-slate-800 bg-slate-950 text-slate-400'
                            }`}
                          >
                            {al.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-white">Página de Campanhas do Organizador</h4>
                      <p className="text-[11px] text-slate-400">
                        Quando o usuário clica na logo do organizador no topo da página, abre-se automaticamente uma página dedicada listando todas as campanhas ativas e redes sociais da conta.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-ABA 5: BOTÕES & ELEMENTOS */}
              {subAbaGeral === 'botoes' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-sm space-y-6 animate-in fade-in">
                  {subAbaBotao === null ? (
                    <div className="border-b border-slate-800 pb-3">
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <MousePointer className="w-4 h-4 text-emerald-400" />
                        Personalização de Botões & Elementos
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Selecione um dos elementos abaixo para abrir sua página dedicada de configuração e personalização.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-2 animate-in fade-in">
                      <button
                        type="button"
                        onClick={() => {
                          setSubAbaBotao(null);
                          setSecaoCardAberta(null);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition text-xs font-bold cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4 text-emerald-400" />
                        Voltar para Botões & Elementos
                      </button>
                      <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-400">
                        {subAbaBotao === 'compra' ? 'CTA Principal' : subAbaBotao === 'pacotes' ? 'Pacotes' : subAbaBotao === 'controles' ? 'Quantidade' : subAbaBotao === 'por_apenas' ? 'Preço por Cota' : subAbaBotao === 'cotas' ? 'Cotas' : subAbaBotao === 'progresso' ? 'Progresso de Vendas' : subAbaBotao === 'titulosPremiados' ? 'Títulos Premiados' : 'Cards das Seções'}
                      </span>
                    </div>
                  )}

                  {subAbaBotao === null ? (
                    <div className="grid grid-cols-1 gap-3 animate-in fade-in">
                      {[
                        { id: 'compra', titulo: 'Botão de Compra Principal (CTA)', desc: 'Texto, ícones, estilo (Sólido, Vidro, 3D), cores, bordas, dimensões e sombras.', icone: ShoppingCart, color: 'text-emerald-400 bg-emerald-500/10' },
                        { id: 'por_apenas', titulo: 'Preço por Cota ("Por Apenas")', desc: 'Edite texto, fontes, formato (texto solto, botão ou card), layout, alinhamento e posição.', icone: Zap, color: 'text-emerald-400 bg-emerald-500/10' },
                        { id: 'pacotes', titulo: 'Botões dos Pacotes Promocionais', desc: 'Estilo visual dos combos de cotas, cores padrão, pacote em destaque e selos.', icone: Package, color: 'text-amber-400 bg-amber-500/10' },
                        { id: 'controles', titulo: 'Controles de Quantidade (+ e -)', desc: 'Cores dos botões de adicionar/remover cotas, campo de quantidade e bordas.', icone: SlidersHorizontal, color: 'text-blue-400 bg-blue-500/10' },
                        { id: 'cotas', titulo: 'Grade de Cotas Manuais', desc: 'Cores das cotas livres, selecionadas, pagas/reservadas e números.', icone: Ticket, color: 'text-pink-400 bg-pink-500/10' },
                        { id: 'progresso', titulo: 'Card de Progresso de Vendas', desc: 'Personalize textos, dimensões, cantos e cores da barra de progresso.', icone: Sliders, color: 'text-rose-400 bg-rose-500/10' },
                        { id: 'titulosPremiados', titulo: 'Títulos Premiados (Cotas Instantâneas)', desc: 'Cores, textos e badges nos estados "Disponível" e "Já Ganho".', icone: Gift, color: 'text-amber-400 bg-amber-500/10' },
                        { id: 'cards', titulo: 'Cards das Seções & Conteúdos', desc: 'Estilo visual dos quadros de Premiação, Banner, Cotas, Premiadas, Ranking, Regulamento e Ganhadores.', icone: Box, color: 'text-purple-400 bg-purple-500/10' }
                      ].map(item => {
                        const IconComponent = item.icone;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setSubAbaBotao(item.id as any);
                              setSecaoCardAberta(null);
                            }}
                            className="w-full text-left p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-emerald-500/50 hover:bg-slate-900/60 transition-all duration-200 group flex items-center justify-between gap-4 cursor-pointer animate-in fade-in"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className={`p-3 rounded-xl ${item.color} group-hover:scale-105 transition-transform`}>
                                <IconComponent className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors">
                                  {item.titulo}
                                </h4>
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* 1. BOTÃO DE COMPRA PRINCIPAL (CTA) */}
                      {subAbaBotao === 'compra' && (
                        <div className="space-y-5 animate-in fade-in duration-200">
                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-white flex items-center gap-2">
                              <ShoppingCart className="w-4 h-4 text-emerald-400" />
                              Botão de Compra Principal (CTA)
                            </h4>
                            <p className="text-xs text-slate-400">
                              Configure o texto do botão principal, ícones, cores, estilo visual (Sólido, Vidro, 3D), arredondamento de bordas e sombras.
                            </p>
                          </div>
                  {/* Textos da Seção */}
                  <SectionTextConfig
                    titulo={temaSeguro.botao.tituloCompra || ''}
                    subtitulo={temaSeguro.botao.subtituloCompra || ''}
                    fonteTitulo={temaSeguro.tipografia.fonteBotaoCompraTitulo || ''}
                    fonteSubtitulo={temaSeguro.tipografia.fonteBotaoCompraSubtitulo || ''}
                    alinhamentoTitulo={temaSeguro.tipografia.alinhamentoCompraTitulo || temaSeguro.tipografia.alinhamentoCompra || 'esquerda'}
                    alinhamentoSubtitulo={temaSeguro.tipografia.alinhamentoCompraSubtitulo || temaSeguro.tipografia.alinhamentoCompra || 'esquerda'}
                    onTituloChange={val => atualizarTema({ botao: { ...temaSeguro.botao, tituloCompra: val } })}
                    onSubtituloChange={val => atualizarTema({ botao: { ...temaSeguro.botao, subtituloCompra: val } })}
                    onFonteTituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, fonteBotaoCompraTitulo: val } })}
                    onFonteSubtituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, fonteBotaoCompraSubtitulo: val } })}
                    onAlinhamentoTituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, alinhamentoCompraTitulo: val } })}
                    onAlinhamentoSubtituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, alinhamentoCompraSubtitulo: val } })}
                  />

                  {/* Seletor de Estilo Visual com Exemplo Real */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      Escolha o Efeito Visual do Botão de Compra:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: 'solido', label: 'Sólido', desc: 'Preenchimento vibrante' },
                        { id: 'vidro', label: 'Vidro (Glass)', desc: 'Translúcido com Blur' },
                        { id: 'transparente', label: 'Transparente', desc: 'Borda nítida 2px' },
                        { id: '3d', label: 'Sombra 3D', desc: 'Relevo físico pulsante' },
                      ].map(st => {
                        const isSelected = (temaSeguro.botao.estilo || 'solido') === st.id;
                        const previewBtn = calcularEstiloBotao({
                          estilo: st.id as TipoEstiloBotao,
                          corFundo: temaSeguro.cores.botao,
                          corTexto: temaSeguro.cores.textoBotao,
                          raioBorda: temaSeguro.botao.raioBorda,
                          tamanhoAltura: 10,
                          tamanhoTexto: 12,
                          sombraAltura: temaSeguro.botao.sombraAltura,
                          corSombra: temaSeguro.botao.corSombra,
                        });

                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => atualizarTema({ botao: { ...temaSeguro.botao, estilo: st.id as any } })}
                            className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2.5 ${
                              isSelected
                                ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className={`text-xs font-black ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                                {st.label}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                            </div>

                            {/* Mini Prévia Real */}
                            <div className="w-full py-1.5 flex items-center justify-center">
                              <div style={previewBtn.style} className={`${previewBtn.className} px-3 py-1 text-[10px] w-full max-w-[120px]`}>
                                Comprar
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-500 block truncate">{st.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Prévia Interativa do Botão de Compra no Editor */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Prévia Interativa do Botão de Compra (Clique para testar):
                    </label>
                    <div className="py-4 px-2 flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800/80">
                      {(() => {
                        const btnStyle = calcularEstiloBotao({
                          estilo: temaSeguro.botao.estilo,
                          corFundo: temaSeguro.cores.botao,
                          corTexto: temaSeguro.cores.textoBotao,
                          raioBorda: temaSeguro.botao.raioBorda,
                          tamanhoAltura: temaSeguro.botao.tamanhoAltura,
                          tamanhoTexto: temaSeguro.botao.tamanhoTexto,
                          sombraAltura: temaSeguro.botao.sombraAltura,
                          sombraLargura: temaSeguro.botao.sombraLargura,
                          corSombra: temaSeguro.botao.corSombra,
                        });
                        const iconeBtnName = temaSeguro.botao?.iconeCompra || temaSeguro.secaoIcones?.botaoCompra || 'Sparkles';
                        const IconeBtn = getSectionIcon(iconeBtnName, null);

                        return (
                          <button
                            type="button"
                            style={btnStyle.style}
                            className={`${btnStyle.className} w-full max-w-sm px-6 py-3 cursor-pointer shadow-lg`}
                          >
                            {IconeBtn && <IconeBtn className="w-4 h-4 mr-2 shrink-0" />}
                            <span>{temaSeguro.botao.textoCompra || 'PARTICIPAR DO SORTEIO'}</span>
                          </button>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Texto, Ícone e Cores do Botão de Compra */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-3 space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 block">Texto do Botão de Compra</label>
                      <input
                        type="text"
                        value={temaSeguro.botao.textoCompra}
                        onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, textoCompra: e.target.value } })}
                        placeholder="Ex: QUERO PARTICIPAR"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none font-bold"
                      />
                    </div>

                    {/* Seleção de Ícone do Botão de Compra */}
                    <div className="sm:col-span-3 space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300 block">Ícone do Botão de Compra</label>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">
                          {temaSeguro.botao?.iconeCompra === 'none' || temaSeguro.secaoIcones?.botaoCompra === 'none' ? 'Nenhum' : (temaSeguro.botao?.iconeCompra || temaSeguro.secaoIcones?.botaoCompra || 'Sparkles')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[160px] overflow-y-auto custom-scrollbar p-1.5 bg-slate-950 rounded-xl border border-slate-800">
                        {ICON_SETS.botaoCompra.map(op => {
                          const IconComp = op.icon;
                          const iconeAtual = temaSeguro.botao?.iconeCompra || temaSeguro.secaoIcones?.botaoCompra || 'Sparkles';
                          const isSelected = iconeAtual === op.id;

                          return (
                            <button
                              key={op.id}
                              type="button"
                              onClick={() => atualizarTema({ 
                                botao: { ...temaSeguro.botao, iconeCompra: op.id },
                                secaoIcones: { ...temaSeguro.secaoIcones, botaoCompra: op.id }
                              })}
                              className={`p-2 rounded-lg border text-left transition flex items-center gap-2 group cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500'
                                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div 
                                className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                                style={{ 
                                  backgroundColor: isSelected ? `${temaSeguro.cores.primaria}30` : 'rgba(255,255,255,0.04)',
                                  color: isSelected ? temaSeguro.cores.primaria : '#94a3b8' 
                                }}
                              >
                                <IconComp className="w-3.5 h-3.5" />
                              </div>
                              <span className={`text-[10px] font-bold truncate ${isSelected ? 'text-emerald-400 font-black' : 'text-slate-400 group-hover:text-white'}`}>
                                {op.nome}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <SeletorCorOuDegrade
                        label="Cor ou Degradê de Fundo do Botão"
                        valor={temaSeguro.cores.botao}
                        onChange={novo => atualizarTema({ cores: { ...temaSeguro.cores, botao: novo } })}
                      />
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Cor do Texto</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={temaSeguro.cores.textoBotao?.startsWith('#') ? temaSeguro.cores.textoBotao : '#ffffff'}
                          onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, textoBotao: e.target.value } })}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                        />
                        <input
                          type="text"
                          value={temaSeguro.cores.textoBotao}
                          onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, textoBotao: e.target.value } })}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Controles de Borda do Botão de Compra */}
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Borda do Botão</label>
                        <button
                          type="button"
                          onClick={() => atualizarTema({ botao: { ...temaSeguro.botao, possuirBorda: !temaSeguro.botao.possuirBorda } })}
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                            temaSeguro.botao.possuirBorda
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {temaSeguro.botao.possuirBorda ? 'Ativa' : 'Desativada'}
                        </button>
                      </div>

                      {temaSeguro.botao.possuirBorda && (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={temaSeguro.botao.corBorda?.startsWith('#') ? temaSeguro.botao.corBorda : '#ffffff'}
                              onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, corBorda: e.target.value } })}
                              className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0"
                            />
                            <input
                              type="text"
                              value={temaSeguro.botao.corBorda}
                              onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, corBorda: e.target.value } })}
                              placeholder="#ffffff"
                              className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                            />
                          </div>
                          <div className="flex justify-between items-center text-[10px] pt-1">
                            <span className="text-slate-400">Espessura:</span>
                            <span className="font-mono text-emerald-400 font-bold">{temaSeguro.botao.larguraBorda ?? 1}px</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="8"
                            value={temaSeguro.botao.larguraBorda ?? 1}
                            onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, larguraBorda: Number(e.target.value) } })}
                            className="w-full accent-emerald-500 bg-slate-900 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>

                    {temaSeguro.botao.estilo === '3d' && (
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Cor da Sombra 3D</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={temaSeguro.botao.corSombra || '#047857'}
                            onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, corSombra: e.target.value } })}
                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                          />
                          <input
                            type="text"
                            value={temaSeguro.botao.corSombra || '#047857'}
                            onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, corSombra: e.target.value } })}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sliders de Ajuste Geométrico */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-300">Arredondamento (Borda)</span>
                        <span className="font-mono text-emerald-400 font-bold">{temaSeguro.botao.raioBorda}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="32"
                        value={temaSeguro.botao.raioBorda}
                        onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, raioBorda: Number(e.target.value) } })}
                        className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-300">Altura / Padding</span>
                        <span className="font-mono text-emerald-400 font-bold">{temaSeguro.botao.tamanhoAltura}px</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="28"
                        value={temaSeguro.botao.tamanhoAltura}
                        onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, tamanhoAltura: Number(e.target.value) } })}
                        className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-300">Tamanho da Fonte</span>
                        <span className="font-mono text-emerald-400 font-bold">{temaSeguro.botao.tamanhoTexto}px</span>
                      </div>
                      <input
                        type="range"
                        min="12"
                        max="24"
                        value={temaSeguro.botao.tamanhoTexto}
                        onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, tamanhoTexto: Number(e.target.value) } })}
                        className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
                      />
                    </div>
                  </div>

                    {temaSeguro.botao.estilo === '3d' && (
                      <>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-300">Altura da Sombra 3D</span>
                            <span className="font-mono text-emerald-400 font-bold">{temaSeguro.botao.sombraAltura}px</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="10"
                            value={temaSeguro.botao.sombraAltura}
                            onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, sombraAltura: Number(e.target.value) } })}
                            className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-300">Largura da Sombra 3D</span>
                            <span className="font-mono text-emerald-400 font-bold">{temaSeguro.botao.sombraLargura}px</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="12"
                            value={temaSeguro.botao.sombraLargura}
                            onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, sombraLargura: Number(e.target.value) } })}
                            className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
                          />
                        </div>
                      </>
                    )}
                        </div>
                      )}

                      {/* 1.5. PREÇO DA COTA ("POR APENAS") */}
                      {subAbaBotao === 'por_apenas' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-white flex items-center gap-2">
                              <Zap className="w-4 h-4 text-emerald-400" />
                              Preço por Cota ("Por Apenas")
                            </h4>
                            <p className="text-xs text-slate-400">
                              Personalize o texto, tamanho das fontes, formato visual do container com miniaturas em tempo real, estilos de botão, alinhamento e posição na página.
                            </p>
                          </div>

                          {/* 1. TEXTOS E FONTES */}
                          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                              <div className="flex items-center gap-2">
                                <Type className="w-4 h-4 text-purple-400 shrink-0" />
                                <h5 className="text-xs font-black text-white uppercase tracking-wider">Texto &amp; Rótulo</h5>
                              </div>
                              <span className="text-[10px] text-slate-500 font-medium">Apague o texto se quiser ocultar</span>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[11px] font-bold text-slate-300 block">Texto antes do valor:</label>
                              <input
                                type="text"
                                value={temaSeguro.cotasConfig?.textoPorApenas ?? 'Por apenas'}
                                onChange={e => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, textoPorApenas: e.target.value } })}
                                placeholder="Ex: Por apenas, Por, Valor por cota..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                              />
                              {!(temaSeguro.cotasConfig?.textoPorApenas ?? 'Por apenas').trim() && (
                                <p className="text-[10px] text-amber-400 font-medium">Texto oculto. Apenas o valor do preço será exibido.</p>
                              )}
                            </div>

                            {/* Fonte do Preço por Cota */}
                            <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                              <label className="text-[11px] font-bold text-slate-300 block">Fonte do Preço por Cota:</label>
                              <SeletorFonteCard
                                valor={temaSeguro.cotasConfig?.porApenasFonte || ''}
                                onChange={novaFonte => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, porApenasFonte: novaFonte } })}
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/60">
                              {/* Tamanho da Fonte do Texto */}
                              <div className="space-y-1.5 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className="font-bold text-slate-300">Tamanho da Fonte (Texto):</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, porApenasTamanhoTexto: Math.max(6, (temaSeguro.cotasConfig?.porApenasTamanhoTexto ?? 14) - 1) } })}
                                      className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-xs flex items-center justify-center cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min="6"
                                      max="36"
                                      value={temaSeguro.cotasConfig?.porApenasTamanhoTexto ?? 14}
                                      onChange={e => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, porApenasTamanhoTexto: Math.min(36, Math.max(6, Number(e.target.value) || 6)) } })}
                                      className="w-12 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-center font-mono text-emerald-400 font-bold text-xs focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, porApenasTamanhoTexto: Math.min(36, (temaSeguro.cotasConfig?.porApenasTamanhoTexto ?? 14) + 1) } })}
                                      className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-xs flex items-center justify-center cursor-pointer"
                                    >
                                      +
                                    </button>
                                    <span className="text-slate-500 text-[10px] font-mono">px</span>
                                  </div>
                                </div>
                                <input
                                  type="range"
                                  min="6"
                                  max="36"
                                  value={temaSeguro.cotasConfig?.porApenasTamanhoTexto ?? 14}
                                  onPointerDown={e => e.stopPropagation()}
                                  onTouchStart={e => e.stopPropagation()}
                                  onChange={e => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, porApenasTamanhoTexto: Number(e.target.value) } })}
                                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
                                />
                              </div>

                              {/* Tamanho da Fonte do Valor */}
                              <div className="space-y-1.5 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className="font-bold text-slate-300">Tamanho da Fonte (Preço/Valor):</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, porApenasTamanhoValor: Math.max(6, (temaSeguro.cotasConfig?.porApenasTamanhoValor ?? 24) - 1) } })}
                                      className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-xs flex items-center justify-center cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min="6"
                                      max="60"
                                      value={temaSeguro.cotasConfig?.porApenasTamanhoValor ?? 24}
                                      onChange={e => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, porApenasTamanhoValor: Math.min(60, Math.max(6, Number(e.target.value) || 6)) } })}
                                      className="w-12 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-center font-mono text-emerald-400 font-bold text-xs focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, porApenasTamanhoValor: Math.min(60, (temaSeguro.cotasConfig?.porApenasTamanhoValor ?? 24) + 1) } })}
                                      className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-xs flex items-center justify-center cursor-pointer"
                                    >
                                      +
                                    </button>
                                    <span className="text-slate-500 text-[10px] font-mono">px</span>
                                  </div>
                                </div>
                                <input
                                  type="range"
                                  min="6"
                                  max="60"
                                  value={temaSeguro.cotasConfig?.porApenasTamanhoValor ?? 24}
                                  onPointerDown={e => e.stopPropagation()}
                                  onTouchStart={e => e.stopPropagation()}
                                  onChange={e => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, porApenasTamanhoValor: Number(e.target.value) } })}
                                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
                                />
                              </div>
                            </div>
                          </div>

                          {/* 2. FORMATO & CONTAINER DO ELEMENTO COM MINIATURAS REAIS */}
                          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                            <div className="space-y-1">
                              <h5 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <Box className="w-3.5 h-3.5 text-blue-400" /> Formato &amp; Estilo Visual do Container
                              </h5>
                              <p className="text-[11px] text-slate-400">
                                Veja o exemplo visual de cada uma das 4 estruturas abaixo com as cores definidas:
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {(() => {
                                const corFundoAtual = temaSeguro.cotasConfig?.porApenasFundo || '#064e3b';
                                const corTextoAtual = temaSeguro.cotasConfig?.porApenasTexto || '#10b981';
                                const corBordaAtual = temaSeguro.cotasConfig?.porApenasBorda || '#059669';
                                const estiloBtnAtual = temaSeguro.cotasConfig?.porApenasEstiloBotao || 'solido';
                                const temBordaAtual = temaSeguro.cotasConfig?.porApenasTemBorda ?? true;
                                const espBordaAtual = temaSeguro.cotasConfig?.porApenasEspessuraBorda ?? 1;
                                const raioBordaAtual = temaSeguro.cotasConfig?.porApenasRaioBorda ?? 10;
                                const txtLabel = (temaSeguro.cotasConfig?.textoPorApenas ?? 'Por apenas').trim() || 'Por apenas';

                                // Estilização para tags nos previews
                                const getMiniTagStyle = () => {
                                  if (estiloBtnAtual === 'vidro') {
                                    return {
                                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                      backdropFilter: 'blur(4px)',
                                      border: temBordaAtual ? `${espBordaAtual}px solid ${corBordaAtual}` : 'none',
                                      borderRadius: `${raioBordaAtual}px`,
                                      color: corTextoAtual,
                                    };
                                  }
                                  if (estiloBtnAtual === 'transparente') {
                                    return {
                                      backgroundColor: 'transparent',
                                      border: temBordaAtual ? `${espBordaAtual}px solid ${corBordaAtual}` : '1px dashed #475569',
                                      borderRadius: `${raioBordaAtual}px`,
                                      color: corTextoAtual,
                                    };
                                  }
                                  if (estiloBtnAtual === 'sombra') {
                                    return {
                                      ...obterFundoCss(corFundoAtual, '#064e3b'),
                                      border: temBordaAtual ? `${espBordaAtual}px solid ${corBordaAtual}` : 'none',
                                      borderRadius: `${raioBordaAtual}px`,
                                      color: corTextoAtual,
                                      boxShadow: `0 3px 0 ${corBordaAtual}`,
                                    };
                                  }
                                  // Sólido
                                  return {
                                    ...obterFundoCss(corFundoAtual, '#064e3b'),
                                    border: temBordaAtual ? `${espBordaAtual}px solid ${corBordaAtual}` : 'none',
                                    borderRadius: `${raioBordaAtual}px`,
                                    color: corTextoAtual,
                                  };
                                };

                                return [
                                  {
                                    id: 'apenas_texto_preco',
                                    label: 'Texto & Preço Soltos',
                                    desc: 'Sem card ou moldura em volta, limpo e direto',
                                    renderMini: () => (
                                      <div className="py-2.5 px-3 bg-slate-900/90 rounded-lg flex flex-col items-center justify-center gap-0.5 w-full">
                                        <span className="text-[10px] font-bold opacity-80" style={{ color: corTextoAtual }}>
                                          {txtLabel}
                                        </span>
                                        <span className="text-xs font-mono font-black" style={{ color: corTextoAtual }}>
                                          R$ 0,50
                                        </span>
                                      </div>
                                    ),
                                  },
                                  {
                                    id: 'texto_e_botao',
                                    label: 'Texto Solto + Botão no Valor',
                                    desc: 'Rótulo simples e o valor destacado em botão/tag',
                                    renderMini: () => (
                                      <div className="py-2 px-3 bg-slate-900/90 rounded-lg flex flex-col items-center justify-center gap-1 w-full">
                                        <span className="text-[10px] font-bold opacity-80" style={{ color: corTextoAtual }}>
                                          {txtLabel}
                                        </span>
                                        <div style={getMiniTagStyle()} className="px-2.5 py-0.5 text-xs font-mono font-black shadow-sm">
                                          R$ 0,50
                                        </div>
                                      </div>
                                    ),
                                  },
                                  {
                                    id: 'botao_unico',
                                    label: 'Botão Único Unificado',
                                    desc: 'Texto e valor juntos em um único botão estilizado',
                                    renderMini: () => (
                                      <div className="py-2.5 px-3 bg-slate-900/90 rounded-lg flex items-center justify-center w-full">
                                        <div style={getMiniTagStyle()} className="px-3 py-1 flex items-center gap-1.5 shadow-sm">
                                          <span className="text-[10px] font-bold opacity-90">{txtLabel}</span>
                                          <span className="text-xs font-mono font-black">R$ 0,50</span>
                                        </div>
                                      </div>
                                    ),
                                  },
                                  {
                                    id: 'card_destaque',
                                    label: 'Card Destaque Tradicional',
                                    desc: 'Moldura retangular clássica com fundo e borda',
                                    renderMini: () => (
                                      <div 
                                        style={{
                                          backgroundColor: '#090d16',
                                          border: temBordaAtual ? `${espBordaAtual}px solid ${corBordaAtual}` : '1px solid #1e293b',
                                          borderRadius: `${raioBordaAtual}px`,
                                        }}
                                        className="py-2 px-3 flex flex-col items-center justify-center gap-1 w-full shadow-sm"
                                      >
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                          {txtLabel}
                                        </span>
                                        <div style={getMiniTagStyle()} className="px-2.5 py-0.5 text-xs font-mono font-black">
                                          R$ 0,50
                                        </div>
                                      </div>
                                    ),
                                  },
                                ].map(fmt => {
                                  const isSel = (temaSeguro.cotasConfig?.estiloContainer || 'texto_e_botao') === fmt.id;
                                  return (
                                    <button
                                      key={fmt.id}
                                      type="button"
                                      onClick={() => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, estiloContainer: fmt.id as any } })}
                                      className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between gap-2.5 cursor-pointer ${
                                        isSel
                                          ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span className={`text-xs font-black ${isSel ? 'text-emerald-400' : 'text-white'}`}>{fmt.label}</span>
                                        {isSel && <Check className="w-4 h-4 text-emerald-400" />}
                                      </div>

                                      {/* Miniatura do Exemplo Visual Real */}
                                      <div className="w-full">
                                        {fmt.renderMini()}
                                      </div>

                                      <p className="text-[10px] text-slate-400 leading-tight">{fmt.desc}</p>
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                          </div>

                          {/* 3. ESTILO VISUAL DO BOTÃO / TAG (SÓLIDO, VIDRO, TRANSPARENTE, 3D/SOMBRA) */}
                          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                            <div className="space-y-1">
                              <h5 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Estilo do Botão / Tag de Preço
                              </h5>
                              <p className="text-[11px] text-slate-400">
                                Escolha o efeito visual aplicado à tag de valor:
                              </p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              {(() => {
                                const corFundoAtual = temaSeguro.cotasConfig?.porApenasFundo || '#064e3b';
                                const corTextoAtual = temaSeguro.cotasConfig?.porApenasTexto || '#10b981';
                                const corBordaAtual = temaSeguro.cotasConfig?.porApenasBorda || '#059669';
                                const temBordaAtual = temaSeguro.cotasConfig?.porApenasTemBorda ?? true;
                                const espBordaAtual = temaSeguro.cotasConfig?.porApenasEspessuraBorda ?? 1;
                                const raioBordaAtual = temaSeguro.cotasConfig?.porApenasRaioBorda ?? 10;

                                return [
                                  {
                                    id: 'solido',
                                    label: 'Sólido',
                                    desc: 'Fundo vibrante e preenchido',
                                    style: {
                                      ...obterFundoCss(corFundoAtual, '#064e3b'),
                                      border: temBordaAtual ? `${espBordaAtual}px solid ${corBordaAtual}` : 'none',
                                      borderRadius: `${raioBordaAtual}px`,
                                      color: corTextoAtual,
                                    },
                                  },
                                  {
                                    id: 'vidro',
                                    label: 'Vidro (Glass)',
                                    desc: 'Translúcido com Blur suave',
                                    style: {
                                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                      backdropFilter: 'blur(4px)',
                                      border: temBordaAtual ? `${espBordaAtual}px solid ${corBordaAtual}` : 'none',
                                      borderRadius: `${raioBordaAtual}px`,
                                      color: corTextoAtual,
                                    },
                                  },
                                  {
                                    id: 'transparente',
                                    label: 'Transparente',
                                    desc: 'Fundo vazado com borda nítida',
                                    style: {
                                      backgroundColor: 'transparent',
                                      border: temBordaAtual ? `${espBordaAtual}px solid ${corBordaAtual}` : '1px solid #475569',
                                      borderRadius: `${raioBordaAtual}px`,
                                      color: corTextoAtual,
                                    },
                                  },
                                  {
                                    id: 'sombra',
                                    label: 'Sombra 3D',
                                    desc: 'Efeito relevo físico moderno',
                                    style: {
                                      ...obterFundoCss(corFundoAtual, '#064e3b'),
                                      border: temBordaAtual ? `${espBordaAtual}px solid ${corBordaAtual}` : 'none',
                                      borderRadius: `${raioBordaAtual}px`,
                                      color: corTextoAtual,
                                      boxShadow: `0 3px 0 ${corBordaAtual}`,
                                    },
                                  },
                                ].map(est => {
                                  const isSel = (temaSeguro.cotasConfig?.porApenasEstiloBotao || 'solido') === est.id;
                                  return (
                                    <button
                                      key={est.id}
                                      type="button"
                                      onClick={() => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, porApenasEstiloBotao: est.id as any } })}
                                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                                        isSel
                                          ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span className={`text-xs font-black ${isSel ? 'text-emerald-400' : 'text-white'}`}>{est.label}</span>
                                        {isSel && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                                      </div>

                                      {/* Miniatura do Botão com Estilo */}
                                      <div className="w-full py-1 flex items-center justify-center">
                                        <div style={est.style} className="px-2.5 py-1 text-[11px] font-mono font-black">
                                          R$ 0,50
                                        </div>
                                      </div>

                                      <span className="text-[10px] text-slate-500 block truncate">{est.desc}</span>
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                          </div>

                          {/* 4. ALINHAMENTO */}
                          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                            <h5 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                              <Layout className="w-3.5 h-3.5 text-amber-400" /> Alinhamento
                            </h5>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Sub-item 1: Disposição do texto e valor */}
                              <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-300 block">Disposição do Texto e Valor:</label>
                                <div className="grid grid-cols-3 gap-2">
                                  {[
                                    { id: 'vertical', label: 'Vertical', desc: 'Texto em cima, Preço embaixo' },
                                    { id: 'horizontal', label: 'Horizontal', desc: 'Texto à esq, Preço à dir' },
                                    { id: 'inverso', label: 'Inverso', desc: 'Preço em cima, Texto embaixo' },
                                  ].map(lay => {
                                    const active = (temaSeguro.cotasConfig?.porApenasLayout || 'vertical') === lay.id;
                                    return (
                                      <button
                                        key={lay.id}
                                        type="button"
                                        onClick={() => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, porApenasLayout: lay.id as any } })}
                                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                          active
                                            ? 'bg-purple-600 text-white border-purple-400 shadow-md font-black'
                                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                                        }`}
                                      >
                                        <span className="text-xs font-bold">{lay.label}</span>
                                        <span className="text-[9px] opacity-75">{lay.desc}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Sub-item 2: Alinhamento na página */}
                              <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-300 block">Alinhamento na Página:</label>
                                <div className="flex items-center gap-2">
                                  {[
                                    { id: 'esquerda', label: 'À Esquerda', Icon: AlignLeft },
                                    { id: 'centro', label: 'Centralizado', Icon: AlignCenter },
                                    { id: 'direita', label: 'À Direita', Icon: AlignRight },
                                  ].map(ali => {
                                    const active = (temaSeguro.cotasConfig?.porApenasAlinhamento || 'centro') === ali.id;
                                    const IconComp = ali.Icon;
                                    return (
                                      <button
                                        key={ali.id}
                                        type="button"
                                        title={ali.label}
                                        onClick={() => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, porApenasAlinhamento: ali.id as any } })}
                                        className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                                          active
                                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black'
                                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                                        }`}
                                      >
                                        <IconComp className="w-4 h-4" />
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Posição no Layout Geral da Campanha */}
                            <div className="space-y-2 pt-2 border-t border-slate-800/80">
                              <label className="text-[11px] font-bold text-slate-300 block">Onde exibir o Preço ("Por Apenas") na página:</label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                  { id: 'proximo_cotas', title: 'Próximo das Cotas & Pacotes', desc: 'Exibe logo acima da área de seleção de cotas' },
                                  { id: 'abaixo_banner', title: 'Abaixo do Banner / Mídia Principal', desc: 'Exibe no topo da página, logo após a imagem do prêmio' },
                                ].map(pos => {
                                  const active = (temaSeguro.cotasConfig?.posicaoExibicao || 'proximo_cotas') === pos.id;
                                  return (
                                    <button
                                      key={pos.id}
                                      type="button"
                                      onClick={() => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, posicaoExibicao: pos.id as any } })}
                                      className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                                        active
                                          ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/40'
                                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className={`text-xs font-black ${active ? 'text-emerald-400' : 'text-white'}`}>{pos.title}</span>
                                        {active && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                                      </div>
                                      <p className="text-[10px] text-slate-400">{pos.desc}</p>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* 5. CORES, BORDA E CONTROLES DE DIMENSÃO */}
                          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                            <h5 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                              <Palette className="w-3.5 h-3.5 text-pink-400" /> Cores &amp; Borda do Elemento "Por Apenas"
                            </h5>

                            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                              <SeletorCorOuDegrade
                                label="Cor de Fundo da Tag / Botão / Card"
                                valor={temaSeguro.cotasConfig?.porApenasFundo || '#064e3b'}
                                onChange={novo => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, porApenasFundo: novo } })}
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Cor do Texto e do Valor</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={temaSeguro.cotasConfig?.porApenasTexto?.startsWith('#') ? temaSeguro.cotasConfig.porApenasTexto : '#10b981'}
                                    onChange={e => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, porApenasTexto: e.target.value } })}
                                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                  />
                                  <input
                                    type="text"
                                    value={temaSeguro.cotasConfig?.porApenasTexto || '#10b981'}
                                    onChange={e => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, porApenasTexto: e.target.value } })}
                                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                  />
                                </div>
                              </div>

                              {/* Controle de Borda */}
                              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Borda do Elemento</label>
                                  <button
                                    type="button"
                                    onClick={() => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, porApenasTemBorda: !(temaSeguro.cotasConfig?.porApenasTemBorda ?? true) } })}
                                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                                      (temaSeguro.cotasConfig?.porApenasTemBorda ?? true)
                                        ? 'bg-emerald-500 text-slate-950 font-black'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {(temaSeguro.cotasConfig?.porApenasTemBorda ?? true) ? 'Ativa' : 'Desativada'}
                                  </button>
                                </div>

                                {(temaSeguro.cotasConfig?.porApenasTemBorda ?? true) && (
                                  <div className="space-y-2 pt-1">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={temaSeguro.cotasConfig?.porApenasBorda?.startsWith('#') ? temaSeguro.cotasConfig.porApenasBorda : '#059669'}
                                        onChange={e => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, porApenasBorda: e.target.value } })}
                                        className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0"
                                      />
                                      <input
                                        type="text"
                                        value={temaSeguro.cotasConfig?.porApenasBorda || '#059669'}
                                        onChange={e => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, porApenasBorda: e.target.value } })}
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Sliders Geométricos de Espessura e Raio de Borda */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
                              <div className="space-y-1.5 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className="font-bold text-slate-300">Espessura da Borda:</span>
                                  <span className="font-mono text-emerald-400 font-bold">{temaSeguro.cotasConfig?.porApenasEspessuraBorda ?? 1}px</span>
                                </div>
                                <input
                                  type="range"
                                  min="1"
                                  max="8"
                                  value={temaSeguro.cotasConfig?.porApenasEspessuraBorda ?? 1}
                                  onPointerDown={e => e.stopPropagation()}
                                  onTouchStart={e => e.stopPropagation()}
                                  onChange={e => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, porApenasEspessuraBorda: Number(e.target.value) } })}
                                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
                                />
                              </div>

                              <div className="space-y-1.5 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className="font-bold text-slate-300">Arredondamento dos Cantos:</span>
                                  <span className="font-mono text-emerald-400 font-bold">{temaSeguro.cotasConfig?.porApenasRaioBorda ?? 12}px</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="36"
                                  value={temaSeguro.cotasConfig?.porApenasRaioBorda ?? 12}
                                  onPointerDown={e => e.stopPropagation()}
                                  onTouchStart={e => e.stopPropagation()}
                                  onChange={e => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, porApenasRaioBorda: Number(e.target.value) } })}
                                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
                                />
                              </div>
                            </div>
                          </div>

                          {/* 6. PRÉVIA REAL INTERATIVA DENTRO DA ABA DE CONFIGURAÇÃO */}
                          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                              Prévia em Tempo Real do "Por Apenas" (Como aparece na página):
                            </label>
                            <div className="py-6 px-4 flex items-center justify-center bg-slate-900/60 rounded-xl border border-slate-800">
                              {(() => {
                                const cotasCfg = temaSeguro.cotasConfig || {};
                                const rawTexto = cotasCfg.textoPorApenas ?? 'Por apenas';
                                const textoPorApenas = rawTexto.trim();
                                const temTexto = textoPorApenas.length > 0;
                                const porApenasFundo = cotasCfg.porApenasFundo || '#064e3b';
                                const porApenasTexto = cotasCfg.porApenasTexto || '#10b981';
                                const porApenasBorda = cotasCfg.porApenasBorda || '#059669';
                                const porApenasTemBorda = cotasCfg.porApenasTemBorda ?? true;
                                const porApenasEspessuraBorda = cotasCfg.porApenasEspessuraBorda ?? 1;
                                const porApenasRaioBorda = cotasCfg.porApenasRaioBorda ?? 12;
                                const porApenasEstiloBotao = cotasCfg.porApenasEstiloBotao || 'solido';
                                const porApenasTamanhoValor = cotasCfg.porApenasTamanhoValor || 24;
                                const porApenasTamanhoTexto = cotasCfg.porApenasTamanhoTexto || 14;
                                const estiloContainer = cotasCfg.estiloContainer || 'texto_e_botao';
                                const layout = cotasCfg.porApenasLayout || 'vertical';
                                const alinhamento = cotasCfg.porApenasAlinhamento || 'centro';

                                const alignWrapperClass = 
                                  alinhamento === 'esquerda' ? 'justify-start text-left items-start' :
                                  alinhamento === 'direita' ? 'justify-end text-right items-end' :
                                  'justify-center text-center items-center';

                                const justifyFlexClass =
                                  alinhamento === 'esquerda' ? 'justify-start' :
                                  alinhamento === 'direita' ? 'justify-end' :
                                  'justify-center';

                                const styleBotaoObj = (() => {
                                  if (porApenasEstiloBotao === 'vidro') {
                                    return {
                                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                      backdropFilter: 'blur(8px)',
                                      border: porApenasTemBorda ? `${porApenasEspessuraBorda}px solid ${porApenasBorda}` : 'none',
                                      borderRadius: `${porApenasRaioBorda}px`,
                                      color: porApenasTexto,
                                    };
                                  }
                                  if (porApenasEstiloBotao === 'transparente') {
                                    return {
                                      backgroundColor: 'transparent',
                                      border: porApenasTemBorda ? `${porApenasEspessuraBorda}px solid ${porApenasBorda}` : 'none',
                                      borderRadius: `${porApenasRaioBorda}px`,
                                      color: porApenasTexto,
                                    };
                                  }
                                  if (porApenasEstiloBotao === 'sombra') {
                                    return {
                                      ...obterFundoCss(porApenasFundo, '#064e3b'),
                                      border: porApenasTemBorda ? `${porApenasEspessuraBorda}px solid ${porApenasBorda}` : 'none',
                                      borderRadius: `${porApenasRaioBorda}px`,
                                      color: porApenasTexto,
                                      boxShadow: `0 4px 0 ${porApenasBorda}`,
                                    };
                                  }
                                  return {
                                    ...obterFundoCss(porApenasFundo, '#064e3b'),
                                    border: porApenasTemBorda ? `${porApenasEspessuraBorda}px solid ${porApenasBorda}` : 'none',
                                    borderRadius: `${porApenasRaioBorda}px`,
                                    color: porApenasTexto,
                                  };
                                })();

                                const renderTextoSolto = () => {
                                  if (!temTexto) return null;
                                  return (
                                    <span style={{ fontSize: `${porApenasTamanhoTexto}px`, color: porApenasTexto }} className="font-bold tracking-tight inline-block opacity-90">
                                      {textoPorApenas}
                                    </span>
                                  );
                                };

                                const renderValorSolto = () => (
                                  <span style={{ fontSize: `${porApenasTamanhoValor}px`, color: porApenasTexto }} className="font-mono font-black tracking-tight inline-block">
                                    R$ 0,50
                                  </span>
                                );

                                const renderValorBotao = () => (
                                  <div style={{ ...styleBotaoObj, fontSize: `${porApenasTamanhoValor}px` }} className="px-4 py-1.5 font-black shadow-sm font-mono tracking-tight inline-flex items-center justify-center">
                                    R$ 0,50
                                  </div>
                                );

                                const renderConteudo = (tipo: 'solto' | 'valor_botao') => {
                                  const renderVal = tipo === 'solto' ? renderValorSolto() : renderValorBotao();
                                  const renderTxt = renderTextoSolto();
                                  if (layout === 'horizontal') {
                                    return (
                                      <div className={`flex flex-row flex-wrap items-center gap-2.5 ${justifyFlexClass}`}>
                                        {renderTxt}
                                        {renderVal}
                                      </div>
                                    );
                                  }
                                  if (layout === 'inverso') {
                                    return (
                                      <div className={`flex flex-col gap-1 ${alignWrapperClass}`}>
                                        {renderVal}
                                        {renderTxt}
                                      </div>
                                    );
                                  }
                                  return (
                                    <div className={`flex flex-col gap-1 ${alignWrapperClass}`}>
                                      {renderTxt}
                                      {renderVal}
                                    </div>
                                  );
                                };

                                if (estiloContainer === 'apenas_texto_preco') {
                                  return <div className={`w-full flex ${justifyFlexClass}`}>{renderConteudo('solto')}</div>;
                                }
                                if (estiloContainer === 'texto_e_botao') {
                                  return <div className={`w-full flex ${justifyFlexClass}`}>{renderConteudo('valor_botao')}</div>;
                                }
                                if (estiloContainer === 'botao_unico') {
                                  return (
                                    <div className={`w-full flex ${justifyFlexClass}`}>
                                      <div style={styleBotaoObj} className="px-5 py-2.5 shadow-md inline-flex items-center justify-center">
                                        {layout === 'horizontal' ? (
                                          <div className="flex flex-row flex-wrap items-center gap-2">
                                            {temTexto && <span style={{ fontSize: `${porApenasTamanhoTexto}px` }} className="font-bold opacity-90">{textoPorApenas}</span>}
                                            <span style={{ fontSize: `${porApenasTamanhoValor}px` }} className="font-mono font-black">R$ 0,50</span>
                                          </div>
                                        ) : layout === 'inverso' ? (
                                          <div className="flex flex-col items-center gap-0.5">
                                            <span style={{ fontSize: `${porApenasTamanhoValor}px` }} className="font-mono font-black">R$ 0,50</span>
                                            {temTexto && <span style={{ fontSize: `${porApenasTamanhoTexto}px` }} className="font-bold opacity-90">{textoPorApenas}</span>}
                                          </div>
                                        ) : (
                                          <div className="flex flex-col items-center gap-0.5">
                                            {temTexto && <span style={{ fontSize: `${porApenasTamanhoTexto}px` }} className="font-bold opacity-90">{textoPorApenas}</span>}
                                            <span style={{ fontSize: `${porApenasTamanhoValor}px` }} className="font-mono font-black">R$ 0,50</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                                return (
                                  <div 
                                    style={{
                                      backgroundColor: '#090d16',
                                      border: porApenasTemBorda ? `${porApenasEspessuraBorda}px solid ${porApenasBorda}` : 'none',
                                      borderRadius: `${porApenasRaioBorda}px`,
                                    }}
                                    className="w-full p-4 shadow-sm"
                                  >
                                    <div className={`w-full flex ${justifyFlexClass}`}>
                                      {renderConteudo('valor_botao')}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2. BOTÕES DE PACOTES PROMOCIONAIS */}
                      {subAbaBotao === 'pacotes' && (
                        <div className="space-y-5 animate-in fade-in duration-200">
                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-white flex items-center gap-2">
                              <Package className="w-4 h-4 text-amber-400" />
                              Botões dos Pacotes Promocionais
                            </h4>
                            <p className="text-xs text-slate-400">
                              Personalize os botões das ofertas rápidas e combos de cotas em lote, incluindo cores padrão, destaque e o selo de Popularidade.
                            </p>
                          </div>
                  {/* Textos da Seção */}
                  <SectionTextConfig
                    titulo={temaSeguro.botao.tituloPacotes ?? '⚡ Pacotes Promocionais'}
                    subtitulo={temaSeguro.botao.subtituloPacotes ?? 'Compre em pacotes e garanta super descontos!'}
                    fonteTitulo={temaSeguro.tipografia.fontePacotesTitulo || ''}
                    fonteSubtitulo={temaSeguro.tipografia.fontePacotesSubtitulo || ''}
                    tamanhoTitulo={temaSeguro.tipografia.tamanhoPacotesTitulo ?? 16}
                    tamanhoSubtitulo={temaSeguro.tipografia.tamanhoPacotesSubtitulo ?? 12}
                    alinhamentoTitulo={temaSeguro.tipografia.alinhamentoPacotesTitulo || 'esquerda'}
                    alinhamentoSubtitulo={temaSeguro.tipografia.alinhamentoPacotesSubtitulo || 'esquerda'}
                    onTituloChange={val => atualizarTema({ botao: { ...temaSeguro.botao, tituloPacotes: val } })}
                    onSubtituloChange={val => atualizarTema({ botao: { ...temaSeguro.botao, subtituloPacotes: val } })}
                    onFonteTituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, fontePacotesTitulo: val } })}
                    onFonteSubtituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, fontePacotesSubtitulo: val } })}
                    onTamanhoTituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, tamanhoPacotesTitulo: val } })}
                    onTamanhoSubtituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, tamanhoPacotesSubtitulo: val } })}
                    onAlinhamentoTituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, alinhamentoPacotesTitulo: val } })}
                    onAlinhamentoSubtituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, alinhamentoPacotesSubtitulo: val } })}
                    placeholderTitulo="Deixe em branco para ocultar o título..."
                    placeholderSubtitulo="Deixe em branco para ocultar o subtítulo..."
                  />

                  {/* Seletor de Estilo Visual para Pacotes */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      Efeito Visual dos Botões de Pacotes:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: 'solido', label: 'Sólido', desc: 'Caixas opacas' },
                        { id: 'vidro', label: 'Vidro (Glass)', desc: 'Translúcido com Blur' },
                        { id: 'transparente', label: 'Transparente', desc: 'Bordas finas' },
                        { id: '3d', label: 'Sombra 3D', desc: 'Botões em bloco 3D' },
                      ].map(st => {
                        const isSelected = (temaSeguro.botao.estiloPacotes || 'solido') === st.id;
                        const previewBtn = calcularEstiloBotao({
                          estilo: st.id as TipoEstiloBotao,
                          corFundo: temaSeguro.cores.botaoCotasFundo,
                          corTexto: temaSeguro.cores.botaoCotasTexto,
                          raioBorda: temaSeguro.botao.raioBordaPacotes ?? 12,
                          tamanhoAltura: 8,
                          tamanhoTexto: 11,
                          sombraAltura: temaSeguro.botao.sombraAlturaPacotes ?? 3,
                          corSombra: temaSeguro.botao.corSombraPacotes,
                        });

                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => atualizarTema({ botao: { ...temaSeguro.botao, estiloPacotes: st.id as any } })}
                            className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                              isSelected
                                ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className={`text-xs font-black ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                                {st.label}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                            </div>

                            <div className="w-full py-1 flex items-center justify-center">
                              <div style={previewBtn.style} className={`${previewBtn.className} px-3 py-1 text-[10px] w-full text-center flex-col`}>
                                <span className="font-mono font-black" style={{ color: temaSeguro.cores.botaoCotasNumero }}>+50</span>
                                <span className="text-[9px]" style={{ color: temaSeguro.cores.botaoCotasTexto }}>R$ 10,00</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-500 block truncate">{st.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Prévia Interativa de Pacotes */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Prévia dos Botões de Pacotes Promocionais:
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                      {[
                        { qtd: 10, preco: 'R$ 5,00', destaque: false },
                        { qtd: 25, preco: 'R$ 10,00', destaque: false },
                        { qtd: 50, preco: 'R$ 20,00', destaque: true },
                        { qtd: 100, preco: 'R$ 35,00', destaque: false },
                        { qtd: 250, preco: 'R$ 80,00', destaque: false },
                        { qtd: 500, preco: 'R$ 150,00', destaque: false },
                      ].map((pkg, idx) => {
                        const isDestaque = pkg.destaque;
                        const styleObj = calcularEstiloBotao({
                          estilo: temaSeguro.botao.estiloPacotes || 'solido',
                          corFundo: isDestaque ? temaSeguro.cores.botaoDestaqueFundo : temaSeguro.cores.botaoCotasFundo,
                          corTexto: isDestaque ? temaSeguro.cores.botaoDestaqueTexto : temaSeguro.cores.botaoCotasTexto,
                          corBorda: temaSeguro.cores.botaoCotasBorda || temaSeguro.cores.cardBorda,
                          raioBorda: temaSeguro.botao.raioBordaPacotes ?? 12,
                          tamanhoAltura: temaSeguro.botao.tamanhoAlturaPacotes ?? 12,
                          sombraAltura: temaSeguro.botao.sombraAlturaPacotes ?? 3,
                          corSombra: temaSeguro.botao.corSombraPacotes,
                        });

                        return (
                          <div
                            key={idx}
                            style={styleObj.style}
                            className={`${styleObj.className} flex-col py-2.5 px-1 relative cursor-pointer active:scale-95`}
                          >
                            {isDestaque && (
                              <span 
                                style={{
                                  backgroundColor: temaSeguro.cores.seloPopularFundo,
                                  color: temaSeguro.cores.seloPopularTexto
                                }}
                                className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 font-black text-[7px] uppercase rounded shadow whitespace-nowrap"
                              >
                                Popular
                              </span>
                            )}
                            <span className="text-xs font-black" style={{ color: isDestaque ? temaSeguro.cores.botaoDestaqueTexto : temaSeguro.cores.botaoCotasNumero }}>
                              +{pkg.qtd}
                            </span>
                            <span className="text-[10px] font-bold" style={{ color: isDestaque ? temaSeguro.cores.botaoDestaqueTexto : temaSeguro.cores.botaoCotasTexto }}>
                              {pkg.preco}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cores Específicas dos Botões de Pacotes Padrão */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-300 block">Cores e Degradê dos Pacotes Padrão:</label>
                    
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                      <SeletorCorOuDegrade
                        label="Fundo do Pacote Padrão"
                        valor={temaSeguro.cores.botaoCotasFundo}
                        onChange={novo => atualizarTema({ cores: { ...temaSeguro.cores, botaoCotasFundo: novo } })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Número (+10, +50)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={temaSeguro.cores.botaoCotasNumero?.startsWith('#') ? temaSeguro.cores.botaoCotasNumero : '#10b981'}
                            onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, botaoCotasNumero: e.target.value } })}
                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                          />
                          <input
                            type="text"
                            value={temaSeguro.cores.botaoCotasNumero}
                            onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, botaoCotasNumero: e.target.value } })}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Texto do Valor (R$)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={temaSeguro.cores.botaoCotasTexto?.startsWith('#') ? temaSeguro.cores.botaoCotasTexto : '#94a3b8'}
                            onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, botaoCotasTexto: e.target.value } })}
                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                          />
                          <input
                            type="text"
                            value={temaSeguro.cores.botaoCotasTexto}
                            onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, botaoCotasTexto: e.target.value } })}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cores do Pacote Destaque / Mais Popular */}
                  <div className="p-4 bg-slate-950/90 border border-amber-500/30 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                        Cores do Pacote "Mais Popular" (Destaque):
                      </label>
                      <span className="text-[10px] text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded font-mono font-bold">
                        Personalizado
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                      <SeletorCorOuDegrade
                        label="Fundo do Botão Destaque"
                        valor={temaSeguro.cores.botaoDestaqueFundo}
                        onChange={novo => atualizarTema({ cores: { ...temaSeguro.cores, botaoDestaqueFundo: novo } })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 block">Texto do Botão Destaque</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={temaSeguro.cores.botaoDestaqueTexto?.startsWith('#') ? temaSeguro.cores.botaoDestaqueTexto : '#ffffff'}
                            onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, botaoDestaqueTexto: e.target.value } })}
                            className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0"
                          />
                          <input
                            type="text"
                            value={temaSeguro.cores.botaoDestaqueTexto}
                            onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, botaoDestaqueTexto: e.target.value } })}
                            className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 block">Fundo do Selo "Mais Popular"</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={temaSeguro.cores.seloPopularFundo?.startsWith('#') ? temaSeguro.cores.seloPopularFundo : '#f59e0b'}
                            onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, seloPopularFundo: e.target.value } })}
                            className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0"
                          />
                          <input
                            type="text"
                            value={temaSeguro.cores.seloPopularFundo}
                            onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, seloPopularFundo: e.target.value } })}
                            className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 block">Texto do Selo "Mais Popular"</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={temaSeguro.cores.seloPopularTexto?.startsWith('#') ? temaSeguro.cores.seloPopularTexto : '#000000'}
                            onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, seloPopularTexto: e.target.value } })}
                            className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0"
                          />
                          <input
                            type="text"
                            value={temaSeguro.cores.seloPopularTexto}
                            onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, seloPopularTexto: e.target.value } })}
                            className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Arredondamento, Borda e Sombras dos Pacotes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Borda dos Pacotes</label>
                        <button
                          type="button"
                          onClick={() => atualizarTema({ botao: { ...temaSeguro.botao, possuirBordaPacotes: !temaSeguro.botao.possuirBordaPacotes } })}
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                            temaSeguro.botao.possuirBordaPacotes
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {temaSeguro.botao.possuirBordaPacotes ? 'Ativa' : 'Desativada'}
                        </button>
                      </div>

                      {temaSeguro.botao.possuirBordaPacotes && (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={temaSeguro.botao.corBordaPacotes?.startsWith('#') ? temaSeguro.botao.corBordaPacotes : '#334155'}
                              onChange={e => atualizarTema({ 
                                botao: { ...temaSeguro.botao, corBordaPacotes: e.target.value },
                                cores: { ...temaSeguro.cores, botaoCotasBorda: e.target.value }
                              })}
                              className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0"
                            />
                            <input
                              type="text"
                              value={temaSeguro.botao.corBordaPacotes || temaSeguro.cores.botaoCotasBorda || ''}
                              onChange={e => atualizarTema({ 
                                botao: { ...temaSeguro.botao, corBordaPacotes: e.target.value },
                                cores: { ...temaSeguro.cores, botaoCotasBorda: e.target.value }
                              })}
                              placeholder="#334155"
                              className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                            />
                          </div>
                          <div className="flex justify-between items-center text-[10px] pt-1">
                            <span className="text-slate-400">Espessura:</span>
                            <span className="font-mono text-emerald-400 font-bold">{temaSeguro.botao.larguraBordaPacotes ?? 1}px</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="8"
                            value={temaSeguro.botao.larguraBordaPacotes ?? 1}
                            onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, larguraBordaPacotes: Number(e.target.value) } })}
                            className="w-full accent-emerald-500 bg-slate-900 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-300">Arredondamento dos Pacotes</span>
                        <span className="font-mono text-emerald-400 font-bold">{temaSeguro.botao.raioBordaPacotes ?? 12}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="24"
                        value={temaSeguro.botao.raioBordaPacotes ?? 12}
                        onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, raioBordaPacotes: Number(e.target.value) } })}
                        className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-300">Altura / Espaçamento dos Pacotes</span>
                        <span className="font-mono text-emerald-400 font-bold">{temaSeguro.botao.tamanhoAlturaPacotes ?? 12}px</span>
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="20"
                        value={temaSeguro.botao.tamanhoAlturaPacotes ?? 12}
                        onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, tamanhoAlturaPacotes: Number(e.target.value) } })}
                        className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-300">Tamanho da Fonte dos Pacotes</span>
                        <span className="font-mono text-emerald-400 font-bold">{temaSeguro.botao.tamanhoTextoPacotes ?? 12}px</span>
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="24"
                        value={temaSeguro.botao.tamanhoTextoPacotes ?? 12}
                        onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, tamanhoTextoPacotes: Number(e.target.value) } })}
                        className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Quantidade de Colunas de Pacotes (Mobile e Desktop) */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 pt-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-white uppercase tracking-wider block">
                        Disposição dos Pacotes (Quantidade por Linha):
                      </label>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono font-bold">
                        1, 2, 3 ou 4 Colunas
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Colunas no Celular */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-300 block">
                          No Celular (Mobile):
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[1, 2, 3, 4].map(num => {
                            const isSelected = (temaSeguro.botao.colunasPacotesMobile ?? 2) === num;
                            return (
                              <button
                                key={num}
                                type="button"
                                onClick={() => atualizarTema({ botao: { ...temaSeguro.botao, colunasPacotesMobile: num as any } })}
                                className={`py-2 px-1 text-center rounded-lg text-xs font-black transition border ${
                                  isSelected
                                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                {num} {num === 1 ? 'col' : 'cols'}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Colunas no Desktop */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-300 block">
                          No Computador (Desktop):
                        </label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[1, 2, 3, 4, 6].map(num => {
                            const isSelected = (temaSeguro.botao.colunasPacotesDesktop ?? 4) === num;
                            return (
                              <button
                                key={num}
                                type="button"
                                onClick={() => atualizarTema({ botao: { ...temaSeguro.botao, colunasPacotesDesktop: num as any } })}
                                className={`py-2 px-1 text-center rounded-lg text-xs font-black transition border ${
                                  isSelected
                                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                {num} {num === 1 ? 'col' : 'cols'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Personalização do Card de Regra de Desconto / Regras de Evento */}
                  <div className="p-4 bg-slate-950/90 border border-emerald-500/30 rounded-2xl space-y-4 pt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-black text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-emerald-400" />
                          Card da Regra de Desconto / Desconto Progressivo:
                        </label>
                        <p className="text-[10px] text-slate-400">
                          Personalize o aviso de desconto progressivo (ex: "A partir de R$ X cada cota sai por R$ Y") ativado na campanha.
                        </p>
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono font-bold">
                        Regra de Evento
                      </span>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-slate-800">
                      {/* Modelo de Texto da Regra */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-300 block">Modelo do Texto da Regra:</label>

                        {/* Botão de Definir Modelo no local exato onde o texto fica */}
                        <button
                          type="button"
                          onClick={() => setPainelModelosRegraAberto(!painelModelosRegraAberto)}
                          className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-xl p-2.5 text-left transition flex items-center justify-between gap-2 cursor-pointer shadow-sm group"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:scale-105 transition shrink-0">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                                {(() => {
                                  const val = temaSeguro.cotasConfig?.regraDescontoTextoModelo || '';
                                  const preset = MODELOS_PRONTOS_REGRA.find(m => m.modelo && m.modelo === val);
                                  return preset ? `Modelo: ${preset.label}` : '✏️ Modelo Personalizado';
                                })()}
                              </span>
                              <span className="text-xs text-white truncate font-mono">
                                {temaSeguro.cotasConfig?.regraDescontoTextoModelo || 'A partir de {valor} cada cota fica por {desconto}'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded-lg group-hover:text-emerald-400 transition">
                              {painelModelosRegraAberto ? 'Fechar Opções' : 'Selecionar Modelos'}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${painelModelosRegraAberto ? 'rotate-180 text-emerald-400' : ''}`} />
                          </div>
                        </button>

                        {/* Painel de Opções: 5 Modelos Prontos + 1 Personalizado */}
                        {painelModelosRegraAberto && (
                          <div className="p-3 bg-slate-900 border border-emerald-500/30 rounded-xl space-y-2 animate-in fade-in shadow-xl">
                            <span className="text-[10px] font-bold text-emerald-400 block uppercase tracking-wider">
                              Clique em um modelo para escolher ou selecione Personalizado:
                            </span>
                            <div className="grid grid-cols-1 gap-1.5">
                              {MODELOS_PRONTOS_REGRA.map(m => {
                                const textoAtual = temaSeguro.cotasConfig?.regraDescontoTextoModelo || '';
                                const isPresetMatch = Boolean(m.modelo && textoAtual === m.modelo);
                                const isCustomMatch = m.id === 'custom' && (!m.modelo || !MODELOS_PRONTOS_REGRA.some(p => p.modelo && p.modelo === textoAtual) || modoCustomRegra);
                                const isSelected = isPresetMatch || isCustomMatch;

                                return (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => {
                                      if (m.id === 'custom') {
                                        setModoCustomRegra(true);
                                        setPainelModelosRegraAberto(false);
                                      } else if (m.modelo) {
                                        setModoCustomRegra(false);
                                        atualizarTema({
                                          cotasConfig: {
                                            ...temaSeguro.cotasConfig,
                                            regraDescontoTextoModelo: m.modelo
                                          }
                                        });
                                        setPainelModelosRegraAberto(false);
                                      }
                                    }}
                                    className={`p-2.5 rounded-lg border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                                      isSelected
                                        ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold shadow-sm'
                                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                                    }`}
                                  >
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[11px] font-black text-emerald-400">{m.label}</span>
                                      <span className="text-[11px] font-mono text-slate-300 truncate">
                                        {m.modelo || 'Permite que você mesmo digite qualquer texto de regra customizado.'}
                                      </span>
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Campo de Texto para Personalizado */}
                        {(modoCustomRegra || !MODELOS_PRONTOS_REGRA.some(m => m.modelo && m.modelo === (temaSeguro.cotasConfig?.regraDescontoTextoModelo || ''))) && (
                          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5 animate-in fade-in">
                            <label className="text-[10.5px] font-bold text-emerald-400 flex items-center gap-1 block">
                              ✏️ Digite o seu texto personalizado da regra:
                            </label>
                            <input
                              type="text"
                              value={temaSeguro.cotasConfig?.regraDescontoTextoModelo || ''}
                              onChange={e => {
                                setModoCustomRegra(true);
                                atualizarTema({
                                  cotasConfig: {
                                    ...temaSeguro.cotasConfig,
                                    regraDescontoTextoModelo: e.target.value
                                  }
                                });
                              }}
                              placeholder="Ex: A partir de {valor} cada cota fica por {desconto}"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                            />
                          </div>
                        )}

                        <p className="text-[9.5px] text-slate-400">
                          Use <code className="text-emerald-400 font-bold">&#123;valor&#125;</code> para o valor total mínimo e <code className="text-emerald-400 font-bold">&#123;desconto&#125;</code> para o valor com desconto.
                        </p>
                      </div>

                      {/* Escolher a Fonte e Tamanho da Fonte (Logo abaixo do Modelo de Texto) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block">Fonte do Texto da Regra:</label>
                          <SeletorFonteCard
                            valor={temaSeguro.cotasConfig?.regraDescontoFonte || ''}
                            onChange={val => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, regraDescontoFonte: val } })}
                          />
                        </div>

                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-slate-400">Tamanho da Fonte:</span>
                            <span className="font-mono text-emerald-400 font-bold">
                              {temaSeguro.cotasConfig?.regraDescontoTamanhoTexto ?? temaSeguro.cotasConfig?.regraDescontoTamanhoFonte ?? 12}px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="28"
                            value={temaSeguro.cotasConfig?.regraDescontoTamanhoTexto ?? temaSeguro.cotasConfig?.regraDescontoTamanhoFonte ?? 12}
                            onChange={e => {
                              const val = Number(e.target.value);
                              atualizarTema({
                                cotasConfig: {
                                  ...temaSeguro.cotasConfig,
                                  regraDescontoTamanhoTexto: val,
                                  regraDescontoTamanhoFonte: val
                                }
                              });
                            }}
                            className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Alinhamento na Página (Mais abaixo) */}
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                        <SeletorAlinhamento
                          label="Alinhamento do Card na Página:"
                          valor={temaSeguro.cotasConfig?.regraDescontoAlinhamento || 'centro'}
                          onChange={val => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, regraDescontoAlinhamento: val } })}
                        />
                      </div>

                      {/* Estilo Visual do Card com Exemplo Visual Real */}
                      <div className="space-y-2 pt-1">
                        <label className="text-[11px] font-bold text-slate-300 block">Estilo Visual do Card (Exemplo Real):</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            { id: 'badge', label: 'Selo / Badge', desc: 'Sutil e arredondado' },
                            { id: 'solido', label: 'Sólido', desc: 'Preenchimento nítido' },
                            { id: 'vidro', label: 'Vidro (Glass)', desc: 'Translúcido com brilho' },
                            { id: 'transparente', label: 'Transparente', desc: 'Apenas texto e borda' },
                            { id: '3d', label: '3D Relevo', desc: 'Elevado com sombra' },
                            { id: 'gradiente', label: 'Gradiente', desc: 'Degradê de cores' },
                          ].map(st => {
                            const isSelected = (temaSeguro.cotasConfig?.regraDescontoEstilo || 'badge') === st.id;
                            const IconComponent = getSectionIcon(temaSeguro.cotasConfig?.regraDescontoIcone || 'Zap', Zap) || Zap;

                            return (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, regraDescontoEstilo: st.id as any } })}
                                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/40 shadow'
                                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className={`text-[11px] font-black ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                                    {st.label}
                                  </span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                                </div>

                                {/* Exemplo Visual do Card no Estilo */}
                                <div className="w-full flex items-center justify-center p-2 bg-slate-950/80 rounded-lg border border-slate-800/80">
                                  {st.id === 'badge' && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold shadow-sm">
                                      {(temaSeguro.cotasConfig?.regraDescontoMostrarIcone ?? true) && <IconComponent className="w-3 h-3 text-emerald-400" />}
                                      <span>A partir de <strong className="text-white">R$ 50</strong> → <strong className="text-emerald-400 font-mono">R$ 0,10</strong></span>
                                    </div>
                                  )}
                                  {st.id === 'solido' && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-extrabold shadow">
                                      {(temaSeguro.cotasConfig?.regraDescontoMostrarIcone ?? true) && <IconComponent className="w-3 h-3 text-emerald-200" />}
                                      <span>A partir de R$ 50 → R$ 0,10</span>
                                    </div>
                                  )}
                                  {st.id === 'vidro' && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 backdrop-blur-md border border-emerald-400/50 text-emerald-200 text-[10px] font-bold shadow">
                                      {(temaSeguro.cotasConfig?.regraDescontoMostrarIcone ?? true) && <IconComponent className="w-3 h-3 text-emerald-300" />}
                                      <span>A partir de <strong className="text-white">R$ 50</strong> → <strong className="text-emerald-300 font-mono">R$ 0,10</strong></span>
                                    </div>
                                  )}
                                  {st.id === 'transparente' && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-transparent border-2 border-emerald-400 text-emerald-400 text-[10px] font-black">
                                      {(temaSeguro.cotasConfig?.regraDescontoMostrarIcone ?? true) && <IconComponent className="w-3 h-3 text-emerald-400" />}
                                      <span>A partir de R$ 50 → R$ 0,10</span>
                                    </div>
                                  )}
                                  {st.id === '3d' && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold shadow-[0_3px_0_#047857]">
                                      {(temaSeguro.cotasConfig?.regraDescontoMostrarIcone ?? true) && <IconComponent className="w-3 h-3 text-emerald-200" />}
                                      <span>A partir de R$ 50 → R$ 0,10</span>
                                    </div>
                                  )}
                                  {st.id === 'gradiente' && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 text-white text-[10px] font-black shadow">
                                      {(temaSeguro.cotasConfig?.regraDescontoMostrarIcone ?? true) && <IconComponent className="w-3 h-3 text-yellow-300" />}
                                      <span>A partir de R$ 50 → R$ 0,10</span>
                                    </div>
                                  )}
                                </div>

                                <span className="text-[9px] text-slate-400 block truncate">{st.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Cores: Fundo, Texto, Destaque */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                          <SeletorCorOuDegrade
                            label="Cor de Fundo / Degradê"
                            valor={temaSeguro.cotasConfig?.regraDescontoFundo || 'rgba(16, 185, 129, 0.1)'}
                            onChange={novo => atualizarTema({
                              cotasConfig: {
                                ...temaSeguro.cotasConfig,
                                regraDescontoFundo: novo
                              }
                            })}
                          />
                        </div>

                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 block">Cor do Texto Normal</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={converterParaHex(temaSeguro.cotasConfig?.regraDescontoTexto || temaSeguro.cotasConfig?.regraDescontoTextoCor, '#34d399')}
                              onChange={e => atualizarTema({
                                cotasConfig: {
                                  ...temaSeguro.cotasConfig,
                                  regraDescontoTexto: e.target.value,
                                  regraDescontoTextoCor: e.target.value
                                }
                              })}
                              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                            />
                            <input
                              type="text"
                              value={temaSeguro.cotasConfig?.regraDescontoTexto || temaSeguro.cotasConfig?.regraDescontoTextoCor || '#34d399'}
                              onChange={e => atualizarTema({
                                cotasConfig: {
                                  ...temaSeguro.cotasConfig,
                                  regraDescontoTexto: e.target.value,
                                  regraDescontoTextoCor: e.target.value
                                }
                              })}
                              className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 block">Cor do Destaque (Valores)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={converterParaHex(temaSeguro.cotasConfig?.regraDescontoDestaque || temaSeguro.cotasConfig?.regraDescontoDestaqueCor, '#10b981')}
                              onChange={e => atualizarTema({
                                cotasConfig: {
                                  ...temaSeguro.cotasConfig,
                                  regraDescontoDestaque: e.target.value,
                                  regraDescontoDestaqueCor: e.target.value
                                }
                              })}
                              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                            />
                            <input
                              type="text"
                              value={temaSeguro.cotasConfig?.regraDescontoDestaque || temaSeguro.cotasConfig?.regraDescontoDestaqueCor || '#10b981'}
                              onChange={e => atualizarTema({
                                cotasConfig: {
                                  ...temaSeguro.cotasConfig,
                                  regraDescontoDestaque: e.target.value,
                                  regraDescontoDestaqueCor: e.target.value
                                }
                              })}
                              className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Arrastar a barra (Sliders) para Arredondamento, Tamanho do Texto e Espaçamento Interno */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-slate-400">Arredondamento (Raio):</span>
                            <span className="font-mono text-emerald-400 font-bold">
                              {(temaSeguro.cotasConfig?.regraDescontoRaioBorda ?? 9999) === 9999 ? 'Total (Pill)' : `${temaSeguro.cotasConfig?.regraDescontoRaioBorda ?? 12}px`}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="32"
                            value={temaSeguro.cotasConfig?.regraDescontoRaioBorda === 9999 ? 32 : (temaSeguro.cotasConfig?.regraDescontoRaioBorda ?? 12)}
                            onChange={e => {
                              const val = Number(e.target.value);
                              atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, regraDescontoRaioBorda: val === 32 ? 9999 : val } });
                            }}
                            className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
                          />
                        </div>

                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-slate-400">Tamanho do Texto:</span>
                            <span className="font-mono text-emerald-400 font-bold">{temaSeguro.cotasConfig?.regraDescontoTamanhoTexto ?? 12}px</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="28"
                            value={temaSeguro.cotasConfig?.regraDescontoTamanhoTexto ?? 12}
                            onChange={e => {
                              const val = Number(e.target.value);
                              atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, regraDescontoTamanhoTexto: val, regraDescontoTamanhoFonte: val } });
                            }}
                            className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
                          />
                        </div>

                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-slate-400">Espaçamento Interno (Padding):</span>
                            <span className="font-mono text-emerald-400 font-bold">{temaSeguro.cotasConfig?.regraDescontoPaddingY ?? 4}px</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="20"
                            value={temaSeguro.cotasConfig?.regraDescontoPaddingY ?? 4}
                            onChange={e => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, regraDescontoPaddingY: Number(e.target.value) } })}
                            className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Ícone do Card - Definido na Aba de Ícones */}
                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                            {(() => {
                              const CurrentIcon = getSectionIcon(temaSeguro.cotasConfig?.regraDescontoIcone || 'Zap', Zap);
                              return (temaSeguro.cotasConfig?.regraDescontoMostrarIcone ?? true) && CurrentIcon ? (
                                <CurrentIcon className="w-4 h-4" />
                              ) : (
                                <Slash className="w-4 h-4 text-slate-500" />
                              );
                            })()}
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-white block">Ícone do Card de Regras</span>
                            <span className="text-[9.5px] text-slate-400 block">
                              {(temaSeguro.cotasConfig?.regraDescontoMostrarIcone ?? true)
                                ? `Ícone Atual: ${temaSeguro.cotasConfig?.regraDescontoIcone || 'Zap'} (20 opções na Aba de Ícones)`
                                : 'Sem Ícone (Oculto)'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const mostrar = !(temaSeguro.cotasConfig?.regraDescontoMostrarIcone ?? true);
                              atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, regraDescontoMostrarIcone: mostrar } });
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition border ${
                              (temaSeguro.cotasConfig?.regraDescontoMostrarIcone ?? true)
                                ? 'bg-slate-800 text-slate-300 border-slate-700'
                                : 'bg-red-500/10 text-red-400 border-red-500/30'
                            }`}
                          >
                            {(temaSeguro.cotasConfig?.regraDescontoMostrarIcone ?? true) ? 'Ocultar' : 'Exibir'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSecaoEditor('geral');
                              setSubAbaGeral('icones');
                              setSecaoIconeAberta('regraDesconto');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold hover:bg-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Aba de Ícones (20 Opções)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

                      {/* 3. CONTROLES DE QUANTIDADE (+ / -) */}
                      {subAbaBotao === 'controles' && (
                        <div className="space-y-5 animate-in fade-in duration-200">
                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-white flex items-center gap-2">
                              <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                              Controles de Quantidade (+ / -)
                            </h4>
                            <p className="text-xs text-slate-400">
                              Altere o efeito visual, arredondamento e as cores dos botões de incrementar e decrementar a quantidade de cotas.
                            </p>
                          </div>

                  {/* Textos da Seção */}
                  <SectionTextConfig
                    titulo={temaSeguro.botao.tituloControles ?? 'Selecione a quantidade manualmente'}
                    subtitulo={temaSeguro.botao.subtituloControles ?? 'Use os botões + e - ou digite o valor'}
                    fonteTitulo={temaSeguro.tipografia.fonteControlesTitulo || ''}
                    fonteSubtitulo={temaSeguro.tipografia.fonteControlesSubtitulo || ''}
                    tamanhoTitulo={temaSeguro.tipografia.tamanhoControlesTitulo ?? 16}
                    tamanhoSubtitulo={temaSeguro.tipografia.tamanhoControlesSubtitulo ?? 12}
                    alinhamentoTitulo={temaSeguro.tipografia.alinhamentoControlesTitulo || 'esquerda'}
                    alinhamentoSubtitulo={temaSeguro.tipografia.alinhamentoControlesSubtitulo || 'esquerda'}
                    onTituloChange={val => atualizarTema({ botao: { ...temaSeguro.botao, tituloControles: val } })}
                    onSubtituloChange={val => atualizarTema({ botao: { ...temaSeguro.botao, subtituloControles: val } })}
                    onFonteTituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, fonteControlesTitulo: val } })}
                    onFonteSubtituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, fonteControlesSubtitulo: val } })}
                    onTamanhoTituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, tamanhoControlesTitulo: val } })}
                    onTamanhoSubtituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, tamanhoControlesSubtitulo: val } })}
                    onAlinhamentoTituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, alinhamentoControlesTitulo: val } })}
                    onAlinhamentoSubtituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, alinhamentoControlesSubtitulo: val } })}
                    placeholderTitulo="Deixe em branco para ocultar o título..."
                    placeholderSubtitulo="Deixe em branco para ocultar o subtítulo..."
                  />

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      Efeito Visual dos Botões de Diminuir (-) e Aumentar (+):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: 'solido', label: 'Sólido', desc: 'Preenchimento sólido' },
                        { id: 'vidro', label: 'Vidro (Glass)', desc: 'Translúcido' },
                        { id: 'transparente', label: 'Transparente', desc: 'Borda nítida' },
                        { id: '3d', label: 'Sombra 3D', desc: 'Botão pulsante' },
                      ].map(st => {
                        const isSelected = (temaSeguro.botao.estiloControles || 'solido') === st.id;
                        const previewBtn = calcularEstiloBotao({
                          estilo: st.id as TipoEstiloBotao,
                          corFundo: temaSeguro.cores.controlesFundo,
                          corTexto: temaSeguro.cores.controlesTexto,
                          raioBorda: temaSeguro.botao.raioBordaControles ?? 12,
                          tamanhoAltura: 8,
                          tamanhoTexto: 14,
                          sombraAltura: temaSeguro.botao.sombraAlturaControles ?? 3,
                          corSombra: temaSeguro.botao.corSombraControles,
                        });

                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => atualizarTema({ botao: { ...temaSeguro.botao, estiloControles: st.id as any } })}
                            className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                              isSelected
                                ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className={`text-xs font-black ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                                {st.label}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                            </div>

                            <div className="w-full py-1 flex items-center justify-center gap-2">
                              <div style={previewBtn.style} className={`${previewBtn.className} w-7 h-7 p-0`}>-</div>
                              <div style={previewBtn.style} className={`${previewBtn.className} w-7 h-7 p-0`}>+</div>
                            </div>
                            <span className="text-[10px] text-slate-500 block truncate">{st.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Arredondamento e Tamanho dos Controles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-slate-300">Altura dos Botões</label>
                        <span className="text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                          {temaSeguro.botao.tamanhoControles ?? 44}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="32"
                        max="64"
                        value={temaSeguro.botao.tamanhoControles ?? 44}
                        onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, tamanhoControles: Number(e.target.value) } })}
                        className="w-full accent-emerald-500 bg-slate-900"
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-slate-300">Arredondamento das Bordas</label>
                        <span className="text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                          {temaSeguro.botao.raioBordaControles ?? 12}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={temaSeguro.botao.raioBordaControles ?? 12}
                        onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, raioBordaControles: Number(e.target.value) } })}
                        className="w-full accent-emerald-500 bg-slate-900"
                      />
                    </div>
                  </div>

                  {/* Prévia dos Controles */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Prévia dos Controles Manuais:
                    </label>
                    <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between gap-3 max-w-md mx-auto">
                      {(() => {
                        const styleBtn = calcularEstiloBotao({
                          estilo: temaSeguro.botao.estiloControles || 'solido',
                          corFundo: temaSeguro.cores.controlesFundo,
                          corTexto: temaSeguro.cores.controlesTexto,
                          raioBorda: temaSeguro.botao.raioBordaControles ?? 12,
                          tamanhoAltura: 10,
                          sombraAltura: temaSeguro.botao.sombraAlturaControles ?? 3,
                          corSombra: temaSeguro.botao.corSombraControles,
                        });
                        return (
                          <>
                            <button type="button" style={styleBtn.style} className={`${styleBtn.className} w-11 h-11 p-0 cursor-pointer`}>
                              <Minus className="w-4 h-4" />
                            </button>
                            <div className="flex-1 text-center py-2 px-4 bg-slate-950 border border-slate-800 rounded-xl">
                              <span className="text-base font-mono font-black text-white">50 cotas</span>
                            </div>
                            <button type="button" style={styleBtn.style} className={`${styleBtn.className} w-11 h-11 p-0 cursor-pointer`}>
                              <Plus className="w-4 h-4" />
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Cores e Borda dos Controles */}
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                      <SeletorCorOuDegrade
                        label="Fundo dos Botões + e -"
                        valor={temaSeguro.cores.controlesFundo}
                        onChange={novo => atualizarTema({ cores: { ...temaSeguro.cores, controlesFundo: novo } })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Ícones dos Botões + e -</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={temaSeguro.cores.controlesTexto?.startsWith('#') ? temaSeguro.cores.controlesTexto : '#ffffff'}
                            onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, controlesTexto: e.target.value } })}
                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                          />
                          <input
                            type="text"
                            value={temaSeguro.cores.controlesTexto}
                            onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, controlesTexto: e.target.value } })}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Borda dos Botões + e -</label>
                          <button
                            type="button"
                            onClick={() => atualizarTema({ botao: { ...temaSeguro.botao, possuirBordaControles: !temaSeguro.botao.possuirBordaControles } })}
                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                              temaSeguro.botao.possuirBordaControles
                                ? 'bg-emerald-500 text-slate-950 font-black'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {temaSeguro.botao.possuirBordaControles ? 'Ativa' : 'Desativada'}
                          </button>
                        </div>

                        {temaSeguro.botao.possuirBordaControles && (
                          <div className="space-y-2 pt-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={temaSeguro.botao.corBordaControles?.startsWith('#') ? temaSeguro.botao.corBordaControles : '#334155'}
                                onChange={e => atualizarTema({ 
                                  botao: { ...temaSeguro.botao, corBordaControles: e.target.value },
                                  cores: { ...temaSeguro.cores, controlesBorda: e.target.value }
                                })}
                                className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0"
                              />
                              <input
                                type="text"
                                value={temaSeguro.botao.corBordaControles || (temaSeguro.cores as any).controlesBorda || ''}
                                onChange={e => atualizarTema({ 
                                  botao: { ...temaSeguro.botao, corBordaControles: e.target.value },
                                  cores: { ...temaSeguro.cores, controlesBorda: e.target.value }
                                })}
                                placeholder="#334155"
                                className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                              />
                            </div>
                            <div className="flex justify-between items-center text-[10px] pt-1">
                              <span className="text-slate-400">Espessura:</span>
                              <span className="font-mono text-emerald-400 font-bold">{temaSeguro.botao.larguraBordaControles ?? 1}px</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="8"
                              value={temaSeguro.botao.larguraBordaControles ?? 1}
                              onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, larguraBordaControles: Number(e.target.value) } })}
                              className="w-full accent-emerald-500 bg-slate-900 cursor-pointer"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

                      {/* 4. GRADE DE COTAS MANUAIS */}
                      {subAbaBotao === 'cotas' && (
                        <div className="space-y-5 animate-in fade-in duration-200">
                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-white flex items-center gap-2">
                              <Ticket className="w-4 h-4 text-pink-400" />
                              Grade de Cotas Manuais
                            </h4>
                            <p className="text-xs text-slate-400">
                              Defina o estilo visual, dimensões e cores para cada estado das cotas manuais que os compradores selecionam no grid.
                            </p>
                          </div>

                          {/* Textos da Seção */}
                          <SectionTextConfig
                            titulo={temaSeguro.botao.tituloCotas || ''}
                            subtitulo={temaSeguro.botao.subtituloCotas || ''}
                            fonteTitulo={temaSeguro.tipografia.fonteCotasTitulo || ''}
                            fonteSubtitulo={temaSeguro.tipografia.fonteCotasSubtitulo || ''}
                            alinhamentoTitulo={temaSeguro.tipografia.alinhamentoCotasTitulo || 'esquerda'}
                            alinhamentoSubtitulo={temaSeguro.tipografia.alinhamentoCotasSubtitulo || 'esquerda'}
                            onTituloChange={val => atualizarTema({ botao: { ...temaSeguro.botao, tituloCotas: val } })}
                            onSubtituloChange={val => atualizarTema({ botao: { ...temaSeguro.botao, subtituloCotas: val } })}
                            onFonteTituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, fonteCotasTitulo: val } })}
                            onFonteSubtituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, fonteCotasSubtitulo: val } })}
                            onAlinhamentoTituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, alinhamentoCotasTitulo: val } })}
                            onAlinhamentoSubtituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, alinhamentoCotasSubtitulo: val } })}
                          />

                          {/* Seletor de Efeito Visual */}
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-300 block">
                              Efeito Visual das Cotas na Grade:
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              {[
                                { id: 'solido', label: 'Sólido', desc: 'Quadrados nítidos' },
                                { id: 'vidro', label: 'Vidro (Glass)', desc: 'Translúcido com Blur' },
                                { id: 'transparente', label: 'Transparente', desc: 'Apenas borda fina' },
                                { id: '3d', label: 'Sombra 3D', desc: 'Bloquinhos em relevo' },
                              ].map(st => {
                                const isSelected = (temaSeguro.botao.estiloCotas || 'solido') === st.id;
                                return (
                                  <button
                                    key={st.id}
                                    type="button"
                                    onClick={() => atualizarTema({ botao: { ...temaSeguro.botao, estiloCotas: st.id as any } })}
                                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                                      isSelected
                                        ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span className={`text-xs font-black ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                                        {st.label}
                                      </span>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                                    </div>
                                    <div className="w-full py-1.5 flex items-center justify-center">
                                      <div
                                        className={`w-10 h-8 rounded flex items-center justify-center font-mono font-bold text-[11px] ${
                                          st.id === 'solido'
                                            ? 'bg-emerald-500 text-slate-950'
                                            : st.id === 'vidro'
                                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-sm'
                                              : st.id === 'transparente'
                                                ? 'bg-transparent text-emerald-400 border-2 border-emerald-500'
                                                : 'bg-emerald-500 text-slate-950 shadow-[0_4px_0_#065f46]'
                                        }`}
                                      >
                                        042
                                      </div>
                                    </div>
                                    <span className="text-[10px] text-slate-500 block truncate">{st.desc}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Prévia em Tempo Real dos 4 Estados das Cotas */}
                          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Prévia dos Estados da Cota em Tempo Real
                              </label>
                              <span className="text-[10px] text-slate-500 font-mono">Exemplo Interativo</span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              Veja como cada cota será renderizada na grade conforme o status do bilhete:
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                              {/* 1. Disponível */}
                              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col items-center gap-1.5 text-center">
                                <div
                                  className="w-12 h-10 flex items-center justify-center font-mono font-black text-xs transition-transform hover:scale-105"
                                  style={{
                                    backgroundColor: (temaSeguro.cores as any).cotaDisponivelFundo || temaSeguro.cores.cardFundo || '#0f172a',
                                    color: (temaSeguro.cores as any).cotaDisponivelTexto || temaSeguro.cores.texto || '#ffffff',
                                    borderRadius: `${temaSeguro.botao.raioBordaCotas ?? 8}px`,
                                    border: `${temaSeguro.botao.larguraBordaCotas ?? 1}px solid ${(temaSeguro.cores as any).cotaDisponivelBorda || temaSeguro.cores.cardBorda || '#334155'}`,
                                  }}
                                >
                                  0042
                                </div>
                                <div>
                                  <span className="text-[11px] font-bold text-white block">Disponível</span>
                                  <span className="text-[9px] text-slate-500">Livre p/ compra</span>
                                </div>
                              </div>

                              {/* 2. Selecionada */}
                              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col items-center gap-1.5 text-center">
                                <div
                                  className="w-12 h-10 flex items-center justify-center font-mono font-black text-xs ring-2 ring-emerald-500/50 shadow-md"
                                  style={{
                                    backgroundColor: (temaSeguro.cores as any).cotaSelecionadaFundo || temaSeguro.cores.primaria || '#10b981',
                                    color: (temaSeguro.cores as any).cotaSelecionadaTexto || '#022c22',
                                    borderRadius: `${temaSeguro.botao.raioBordaCotas ?? 8}px`,
                                    border: `${temaSeguro.botao.larguraBordaCotas ?? 1}px solid ${(temaSeguro.cores as any).cotaSelecionadaBorda || temaSeguro.cores.primaria || '#10b981'}`,
                                  }}
                                >
                                  ✓ 0087
                                </div>
                                <div>
                                  <span className="text-[11px] font-bold text-emerald-400 block">Selecionada</span>
                                  <span className="text-[9px] text-slate-500">No carrinho</span>
                                </div>
                              </div>

                              {/* 3. Reservada */}
                              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col items-center gap-1.5 text-center">
                                <div
                                  className="w-12 h-10 flex items-center justify-center font-mono font-black text-xs opacity-80"
                                  style={{
                                    backgroundColor: (temaSeguro.cores as any).cotaReservadaFundo || '#d97706',
                                    color: (temaSeguro.cores as any).cotaReservadaTexto || '#ffffff',
                                    borderRadius: `${temaSeguro.botao.raioBordaCotas ?? 8}px`,
                                    border: `${temaSeguro.botao.larguraBordaCotas ?? 1}px solid ${(temaSeguro.cores as any).cotaReservadaBorda || '#b45309'}`,
                                  }}
                                >
                                  ⏳ 0105
                                </div>
                                <div>
                                  <span className="text-[11px] font-bold text-amber-400 block">Reservada</span>
                                  <span className="text-[9px] text-slate-500">Aguardando Pix</span>
                                </div>
                              </div>

                              {/* 4. Paga / Ganha */}
                              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col items-center gap-1.5 text-center">
                                <div
                                  className="w-12 h-10 flex items-center justify-center font-mono font-black text-xs opacity-60 line-through"
                                  style={{
                                    backgroundColor: (temaSeguro.cores as any).cotaPagaFundo || '#1e293b',
                                    color: (temaSeguro.cores as any).cotaPagaTexto || '#64748b',
                                    borderRadius: `${temaSeguro.botao.raioBordaCotas ?? 8}px`,
                                    border: `${temaSeguro.botao.larguraBordaCotas ?? 1}px solid ${(temaSeguro.cores as any).cotaPagaBorda || '#334155'}`,
                                  }}
                                >
                                  0239
                                </div>
                                <div>
                                  <span className="text-[11px] font-bold text-slate-400 block">Paga / Ocupada</span>
                                  <span className="text-[9px] text-slate-500">Já vendida</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Dimensões & Borda */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-slate-800">
                            <div className="space-y-1.5 p-3 bg-slate-950 border border-slate-800/80 rounded-xl">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-300">Arredondamento</span>
                                <span className="font-mono text-emerald-400 font-bold">{temaSeguro.botao.raioBordaCotas ?? 8}px</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="24"
                                value={temaSeguro.botao.raioBordaCotas ?? 8}
                                onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, raioBordaCotas: Number(e.target.value) } })}
                                className="w-full accent-emerald-500 bg-slate-900 cursor-pointer"
                              />
                            </div>

                            <div className="space-y-1.5 p-3 bg-slate-950 border border-slate-800/80 rounded-xl">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-300">Espessura da Borda</span>
                                <span className="font-mono text-emerald-400 font-bold">{temaSeguro.botao.larguraBordaCotas ?? 1}px</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="4"
                                value={temaSeguro.botao.larguraBordaCotas ?? 1}
                                onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, larguraBordaCotas: Number(e.target.value) } })}
                                className="w-full accent-emerald-500 bg-slate-900 cursor-pointer"
                              />
                            </div>

                            <div className="space-y-1.5 p-3 bg-slate-950 border border-slate-800/80 rounded-xl">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-300">Tamanho da Fonte</span>
                                <span className="font-mono text-emerald-400 font-bold">{temaSeguro.botao.tamanhoTextoCotas ?? 12}px</span>
                              </div>
                              <input
                                type="range"
                                min="10"
                                max="18"
                                value={temaSeguro.botao.tamanhoTextoCotas ?? 12}
                                onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, tamanhoTextoCotas: Number(e.target.value) } })}
                                className="w-full accent-emerald-500 bg-slate-900 cursor-pointer"
                              />
                            </div>
                          </div>

                          {/* Cores Específicas para Cada Estado */}
                          <div className="space-y-4 pt-4 border-t border-slate-800">
                            <div>
                              <h5 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <Palette className="w-3.5 h-3.5 text-emerald-400" /> Cores Individuais por Estado (Grade de Cotas)
                              </h5>
                              <p className="text-[10px] text-slate-400 mt-1">Configure individualmente as cores de fundo, texto e borda para os quatro estados possíveis de uma cota.</p>
                            </div>

                            <div className="space-y-6">
                              {/* 1. DISPONÍVEL */}
                              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl space-y-3">
                                <span className="text-xs font-black text-white block uppercase tracking-wider text-[11px] border-b border-slate-800/80 pb-1">
                                  🟢 Cota Disponível (Livre para Compra)
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  {/* Fundo */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 block">Cor do Fundo</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={converterParaHex((temaSeguro.cores as any).cotaDisponivelFundo, '#0f172a')}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaDisponivelFundo: e.target.value } })}
                                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                      />
                                      <input
                                        type="text"
                                        value={(temaSeguro.cores as any).cotaDisponivelFundo || '#0f172a'}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaDisponivelFundo: e.target.value } })}
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                  {/* Texto */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 block">Cor do Texto</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={converterParaHex((temaSeguro.cores as any).cotaDisponivelTexto, '#ffffff')}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaDisponivelTexto: e.target.value } })}
                                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                      />
                                      <input
                                        type="text"
                                        value={(temaSeguro.cores as any).cotaDisponivelTexto || '#ffffff'}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaDisponivelTexto: e.target.value } })}
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                  {/* Borda */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 block">Cor da Borda</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={converterParaHex((temaSeguro.cores as any).cotaDisponivelBorda, '#334155')}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaDisponivelBorda: e.target.value } })}
                                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                      />
                                      <input
                                        type="text"
                                        value={(temaSeguro.cores as any).cotaDisponivelBorda || '#334155'}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaDisponivelBorda: e.target.value } })}
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 2. SELECIONADA */}
                              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl space-y-3">
                                <span className="text-xs font-black text-white block uppercase tracking-wider text-[11px] border-b border-slate-800/80 pb-1">
                                  🔵 Cota Selecionada (No Carrinho do Usuário)
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  {/* Fundo */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 block">Cor do Fundo</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={converterParaHex((temaSeguro.cores as any).cotaSelecionadaFundo, temaSeguro.cores.primaria || '#10b981')}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaSelecionadaFundo: e.target.value } })}
                                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                      />
                                      <input
                                        type="text"
                                        value={(temaSeguro.cores as any).cotaSelecionadaFundo || temaSeguro.cores.primaria || '#10b981'}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaSelecionadaFundo: e.target.value } })}
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                  {/* Texto */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 block">Cor do Texto</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={converterParaHex((temaSeguro.cores as any).cotaSelecionadaTexto, '#022c22')}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaSelecionadaTexto: e.target.value } })}
                                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                      />
                                      <input
                                        type="text"
                                        value={(temaSeguro.cores as any).cotaSelecionadaTexto || '#022c22'}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaSelecionadaTexto: e.target.value } })}
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                  {/* Borda */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 block">Cor da Borda</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={converterParaHex((temaSeguro.cores as any).cotaSelecionadaBorda, temaSeguro.cores.primaria || '#10b981')}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaSelecionadaBorda: e.target.value } })}
                                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                      />
                                      <input
                                        type="text"
                                        value={(temaSeguro.cores as any).cotaSelecionadaBorda || temaSeguro.cores.primaria || '#10b981'}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaSelecionadaBorda: e.target.value } })}
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 3. RESERVADA */}
                              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl space-y-3">
                                <span className="text-xs font-black text-white block uppercase tracking-wider text-[11px] border-b border-slate-800/80 pb-1">
                                  🟡 Cota Reservada (Aguardando Pagamento/Pix)
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  {/* Fundo */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 block">Cor do Fundo</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={converterParaHex((temaSeguro.cores as any).cotaReservadaFundo, '#d97706')}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaReservadaFundo: e.target.value } })}
                                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                      />
                                      <input
                                        type="text"
                                        value={(temaSeguro.cores as any).cotaReservadaFundo || '#d97706'}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaReservadaFundo: e.target.value } })}
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                  {/* Texto */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 block">Cor do Texto</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={converterParaHex((temaSeguro.cores as any).cotaReservadaTexto, '#ffffff')}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaReservadaTexto: e.target.value } })}
                                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                      />
                                      <input
                                        type="text"
                                        value={(temaSeguro.cores as any).cotaReservadaTexto || '#ffffff'}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaReservadaTexto: e.target.value } })}
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                  {/* Borda */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 block">Cor da Borda</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={converterParaHex((temaSeguro.cores as any).cotaReservadaBorda, '#b45309')}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaReservadaBorda: e.target.value } })}
                                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                      />
                                      <input
                                        type="text"
                                        value={(temaSeguro.cores as any).cotaReservadaBorda || '#b45309'}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaReservadaBorda: e.target.value } })}
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 4. PAGA / OCUPADA */}
                              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl space-y-3">
                                <span className="text-xs font-black text-white block uppercase tracking-wider text-[11px] border-b border-slate-800/80 pb-1">
                                  🔴 Cota Paga / Ocupada (Já Vendida)
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  {/* Fundo */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 block">Cor do Fundo</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={converterParaHex((temaSeguro.cores as any).cotaPagaFundo, '#1e293b')}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaPagaFundo: e.target.value } })}
                                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                      />
                                      <input
                                        type="text"
                                        value={(temaSeguro.cores as any).cotaPagaFundo || '#1e293b'}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaPagaFundo: e.target.value } })}
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                  {/* Texto */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 block">Cor do Texto</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={converterParaHex((temaSeguro.cores as any).cotaPagaTexto, '#64748b')}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaPagaTexto: e.target.value } })}
                                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                      />
                                      <input
                                        type="text"
                                        value={(temaSeguro.cores as any).cotaPagaTexto || '#64748b'}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaPagaTexto: e.target.value } })}
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                  {/* Borda */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 block">Cor da Borda</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={converterParaHex((temaSeguro.cores as any).cotaPagaBorda, '#334155')}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaPagaBorda: e.target.value } })}
                                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                      />
                                      <input
                                        type="text"
                                        value={(temaSeguro.cores as any).cotaPagaBorda || '#334155'}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaPagaBorda: e.target.value } })}
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 4.5. CARD DE PROGRESSO DE VENDAS */}
                      {subAbaBotao === 'progresso' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-white flex items-center gap-2">
                              <Sliders className="w-4 h-4 text-rose-400" />
                              Card de Progresso de Vendas
                            </h4>
                            <p className="text-xs text-slate-400">
                              Personalize textos, dimensões, cantos, bordas, comportamentos e cores da barra de progresso e blocos complementares.
                            </p>
                          </div>

                          {/* Textos, Rótulos e FONTES da Barra (cada texto com sua própria fonte) */}
                          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                            <h5 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                              <Type className="w-3.5 h-3.5 text-emerald-400" /> Textos &amp; Fontes da Barra
                            </h5>
                            <div className="grid grid-cols-1 gap-4 text-xs">
                              {/* Título (Fora / Acima da barra) */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-slate-300 font-bold mb-1">Título (fora, acima da barra)</label>
                                  <input
                                    type="text"
                                    value={temaSeguro.barraProgresso?.titulo ?? 'Progresso do sorteio'}
                                    onChange={e => atualizarTema({ barraProgresso: { ...temaSeguro.barraProgresso, titulo: e.target.value } })}
                                    placeholder="Ex: Progresso do sorteio"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-400 font-bold mb-1">Fonte do título (fora)</label>
                                  <SeletorFonteCard valor={temaSeguro.tipografia.fonteCardProgresso || ''} onChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, fonteCardProgresso: val } })} />
                                </div>
                              </div>
                              {/* Subtítulo */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-slate-300 font-bold mb-1">Subtítulo / Descrição</label>
                                  <input
                                    type="text"
                                    value={temaSeguro.barraProgresso?.subtitulo ?? ''}
                                    onChange={e => atualizarTema({ barraProgresso: { ...temaSeguro.barraProgresso, subtitulo: e.target.value } })}
                                    placeholder="Ex: Acompanhe a arrecadação em tempo real"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-400 font-bold mb-1">Fonte do subtítulo</label>
                                  <SeletorFonteCard valor={temaSeguro.tipografia.fonteCardProgressoSubtitulo || ''} onChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, fonteCardProgressoSubtitulo: val } })} />
                                </div>
                              </div>
                              {/* Alinhamento dos Títulos */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-900">
                                <SeletorAlinhamento
                                  label="Alinhamento do Título:"
                                  valor={temaSeguro.tipografia.alinhamentoProgressoTitulo || 'esquerda'}
                                  onChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, alinhamentoProgressoTitulo: val } })}
                                />
                                <SeletorAlinhamento
                                  label="Alinhamento do Subtítulo:"
                                  valor={temaSeguro.tipografia.alinhamentoProgressoSubtitulo || 'esquerda'}
                                  onChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, alinhamentoProgressoSubtitulo: val } })}
                                />
                              </div>
                              {/* Texto interno (dentro da barra) */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-slate-300 font-bold mb-1">
                                    Texto dentro da barra <span className="text-slate-500 font-normal">(use &#123;pct&#125;)</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={temaSeguro.barraProgresso?.textoInterno ?? '{pct}% vendido'}
                                    onChange={e => atualizarTema({ barraProgresso: { ...temaSeguro.barraProgresso, textoInterno: e.target.value } })}
                                    placeholder="Ex: {pct}% vendido"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-400 font-bold mb-1">Fonte do texto de dentro</label>
                                  <SeletorFonteCard valor={temaSeguro.tipografia.fonteProgressoInterno || ''} onChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, fonteProgressoInterno: val } })} />
                                </div>
                              </div>
                              {/* Rodapé */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-slate-300 font-bold mb-1">
                                    Texto do rodapé <span className="text-slate-500 font-normal">(use &#123;vendidas&#125; e &#123;disponiveis&#125;)</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={temaSeguro.barraProgresso?.rodape ?? ''}
                                    onChange={e => atualizarTema({ barraProgresso: { ...temaSeguro.barraProgresso, rodape: e.target.value } })}
                                    placeholder="Ex: {vendidas} cotas vendidas • {disponiveis} disponíveis"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-400 font-bold mb-1">Fonte do rodapé</label>
                                  <SeletorFonteCard valor={temaSeguro.tipografia.fonteProgressoRodape || ''} onChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, fonteProgressoRodape: val } })} />
                                </div>
                              </div>
                              {/* Tipo de contador */}
                              <div className="sm:max-w-[50%]">
                                <label className="block text-slate-300 font-bold mb-1">Unidade / Tipo de Contador</label>
                                <select
                                  value={temaSeguro.barraProgresso?.mostrarTipo ?? 'porcentagem'}
                                  onChange={e => atualizarTema({ barraProgresso: { ...temaSeguro.barraProgresso, mostrarTipo: e.target.value as any } })}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                                >
                                  <option value="porcentagem">Percentual vendido (%)</option>
                                  <option value="horas">Tempo restante (Horas)</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Seção 2: Estilo & Dimensões */}
                          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                            <h5 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" /> Estilo & Dimensões
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-slate-300 font-bold">Altura da Barra</label>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => atualizarTema({ barraProgresso: { ...temaSeguro.barraProgresso, altura: Math.max(4, (temaSeguro.barraProgresso?.altura ?? 16) - 1) } })}
                                      className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-xs flex items-center justify-center cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min="4"
                                      max="60"
                                      value={temaSeguro.barraProgresso?.altura ?? 16}
                                      onChange={e => atualizarTema({ barraProgresso: { ...temaSeguro.barraProgresso, altura: Math.min(60, Math.max(4, Number(e.target.value) || 4)) } })}
                                      className="w-12 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-center font-mono text-emerald-400 font-bold text-xs focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => atualizarTema({ barraProgresso: { ...temaSeguro.barraProgresso, altura: Math.min(60, (temaSeguro.barraProgresso?.altura ?? 16) + 1) } })}
                                      className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-xs flex items-center justify-center cursor-pointer"
                                    >
                                      +
                                    </button>
                                    <span className="text-slate-500 text-[10px] font-mono">px</span>
                                  </div>
                                </div>
                                <input
                                  type="range"
                                  min={4}
                                  max={50}
                                  value={temaSeguro.barraProgresso?.altura ?? 16}
                                  onPointerDown={e => e.stopPropagation()}
                                  onTouchStart={e => e.stopPropagation()}
                                  onChange={e => atualizarTema({ barraProgresso: { ...temaSeguro.barraProgresso, altura: Number(e.target.value) } })}
                                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-900 rounded-lg"
                                />
                              </div>
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-slate-300 font-bold">Cantos Arredondados</label>
                                  <span className="font-mono text-emerald-400 font-bold">
                                    {temaSeguro.barraProgresso?.raioBorda === 9999 ? 'Total (Pill)' : `${temaSeguro.barraProgresso?.raioBorda ?? 9999}px`}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 mb-1.5">
                                  {[
                                    { id: 9999, label: 'Pill' },
                                    { id: 16, label: '16px' },
                                    { id: 8, label: '8px' },
                                    { id: 0, label: '0px' },
                                  ].map(r => (
                                    <button
                                      key={r.id}
                                      type="button"
                                      onClick={() => atualizarTema({ barraProgresso: { ...temaSeguro.barraProgresso, raioBorda: r.id } })}
                                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition border cursor-pointer ${
                                        (temaSeguro.barraProgresso?.raioBorda ?? 9999) === r.id
                                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                                      }`}
                                    >
                                      {r.label}
                                    </button>
                                  ))}
                                </div>
                                <input
                                  type="range"
                                  min={0}
                                  max={50}
                                  value={(temaSeguro.barraProgresso?.raioBorda ?? 9999) >= 50 ? 50 : (temaSeguro.barraProgresso?.raioBorda ?? 0)}
                                  onPointerDown={e => e.stopPropagation()}
                                  onTouchStart={e => e.stopPropagation()}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    atualizarTema({ barraProgresso: { ...temaSeguro.barraProgresso, raioBorda: val >= 50 ? 9999 : val } });
                                  }}
                                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-900 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-300 font-bold mb-1">Largura Máxima</label>
                                <select
                                  value={temaSeguro.barraProgresso?.larguraMax ?? '100%'}
                                  onChange={e => atualizarTema({ barraProgresso: { ...temaSeguro.barraProgresso, larguraMax: e.target.value } })}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                >
                                  <option value="100%">100% (Largura total)</option>
                                  <option value="90%">90%</option>
                                  <option value="80%">80%</option>
                                  <option value="700px">Max 700px</option>
                                  <option value="500px">Max 500px</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                              <div>
                                <label className="block text-slate-300 font-bold mb-1">Efeito Visual / Estilo:</label>
                                <select
                                  value={temaSeguro.barraProgresso?.estiloProgresso ?? 'solido'}
                                  onChange={e => atualizarTema({ barraProgresso: { ...temaSeguro.barraProgresso, estiloProgresso: e.target.value as any } })}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-medium"
                                >
                                  <option value="solido">Sólido Plano</option>
                                  <option value="vidro">Vidro Translúcido (Glass)</option>
                                  <option value="transparente">Transparente Sutil</option>
                                  <option value="3d">Bloquinho Relevo 3D</option>
                                </select>
                              </div>

                              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-[11px] font-black text-slate-300 uppercase tracking-wider block">Borda da Barra de Progresso</label>
                                  <button
                                    type="button"
                                    onClick={() => atualizarTema({ barraProgresso: { ...temaSeguro.barraProgresso, possuirBorda: !temaSeguro.barraProgresso?.possuirBorda } })}
                                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                                      temaSeguro.barraProgresso?.possuirBorda
                                        ? 'bg-emerald-500 text-slate-950 font-black'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {temaSeguro.barraProgresso?.possuirBorda ? 'Ativa' : 'Desativada'}
                                  </button>
                                </div>
                                {temaSeguro.barraProgresso?.possuirBorda && (
                                  <div className="space-y-2 pt-1">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={temaSeguro.barraProgresso?.corBorda?.startsWith('#') ? temaSeguro.barraProgresso.corBorda : '#1e293b'}
                                        onChange={e => atualizarTema({ barraProgresso: { ...temaSeguro.barraProgresso, corBorda: e.target.value } })}
                                        className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0"
                                      />
                                      <input
                                        type="text"
                                        value={temaSeguro.barraProgresso?.corBorda || '#1e293b'}
                                        onChange={e => atualizarTema({ barraProgresso: { ...temaSeguro.barraProgresso, corBorda: e.target.value } })}
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                                      />
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] pt-1">
                                      <span className="text-slate-400">Espessura:</span>
                                      <span className="font-mono text-emerald-400 font-bold">{temaSeguro.barraProgresso?.larguraBorda ?? 1}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="1"
                                      max="8"
                                      value={temaSeguro.barraProgresso?.larguraBorda ?? 1}
                                      onChange={e => atualizarTema({ barraProgresso: { ...temaSeguro.barraProgresso, larguraBorda: Number(e.target.value) } })}
                                      className="w-full accent-emerald-500 bg-slate-900 cursor-pointer"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Seção 3: Cores do Card de Progresso */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {[
                              { key: 'cardBarraProgressoFundo', label: 'Fundo do Card de Progresso', desc: 'Caixa externa que envolve a barra' },
                              { key: 'barraProgressoFundo', label: 'Trilho Vazio da Barra', desc: 'Fundo do indicador de progresso' },
                              { key: 'barraProgressoPreenchimento', label: 'Preenchimento da Barra', desc: 'Indicação de cotas vendidas' },
                              { key: 'barraProgressoTexto', label: 'Texto do Progresso', desc: 'Cor do texto do rodapé/contador' },
                              { key: 'textoPrecoBarra', label: 'Preço no Card', desc: 'Cor do preço unitário exibido' },
                            ].map(item => {
                              const val = (temaSeguro.cores as any)[item.key] || '#10b981';
                              return (
                                <div key={item.key} className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                                  <div className="space-y-0.5">
                                    <label className="text-xs font-black text-slate-300 block">{item.label}</label>
                                    <span className="text-[10px] text-slate-500 block leading-tight">{item.desc}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={val}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, [item.key]: e.target.value } })}
                                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={val}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, [item.key]: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white uppercase focus:outline-none focus:border-emerald-500"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                          {/* Seção 5: Personalização do Cabeçalho da Promoção (Compre mais barato!) */}
                          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 pt-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <label className="text-xs font-black text-white uppercase tracking-wider block">
                                  Cabeçalho da Promoção (Compre Mais Barato):
                                </label>
                                <p className="text-[10px] text-slate-400">Personalize o texto, cores e dimensões geométricas do aviso promocional acima dos pacotes</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => atualizarTema({ 
                                  cotasConfig: { 
                                    ...temaSeguro.cotasConfig, 
                                    exibirBlocoPromocao: !(temaSeguro.cotasConfig?.exibirBlocoPromocao ?? true) 
                                  } 
                                })}
                                className={`px-2.5 py-1 rounded text-xs font-black uppercase transition ${
                                  (temaSeguro.cotasConfig?.exibirBlocoPromocao ?? true)
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {(temaSeguro.cotasConfig?.exibirBlocoPromocao ?? true) ? 'Visível' : 'Oculto'}
                              </button>
                            </div>

                            {(temaSeguro.cotasConfig?.exibirBlocoPromocao ?? true) && (
                              <div className="space-y-3 pt-2 border-t border-slate-800">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 block">Título do Destaque:</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={temaSeguro.cotasConfig?.promoTituloDestaque || '📢 Promoção'}
                                        onChange={e => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, promoTituloDestaque: e.target.value } })}
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-medium"
                                      />
                                      <input
                                        type="color"
                                        value={temaSeguro.cotasConfig?.promoTituloCor?.startsWith('#') ? temaSeguro.cotasConfig?.promoTituloCor : '#fbbf24'}
                                        onChange={e => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, promoTituloCor: e.target.value } })}
                                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                        title="Cor do Título"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 block">Subtítulo do Destaque:</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={temaSeguro.cotasConfig?.promoSubtituloDestaque || 'Compre mais barato!'}
                                        onChange={e => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, promoSubtituloDestaque: e.target.value } })}
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-medium"
                                      />
                                      <input
                                        type="color"
                                        value={temaSeguro.cotasConfig?.promoSubtituloCor?.startsWith('#') ? temaSeguro.cotasConfig?.promoSubtituloCor : '#ffffff'}
                                        onChange={e => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, promoSubtituloCor: e.target.value } })}
                                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                        title="Cor do Subtítulo"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 block">Tamanho da Fonte do Título ({temaSeguro.cotasConfig?.promoTituloTamanho || 14}px):</label>
                                    <input
                                      type="range"
                                      min="10"
                                      max="32"
                                      value={temaSeguro.cotasConfig?.promoTituloTamanho || 14}
                                      onChange={e => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, promoTituloTamanho: parseInt(e.target.value) } })}
                                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 block">Tamanho da Fonte do Subtítulo ({temaSeguro.cotasConfig?.promoSubtituloTamanho || 12}px):</label>
                                    <input
                                      type="range"
                                      min="10"
                                      max="32"
                                      value={temaSeguro.cotasConfig?.promoSubtituloTamanho || 12}
                                      onChange={e => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, promoSubtituloTamanho: parseInt(e.target.value) } })}
                                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center text-[10px]">
                                      <label className="font-bold text-slate-400">Arredondamento das Bordas:</label>
                                      <span className="font-mono text-emerald-400 font-bold">{temaSeguro.cotasConfig?.promoRaioBorda ?? 12}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0"
                                      max="32"
                                      value={temaSeguro.cotasConfig?.promoRaioBorda ?? 12}
                                      onChange={e => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, promoRaioBorda: Number(e.target.value) } })}
                                      className="w-full accent-emerald-500 bg-slate-900 cursor-pointer"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center text-[10px]">
                                      <label className="font-bold text-slate-400">Altura / Padding Interno:</label>
                                      <span className="font-mono text-emerald-400 font-bold">{temaSeguro.cotasConfig?.promoAltura ?? 12}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="6"
                                      max="24"
                                      value={temaSeguro.cotasConfig?.promoAltura ?? 12}
                                      onChange={e => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, promoAltura: Number(e.target.value) } })}
                                      className="w-full accent-emerald-500 bg-slate-900 cursor-pointer"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 block">Fundo do Cabeçalho da Promoção:</label>
                                    <SeletorCorOuDegrade
                                      label=""
                                      valor={temaSeguro.cotasConfig?.promoBlocoFundo || '#0f172a'}
                                      onChange={novo => atualizarTema({
                                        cotasConfig: {
                                          ...temaSeguro.cotasConfig,
                                          promoBlocoFundo: novo
                                        }
                                      })}
                                      permitirDegrade={true}
                                    />
                                  </div>

                                  <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[11px] font-black text-slate-300 uppercase tracking-wider block">Borda do Cabeçalho</label>
                                      <button
                                        type="button"
                                        onClick={() => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, promoPossuirBorda: !temaSeguro.cotasConfig?.promoPossuirBorda } })}
                                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition ${
                                          temaSeguro.cotasConfig?.promoPossuirBorda
                                            ? 'bg-emerald-500 text-slate-950 font-black'
                                            : 'bg-slate-800 text-slate-400'
                                        }`}
                                      >
                                        {temaSeguro.cotasConfig?.promoPossuirBorda ? 'Ativa' : 'Desativada'}
                                      </button>
                                    </div>
                                    {temaSeguro.cotasConfig?.promoPossuirBorda && (
                                      <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="color"
                                            value={temaSeguro.cotasConfig?.promoCorBorda?.startsWith('#') ? temaSeguro.cotasConfig.promoCorBorda : '#334155'}
                                            onChange={e => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, promoCorBorda: e.target.value } })}
                                            className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0"
                                          />
                                          <input
                                            type="text"
                                            value={temaSeguro.cotasConfig?.promoCorBorda || '#334155'}
                                            onChange={e => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, promoCorBorda: e.target.value } })}
                                            className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                                          />
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                          <span className="text-slate-400">Espessura:</span>
                                          <span className="font-mono text-emerald-400 font-bold">{temaSeguro.cotasConfig?.promoLarguraBorda ?? 1}px</span>
                                        </div>
                                        <input
                                          type="range"
                                          min="1"
                                          max="8"
                                          value={temaSeguro.cotasConfig?.promoLarguraBorda ?? 1}
                                          onChange={e => atualizarTema({ cotasConfig: { ...temaSeguro.cotasConfig, promoLarguraBorda: Number(e.target.value) } })}
                                          className="w-full accent-emerald-500 bg-slate-900 cursor-pointer"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 4.6. TÍTULOS PREMIADOS (COTAS INSTANTÂNEAS) */}
                      {subAbaBotao === 'titulosPremiados' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-white flex items-center gap-2">
                              <Gift className="w-4 h-4 text-amber-400" />
                              Personalização dos Títulos Premiados
                            </h4>
                            <p className="text-xs text-slate-400">
                              Configure as cores das cotas premiadas instantâneas nos dois estados: Disponível para compra e Já Ganha/Encontrada.
                            </p>
                          </div>

                          {/* Textos da Seção */}
                          <SectionTextConfig
                            titulo={temaSeguro.botao.tituloPremiado || ''}
                            subtitulo={temaSeguro.botao.subtituloPremiado || ''}
                            fonteTitulo={temaSeguro.tipografia.fonteCardCotasPremiadas || ''}
                            fonteSubtitulo={temaSeguro.tipografia.fonteCardCotasPremiadasSubtitulo || ''}
                            alinhamentoTitulo={temaSeguro.tipografia.alinhamentoPremiadoTitulo || 'esquerda'}
                            alinhamentoSubtitulo={temaSeguro.tipografia.alinhamentoPremiadoSubtitulo || 'esquerda'}
                            onTituloChange={val => atualizarTema({ botao: { ...temaSeguro.botao, tituloPremiado: val } })}
                            onSubtituloChange={val => atualizarTema({ botao: { ...temaSeguro.botao, subtituloPremiado: val } })}
                            onFonteTituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, fonteCardCotasPremiadas: val } })}
                            onFonteSubtituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, fonteCardCotasPremiadasSubtitulo: val } })}
                            onAlinhamentoTituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, alinhamentoPremiadoTitulo: val } })}
                            onAlinhamentoSubtituloChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, alinhamentoPremiadoSubtitulo: val } })}
                          />

                          {/* Prévia Interativa dos Títulos Premiados */}
                          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                            <h5 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                              <Eye className="w-3.5 h-3.5 text-emerald-400" /> Prévia dos Estados das Cotas Premiadas
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* State 1: Disponível */}
                              <div 
                                className="p-3.5 rounded-xl border text-xs" 
                                style={{ 
                                  backgroundColor: (temaSeguro.cores as any).premiadoDisponivelFundo || '#0f172a', 
                                  borderColor: (temaSeguro.cores as any).premiadoDisponivelBorda || '#1e293b' 
                                }}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="font-mono font-black text-sm" style={{ color: (temaSeguro.cores as any).premiadoDisponivelTexto || '#ffffff' }}>
                                    012345
                                  </span>
                                  <span 
                                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                                    style={{ 
                                      backgroundColor: (temaSeguro.cores as any).premiadoDisponivelBadgeFundo || '#10b981', 
                                      color: (temaSeguro.cores as any).premiadoDisponivelBadgeTexto || '#022c22' 
                                    }}
                                  >
                                    Disponível
                                  </span>
                                </div>
                                <span className="block font-medium text-[11px]" style={{ color: (temaSeguro.cores as any).premiadoDisponivelTexto || '#ffffff' }}>
                                  R$ 500,00 no Pix Instantâneo
                                </span>
                              </div>

                              {/* State 2: Ganho */}
                              <div 
                                className="p-3.5 rounded-xl border text-xs opacity-85" 
                                style={{ 
                                  backgroundColor: (temaSeguro.cores as any).premiadoGanhoFundo || '#1e1b4b', 
                                  borderColor: (temaSeguro.cores as any).premiadoGanhoBorda || '#334155' 
                                }}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="font-mono font-black text-sm" style={{ color: (temaSeguro.cores as any).premiadoGanhoTexto || '#94a3b8' }}>
                                    987654
                                  </span>
                                  <span 
                                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                                    style={{ 
                                      backgroundColor: (temaSeguro.cores as any).premiadoGanhoBadgeFundo || '#f59e0b', 
                                      color: (temaSeguro.cores as any).premiadoGanhoBadgeTexto || '#022c22' 
                                    }}
                                  >
                                    Ganha
                                  </span>
                                </div>
                                <span className="block font-medium text-[11px]" style={{ color: (temaSeguro.cores as any).premiadoGanhoTexto || '#94a3b8' }}>
                                  iPhone 16 Pro Max 256GB
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Controles do Estado Disponível */}
                          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                            <h5 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Estado: Cota Premiada Disponível
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              {[
                                { key: 'premiadoDisponivelFundo', label: 'Cor de Fundo', desc: 'Fundo do card da cota livre' },
                                { key: 'premiadoDisponivelTexto', label: 'Cor do Texto / Número', desc: 'Texto principal e número da cota' },
                                { key: 'premiadoDisponivelBorda', label: 'Cor da Borda', desc: 'Contorno do card' },
                                { key: 'premiadoDisponivelBadgeFundo', label: 'Fundo do Selo ("Disponível")', desc: 'Fundo da tag de estado' },
                                { key: 'premiadoDisponivelBadgeTexto', label: 'Texto do Selo ("Disponível")', desc: 'Texto da tag de estado' },
                              ].map(item => {
                                const val = (temaSeguro.cores as any)[item.key] || '#10b981';
                                return (
                                  <div key={item.key} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300 block">{item.label}</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={val}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, [item.key]: e.target.value } })}
                                        className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                      />
                                      <input
                                        type="text"
                                        value={val}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, [item.key]: e.target.value } })}
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white uppercase focus:outline-none focus:border-emerald-500"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Controles do Estado Já Ganho / Encontrado */}
                          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                            <h5 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-amber-400" /> Estado: Cota Premiada Já Ganha / Encontrada
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              {[
                                { key: 'premiadoGanhoFundo', label: 'Cor de Fundo', desc: 'Fundo do card da cota premiada achada' },
                                { key: 'premiadoGanhoTexto', label: 'Cor do Texto / Número', desc: 'Texto principal e número' },
                                { key: 'premiadoGanhoBorda', label: 'Cor da Borda', desc: 'Contorno do card' },
                                { key: 'premiadoGanhoBadgeFundo', label: 'Fundo do Selo ("Ganha")', desc: 'Fundo da tag do ganhador' },
                                { key: 'premiadoGanhoBadgeTexto', label: 'Texto do Selo ("Ganha")', desc: 'Texto da tag do ganhador' },
                              ].map(item => {
                                const val = (temaSeguro.cores as any)[item.key] || '#f59e0b';
                                return (
                                  <div key={item.key} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300 block">{item.label}</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={val}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, [item.key]: e.target.value } })}
                                        className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                      />
                                      <input
                                        type="text"
                                        value={val}
                                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, [item.key]: e.target.value } })}
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white uppercase focus:outline-none focus:border-emerald-500"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Ajustes Geométricos para as Cotas Premiadas */}
                          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                            <h5 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                              <Sliders className="w-4 h-4 text-amber-400" /> Geometria e Dimensões das Cotas Premiadas
                            </h5>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-slate-300">Arredondamento</span>
                                  <span className="font-mono text-emerald-400 font-bold">{temaSeguro.botao.raioBordaPremiado ?? 12}px</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="32"
                                  value={temaSeguro.botao.raioBordaPremiado ?? 12}
                                  onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, raioBordaPremiado: Number(e.target.value) } })}
                                  className="w-full accent-emerald-500 bg-slate-900 cursor-pointer"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-slate-300">Altura / Padding</span>
                                  <span className="font-mono text-emerald-400 font-bold">{temaSeguro.botao.tamanhoAlturaPremiado ?? 14}px</span>
                                </div>
                                <input
                                  type="range"
                                  min="6"
                                  max="32"
                                  value={temaSeguro.botao.tamanhoAlturaPremiado ?? 14}
                                  onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, tamanhoAlturaPremiado: Number(e.target.value) } })}
                                  className="w-full accent-emerald-500 bg-slate-900 cursor-pointer"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-slate-300">Tamanho do Número</span>
                                  <span className="font-mono text-emerald-400 font-bold">{temaSeguro.botao.tamanhoTextoPremiado ?? 14}px</span>
                                </div>
                                <input
                                  type="range"
                                  min="10"
                                  max="24"
                                  value={temaSeguro.botao.tamanhoTextoPremiado ?? 14}
                                  onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, tamanhoTextoPremiado: Number(e.target.value) } })}
                                  className="w-full accent-emerald-500 bg-slate-900 cursor-pointer"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 5. CARDS DAS SEÇÕES & CONTEÚDOS */}
                      {subAbaBotao === 'cards' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                          
                          {/* Cabeçalho de Cards */}
                          {secaoCardAberta === null ? (
                            <div className="space-y-1">
                              <h4 className="text-sm font-black text-white flex items-center gap-2">
                                <Box className="w-4 h-4 text-purple-400" />
                                Cards das Seções & Conteúdos
                              </h4>
                              <p className="text-xs text-slate-400">
                                Personalize o estilo visual padrão de todos os cards da campanha e configure cores exclusivas para cada seção específica.
                              </p>
                            </div>
                          ) : null}

                          <div className="space-y-6 animate-in fade-in">
                  {/* Estilo Global dos Cards */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Box className="w-4 h-4 text-emerald-400" />
                      Configurações Globais dos Cards
                    </h4>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 block">
                        Estilo Visual Padrão:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { id: 'solido', label: 'Sólido Elegante', desc: 'Fundo opaco clássico' },
                          { id: 'vidro', label: 'Vidro (Glass)', desc: 'Translúcido com blur' },
                          { id: 'transparente', label: 'Transparente', desc: 'Apenas contorno suave' },
                          { id: '3d', label: 'Sombra 3D Relevo', desc: 'Card elevado com profundidade' },
                        ].map(st => {
                          const isSelected = (temaSeguro.botao.estiloCards || 'solido') === st.id;
                          return (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => atualizarTema({ botao: { ...temaSeguro.botao, estiloCards: st.id as any } })}
                              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                                isSelected
                                  ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className={`text-xs font-black ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                                  {st.label}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                              </div>
                              <span className="text-[10px] text-slate-500 block truncate">{st.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                        <SeletorCorOuDegrade
                          label="Fundo Global dos Cards"
                          valor={temaSeguro.cores.cardFundo}
                          onChange={novo => atualizarTema({ cores: { ...temaSeguro.cores, cardFundo: novo } })}
                        />
                      </div>

                      {/* Controles de Borda Global dos Cards */}
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Borda Global dos Cards</label>
                          <button
                            type="button"
                            onClick={() => atualizarTema({ botao: { ...temaSeguro.botao, possuirBordaCards: !temaSeguro.botao.possuirBordaCards } })}
                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                              temaSeguro.botao.possuirBordaCards
                                ? 'bg-emerald-500 text-slate-950 font-black'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {temaSeguro.botao.possuirBordaCards ? 'Ativa' : 'Desativada'}
                          </button>
                        </div>

                        {temaSeguro.botao.possuirBordaCards && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-400 font-bold block">Cor da Borda:</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={temaSeguro.cores.cardBorda?.startsWith('#') ? temaSeguro.cores.cardBorda : '#334155'}
                                  onChange={e => atualizarTema({ 
                                    cores: { ...temaSeguro.cores, cardBorda: e.target.value },
                                    botao: { ...temaSeguro.botao, corBordaCards: e.target.value }
                                  })}
                                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0"
                                />
                                <input
                                  type="text"
                                  value={temaSeguro.cores.cardBorda}
                                  onChange={e => atualizarTema({ 
                                    cores: { ...temaSeguro.cores, cardBorda: e.target.value },
                                    botao: { ...temaSeguro.botao, corBordaCards: e.target.value }
                                  })}
                                  className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white uppercase focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-400">Espessura:</span>
                                <span className="font-mono text-emerald-400 font-bold">{temaSeguro.botao.larguraBordaCards ?? 1}px</span>
                              </div>
                              <input
                                type="range"
                                min="1"
                                max="8"
                                value={temaSeguro.botao.larguraBordaCards ?? 1}
                                onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, larguraBordaCards: Number(e.target.value) } })}
                                className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-300">Arredondamento dos Cards</span>
                        <span className="font-mono text-emerald-400 font-bold">{temaSeguro.botao.raioBordaCards ?? 16}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="32"
                        value={temaSeguro.botao.raioBordaCards ?? 16}
                        onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, raioBordaCards: Number(e.target.value) } })}
                        className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-300">Altura / Padding Interno dos Cards</span>
                        <span className="font-mono text-emerald-400 font-bold">{temaSeguro.botao.tamanhoAlturaCards ?? 20}px</span>
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="48"
                        value={temaSeguro.botao.tamanhoAlturaCards ?? 20}
                        onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, tamanhoAlturaCards: Number(e.target.value) } })}
                        className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-300">Tamanho da Fonte dos Cards</span>
                        <span className="font-mono text-emerald-400 font-bold">{temaSeguro.botao.tamanhoFonteCards ?? 15}px</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="28"
                        value={temaSeguro.botao.tamanhoFonteCards ?? 15}
                        onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, tamanhoFonteCards: Number(e.target.value) } })}
                        className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* ACORDEÃO DE PERSONALIZAÇÃO INDIVIDUAL DOS CARDS */}
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">
                          Personalização de Cada Card Específico
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Clique em uma seção abaixo para editar a cor do card, borda e elementos exclusivos.
                        </p>
                      </div>
                    </div>
                  </div>

                    <div className={secaoCardAberta === null ? "grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-800/50" : "space-y-4 pt-2 border-t border-slate-800/50"}>
                      {[
                        {
                          id: 'banner',
                          titulo: 'Card do Banner & Carrossel',
                          desc: 'Cores, degradê do título, formato borda a borda e selos',
                          icone: '🖼️',
                          corFundoKey: 'cardBannerFundo',
                          corBordaKey: 'cardBannerBorda',
                          extras: (
                            <div className="space-y-4 pt-2">
                              {/* Fontes do Banner */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-bold text-slate-400">Fonte do Título (Banner)</label>
                                  <SeletorFonteCard valor={temaSeguro.tipografia.fonteCardBanner || ''} onChange={f => atualizarTema({ tipografia: { ...temaSeguro.tipografia, fonteCardBanner: f } })} />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-bold text-slate-400">Fonte do Subtítulo (Banner)</label>
                                  <SeletorFonteCard valor={temaSeguro.tipografia.fonteCardBannerSubtitulo || ''} onChange={f => atualizarTema({ tipografia: { ...temaSeguro.tipografia, fonteCardBannerSubtitulo: f } })} />
                                </div>
                              </div>

                              {/* Formato de Largura Total / Borda a Borda */}
                              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <label className="text-xs font-black text-white block">Banner Borda a Borda da Tela</label>
                                    <p className="text-[10px] text-slate-400">A imagem ocupa 100% da largura, sem recuo ou espaço nas laterais</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => atualizarTema({ 
                                      bannerConfig: { 
                                        ...temaSeguro.bannerConfig, 
                                        fullWidth: !(temaSeguro.bannerConfig?.fullWidth ?? true) 
                                      } 
                                    })}
                                    className={`px-3 py-1 rounded text-xs font-black uppercase transition ${
                                      (temaSeguro.bannerConfig?.fullWidth ?? true)
                                        ? 'bg-emerald-500 text-slate-950'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {(temaSeguro.bannerConfig?.fullWidth ?? true) ? 'Borda a Borda' : 'Com Margem'}
                                  </button>
                                </div>
                              </div>

                              {/* Degradê de Fundo do Título / Sombra no Banner */}
                              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <label className="text-xs font-black text-white block">Degradê de Fundo no Título / Banner</label>
                                    <p className="text-[10px] text-slate-400">Adicione uma sombra suave ou degradê transparente de baixo para cima sob o título para leitura perfeita.</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => atualizarTema({ 
                                      bannerConfig: { 
                                        ...temaSeguro.bannerConfig, 
                                        overlayDegradeAtivo: !(temaSeguro.bannerConfig?.overlayDegradeAtivo ?? true) 
                                      } 
                                    })}
                                    className={`px-3 py-1 rounded text-xs font-black uppercase transition cursor-pointer ${
                                      (temaSeguro.bannerConfig?.overlayDegradeAtivo ?? true)
                                        ? 'bg-purple-500 text-white shadow-lg'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {(temaSeguro.bannerConfig?.overlayDegradeAtivo ?? true) ? 'Ativo' : 'Desativado'}
                                  </button>
                                </div>

                                {(temaSeguro.bannerConfig?.overlayDegradeAtivo ?? true) && (
                                  <div className="space-y-4 pt-3 border-t border-slate-800">
                                    {/* Cor Única do Degradê */}
                                    <div className="space-y-1.5">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Cor Base do Degradê (Cor Única)</label>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="color"
                                          value={temaSeguro.bannerConfig?.overlayCor?.startsWith('#') ? temaSeguro.bannerConfig.overlayCor : '#000000'}
                                          onChange={e => {
                                            const cor = e.target.value;
                                            atualizarTema({
                                              bannerConfig: {
                                                ...temaSeguro.bannerConfig,
                                                overlayCor: cor,
                                                overlayDegrade: gerarGradientDegradeBanner(cor)
                                              }
                                            });
                                          }}
                                          className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                        />
                                        <input
                                          type="text"
                                          value={temaSeguro.bannerConfig?.overlayCor || '#000000'}
                                          onChange={e => {
                                            const cor = e.target.value;
                                            atualizarTema({
                                              bannerConfig: {
                                                ...temaSeguro.bannerConfig,
                                                overlayCor: cor,
                                                overlayDegrade: gerarGradientDegradeBanner(cor)
                                              }
                                            });
                                          }}
                                          placeholder="#000000"
                                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white uppercase focus:outline-none focus:border-purple-500"
                                        />
                                      </div>
                                      <p className="text-[9.5px] text-slate-500">O efeito usará esta cor com transparência suave subindo da base até o topo.</p>
                                    </div>

                                    {/* Altura de Cobertura */}
                                    <div className="space-y-1.5">
                                      <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-slate-400 font-bold uppercase tracking-wider">Altura de Cobertura do Degradê:</span>
                                        <span className="font-mono text-purple-400 font-bold">{temaSeguro.bannerConfig?.overlayAltura ?? 60}%</span>
                                      </div>
                                      <input
                                        type="range"
                                        min="10"
                                        max="100"
                                        value={temaSeguro.bannerConfig?.overlayAltura ?? 60}
                                        onChange={e => atualizarTema({
                                          bannerConfig: {
                                            ...temaSeguro.bannerConfig,
                                            overlayAltura: Number(e.target.value)
                                          }
                                        })}
                                        className="w-full accent-purple-500 bg-slate-900 cursor-pointer"
                                      />
                                      <p className="text-[9.5px] text-slate-500">Ex: 60% faz o degradê subir até 60% da altura do banner.</p>
                                    </div>

                                    {/* Prévia Real do Degradê */}
                                    <div className="space-y-1 pt-1">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Prévia do Degradê no Banner:</span>
                                      <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-inner">
                                        <img 
                                          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80" 
                                          alt="Fundo Exemplo" 
                                          className="w-full h-full object-cover"
                                        />
                                        <div 
                                          className="absolute inset-x-0 bottom-0 p-3 flex flex-col justify-end pointer-events-none"
                                          style={{
                                            background: gerarGradientDegradeBanner(temaSeguro.bannerConfig?.overlayCor || '#000000'),
                                            height: `${temaSeguro.bannerConfig?.overlayAltura ?? 60}%`
                                          }}
                                        >
                                          <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1 mb-0.5">
                                            <ShieldCheck className="w-3 h-3" /> Sorteio Oficial
                                          </span>
                                          <h4 className="text-xs font-black text-white leading-tight drop-shadow">
                                            Título de Exemplo no Banner
                                          </h4>
                                          <p className="text-[10px] text-slate-300 font-medium">
                                            Subtítulo por apenas R$ 0,50
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Selo de Destaque no Banner */}
                              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <label className="text-xs font-black text-amber-400 uppercase tracking-wider block">Selo de Destaque do Banner</label>
                                    <p className="text-[10px] text-slate-400">Exiba ou oculte o selo decorativo (ex: 🔥 MEGA PROMOÇÃO)</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => atualizarTema({ 
                                      bannerConfig: { 
                                        ...temaSeguro.bannerConfig, 
                                        exibirSeloBanner: !(temaSeguro.bannerConfig?.exibirSeloBanner ?? true) 
                                      } 
                                    })}
                                    className={`px-3 py-1 rounded text-xs font-black uppercase transition cursor-pointer ${
                                      (temaSeguro.bannerConfig?.exibirSeloBanner ?? true)
                                        ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {(temaSeguro.bannerConfig?.exibirSeloBanner ?? true) ? 'Ativo' : 'Desativado'}
                                  </button>
                                </div>
                                
                                {(temaSeguro.bannerConfig?.exibirSeloBanner ?? true) && (
                                  <div className="space-y-3 pt-2 border-t border-slate-800">
                                    <SeletorCorOuDegrade
                                      label="Fundo do Selo"
                                      valor={temaSeguro.cores.seloBannerFundo || temaSeguro.bannerConfig?.seloFundo || '#f59e0b'}
                                      onChange={novo => atualizarTema({ 
                                        cores: { ...temaSeguro.cores, seloBannerFundo: novo },
                                        bannerConfig: { ...temaSeguro.bannerConfig, seloFundo: novo }
                                      })}
                                    />

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Texto do Selo</label>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="color"
                                          value={temaSeguro.cores.seloBannerTexto?.startsWith('#') ? temaSeguro.cores.seloBannerTexto : '#022c22'}
                                          onChange={e => atualizarTema({ 
                                            cores: { ...temaSeguro.cores, seloBannerTexto: e.target.value },
                                            bannerConfig: { ...temaSeguro.bannerConfig, seloTexto: e.target.value }
                                          })}
                                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                        />
                                        <input
                                          type="text"
                                          value={temaSeguro.cores.seloBannerTexto || '#022c22'}
                                          onChange={e => atualizarTema({ 
                                            cores: { ...temaSeguro.cores, seloBannerTexto: e.target.value },
                                            bannerConfig: { ...temaSeguro.bannerConfig, seloTexto: e.target.value }
                                          })}
                                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-1.5">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Animação do Selo</label>
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => atualizarTema({ bannerConfig: { ...temaSeguro.bannerConfig, seloAnimado: true } })}
                                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                                            (temaSeguro.bannerConfig?.seloAnimado ?? true)
                                              ? 'bg-amber-500 text-slate-950'
                                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                                          }`}
                                        >
                                          Pulsante
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => atualizarTema({ bannerConfig: { ...temaSeguro.bannerConfig, seloAnimado: false } })}
                                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                                            !(temaSeguro.bannerConfig?.seloAnimado ?? true)
                                              ? 'bg-amber-500 text-slate-950'
                                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                                          }`}
                                        >
                                          Estático
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Borda do Selo */}
                                    <div className="pt-2 border-t border-slate-800 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Borda no Selo</label>
                                        <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                                          <button
                                            type="button"
                                            onClick={() => atualizarTema({ bannerConfig: { ...temaSeguro.bannerConfig, seloBordaAtiva: false } })}
                                            className={`px-3 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                                              !(temaSeguro.bannerConfig?.seloBordaAtiva)
                                                ? 'bg-rose-600 text-white shadow'
                                                : 'text-slate-400 hover:text-white'
                                            }`}
                                          >
                                            Sem Borda
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => atualizarTema({ bannerConfig: { ...temaSeguro.bannerConfig, seloBordaAtiva: true } })}
                                            className={`px-3 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                                              temaSeguro.bannerConfig?.seloBordaAtiva
                                                ? 'bg-purple-600 text-white shadow'
                                                : 'text-slate-400 hover:text-white'
                                            }`}
                                          >
                                            Com Borda
                                          </button>
                                        </div>
                                      </div>

                                      {temaSeguro.bannerConfig?.seloBordaAtiva && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                          <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Cor da Borda</label>
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="color"
                                                value={temaSeguro.bannerConfig?.seloBordaCor?.startsWith('#') ? temaSeguro.bannerConfig.seloBordaCor : '#ffffff'}
                                                onChange={e => atualizarTema({ bannerConfig: { ...temaSeguro.bannerConfig, seloBordaCor: e.target.value } })}
                                                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                              />
                                              <input
                                                type="text"
                                                value={temaSeguro.bannerConfig?.seloBordaCor || '#ffffff'}
                                                onChange={e => atualizarTema({ bannerConfig: { ...temaSeguro.bannerConfig, seloBordaCor: e.target.value } })}
                                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                              />
                                            </div>
                                          </div>

                                          <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Espessura da Borda</label>
                                            <div className="flex items-center gap-1.5">
                                              {[1, 2, 3, 4].map(px => (
                                                <button
                                                  key={px}
                                                  type="button"
                                                  onClick={() => atualizarTema({ bannerConfig: { ...temaSeguro.bannerConfig, seloBordaEspessura: px } })}
                                                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                                    (temaSeguro.bannerConfig?.seloBordaEspessura ?? 1) === px
                                                      ? 'bg-purple-600 text-white'
                                                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                                                  }`}
                                                >
                                                  {px}px
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Alinhamento e Tamanho dos Textos do Banner */}
                              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                                <SeletorAlinhamento
                                  label="Alinhamento do Título & Subtítulo no Banner:"
                                  valor={temaSeguro.tipografia.alinhamentoBanner || 'centro'}
                                  onChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, alinhamentoBanner: val } })}
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[10px]">
                                      <span className="text-slate-400 font-bold uppercase tracking-wider">Tamanho do Título</span>
                                      <span className="font-mono text-purple-400 font-bold">{temaSeguro.tipografia.tamanhoBannerTitulo ?? 24}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="14"
                                      max="48"
                                      value={temaSeguro.tipografia.tamanhoBannerTitulo ?? 24}
                                      onChange={e => atualizarTema({
                                        tipografia: {
                                          ...temaSeguro.tipografia,
                                          tamanhoBannerTitulo: Number(e.target.value)
                                        }
                                      })}
                                      className="w-full accent-purple-500 bg-slate-900 cursor-pointer"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[10px]">
                                      <span className="text-slate-400 font-bold uppercase tracking-wider">Tamanho do Subtítulo</span>
                                      <span className="font-mono text-purple-400 font-bold">{temaSeguro.tipografia.tamanhoBannerSubtitulo ?? 13}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="10"
                                      max="28"
                                      value={temaSeguro.tipografia.tamanhoBannerSubtitulo ?? 13}
                                      onChange={e => atualizarTema({
                                        tipografia: {
                                          ...temaSeguro.tipografia,
                                          tamanhoBannerSubtitulo: Number(e.target.value)
                                        }
                                      })}
                                      className="w-full accent-purple-500 bg-slate-900 cursor-pointer"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        },
                        {
                          id: 'progresso',
                          titulo: 'Card de Progresso de Vendas',
                          desc: 'Personalize textos, dimensões, cantos e cores da barra de progresso',
                          icone: '📊',
                          corFundoKey: 'cardProgressoFundo',
                          corBordaKey: 'cardProgressoBorda',
                          extras: (
                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 pt-2">
                              <SeletorAlinhamento
                                label="Alinhamento do Título de Progresso:"
                                valor={temaSeguro.tipografia.alinhamentoProgresso || 'esquerda'}
                                onChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, alinhamentoProgresso: val } })}
                              />
                            </div>
                          )
                        },
                        {
                          id: 'cotas',
                          titulo: 'Card Seletor de Cotas (Quantidade)',
                          desc: 'Caixa de escolha de quantidade de títulos e pacotes',
                          icone: '🎯',
                          corFundoKey: 'cardCotasFundo',
                          corBordaKey: 'cardCotasBorda',
                          extras: (
                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 pt-2">
                              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Cor do Texto Principal das Cotas</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={(temaSeguro.cores as any).cardCotasTexto || '#ffffff'}
                                  onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cardCotasTexto: e.target.value } })}
                                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                />
                                <input
                                  type="text"
                                  value={(temaSeguro.cores as any).cardCotasTexto || '#ffffff'}
                                  onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cardCotasTexto: e.target.value } })}
                                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                />
                              </div>
                            </div>
                          )
                        },
                        {
                          id: 'premios',
                          titulo: 'Card de Premiação (1º, 2º, 3º...)',
                          desc: 'Personalize a caixa de prêmios e a cor de cada colocação',
                          icone: '🏆',
                          corFundoKey: 'cardPremiosFundo',
                          corBordaKey: 'cardPremiosBorda',
                          extras: (
                            <div className="space-y-3 pt-2">
                              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                <SeletorAlinhamento
                                  label="Alinhamento do Título da Seção de Prêmios:"
                                  valor={temaSeguro.tipografia.alinhamentoPremios || 'esquerda'}
                                  onChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, alinhamentoPremios: val } })}
                                />
                              </div>
                              <h5 className="text-[11px] font-black text-amber-400 uppercase tracking-wider block">Cores da Lista de Prêmios (Itens e Ordem)</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Fundo da Tag da Ordem (1º, 2º...)</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={(temaSeguro.cores as any).premioBadgeFundo || '#10b981'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, premioBadgeFundo: e.target.value } })}
                                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(temaSeguro.cores as any).premioBadgeFundo || '#10b981'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, premioBadgeFundo: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Texto da Tag de Ordem</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={(temaSeguro.cores as any).premioBadgeTexto || '#022c22'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, premioBadgeTexto: e.target.value } })}
                                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(temaSeguro.cores as any).premioBadgeTexto || '#022c22'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, premioBadgeTexto: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Fundo dos Cards de Prêmios</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={(temaSeguro.cores as any).premioFundo || '#0f172a'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, premioFundo: e.target.value } })}
                                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(temaSeguro.cores as any).premioFundo || '#0f172a'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, premioFundo: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Texto dos Prêmios</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={(temaSeguro.cores as any).premioTexto || '#ffffff'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, premioTexto: e.target.value } })}
                                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(temaSeguro.cores as any).premioTexto || '#ffffff'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, premioTexto: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 sm:col-span-2">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Cor da Borda dos Itens de Prêmios</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={converterParaHex((temaSeguro.cores as any).premioBorda, '#334155')}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, premioBorda: e.target.value } })}
                                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(temaSeguro.cores as any).premioBorda || '#334155'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, premioBorda: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        },
                        {
                          id: 'premiadas',
                          titulo: 'Card de Cotas Premiadas Instantâneas',
                          desc: 'Container dos bilhetes contemplados na hora',
                          icone: '⚡',
                          corFundoKey: 'cardCotasPremiadasFundo',
                          corBordaKey: 'cardCotasPremiadasBorda',
                          extras: (
                            <div className="space-y-3 pt-2">
                              <h5 className="text-[11px] font-black text-amber-400 uppercase tracking-wider block">Cores das Cotas Individuais na Grade</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Fundo da Cota Disponível</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={converterParaHex((temaSeguro.cores as any).cotaPremiadaLivreFundo, '#10b981')}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaPremiadaLivreFundo: e.target.value } })}
                                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(temaSeguro.cores as any).cotaPremiadaLivreFundo || '#10b981'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaPremiadaLivreFundo: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Borda da Cota Disponível</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={converterParaHex((temaSeguro.cores as any).cotaPremiadaLivreBorda, '#059669')}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaPremiadaLivreBorda: e.target.value } })}
                                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(temaSeguro.cores as any).cotaPremiadaLivreBorda || '#059669'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaPremiadaLivreBorda: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Número da Cota Disponível</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={(temaSeguro.cores as any).cotaPremiadaLivreTexto || temaSeguro.cores.primaria}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaPremiadaLivreTexto: e.target.value } })}
                                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(temaSeguro.cores as any).cotaPremiadaLivreTexto || temaSeguro.cores.primaria}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaPremiadaLivreTexto: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Fundo da Cota Encontrada/Ganha</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={converterParaHex((temaSeguro.cores as any).cotaPremiadaAchadaFundo, '#1e293b')}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaPremiadaAchadaFundo: e.target.value } })}
                                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(temaSeguro.cores as any).cotaPremiadaAchadaFundo || '#1e293b'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaPremiadaAchadaFundo: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Borda da Cota Encontrada/Ganha</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={converterParaHex((temaSeguro.cores as any).cotaPremiadaAchadaBorda, '#475569')}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaPremiadaAchadaBorda: e.target.value } })}
                                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(temaSeguro.cores as any).cotaPremiadaAchadaBorda || '#475569'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaPremiadaAchadaBorda: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Texto da Cota Encontrada/Ganha</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={(temaSeguro.cores as any).cotaPremiadaAchadaTexto || '#94a3b8'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaPremiadaAchadaTexto: e.target.value } })}
                                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(temaSeguro.cores as any).cotaPremiadaAchadaTexto || '#94a3b8'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cotaPremiadaAchadaTexto: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        },
                        {
                          id: 'ranking',
                          titulo: 'Card de Top Compradores / Ranking',
                          desc: 'Container dos líderes de compra da campanha',
                          icone: '👑',
                          corFundoKey: 'cardRankingFundo',
                          corBordaKey: 'cardRankingBorda',
                          extras: (
                            <div className="space-y-3 pt-2">
                              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                <SeletorAlinhamento
                                  label="Alinhamento do Título da Seção de Top Compradores:"
                                  valor={temaSeguro.tipografia.alinhamentoRanking || 'esquerda'}
                                  onChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, alinhamentoRanking: val } })}
                                />
                              </div>
                              <h5 className="text-[11px] font-black text-amber-400 uppercase tracking-wider block">Cores dos Itens do Ranking e Podio</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Fundo dos Itens da Lista</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={(temaSeguro.cores as any).rankingItemFundo || temaSeguro.cores.controlesFundo}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, rankingItemFundo: e.target.value } })}
                                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(temaSeguro.cores as any).rankingItemFundo || temaSeguro.cores.controlesFundo}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, rankingItemFundo: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Cor da Quantidade de Cotas</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={(temaSeguro.cores as any).rankingQtdCotasTexto || temaSeguro.cores.primaria}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, rankingQtdCotasTexto: e.target.value } })}
                                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(temaSeguro.cores as any).rankingQtdCotasTexto || temaSeguro.cores.primaria}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, rankingQtdCotasTexto: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Fundo do Badge de 1º Lugar</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={(temaSeguro.cores as any).ranking1Fundo || '#fbbf24'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, ranking1Fundo: e.target.value } })}
                                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(temaSeguro.cores as any).ranking1Fundo || '#fbbf24'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, ranking1Fundo: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Texto do Badge de 1º Lugar</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={(temaSeguro.cores as any).ranking1Texto || '#020617'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, ranking1Texto: e.target.value } })}
                                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(temaSeguro.cores as any).ranking1Texto || '#020617'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, ranking1Texto: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Fundo Outras Posições (2º, 3º...)</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={(temaSeguro.cores as any).rankingOutroFundo || '#334155'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, rankingOutroFundo: e.target.value } })}
                                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(temaSeguro.cores as any).rankingOutroFundo || '#334155'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, rankingOutroFundo: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Texto Outras Posições (2º, 3º...)</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={(temaSeguro.cores as any).rankingOutroTexto || '#cbd5e1'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, rankingOutroTexto: e.target.value } })}
                                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(temaSeguro.cores as any).rankingOutroTexto || '#cbd5e1'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, rankingOutroTexto: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        },
                        {
                          id: 'regulamento',
                          titulo: 'Card de Regulamento & Informações',
                          desc: 'Caixa de texto expansível com descrição e regras',
                          icone: '📜',
                          corFundoKey: 'cardRegulamentoFundo',
                          corBordaKey: 'cardRegulamentoBorda',
                          extras: (
                            <div className="space-y-3 pt-2">
                              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                <SeletorAlinhamento
                                  label="Alinhamento do Título do Regulamento:"
                                  valor={temaSeguro.tipografia.alinhamentoRegulamento || 'esquerda'}
                                  onChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, alinhamentoRegulamento: val } })}
                                />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Cor do Texto do Regulamento</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={(temaSeguro.cores as any).cardRegulamentoTexto || '#cbd5e1'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cardRegulamentoTexto: e.target.value } })}
                                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(temaSeguro.cores as any).cardRegulamentoTexto || '#cbd5e1'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cardRegulamentoTexto: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Cor do Título do Regulamento</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={(temaSeguro.cores as any).cardRegulamentoTituloCor || temaSeguro.cores.titulos}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cardRegulamentoTituloCor: e.target.value } })}
                                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(temaSeguro.cores as any).cardRegulamentoTituloCor || temaSeguro.cores.titulos}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, cardRegulamentoTituloCor: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        },
                        {
                          id: 'ganhadores',
                          titulo: 'Card de Ganhadores Recentes',
                          desc: 'Exibição do ganhador contemplado',
                          icone: '🎉',
                          corFundoKey: 'cardGanhadoresFundo',
                          corBordaKey: 'cardGanhadoresBorda',
                          extras: (
                            <div className="space-y-3 pt-2">
                              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                <SeletorAlinhamento
                                  label="Alinhamento do Título de Ganhadores:"
                                  valor={temaSeguro.tipografia.alinhamentoGanhadores || 'esquerda'}
                                  onChange={val => atualizarTema({ tipografia: { ...temaSeguro.tipografia, alinhamentoGanhadores: val } })}
                                />
                              </div>
                              <h5 className="text-[11px] font-black text-amber-400 uppercase tracking-wider block">Cores do Bloco do Ganhador</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Fundo do Bloco de Destaque</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={converterParaHex((temaSeguro.cores as any).ganhadorBlocoFundo, '#10b981')}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, ganhadorBlocoFundo: e.target.value } })}
                                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(temaSeguro.cores as any).ganhadorBlocoFundo || '#10b981'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, ganhadorBlocoFundo: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Borda do Bloco de Destaque</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={converterParaHex((temaSeguro.cores as any).ganhadorBlocoBorda, '#059669')}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, ganhadorBlocoBorda: e.target.value } })}
                                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(temaSeguro.cores as any).ganhadorBlocoBorda || '#059669'}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, ganhadorBlocoBorda: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Texto da Cota Contemplada</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={(temaSeguro.cores as any).ganhadorCotaTexto || temaSeguro.cores.primaria}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, ganhadorCotaTexto: e.target.value } })}
                                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(temaSeguro.cores as any).ganhadorCotaTexto || temaSeguro.cores.primaria}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, ganhadorCotaTexto: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Fundo do Troféu</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={(temaSeguro.cores as any).ganhadorTrofeuFundo || temaSeguro.cores.primaria}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, ganhadorTrofeuFundo: e.target.value } })}
                                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(temaSeguro.cores as any).ganhadorTrofeuFundo || temaSeguro.cores.primaria}
                                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, ganhadorTrofeuFundo: e.target.value } })}
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        }
                      ].map(sec => {
                        const isExpanded = secaoCardAberta === sec.id;
                        const fundoVal = (temaSeguro.cores as any)[sec.corFundoKey] || temaSeguro.cores.cardFundo;
                        const bordaVal = (temaSeguro.cores as any)[sec.corBordaKey] || temaSeguro.cores.cardBorda;

                        if (secaoCardAberta !== null && !isExpanded) {
                          return null;
                        }

                        if (secaoCardAberta === null) {
                          return (
                            <button
                              key={sec.id}
                              type="button"
                              onClick={() => setSecaoCardAberta(sec.id)}
                              className="w-full text-left p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl hover:border-purple-500/50 hover:bg-slate-900/40 transition flex items-center justify-between gap-3 group cursor-pointer animate-in fade-in duration-200"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl group-hover:scale-110 transition-transform">{sec.icone}</span>
                                <div>
                                  <h5 className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                                    {sec.titulo}
                                  </h5>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{sec.desc}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 rounded border border-slate-800 text-[9px] font-mono">
                                  <span className="w-2 h-2 rounded-full border border-white/10" style={{ backgroundColor: fundoVal }} />
                                  <span className="text-slate-400 font-semibold">{fundoVal}</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition" />
                              </div>
                            </button>
                          );
                        }

                        return (
                          <div
                            key={sec.id}
                            className="space-y-5 p-3 sm:p-5 bg-slate-950 border border-slate-800 rounded-2xl animate-in fade-in duration-200 w-full"
                          >
                            {/* Cabeçalho Dedicado com Voltar */}
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                              <div className="flex items-center gap-2.5">
                                <span className="text-2xl">{sec.icone}</span>
                                <div>
                                  <h5 className="text-xs font-black text-white flex items-center gap-2">
                                    {sec.titulo}
                                  </h5>
                                  <p className="text-[10px] text-slate-400">{sec.desc}</p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setSecaoCardAberta(null)}
                                className="text-[10px] text-slate-300 hover:text-white px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl transition font-black flex items-center gap-1.5 cursor-pointer"
                              >
                                <ArrowLeft className="w-3.5 h-3.5 text-purple-400" />
                                Voltar para Lista
                              </button>
                            </div>

                            {/* Configuração de cores com suporte a Degradê */}
                            <div className="space-y-4">
                              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                                <SeletorCorOuDegrade
                                  label={`Cor ou Degradê de Fundo (${sec.titulo})`}
                                  valor={fundoVal}
                                  onChange={novo => atualizarTema({ cores: { ...temaSeguro.cores, [sec.corFundoKey]: novo } })}
                                />
                              </div>

                              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                                <div className="flex justify-between items-center">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Cor da Borda</label>
                                  <span className="text-[10px] text-slate-500 font-mono uppercase">{bordaVal}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={bordaVal?.startsWith('#') ? bordaVal : '#334155'}
                                    onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, [sec.corBordaKey]: e.target.value } })}
                                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                  />
                                  <input
                                    type="text"
                                    value={bordaVal}
                                    onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, [sec.corBordaKey]: e.target.value } })}
                                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                                  />
                                </div>
                              </div>

                              {/* SELETOR DE FONTE DO CARD */}
                              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                                <div className="flex justify-between items-center">
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Fonte do Card</label>
                                  <span className="text-[10px] text-emerald-400 font-mono font-bold">
                                    {temaSeguro.tipografia[`fonteCard${sec.id.charAt(0).toUpperCase() + sec.id.slice(1)}` as keyof typeof temaSeguro.tipografia] || 'Padrão do Tema'}
                                  </span>
                                </div>
                                
                                <div className="relative font-card-selector">
                                  <SeletorFonteCard
                                    valor={temaSeguro.tipografia[`fonteCard${sec.id.charAt(0).toUpperCase() + sec.id.slice(1)}` as keyof typeof temaSeguro.tipografia] as string || ''}
                                    onChange={(novaFonte) => {
                                      atualizarTema({
                                        tipografia: {
                                          ...temaSeguro.tipografia,
                                          [`fonteCard${sec.id.charAt(0).toUpperCase() + sec.id.slice(1)}`]: novaFonte
                                        }
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            {sec.extras && (
                              <div className="pt-3 border-t border-slate-800">
                                {sec.extras}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* SEÇÃO TIPOGRAFIA & FONTES UNIFICADA */}
      {secaoEditor === 'tipografia' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-sm space-y-6 animate-in fade-in">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Type className="w-4 h-4 text-emerald-400" />
              Fontes, Tipografia & Cores de Texto
            </h3>
            <p className="text-xs text-slate-400">
              Escolha as fontes dos títulos e textos do Google Fonts, ajuste os tamanhos base e selecione as respectivas cores.
            </p>
          </div>

          {/* 1. SELETOR DE FONTES */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              Famílias de Fontes (Google Fonts)
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fonte de Títulos */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-300 block">Fonte dos Títulos</label>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">Selecionada: {temaSeguro.tipografia.fonteTitulo}</span>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar bg-slate-950/40 p-2 rounded-xl border border-slate-800/80">
                  {GOOGLE_FONTS_LIST.map(f => {
                    const selecionada = temaSeguro.tipografia.fonteTitulo === f;
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => atualizarTema({ tipografia: { ...temaSeguro.tipografia, fonteTitulo: f } })}
                        className={`p-3 text-left border rounded-xl transition flex flex-col justify-center cursor-pointer min-h-[44px] ${
                          selecionada
                            ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <span className="text-base font-bold tracking-wide truncate" style={{ fontFamily: f }}>
                          {f}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fonte de Textos */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-300 block">Fonte dos Textos</label>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">Selecionada: {temaSeguro.tipografia.fonteTexto}</span>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar bg-slate-950/40 p-2 rounded-xl border border-slate-800/80">
                  {GOOGLE_FONTS_LIST.map(f => {
                    const selecionada = temaSeguro.tipografia.fonteTexto === f;
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => atualizarTema({ tipografia: { ...temaSeguro.tipografia, fonteTexto: f } })}
                        className={`p-3 text-left border rounded-xl transition flex flex-col justify-center cursor-pointer min-h-[44px] ${
                          selecionada
                            ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <span className="text-sm tracking-wide truncate" style={{ fontFamily: f }}>
                          {f}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 2. TAMANHOS DE FONTE */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              Tamanhos das Fontes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 p-3 bg-slate-950/50 border border-slate-800/60 rounded-xl">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-bold text-slate-300">Tamanho Base Títulos</span>
                  <span className="font-mono text-emerald-400 font-bold">{temaSeguro.tipografia.tamanhoTitulo}px</span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="36"
                  value={temaSeguro.tipografia.tamanhoTitulo}
                  onChange={e => atualizarTema({ tipografia: { ...temaSeguro.tipografia, tamanhoTitulo: Number(e.target.value) } })}
                  className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5 p-3 bg-slate-950/50 border border-slate-800/60 rounded-xl">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-bold text-slate-300">Tamanho Base Textos</span>
                  <span className="font-mono text-emerald-400 font-bold">{temaSeguro.tipografia.tamanhoTexto}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="20"
                  value={temaSeguro.tipografia.tamanhoTexto}
                  onChange={e => atualizarTema({ tipografia: { ...temaSeguro.tipografia, tamanhoTexto: Number(e.target.value) } })}
                  className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 3. CORES DE TEXTO */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              Cores dos Textos
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { key: 'titulos', label: 'Cor dos Títulos', desc: 'Cabeçalhos e títulos' },
                { key: 'texto', label: 'Cor do Texto Geral', desc: 'Parágrafos principais' },
                { key: 'descricoes', label: 'Cor das Descrições', desc: 'Textos secundários' },
                { key: 'subtituloCor', label: 'Cor do Subtítulo', desc: 'Abaixo do título' },
              ].map(item => {
                const val = (temaSeguro.cores as any)[item.key];
                return (
                  <div key={item.key} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{item.label}</label>
                      <span className="text-[10px] text-slate-500 font-mono uppercase">{val}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={val}
                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, [item.key]: e.target.value } })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                      />
                      <input
                        type="text"
                        value={val}
                        onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, [item.key]: e.target.value } })}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white uppercase focus:outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

          {/* 4. SEÇÃO BLOCOS E FUNDO */}
          {secaoEditor === 'blocos' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-sm space-y-5 animate-in fade-in">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Layout className="w-4 h-4 text-emerald-400" />
                  Ordem dos Blocos e Fundo Multimídia
                </h3>
                <p className="text-xs text-slate-400">
                  Organize a ordem dos blocos e adicione imagens ou vídeos de fundo em loop.
                </p>
              </div>

              {/* Fundo Multimídia */}
              <div className="space-y-3 p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  Fundo da Página (Cor, Imagem ou Vídeo)
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cor', label: 'Cor Sólida' },
                    { id: 'imagem', label: 'Imagem de Fundo' },
                    { id: 'video', label: 'Vídeo de Fundo' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => atualizarTema({ fundoMidia: { ...temaSeguro.fundoMidia, tipo: m.id as any } })}
                      className={`py-2 px-2 text-xs font-bold border rounded-xl transition ${
                        temaSeguro.fundoMidia?.tipo === m.id
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {temaSeguro.fundoMidia?.tipo !== 'cor' && (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                      Fazer Upload de {temaSeguro.fundoMidia?.tipo === 'video' ? 'Vídeo (MP4/WebM)' : 'Imagem de Fundo'}
                    </label>

                    {temaSeguro.fundoMidia?.url ? (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 group">
                        {temaSeguro.fundoMidia?.tipo === 'video' ? (
                          <video
                            src={temaSeguro.fundoMidia?.url}
                            autoPlay
                            muted
                            loop
                            className="w-full h-32 object-cover"
                          />
                        ) : (
                          <img
                            src={temaSeguro.fundoMidia?.url}
                            alt="Background Preview"
                            referrerPolicy="no-referrer"
                            className="w-full h-32 object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => atualizarTema({ fundoMidia: { ...temaSeguro.fundoMidia, url: '' } })}
                            className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remover Mídia
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        id="background-upload-dropzone"
                        onDragOver={e => {
                          e.preventDefault();
                          e.currentTarget.classList.add('border-emerald-500', 'bg-emerald-500/5');
                        }}
                        onDragLeave={e => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('border-emerald-500', 'bg-emerald-500/5');
                        }}
                        onDrop={e => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('border-emerald-500', 'bg-emerald-500/5');
                          const file = e.dataTransfer.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                atualizarTema({ fundoMidia: { ...temaSeguro.fundoMidia, url: reader.result } });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        onClick={() => {
                          const input = document.getElementById('background-file-input');
                          if (input) input.click();
                        }}
                        className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60 transition rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer gap-2 group min-h-[140px]"
                      >
                        <input
                          id="background-file-input"
                          type="file"
                          accept={temaSeguro.fundoMidia?.tipo === 'video' ? 'video/*' : 'image/*'}
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === 'string') {
                                  atualizarTema({ fundoMidia: { ...temaSeguro.fundoMidia, url: reader.result } });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                          {temaSeguro.fundoMidia?.tipo === 'video' ? (
                            <Video className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-emerald-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Arrastar e soltar arquivo aqui</p>
                          <p className="text-[10px] text-slate-400 mt-1">ou clique para selecionar do seu dispositivo</p>
                          <p className="text-[9px] text-emerald-400/80 mt-2 max-w-[240px] mx-auto leading-relaxed font-medium">
                            {temaSeguro.fundoMidia?.tipo === 'video' 
                              ? 'Sugestão: Formato MP4 de até 5MB, proporção de tela cheia para encaixe ideal' 
                              : 'Sugestão: 1920x1080 px ou proporção vertical de celular para encaixe perfeito'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Estilo de Celebração de Ganhadores / Cotas Premiadas */}
              <div className="space-y-3 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider block mb-1">
                    Animação de Celebração de Ganhadores & Cotas Premiadas
                  </h4>
                  <p className="text-xs text-slate-400">
                    Selecione o efeito festivo exibido na apuração de ganhadores e revelação de cotas premiadas:
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* Opção 1: Explosão de Confetes */}
                  <div
                    onClick={() => {
                      atualizarTema({ ganhadorCelebracaoEstilo: 'confetes' });
                      setPreviewAnimacao('confetes');
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      temaSeguro.ganhadorCelebracaoEstilo !== 'nenhuma'
                        ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500/50'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <span className="text-xl">🎉</span>
                        <div>
                          <h5 className="text-xs font-bold text-white flex items-center gap-2">
                            Explosão de Confetes
                            <span className="text-[9px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
                              Recomendado
                            </span>
                          </h5>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Dispara dois canhões laterais no fundo da tela em um arco limpo.
                          </p>
                        </div>
                      </div>
                      {temaSeguro.ganhadorCelebracaoEstilo !== 'nenhuma' && (
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                      )}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono">Estilo: Explosão Lateral Dupla</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          dispararExplosaoConfetes();
                        }}
                        className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 font-bold rounded-lg text-[10px] flex items-center gap-1 border border-purple-500/30 transition cursor-pointer"
                      >
                        <Zap className="w-3 h-3 text-purple-400" /> ⚡ Testar Efeito
                      </button>
                    </div>
                  </div>

                  {/* Opção 2: Nenhuma Animação */}
                  <div
                    onClick={() => {
                      atualizarTema({ ganhadorCelebracaoEstilo: 'nenhuma' });
                      setPreviewAnimacao(null);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      temaSeguro.ganhadorCelebracaoEstilo === 'nenhuma'
                        ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500/50'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <span className="text-xl">🚫</span>
                        <div>
                          <h5 className="text-xs font-bold text-white">Nenhuma Animação</h5>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Desativa efeitos festivos ao revelar sorteios ou cotas.
                          </p>
                        </div>
                      </div>
                      {temaSeguro.ganhadorCelebracaoEstilo === 'nenhuma' && (
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Visibilidade do Local do Sorteio */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Local do Sorteio</span>
                      <span className="text-[10px] text-slate-500 block">Exibir onde o sorteio será realizado</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => atualizarTema({ 
                      layout: { 
                        ...temaSeguro.layout, 
                        visivel: { ...temaSeguro.layout.visivel, localSorteio: !temaSeguro.layout.visivel.localSorteio } 
                      } 
                    })}
                    className={`w-10 h-5 rounded-full relative transition-colors ${temaSeguro.layout.visivel.localSorteio !== false ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${temaSeguro.layout.visivel.localSorteio !== false ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              {/* Reordenação de Blocos */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Ordem dos Blocos da Página
                </label>
                <div className="space-y-2">
                  {ordemAtual.map((blocoId, idx) => {
                    const info = BLOCOS_DISPONIVEIS.find(b => b.id === blocoId) || { nome: blocoId, descricao: '', icone: '📦' };
                    const visivel = temaSeguro.layout.visivel[blocoId] !== false;
                    const isDragging = draggedIdx === idx;

                    return (
                      <div 
                        key={blocoId}
                        draggable={true}
                        onDragStart={() => setDraggedIdx(idx)}
                        onDragOver={e => e.preventDefault()}
                        onDragEnter={() => {
                          if (draggedIdx !== null && draggedIdx !== idx) {
                            const novaOrdem = [...ordemAtual];
                            const draggedItem = novaOrdem[draggedIdx];
                            novaOrdem.splice(draggedIdx, 1);
                            novaOrdem.splice(idx, 0, draggedItem);
                            setDraggedIdx(idx);
                            atualizarTema({ layout: { ...temaSeguro.layout, ordem: novaOrdem } });
                          }
                        }}
                        onDragEnd={() => setDraggedIdx(null)}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition cursor-grab active:cursor-grabbing ${
                          isDragging 
                            ? 'bg-slate-900 border-emerald-500/50 opacity-40 scale-[0.98]' 
                            : visivel 
                              ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700/80 hover:bg-slate-900/60' 
                              : 'bg-slate-950/30 border-slate-900 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-slate-500 pointer-events-none" />
                          <span className="text-lg">{info.icone}</span>
                          <div>
                            <span className="text-xs font-bold text-white block">{info.nome}</span>
                            <span className="text-[10px] text-slate-400 block">{info.descricao}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const v = { ...temaSeguro.layout.visivel };
                              v[blocoId] = !visivel;
                              atualizarTema({ layout: { ...temaSeguro.layout, visivel: v } });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              visivel ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {visivel ? 'Visível' : 'Oculto'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          
          {/* SEÇÃO ESTILOS SALVOS E PRESETS */}
          {secaoEditor === 'estilos' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-sm space-y-5 animate-in fade-in">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Temas Prontos
                  </h3>
                  <p className="text-xs text-slate-400">
                    Escolha um dos presets para aplicar rapidamente.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => atualizarTema(preset.tema)}
                      className="p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500 rounded-xl transition text-left flex flex-col gap-2"
                    >
                      <div className="flex gap-1.5 h-6 w-full rounded-md overflow-hidden" style={{ backgroundColor: preset.tema.cores.fundo }}>
                        <div className="w-1/3 h-full" style={{ backgroundColor: preset.tema.cores.primaria }}></div>
                        <div className="w-2/3 h-full" style={{ backgroundColor: preset.tema.cores.cardFundo }}></div>
                      </div>
                      <span className="text-xs font-bold text-white block mt-1">{preset.nome}</span>
                    </button>
                  ))}
                </div>
              </div>


            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-sm space-y-5 animate-in fade-in">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <FolderHeart className="w-4 h-4 text-emerald-400" />
                    Estilos Salvos na Nuvem
                  </h3>
                  <p className="text-xs text-slate-400">
                    Aplique temas salvos anteriormente com um clique.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalNovoEstiloAberto(true)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition"
                >
                  Novo Estilo
                </button>
              </div>

              {carregandoEstilos ? (
                <div className="p-8 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                  <p className="text-xs">Carregando seus estilos...</p>
                </div>
              ) : estilosSalvos.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Bookmark className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-medium">Nenhum estilo salvo encontrado. Clique em "Novo Estilo" para salvar o tema atual.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {estilosSalvos.map(est => (
                    <div key={est.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-white text-xs block">{est.nome}</span>
                        <span className="text-[10px] text-slate-500 block">Salvo em: {new Date(est.criadoEm).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAplicarEstilo(est)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>
          )}

        </div>

        {/* COLUNA DA DIREITA: PRÉVIA AO VIVO */}
        {mostrarPreview && (
          <div className={`lg:col-span-5 ${visualizacaoMobile === 'controles' ? 'hidden lg:block' : 'block'}`}>
            <div className="sticky top-20 bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Visualização da Página
                  </span>
                </div>
                {/* Toggle Mobile / Desktop da prévia */}
                <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5 gap-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewDispositivo('mobile')}
                    title="Ver como celular"
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition ${previewDispositivo === 'mobile' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Smartphone className="w-3 h-3" /> Celular
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDispositivo('desktop')}
                    title="Ver como computador"
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition ${previewDispositivo === 'desktop' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Eye className="w-3 h-3" /> Computador
                  </button>
                </div>
              </div>

              <div
                className="w-full h-[720px] bg-slate-950 rounded-2xl overflow-y-auto overflow-x-hidden relative border border-slate-800 shadow-inner custom-scrollbar"
                style={{
                  backgroundColor: temaSeguro.cores.fundo || '#020617',
                }}
              >
                <div className={`${previewDispositivo === 'mobile' ? 'max-w-[430px]' : 'max-w-full'} mx-auto min-h-full pb-20 transition-all duration-300`}>
                  <ErrorBoundary titulo="Erro na prévia do tema" resetKey={temaSeguro}>
                    <CampanhaPublicaView
                      modoPreview={true}
                      previewCampanha={campanhaPreview}
                      previewTema={temaSeguro}
                    />
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modal para Salvar Novo Estilo */}
      {modalNovoEstiloAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-black text-white">Salvar Tema como Estilo Reutilizável</h3>
              <button onClick={() => setModalNovoEstiloAberto(false)} className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarEstilo} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">Nome do Estilo (Ex: Neon Cyberpunk, Minimalista Luxo)</label>
                <input
                  type="text"
                  value={nomeNovoEstilo}
                  onChange={e => setNomeNovoEstilo(e.target.value)}
                  placeholder="Nome do estilo..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalNovoEstiloAberto(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoEstilo || !nomeNovoEstilo.trim()}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  {salvandoEstilo ? 'Salvando...' : 'Salvar Estilo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewAnimacao && (
        <CelebrationPreview
          estilo={previewAnimacao}
          onClose={() => setPreviewAnimacao(null)}
        />
      )}
    </div>
  );
};

export default TemaBuilderView;
