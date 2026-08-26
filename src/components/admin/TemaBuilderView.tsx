import React, { useState, useEffect } from 'react';
import { Campanha, TemaCampanha, TEMA_PADRAO, EstiloSalvo, CheckoutConfig, DEFAULT_CHECKOUT_CONFIG, GOOGLE_FONTS_LIST } from '../../types';
import { CampanhaPublicaView } from '../CampanhaPublicaView';
import { ErrorBoundary } from '../ErrorBoundary';
import { 
  Palette, Sparkles, Smartphone, Eye, GripVertical, Check, 
  RotateCcw, Save, Trash2, ArrowUp, ArrowDown, Layers, 
  Type, MousePointer, ShieldCheck, ChevronRight, Layout, 
  Sliders, X, RefreshCw, Bookmark, FolderHeart, CheckCircle2,
  CreditCard, QrCode, FileText, CheckCheck, AlertCircle, Shield, Image as ImageIcon, Video, User, ShoppingCart
} from 'lucide-react';
import { auth } from '../../lib/firebase';

const PRESETS = [
  {
    nome: 'Dark Moderno',
    tema: { ...TEMA_PADRAO }
  },
  {
    nome: 'Padrão Claro',
    tema: { ...TEMA_PADRAO, cores: { primaria: '#10b981', destaque: '#059669', fundo: '#f8fafc', texto: '#0f172a', titulos: '#020617', descricoes: '#475569', botao: '#10b981', textoBotao: '#ffffff', cardFundo: '#ffffff', cardBorda: '#e2e8f0', faviconFundo: '#10b981', iconeCor: '#10b981' } }
  },
  {
    nome: 'Oceano Azul',
    tema: { ...TEMA_PADRAO, cores: { primaria: '#3b82f6', destaque: '#2563eb', fundo: '#0a192f', texto: '#e2e8f0', titulos: '#ffffff', descricoes: '#94a3b8', botao: '#3b82f6', textoBotao: '#ffffff', cardFundo: '#112240', cardBorda: '#1e293b', faviconFundo: '#3b82f6', iconeCor: '#3b82f6' } }
  },
  {
    nome: 'Floresta Verde',
    tema: { ...TEMA_PADRAO, cores: { primaria: '#22c55e', destaque: '#16a34a', fundo: '#064e3b', texto: '#ecfdf5', titulos: '#ffffff', descricoes: '#a7f3d0', botao: '#22c55e', textoBotao: '#064e3b', cardFundo: '#065f46', cardBorda: '#047857', faviconFundo: '#22c55e', iconeCor: '#22c55e' } }
  },
  {
    nome: 'Dourado Escuro',
    tema: { ...TEMA_PADRAO, cores: { primaria: '#eab308', destaque: '#ca8a04', fundo: '#18181b', texto: '#fafafa', titulos: '#ffffff', descricoes: '#a1a1aa', botao: '#eab308', textoBotao: '#18181b', cardFundo: '#27272a', cardBorda: '#3f3f46', faviconFundo: '#eab308', iconeCor: '#eab308' } }
  },
  {
    nome: 'Roxo Escuro',
    tema: { ...TEMA_PADRAO, cores: { primaria: '#a855f7', destaque: '#9333ea', fundo: '#2e1065', texto: '#f3e8ff', titulos: '#ffffff', descricoes: '#d8b4fe', botao: '#a855f7', textoBotao: '#ffffff', cardFundo: '#3b0764', cardBorda: '#581c87', faviconFundo: '#a855f7', iconeCor: '#a855f7' } }
  }
];


