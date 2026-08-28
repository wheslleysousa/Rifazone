import React, { useState, useRef, useEffect } from 'react';
import { motion, Reorder, AnimatePresence, useDragControls } from 'motion/react';
import { 
  Save, Sparkles, Plus, Trash2, Trophy, Gift, Zap, Image as ImageIcon, 
  Youtube, FileText, CheckCircle2, AlertCircle, ArrowLeft,
  LayoutGrid, HelpCircle, Flame, Lock, Eye, Star, Info, Rocket,
  Upload, Camera, User, Link as LinkIcon, RefreshCw, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, ArrowUp, ArrowDown,
  DollarSign, Clock, MapPin, Tag, Check, Sparkle, GripVertical, Palette, Loader2, CreditCard, ShieldCheck,
  Instagram, MessageSquare, Music, Share2
} from 'lucide-react';
import { WhatsAppIcon, TikTokIcon, InstagramIcon } from '../BrandIcons';
import { Campanha, Premio, CotaPremiada, Promocao, OfertaRelampago, TEMA_PADRAO, CheckoutSalvo } from '../../types';
import { uploadImageToStorage, compressAndReadImage } from '../../lib/image-upload';
import { AcordeaoSecao } from './AcordeaoSecao';
import { CampanhaPublicaView } from '../CampanhaPublicaView';

interface Props {
  form: Partial<Campanha>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Campanha>>>;
  onSalvar: () => void;
  salvando: boolean;
  erro: string;
  onCancelar: () => void;
  onAbrirIA: () => void;
  iaAviso: string;
  onVerPrevia?: () => void;
  authFetch?: (url: string, options?: RequestInit) => Promise<Response>;
}

type TabType = 'basico' | 'midia' | 'premios' | 'promocoes' | 'upsell' | 'extras' | 'checkout';


export const gerarSlugCampanha = (texto: string): string => {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
};

const FotoItem = ({ 
  foto, 
  idx, 
  onRemover, 
  onTornarPrincipal 
}: any) => {
  const controls = useDragControls();
  
  return (
    <Reorder.Item 
      value={foto}
      dragListener={false}
      dragControls={controls}
      className="relative shrink-0 w-72 md:w-96 h-56 rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl group/item"
    >
      <img src={foto} alt={`Foto ${idx + 1}`} className="w-full h-full object-contain bg-slate-900 opacity-80 group-hover/item:opacity-100 transition-opacity" />
      
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemover(idx);
        }}
        className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-xl shadow-lg hover:scale-110 transition-transform z-20"
        title="Remover"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[1px]">
        <button
          type="button"
          onClick={() => onTornarPrincipal(idx)}
          className="px-4 py-2 bg-emerald-500 text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-wider shadow-xl hover:scale-105 transition-transform flex items-center gap-1.5"
        >
          <Star className="w-3 h-3" />
          Tornar Principal
        </button>
        <div 
          onPointerDown={(e) => controls.start(e)}
          className="p-2.5 bg-white/10 text-white rounded-xl backdrop-blur-md border border-white/10 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      </div>
    </Reorder.Item>
  );
};

