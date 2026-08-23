import React, { useState, useRef } from 'react';
import { 
  Save, Sparkles, Plus, Trash2, Trophy, Gift, Zap, Image as ImageIcon, 
  Youtube, FileText, CheckCircle2, AlertCircle, ArrowLeft,
  LayoutGrid, HelpCircle, Flame, Lock, Eye, Star, Info, Rocket,
  Upload, Camera, Link as LinkIcon, RefreshCw, ChevronRight, ChevronLeft,
  DollarSign, Clock, MapPin, Tag, Check, Sparkle, GripVertical, Palette
} from 'lucide-react';
import { Campanha, Premio, CotaPremiada, Promocao, OfertaRelampago, TEMA_PADRAO } from '../../types';
import { uploadImageToStorage, compressAndReadImage } from '../../lib/image-upload';
import { TemaBuilderView } from './TemaBuilderView';

interface Props {
  form: Partial<Campanha>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Campanha>>>;
  onSalvar: (e: React.FormEvent) => void;
  salvando: boolean;
  erro: string;
  onCancelar: () => void;
  onAbrirIA: () => void;
  iaAviso: string;
  onVerPrevia?: () => void;
}

type TabType = 'basico' | 'midia' | 'premios' | 'promocoes' | 'upsell' | 'extras' | 'tema';