interface Props {
  campanha: Partial<Campanha>;
  onChangeCampanha?: (updater: (prev: Partial<Campanha>) => Partial<Campanha>) => void;
  tema: TemaCampanha;
  onChangeTema: (novoTema: TemaCampanha) => void;
  onSalvar?: (e?: React.FormEvent) => void;
  salvando?: boolean;
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

export const TemaBuilderView: React.FC<Props> = ({
  campanha,
  onChangeCampanha,
  tema,
  onChangeTema,
  onSalvar,
  salvando = false
}) => {
  const [visualizacaoMobile, setVisualizacaoMobile] = useState<'controles' | 'preview'>('controles');
  const [secaoEditor, setSecaoEditor] = useState<'cores' | 'botao' | 'tipografia' | 'blocos' | 'organizador' | 'estilos'>('cores');

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const [estilosSalvos, setEstilosSalvos] = useState<EstiloSalvo[]>([]);
  const [carregandoEstilos, setCarregandoEstilos] = useState(false);
  const [salvandoEstilo, setSalvandoEstilo] = useState(false);
  const [nomeNovoEstilo, setNomeNovoEstilo] = useState('');
  const [modalNovoEstiloAberto, setModalNovoEstiloAberto] = useState(false);
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
    },
    botao: {
      formato: tema?.botao?.formato || TEMA_PADRAO.botao.formato,
      tamanhoAltura: tema?.botao?.tamanhoAltura ?? TEMA_PADRAO.botao.tamanhoAltura,
      tamanhoTexto: tema?.botao?.tamanhoTexto ?? TEMA_PADRAO.botao.tamanhoTexto,
      estilo: tema?.botao?.estilo || TEMA_PADRAO.botao.estilo,
      estiloPacotes: tema?.botao?.estiloPacotes || TEMA_PADRAO.botao.estiloPacotes,
      estiloCotas: tema?.botao?.estiloCotas || TEMA_PADRAO.botao.estiloCotas,
      textoCompra: tema?.botao?.textoCompra || TEMA_PADRAO.botao.textoCompra,
    },
    tipografia: {
      fonteTitulo: tema?.tipografia?.fonteTitulo || TEMA_PADRAO.tipografia.fonteTitulo,
      fonteTexto: tema?.tipografia?.fonteTexto || TEMA_PADRAO.tipografia.fonteTexto,
      tamanhoTitulo: (tema?.tipografia?.tamanhoTitulo ?? TEMA_PADRAO.tipografia.tamanhoTitulo),
      tamanhoTexto: (tema?.tipografia?.tamanhoTexto ?? TEMA_PADRAO.tipografia.tamanhoTexto),
    },
    fundoMidia: {
      tipo: tema?.fundoMidia?.tipo || TEMA_PADRAO.fundoMidia?.tipo || 'cor',
      url: tema?.fundoMidia?.url || TEMA_PADRAO.fundoMidia?.url || '',
    },
    organizadorCabecalho: {
      logoTamanho: (tema?.organizadorCabecalho?.logoTamanho ?? TEMA_PADRAO.organizadorCabecalho?.logoTamanho) || 40,
      logoAlinhamento: tema?.organizadorCabecalho?.logoAlinhamento || TEMA_PADRAO.organizadorCabecalho?.logoAlinhamento || 'centro',
    },
    ganhadorCelebracaoEstilo: tema?.ganhadorCelebracaoEstilo || TEMA_PADRAO.ganhadorCelebracaoEstilo || 'confetes',
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
      tipografia: { ...temaSeguro.tipografia, ...(parcial.tipografia || {}) },
      fundoMidia: { ...temaSeguro.fundoMidia, ...(parcial.fundoMidia || {}) },
      organizadorCabecalho: { ...temaSeguro.organizadorCabecalho, ...(parcial.organizadorCabecalho || {}) },
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