export const CampanhasFormView: React.FC<Props> = ({
  form,
  setForm,
  onSalvar,
  salvando,
  erro,
  onCancelar,
  onAbrirIA,
  iaAviso,
  onVerPrevia,
  authFetch
}) => {
  const [novaFotoUrl, setNovaFotoUrl] = useState('');
  const [secaoAberta, setSecaoAberta] = useState<TabType | null>('basico');
  const [carregandoBanner, setCarregandoBanner] = useState(false);
  const [carregandoCarrossel, setCarregandoCarrossel] = useState(false);
  const [carregandoOrganizadorFoto, setCarregandoOrganizadorFoto] = useState(false);
  const [carregandoCabecalhoLogo, setCarregandoCabecalhoLogo] = useState(false);
  const [dragActiveBanner, setDragActiveBanner] = useState(false);
  const [dragActiveCarrossel, setDragActiveCarrossel] = useState(false);
  const [modoUrlBanner, setModoUrlBanner] = useState(false);
  const [mostrarModalCotas, setMostrarModalCotas] = useState(false);
  const [mostrarSeletorCotas, setMostrarSeletorCotas] = useState(false);
  const [modoPersonalizadoCotas, setModoPersonalizadoCotas] = useState(false);
  const [descontoAtivo, setDescontoAtivo] = useState(!!(form.descontoPorValorTotal && form.descontoPorValorTotal.length > 0));
  const [draggedPromoIdx, setDraggedPromoIdx] = useState<number | null>(null);
  const [visualizacaoMobile, setVisualizacaoMobile] = useState<'controles' | 'preview'>('controles');
  const [checkoutsSalvos, setCheckoutsSalvos] = useState<CheckoutSalvo[]>([]);
  const [abertoCorPremioIdx, setAbertoCorPremioIdx] = useState<number | null>(null);

  useEffect(() => {
    if (authFetch) {
      authFetch('/api/admin/checkouts')
        .then(r => r.ok ? r.json() : [])
        .then(data => setCheckoutsSalvos(data))
        .catch(() => {});
    }
  }, [authFetch]);

  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const bannerCameraInputRef = useRef<HTMLInputElement>(null);
  const carrosselFileInputRef = useRef<HTMLInputElement>(null);
  const organizadorFileInputRef = useRef<HTMLInputElement>(null);
  const organizadorCameraInputRef = useRef<HTMLInputElement>(null);
  const cabecalhoLogoFileInputRef = useRef<HTMLInputElement>(null);

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

  const handleCabecalhoLogoUpload = async (file: File) => {
    try {
      setCarregandoCabecalhoLogo(true);
      const url = await uploadImageToStorage(file, 'logoscabecalho', 600, 600, 0.9);
      setForm(prev => ({ ...prev, cabecalhoLogoUrl: url }));
    } catch (err: any) {
      alert(err.message || 'Erro ao carregar logo do cabeçalho.');
    } finally {
      setCarregandoCabecalhoLogo(false);
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

  const tabsConfig: { id: TabType; label: string; icon: any; iconColor: string; desc: string }[] = [
    { id: 'basico', label: '1. Informações & Cotas', icon: DollarSign, iconColor: 'text-emerald-400', desc: 'Título, valor da cota e regras' },
    { id: 'midia', label: '2. Fotos & Mídia', icon: Camera, iconColor: 'text-blue-400', desc: 'Banner principal do celular e carrossel' },
    { id: 'premios', label: '3. Prêmios & Bilhetes Premiados', icon: Trophy, iconColor: 'text-amber-400', desc: 'Prêmio principal e cotas instantâneas' },
    { id: 'promocoes', label: '4. Pacotes & Descontos', icon: Zap, iconColor: 'text-purple-400', desc: 'Combos de cotas promocionais' },
    { id: 'upsell', label: '5. Ofertas Relâmpago', icon: Flame, iconColor: 'text-orange-400', desc: 'Aumente o ticket no checkout' },
    { id: 'extras', label: '6. Brindes & Roleta', icon: Gift, iconColor: 'text-pink-400', desc: 'E-book digital e roleta bônus' },
    { id: 'checkout', label: '7. Modelo de Checkout', icon: CreditCard, iconColor: 'text-indigo-400', desc: 'Selecione a experiência de pagamento' }
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
  const [confirmExcluirIdx, setConfirmExcluirIdx] = useState<number | 'banner' | null>(null);

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
  const calcularValoresPacotePromo = (
    qtd: number,
    valorCota: number,
    regrasDesconto?: { aPartirDeValor: number; valorCotaComDesconto: number }[],
    valorManual?: number
  ) => {
    const unitPrice = Number(valorCota) || 0;
    const valQtd = Number(qtd) || 0;
    const regularTotal = Number((valQtd * unitPrice).toFixed(2));

    if (valQtd <= 0 || unitPrice <= 0) {
      return {
        valor: valorManual && valorManual > 0 ? valorManual : 0,
        descontoPct: undefined,
        regularTotal: 0,
        temDesconto: false
      };
    }

    let valorCalculado = regularTotal;

    // Se houver regras de desconto por valor total ativas
    if (regrasDesconto && regrasDesconto.length > 0) {
      const regrasOrdenadas = [...regrasDesconto].sort(
        (a, b) => Number(b.aPartirDeValor) - Number(a.aPartirDeValor)
      );
      const regraValida = regrasOrdenadas.find(r => regularTotal >= Number(r.aPartirDeValor));
      if (regraValida && Number(regraValida.valorCotaComDesconto) > 0 && Number(regraValida.valorCotaComDesconto) < unitPrice) {
        valorCalculado = Number((valQtd * Number(regraValida.valorCotaComDesconto)).toFixed(2));
      }
    }

    const valorFinal = (valorManual !== undefined && valorManual > 0) ? valorManual : valorCalculado;
    const temDesconto = regularTotal > 0 && valorFinal > 0 && valorFinal < regularTotal;
    const descontoPct = temDesconto ? Math.round((1 - (valorFinal / regularTotal)) * 100) : undefined;

    return {
      valor: valorFinal,
      descontoPct,
      regularTotal,
      temDesconto
    };
  };

  const handleAddPromo = () => {
    const promos = form.promocoes || [];
    setForm(prev => ({
      ...prev,
      promocoes: [...promos, { quantidade: 0, valor: 0.00, destaque: false }]
    }));
  };

  const handleMoverPromo = (idx: number, direcao: 'up' | 'down') => {
    const list = [...(form.promocoes || [])];
    const targetIdx = direcao === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const item = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = item;
    setForm(prev => ({ ...prev, promocoes: list }));
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
    if (!window.confirm("Deseja realmente remover este pacote promocional?")) return;
    const promos = (form.promocoes || []).filter((_, i) => i !== idx);
    setForm(prev => ({ ...prev, promocoes: promos }));
  };

  const handleLimparTodasPromocoes = () => {
    if (!window.confirm("Deseja realmente apagar todos os pacotes promocionais?")) return;
    const promos: Promocao[] = [];
    setForm(prev => ({ ...prev, promocoes: promos }));
  };

  const handleGerarPromocoesSugeridas = () => {
    const val = Number(form.valorCota) || 0.50;
    const quantidades = [10, 25, 50, 100];
    const pacotes: Promocao[] = quantidades.map((q, i) => {
      const res = calcularValoresPacotePromo(q, val, form.descontoPorValorTotal);
      let valorFinal = res.valor;
      let descPct = res.descontoPct;

      // Se não tiver regra de desconto aplicada, gera escada de desconto padrão 5%, 10%, 15%, 20%
      if (!res.temDesconto) {
        const pctPadrao = (i + 1) * 5;
        valorFinal = Number((q * val * (1 - pctPadrao / 100)).toFixed(2));
        descPct = pctPadrao;
      }

      return {
        quantidade: q,
        valor: valorFinal,
        destaque: q === 50,
        rotulo: q === 50 ? 'Mais popular' : undefined,
        descontoPct: descPct
      };
    });
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

  const tabKeys: TabType[] = ['basico', 'midia', 'premios', 'promocoes', 'upsell', 'extras', 'checkout'];
  const currentIndex = secaoAberta ? tabKeys.indexOf(secaoAberta) : 0;
  const isUltimaEtapa = currentIndex === tabKeys.length - 1;
  const isEdicao = !!(form.id);

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
              <Save className="w-4 h-4" />
              <span>{salvando ? 'Salvando...' : isEdicao ? 'Atualizar Campanha' : 'Publicar Campanha'}</span>
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
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{erro}</span>
            </div>
            <button
              type="button"
              onClick={async () => {
                const erroTxt = `=== ERRO AO SALVAR CAMPANHA ===\nErro: ${erro}\nCampanha ID: ${form.id || 'nova'}\nTitulo: ${form.titulo}\nData: ${new Date().toISOString()}`;
                await navigator.clipboard.writeText(erroTxt);
                alert('Detalhes do erro copiados para a área de transferência! Cole aqui no chat para resolvermos.');
              }}
              className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 rounded-lg text-[10px] font-black shrink-0 transition"
            >
              Copiar Erro
            </button>
          </div>
        )}

      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        
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

        <div className="flex flex-col gap-8">
            <div className={`w-full space-y-4 ${visualizacaoMobile === 'preview' ? 'hidden lg:block' : 'block'}`}>
              
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
                  onChange={e => {
                    const novoTitulo = e.target.value;
                    setForm(prev => {
                      const slugAntigo = gerarSlugCampanha(prev.titulo || '');
                      const deveAtualizarSlug = !prev.codigo || prev.codigo === slugAntigo || prev.codigo === 'preview-campanha' || prev.codigo === 'campanha' || !prev.id;
                      return {
                        ...prev,
                        titulo: novoTitulo,
                        codigo: deveAtualizarSlug ? gerarSlugCampanha(novoTitulo) : prev.codigo
                      };
                    });
                  }}
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm font-semibold text-white focus:border-emerald-500 focus:bg-slate-900/80 transition-colors focus:outline-none placeholder:text-slate-600 shadow-inner"
                  required
                />
              </div>

              {/* CAMPO DE ETIQUETA / SLUG DO LINK DA CAMPANHA */}
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
                    Etiqueta do Link da Rifa (URL Amigável) *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (form.titulo) {
                        setForm(prev => ({ ...prev, codigo: gerarSlugCampanha(prev.titulo || '') }));
                      }
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition active:scale-95"
                    title="Recalcular link com base no título atual da rifa"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Sincronizar com Título
                  </button>
                </div>

                <div className="flex items-center bg-slate-950/70 border border-slate-700/60 rounded-xl overflow-hidden focus-within:border-emerald-500 transition-colors shadow-inner">
                  <span className="px-3.5 py-3 text-xs font-mono text-slate-400 bg-slate-900/80 border-r border-slate-800 select-none shrink-0">
                    /c/
                  </span>
                  <input
                    type="text"
                    placeholder="ex: pix-de-200 ou pixde200"
                    value={form.codigo || ''}
                    onChange={e => {
                      const limpo = e.target.value
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9-_]/g, '');
                      setForm(prev => ({ ...prev, codigo: limpo }));
                    }}
                    className="w-full bg-transparent px-3 py-3 text-sm font-mono font-semibold text-emerald-300 placeholder:text-slate-600 focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400">
                  <span className="truncate">
                    Link oficial: <span className="font-mono text-emerald-400 font-semibold">{typeof window !== 'undefined' ? window.location.origin : 'https://rifazone.com'}/c/{form.codigo || gerarSlugCampanha(form.titulo || 'sua-campanha')}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    (Letras, números e hífens)
                  </span>
                </div>
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

            {/* MODALIDADE DA CAMPANHA: RIFA PAGA VS SORTEIO */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-200 uppercase tracking-wider block">
                Tipo *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, modalidade: 'paga', valorCota: prev.valorCota === 0 ? undefined : prev.valorCota }))}
                  className={`p-3.5 rounded-xl border text-center font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    (form.modalidade || 'paga') === 'paga'
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-lg'
                      : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:bg-slate-800/60 hover:border-slate-600'
                  }`}
                >
                  <span>Rifa paga</span>
                  {(form.modalidade || 'paga') === 'paga' && <Check className="w-4 h-4 text-emerald-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, modalidade: 'gratis', valorCota: 0, minPorCompra: 1, maxPorCompra: 1, exigirCpf: true, exigirEmail: true }))}
                  className={`p-3.5 rounded-xl border text-center font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    form.modalidade === 'gratis'
                      ? 'bg-purple-500/10 border-purple-500/50 text-white shadow-lg'
                      : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:bg-slate-800/60 hover:border-slate-600'
                  }`}
                >
                  <span>Sorteio</span>
                  {form.modalidade === 'gratis' && <Check className="w-4 h-4 text-purple-400" />}
                </button>
              </div>
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
                    <option value="aleatorio">Aleatório</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Total de cotas
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

                  <div className="space-y-3">
                    <div className="flex flex-col gap-3">
                      {!form.totalCotas ? (
                        <button
                          type="button"
                          onClick={() => setMostrarModalCotas(true)}
                          className="w-full px-4 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 group"
                        >
                          <Zap className="w-5 h-5 animate-pulse" />
                          <span>Selecionar Quantidade de Cotas</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setMostrarModalCotas(true)}
                            className="flex-1 px-4 py-4 bg-slate-950/60 border-2 border-emerald-500/50 hover:border-emerald-500 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all shadow-inner group"
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                            <span className="text-emerald-400 font-mono text-lg">{form.totalCotas.toLocaleString('pt-BR')}</span>
                            <span className="text-slate-400 text-xs ml-2 font-medium">(Clique para alterar)</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, totalCotas: undefined }))}
                            className="w-14 h-14 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-2xl flex items-center justify-center transition-all active:scale-95"
                            title="Remover quantidade"
                          >
                            <Trash2 className="w-6 h-6" />
                          </button>
                        </div>
                      )}
                    </div>
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
                        placeholder="0.01"
                        value={form.valorCota !== undefined && form.valorCota !== null ? form.valorCota : ''}
                        onChange={e => {
                          const novoValor = e.target.value === '' ? undefined : Number(e.target.value);
                          setForm(prev => {
                            const unitPrice = novoValor || 0;
                            const promocoesAtualizadas = prev.promocoes?.map(p => {
                              const q = Number(p.quantidade) || 0;
                              const regular = Number((q * unitPrice).toFixed(2));
                              const pVal = Number(p.valor) || 0;
                              return {
                                ...p,
                                valor: (unitPrice > 0 && pVal > regular) ? regular : p.valor
                              };
                            });
                            return {
                              ...prev,
                              valorCota: novoValor,
                              promocoes: promocoesAtualizadas
                            };
                          });
                        }}
                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3.5 text-sm font-mono text-emerald-400 font-black focus:border-emerald-500 focus:bg-slate-900/80 transition-colors focus:outline-none shadow-inner"
                        required
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                    Duração (Min)
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
                    <option value="Loteria Federal">Loteria Federal</option>
                    <option value="Deu no Poste">Deu no Poste</option>
                    <option value="Sorteio ao Vivo Instagram">Sorteio ao Vivo Instagram</option>
                    <option value="Sorteador Eletrônico">Sorteador Eletrônico Oficial</option>
                  </select>
                </div>

                {form.localSorteio === 'Sorteador Eletrônico' && (
                  <div className="md:col-span-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2 mt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-white block uppercase tracking-wider">
                            Animação do Sorteio
                          </label>
                          <p className="text-[10px] text-slate-400">
                            Tempo em segundos que os números ficarão girando no sorteador.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <select
                          value={form.tempoAnimacaoSorteioSegundos || 3}
                          onChange={e => setForm(prev => ({ ...prev, tempoAnimacaoSorteioSegundos: Number(e.target.value) }))}
                          className="bg-slate-950 border border-slate-700/50 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                        >
                          <option value={2}>2s (Rápido)</option>
                          <option value={3}>3s (Padrão)</option>
                          <option value={5}>5s (Lento)</option>
                          <option value={8}>8s (Dramático)</option>
                          <option value={10}>10s (Épico)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
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
                    checked={form.metaPixelId !== null}
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
                    Relógio
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
                  <input
                    type="file"
                    ref={cabecalhoLogoFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleCabecalhoLogoUpload(file);
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
                          <span>{form.organizadorFoto ? 'Trocar Imagem' : 'upload image'}</span>
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

                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">O que exibir ao lado da foto no Topo?</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, exibirCabecalhoTipo: 'nome' }))}
                            className={`px-4 py-3 text-xs font-bold border rounded-xl transition flex-1 flex items-center justify-center gap-2 ${
                              form.exibirCabecalhoTipo === 'nome' || !form.exibirCabecalhoTipo
                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700'
                            }`}
                          >
                            <User className="w-4 h-4" />
                            Nome do Organizador
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, exibirCabecalhoTipo: 'logo' }))}
                            className={`px-4 py-3 text-xs font-bold border rounded-xl transition flex-1 flex items-center justify-center gap-2 ${
                              form.exibirCabecalhoTipo === 'logo'
                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700'
                            }`}
                          >
                            <ImageIcon className="w-4 h-4" />
                            Logo da Marca
                          </button>
                        </div>
                      </div>

                      {form.exibirCabecalhoTipo === 'logo' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-slate-800/50 pt-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">Logo da Marca (Topo)</label>
                            
                            <div className="flex items-center gap-3">
                              {form.cabecalhoLogoUrl ? (
                                <div className="relative group shrink-0">
                                  <img
                                    src={form.cabecalhoLogoUrl}
                                    alt="Preview Logo"
                                    className="h-10 w-auto rounded border border-slate-700 object-contain bg-slate-900"
                                    style={{ maxHeight: '40px' }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, cabecalhoLogoUrl: '' }))}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500/90 hover:bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                                    title="Remover logo"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div className="h-10 w-10 rounded bg-slate-950/80 border border-slate-700 flex items-center justify-center shrink-0 text-slate-400">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => cabecalhoLogoFileInputRef.current?.click()}
                                disabled={carregandoCabecalhoLogo}
                                className="flex-1 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                              >
                                {carregandoCabecalhoLogo ? (
                                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                                ) : (
                                  <Upload className="w-4 h-4 text-blue-400" />
                                )}
                                <span>{form.cabecalhoLogoUrl ? 'Trocar Logo' : 'Enviar Logo'}</span>
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-300 uppercase tracking-wider">Tamanho da Logo no Topo</span>
                              <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">{form.cabecalhoLogoTamanho || 40}px</span>
                            </div>
                            <input
                              type="range"
                              min="28"
                              max="120"
                              value={form.cabecalhoLogoTamanho || 40}
                              onChange={e => setForm(prev => ({ ...prev, cabecalhoLogoTamanho: Number(e.target.value) }))}
                              className="w-full accent-emerald-500 bg-slate-950 cursor-pointer h-2 rounded-lg"
                            />
                          </div>

                          <div className="pt-2 border-t border-slate-800/40">
                            <label className="flex items-center justify-between gap-3 cursor-pointer group/toggle p-3 bg-slate-950/40 border border-slate-800 rounded-xl hover:border-slate-700 transition">
                              <div>
                                <span className="text-xs font-bold text-slate-200 block">Exibir Logo em Largura Total</span>
                                <span className="text-[11px] text-slate-400 block">Centraliza e expande a logo no menu do topo em largura total (responsivo no celular).</span>
                              </div>
                              <input
                                type="checkbox"
                                checked={!!form.cabecalhoLogoLarguraTotal}
                                onChange={e => setForm(prev => ({ ...prev, cabecalhoLogoLarguraTotal: e.target.checked }))}
                                className="w-5 h-5 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer focus:ring-emerald-500 shrink-0"
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-1 lg:col-span-1">
                  <label className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-sm ring-1 ring-white/10 shrink-0">
                      <WhatsAppIcon className="w-3 h-3" />
                    </span>
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
                  <label className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider flex items-center gap-2">
                    <span 
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm ring-1 ring-white/10 shrink-0"
                      style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}
                    >
                      <InstagramIcon className="w-3 h-3" />
                    </span>
                    Instagram (@)
                  </label>
                  <input
                    type="text"
                    placeholder="@usuario"
                    value={form.organizadorInstagram || ''}
                    onChange={e => setForm(prev => ({ ...prev, organizadorInstagram: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm text-white focus:border-pink-500 focus:bg-slate-900/80 transition-colors focus:outline-none shadow-inner"
                  />
                </div>
                
                <div className="md:col-span-1 lg:col-span-1">
                  <label className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-black ring-1 ring-white/20 flex items-center justify-center text-white shadow-sm shrink-0">
                      <TikTokIcon className="w-3 h-3" />
                    </span>
                    TikTok (@)
                  </label>
                  <input
                    type="text"
                    placeholder="@usuario"
                    value={form.organizadorTiktok || ''}
                    onChange={e => setForm(prev => ({ ...prev, organizadorTiktok: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm text-white focus:border-slate-300 focus:bg-slate-900/80 transition-colors focus:outline-none shadow-inner"
                  />
                </div>
              </div>

              {/* OPÇÃO DO BOTÃO DE COMPARTILHAR FLUTUANTE */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-full flex items-center justify-center shadow-md shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <label htmlFor="chk-exibir-compartilhar" className="text-xs font-bold text-white uppercase tracking-wider block cursor-pointer">
                      Botão Compartilhar na Página da Rifa
                    </label>
                    <span className="text-[11px] text-slate-400 block">
                      Exibir o botão flutuante de compartilhamento junto aos links de redes sociais no canto da página.
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    id="chk-exibir-compartilhar"
                    checked={form.exibirBotaoCompartilhar !== false}
                    onChange={e => setForm(prev => ({ ...prev, exibirBotaoCompartilhar: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                * As redes sociais acima são opcionais. Se preenchidas, os botões flutuantes e links de contato aparecerão na página da rifa; se deixadas em branco, não serão exibidas.
              </p>
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
            {/* BANNER E FOTOS DA CAMPANHA */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-emerald-400" />
                    Banner da Campanha
                  </h3>
                  <p className="text-xs md:text-sm text-slate-400 mt-1">
                    Envie as imagens do seu prêmio. A primeira será o destaque principal.
                  </p>
                </div>

                {form.bannerUrl && (
                  <button
                    type="button"
                    onClick={() => carrosselFileInputRef.current?.click()}
                    className="px-5 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar mais imagens</span>
                  </button>
                )}
              </div>

              {!form.bannerUrl ? (
                <div
                  onDragEnter={handleDragBanner}
                  onDragOver={handleDragBanner}
                  onDragLeave={handleDragBanner}
                  onDrop={handleDropBanner}
                  className={`p-10 border-2 border-dashed rounded-3xl text-center transition-all duration-300 shadow-inner group ${
                    dragActiveBanner ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-950/40 hover:border-emerald-500/30'
                  }`}
                >
                  {carregandoBanner ? (
                    <div className="py-4 flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                      <span className="text-sm text-slate-300 font-bold uppercase tracking-widest text-emerald-400">Enviando imagem...</span>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <button
                        type="button"
                        onClick={() => bannerFileInputRef.current?.click()}
                        className="w-full flex flex-col items-center justify-center gap-4"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                          <Upload className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-wider">
                            Banner da Campanha
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Arraste a foto principal ou clique para selecionar
                          </p>
                        </div>
                      </button>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => bannerCameraInputRef.current?.click()}
                          className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Tirar Foto Agora</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative group">
                  <div className="overflow-x-auto pb-8 px-1 touch-pan-x">
                    <div className="flex flex-nowrap gap-4 min-w-max items-start">
                      {/* Banner Principal */}
                      <div className="relative shrink-0 w-72 md:w-96 h-56 rounded-3xl overflow-hidden border-2 border-emerald-500 bg-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.15)] group/item">
                        <img src={form.bannerUrl} alt="Banner Principal" className="w-full h-full object-contain bg-slate-900" />
                        
                        <div className="absolute top-4 left-4 px-3 py-1.5 bg-emerald-500 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                          <Star className="w-3 h-3 fill-slate-950" />
                          Principal
                        </div>

                        {/* Botão de Lixeira no Topo Direito */}
                        <button
                          type="button"
                          onClick={() => setConfirmExcluirIdx('banner')}
                          className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-xl shadow-lg hover:scale-110 transition-transform z-20"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                          <span className="text-xs font-bold text-white/80 uppercase tracking-widest">Capa da Campanha</span>
                        </div>
                      </div>

                      {/* Fotos Adicionais Reordenáveis */}
                      <Reorder.Group 
                        axis="x" 
                        values={form.fotosCarrossel || []} 
                        onReorder={(newOrder) => setForm(prev => ({ ...prev, fotosCarrossel: newOrder }))}
                        className="flex gap-4 shrink-0"
                      >
                        {form.fotosCarrossel?.map((foto, idx) => (
                          <FotoItem 
                            key={foto}
                            foto={foto}
                            idx={idx}
                            onRemover={(i) => setConfirmExcluirIdx(i)}
                            onTornarPrincipal={(i) => {
                              const novasFotos = [...(form.fotosCarrossel || [])];
                              const antigaPrincipal = form.bannerUrl;
                              const novaPrincipal = novasFotos[i];
                              novasFotos[i] = antigaPrincipal;
                              setForm(prev => ({
                                ...prev,
                                bannerUrl: novaPrincipal,
                                fotosCarrossel: novasFotos
                              }));
                            }}
                          />
                        ))}
                      </Reorder.Group>

                      {carregandoCarrossel && (
                        <div className="relative shrink-0 w-40 h-56 rounded-3xl border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 flex flex-col items-center justify-center gap-3 animate-pulse">
                          <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Enviando...</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Arraste para organizar</span>
                  </div>

                  {/* Popup de Confirmação de Exclusão */}
                  <AnimatePresence>
                    {confirmExcluirIdx !== null && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
                      >
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl"
                        >
                          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-8 h-8" />
                          </div>
                          <h4 className="text-white font-black uppercase tracking-wider mb-2">Excluir Imagem?</h4>
                          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                            Esta ação não pode ser desfeita. Deseja realmente remover esta foto da campanha?
                          </p>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setConfirmExcluirIdx(null)}
                              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-750 text-white font-bold rounded-xl text-xs transition-all"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirmExcluirIdx === 'banner') {
                                  setForm(prev => ({ ...prev, bannerUrl: '' }));
                                } else if (typeof confirmExcluirIdx === 'number') {
                                  handleRemoverFotoCarrossel(confirmExcluirIdx);
                                }
                                setConfirmExcluirIdx(null);
                              }}
                              className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-red-500/20"
                            >
                              Excluir
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <hr className="border-slate-800/60" />

            {/* CONFIGURAÇÕES DO CARROSSEL (AUTOPLAY) */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Troca Automática de Fotos</h3>
                    <p className="text-[10px] text-slate-400">Configure se as fotos devem passar sozinhas e a velocidade.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-1.5 bg-slate-950/50 rounded-2xl border border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, autoplayGaleria: false }))}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      !form.autoplayGaleria ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Desativado
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, autoplayGaleria: true }))}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      form.autoplayGaleria ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Ativado
                  </button>
                </div>
              </div>

              {form.autoplayGaleria && (
                <div className="p-5 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <label className="text-xs font-bold text-white block mb-1 uppercase tracking-tighter">
                        Tempo de Exibição (Segundos)
                      </label>
                      <p className="text-[10px] text-slate-400">Quanto tempo cada foto fica visível antes de trocar.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={form.autoplayIntervaloGaleria || 5}
                        onChange={e => setForm(prev => ({ ...prev, autoplayIntervaloGaleria: Number(e.target.value) }))}
                        className="bg-slate-950 border border-slate-700/50 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-indigo-400 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                      >
                        <option value={3}>3 segundos (Rápido)</option>
                        <option value={5}>5 segundos (Padrão)</option>
                        <option value={8}>8 segundos (Médio)</option>
                        <option value={10}>10 segundos (Lento)</option>
                        <option value={15}>15 segundos (Exposição)</option>
                      </select>
                    </div>
                  </div>
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
                {(form.premios || []).map((p, idx) => {
                  const isCorAberta = abertoCorPremioIdx === idx;
                  const numPosicao = p.posicao || (idx + 1);
                  const badgeBg = p.corBadgeFundo || '#10b981';
                  const badgeTexto = p.corBadgeTexto || '#022c22';

                  const presets = [
                    { nome: '🥇 Ouro', bg: '#f59e0b', txt: '#000000' },
                    { nome: '🥈 Prata', bg: '#94a3b8', txt: '#000000' },
                    { nome: '🥉 Bronze', bg: '#d97706', txt: '#ffffff' },
                    { nome: '💚 Verde', bg: '#10b981', txt: '#022c22' },
                    { nome: '💙 Azul', bg: '#3b82f6', txt: '#ffffff' },
                    { nome: '💜 Roxo', bg: '#a855f7', txt: '#ffffff' },
                    { nome: '❤️ Vermelho', bg: '#ef4444', txt: '#ffffff' },
                  ];

                  return (
                    <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 space-y-2 transition-all hover:border-amber-500/30">
                      <div className="flex items-center gap-3">
                        <span 
                          className="w-10 h-10 rounded-xl font-black text-sm shrink-0 shadow-sm flex items-center justify-center border transition-all"
                          style={{
                            backgroundColor: badgeBg,
                            borderColor: `${badgeBg}cc`,
                            color: badgeTexto
                          }}
                        >
                          {numPosicao}º
                        </span>
                        <input
                          type="text"
                          placeholder="Descrição do prêmio... (ex: iPhone 16 Pro Max)"
                          value={p.descricao}
                          onChange={e => {
                            const arr = [...(form.premios || [])];
                            arr[idx].descricao = e.target.value;
                            setForm(prev => ({ ...prev, premios: arr }));
                          }}
                          className="flex-1 bg-transparent border-none text-sm text-white focus:ring-0 focus:outline-none placeholder:text-slate-600 font-bold"
                          required
                        />

                        {/* Botão para personalizar cor do prêmio */}
                        <button
                          type="button"
                          onClick={() => setAbertoCorPremioIdx(isCorAberta ? null : idx)}
                          title="Personalizar cores do prêmio"
                          className={`p-2.5 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0 ${
                            isCorAberta || p.corBadgeFundo
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          <Palette className="w-4 h-4" />
                          <span className="hidden sm:inline">Cores</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemovePremio(idx)}
                          className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Painel de Cores do Prêmio */}
                      {isCorAberta && (
                        <div className="pt-2 border-t border-slate-800/80 space-y-3 animate-in fade-in">
                          <div>
                            <span className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Presets de Selo (Posição)</span>
                            <div className="flex flex-wrap gap-1.5">
                              {presets.map((pr, pIdx) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => {
                                    const arr = [...(form.premios || [])];
                                    arr[idx] = {
                                      ...arr[idx],
                                      corBadgeFundo: pr.bg,
                                      corBadgeTexto: pr.txt,
                                    };
                                    setForm(prev => ({ ...prev, premios: arr }));
                                  }}
                                  className="px-2.5 py-1 rounded-lg border text-xs font-bold transition-transform active:scale-95 flex items-center gap-1"
                                  style={{ backgroundColor: pr.bg, color: pr.txt, borderColor: `${pr.bg}aa` }}
                                >
                                  {pr.nome}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 block">Fundo da Tag</label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={p.corBadgeFundo || '#10b981'}
                                  onChange={e => {
                                    const arr = [...(form.premios || [])];
                                    arr[idx].corBadgeFundo = e.target.value;
                                    setForm(prev => ({ ...prev, premios: arr }));
                                  }}
                                  className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                                />
                                <span className="text-[10px] font-mono text-slate-300 uppercase">{p.corBadgeFundo || '#10b981'}</span>
                              </div>
                            </div>

                            <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 block">Texto da Tag</label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={p.corBadgeTexto || '#022c22'}
                                  onChange={e => {
                                    const arr = [...(form.premios || [])];
                                    arr[idx].corBadgeTexto = e.target.value;
                                    setForm(prev => ({ ...prev, premios: arr }));
                                  }}
                                  className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                                />
                                <span className="text-[10px] font-mono text-slate-300 uppercase">{p.corBadgeTexto || '#022c22'}</span>
                              </div>
                            </div>

                            <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 block">Fundo do Card</label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={p.corFundo || '#0f172a'}
                                  onChange={e => {
                                    const arr = [...(form.premios || [])];
                                    arr[idx].corFundo = e.target.value;
                                    setForm(prev => ({ ...prev, premios: arr }));
                                  }}
                                  className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                                />
                                <span className="text-[10px] font-mono text-slate-300 uppercase">{p.corFundo || 'Padrão'}</span>
                              </div>
                            </div>

                            <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 block">Texto do Card</label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={p.corTexto || '#ffffff'}
                                  onChange={e => {
                                    const arr = [...(form.premios || [])];
                                    arr[idx].corTexto = e.target.value;
                                    setForm(prev => ({ ...prev, premios: arr }));
                                  }}
                                  className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                                />
                                <span className="text-[10px] font-mono text-slate-300 uppercase">{p.corTexto || '#ffffff'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <hr className="border-slate-800/60" />

            {/* Cotas Premiadas Instantâneas */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                    <Gift className="w-4 h-4 text-emerald-400" />
                    Cotas Premiadas
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Defina cotas premiadas que concedem prêmios ao comprador ao adquiri-las.
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
                    <p className="text-sm text-slate-400">Nenhuma cota premiada cadastrada no momento.</p>
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

            {/* Campo Editável: Título do Card de Seleção de Cotas */}
            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Título do Card de Seleção de Cotas
              </label>
              <input
                type="text"
                placeholder="Selecione a quantidade de cotas"
                value={form.tituloSelecaoCotas || ''}
                onChange={e => setForm(prev => ({ ...prev, tituloSelecaoCotas: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500 transition shadow-inner"
              />
              <p className="text-[11px] text-slate-400">
                Personalize o título exibido no topo do card de escolha de cotas na página pública. (Padrão: "Selecione a quantidade de cotas")
              </p>
            </div>

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
                  <button
                    type="button"
                    onClick={handleGerarPromocoesSugeridas}
                    className="px-3.5 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    title="Gerar sugestões de pacotes promocionais"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Sugestões
                  </button>
                  {(form.promocoes || []).length > 0 && (
                    <button
                      type="button"
                      onClick={handleLimparTodasPromocoes}
                      className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-red-500/30 transition-all shadow-sm active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Apagar Tudo
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddPromo}
                    className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Pacote
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {(form.promocoes || []).length === 0 ? (
                  <div className="p-8 bg-slate-950/40 border border-dashed border-slate-700/50 rounded-2xl text-center space-y-3">
                    <Zap className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-sm text-slate-400 font-medium">Nenhum pacote promocional cadastrado.</p>
                    <button
                      type="button"
                      onClick={handleGerarPromocoesSugeridas}
                      className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold rounded-xl text-xs inline-flex items-center gap-2 transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      Gerar Pacotes Automáticos
                    </button>
                  </div>
                ) : (
                  (form.promocoes || []).map((promo, idx) => {
                    const unitPrice = Number(form.valorCota) || 0;
                    const calcInfo = calcularValoresPacotePromo(
                      promo.quantidade,
                      unitPrice,
                      form.descontoPorValorTotal,
                      promo.valor
                    );
                    const regularTotal = calcInfo.regularTotal;
                    const descontoCalculadoPct = calcInfo.descontoPct;

                    return (
                      <div
                        key={idx}
                        draggable
                        onDragStart={e => handleDragStartPromo(e, idx)}
                        onDragOver={handleDragOverPromo}
                        onDrop={e => handleDropPromo(e, idx)}
                        className={`p-4 bg-slate-950/60 border rounded-2xl flex flex-col gap-3 transition-all group shadow-inner ${
                          draggedPromoIdx === idx
                            ? 'border-emerald-500/50 bg-emerald-500/5 opacity-50 scale-[0.99]'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-900/30'
                        }`}
                      >
                        {/* Cabeçalho do Card */}
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="hidden sm:flex items-center justify-center text-slate-500 hover:text-emerald-400 cursor-grab active:cursor-grabbing transition-colors" title="Arraste para reordenar">
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                              Pacote #{idx + 1}
                            </span>
                            {promo.destaque && (
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-md text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400" />
                                {promo.rotulo || 'Mais popular'}
                              </span>
                            )}
                            {descontoCalculadoPct !== undefined && descontoCalculadoPct > 0 && (
                              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md text-[10px] font-bold flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-400" />
                                -{descontoCalculadoPct}% OFF
                              </span>
                            )}
                          </div>

                          {/* Botões de Reordenamento e Remoção */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoverPromo(idx, 'up')}
                              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Mover para cima"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === (form.promocoes || []).length - 1}
                              onClick={() => handleMoverPromo(idx, 'down')}
                              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Mover para baixo"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            <div className="w-px h-4 bg-slate-800 mx-1" />
                            <button
                              type="button"
                              onClick={() => handleRemovePromo(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Remover pacote"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Grid de Campos */}
                        <div className={`grid grid-cols-1 sm:grid-cols-2 ${promo.destaque ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3`}>
                          {/* Quantidade de Cotas */}
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold tracking-wider">
                              Qtd. de Cotas *
                            </label>
                            <input
                              type="number"
                              min="1"
                              placeholder="Ex: 50"
                              value={promo.quantidade !== undefined && promo.quantidade > 0 ? promo.quantidade : ''}
                              onChange={e => {
                                const valQtd = e.target.value === '' ? 0 : Number(e.target.value);
                                const res = calcularValoresPacotePromo(valQtd, unitPrice, form.descontoPorValorTotal);
                                const arr = [...(form.promocoes || [])];
                                arr[idx].quantidade = valQtd;
                                arr[idx].valor = res.valor;
                                arr[idx].descontoPct = res.descontoPct;
                                setForm(prev => ({ ...prev, promocoes: arr }));
                              }}
                              className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                          </div>

                          {/* Preço Promocional */}
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold tracking-wider flex items-center justify-between">
                              <span>Preço do Pacote (R$) *</span>
                              {regularTotal > 0 && (
                                <span className="text-slate-500 font-normal text-[9px]">
                                  Regular: R$ {regularTotal.toFixed(2).replace('.', ',')}
                                </span>
                              )}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              placeholder="0.00"
                              value={promo.valor !== undefined && promo.valor > 0 ? promo.valor : ''}
                              onChange={e => {
                                const valNum = e.target.value === '' ? 0 : Number(e.target.value);
                                const res = calcularValoresPacotePromo(promo.quantidade, unitPrice, form.descontoPorValorTotal, valNum);
                                const arr = [...(form.promocoes || [])];
                                arr[idx].valor = valNum;
                                arr[idx].descontoPct = res.descontoPct;
                                setForm(prev => ({ ...prev, promocoes: arr }));
                              }}
                              className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2 text-sm font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                          </div>

                          {/* Selo de Desconto Automático (Não Editável) */}
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold tracking-wider">
                              Selo Desconto (%)
                            </label>
                            {descontoCalculadoPct !== undefined && descontoCalculadoPct > 0 ? (
                              <div className="bg-slate-900 border border-emerald-500/40 rounded-xl px-3.5 py-2 text-xs font-bold text-emerald-400 flex items-center justify-between shadow-inner h-[38px]">
                                <span className="flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  -{descontoCalculadoPct}% OFF
                                </span>
                                <span className="text-[9px] text-slate-500 font-normal">Automático</span>
                              </div>
                            ) : (
                              <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-500 font-medium flex items-center justify-between h-[38px]">
                                <span>Sem desconto</span>
                                <span className="text-[9px] text-slate-600 font-normal">Preço regular</span>
                              </div>
                            )}
                          </div>

                          {/* Rótulo de Destaque - APENAS SE DESTAQUE ESTIVER ATIVO */}
                          {promo.destaque && (
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold tracking-wider flex items-center justify-between">
                                <span>Texto de Destaque</span>
                                <span className="text-slate-500 font-normal text-[9px]">Ex: Mais popular</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: Mais popular"
                                value={promo.rotulo || ''}
                                onChange={e => {
                                  const arr = [...(form.promocoes || [])];
                                  arr[idx].rotulo = e.target.value;
                                  setForm(prev => ({ ...prev, promocoes: arr }));
                                }}
                                className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                              />
                            </div>
                          )}
                        </div>

                        {/* Opções adicionais do card */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                          <label className="flex items-center gap-2 cursor-pointer group/label">
                            <input
                              type="checkbox"
                              checked={!!promo.destaque}
                              onChange={e => {
                                const arr = [...(form.promocoes || [])];
                                arr[idx].destaque = e.target.checked;
                                if (e.target.checked && !arr[idx].rotulo) {
                                  arr[idx].rotulo = 'Mais popular';
                                }
                                setForm(prev => ({ ...prev, promocoes: arr }));
                              }}
                              className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer focus:ring-emerald-500 focus:ring-offset-slate-950"
                            />
                            <span className="text-xs text-slate-300 font-medium group-hover/label:text-white transition-colors">
                              Destacar este pacote (borda e selo popular)
                            </span>
                          </label>

                          {regularTotal > 0 && promo.valor > 0 && promo.valor < regularTotal && (
                            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 self-start sm:self-auto flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-emerald-400" />
                              Economia de R$ {(regularTotal - promo.valor).toFixed(2).replace('.', ',')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <hr className="border-slate-800/60" />

            {/* SEÇÃO: ATIVAR REGRA DE DESCONTO */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950/40 border border-slate-800 rounded-2xl">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Ativar regra de desconto por valor
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Exemplo: "A partir de R$ 30,00 de compra, cada cota sai por R$ 0,80".
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const novoEstado = !descontoAtivo;
                    setDescontoAtivo(novoEstado);
                    if (!novoEstado) {
                      setForm(prev => ({ ...prev, descontoPorValorTotal: [] }));
                    }
                  }}
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    descontoAtivo ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      descontoAtivo ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {descontoAtivo && (
                <div className="space-y-4 animate-in fade-in pt-2">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const regras = form.descontoPorValorTotal || [];
                        setForm(prev => ({
                          ...prev,
                          descontoPorValorTotal: [
                            ...regras,
                            { aPartirDeValor: 30, valorCotaComDesconto: 0.80 }
                          ]
                        }));
                      }}
                      className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Nova Regra
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(form.descontoPorValorTotal || []).length === 0 ? (
                      <p className="text-sm text-slate-500 italic p-4 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                        Nenhuma regra configurada. Clique em "Adicionar Nova Regra" acima.
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
              )}
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
                    id="chk-exibir-selo-oficial"
                    checked={form.exibirSeloOficial ?? true}
                    onChange={e => setForm(prev => ({ ...prev, exibirSeloOficial: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-600 cursor-pointer accent-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950"
                  />
                  <label htmlFor="chk-exibir-selo-oficial" className="text-sm text-slate-200 font-medium cursor-pointer select-none">
                    Selo de Sorteio Oficial
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
                    Lista da Premiação
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
            </div>
          </div>
        </AcordeaoSecao>

        {/* ABA 7: MODELO DE CHECKOUT DA CAMPANHA */}
        <AcordeaoSecao 
          titulo="7. Modelo de Checkout" 
          isAberto={secaoAberta === 'checkout'} 
          onToggle={() => setSecaoAberta(secaoAberta === 'checkout' ? null : 'checkout')}
        >
          <div className="bg-slate-900/60 border border-slate-800/60 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider mb-1">
                <CreditCard className="w-4 h-4 text-indigo-400" />
                Selecione a Experiência de Checkout da Rifa
              </h3>
              <p className="text-xs text-slate-400">
                Escolha o modelo de pagamento e mensagens que serão exibidas ao comprador ao adquirir cotas nesta campanha.
              </p>
            </div>

            {/* Opções de Seleção de Checkout */}
            <div className="space-y-3">
              {/* Opção Checkout Padrão */}
              <div
                onClick={() => setForm(prev => ({ ...prev, checkoutId: undefined, checkout: undefined }))}
                className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-4 ${
                  !form.checkoutId
                    ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Checkout Padrão do Sistema</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Pix Instantâneo + Cartão de Crédito em até 12x com Selos SSL</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                  Padrão Recomendado
                </span>
              </div>

              {/* Opções Personalizadas Salvas */}
              {checkoutsSalvos.map(item => (
                <div
                  key={item.id}
                  onClick={() => setForm(prev => ({ ...prev, checkoutId: item.id, checkout: item.checkout }))}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-4 ${
                    form.checkoutId === item.id
                      ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">{item.nome}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.checkout.metodos.pix && <span className="text-[10px] text-emerald-400 font-mono">PIX</span>}
                        {item.checkout.metodos.cartao && <span className="text-[10px] text-blue-400 font-mono">Cartão {item.checkout.parcelasMax}x</span>}
                        {item.checkout.metodos.boleto && <span className="text-[10px] text-amber-400 font-mono">Boleto</span>}
                      </div>
                    </div>
                  </div>
                  {form.checkoutId === item.id && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                      Selecionado
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </AcordeaoSecao>
            </div> {/* FECHA O w-full */}

          <div className={`w-full mt-8 border-t border-slate-800/60 pt-12 ${visualizacaoMobile === 'controles' ? 'hidden lg:block' : 'block'}`}>
            <div className="space-y-6 flex flex-col items-center">
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
            {!isUltimaEtapa ? (
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
                ) : isEdicao ? (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Atualizar Campanha</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5" />
                    <span>Publicar Campanha</span>
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
