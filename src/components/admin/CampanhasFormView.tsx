import React, { useState, useRef } from 'react';
import { 
  Save, Sparkles, Plus, Trash2, Trophy, Gift, Zap, Image as ImageIcon, 
  Youtube, FileText, CheckCircle2, AlertCircle, ArrowLeft,
  LayoutGrid, HelpCircle, Flame, Lock, Eye, Star, Info, Rocket,
  Upload, Camera, Link as LinkIcon, RefreshCw, ChevronRight, ChevronLeft,
  DollarSign, Clock, MapPin, Tag, Check, Sparkle, GripVertical, Palette, Loader2
} from 'lucide-react';
import { Campanha, Premio, CotaPremiada, Promocao, OfertaRelampago, TEMA_PADRAO } from '../../types';
import { uploadImageToStorage, compressAndReadImage } from '../../lib/image-upload';
import { AcordeaoSecao } from './AcordeaoSecao';
import { CampanhaPublicaView } from '../CampanhaPublicaView';

const TemaBuilderView = React.lazy(() => import('./TemaBuilderView').then(m => ({ default: m.TemaBuilderView })));

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
  const [secaoAberta, setSecaoAberta] = useState<TabType | null>('basico');
  const [carregandoBanner, setCarregandoBanner] = useState(false);
  const [carregandoCarrossel, setCarregandoCarrossel] = useState(false);
  const [carregandoOrganizadorFoto, setCarregandoOrganizadorFoto] = useState(false);
  const [dragActiveBanner, setDragActiveBanner] = useState(false);
  const [dragActiveCarrossel, setDragActiveCarrossel] = useState(false);
  const [modoUrlBanner, setModoUrlBanner] = useState(false);
  const [mostrarModalCotas, setMostrarModalCotas] = useState(false);
  const [draggedPromoIdx, setDraggedPromoIdx] = useState<number | null>(null);
  const [visualizacaoMobile, setVisualizacaoMobile] = useState<'controles' | 'preview'>('controles');

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

  const tabKeys: TabType[] = ['basico', 'midia', 'premios', 'promocoes', 'upsell', 'extras', 'tema'];
  const currentIndex = secaoAberta ? tabKeys.indexOf(secaoAberta) : 0;

  const irProximo = () => {
    if (currentIndex < tabKeys.length - 1) {
      setSecaoAberta(tabKeys[currentIndex + 1]);
    }
  };

  const irAnterior = () => {
    if (currentIndex > 0) {
      setSecaoAberta(tabKeys[currentIndex - 1]);
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

      </div>

      <form onSubmit={onSalvar} className="space-y-6">
        
        {secaoAberta !== 'tema' && (
          <div className="flex lg:hidden items-center justify-center bg-slate-900 border border-slate-800 rounded-xl p-1 mb-4">
            <button
              type="button"
              onClick={() => setVisualizacaoMobile('controles')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                visualizacaoMobile === 'controles'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>✏️ Editar Formulário</span>
            </button>
            <button
              type="button"
              onClick={() => setVisualizacaoMobile('preview')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                visualizacaoMobile === 'preview'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📱 Ver Prévia ao Vivo</span>
            </button>
          </div>
        )}

        {secaoAberta !== 'tema' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className={`lg:col-span-7 space-y-4 ${visualizacaoMobile === 'preview' ? 'hidden lg:block' : 'block'}`}>
              
              {/* ABA 1: INFORMACÕES & COTAS */}
              <AcordeaoSecao 
                titulo="1. Informações & Cotas" 
                isAberto={secaoAberta === 'basico'} 
                onToggle={() => setSecaoAberta(secaoAberta === 'basico' ? null : 'basico')}
              >
          <div className="bg-slate-900/60 border border-slate-800/60 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl space-y-8 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-5">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-emerald-400" />
                  Informações Básicas do Sorteio
                </h3>
                <p className="text-xs md:text-sm text-slate-400 mt-1">
                  Defina o título principal, preço por cota e regras de participação.
                </p>
              </div>

              {/* CARD PREVISÃO DE ARRECADAÇÃO */}
              {arrecadacaoEstimada > 0 && (
                <div className="hidden md:flex items-center gap-3 px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest font-black text-emerald-500/70">Arrecadação Bruta Total</div>
                    <div className="text-lg font-mono font-black text-emerald-400">
                      R$ {arrecadacaoEstimada.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                  Título da Rifa / Sorteio *
                </label>
                <input
                  type="text"
                  placeholder="Ex: iPhone 16 Pro Max 256GB Lacrado"
                  value={form.titulo || ''}
                  onChange={e => setForm(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm font-semibold text-white focus:border-emerald-500 focus:bg-slate-900/80 transition-colors focus:outline-none placeholder:text-slate-600 shadow-inner"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                  Subtítulo / Chamada Chamativa
                </label>
                <input
                  type="text"
                  placeholder="Ex: Por apenas R$ 0,50! Frete grátis para todo o Brasil."
                  value={form.subtitulo || ''}
                  onChange={e => setForm(prev => ({ ...prev, subtitulo: e.target.value }))}
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-emerald-500 focus:bg-slate-900/80 transition-colors focus:outline-none placeholder:text-slate-600 shadow-inner"
                />
              </div>
            </div>

            <hr className="border-slate-800/60" />

            {/* MODALIDADE DA CAMPANHA: RIFA PAGA VS SORTEIO GRATUITO */}
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-200 uppercase tracking-wider block">
                Modalidade de Participação *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, modalidade: 'paga', valorCota: prev.valorCota === 0 ? undefined : prev.valorCota }))}
                  className={`p-4 rounded-2xl border text-left transition-all duration-300 relative flex items-start gap-4 ${
                    (form.modalidade || 'paga') === 'paga'
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-xl shadow-emerald-500/5'
                      : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:bg-slate-800/60 hover:border-slate-600'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${ (form.modalidade || 'paga') === 'paga' ? 'bg-emerald-500 shadow-md shadow-emerald-500/20 text-slate-950' : 'bg-slate-900 border border-slate-700 text-slate-500' }`}>
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-white flex items-center gap-2 mb-1">
                      <span>Rifa Paga (Tradicional)</span>
                      {(form.modalidade || 'paga') === 'paga' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Venda cotas por valor estipulado (ex: R$ 0,50) via Pix.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, modalidade: 'gratis', valorCota: 0, minPorCompra: 1, maxPorCompra: 1, exigirCpf: true, exigirEmail: true }))}
                  className={`p-4 rounded-2xl border text-left transition-all duration-300 relative flex items-start gap-4 ${
                    form.modalidade === 'gratis'
                      ? 'bg-purple-500/10 border-purple-500/50 text-white shadow-xl shadow-purple-500/5'
                      : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:bg-slate-800/60 hover:border-slate-600'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${ form.modalidade === 'gratis' ? 'bg-purple-500 shadow-md shadow-purple-500/20 text-white' : 'bg-slate-900 border border-slate-700 text-slate-500' }`}>
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-white flex items-center gap-2 mb-1">
                      <span>Sorteio Gratuito (0 Reais)</span>
                      {form.modalidade === 'gratis' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      1 cota grátis por CPF/Pessoa. Excelente para captar leads.
                    </p>
                  </div>
                </button>
              </div>

              {form.modalidade === 'gratis' && (
                <div className="p-4 bg-purple-900/20 border border-purple-500/20 rounded-2xl text-xs text-purple-300 flex items-start gap-3">
                  <div className="p-1.5 bg-purple-500/20 rounded-lg shrink-0">
                    <Gift className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="leading-relaxed">
                    <strong className="text-purple-200">Modo Sorteio Gratuito Ativado:</strong> O valor da cota é automaticamente fixado em R$ 0,00. A validação por CPF é ativada para garantir apenas 1 cota única por participante.
                  </span>
                </div>
              )}
            </div>

            <hr className="border-slate-800/60" />

            {/* Configuração de Modelo, Cotas e Valores */}
            <div className="space-y-6">
              <h4 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                <LayoutGrid className="w-4 h-4 text-emerald-400" />
                Configurações da Rifa
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                    Modelo de Escolha
                  </label>
                  <select
                    value={form.modelo || 'aleatorio'}
                    onChange={e => setForm(prev => ({ ...prev, modelo: e.target.value as any }))}
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 focus:bg-slate-900/80 font-medium transition-colors focus:outline-none shadow-inner"
                  >
                    <option value="aleatorio">🎲 Aleatório (Automático pelo sistema)</option>
                    <option value="manual">🔢 Manual (Cliente escolhe os números)</option>
                  </select>
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Total de Cotas (Sorteio) *
                    </label>
                    {form.totalCotas && form.totalCotas > 0 && (
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        {(() => {
                          const max = form.totalCotas - 1;
                          let dig = String(max).length;
                          if (dig < 2) dig = 2;
                          const ini = '0'.padStart(dig, '0');
                          const fim = String(max).padStart(dig, '0');
                          return `0 a ${fim}`;
                        })()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="10000000"
                      placeholder="Ex: 10000"
                      value={form.totalCotas !== undefined && form.totalCotas !== null ? form.totalCotas : ''}
                      onChange={e => setForm(prev => ({ ...prev, totalCotas: e.target.value === '' ? undefined : Number(e.target.value) }))}
                      className="flex-1 bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm font-mono font-bold text-white focus:border-emerald-500 focus:bg-slate-900/80 transition-colors focus:outline-none shadow-inner"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarModalCotas(true)}
                      className="px-4 py-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center gap-2 shadow-sm"
                    >
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="hidden sm:inline">Selecionar</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                    Valor por Cota (R$) *
                  </label>
                  {form.modalidade === 'gratis' ? (
                    <div className="w-full bg-purple-900/20 border border-purple-500/30 rounded-xl px-4 py-3.5 text-sm font-mono text-purple-300 font-black flex items-center justify-between shadow-inner">
                      <span>R$ 0,00</span>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/30">Grátis</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-slate-500 font-mono text-sm font-bold">R$</span>
                      </div>
                      <input
                        type="number"
                        step="any"
                        min="0.0001"
                        placeholder="0.50"
                        value={form.valorCota !== undefined && form.valorCota !== null ? form.valorCota : ''}
                        onChange={e => setForm(prev => ({ ...prev, valorCota: e.target.value === '' ? undefined : Number(e.target.value) }))}
                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3.5 text-sm font-mono text-emerald-400 font-black focus:border-emerald-500 focus:bg-slate-900/80 transition-colors focus:outline-none shadow-inner"
                        required
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                    Tempo de Reserva (Min)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="3"
                      max="60"
                      placeholder="Ex: 10"
                      value={form.tempoReservaMin !== undefined && form.tempoReservaMin !== null ? form.tempoReservaMin : ''}
                      onChange={e => setForm(prev => ({ ...prev, tempoReservaMin: e.target.value === '' ? undefined : Number(e.target.value) }))}
                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm font-mono font-bold text-white focus:border-emerald-500 focus:bg-slate-900/80 transition-colors focus:outline-none shadow-inner"
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <span className="text-slate-500 text-xs font-bold">min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-800/60" />

            {/* Regras adicionais */}
            <div className="space-y-6">
              <h4 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Limites & Local do Sorteio
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                    Mín. de Cotas / Pedido
                  </label>
                  {form.modalidade === 'gratis' ? (
                    <input
                      type="number"
                      value={1}
                      disabled
                      className="w-full bg-slate-900/30 border border-slate-800/50 rounded-xl px-4 py-3.5 text-sm font-mono text-purple-400/50 cursor-not-allowed shadow-inner"
                    />
                  ) : (
                    <input
                      type="number"
                      min="1"
                      placeholder="Ex: 5"
                      value={form.minPorCompra !== undefined && form.minPorCompra !== null ? form.minPorCompra : ''}
                      onChange={e => setForm(prev => ({ ...prev, minPorCompra: e.target.value === '' ? undefined : Number(e.target.value) }))}
                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm font-mono font-bold text-white focus:border-emerald-500 focus:bg-slate-900/80 transition-colors focus:outline-none shadow-inner"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                    Máx. de Cotas / Pedido
                  </label>
                  {form.modalidade === 'gratis' ? (
                    <input
                      type="number"
                      value={1}
                      disabled
                      className="w-full bg-slate-900/30 border border-slate-800/50 rounded-xl px-4 py-3.5 text-sm font-mono text-purple-400/50 cursor-not-allowed shadow-inner"
                    />
                  ) : (
                    <input
                      type="number"
                      min="1"
                      placeholder="Ex: 1000"
                      value={form.maxPorCompra !== undefined && form.maxPorCompra !== null ? form.maxPorCompra : ''}
                      onChange={e => setForm(prev => ({ ...prev, maxPorCompra: e.target.value === '' ? undefined : Number(e.target.value) }))}
                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm font-mono font-bold text-white focus:border-emerald-500 focus:bg-slate-900/80 transition-colors focus:outline-none shadow-inner"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                    Local / Origem do Sorteio
                  </label>
                  <select
                    value={form.localSorteio || 'Loteria Federal'}
                    onChange={e => setForm(prev => ({ ...prev, localSorteio: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 focus:bg-slate-900/80 font-medium transition-colors focus:outline-none shadow-inner"
                  >
                    <option value="Loteria Federal">🏛️ Loteria Federal</option>
                    <option value="Deu no Poste">🎲 Deu no Poste</option>
                    <option value="Sorteio ao Vivo Instagram">📱 Sorteio ao Vivo Instagram</option>
                    <option value="Sorteador Eletrônico">💻 Sorteador Eletrônico Oficial</option>
                  </select>
                </div>
              </div>
            </div>
            
            <hr className="border-slate-800/60" />

            {/* META PIXEL DA CAMPANHA */}
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-5 md:p-6 transition-all hover:bg-slate-800/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-sky-400" />
                    Meta Pixel Específico (Opcional)
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Deseja rastrear eventos (ViewContent, Purchase) com um Pixel exclusivo para esta rifa?
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={Boolean(form.metaPixelId)}
                    onChange={e => {
                      const ativo = e.target.checked;
                      setForm(prev => ({ ...prev, metaPixelId: ativo ? (prev.metaPixelId || '') : null }));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {Boolean(form.metaPixelId !== null && form.metaPixelId !== undefined) && (
                <div className="pt-4 mt-4 border-t border-slate-700/50 animate-in slide-in-from-top-2">
                  <input
                    type="text"
                    placeholder="Ex: 123456789012345"
                    value={form.metaPixelId || ''}
                    onChange={e => setForm(prev => ({ ...prev, metaPixelId: e.target.value.trim() }))}
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm text-white font-mono focus:border-emerald-500 focus:bg-slate-900/80 transition-colors focus:outline-none shadow-inner"
                  />
                  <span className="text-[10px] text-slate-400 mt-2 block flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> ID numérico do Pixel do Facebook (Marketing API).
                  </span>
                </div>
              )}
            </div>

            {/* Selo e Flag Promocional */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                  Selo Promocional de Destaque
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={selosPredefinidos.includes(form.selo || '') ? form.selo || '' : 'outro'}
                    onChange={e => {
                      if (e.target.value !== 'outro') {
                        setForm(prev => ({ ...prev, selo: e.target.value }));
                      }
                    }}
                    className="sm:w-1/3 bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 focus:bg-slate-900/80 transition-colors focus:outline-none shadow-inner"
                  >
                    <option value="">Nenhum selo</option>
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
                    className="flex-1 bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 focus:bg-slate-900/80 transition-colors focus:outline-none shadow-inner"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-800/60" />

            {/* Datas da Campanha e Contador Regressivo */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-black text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
                    <Clock className="w-4 h-4" />
                    Agendamento & Contador Regressivo
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Ative caso deseje definir uma data de início e término com contador em tempo real.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={!!form.agendamentoAtivo}
                    onChange={e => setForm(prev => ({ ...prev, agendamentoAtivo: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {form.agendamentoAtivo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-700/50 animate-in slide-in-from-top-2">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                      Data e Hora de Início
                    </label>
                    <input
                      type="datetime-local"
                      value={form.dataInicio || ''}
                      onChange={e => setForm(prev => ({ ...prev, dataInicio: e.target.value }))}
                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 focus:bg-slate-900/80 transition-colors focus:outline-none shadow-inner"
                    />
                    <span className="text-[10px] text-slate-400 block mt-2">
                      Antes desta data, o contador mostrará: "Faltam X dias para o início".
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                      Data e Hora de Término
                    </label>
                    <input
                      type="datetime-local"
                      value={form.dataTermino || ''}
                      onChange={e => setForm(prev => ({ ...prev, dataTermino: e.target.value }))}
                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 focus:bg-slate-900/80 transition-colors focus:outline-none shadow-inner"
                    />
                    <span className="text-[10px] text-slate-400 block mt-2">
                      Encerra as vendas e o sorteio automaticamente após o término.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <hr className="border-slate-800/60" />

            {/* Dados do Organizador e Redes Sociais */}
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-black text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
                  <Tag className="w-4 h-4" />
                  Perfil do Organizador
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Aparece no cabeçalho, no menu e nos direitos autorais da campanha.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="md:col-span-2 lg:col-span-2">
                  <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                    Nome / Marca
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Wheslley Sousa"
                    value={form.organizadorNome || ''}
                    onChange={e => setForm(prev => ({ ...prev, organizadorNome: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 focus:bg-slate-900/80 transition-colors focus:outline-none shadow-inner"
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-2">
                  <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                    Foto / Logo
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

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {form.organizadorFoto ? (
                        <div className="relative group shrink-0">
                          <img
                            src={form.organizadorFoto}
                            alt="Preview Organizador"
                            className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-md"
                          />
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, organizadorFoto: '' }))}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500/90 hover:bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                            title="Remover foto"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-950/80 border border-slate-700 flex items-center justify-center shrink-0 text-slate-400">
                          <Camera className="w-5 h-5" />
                        </div>
                      )}

                      <div className="flex-1 flex gap-2">
                        <button
                          type="button"
                          onClick={() => organizadorFileInputRef.current?.click()}
                          disabled={carregandoOrganizadorFoto}
                          className="flex-1 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                        >
                          {carregandoOrganizadorFoto ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                          ) : (
                            <Upload className="w-4 h-4 text-emerald-400" />
                          )}
                          <span>Upload</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => organizadorCameraInputRef.current?.click()}
                          disabled={carregandoOrganizadorFoto}
                          className="px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700/50 font-bold rounded-xl text-xs flex items-center justify-center transition-all active:scale-95 shadow-sm"
                          title="Tirar foto com a Câmera"
                        >
                          <Camera className="w-4 h-4 text-emerald-400" />
                        </button>
                      </div>
                    </div>

                    <input
                      type="url"
                      placeholder="Ou cole o Link (URL) aqui..."
                      value={form.organizadorFoto || ''}
                      onChange={e => setForm(prev => ({ ...prev, organizadorFoto: e.target.value }))}
                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-2 text-xs text-white focus:border-emerald-500 focus:bg-slate-900/80 transition-colors focus:outline-none shadow-inner"
                    />
                  </div>
                </div>

                <div className="md:col-span-1 lg:col-span-1">
                  <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                    Suporte WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(99) 99999-9999"
                    value={form.organizadorWhatsapp || ''}
                    onChange={e => setForm(prev => ({ ...prev, organizadorWhatsapp: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 focus:bg-slate-900/80 transition-colors focus:outline-none shadow-inner"
                  />
                </div>

                <div className="md:col-span-1 lg:col-span-1">
                  <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                    Instagram (@)
                  </label>
                  <input
                    type="text"
                    placeholder="@usuario"
                    value={form.organizadorInstagram || ''}
                    onChange={e => setForm(prev => ({ ...prev, organizadorInstagram: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 focus:bg-slate-900/80 transition-colors focus:outline-none shadow-inner"
                  />
                </div>
                
                <div className="md:col-span-1 lg:col-span-1">
                  <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                    TikTok (@)
                  </label>
                  <input
                    type="text"
                    placeholder="@usuario"
                    value={form.organizadorTiktok || ''}
                    onChange={e => setForm(prev => ({ ...prev, organizadorTiktok: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 focus:bg-slate-900/80 transition-colors focus:outline-none shadow-inner"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-800/60" />

            {/* Descrição e Regulamento */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                Regulamento & Detalhes da Entrega
              </label>
              <textarea
                rows={5}
                value={form.descricao || ''}
                onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))}
                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-4 text-sm text-slate-200 font-sans focus:border-emerald-500 focus:bg-slate-900/80 transition-colors focus:outline-none leading-relaxed shadow-inner"
                placeholder="Explique detalhadamente as regras do sorteio, prazos de entrega, frete ou condições gerais..."
              />
            </div>
          </div>
      </AcordeaoSecao>

        {/* ABA 2: FOTOS & MÍDIA (UPLOAD DIRETO DO CELULAR E CARROSSEL) */}
        <AcordeaoSecao 
          titulo="2. Fotos & Mídia" 
          isAberto={secaoAberta === 'midia'} 
          onToggle={() => setSecaoAberta(secaoAberta === 'midia' ? null : 'midia')}
        >
          <div className="bg-slate-900/60 border border-slate-800/60 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl space-y-8 animate-in fade-in">
            {/* BANNER PRINCIPAL */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-emerald-400" />
                    Capa da Campanha
                  </h3>
                  <p className="text-xs md:text-sm text-slate-400 mt-1">
                    Esta é a imagem principal que aparecerá no topo e no link do WhatsApp.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setModoUrlBanner(!modoUrlBanner)}
                  className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-emerald-400 border border-slate-700/50 font-bold rounded-xl text-xs flex items-center gap-2 transition-all self-start sm:self-auto shadow-sm"
                >
                  <LinkIcon className="w-4 h-4" />
                  {modoUrlBanner ? 'Usar Upload' : 'Inserir URL'}
                </button>
              </div>

              {modoUrlBanner ? (
                <div className="space-y-4 pt-2">
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://exemplo.com/sua-foto.jpg"
                      value={form.bannerUrl || ''}
                      onChange={e => setForm(prev => ({ ...prev, bannerUrl: e.target.value }))}
                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 focus:bg-slate-900/80 transition-colors focus:outline-none shadow-inner"
                    />
                  </div>
                  {form.bannerUrl && (
                    <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden border border-slate-700/50 bg-slate-950/50 shadow-lg">
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
                  className={`mt-4 p-8 border-2 border-dashed rounded-2xl text-center transition-all duration-300 flex flex-col items-center justify-center relative overflow-hidden shadow-inner ${
                    dragActiveBanner
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : form.bannerUrl
                      ? 'border-slate-700/50 bg-slate-950/50'
                      : 'border-slate-700 hover:border-emerald-500/50 bg-slate-950/40'
                  }`}
                >
                  {carregandoBanner ? (
                    <div className="py-10 flex flex-col items-center gap-3">
                      <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                      <span className="text-sm text-slate-300 font-bold">Otimizando imagem...</span>
                    </div>
                  ) : form.bannerUrl ? (
                    <div className="w-full max-w-md space-y-4">
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-700/50 bg-slate-950 shadow-lg group">
                        <img src={form.bannerUrl} alt="Banner da Campanha" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => bannerFileInputRef.current?.click()}
                            className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-sm shadow-lg hover:scale-105 transition-transform"
                          >
                            Trocar
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, bannerUrl: '' }))}
                            className="px-4 py-2 bg-red-500/90 text-white font-bold rounded-xl text-sm shadow-lg hover:scale-105 transition-transform"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-4 h-4" />
                          Banner enviado com sucesso!
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-sm">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white mb-1">
                          Arraste sua imagem ou clique para selecionar
                        </p>
                        <p className="text-xs text-slate-400">
                          Formatos aceitos: JPG, PNG, WEBP ou HEIC (Celular)
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => bannerCameraInputRef.current?.click()}
                          className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Tirar Foto</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => bannerFileInputRef.current?.click()}
                          className="w-full sm:w-auto px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/50 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                        >
                          <ImageIcon className="w-4 h-4 text-emerald-400" />
                          <span>Galeria</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <hr className="border-slate-800/60" />

            {/* CARROSSEL DE FOTOS ADICIONAIS */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    Carrossel Adicional
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Mostre mais ângulos, especificações e detalhes do prêmio.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => carrosselFileInputRef.current?.click()}
                  className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Fotos</span>
                </button>
              </div>

              {/* Upload Dropzone para Fotos Adicionais */}
              <div
                onDragEnter={handleDragCarrossel}
                onDragOver={handleDragCarrossel}
                onDragLeave={handleDragCarrossel}
                onDrop={handleDropCarrossel}
                className={`p-5 md:p-6 border-2 border-dashed rounded-2xl text-center transition-colors shadow-inner ${
                  dragActiveCarrossel ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700/50 bg-slate-950/40 hover:bg-slate-950/60'
                }`}
              >
                {carregandoCarrossel ? (
                  <div className="py-4 flex items-center justify-center gap-3">
                    <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                    <span className="text-sm text-slate-300 font-bold">Processando imagens...</span>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-left hidden md:block">
                      <p className="text-sm font-bold text-slate-200">
                        Adicionar mais fotos
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Arraste ou cole a URL
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <input
                        type="url"
                        placeholder="Cole o Link (URL) da imagem..."
                        value={novaFotoUrl}
                        onChange={e => setNovaFotoUrl(e.target.value)}
                        className="flex-1 bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={handleAdicionarFotoUrl}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold rounded-xl text-xs border border-slate-700/50 shrink-0 transition-colors"
                      >
                        + URL
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Grid de Fotos Carregadas */}
              {form.fotosCarrossel && form.fotosCarrossel.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                  {form.fotosCarrossel.map((foto, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-700/50 aspect-video bg-slate-950 shadow-md">
                      <img src={foto} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 px-2 py-1 bg-slate-950/80 backdrop-blur-sm rounded-lg text-[10px] font-mono text-slate-300 border border-slate-700/50">
                        #{idx + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoverFotoCarrossel(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                        title="Remover foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-slate-950/30 border border-dashed border-slate-800/80 rounded-2xl text-center">
                  <p className="text-sm text-slate-400">O carrossel está vazio.</p>
                  <button
                    type="button"
                    onClick={() => carrosselFileInputRef.current?.click()}
                    className="mt-3 text-sm text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
                  >
                    Clique aqui para adicionar imagens
                  </button>
                </div>
              )}
            </div>

            <hr className="border-slate-800/60" />

            {/* Vídeo do YouTube */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                  <Youtube className="w-4 h-4 text-red-500" />
                  Vídeo de Demonstração (YouTube)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Adicione um vídeo demonstrando o prêmio para aumentar a conversão.
                </p>
              </div>
              <input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={form.youtubeUrl || ''}
                onChange={e => setForm(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm text-white focus:border-red-500 focus:bg-slate-900/80 transition-colors focus:outline-none shadow-inner"
              />
            </div>

            <hr className="border-slate-800/60" />

            {/* PRÉVIA DO CARD DO WHATSAPP */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                  <LinkIcon className="w-4 h-4 text-emerald-400" />
                  Prévia no WhatsApp
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Assim o seu link aparecerá quando for compartilhado no WhatsApp.
                </p>
              </div>

              <div className="max-w-sm bg-[#0b141a] border border-slate-800/60 rounded-2xl p-3 space-y-2 text-white shadow-xl mx-auto sm:mx-0">
                <div className="bg-[#1f2c34] rounded-xl overflow-hidden border border-[#2c3b43]">
                  <div className="aspect-[1.91/1] w-full bg-[#111b21] overflow-hidden relative">
                    {form.bannerUrl ? (
                      <img src={form.bannerUrl} alt="WhatsApp Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                        [ Sem imagem de capa ]
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-1.5 bg-[#111b21]">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block tracking-wider">RIFAZONE.COM</span>
                    <h4 className="text-xs font-bold text-slate-100 line-clamp-1">
                      {form.titulo || 'Título da Campanha'}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {form.subtitulo || 'Participe do sorteio oficial e concorra a prêmios incríveis com pagamento Pix imediato!'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 font-medium">
                  <span>rifazone.com/{form.codigo || 'campanha'}</span>
                  <span>12:00</span>
                </div>
              </div>
            </div>
          </div>
        </AcordeaoSecao>

        {/* ABA 3: PRÊMIOS & COTAS PREMIADAS */}
        <AcordeaoSecao 
          titulo="3. Prêmios & Bilhetes Premiados" 
          isAberto={secaoAberta === 'premios'} 
          onToggle={() => setSecaoAberta(secaoAberta === 'premios' ? null : 'premios')}
        >
          <div className="bg-slate-900/60 border border-slate-800/60 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl space-y-8 animate-in fade-in">
            {/* Prêmios Principais */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Prêmios Principais
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">1º lugar, 2º lugar, 3º lugar, etc.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPremio}
                  className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold rounded-xl text-xs flex items-center gap-2 border border-amber-500/30 transition-all shadow-sm active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Prêmio
                </button>
              </div>

              <div className="space-y-3">
                {(form.premios || []).map((p, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-950/50 border border-slate-700/50 rounded-2xl shadow-inner group transition-all hover:border-amber-500/30">
                    <span className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                      {p.posicao}º
                    </span>
                    <input
                      type="text"
                      placeholder="Descrição do prêmio... (ex: iPhone 15 Pro Max)"
                      value={p.descricao}
                      onChange={e => {
                        const arr = [...(form.premios || [])];
                        arr[idx].descricao = e.target.value;
                        setForm(prev => ({ ...prev, premios: arr }));
                      }}
                      className="flex-1 bg-transparent border-none text-sm text-white focus:ring-0 focus:outline-none placeholder:text-slate-600"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePremio(idx)}
                      className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-slate-800/60" />

            {/* Cotas Premiadas Instantâneas */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                    <Gift className="w-4 h-4 text-emerald-400" />
                    Cotas Premiadas (Ganha na Hora)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Se o comprador tirar o número premiado, ganha o valor instantaneamente!
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(form.cotasPremiadas || []).length > 0 && (
                    <button
                      type="button"
                      onClick={handleLimparTodasCotasPremiadas}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-xs flex items-center gap-2 border border-red-500/30 transition-all shadow-sm active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                      Apagar Todas
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleGerarCotasPremiadasAleatorias(5)}
                    className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-bold rounded-xl text-xs flex items-center gap-2 border border-purple-500/30 transition-all shadow-sm active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    Gerar 5 Aleatórias
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCotaPremiada}
                    className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-xl text-xs flex items-center gap-2 border border-emerald-500/30 transition-all shadow-sm active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    Nova Cota
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {(form.cotasPremiadas || []).length === 0 ? (
                  <div className="p-8 bg-slate-950/40 border border-dashed border-slate-700/50 rounded-2xl text-center">
                    <p className="text-sm text-slate-400 mb-2">Nenhuma cota premiada cadastrada no momento.</p>
                    <button
                      type="button"
                      onClick={() => handleGerarCotasPremiadasAleatorias(5)}
                      className="text-sm text-emerald-400 font-bold hover:text-emerald-300 transition-colors"
                    >
                      + Clique aqui para gerar 5 números premiados automaticamente
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {(form.cotasPremiadas || []).map((cp, idx) => {
                    return (
                      <div key={idx} className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-950/50 border border-slate-700/50 rounded-2xl shadow-inner group">
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                              <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold tracking-wider">Número</label>
                              <input
                                type="text"
                                placeholder="ex: 0421"
                                value={cp.numero}
                                onChange={e => {
                                  const arr = [...(form.cotasPremiadas || [])];
                                  arr[idx].numero = e.target.value;
                                  setForm(prev => ({ ...prev, cotasPremiadas: arr }));
                                }}
                                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
                                required
                              />
                            </div>
                            <div className="flex-[2]">
                              <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold tracking-wider">Prêmio</label>
                              <input
                                type="text"
                                placeholder="ex: R$ 200 no Pix"
                                value={cp.premio}
                                onChange={e => {
                                  const arr = [...(form.cotasPremiadas || [])];
                                  arr[idx].premio = e.target.value;
                                  setForm(prev => ({ ...prev, cotasPremiadas: arr }));
                                }}
                                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                              Status: <strong className="text-emerald-400 ml-1">{cp.status}</strong>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center sm:items-start justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveCotaPremiada(idx)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                            title="Remover Cota Premiada"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
                </div>
              </div>
            </div>
          </AcordeaoSecao>
        
        {/* ABA 4: PROMOÇÕES & PACOTES */}
        <AcordeaoSecao 
          titulo="4. Pacotes & Descontos" 
          isAberto={secaoAberta === 'promocoes'} 
          onToggle={() => setSecaoAberta(secaoAberta === 'promocoes' ? null : 'promocoes')}
        >
          <div className="bg-slate-900/60 border border-slate-800/60 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl space-y-8 animate-in fade-in">
            {form.modalidade === 'gratis' && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-sm text-purple-300 flex items-center gap-3">
                <Gift className="w-5 h-5 text-purple-400 shrink-0" />
                <span className="leading-relaxed">
                  <strong className="text-purple-200">Aviso de Sorteio Gratuito:</strong> Em sorteios gratuitos, pacotes de cotas pagas não são exibidos na página pública.
                </span>
              </div>
            )}

            {/* PACOTES PROMOCIONAIS */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Pacotes Promocionais por Volume
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Aumente suas vendas oferecendo descontos para quem compra em maior quantidade.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(form.promocoes || []).length > 0 && (
                    <button
                      type="button"
                      onClick={handleLimparTodasPromocoes}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-xs flex items-center gap-2 border border-red-500/30 transition-all shadow-sm active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                      Apagar Pacotes
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleGerarPromocoesSugeridas}
                    className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-xl text-xs flex items-center gap-2 border border-emerald-500/30 transition-all shadow-sm active:scale-95"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    Gerar Inteligentes
                  </button>
                  <button
                    type="button"
                    onClick={handleAddPromo}
                    className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-emerald-400 border border-slate-700/50 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Pacote
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {(form.promocoes || []).length === 0 ? (
                  <div className="p-8 bg-slate-950/40 border border-dashed border-slate-700/50 rounded-2xl text-center">
                    <p className="text-sm text-slate-400 mb-2">Nenhum pacote promocional cadastrado.</p>
                    <button
                      type="button"
                      onClick={handleGerarPromocoesSugeridas}
                      className="text-sm text-emerald-400 font-bold hover:text-emerald-300 transition-colors"
                    >
                      + Gerar pacotes inteligentes automaticamente com desconto progressivo
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
                      className={`p-4 bg-slate-950/50 border rounded-2xl flex flex-col sm:flex-row gap-4 items-center transition-all group shadow-inner ${
                        draggedPromoIdx === idx
                          ? 'border-emerald-500/50 bg-emerald-500/5 opacity-50 scale-[0.99]'
                          : 'border-slate-700/50 hover:border-emerald-500/30 hover:bg-slate-900/50'
                      }`}
                    >
                      {/* Alça de Arrastar */}
                      <div className="hidden sm:flex items-center justify-center p-2 text-slate-600 hover:text-emerald-400 cursor-grab active:cursor-grabbing transition-colors" title="Arraste para reordenar">
                        <GripVertical className="w-5 h-5" />
                      </div>

                      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold tracking-wider">Qtd. de Cotas</label>
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
                            className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold tracking-wider">Valor Total (R$)</label>
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
                            className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-4 sm:gap-6 border-t border-slate-800/60 sm:border-t-0 pt-4 sm:pt-0">
                        <label className="flex items-center gap-2 cursor-pointer group/label">
                          <input
                            type="checkbox"
                            checked={!!promo.destaque}
                            onChange={e => {
                              const arr = [...(form.promocoes || [])];
                              arr[idx].destaque = e.target.checked;
                              setForm(prev => ({ ...prev, promocoes: arr }));
                            }}
                            className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700/50 cursor-pointer focus:ring-emerald-500 focus:ring-offset-slate-950"
                          />
                          <span className="text-xs text-slate-400 font-medium group-hover/label:text-slate-300 transition-colors">
                            Selo "Mais Popular"
                          </span>
                        </label>

                        <button
                          type="button"
                          onClick={() => handleRemovePromo(idx)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                          title="Remover pacote"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <hr className="border-slate-800/60" />

            {/* SEÇÃO: DESCONTO PROGRESSIVO POR VALOR TOTAL DE COMPRA */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Desconto Progressivo por Valor Total
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Exemplo: "A partir de R$ 30,00 de compra, cada cota sai por R$ 0,80".
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
                  className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-emerald-400 border border-slate-700/50 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Regra
                </button>
              </div>

              <div className="space-y-3">
                {(form.descontoPorValorTotal || []).length === 0 ? (
                  <p className="text-sm text-slate-500 italic p-4 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                    Nenhuma regra de desconto por valor configurada.
                  </p>
                ) : (
                  (form.descontoPorValorTotal || []).map((regra, idx) => (
                    <div key={idx} className="p-4 bg-slate-950/50 border border-slate-700/50 rounded-2xl flex flex-wrap sm:flex-nowrap items-center gap-3 shadow-inner">
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-wider shrink-0">A partir de R$</span>
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
                        className="w-24 sm:w-28 bg-slate-900 border border-slate-700/50 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
                      />
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-wider shrink-0">cada cota fica por R$</span>
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
                        className="w-24 sm:w-28 bg-slate-900 border border-slate-700/50 rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const arr = (form.descontoPorValorTotal || []).filter((_, i) => i !== idx);
                          setForm(prev => ({ ...prev, descontoPorValorTotal: arr }));
                        }}
                        className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors ml-auto shrink-0"
                        title="Remover Regra"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </AcordeaoSecao>

        {/* ABA 5: OFERTAS RELÂMPAGO (UPSELL NO CHECKOUT) */}
        <AcordeaoSecao 
          titulo="5. Ofertas Relâmpago" 
          isAberto={secaoAberta === 'upsell'} 
          onToggle={() => setSecaoAberta(secaoAberta === 'upsell' ? null : 'upsell')}
        >
          <div className="bg-slate-900/60 border border-slate-800/60 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl space-y-8 animate-in fade-in">
            {form.modalidade === 'gratis' && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-sm text-purple-300 flex items-center gap-3">
                <Gift className="w-5 h-5 text-purple-400 shrink-0" />
                <span className="leading-relaxed">
                  <strong className="text-purple-200">Aviso de Sorteio Gratuito:</strong> Ofertas relâmpago de pagamento não são exibidas em sorteios 100% gratuitos.
                </span>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                    <Flame className="w-4 h-4 text-amber-400" />
                    Ofertas Relâmpago (Upsell Checkout)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Ofereça até 2 oportunidades extras de adicionar cotas com super desconto antes do pagamento.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {(form.ofertasRelampago || []).length > 0 && (
                    <button
                      type="button"
                      onClick={handleLimparTodasOfertas}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-xs flex items-center gap-2 border border-red-500/30 transition-all shadow-sm active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                      Apagar Ofertas
                    </button>
                  )}
                  {(form.ofertasRelampago || []).length < 2 && (
                    <button
                      type="button"
                      onClick={handleAddOferta}
                      className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold rounded-xl text-xs flex items-center gap-2 border border-amber-500/30 transition-all shadow-sm active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Oferta ({(form.ofertasRelampago || []).length}/2)
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {(form.ofertasRelampago || []).map((of, idx) => (
                  <div key={idx} className="p-5 md:p-6 bg-slate-950/50 border border-slate-700/50 rounded-2xl space-y-4 shadow-inner relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                        <Flame className="w-3.5 h-3.5" />
                        Oferta #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOferta(idx)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold tracking-wider">Título da Oferta</label>
                        <input
                          type="text"
                          placeholder="Ex: Leve mais 10 números!"
                          value={of.titulo}
                          onChange={e => {
                            const arr = [...(form.ofertasRelampago || [])];
                            arr[idx].titulo = e.target.value;
                            setForm(prev => ({ ...prev, ofertasRelampago: arr }));
                          }}
                          className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold tracking-wider">Subtítulo persuasivo</label>
                        <input
                          type="text"
                          placeholder="Aumente suas chances por apenas..."
                          value={of.subtitulo}
                          onChange={e => {
                            const arr = [...(form.ofertasRelampago || [])];
                            arr[idx].subtitulo = e.target.value;
                            setForm(prev => ({ ...prev, ofertasRelampago: arr }));
                          }}
                          className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold tracking-wider">Cotas Extras</label>
                        <input
                          type="number"
                          min="1"
                          placeholder="10"
                          value={of.cotasExtras}
                          onChange={e => {
                            const arr = [...(form.ofertasRelampago || [])];
                            arr[idx].cotasExtras = Number(e.target.value);
                            setForm(prev => ({ ...prev, ofertasRelampago: arr }));
                          }}
                          className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold tracking-wider">Preço Especial (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                          value={of.preco}
                          onChange={e => {
                            const arr = [...(form.ofertasRelampago || [])];
                            arr[idx].preco = Number(e.target.value);
                            setForm(prev => ({ ...prev, ofertasRelampago: arr }));
                          }}
                          className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-amber-400 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold tracking-wider">Selo Promocional</label>
                        <input
                          type="text"
                          placeholder="Ex: 50% OFF"
                          value={of.selo}
                          onChange={e => {
                            const arr = [...(form.ofertasRelampago || [])];
                            arr[idx].selo = e.target.value;
                            setForm(prev => ({ ...prev, ofertasRelampago: arr }));
                          }}
                          className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AcordeaoSecao>

        {/* ABA 6: E-BOOK, ROLETA & EXTRAS */}
        <AcordeaoSecao 
          titulo="6. Brindes & Roleta" 
          isAberto={secaoAberta === 'extras'} 
          onToggle={() => setSecaoAberta(secaoAberta === 'extras' ? null : 'extras')}
        >
          <div className="bg-slate-900/60 border border-slate-800/60 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl space-y-8 animate-in fade-in">
            {/* Brinde Digital / E-book */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider mb-1">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Entrega de Brinde Digital / E-book (Pós-Pagamento)
                </h3>
                <p className="text-xs text-slate-400">
                  Entregue um e-book em PDF ou brinde digital para os compradores assim que o Pix for aprovado.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nome do Brinde (Ex: E-book Guia 2026)"
                  value={form.ebookTitulo || ''}
                  onChange={e => setForm(prev => ({ ...prev, ebookTitulo: e.target.value }))}
                  className="bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors shadow-inner"
                />

                <input
                  type="url"
                  placeholder="Link de Download (Drive, Dropbox, PDF...)"
                  value={form.ebookUrl || ''}
                  onChange={e => setForm(prev => ({ ...prev, ebookUrl: e.target.value }))}
                  className="bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors shadow-inner"
                />
              </div>
            </div>

            <hr className="border-slate-800/60" />

            {/* Roleta Premiada Bônus */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Roleta Premiada Interativa
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Ative a animação de roleta da sorte para o participante girar após pagar o Pix.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer scale-110">
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
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500" />
                </label>
              </div>
            </div>

            <hr className="border-slate-800/60" />

            {/* Personalização de Visibilidade na Página Pública */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider mb-1">
                  <Eye className="w-4 h-4 text-teal-400" />
                  Visibilidade & Exibição de Elementos
                </h3>
                <p className="text-xs text-slate-400">
                  Defina o que aparece ou fica oculto para os participantes na página pública da sua campanha.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 md:p-6 bg-slate-950/40 border border-slate-700/50 rounded-2xl shadow-inner">
                <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
                  <input
                    type="checkbox"
                    id="chk-exibir-ranking"
                    checked={form.exibirRanking ?? true}
                    onChange={e => setForm(prev => ({ ...prev, exibirRanking: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-600 cursor-pointer accent-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950"
                  />
                  <label htmlFor="chk-exibir-ranking" className="text-sm text-slate-200 font-medium cursor-pointer select-none">
                    Ranking de Compradores
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
                  <input
                    type="checkbox"
                    id="chk-exibir-progresso"
                    checked={form.exibirBarraProgresso ?? true}
                    onChange={e => setForm(prev => ({ ...prev, exibirBarraProgresso: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-600 cursor-pointer accent-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950"
                  />
                  <label htmlFor="chk-exibir-progresso" className="text-sm text-slate-200 font-medium cursor-pointer select-none">
                    Barra de Progresso (% vendido)
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
                  <input
                    type="checkbox"
                    id="chk-exibir-ganhadores"
                    checked={form.exibirPaginaGanhadores ?? true}
                    onChange={e => setForm(prev => ({ ...prev, exibirPaginaGanhadores: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-600 cursor-pointer accent-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950"
                  />
                  <label htmlFor="chk-exibir-ganhadores" className="text-sm text-slate-200 font-medium cursor-pointer select-none">
                    Seção de Ganhadores
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
                  <input
                    type="checkbox"
                    id="chk-exibir-qtd-cotas"
                    checked={form.exibirQtdCotas ?? true}
                    onChange={e => setForm(prev => ({ ...prev, exibirQtdCotas: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-600 cursor-pointer accent-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950"
                  />
                  <label htmlFor="chk-exibir-qtd-cotas" className="text-sm text-slate-200 font-medium cursor-pointer select-none">
                    Qtd. de Cotas (Vendidas / Disponíveis)
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
                  <input
                    type="checkbox"
                    id="chk-exibir-compradores"
                    checked={form.exibirCompradores ?? true}
                    onChange={e => setForm(prev => ({ ...prev, exibirCompradores: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-600 cursor-pointer accent-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950"
                  />
                  <label htmlFor="chk-exibir-compradores" className="text-sm text-slate-200 font-medium cursor-pointer select-none">
                    Compradores Recentes
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
                  <input
                    type="checkbox"
                    id="chk-exibir-selo"
                    checked={form.exibirSelo ?? true}
                    onChange={e => setForm(prev => ({ ...prev, exibirSelo: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-600 cursor-pointer accent-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950"
                  />
                  <label htmlFor="chk-exibir-selo" className="text-sm text-slate-200 font-medium cursor-pointer select-none">
                    Selo de Destaque no Banner
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
                  <input
                    type="checkbox"
                    id="chk-exibir-premios"
                    checked={form.exibirPremios ?? true}
                    onChange={e => setForm(prev => ({ ...prev, exibirPremios: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-600 cursor-pointer accent-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950"
                  />
                  <label htmlFor="chk-exibir-premios" className="text-sm text-slate-200 font-medium cursor-pointer select-none">
                    Lista da Premiação Oficial
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
                  <input
                    type="checkbox"
                    id="chk-exibir-cotas-premiadas"
                    checked={form.exibirCotasPremiadas ?? true}
                    onChange={e => setForm(prev => ({ ...prev, exibirCotasPremiadas: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-600 cursor-pointer accent-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950"
                  />
                  <label htmlFor="chk-exibir-cotas-premiadas" className="text-sm text-slate-200 font-medium cursor-pointer select-none">
                    Cotas Premiadas Instantâneas
                  </label>
                </div>
              </div>

              {/* Temporizador Padrão de Animação do Sorteio */}
              <div className="p-5 bg-slate-950/40 border border-slate-700/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
                <div>
                  <label className="text-sm font-bold text-white block mb-1">
                    ⏱️ Temporizador da Animação do Sorteio
                  </label>
                  <p className="text-xs text-slate-400">
                    Tempo em segundos durante o qual os números rolam desacelerando até parar no vencedor.
                  </p>
                </div>
                <div className="flex items-center shrink-0">
                  <select
                    value={form.tempoAnimacaoSorteioSegundos || 3}
                    onChange={e => setForm(prev => ({ ...prev, tempoAnimacaoSorteioSegundos: Number(e.target.value) }))}
                    className="bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
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

            <hr className="border-slate-800/60" />

            {/* Exigências de Cadastro */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Campos Obrigatórios no Checkout</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-slate-950/30 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-900/50 transition-colors group">
                  <input
                    type="checkbox"
                    checked={form.exigirCpf || false}
                    onChange={e => setForm(prev => ({ ...prev, exigirCpf: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700/50 cursor-pointer focus:ring-emerald-500 focus:ring-offset-slate-950"
                  />
                  <span className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">
                    Exigir CPF do comprador para participar do sorteio
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-950/30 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-900/50 transition-colors group">
                  <input
                    type="checkbox"
                    checked={form.exigirEmail || false}
                    onChange={e => setForm(prev => ({ ...prev, exigirEmail: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700/50 cursor-pointer focus:ring-emerald-500 focus:ring-offset-slate-950"
                  />
                  <span className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">
                    Exigir E-mail do comprador para confirmação
                  </span>
                </label>
              </div>
            </div>
          </div>
        </AcordeaoSecao>

          <div className={`lg:col-span-5 ${visualizacaoMobile === 'controles' ? 'hidden lg:block' : 'block'}`}>
            <div className="sticky top-6 space-y-3">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Prévia em Tempo Real
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  Mockup Smartphone ~390px
                </span>
              </div>

              <div className="mx-auto w-full max-w-[390px] bg-slate-950 border-[6px] border-slate-800 rounded-[44px] p-2 shadow-2xl shadow-emerald-950/20 relative">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-40 flex items-center justify-center">
                  <div className="w-8 h-1 bg-slate-800 rounded-full" />
                </div>
                <div className="h-6 bg-slate-950 rounded-t-[34px] px-6 flex items-center justify-between text-[10px] font-bold text-slate-400 select-none z-30 relative pt-1">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <span>5G</span>
                    <div className="w-4 h-2 border border-slate-400 rounded-sm p-0.5 flex items-center">
                      <div className="w-full h-full bg-emerald-400 rounded-2xs" />
                    </div>
                  </div>
                </div>
                <div 
                  className="w-full h-[660px] bg-slate-950 rounded-[34px] overflow-y-auto overflow-x-hidden relative border border-slate-800/80 custom-scrollbar"
                  style={{
                    backgroundColor: (form.tema && form.tema.cores && form.tema.cores.fundo) || '#020617',
                    color: (form.tema && form.tema.cores && form.tema.cores.texto) || '#f8fafc'
                  }}
                >
                  <CampanhaPublicaView
                    modoPreview={true}
                    previewCampanha={{
                      ...form,
                      id: form.id || 'preview-id',
                      codigo: form.codigo || 'preview-campanha',
                      titulo: form.titulo || 'Título da Sua Campanha',
                      subtitulo: form.subtitulo || 'Subtítulo da campanha...',
                      descricao: form.descricao || 'Regulamento e detalhes da campanha...',
                      bannerUrl: form.bannerUrl || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
                      totalCotas: Number(form.totalCotas) || 10000,
                      valorCota: Number(form.valorCota) || 0.50,
                      minPorCompra: Number(form.minPorCompra) || 1,
                      maxPorCompra: Number(form.maxPorCompra) || 50000,
                      localSorteio: form.localSorteio || 'Loteria Federal',
                      modelo: form.modelo || 'aleatorio',
                      status: 'publicada',
                      premios: form.premios || [{ posicao: 1, descricao: 'Prêmio Principal' }],
                      cotasPremiadas: form.cotasPremiadas || [],
                      promocoes: form.promocoes || [],
                      ofertasRelampago: form.ofertasRelampago || [],
                      exibirRanking: form.exibirRanking ?? true,
                      exibirBarraProgresso: form.exibirBarraProgresso ?? true,
                      exibirPaginaGanhadores: form.exibirPaginaGanhadores ?? true,
                      exibirPremios: form.exibirPremios ?? true,
                      exibirCotasPremiadas: form.exibirCotasPremiadas ?? true,
                      exibirSelo: form.exibirSelo ?? true,
                      criadaEm: new Date().toISOString()
                    } as any}
                    previewTema={form.tema || TEMA_PADRAO}
                  />
                </div>
                <div className="h-4 flex items-center justify-center pt-1">
                  <div className="w-24 h-1 bg-slate-700 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      ) : (
        <div className="animate-in fade-in">
          <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center p-12 gap-4 bg-slate-900/60 border border-slate-800/60 backdrop-blur-xl rounded-3xl shadow-2xl">
              <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-slate-400 animate-pulse">Carregando construtor de temas...</p>
            </div>
          }>
            <TemaBuilderView
              campanha={form}
              onChangeCampanha={setForm}
              tema={form.tema || TEMA_PADRAO}
              onChangeTema={(novoTema) => setForm(prev => ({ ...prev, tema: novoTema }))}
              onSalvar={onSalvar}
              salvando={salvando}
            />
          </React.Suspense>
        </div>
      )}

        {/* NAVEGAÇÃO DE RODAPÉ (AVANÇAR E VOLTAR) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 mt-4 border-t border-slate-800/60">
          <button
            type="button"
            onClick={irAnterior}
            disabled={currentIndex === 0}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
              currentIndex === 0
                ? 'opacity-40 cursor-not-allowed text-slate-600 bg-slate-900/50'
                : 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700/50 hover:text-white active:scale-95'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Passo Anterior</span>
          </button>

          <div className="flex w-full sm:w-auto items-center gap-3">
            {currentIndex < tabKeys.length - 1 ? (
              <button
                type="button"
                onClick={irProximo}
                className="w-full sm:w-auto px-8 py-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 hover:border-emerald-500/50 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
              >
                <span>Próximo Passo</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSalvar}
                disabled={salvando}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {salvando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5" />
                    <span>Concluir & Publicar</span>
                  </>
                )}
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