export const CampanhasFormView: React.FC<Props> = ({
  form,
  setForm,
  onSalvar,
  salvando,
  erro,
  onCancelar,
  onAbrirIA,
  iaAviso,
  onVerPrevia
}) => {
  const [novaFotoUrl, setNovaFotoUrl] = useState('');
  const [abaInterna, setAbaInterna] = useState<TabType>('basico');
  const [carregandoBanner, setCarregandoBanner] = useState(false);
  const [carregandoCarrossel, setCarregandoCarrossel] = useState(false);
  const [carregandoOrganizadorFoto, setCarregandoOrganizadorFoto] = useState(false);
  const [dragActiveBanner, setDragActiveBanner] = useState(false);
  const [dragActiveCarrossel, setDragActiveCarrossel] = useState(false);
  const [modoUrlBanner, setModoUrlBanner] = useState(false);
  const [mostrarModalCotas, setMostrarModalCotas] = useState(false);
  const [draggedPromoIdx, setDraggedPromoIdx] = useState<number | null>(null);

  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const bannerCameraInputRef = useRef<HTMLInputElement>(null);
  const carrosselFileInputRef = useRef<HTMLInputElement>(null);
  const organizadorFileInputRef = useRef<HTMLInputElement>(null);
  const organizadorCameraInputRef = useRef<HTMLInputElement>(null);

  const handleOrganizadorFotoUpload = async (file: File) => {
    try {
      setCarregandoOrganizadorFoto(true);
      const url = await uploadImageToStorage(file, 'organizadores', 400, 400, 0.85);
      setForm(prev => ({ ...prev, organizadorFoto: url }));
    } catch (err: any) {
      alert(err.message || 'Erro ao carregar foto do organizador.');
    } finally {
      setCarregandoOrganizadorFoto(false);
    }
  };

  const selosPredefinidos = [
    '🔥 Corre que essa vai rápido!',
    '⚡ Últimos Dias / Quase Esgotando',
    '💎 Prêmio Exclusivo e Raro',
    '🚀 Lançamento Oficial',
    '⭐ Destaque Especial da Semana',
    '🎁 Compre e Ganhe Bônus Instantâneo',
    '🏆 Sorteio Confirmado'
  ];

  const tabsConfig: { id: TabType; label: string; icon: any; desc: string }[] = [
    { id: 'basico', label: '1. Informações & Cotas', icon: DollarSign, desc: 'Título, valor da cota e regras' },
    { id: 'midia', label: '2. Fotos & Mídia', icon: Camera, desc: 'Banner principal do celular e carrossel' },
    { id: 'premios', label: '3. Prêmios & Bilhetes Premiados', icon: Trophy, desc: 'Prêmio principal e cotas instantâneas' },
    { id: 'promocoes', label: '4. Pacotes & Descontos', icon: Zap, desc: 'Combos de cotas promocionais' },
    { id: 'upsell', label: '5. Ofertas Relâmpago', icon: Flame, desc: 'Aumente o ticket no checkout' },
    { id: 'extras', label: '6. Brindes & Roleta', icon: Gift, desc: 'E-book digital e roleta bônus' },
    { id: 'tema', label: '7. Personalizar Tema', icon: Palette, desc: 'Cores, botão CTA, tipografia e blocos' }
  ];

  // Upload handlers
  const processarArquivoBanner = async (file: File) => {
    setCarregandoBanner(true);
    try {
      const url = await uploadImageToStorage(file, 'banners', 1200, 1200, 0.82);
      setForm(prev => ({ ...prev, bannerUrl: url }));
    } catch (err: any) {
      alert(err.message || 'Erro ao carregar a foto.');
    } finally {
      setCarregandoBanner(false);
    }
  };

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processarArquivoBanner(file);
    }
    if (e.target) e.target.value = '';
  };

  const processarArquivosCarrossel = async (files: File[]) => {
    if (files.length === 0) return;
    setCarregandoCarrossel(true);
    try {
      const novasFotos = await Promise.all(
        files.map(f => uploadImageToStorage(f, 'carrossel', 1200, 1200, 0.82))
      );
      const fotosAtuais = form.fotosCarrossel || [];
      setForm(prev => ({ ...prev, fotosCarrossel: [...fotosAtuais, ...novasFotos] }));
    } catch (err: any) {
      alert(err.message || 'Erro ao carregar as fotos do carrossel.');
    } finally {
      setCarregandoCarrossel(false);
    }
  };

  const handleCarrosselFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    await processarArquivosCarrossel(files);
    if (e.target) e.target.value = '';
  };

  // Drag & Drop
  const handleDragBanner = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActiveBanner(true);
    } else if (e.type === 'dragleave') {
      setDragActiveBanner(false);
    }
  };

  const handleDropBanner = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveBanner(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processarArquivoBanner(e.dataTransfer.files[0]);
    }
  };

  const handleDragCarrossel = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActiveCarrossel(true);
    } else if (e.type === 'dragleave') {
      setDragActiveCarrossel(false);
    }
  };

  const handleDropCarrossel = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveCarrossel(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processarArquivosCarrossel(Array.from(e.dataTransfer.files) as File[]);
    }
  };

  // Adicionar foto via URL manual
  const handleAdicionarFotoUrl = () => {
    if (!novaFotoUrl.trim()) return;
    const fotos = form.fotosCarrossel || [];
    setForm(prev => ({ ...prev, fotosCarrossel: [...fotos, novaFotoUrl.trim()] }));
    setNovaFotoUrl('');
  };

  const handleRemoverFotoCarrossel = (idx: number) => {
    const fotos = (form.fotosCarrossel || []).filter((_, i) => i !== idx);
    setForm(prev => ({ ...prev, fotosCarrossel: fotos }));
  };

  // Prêmios
  const handleAddPremio = () => {
    const premios = form.premios || [];
    setForm(prev => ({
      ...prev,
      premios: [...premios, { posicao: premios.length + 1, descricao: '' }]
    }));
  };

  const handleRemovePremio = (idx: number) => {
    const premios = (form.premios || []).filter((_, i) => i !== idx)
      .map((p, i) => ({ ...p, posicao: i + 1 }));
    setForm(prev => ({ ...prev, premios }));
  };

  // Apagar todos os números e valores da cota (Aba 1)
  const handleLimparTodosValores = () => {
    setForm(prev => ({
      ...prev,
      valorCota: undefined,
      minPorCompra: undefined,
      maxPorCompra: undefined,
      tempoReservaMin: undefined
    }));
  };

  // Redefinir valores padrão sugeridos
  const handleRestaurarValoresPadrao = () => {
    setForm(prev => ({
      ...prev,
      valorCota: 0.50,
      minPorCompra: 5,
      maxPorCompra: 1000,
      tempoReservaMin: 10
    }));
  };

  // Cotas Premiadas
  const handleAddCotaPremiada = () => {
    const cps = form.cotasPremiadas || [];
    setForm(prev => ({
      ...prev,
      cotasPremiadas: [
        ...cps,
        { numero: '', premio: '', status: 'disponivel', pedidoId: null }
      ]
    }));
  };

  const handleRemoveCotaPremiada = (idx: number) => {
    const cps = (form.cotasPremiadas || []).filter((_, i) => i !== idx);
    setForm(prev => ({ ...prev, cotasPremiadas: cps }));
  };

  const handleLimparTodasCotasPremiadas = () => {
    setForm(prev => ({ ...prev, cotasPremiadas: [] }));
  };

  const handleGerarCotasPremiadasAleatorias = (qtd: number = 5) => {
    const total = form.totalCotas || 10000;
    const digitos = Math.max(2, (total - 1).toString().length);
    const numerosSorteados = new Set<string>();

    while (numerosSorteados.size < qtd) {
      const rand = Math.floor(Math.random() * total);
      numerosSorteados.add(rand.toString().padStart(digitos, '0'));
    }

    const novasCotas: CotaPremiada[] = Array.from(numerosSorteados).map((num, i) => ({
      numero: num,
      premio: i === 0 ? 'R$ 500 no Pix' : i === 1 ? 'R$ 250 no Pix' : 'R$ 100 no Pix',
      status: 'disponivel',
      pedidoId: null
    }));

    setForm(prev => ({ ...prev, cotasPremiadas: novasCotas }));
  };

  // Promoções de Pacotes
  const handleAddPromo = () => {
    const promos = form.promocoes || [];
    setForm(prev => ({
      ...prev,
      promocoes: [...promos, { quantidade: 0, valor: 0.00, destaque: false }]
    }));
  };

  const handleDragStartPromo = (e: React.DragEvent, idx: number) => {
    setDraggedPromoIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const handleDragOverPromo = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropPromo = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedPromoIdx === null || draggedPromoIdx === targetIdx) {
      setDraggedPromoIdx(null);
      return;
    }
    const list = [...(form.promocoes || [])];
    const itemToMove = list[draggedPromoIdx];
    list.splice(draggedPromoIdx, 1);
    list.splice(targetIdx, 0, itemToMove);
    setForm(prev => ({ ...prev, promocoes: list }));
    setDraggedPromoIdx(null);
  };

  const handleRemovePromo = (idx: number) => {
    const promos = (form.promocoes || []).filter((_, i) => i !== idx);
    setForm(prev => ({ ...prev, promocoes: promos }));
  };

  const handleLimparTodasPromocoes = () => {
    setForm(prev => ({ ...prev, promocoes: [] }));
  };

  const handleGerarPromocoesSugeridas = () => {
    const val = Number(form.valorCota) || 0.50;
    const pacotes: Promocao[] = [
      { quantidade: 10, valor: Number((10 * val * 0.95).toFixed(2)), destaque: false },
      { quantidade: 25, valor: Number((25 * val * 0.90).toFixed(2)), destaque: true },
      { quantidade: 50, valor: Number((50 * val * 0.85).toFixed(2)), destaque: false },
      { quantidade: 100, valor: Number((100 * val * 0.80).toFixed(2)), destaque: false }
    ];
    setForm(prev => ({ ...prev, promocoes: pacotes }));
  };

  // Ofertas Relâmpago (Upsell - até 2)
  const handleAddOferta = () => {
    const ofertas = form.ofertasRelampago || [];
    if (ofertas.length >= 2) return;
    setForm(prev => ({
      ...prev,
      ofertasRelampago: [
        ...ofertas,
        {
          id: `oferta-${ofertas.length + 1}`,
          titulo: '',
          subtitulo: '',
          cotasExtras: 0,
          preco: 0.00,
          selo: ''
        }
      ]
    }));
  };

  const handleRemoveOferta = (idx: number) => {
    const ofertas = (form.ofertasRelampago || []).filter((_, i) => i !== idx);
    setForm(prev => ({ ...prev, ofertasRelampago: ofertas }));
  };

  const handleLimparTodasOfertas = () => {
    setForm(prev => ({ ...prev, ofertasRelampago: [] }));
  };

  // Cálculo financeiro estimado
  const totalCotasNum = Number(form.totalCotas || 0);
  const valorCotaNum = Number(form.valorCota || 0);
  const arrecadacaoEstimada = totalCotasNum * valorCotaNum;

  // Navegação pelos passos
  const tabKeys: TabType[] = ['basico', 'midia', 'premios', 'promocoes', 'upsell', 'extras'];
  const currentIndex = tabKeys.indexOf(abaInterna);

  const irProximo = () => {
    if (currentIndex < tabKeys.length - 1) {
      setAbaInterna(tabKeys[currentIndex + 1]);
    }
  };

  const irAnterior = () => {
    if (currentIndex > 0) {
      setAbaInterna(tabKeys[currentIndex - 1]);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Inputs oculta para upload de arquivos */}
      <input
        ref={bannerFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleBannerFileChange}
      />
      <input
        ref={bannerCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleBannerFileChange}
      />
      <input
        ref={carrosselFileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleCarrosselFileChange}
      />

      {/* Header com Design Redesenhado */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        {/* Glow decorativo de fundo */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancelar}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700 shrink-0"
              title="Voltar para a Lista de Campanhas"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase rounded-md tracking-wider">
                  {form.id ? 'Edição Ativa' : 'Nova Campanha'}
                </span>
                <span className="text-slate-500 text-xs">• Passo {currentIndex + 1} de {tabKeys.length}</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">
                {form.id ? (form.titulo || 'Editar Campanha') : 'Criar Nova Campanha'}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onVerPrevia && (
              <button
                type="button"
                onClick={onVerPrevia}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-sm"
              >
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Ver Prévia</span>
              </button>
            )}

            <button
              type="button"
              onClick={onAbrirIA}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-purple-600/20 transition active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span>Gerar com IA</span>
            </button>

            <button
              type="button"
              onClick={onSalvar}
              disabled={salvando}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95"
            >
              <Rocket className="w-4 h-4" />
              <span>{salvando ? 'Salvando...' : 'Publicar Campanha'}</span>
            </button>
          </div>
        </div>

        {/* Notificações e Avisos */}
        {iaAviso && (
          <div className="mt-4 p-3 bg-purple-950/60 border border-purple-500/30 rounded-xl text-xs text-purple-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{iaAviso}</span>
          </div>
        )}

        {erro && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* NAVEGAÇÃO POR ETAPAS PASSO A PASSO (REDESIGN) */}
        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {tabsConfig.map((tab, idx) => {
              const Icon = tab.icon;
              const isAtiva = abaInterna === tab.id;
              const isConcluida = idx < currentIndex;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAbaInterna(tab.id)}
                  className={`p-3 rounded-xl transition text-left relative overflow-hidden border ${
                    isAtiva
                      ? 'bg-slate-800 border-emerald-500/60 text-white shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/30'
                      : isConcluida
                      ? 'bg-slate-950/80 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                      : 'bg-slate-950/40 border-slate-800/50 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                      isAtiva 
                        ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                        : isConcluida
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isConcluida ? <Check className="w-4 h-4" /> : idx + 1}
                    </span>
                    <Icon className={`w-4 h-4 ${isAtiva ? 'text-emerald-400' : 'text-slate-500'}`} />
                  </div>
                  <div className="font-bold text-xs truncate">{tab.label.split('. ')[1]}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{tab.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <form onSubmit={onSalvar} className="space-y-6">
        
        {/* ABA 1: INFORMACÕES & COTAS */}
        {abaInterna === 'basico' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-emerald-400" />
                  Informações Básicas do Sorteio
                </h3>
                <p className="text-xs text-slate-400">
                  Defina o título principal, preço por cota e regulamento.
                </p>
              </div>

              {/* CARD PREVISÃO DE ARRECADAÇÃO */}
              {arrecadacaoEstimada > 0 && (
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Arrecadação Bruta Total</div>
                    <div className="text-base font-mono font-black text-emerald-400">
                      R$ {arrecadacaoEstimada.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  Título da Rifa / Sorteio *
                </label>
                <input
                  type="text"
                  placeholder="Ex: iPhone 16 Pro Max 256GB Lacrado"
                  value={form.titulo || ''}
                  onChange={e => setForm(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  Subtítulo / Chamada chamativa
                </label>
                <input
                  type="text"
                  placeholder="Ex: Por apenas R$ 0,50! Frete grátis para todo o Brasil."
                  value={form.subtitulo || ''}
                  onChange={e => setForm(prev => ({ ...prev, subtitulo: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Configuração de Modelo, Cotas e Valores */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Modelo de Escolha
                  </label>
                  <select
                    value={form.modelo || 'aleatorio'}
                    onChange={e => setForm(prev => ({ ...prev, modelo: e.target.value as any }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none font-medium"
                  >
                    <option value="aleatorio">🎲 Aleatório (Automático pelo sistema)</option>
                    <option value="manual">🔢 Manual (Cliente escolhe no grid)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                    <label className="text-xs font-bold text-slate-300 block">
                      Total de Cotas (Sorteio) *
                    </label>
                    {form.totalCotas && form.totalCotas > 0 && (
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        {(() => {
                          const max = form.totalCotas - 1;
                          let dig = String(max).length;
                          if (dig < 2) dig = 2;
                          const ini = '0'.padStart(dig, '0');
                          const fim = String(max).padStart(dig, '0');
                          return `Sorteio: ${ini} a ${fim}`;
                        })()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="10000000"
                      placeholder="Ex: 10000"
                      value={form.totalCotas !== undefined && form.totalCotas !== null ? form.totalCotas : ''}
                      onChange={e => setForm(prev => ({ ...prev, totalCotas: e.target.value === '' ? undefined : Number(e.target.value) }))}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-white focus:border-emerald-500 focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarModalCotas(true)}
                      className="px-3 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Selecionar Quantidade</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Valor por Cota (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Ex: 0.50"
                    value={form.valorCota !== undefined && form.valorCota !== null ? form.valorCota : ''}
                    onChange={e => setForm(prev => ({ ...prev, valorCota: e.target.value === '' ? undefined : Number(e.target.value) }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-emerald-400 font-black focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Tempo Reserva Pix (Min)
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="60"
                    placeholder="Ex: 10 min"
                    value={form.tempoReservaMin !== undefined && form.tempoReservaMin !== null ? form.tempoReservaMin : ''}
                    onChange={e => setForm(prev => ({ ...prev, tempoReservaMin: e.target.value === '' ? undefined : Number(e.target.value) }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Regras adicionais */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Mínimo de Cotas por Pedido
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ex: 5"
                  value={form.minPorCompra !== undefined && form.minPorCompra !== null ? form.minPorCompra : ''}
                  onChange={e => setForm(prev => ({ ...prev, minPorCompra: e.target.value === '' ? undefined : Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Máximo de Cotas por Pedido
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ex: 1000"
                  value={form.maxPorCompra !== undefined && form.maxPorCompra !== null ? form.maxPorCompra : ''}
                  onChange={e => setForm(prev => ({ ...prev, maxPorCompra: e.target.value === '' ? undefined : Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Local / Origem do Sorteio
                </label>
                <select
                  value={form.localSorteio || 'Loteria Federal'}
                  onChange={e => setForm(prev => ({ ...prev, localSorteio: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none font-medium"
                >
                  <option value="Loteria Federal">🏛️ Loteria Federal</option>
                  <option value="Deu no Poste">🎲 Deu no Poste</option>
                  <option value="Sorteio ao Vivo Instagram">📱 Sorteio ao Vivo Instagram</option>
                  <option value="Sorteador Eletrônico">💻 Sorteador Eletrônico Oficial</option>
                </select>
              </div>
            </div>

            {/* Selo e Flag Promocional */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Selo de Destaque Visual (Badge Promocional)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selosPredefinidos.includes(form.selo || '') ? form.selo || '' : 'outro'}
                  onChange={e => {
                    if (e.target.value !== 'outro') {
                      setForm(prev => ({ ...prev, selo: e.target.value }));
                    }
                  }}
                  className="sm:w-1/2 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Nenhum selo de destaque</option>
                  {selosPredefinidos.map((s, idx) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                  <option value="outro">Personalizado...</option>
                </select>

                <input
                  type="text"
                  placeholder="Ou digite uma frase curta promocional..."
                  value={form.selo || ''}
                  onChange={e => setForm(prev => ({ ...prev, selo: e.target.value }))}
                  className="sm:w-1/2 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Datas da Campanha e Contador Regressivo */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    Agendamento & Contador Regressivo
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ative caso deseje definir uma data de início e de término com contador regressivo em tempo real.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={!!form.agendamentoAtivo}
                    onChange={e => setForm(prev => ({ ...prev, agendamentoAtivo: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {form.agendamentoAtivo && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Data e Hora de Início
                    </label>
                    <input
                      type="datetime-local"
                      value={form.dataInicio || ''}
                      onChange={e => setForm(prev => ({ ...prev, dataInicio: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Antes desta data, aparecerá o contador "Faltam X dias/horas para o início".
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Data e Hora de Término
                    </label>
                    <input
                      type="datetime-local"
                      value={form.dataTermino || ''}
                      onChange={e => setForm(prev => ({ ...prev, dataTermino: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Enquanto ativa, mostra "Encerra em X dias/horas". Após o término, o sorteio/vendas se encerram.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Dados do Organizador e Redes Sociais */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Tag className="w-4 h-4 text-emerald-400" />
                Perfil do Organizador & Redes Sociais
              </h4>
              <p className="text-[11px] text-slate-400">
                Estas informações aparecem no topo, no menu lateral `[ ≡ MENU ]` e nos direitos autorais da campanha.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Nome do Organizador / Marca
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Wheslley Sousa"
                    value={form.organizadorNome || ''}
                    onChange={e => setForm(prev => ({ ...prev, organizadorNome: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Foto / Logo do Organizador
                  </label>
                  
                  <input
                    type="file"
                    ref={organizadorFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleOrganizadorFotoUpload(file);
                    }}
                  />
                  <input
                    type="file"
                    ref={organizadorCameraInputRef}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleOrganizadorFotoUpload(file);
                    }}
                  />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {form.organizadorFoto ? (
                        <div className="relative group shrink-0">
                          <img
                            src={form.organizadorFoto}
                            alt="Preview Organizador"
                            className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shadow-md"
                          />
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, organizadorFoto: '' }))}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow"
                            title="Remover foto"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-400">
                          <Camera className="w-5 h-5" />
                        </div>
                      )}

                      <div className="flex-1 flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => organizadorFileInputRef.current?.click()}
                          disabled={carregandoOrganizadorFoto}
                          className="flex-1 px-2.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 transition active:scale-95"
                        >
                          {carregandoOrganizadorFoto ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                          ) : (
                            <Upload className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span>Upload Foto / Logo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => organizadorCameraInputRef.current?.click()}
                          disabled={carregandoOrganizadorFoto}
                          className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 transition active:scale-95"
                          title="Tirar foto com a Câmera"
                        >
                          <Camera className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                      </div>
                    </div>

                    <input
                      type="url"
                      placeholder="Ou cole o Link (URL) aqui..."
                      value={form.organizadorFoto || ''}
                      onChange={e => setForm(prev => ({ ...prev, organizadorFoto: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    WhatsApp de Suporte
                  </label>
                  <input
                    type="text"
                    placeholder="(99) 99999-9999"
                    value={form.organizadorWhatsapp || ''}
                    onChange={e => setForm(prev => ({ ...prev, organizadorWhatsapp: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Instagram (@usuario)
                  </label>
                  <input
                    type="text"
                    placeholder="@wheslley.sousa"
                    value={form.organizadorInstagram || ''}
                    onChange={e => setForm(prev => ({ ...prev, organizadorInstagram: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    TikTok (@usuario)
                  </label>
                  <input
                    type="text"
                    placeholder="@wheslley.sousa"
                    value={form.organizadorTiktok || ''}
                    onChange={e => setForm(prev => ({ ...prev, organizadorTiktok: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Descrição e Regulamento */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Regulamento & Detalhes da Entrega
              </label>
              <textarea
                rows={4}
                value={form.descricao || ''}
                onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-200 font-sans focus:border-emerald-500 focus:outline-none leading-relaxed"
                placeholder="Explique detalhadamente as regras do sorteio, prazos de entrega, envio grátis ou condições gerais..."
              />
            </div>
          </div>
        )}

        {/* ABA 2: FOTOS & MÍDIA (UPLOAD DIRETO DO CELULAR E CARROSSEL) */}
        {abaInterna === 'midia' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in">
            {/* BANNER PRINCIPAL */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-emerald-400" />
                    Banner / Foto Principal da Campanha
                  </h3>
                  <p className="text-xs text-slate-400">
                    Envie a foto de capa direto da câmera do seu celular, galeria de fotos ou link de imagem.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setModoUrlBanner(!modoUrlBanner)}
                  className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 font-medium transition self-start sm:self-auto"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  {modoUrlBanner ? 'Usar Upload de Foto' : 'Inserir por Link (URL)'}
                </button>
              </div>

              {modoUrlBanner ? (
                <div className="space-y-2 mt-3">
                  <input
                    type="url"
                    placeholder="https://exemplo.com/sua-foto.jpg"
                    value={form.bannerUrl || ''}
                    onChange={e => setForm(prev => ({ ...prev, bannerUrl: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                  {form.bannerUrl && (
                    <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                      <img src={form.bannerUrl} alt="Preview Banner" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ) : (
                /* UPLOAD DROPZONE DIRETO DO CELULAR */
                <div
                  onDragEnter={handleDragBanner}
                  onDragOver={handleDragBanner}
                  onDragLeave={handleDragBanner}
                  onDrop={handleDropBanner}
                  className={`mt-3 p-6 border-2 border-dashed rounded-2xl text-center transition flex flex-col items-center justify-center relative overflow-hidden ${
                    dragActiveBanner
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : form.bannerUrl
                      ? 'border-slate-800 bg-slate-950/80'
                      : 'border-slate-700 hover:border-emerald-500/60 bg-slate-950/40'
                  }`}
                >
                  {carregandoBanner ? (
                    <div className="py-8 flex flex-col items-center gap-2">
                      <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                      <span className="text-xs text-slate-300 font-bold">Otimizando e carregando foto...</span>
                    </div>
                  ) : form.bannerUrl ? (
                    <div className="w-full max-w-md space-y-3">
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group">
                        <img src={form.bannerUrl} alt="Banner da Campanha" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => bannerFileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs"
                          >
                            Trocar Foto
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, bannerUrl: '' }))}
                            className="px-3 py-1.5 bg-red-600 text-white font-bold rounded-lg text-xs"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Foto do Banner pronta!
                        </span>
                        <button
                          type="button"
                          onClick={() => bannerFileInputRef.current?.click()}
                          className="text-[11px] text-slate-400 hover:text-white underline"
                        >
                          Trocar foto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                        <Upload className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          Selecione ou tire uma foto do prêmio
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Formatos aceitos: JPG, PNG, WEBP ou HEIC (Celular)
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => bannerCameraInputRef.current?.click()}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition active:scale-95"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Tirar Foto na Hora</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => bannerFileInputRef.current?.click()}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95"
                        >
                          <ImageIcon className="w-4 h-4 text-emerald-400" />
                          <span>Escolher da Galeria</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CARROSSEL DE FOTOS ADICIONAIS */}
            <div className="pt-6 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-indigo-400" />
                    Carrossel de Fotos Adicionais
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mostre mais ângulos, especificações e detalhes do prêmio.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => carrosselFileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload Várias Fotos do Celular</span>
                  </button>
                </div>
              </div>

              {/* Upload Dropzone para Fotos Adicionais */}
              <div
                onDragEnter={handleDragCarrossel}
                onDragOver={handleDragCarrossel}
                onDragLeave={handleDragCarrossel}
                onDrop={handleDropCarrossel}
                className={`p-4 border-2 border-dashed rounded-xl mb-4 text-center transition ${
                  dragActiveCarrossel ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-950/50'
                }`}
              >
                {carregandoCarrossel ? (
                  <div className="py-4 flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                    <span className="text-xs text-slate-300 font-bold">Processando imagens da galeria...</span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-200">
                        Adicionar mais fotos ao carrossel
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Selecione múltiplas fotos de uma vez do celular ou computador
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="url"
                        placeholder="Ou cole o Link (URL) aqui..."
                        value={novaFotoUrl}
                        onChange={e => setNovaFotoUrl(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAdicionarFotoUrl}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold rounded-lg text-xs border border-slate-700 shrink-0"
                      >
                        + Add URL
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Grid de Fotos Carregadas */}
              {form.fotosCarrossel && form.fotosCarrossel.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {form.fotosCarrossel.map((foto, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-800 aspect-video bg-slate-950 shadow-sm">
                      <img src={foto} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-slate-950/80 rounded text-[10px] font-mono text-slate-300">
                        #{idx + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoverFotoCarrossel(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow"
                        title="Remover foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-slate-950/30 border border-dashed border-slate-800/80 rounded-xl text-center">
                  <p className="text-xs text-slate-400">Nenhuma foto adicional no carrossel ainda.</p>
                  <button
                    type="button"
                    onClick={() => carrosselFileInputRef.current?.click()}
                    className="mt-2 text-xs text-indigo-400 font-bold hover:underline"
                  >
                    + Clique para selecionar fotos do seu dispositivo
                  </button>
                </div>
              )}
            </div>

            {/* Vídeo do YouTube */}
            <div className="pt-6 border-t border-slate-800">
              <h3 className="text-base font-black text-white mb-1 flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-500" />
                Vídeo de Demonstração (YouTube)
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Cole o link do vídeo demonstrando o prêmio para aumentar ainda mais as vendas.
              </p>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=XXXXX ou https://youtu.be/XXXXX"
                value={form.youtubeUrl || ''}
                onChange={e => setForm(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:border-red-500 focus:outline-none"
              />
            </div>

            {/* PRÉVIA DO CARD DO WHATSAPP */}
            <div className="pt-6 border-t border-slate-800 space-y-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-emerald-400" />
                Prévia de Compartilhamento no WhatsApp
              </h3>
              <p className="text-xs text-slate-400">
                Assim é como a imagem e os textos do seu link aparecerão quando você ou seus clientes enviarem a rifa no WhatsApp.
              </p>

              <div className="max-w-sm bg-[#0b141a] border border-slate-800 rounded-2xl p-3 space-y-2 text-white shadow-xl">
                <div className="bg-[#1f2c34] rounded-xl overflow-hidden border border-slate-700/50">
                  <div className="aspect-[1.91/1] w-full bg-slate-900 overflow-hidden relative">
                    {form.bannerUrl ? (
                      <img src={form.bannerUrl} alt="WhatsApp Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs font-mono">
                        [ Sem imagem de capa ]
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-1 bg-[#111b21]">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">RIFAZONE.ONRENDER.COM</span>
                    <h4 className="text-xs font-bold text-slate-100 truncate">
                      {form.titulo || 'Título da Campanha'}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {form.subtitulo || 'Participe do sorteio oficial e concorra a prêmios incríveis com pagamento Pix imediato!'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                  <span>rifazone.onrender.com/c/{form.codigo || 'sua-campanha'}</span>
                  <span>12:00</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: PRÊMIOS & COTAS PREMIADAS */}
        {abaInterna === 'premios' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in">
            {/* Prêmios Principais */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    Prêmios Principais do Sorteio
                  </h3>
                  <p className="text-xs text-slate-400">1º lugar, 2º lugar, 3º lugar, etc.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPremio}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-xs flex items-center gap-1 border border-slate-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Prêmio
                </button>
              </div>

              <div className="space-y-2">
                {(form.premios || []).map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center font-black text-xs shrink-0">
                      {p.posicao}º
                    </span>
                    <input
                      type="text"
                      placeholder="Descrição do prêmio..."
                      value={p.descricao}
                      onChange={e => {
                        const arr = [...(form.premios || [])];
                        arr[idx].descricao = e.target.value;
                        setForm(prev => ({ ...prev, premios: arr }));
                      }}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePremio(idx)}
                      className="p-2 text-slate-500 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Cotas Premiadas Instantâneas */}
            <div className="pt-6 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Gift className="w-5 h-5 text-emerald-400" />
                    Cotas Premiadas (Ganha na Hora no Pix)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Se o comprador tirar o número premiado, ganha o valor instantaneamente!
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(form.cotasPremiadas || []).length > 0 && (
                    <button
                      type="button"
                      onClick={handleLimparTodasCotasPremiadas}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-xs flex items-center gap-1 border border-red-500/30 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Apagar Todas
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleGerarCotasPremiadasAleatorias(5)}
                    className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-bold rounded-xl text-xs flex items-center gap-1 border border-purple-500/30 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Gerar 5 Aleatórias
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCotaPremiada}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl text-xs flex items-center gap-1 border border-slate-700 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nova Cota
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {(form.cotasPremiadas || []).length === 0 ? (
                  <div className="p-6 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl text-center">
                    <p className="text-xs text-slate-400 mb-2">Nenhuma cota premiada cadastrada no momento.</p>
                    <button
                      type="button"
                      onClick={() => handleGerarCotasPremiadasAleatorias(5)}
                      className="text-xs text-emerald-400 font-bold hover:underline"
                    >
                      + Clique aqui para gerar 5 números premiados automaticamente
                    </button>
                  </div>
                ) : (
                  (form.cotasPremiadas || []).map((cp, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-slate-950/80 border border-slate-800 rounded-xl items-center">
                      <input
                        type="text"
                        placeholder="Número da Cota (ex: 0421)"
                        value={cp.numero}
                        onChange={e => {
                          const arr = [...(form.cotasPremiadas || [])];
                          arr[idx].numero = e.target.value;
                          setForm(prev => ({ ...prev, cotasPremiadas: arr }));
                        }}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Prêmio (ex: R$ 200 no Pix)"
                        value={cp.premio}
                        onChange={e => {
                          const arr = [...(form.cotasPremiadas || [])];
                          arr[idx].premio = e.target.value;
                          setForm(prev => ({ ...prev, cotasPremiadas: arr }));
                        }}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                        required
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          Status: <strong className="text-emerald-400">{cp.status}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCotaPremiada(idx)}
                          className="p-1.5 text-slate-500 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: PROMOÇÕES & PACOTES */}
        {abaInterna === 'promocoes' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  Pacotes Promocionais por Volume
                </h3>
                <p className="text-xs text-slate-400">
                  Aumente suas vendas oferecendo descontos para quem compra em maior quantidade.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(form.promocoes || []).length > 0 && (
                  <button
                    type="button"
                    onClick={handleLimparTodasPromocoes}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-xs flex items-center gap-1 border border-red-500/30 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Apagar Pacotes
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleGerarPromocoesSugeridas}
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1 border border-emerald-500/30 transition"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Gerar Pacotes Inteligentes
                </button>
                <button
                  type="button"
                  onClick={handleAddPromo}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl text-xs flex items-center gap-1 border border-slate-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Pacote
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {(form.promocoes || []).length === 0 ? (
                <div className="p-6 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl text-center">
                  <p className="text-xs text-slate-400 mb-2">Nenhum pacote promocional cadastrado.</p>
                  <button
                    type="button"
                    onClick={handleGerarPromocoesSugeridas}
                    className="text-xs text-emerald-400 font-bold hover:underline"
                  >
                    + Gerar 4 pacotes inteligentes automaticamente (com desconto progressivo)
                  </button>
                </div>
              ) : (
                (form.promocoes || []).map((promo, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={e => handleDragStartPromo(e, idx)}
                    onDragOver={handleDragOverPromo}
                    onDrop={e => handleDropPromo(e, idx)}
                    className={`p-4 bg-slate-950/80 border rounded-xl grid grid-cols-1 sm:grid-cols-6 gap-3 items-center transition ${
                      draggedPromoIdx === idx
                        ? 'border-emerald-500 bg-emerald-500/10 opacity-50'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Alça de Arrastar (Drag Handle) */}
                    <div className="flex items-center justify-center p-1 text-slate-500 hover:text-emerald-400 cursor-grab active:cursor-grabbing shrink-0" title="Segure e arraste para reordenar">
                      <GripVertical className="w-5 h-5" />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Qtd de Cotas</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Ex: 50"
                        value={promo.quantidade !== undefined && promo.quantidade > 0 ? promo.quantidade : ''}
                        onChange={e => {
                          const valQtd = e.target.value === '' ? 0 : Number(e.target.value);
                          const unitPrice = Number(form.valorCota) || 0;
                          const arr = [...(form.promocoes || [])];
                          arr[idx].quantidade = valQtd;
                          if (unitPrice > 0) {
                            arr[idx].valor = Number((valQtd * unitPrice).toFixed(2));
                          }
                          setForm(prev => ({ ...prev, promocoes: arr }));
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Valor Total (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        value={promo.valor !== undefined && promo.valor > 0 ? promo.valor : ''}
                        onChange={e => {
                          const arr = [...(form.promocoes || [])];
                          arr[idx].valor = e.target.value === '' ? 0 : Number(e.target.value);
                          setForm(prev => ({ ...prev, promocoes: arr }));
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 font-bold focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2 sm:pt-0 sm:col-span-2">
                      <input
                        type="checkbox"
                        id={`promo-destaque-${idx}`}
                        checked={!!promo.destaque}
                        onChange={e => {
                          const arr = [...(form.promocoes || [])];
                          arr[idx].destaque = e.target.checked;
                          setForm(prev => ({ ...prev, promocoes: arr }));
                        }}
                        className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
                      />
                      <label htmlFor={`promo-destaque-${idx}`} className="text-xs text-slate-300 font-medium cursor-pointer">
                        Selo "Mais Popular"
                      </label>
                    </div>

                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => handleRemovePromo(idx)}
                        className="p-2 text-slate-500 hover:text-red-400 transition"
                        title="Remover pacote"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* SEÇÃO: DESCONTO PROGRESSIVO POR VALOR TOTAL DE COMPRA */}
            <div className="pt-6 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Desconto Progressivo por Valor Total de Compra
                  </h4>
                  <p className="text-xs text-slate-400">
                    Configuração ex: "A partir de R$ 30,00 de compra, cada cota sai por R$ 0,80".
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const regras = form.descontoPorValorTotal || [];
                    setForm(prev => ({
                      ...prev,
                      descontoPorValorTotal: [
                        ...regras,
                        { aPartirDeValor: 0, valorCotaComDesconto: 0.00 }
                      ]
                    }));
                  }}
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1 border border-emerald-500/30 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Regra de Desconto
                </button>
              </div>

              <div className="space-y-2">
                {(form.descontoPorValorTotal || []).length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Nenhuma regra de desconto por valor configurada.</p>
                ) : (
                  (form.descontoPorValorTotal || []).map((regra, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-300">A partir de R$</span>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={regra.aPartirDeValor}
                        onChange={e => {
                          const arr = [...(form.descontoPorValorTotal || [])];
                          arr[idx].aPartirDeValor = Number(e.target.value);
                          setForm(prev => ({ ...prev, descontoPorValorTotal: arr }));
                        }}
                        className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-white focus:outline-none"
                      />
                      <span className="text-xs font-bold text-slate-300">cada cota fica por R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={regra.valorCotaComDesconto}
                        onChange={e => {
                          const arr = [...(form.descontoPorValorTotal || [])];
                          arr[idx].valorCotaComDesconto = Number(e.target.value);
                          setForm(prev => ({ ...prev, descontoPorValorTotal: arr }));
                        }}
                        className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const arr = (form.descontoPorValorTotal || []).filter((_, i) => i !== idx);
                          setForm(prev => ({ ...prev, descontoPorValorTotal: arr }));
                        }}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ABA 5: OFERTAS RELÂMPAGO (UPSELL NO CHECKOUT) */}
        {abaInterna === 'upsell' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  Ofertas Relâmpago (Upsell no Checkout)
                </h3>
                <p className="text-xs text-slate-400">
                  Ofereça até 2 oportunidades extras de adicionar cotas com super desconto antes do pagamento.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {(form.ofertasRelampago || []).length > 0 && (
                  <button
                    type="button"
                    onClick={handleLimparTodasOfertas}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-xs flex items-center gap-1 border border-red-500/30 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Apagar Ofertas
                  </button>
                )}
                {(form.ofertasRelampago || []).length < 2 && (
                  <button
                    type="button"
                    onClick={handleAddOferta}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-xs flex items-center gap-1 border border-slate-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Oferta ({(form.ofertasRelampago || []).length}/2)
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {(form.ofertasRelampago || []).map((of, idx) => (
                <div key={idx} className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      Oferta Relâmpago #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveOferta(idx)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Título da Oferta"
                      value={of.titulo}
                      onChange={e => {
                        const arr = [...(form.ofertasRelampago || [])];
                        arr[idx].titulo = e.target.value;
                        setForm(prev => ({ ...prev, ofertasRelampago: arr }));
                      }}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                    />

                    <input
                      type="text"
                      placeholder="Subtítulo persuasivo"
                      value={of.subtitulo}
                      onChange={e => {
                        const arr = [...(form.ofertasRelampago || [])];
                        arr[idx].subtitulo = e.target.value;
                        setForm(prev => ({ ...prev, ofertasRelampago: arr }));
                      }}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Cotas Extras</label>
                      <input
                        type="number"
                        min="1"
                        value={of.cotasExtras}
                        onChange={e => {
                          const arr = [...(form.ofertasRelampago || [])];
                          arr[idx].cotasExtras = Number(e.target.value);
                          setForm(prev => ({ ...prev, ofertasRelampago: arr }));
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Preço Especial (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={of.preco}
                        onChange={e => {
                          const arr = [...(form.ofertasRelampago || [])];
                          arr[idx].preco = Number(e.target.value);
                          setForm(prev => ({ ...prev, ofertasRelampago: arr }));
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-amber-400 font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Selo Badge</label>
                      <input
                        type="text"
                        placeholder="Ex: 50% OFF"
                        value={of.selo}
                        onChange={e => {
                          const arr = [...(form.ofertasRelampago || [])];
                          arr[idx].selo = e.target.value;
                          setForm(prev => ({ ...prev, ofertasRelampago: arr }));
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 6: E-BOOK, ROLETA & EXTRAS */}
        {abaInterna === 'extras' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in">
            {/* Brinde Digital / E-book */}
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2 mb-1">
                <FileText className="w-5 h-5 text-emerald-400" />
                Entrega de Brinde Digital / E-book (Pós-Pagamento)
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Entregue um e-book em PDF ou brinde digital para os compradores assim que o Pix for aprovado.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nome do Brinde (Ex: E-book Guia de Investimentos 2026)"
                  value={form.ebookTitulo || ''}
                  onChange={e => setForm(prev => ({ ...prev, ebookTitulo: e.target.value }))}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />

                <input
                  type="url"
                  placeholder="Link de Download (Google Drive, Dropbox, PDF...)"
                  value={form.ebookUrl || ''}
                  onChange={e => setForm(prev => ({ ...prev, ebookUrl: e.target.value }))}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Roleta Premiada Bônus */}
            <div className="pt-6 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Roleta Premiada Interativa
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ative a animação de roleta da sorte para o participante girar após pagar o Pix.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.roletaPremiada?.ativa || false}
                    onChange={e => {
                      const ativa = e.target.checked;
                      setForm(prev => ({
                        ...prev,
                        roletaPremiada: {
                          ativa,
                          itens: prev.roletaPremiada?.itens || [
                            { titulo: '🎟️ +5 Cotas Grátis', cor: '#10b981', chancePct: 30 },
                            { titulo: '🎁 R$ 20 no Pix', cor: '#f59e0b', chancePct: 15 },
                            { titulo: '⭐ Quase! Boa sorte', cor: '#64748b', chancePct: 35 },
                            { titulo: '🏆 Super Bônus', cor: '#ec4899', chancePct: 20 },
                          ]
                        }
                      }));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
                </label>
              </div>
            </div>

            {/* Personalização de Visibilidade na Página Pública */}
            <div className="pt-6 border-t border-slate-800 space-y-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2 mb-1">
                  <Eye className="w-5 h-5 text-teal-400" />
                  Visibilidade & Exibição de Elementos (100% Editável)
                </h3>
                <p className="text-xs text-slate-400">
                  Defina exatamente o que aparece ou fica oculto para os participantes na página pública da sua campanha.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-2.5 p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="chk-exibir-ranking"
                    checked={form.exibirRanking ?? true}
                    onChange={e => setForm(prev => ({ ...prev, exibirRanking: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer accent-emerald-500"
                  />
                  <label htmlFor="chk-exibir-ranking" className="text-xs text-slate-200 font-semibold cursor-pointer select-none">
                    Exibir Ranking dos Top Compradores
                  </label>
                </div>

                <div className="flex items-center gap-2.5 p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="chk-exibir-progresso"
                    checked={form.exibirBarraProgresso ?? true}
                    onChange={e => setForm(prev => ({ ...prev, exibirBarraProgresso: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer accent-emerald-500"
                  />
                  <label htmlFor="chk-exibir-progresso" className="text-xs text-slate-200 font-semibold cursor-pointer select-none">
                    Exibir Barra de Progresso (% vendido)
                  </label>
                </div>

                <div className="flex items-center gap-2.5 p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="chk-exibir-ganhadores"
                    checked={form.exibirPaginaGanhadores ?? true}
                    onChange={e => setForm(prev => ({ ...prev, exibirPaginaGanhadores: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer accent-emerald-500"
                  />
                  <label htmlFor="chk-exibir-ganhadores" className="text-xs text-slate-200 font-semibold cursor-pointer select-none">
                    Exibir Seção de Ganhadores
                  </label>
                </div>

                <div className="flex items-center gap-2.5 p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="chk-exibir-qtd-cotas"
                    checked={form.exibirQtdCotas ?? true}
                    onChange={e => setForm(prev => ({ ...prev, exibirQtdCotas: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer accent-emerald-500"
                  />
                  <label htmlFor="chk-exibir-qtd-cotas" className="text-xs text-slate-200 font-semibold cursor-pointer select-none">
                    Exibir Quantidade de Cotas (Vendidas / Disponíveis)
                  </label>
                </div>

                <div className="flex items-center gap-2.5 p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="chk-exibir-compradores"
                    checked={form.exibirCompradores ?? true}
                    onChange={e => setForm(prev => ({ ...prev, exibirCompradores: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer accent-emerald-500"
                  />
                  <label htmlFor="chk-exibir-compradores" className="text-xs text-slate-200 font-semibold cursor-pointer select-none">
                    Exibir Compradores e Últimas Compras
                  </label>
                </div>

                <div className="flex items-center gap-2.5 p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="chk-exibir-selo"
                    checked={form.exibirSelo ?? true}
                    onChange={e => setForm(prev => ({ ...prev, exibirSelo: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer accent-emerald-500"
                  />
                  <label htmlFor="chk-exibir-selo" className="text-xs text-slate-200 font-semibold cursor-pointer select-none">
                    Exibir Selo de Destaque no Banner
                  </label>
                </div>

                <div className="flex items-center gap-2.5 p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="chk-exibir-premios"
                    checked={form.exibirPremios ?? true}
                    onChange={e => setForm(prev => ({ ...prev, exibirPremios: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer accent-emerald-500"
                  />
                  <label htmlFor="chk-exibir-premios" className="text-xs text-slate-200 font-semibold cursor-pointer select-none">
                    Exibir Lista da Premiação Oficial
                  </label>
                </div>

                <div className="flex items-center gap-2.5 p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="chk-exibir-cotas-premiadas"
                    checked={form.exibirCotasPremiadas ?? true}
                    onChange={e => setForm(prev => ({ ...prev, exibirCotasPremiadas: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer accent-emerald-500"
                  />
                  <label htmlFor="chk-exibir-cotas-premiadas" className="text-xs text-slate-200 font-semibold cursor-pointer select-none">
                    Exibir Seção de Cotas Premiadas Instantâneas
                  </label>
                </div>
              </div>

              {/* Temporizador Padrão de Animação do Sorteio */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-white block mb-0.5">
                    ⏱️ Temporizador da Animação do Sorteio
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Tempo em segundos durante o qual os números rolam desacelerando até parar no vencedor.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={form.tempoAnimacaoSorteioSegundos || 3}
                    onChange={e => setForm(prev => ({ ...prev, tempoAnimacaoSorteioSegundos: Number(e.target.value) }))}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none"
                  >
                    <option value={2}>2 segundos (Rápido)</option>
                    <option value={3}>3 segundos (Padrão)</option>
                    <option value={5}>5 segundos (Suspenso)</option>
                    <option value={8}>8 segundos (Longo)</option>
                    <option value={10}>10 segundos (Ultra Suspenso)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Exigências de Cadastro */}
            <div className="pt-6 border-t border-slate-800">
              <h3 className="text-base font-black text-white mb-2">Campos Obrigatórios no Checkout</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-cpf"
                    checked={form.exigirCpf || false}
                    onChange={e => setForm(prev => ({ ...prev, exigirCpf: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="chk-cpf" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Exigir CPF do comprador para participar do sorteio
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-email"
                    checked={form.exigirEmail || false}
                    onChange={e => setForm(prev => ({ ...prev, exigirEmail: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="chk-email" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Exigir E-mail do comprador para confirmação
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 7: PERSONALIZAR TEMA & LAYOUT */}
        {abaInterna === 'tema' && (
          <div className="animate-in fade-in">
            <TemaBuilderView
              campanha={form}
              onChangeCampanha={setForm}
              tema={form.tema || TEMA_PADRAO}
              onChangeTema={(novoTema) => setForm(prev => ({ ...prev, tema: novoTema }))}
              onSalvar={onSalvar}
              salvando={salvando}
            />
          </div>
        )}

        {/* NAVEGAÇÃO DE RODAPÉ (AVANÇAR E VOLTAR) */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={irAnterior}
            disabled={currentIndex === 0}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              currentIndex === 0
                ? 'opacity-40 cursor-not-allowed text-slate-600 bg-slate-900'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Passo Anterior</span>
          </button>

          <div className="flex items-center gap-2">
            {currentIndex < tabKeys.length - 1 ? (
              <button
                type="button"
                onClick={irProximo}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <span>Próximo Passo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSalvar}
                disabled={salvando}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95"
              >
                <Rocket className="w-4 h-4" />
                <span>{salvando ? 'Salvando...' : 'Concluir & Publicar'}</span>
              </button>
            )}
          </div>
        </div>

      </form>

      {/* MODAL DE SELEÇÃO DE QUANTIDADE DE COTAS */}
      {mostrarModalCotas && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Selecionar Quantidade de Cotas</h3>
                  <p className="text-xs text-slate-400">Escolha a quantidade de números para a sua rifa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalCotas(false)}
                className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full font-bold text-xs transition flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {[
                { label: '100 Cotas', val: 100, desc: '00 a 99 (2 dígitos)' },
                { label: '200 Cotas', val: 200, desc: '000 a 199 (3 dígitos)' },
                { label: '300 Cotas', val: 300, desc: '000 a 299 (3 dígitos)' },
                { label: '500 Cotas', val: 500, desc: '000 a 499 (3 dígitos)' },
                { label: '1.000 Cotas', val: 1000, desc: '0000 a 0999 (4 dígitos)' },
                { label: '2.500 Cotas', val: 2500, desc: '0000 a 2499 (4 dígitos)' },
                { label: '5.000 Cotas', val: 5000, desc: '0000 a 4999 (4 dígitos)' },
                { label: '10.000 Cotas', val: 10000, desc: '00000 a 09999 (5 dígitos)' },
                { label: '50.000 Cotas', val: 50000, desc: '00000 a 49999 (5 dígitos)' },
                { label: '100.000 Cotas', val: 100000, desc: '000000 a 099999 (6 dígitos)' },
                { label: '500.000 Cotas', val: 500000, desc: '000000 a 499999 (6 dígitos)' },
                { label: '1 MILHÃO', val: 1000000, desc: '0000000 a 0999999 (7 d)' },
                { label: '10 MILHÕES', val: 10000000, desc: '00000000 a 09999999 (8 d)' },
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => {
                    setForm(prev => ({ ...prev, totalCotas: opt.val }));
                    setMostrarModalCotas(false);
                  }}
                  className={`p-3 rounded-2xl text-left border transition ${
                    form.totalCotas === opt.val
                      ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                  }`}
                >
                  <p className="text-xs font-black text-white">{opt.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setMostrarModalCotas(false)}
                className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