  const handleRestaurarPadrao = () => {
    if (window.confirm('Deseja restaurar todas as cores, botão e layout para o Tema Padrão?')) {
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
        alert('Faça login para salvar seus estilos.');
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
        alert(err.error || 'Erro ao salvar estilo.');
      }
    } catch (err: any) {
      alert('Falha ao conectar com o servidor para salvar o estilo.');
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
    totalCotas: campanha.totalCotas || 10000,
    valorCota: campanha.valorCota || 0.50,
    minPorCompra: campanha.minPorCompra || 5,
    maxPorCompra: campanha.maxPorCompra || 1000,
    localSorteio: campanha.localSorteio || 'Loteria Federal',
    dataSorteio: campanha.dataSorteio || null,
    tempoReservaMin: campanha.tempoReservaMin || 15,
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
    premios: [
      { posicao: 1, descricao: 'iPhone 16 Pro Max 256GB Lacrado' },
      { posicao: 2, descricao: 'R$ 2.500,00 no Pix Instantâneo' },
      { posicao: 3, descricao: 'AirPods Pro 2ª Geração' }
    ],
    cotasPremiadas: [
      { numero: '00123', premio: 'R$ 500 no Pix', status: 'disponivel', pedidoId: null },
      { numero: '04567', premio: 'R$ 250 no Pix', status: 'disponivel', pedidoId: null },
      { numero: '08999', premio: 'R$ 100 no Pix', status: 'disponivel', pedidoId: null }
    ],
    promocoes: [
      { quantidade: 10, valor: 4.50, destaque: false },
      { quantidade: 50, valor: 20.00, destaque: true },
      { quantidade: 100, valor: 35.00, destaque: false }
    ],
    ofertasRelampago: campanha.ofertasRelampago || [],
    checkout: (campanha as any).checkout || DEFAULT_CHECKOUT_CONFIG,
    criadaEm: campanha.criadaEm || '2026-01-01T00:00:00.000Z',
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
            <h2 className="text-base font-black text-white">
              Personalizador Visual de Tema & Layout
            </h2>
            <p className="text-xs text-slate-400">
              Personalize cores, fontes, botões e ordem dos blocos com prévia em tempo real.
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
                <span>{salvando ? 'Salvando...' : 'Salvar Alterações'}</span>
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUNA DA ESQUERDA: CONTROLES DO TEMA */}
        <div className={`lg:col-span-7 space-y-4 ${visualizacaoMobile === 'preview' ? 'hidden lg:block' : 'block'}`}>
          
          {/* Navegação entre seções */}
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            {[
              { id: 'cores', label: 'Cores', icon: Palette },
              { id: 'botao', label: 'Botões', icon: MousePointer },
              { id: 'tipografia', label: 'Fontes', icon: Type },
              { id: 'blocos', label: 'Blocos', icon: Layout },
              { id: 'organizador', label: 'Logo / Topo', icon: User },
              { id: 'checkout', label: 'Checkout', icon: ShoppingCart },
              { id: 'estilos', label: 'Estilos', icon: FolderHeart },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSecaoEditor(tab.id as any)}
                  className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                    secaoEditor === tab.id
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="truncate text-[10px]">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* 1. SEÇÃO CORES */}
          {secaoEditor === 'cores' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 animate-in fade-in">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-400" />
                  Paleta de Cores Completa
                </h3>
                <p className="text-xs text-slate-400">
                  Personalize cada detalhe cromático da página pública de sua campanha.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  { key: 'primaria', label: 'Cor Primária / Destaques', desc: 'Badges e elementos principais' },
                  { key: 'destaque', label: 'Cor Destaque Secundário', desc: 'Gradientes e ênfases' },
                  { key: 'fundo', label: 'Cor de Fundo da Página', desc: 'Fundo principal da tela' },
                  { key: 'texto', label: 'Cor do Texto Geral', desc: 'Parágrafos e informações' },
                  { key: 'titulos', label: 'Cor dos Títulos', desc: 'Cabeçalhos e nomes de prêmios' },
                  { key: 'descricoes', label: 'Cor das Descrições', desc: 'Subtítulos e textos secundários' },
                  { key: 'botao', label: 'Fundo do Botão de Compra', desc: 'Botão CTA principal' },
                  { key: 'textoBotao', label: 'Texto do Botão de Compra', desc: 'Texto legível sobre o botão' },
                  { key: 'cardFundo', label: 'Fundo dos Cards', desc: 'Blocos de pacotes e prêmios' },
                  { key: 'cardBorda', label: 'Borda dos Cards', desc: 'Delimitação de caixas e modais' },
                  { key: 'faviconFundo', label: 'Fundo do Ícone / Favicon', desc: 'Badges circulares de ícones' },
                  { key: 'iconeCor', label: 'Cor dos Ícones e Símbolos', desc: 'Símbolos de regulamento e prêmios' },
                ].map(item => {
                  const val = (temaSeguro.cores as any)[item.key];
                  return (
                    <div key={item.key} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-200">{item.label}</label>
                        <span className="text-[10px] text-slate-500 font-mono uppercase">{val}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
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
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white uppercase focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. SEÇÃO BOTÃO CTA */}
          {secaoEditor === 'botao' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 animate-in fade-in">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <MousePointer className="w-4 h-4 text-emerald-400" />
                  Estilo e Formato dos Botões
                </h3>
                <p className="text-xs text-slate-400">
                  Configure cantos, tamanhos, estilos Linktree (transparente, 3D, vidro) e o texto de compra.
                </p>
              </div>

              {/* Texto do Botão de Compra */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Texto do Botão de Compra
                </label>
                <input
                  type="text"
                  value={temaSeguro.botao.textoCompra}
                  onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, textoCompra: e.target.value } })}
                  placeholder="Ex: GARANTIR MEUS NÚMEROS"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none font-bold"
                />
              </div>

