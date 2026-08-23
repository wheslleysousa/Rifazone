import React, { useState, useEffect } from 'react';
import { Campanha, TemaCampanha, TEMA_PADRAO, EstiloSalvo, CheckoutConfig, DEFAULT_CHECKOUT_CONFIG } from '../../types';
import { CampanhaPublicaView } from '../CampanhaPublicaView';
import { 
  Palette, Sparkles, Smartphone, Eye, GripVertical, Check, 
  RotateCcw, Save, Trash2, ArrowUp, ArrowDown, Layers, 
  Type, MousePointer, ShieldCheck, ChevronRight, Layout, 
  Sliders, X, RefreshCw, Bookmark, FolderHeart, CheckCircle2,
  CreditCard, QrCode, FileText, CheckCheck, AlertCircle, Shield
} from 'lucide-react';
import { auth } from '../../lib/firebase';

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
  { id: 'banner', nome: 'Banner & Título', descricao: 'Foto de destaque, selo oficial e título do sorteio', icone: '🖼️' },
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
  // Mobile tab toggle (controles vs preview)
  const [visualizacaoMobile, setVisualizacaoMobile] = useState<'controles' | 'preview'>('controles');
  
  // Seção ativa do editor: 'cores' | 'botao' | 'tipografia' | 'blocos' | 'checkout' | 'estilos'
  const [secaoEditor, setSecaoEditor] = useState<'cores' | 'botao' | 'tipografia' | 'blocos' | 'checkout' | 'estilos'>('cores');

  // Drag & drop de blocos
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Estilos Salvos
  const [estilosSalvos, setEstilosSalvos] = useState<EstiloSalvo[]>([]);
  const [carregandoEstilos, setCarregandoEstilos] = useState(false);
  const [salvandoEstilo, setSalvandoEstilo] = useState(false);
  const [nomeNovoEstilo, setNomeNovoEstilo] = useState('');
  const [modalNovoEstiloAberto, setModalNovoEstiloAberto] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Checkout Config seguro
  const checkoutSeguro: CheckoutConfig = {
    metodos: {
      pix: campanha?.checkout?.metodos?.pix ?? DEFAULT_CHECKOUT_CONFIG.metodos.pix,
      cartao: campanha?.checkout?.metodos?.cartao ?? DEFAULT_CHECKOUT_CONFIG.metodos.cartao,
      boleto: campanha?.checkout?.metodos?.boleto ?? DEFAULT_CHECKOUT_CONFIG.metodos.boleto,
    },
    parcelasMax: campanha?.checkout?.parcelasMax ?? DEFAULT_CHECKOUT_CONFIG.parcelasMax,
    taxaParcelamento: campanha?.checkout?.taxaParcelamento ?? DEFAULT_CHECKOUT_CONFIG.taxaParcelamento,
    mensagens: {
      topo: campanha?.checkout?.mensagens?.topo ?? DEFAULT_CHECKOUT_CONFIG.mensagens.topo,
      pix: campanha?.checkout?.mensagens?.pix ?? DEFAULT_CHECKOUT_CONFIG.mensagens.pix,
      cartao: campanha?.checkout?.mensagens?.cartao ?? DEFAULT_CHECKOUT_CONFIG.mensagens.cartao,
      sucesso: campanha?.checkout?.mensagens?.sucesso ?? DEFAULT_CHECKOUT_CONFIG.mensagens.sucesso,
      urgencia: campanha?.checkout?.mensagens?.urgencia ?? DEFAULT_CHECKOUT_CONFIG.mensagens.urgencia,
    },
    selosSeguranca: campanha?.checkout?.selosSeguranca ?? DEFAULT_CHECKOUT_CONFIG.selosSeguranca,
  };

  const handleUpdateCheckout = (updater: (prev: CheckoutConfig) => CheckoutConfig) => {
    if (onChangeCampanha) {
      onChangeCampanha(prev => ({
        ...prev,
        checkout: updater(prev.checkout || DEFAULT_CHECKOUT_CONFIG)
      }));
    }
  };

  // Garante valores seguros de tema
  const temaSeguro: TemaCampanha = {
    cores: {
      primaria: tema?.cores?.primaria || TEMA_PADRAO.cores.primaria,
      destaque: tema?.cores?.destaque || TEMA_PADRAO.cores.destaque,
      fundo: tema?.cores?.fundo || TEMA_PADRAO.cores.fundo,
      texto: tema?.cores?.texto || TEMA_PADRAO.cores.texto,
      botao: tema?.cores?.botao || TEMA_PADRAO.cores.botao,
      textoBotao: tema?.cores?.textoBotao || TEMA_PADRAO.cores.textoBotao,
    },
    botao: {
      formato: tema?.botao?.formato || TEMA_PADRAO.botao.formato,
      tamanho: tema?.botao?.tamanho || TEMA_PADRAO.botao.tamanho,
      sombra: tema?.botao?.sombra ?? TEMA_PADRAO.botao.sombra,
      cta: tema?.botao?.cta || TEMA_PADRAO.botao.cta,
    },
    tipografia: {
      fonte: tema?.tipografia?.fonte || TEMA_PADRAO.tipografia.fonte,
      tamanhoTitulo: tema?.tipografia?.tamanhoTitulo || TEMA_PADRAO.tipografia.tamanhoTitulo,
    },
    layout: {
      ordem: (tema?.layout?.ordem && tema.layout.ordem.length > 0)
        ? tema.layout.ordem
        : TEMA_PADRAO.layout.ordem,
      visivel: { ...TEMA_PADRAO.layout.visivel, ...(tema?.layout?.visivel || {}) }
    }
  };

  // Carregar estilos salvos da API
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

  // Helper para atualizar campos parciais do tema
  const atualizarTema = (parcial: Partial<TemaCampanha>) => {
    const novoTema: TemaCampanha = {
      ...temaSeguro,
      ...parcial,
      cores: { ...temaSeguro.cores, ...(parcial.cores || {}) },
      botao: { ...temaSeguro.botao, ...(parcial.botao || {}) },
      tipografia: { ...temaSeguro.tipografia, ...(parcial.tipografia || {}) },
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

  // Restaurar padrão
  const handleRestaurarPadrao = () => {
    if (window.confirm('Deseja restaurar todas as cores, botão e ordem dos blocos para o Tema Padrão?')) {
      onChangeTema(TEMA_PADRAO);
      if (onChangeCampanha) {
        onChangeCampanha(prev => ({ ...prev, tema: TEMA_PADRAO }));
      }
      exibirToast('Tema Padrão restaurado com sucesso!');
    }
  };

  // Reordenação de blocos
  const ordemAtual = [...temaSeguro.layout.ordem];
  // Garante que todos os blocos conhecidos estão na lista de ordem
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
      layout: {
        ...temaSeguro.layout,
        ordem: novaOrdem
      }
    });
  };

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIdx: number) => {
    if (draggedIdx === null || draggedIdx === dropIdx) return;
    const novaOrdem = [...ordemAtual];
    const [removido] = novaOrdem.splice(draggedIdx, 1);
    novaOrdem.splice(dropIdx, 0, removido);
    
    setDraggedIdx(null);
    atualizarTema({
      layout: {
        ...temaSeguro.layout,
        ordem: novaOrdem
      }
    });
  };

  const toggleVisibilidadeBloco = (blocoId: string) => {
    const estadoAtual = temaSeguro.layout.visivel[blocoId] !== false;
    atualizarTema({
      layout: {
        ...temaSeguro.layout,
        visivel: {
          ...temaSeguro.layout.visivel,
          [blocoId]: !estadoAtual
        }
      }
    });
  };

  // Salvar novo estilo reutilizável na API
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

  // Aplicar estilo salvo
  const handleAplicarEstilo = (estilo: EstiloSalvo) => {
    onChangeTema(estilo.tema);
    if (onChangeCampanha) {
      onChangeCampanha(prev => ({ ...prev, tema: estilo.tema }));
    }
    exibirToast(`Estilo "${estilo.nome}" aplicado à campanha!`);
  };

  // Excluir estilo salvo
  const handleExcluirEstilo = async (id: string, nome: string) => {
    if (!window.confirm(`Deseja realmente excluir o estilo "${nome}"?`)) return;
    try {
      const u = auth.currentUser;
      if (!u) return;
      const token = await u.getIdToken();
      const res = await fetch(`/api/admin/estilos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setEstilosSalvos(prev => prev.filter(e => e.id !== id));
        exibirToast('Estilo excluído.');
      }
    } catch (err) {
      alert('Erro ao excluir estilo.');
    }
  };

  // Objeto de mock para campanha preview com dados de exemplo se vazios
  const campanhaPreview: Campanha = {
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
    promocoes: (campanha.promocoes && campanha.promocoes.length > 0) ? campanha.promocoes : [],
    descontoPorValorTotal: campanha.descontoPorValorTotal || [],
    ofertasRelampago: campanha.ofertasRelampago || [],
    criadaEm: campanha.criadaEm || new Date().toISOString(),
    tema: temaSeguro
  };

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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                Personalizador Visual de Tema & Layout
              </h2>
              <p className="text-xs text-slate-400">
                Ajuste cores, estilo do botão CTA, tipografia e a ordem dos blocos com prévia em tempo real.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleRestaurarPadrao}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-slate-700/60"
            title="Restaurar configurações padrão"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>

          <button
            type="button"
            onClick={() => setModalNovoEstiloAberto(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-emerald-500/30"
            title="Salvar tema atual como estilo reutilizável"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Salvar como Estilo</span>
          </button>

          {onSalvar && (
            <button
              type="button"
              onClick={onSalvar}
              disabled={salvando}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{salvando ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          )}
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
          <span>Ver Prévia ao Vivo</span>
        </button>
      </div>

      {/* Layout Split-Screen Principal */}
      <div className="flex flex-col gap-8">
        
        {/* COLUNA DA ESQUERDA: CONTROLES DO TEMA (Full width) */}
        <div className={`w-full space-y-4 ${visualizacaoMobile === 'preview' ? 'hidden lg:block' : 'block'}`}>
          
          {/* Navegação entre seções de customização */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setSecaoEditor('cores')}
              className={`py-2 px-1.5 rounded-lg text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition ${
                secaoEditor === 'cores'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="truncate">Cores</span>
            </button>

            <button
              type="button"
              onClick={() => setSecaoEditor('botao')}
              className={`py-2 px-1.5 rounded-lg text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition ${
                secaoEditor === 'botao'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span className="truncate">Botão CTA</span>
            </button>

            <button
              type="button"
              onClick={() => setSecaoEditor('tipografia')}
              className={`py-2 px-1.5 rounded-lg text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition ${
                secaoEditor === 'tipografia'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span className="truncate">Tipografia</span>
            </button>

            <button
              type="button"
              onClick={() => setSecaoEditor('blocos')}
              className={`py-2 px-1.5 rounded-lg text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition ${
                secaoEditor === 'blocos'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span className="truncate">Blocos</span>
            </button>

            <button
              type="button"
              onClick={() => setSecaoEditor('estilos')}
              className={`py-2 px-1.5 rounded-lg text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition ${
                secaoEditor === 'estilos'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FolderHeart className="w-3.5 h-3.5" />
              <span className="truncate">Estilos</span>
            </button>
          </div>

          {/* 1. SEÇÃO CORES */}
          {secaoEditor === 'cores' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 animate-in fade-in">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-400" />
                  Paleta de Cores da Campanha
                </h3>
                <p className="text-xs text-slate-400">
                  Personalize a identidade visual completa da página de sorteio.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Cor Primária */}
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200">
                      Cor Primária / Destaques
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {temaSeguro.cores.primaria}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={temaSeguro.cores.primaria}
                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, primaria: e.target.value } })}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={temaSeguro.cores.primaria}
                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, primaria: e.target.value } })}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white uppercase focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Aplicada em badges, percentual de progresso e valores totais.
                  </p>
                </div>

                {/* Cor de Destaque */}
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200">
                      Cor de Destaque Secundário
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {temaSeguro.cores.destaque}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={temaSeguro.cores.destaque}
                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, destaque: e.target.value } })}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={temaSeguro.cores.destaque}
                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, destaque: e.target.value } })}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white uppercase focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Utilizada em ícones complementares e detalhes de ênfase.
                  </p>
                </div>

                {/* Cor de Fundo */}
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200">
                      Cor de Fundo da Página
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {temaSeguro.cores.fundo}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={temaSeguro.cores.fundo}
                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, fundo: e.target.value } })}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={temaSeguro.cores.fundo}
                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, fundo: e.target.value } })}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white uppercase focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Fundo base da experiência pública (padrão: dark slate).
                  </p>
                </div>

                {/* Cor do Texto */}
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200">
                      Cor do Texto Base
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {temaSeguro.cores.texto}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={temaSeguro.cores.texto}
                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, texto: e.target.value } })}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={temaSeguro.cores.texto}
                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, texto: e.target.value } })}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white uppercase focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Cor principal de títulos e informações textuais.
                  </p>
                </div>

                {/* Cor do Botão CTA */}
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200">
                      Fundo do Botão CTA
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {temaSeguro.cores.botao}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={temaSeguro.cores.botao}
                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, botao: e.target.value } })}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={temaSeguro.cores.botao}
                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, botao: e.target.value } })}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white uppercase focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Cor do botão principal de compra fixo na parte inferior.
                  </p>
                </div>

                {/* Cor do Texto do Botão CTA */}
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200">
                      Texto do Botão CTA
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {temaSeguro.cores.textoBotao}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={temaSeguro.cores.textoBotao}
                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, textoBotao: e.target.value } })}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={temaSeguro.cores.textoBotao}
                      onChange={e => atualizarTema({ cores: { ...temaSeguro.cores, textoBotao: e.target.value } })}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white uppercase focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Garante alto contraste sobre o fundo do botão.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* 2. SEÇÃO BOTÃO CTA */}
          {secaoEditor === 'botao' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 animate-in fade-in">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <MousePointer className="w-4 h-4 text-emerald-400" />
                  Formato e Estilo do Botão de Compra
                </h3>
                <p className="text-xs text-slate-400">
                  Configure o visual do botão flutuante de checkout e conversão.
                </p>
              </div>

              {/* Formato do Botão */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Formato dos Cantos do Botão
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'reto', label: 'Reto', shape: 'rounded-none' },
                    { id: 'arredondado', label: 'Arredondado', shape: 'rounded-xl' },
                    { id: 'pill', label: 'Pílula / Pill', shape: 'rounded-full' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => atualizarTema({ botao: { ...temaSeguro.botao, formato: f.id as any } })}
                      className={`p-3.5 border text-center transition flex flex-col items-center gap-2 rounded-xl ${
                        temaSeguro.botao.formato === f.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-sm'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-16 h-5 bg-emerald-500/80 ${f.shape}`} />
                      <span className="text-xs font-bold">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tamanho do Botão */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Tamanho / Altura do Botão
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'sm', label: 'Compacto (Pequeno)' },
                    { id: 'md', label: 'Padrão (Médio)' },
                    { id: 'lg', label: 'Impacto (Grande)' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => atualizarTema({ botao: { ...temaSeguro.botao, tamanho: t.id as any } })}
                      className={`py-3 px-3 border text-center text-xs font-bold rounded-xl transition ${
                        temaSeguro.botao.tamanho === t.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-sm'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Texto do CTA */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Texto da Chamada para Ação (CTA)
                </label>
                <input
                  type="text"
                  value={temaSeguro.botao.cta}
                  onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, cta: e.target.value } })}
                  placeholder="Ex: PARTICIPAR DO SORTEIO"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Exemplos: "PARTICIPAR DO SORTEIO", "QUERO CONCORRER AGORA", "GARANTIR MEUS BILHETES".
                </p>
              </div>

              {/* Sombra Projetada */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Sombra Projetada 3D</h4>
                  <p className="text-[11px] text-slate-400">
                    Aplica uma sombra elegante para dar destaque e profundidade ao botão.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={temaSeguro.botao.sombra}
                    onChange={e => atualizarTema({ botao: { ...temaSeguro.botao, sombra: e.target.checked } })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

            </div>
          )}

          {/* 3. SEÇÃO TIPOGRAFIA */}
          {secaoEditor === 'tipografia' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 animate-in fade-in">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Type className="w-4 h-4 text-emerald-400" />
                  Tipografia & Fontes
                </h3>
                <p className="text-xs text-slate-400">
                  Escolha a família tipográfica e o peso visual dos títulos.
                </p>
              </div>

              {/* Família da Fonte */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Estilo da Família de Fontes
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'sans', label: 'Sans-serif Moderna', fontSample: 'font-sans' },
                    { id: 'serif', label: 'Serifada Elegante', fontSample: 'font-serif' },
                    { id: 'display', label: 'Display de Impacto', fontSample: 'font-sans tracking-tight' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => atualizarTema({ tipografia: { ...temaSeguro.tipografia, fonte: f.id as any } })}
                      className={`p-3.5 border text-center transition flex flex-col items-center gap-1.5 rounded-xl ${
                        temaSeguro.tipografia.fonte === f.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-sm'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className={`text-xl font-black text-white ${f.fontSample}`}>Aa</span>
                      <span className="text-xs font-bold">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tamanho do Título */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Tamanho do Título do Sorteio
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'sm', label: 'Discreto (Pequeno)' },
                    { id: 'md', label: 'Padrão (Médio)' },
                    { id: 'lg', label: 'Imponente (Grande)' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => atualizarTema({ tipografia: { ...temaSeguro.tipografia, tamanhoTitulo: t.id as any } })}
                      className={`py-3 px-3 border text-center text-xs font-bold rounded-xl transition ${
                        temaSeguro.tipografia.tamanhoTitulo === t.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-sm'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* 4. SEÇÃO BLOCOS & ORDEM (DRAG & DROP) */}
          {secaoEditor === 'blocos' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 animate-in fade-in">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Layout className="w-4 h-4 text-emerald-400" />
                    Ordem & Visibilidade dos Blocos
                  </h3>
                  <p className="text-xs text-slate-400">
                    Arraste para reordenar a sequência da página ou desative blocos indesejados.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  {ordemAtual.length} blocos
                </span>
              </div>

              {/* Lista Interativa de Blocos */}
              <div className="space-y-2">
                {ordemAtual.map((blocoId, idx) => {
                  const blocoInfo = BLOCOS_DISPONIVEIS.find(b => b.id === blocoId) || {
                    id: blocoId,
                    nome: blocoId,
                    descricao: 'Bloco da página',
                    icone: '📦'
                  };
                  const visivel = temaSeguro.layout.visivel[blocoId] !== false;

                  return (
                    <div
                      key={blocoId}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(idx)}
                      className={`p-3.5 rounded-xl border transition flex items-center gap-3 select-none ${
                        visivel
                          ? 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-950/40 border-slate-850 opacity-60'
                      } ${draggedIdx === idx ? 'border-emerald-500 bg-emerald-500/10 scale-[0.99]' : ''}`}
                    >
                      {/* Alça de Arrastar */}
                      <div 
                        className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 p-1"
                        title="Arraste para reposicionar"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Posição Numérica */}
                      <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center text-xs font-black shrink-0">
                        {idx + 1}
                      </div>

                      {/* Ícone e Nome */}
                      <div className="text-xl shrink-0">{blocoInfo.icone}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white truncate">
                            {blocoInfo.nome}
                          </h4>
                          {!visivel && (
                            <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded">
                              Oculto
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {blocoInfo.descricao}
                        </p>
                      </div>

                      {/* Botões de Subir / Descer para acessibilidade */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moverBloco(idx, 'cima')}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition"
                          title="Subir bloco"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moverBloco(idx, 'baixo')}
                          disabled={idx === ordemAtual.length - 1}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition"
                          title="Descer bloco"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Toggle de Visibilidade */}
                      <div className="shrink-0 pl-1 border-l border-slate-800">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={visivel}
                            onChange={() => toggleVisibilidadeBloco(blocoId)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* 5. SEÇÃO ESTILOS SALVOS */}
          {secaoEditor === 'estilos' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 animate-in fade-in">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <FolderHeart className="w-4 h-4 text-emerald-400" />
                    Biblioteca de Estilos Salvos
                  </h3>
                  <p className="text-xs text-slate-400">
                    Aplique combinações de estilo criadas anteriormente em um clique.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setModalNovoEstiloAberto(true)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Salvar Atual</span>
                </button>
              </div>

              {carregandoEstilos ? (
                <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  Carregando seus estilos salvos...
                </div>
              ) : estilosSalvos.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
                  <FolderHeart className="w-8 h-8 text-slate-600 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-300">Nenhum estilo salvo ainda</h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Personalize as cores e botões como preferir e clique em "Salvar Atual" para reutilizar em todas as suas rifas.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {estilosSalvos.map(estilo => (
                    <div
                      key={estilo.id}
                      className="p-4 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl space-y-3 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-white">{estilo.nome}</h4>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(estilo.criadoEm).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleExcluirEstilo(estilo.id, estilo.nome)}
                          className="text-slate-500 hover:text-red-400 p-1 transition"
                          title="Excluir estilo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Swatches de Cor */}
                      <div className="flex items-center gap-1.5 p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                        <div className="w-4 h-4 rounded-full border border-slate-700" style={{ backgroundColor: estilo.tema?.cores?.primaria || '#10b981' }} title="Primária" />
                        <div className="w-4 h-4 rounded-full border border-slate-700" style={{ backgroundColor: estilo.tema?.cores?.fundo || '#020617' }} title="Fundo" />
                        <div className="w-4 h-4 rounded-full border border-slate-700" style={{ backgroundColor: estilo.tema?.cores?.botao || '#10b981' }} title="Botão" />
                        <span className="text-[10px] text-slate-400 ml-auto font-mono">
                          {estilo.tema?.botao?.formato || 'arredondado'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAplicarEstilo(estilo)}
                        className="w-full py-2 bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-200 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 border border-slate-700/60"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Aplicar à Campanha</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div> {/* FECHA O w-full */}

        {/* COLUNA DA DIREITA: PRÉVIA EM TEMPO REAL COM MOCKUP DE CELULAR (Full width at bottom) */}
        <div className={`w-full mt-8 border-t border-slate-800/60 pt-12 ${visualizacaoMobile === 'controles' ? 'hidden lg:block' : 'block'}`}>
          <div className="flex flex-col items-center space-y-6">
            <div className="flex flex-col items-center text-center px-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Prévia em Tempo Real
                </h3>
              </div>
              <p className="text-xs text-slate-400 max-w-md">
                Veja como a sua página de sorteio está ficando. Esta é uma representação fiel de como os participantes verão o seu site.
              </p>
            </div>

            {/* MOCKUP DO SMARTPHONE COM MOLDURA REALISTA */}
            <div className="mx-auto w-full max-w-[390px] bg-slate-950 border-[6px] border-slate-800 rounded-[44px] p-2 shadow-2xl shadow-emerald-950/20 relative">
              
              {/* Notch / Speaker Superior */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-40 flex items-center justify-center">
                <div className="w-8 h-1 bg-slate-800 rounded-full" />
              </div>

              {/* Status Bar Superior */}
              <div className="h-6 bg-slate-950 rounded-t-[34px] px-6 flex items-center justify-between text-[10px] font-bold text-slate-400 select-none z-30 relative pt-1">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <span>5G</span>
                  <div className="w-4 h-2 border border-slate-400 rounded-sm p-0.5 flex items-center">
                    <div className="w-full h-full bg-emerald-400 rounded-2xs" />
                  </div>
                </div>
              </div>

              {/* Viewport Renderizável com Scroll da Página Pública */}
              <div 
                className="w-full h-[660px] bg-slate-950 rounded-[34px] overflow-y-auto overflow-x-hidden relative border border-slate-800/80 custom-scrollbar"
                style={{
                  backgroundColor: temaSeguro.cores.fundo || '#020617',
                  color: temaSeguro.cores.texto || '#f8fafc'
                }}
              >
                <CampanhaPublicaView
                  modoPreview={true}
                  previewCampanha={campanhaPreview}
                  previewTema={temaSeguro}
                />
              </div>

              {/* Home Indicator Inferior */}
              <div className="h-4 flex items-center justify-center pt-1">
                <div className="w-24 h-1 bg-slate-700 rounded-full" />
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* Modal: Salvar Estilo Reutilizável */}
      {modalNovoEstiloAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-emerald-400" />
                Salvar Tema na Minha Biblioteca
              </h3>
              <button
                type="button"
                onClick={() => setModalNovoEstiloAberto(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarEstilo} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nome do Estilo / Template *
                </label>
                <input
                  type="text"
                  value={nomeNovoEstilo}
                  onChange={e => setNomeNovoEstilo(e.target.value)}
                  placeholder="Ex: Tema Ouro Luxo, Rifa Esportiva, Minimal Dark"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  required
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Este estilo ficará salvo na sua conta para você aplicar em qualquer rifa futura com 1 clique.
                </p>
              </div>

              {/* Swatch de Prévia */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Paleta Selecionada:</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full border border-slate-700" style={{ backgroundColor: temaSeguro.cores.primaria }} title="Primária" />
                  <div className="w-4 h-4 rounded-full border border-slate-700" style={{ backgroundColor: temaSeguro.cores.fundo }} title="Fundo" />
                  <div className="w-4 h-4 rounded-full border border-slate-700" style={{ backgroundColor: temaSeguro.cores.botao }} title="Botão" />
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovoEstiloAberto(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoEstilo || !nomeNovoEstilo.trim()}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-1.5"
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