               {/* Formato dos Botões (Square, Rounded, Pilled, Round) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Formato do Botão (Square, Rounded, Pilled, Round)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'square', label: 'Square', shape: 'rounded-none' },
                    { id: 'rounded', label: 'Rounded', shape: 'rounded-xl' },
                    { id: 'pilled', label: 'Pilled', shape: 'rounded-full px-4' },
                    { id: 'round', label: 'Round', shape: 'rounded-full aspect-square w-10 h-10' },
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => atualizarTema({ botao: { ...temaSeguro.botao, formato: f.id as any } })}
                      className={`p-3 border text-center transition flex flex-col items-center justify-center gap-2 rounded-xl ${
                        temaSeguro.botao.formato === f.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-sm'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-8 h-4 bg-emerald-500 flex items-center justify-center ${f.shape}`} />
                      <span className="text-[11px] font-bold">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Estilo Visual do Botão (Solid, Glass, Transparent, 3D) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Estilo do Botão (Solid, Glass, Transparent, 3D)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'solido', label: 'Solid' },
                    { id: 'vidro', label: 'Glass' },
                    { id: 'transparente', label: 'Transparent' },
                    { id: '3d', label: '3D' },
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => atualizarTema({ botao: { ...temaSeguro.botao, estilo: st.id as any } })}
                      className={`py-2 px-2.5 border text-center text-xs font-bold rounded-xl transition ${
                        temaSeguro.botao.estilo === st.id
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Configurações Avançadas de Sombra quando 3D */}
              {temaSeguro.botao.estilo === '3d' && (
                <div className="p-4 bg-slate-950/90 border border-emerald-500/30 rounded-xl space-y-3 animate-in fade-in">
                  <h4 className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                    ⚙️ Configuração do Efeito 3D (Sombra & Altura)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300 font-bold">Altura da Sombra (Elevado)</span>
                        <span className="font-mono text-emerald-400">{temaSeguro.botao.sombraAltura ?? 4}px</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={temaSeguro.botao.sombraAltura ?? 4}
                        onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, sombraAltura: Number(e.target.value) } })}
                        className="w-full accent-emerald-500 bg-slate-900 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300 font-bold">Largura / Offset da Sombra</span>
                        <span className="font-mono text-emerald-400">{temaSeguro.botao.sombraLargura ?? 4}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={temaSeguro.botao.sombraLargura ?? 4}
                        onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, sombraLargura: Number(e.target.value) } })}
                        className="w-full accent-emerald-500 bg-slate-900 cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">Cor da Sombra 3D</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={temaSeguro.botao.corSombra || '#047857'}
                        onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, corSombra: e.target.value } })}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={temaSeguro.botao.corSombra || '#047857'}
                        onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, corSombra: e.target.value } })}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sliders de Altura e Tamanho de Texto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-300">Altura / Padding do Botão</span>
                    <span className="font-mono text-emerald-400">{temaSeguro.botao.tamanhoAltura}px</span>
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
                    <span className="font-bold text-slate-300">Tamanho da Fonte do Botão</span>
                    <span className="font-mono text-emerald-400">{temaSeguro.botao.tamanhoTexto}px</span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="22"
                    value={temaSeguro.botao.tamanhoTexto}
                    onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, tamanhoTexto: Number(e.target.value) } })}
                    className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
                  />
                </div>
              </div>

              {/* Estilos específicos para Pacotes e Cotas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Estilo dos Botões de Pacotes Promocionais</label>
                  <select
                    value={temaSeguro.botao.estiloPacotes || 'solido'}
                    onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, estiloPacotes: e.target.value as any } })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="solido">Sólido</option>
                    <option value="gradiente">Gradiente</option>
                    <option value="vidro">Vidro / Glass</option>
                    <option value="transparente">Transparente</option>
                    <option value="3d">3D</option>
                    <option value="neon">Neon</option>
                    <option value="outline">Outline</option>
                    <option value="soft">Soft</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Estilo da Grade de Cotas</label>
                  <select
                    value={temaSeguro.botao.estiloCotas || 'solido'}
                    onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, estiloCotas: e.target.value as any } })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="solido">Sólido</option>
                    <option value="vidro">Vidro</option>
                    <option value="outline">Outline</option>
                    <option value="soft">Soft</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 3. SEÇÃO TIPOGRAFIA */}
          {secaoEditor === 'tipografia' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 animate-in fade-in">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Type className="w-4 h-4 text-emerald-400" />
                  Tipografia & 20 Fontes do Google
                </h3>
                <p className="text-xs text-slate-400">
                  Escolha fontes distintas para títulos e textos, com controles de escala.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Fonte dos Títulos (20 opções)</label>
                  <select
                    value={temaSeguro.tipografia.fonteTitulo}
                    onChange={e => atualizarTema({ tipografia: { ...temaSeguro.tipografia, fonteTitulo: e.target.value } })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {GOOGLE_FONTS_LIST.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Fonte dos Textos (20 opções)</label>
                  <select
                    value={temaSeguro.tipografia.fonteTexto}
                    onChange={e => atualizarTema({ tipografia: { ...temaSeguro.tipografia, fonteTexto: e.target.value } })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {GOOGLE_FONTS_LIST.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-300">Tamanho Base Títulos</span>
                    <span className="font-mono text-emerald-400">{temaSeguro.tipografia.tamanhoTitulo}px</span>
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

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-300">Tamanho Base Textos</span>
                    <span className="font-mono text-emerald-400">{temaSeguro.tipografia.tamanhoTexto}px</span>
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
          )}

          {/* 4. SEÇÃO BLOCOS E FUNDO */}
          {secaoEditor === 'blocos' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 animate-in fade-in">
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
                    { id: 'imagem', label: 'Imagem URL' },
                    { id: 'video', label: 'Vídeo Loop (MP4)' },
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
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] text-slate-400 block">
                      URL da {temaSeguro.fundoMidia?.tipo === 'video' ? 'Vídeo (MP4/WebM)' : 'Imagem de Fundo'}
                    </label>
                    <input
                      type="url"
                      value={temaSeguro.fundoMidia?.url || ''}
                      onChange={e => atualizarTema({ fundoMidia: { ...temaSeguro.fundoMidia, url: e.target.value } })}
                      placeholder={temaSeguro.fundoMidia?.tipo === 'video' ? 'https://.../video.mp4' : 'https://.../background.jpg'}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Estilo de Celebração de Ganhadores */}
              <div className="space-y-2 p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                <label className="text-xs font-bold text-white block">
                  Estilo de Comemoração de Ganhadores / Cotas Premiadas
                </label>
                <select
                  value={temaSeguro.ganhadorCelebracaoEstilo || 'confetes'}
                  onChange={e => atualizarTema({ ganhadorCelebracaoEstilo: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="confetes">🎉 Chuva de Confetes</option>
                  <option value="estrela">⭐ Explosão de Estrelas</option>
                  <option value="fogo">🔥 Efeito Chamas / Fogo</option>
                  <option value="coracao">💖 Corações Amados</option>
                  <option value="moeda">🪙 Moedas de Ouro</option>
                  <option value="trofeu">🏆 Troféu de Ouro</option>
                  <option value="diamante">💎 Diamantes Brilhantes</option>
                  <option value="raio">⚡ Raios de Energia</option>
                  <option value="coroa">👑 Coroa Real</option>
                  <option value="foguete">🚀 Foguete ao Espaço</option>
                </select>
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

                    return (
                      <div 
                        key={blocoId}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                          visivel ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-950/30 border-slate-900 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
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
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                              visivel ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {visivel ? 'Visível' : 'Oculto'}
                          </button>

                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moverBloco(idx, 'cima')}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 rounded-lg text-slate-300"
                            title="Mover para cima"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === ordemAtual.length - 1}
                            onClick={() => moverBloco(idx, 'baixo')}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 rounded-lg text-slate-300"
                            title="Mover para baixo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 5. SEÇÃO LOGO E TOPO */}
          {secaoEditor === 'organizador' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 animate-in fade-in">
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
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-300">Tamanho da Logo no Topo</span>
                    <span className="font-mono text-emerald-400">{temaSeguro.organizadorCabecalho?.logoTamanho || 40}px</span>
                  </div>
                  <input
                    type="range"
                    min="28"
                    max="64"
                    value={temaSeguro.organizadorCabecalho?.logoTamanho || 40}
                    onChange={e => atualizarTema({ organizadorCabecalho: { ...temaSeguro.organizadorCabecalho, logoTamanho: Number(e.target.value) } })}
                    className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
                  />
                </div>

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

          
          {/* SEÇÃO CHECKOUT E PAGAMENTO */}
          {secaoEditor === 'checkout' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 animate-in fade-in">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-emerald-400" />
                  Estrutura e Campos do Checkout
                </h3>
                <p className="text-xs text-slate-400">
                  Configure o layout do checkout, quais dados coletar do cliente e opções de pagamento.
                </p>
              </div>

              <div className="space-y-4">
                {/* Layout */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Modelo do Checkout</label>
                  <select
                    value={campanha.checkout?.layout || 'padrao'}
                    onChange={e => onChangeCampanha(prev => ({ ...prev, checkout: { ...(campanha.checkout || DEFAULT_CHECKOUT_CONFIG), layout: e.target.value as any } }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-emerald-500"
                  >
                    <option value="padrao">Checkout Original</option>
                    <option value="limpo">Checkout Limpo (Foco em Conversão)</option>
                    <option value="passos">Passo-a-Passo (Simplificado)</option>
                    <option value="rapido">Checkout Rápido (Com Urgência)</option>
                  </select>
                </div>

                {/* Coleta de Dados */}
                <div className="space-y-2 pt-3 border-t border-slate-800/50">
                  <label className="text-xs font-bold text-slate-300 block">Coleta de Dados</label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-emerald-500 w-4 h-4"
                      checked={campanha.checkout?.coletaDados?.exigirEmail ?? false}
                      onChange={e => onChangeCampanha(prev => ({ ...prev, checkout: { ...(campanha.checkout || DEFAULT_CHECKOUT_CONFIG), coletaDados: { ...(campanha.checkout?.coletaDados), exigirEmail: e.target.checked } } }))}
                    />
                    <span className="text-xs text-slate-400">Coletar E-mail</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-emerald-500 w-4 h-4"
                      checked={campanha.checkout?.coletaDados?.confirmarEmail ?? false}
                      onChange={e => onChangeCampanha(prev => ({ ...prev, checkout: { ...(campanha.checkout || DEFAULT_CHECKOUT_CONFIG), coletaDados: { ...(campanha.checkout?.coletaDados), confirmarEmail: e.target.checked } } }))}
                    />
                    <span className="text-xs text-slate-400">Exigir confirmação de E-mail</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-emerald-500 w-4 h-4"
                      checked={campanha.checkout?.coletaDados?.exigirCpf ?? false}
                      onChange={e => onChangeCampanha(prev => ({ ...prev, checkout: { ...(campanha.checkout || DEFAULT_CHECKOUT_CONFIG), coletaDados: { ...(campanha.checkout?.coletaDados), exigirCpf: e.target.checked } } }))}
                    />
                    <span className="text-xs text-slate-400">Coletar CPF</span>
                  </label>
                </div>

                
                {/* Timer de Urgência */}
                <div className="space-y-3 pt-3 border-t border-slate-800/50">
                  <label className="text-xs font-bold text-slate-300 block">Timer de Urgência no Checkout</label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-emerald-500 w-4 h-4"
                      checked={campanha.checkout?.timerUrgencia?.ativo ?? false}
                      onChange={e => onChangeCampanha(prev => ({ ...prev, checkout: { ...(prev.checkout || DEFAULT_CHECKOUT_CONFIG), timerUrgencia: { ...(prev.checkout?.timerUrgencia), ativo: e.target.checked } } }))}
                    />
                    <span className="text-xs text-slate-400">Ativar cronômetro de escassez</span>
                  </label>

                  {campanha.checkout?.timerUrgencia?.ativo && (
                    <div className="pl-6 space-y-2">
                      <label className="text-[11px] text-slate-400 block">Duração (Minutos)</label>
                      <input 
                        type="number"
                        min="1"
                        max="60"
                        value={campanha.checkout?.timerUrgencia?.minutos || 10}
                        onChange={e => onChangeCampanha(prev => ({ ...prev, checkout: { ...(prev.checkout || DEFAULT_CHECKOUT_CONFIG), timerUrgencia: { ...(prev.checkout?.timerUrgencia), minutos: parseInt(e.target.value) } } }))}
                        className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>

                {/* Métodos de Pagamento */}
                <div className="space-y-2 pt-3 border-t border-slate-800/50">
                  <label className="text-xs font-bold text-slate-300 block">Formas de Pagamento Habilitadas</label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-emerald-500 w-4 h-4"
                      checked={campanha.checkout?.metodos?.pix ?? true}
                      onChange={e => onChangeCampanha(prev => ({ ...prev, checkout: { ...(campanha.checkout || DEFAULT_CHECKOUT_CONFIG), metodos: { ...(campanha.checkout?.metodos), pix: e.target.checked } } }))}
                    />
                    <span className="text-xs text-slate-400">Pix</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-emerald-500 w-4 h-4"
                      checked={campanha.checkout?.metodos?.cartao ?? true}
                      onChange={e => onChangeCampanha(prev => ({ ...prev, checkout: { ...(campanha.checkout || DEFAULT_CHECKOUT_CONFIG), metodos: { ...(campanha.checkout?.metodos), cartao: e.target.checked } } }))}
                    />
                    <span className="text-xs text-slate-400">Cartão de Crédito</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-emerald-500 w-4 h-4"
                      checked={campanha.checkout?.metodos?.boleto ?? false}
                      onChange={e => onChangeCampanha(prev => ({ ...prev, checkout: { ...(campanha.checkout || DEFAULT_CHECKOUT_CONFIG), metodos: { ...(campanha.checkout?.metodos), boleto: e.target.checked } } }))}
                    />
                    <span className="text-xs text-slate-400">Boleto</span>
                  </label>
                </div>

                {/* Configurações Avançadas do Pix */}
                {campanha.checkout?.metodos?.pix !== false && (
                  <div className="space-y-3 pt-3 border-t border-slate-800/50">
                    <label className="text-xs font-bold text-slate-300 block">Configurações Avançadas do Pix</label>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Desconto (%)</label>
                        <input 
                          type="number"
                          min="0"
                          max="100"
                          placeholder="Ex: 5"
                          value={campanha.checkout?.pixConfig?.descontoPct || ''}
                          onChange={e => onChangeCampanha(prev => ({ ...prev, checkout: { ...(prev.checkout || DEFAULT_CHECKOUT_CONFIG), pixConfig: { ...(prev.checkout?.pixConfig), descontoPct: parseFloat(e.target.value) || undefined } } }))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Ordem Gateways (Cascata)</label>
                        <select
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-emerald-500"
                        >
                          <option>Mercado Pago - Padrão</option>
                          <option>PushInPay &gt; Mercado Pago</option>
                          <option>Suitpay &gt; PushInPay</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          
          {/* SEÇÃO ESTILOS SALVOS E PRESETS */}
          {secaoEditor === 'estilos' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 animate-in fade-in">
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


            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 animate-in fade-in">
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
        <div className={`lg:col-span-5 ${visualizacaoMobile === 'controles' ? 'hidden lg:block' : 'block'}`}>
          <div className="sticky top-20 bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 px-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-extrabold text-white tracking-wide uppercase">Prévia ao Vivo em Tempo Real</span>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">Modo Live Preview</span>
            </div>

            {/* Container Iframe-like do Preview (protegido por ErrorBoundary p/ nunca dar tela branca) */}
            <div className="bg-slate-950 rounded-2xl border-4 border-slate-800 overflow-hidden shadow-inner max-h-[720px] overflow-y-auto">
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
    </div>
  );
};
