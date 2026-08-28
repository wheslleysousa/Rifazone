import { confirmar } from '../../lib/confirm';
import { toast } from '../../lib/toast';
import React, { useState, useEffect, useRef } from 'react';
import { CheckoutConfig, CheckoutSalvo, DEFAULT_CHECKOUT_CONFIG, ConfirmacaoCompraConfig, CupomDesconto } from '../../types';
import { dispararExplosaoConfetes } from '../../utils/confettiUtils';
import {
  CreditCard, QrCode, FileText, ShieldCheck, CheckCircle2,
  Trash2, Edit3, Plus, Save, RefreshCw, Smartphone,
  Monitor, AlertTriangle, Clock, Zap, MessageSquare,
  Palette, Type, X, PartyPopper, Users, Sparkles, Copy,
  Share2, Ticket, MessageCircle, ExternalLink, HelpCircle, Tag,
  Upload, Image, Check, Flame, Sliders, ChevronDown, CheckCheck
} from 'lucide-react';

interface Props {
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

interface CheckoutConfigExtended extends CheckoutConfig {
  corPrimaria?: string;
  corFundo?: string;
  fonteFamilia?: string;
  textoBotao?: string;
  textoRodape?: string;
  bannerUrl?: string;
  temporizadorAtivo?: boolean;
  temporizadorMinutos?: number;
  temporizadorEstilo?: 'fogo' | 'alerta' | 'minimalista' | 'badge';
  temporizadorTexto?: string;
  mensagemEscassez?: string;
  selosExtras?: string[];
  posicaoSelos?: 'abaixo_botao' | 'abaixo_banner';
  confirmacao?: ConfirmacaoCompraConfig;
  exigirCpf?: boolean;
  exigirEmail?: boolean;
  cupomAtivo?: boolean;
  exibirCupom?: boolean;
  cupons?: CupomDesconto[];
  notificacoesModoIntervalo?: 'fixo' | 'aleatorio';
  notificacoesIntervaloMin?: number;
  notificacoesIntervaloMax?: number;
}

const SELOS_DISPONIVEIS = [
  { id: 'ssl', icon: '🔒', label: 'SSL 256-bit' },
  { id: 'seguro', icon: '🛡️', label: 'Pagamento Seguro' },
  { id: 'aprovacao', icon: '✅', label: 'Aprovação Rápida' },
  { id: 'comprador', icon: '🤝', label: 'Proteção ao Comprador' },
  { id: 'estrelas', icon: '⭐', label: '5 Estrelas' },
  { id: 'certificado', icon: '🏆', label: 'Certificado' },
  { id: 'suporte', icon: '💬', label: 'Suporte 24h' },
  { id: 'pix_oficial', icon: '🏦', label: 'Pix Banco Central' },
];

const FONTES = [
  { value: 'Inter', label: 'Inter', categoria: 'Moderna e Neutra', amostra: 'Aa Bb Gg 123' },
  { value: 'Montserrat', label: 'Montserrat', categoria: 'Robusta e Marcante', amostra: 'Aa Bb Gg 123' },
  { value: 'Outfit', label: 'Outfit', categoria: 'Geométrica e Tech', amostra: 'Aa Bb Gg 123' },
  { value: 'Poppins', label: 'Poppins', categoria: 'Arredondada e Amigável', amostra: 'Aa Bb Gg 123' },
  { value: 'Roboto', label: 'Roboto', categoria: 'Clássica e Legível', amostra: 'Aa Bb Gg 123' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', categoria: 'Sofisticada e Fluida', amostra: 'Aa Bb Gg 123' },
  { value: 'Space Grotesk', label: 'Space Grotesk', categoria: 'Moderna e Futurista', amostra: 'Aa Bb Gg 123' },
  { value: 'Playfair Display', label: 'Playfair Display', categoria: 'Elegante e Editorial', amostra: 'Aa Bb Gg 123' },
  { value: 'Syne', label: 'Syne', categoria: 'Criativa e Premium', amostra: 'Aa Bb Gg 123' },
  { value: 'Cinzel', label: 'Cinzel', categoria: 'Luxo e Clássica', amostra: 'Aa Bb Gg 123' },
  { value: 'Manrope', label: 'Manrope', categoria: 'Clean e Equilibrada', amostra: 'Aa Bb Gg 123' },
  { value: 'Oswald', label: 'Oswald', categoria: 'Impactante e Condensada', amostra: 'Aa Bb Gg 123' },
];

const defaultExtended: CheckoutConfigExtended = {
  ...DEFAULT_CHECKOUT_CONFIG,
  corPrimaria: '#10b981',
  corFundo: '#020617',
  fonteFamilia: 'Inter',
  textoBotao: 'Garantir Minha Cota Agora',
  textoRodape: 'Pagamento processado com segurança. Suas cotas são geradas automaticamente após confirmação.',
  bannerUrl: '',
  temporizadorAtivo: false,
  temporizadorMinutos: 10,
  temporizadorEstilo: 'fogo',
  temporizadorTexto: '⏱️ Sua reserva expira em',
  posicaoSelos: 'abaixo_botao',
  mensagemEscassez: '',
  selosExtras: ['ssl', 'aprovacao'],
  notificacoesModoIntervalo: 'fixo',
  notificacoesIntervaloMin: 6,
  notificacoesIntervaloMax: 18,
  confirmacao: {
    titulo: 'Pagamento Confirmado! 🎉',
    subtitulo: 'Seus números já estão salvos e vinculados ao seu WhatsApp!',
    mensagemAgradecimento: 'Obrigado por participar! Boa sorte no sorteio.',
    bannerSucessoUrl: '',
    exibirConfetes: true,
    animacaoSucesso: 'explosao_confetes',
    exibirNumeros: true,
    exibirBotaoCopiar: true,
    exibirBotaoWhatsapp: true,
    exibirBotaoMeusNumeros: true,
    botaoGrupoVipAtivo: false,
    botaoGrupoVipTexto: 'Entrar no Grupo VIP do WhatsApp',
    botaoGrupoVipLink: '',
    instrucoesPosCompra: 'Acompanhe as atualizações e a data do sorteio em nosso grupo oficial.'
  }
};

export const CheckoutBuilderView: React.FC<Props> = ({ authFetch }) => {
  const [checkoutsSalvos, setCheckoutsSalvos] = useState<CheckoutSalvo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [nomeCheckout, setNomeCheckout] = useState('Novo Checkout');
  const [checkoutConfig, setCheckoutConfig] = useState<CheckoutConfigExtended>(defaultExtended);
  const [previewTab, setPreviewTab] = useState<'pix' | 'cartao' | 'boleto'>('pix');
  const [previewScreen, setPreviewScreen] = useState<'checkout' | 'sucesso'>('checkout');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [modalAnimacaoAberto, setModalAnimacaoAberto] = useState(false);
  const [copiadoPix, setCopiadoPix] = useState(false);
  const [cartaoNumero, setCartaoNumero] = useState('4532 •••• •••• 8892');
  const [cartaoNome, setCartaoNome] = useState('JOAO SILVA');
  const [cartaoValidade, setCartaoValidade] = useState('11/29');
  const [cartaoCVV, setCartaoCVV] = useState('823');
  const [parcelaSelecionada, setParcelaSelecionada] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { carregarCheckouts(); }, []);

  const carregarCheckouts = async () => {
    setCarregando(true);
    try {
      const res = await authFetch('/api/admin/checkouts');
      if (res.ok) setCheckoutsSalvos(await res.json());
    } catch { } finally { setCarregando(false); }
  };

  const handleSalvar = async () => {
    if (!nomeCheckout.trim()) {
      setFeedbackMsg({ tipo: 'erro', texto: 'Informe um nome para o modelo de checkout.' });
      return;
    }
    if (!checkoutConfig.metodos.pix && !checkoutConfig.metodos.cartao && !checkoutConfig.metodos.boleto) {
      setFeedbackMsg({ tipo: 'erro', texto: 'Selecione ao menos uma forma de pagamento.' });
      return;
    }
    setSalvando(true); setFeedbackMsg(null);
    try {
      const res = await authFetch('/api/admin/checkouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editandoId || undefined, nome: nomeCheckout.trim(), checkout: checkoutConfig })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Erro ao salvar.'); }
      setFeedbackMsg({ tipo: 'sucesso', texto: 'Checkout salvo com sucesso!' });
      await carregarCheckouts();
      setFormAberto(false); setEditandoId(null);
    } catch (err: any) {
      setFeedbackMsg({ tipo: 'erro', texto: err.message || 'Falha ao salvar.' });
    } finally { setSalvando(false); }
  };

  const handleEditar = (item: CheckoutSalvo) => {
    setEditandoId(item.id);
    setNomeCheckout(item.nome);
    setCheckoutConfig({
      ...defaultExtended,
      ...item.checkout,
      confirmacao: {
        ...defaultExtended.confirmacao,
        ...(item.checkout as any)?.confirmacao
      }
    } as CheckoutConfigExtended);
    setFormAberto(true); setFeedbackMsg(null);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const handleNovo = () => {
    setEditandoId(null); setNomeCheckout('Novo Checkout');
    setCheckoutConfig(defaultExtended); setFormAberto(true); setFeedbackMsg(null);
  };

  const handleExcluir = async (id: string) => {
    if (!(await confirmar({ mensagem: 'Excluir este checkout?', perigo: true, confirmarLabel: 'Excluir' }))) return;
    try {
      const res = await authFetch(`/api/admin/checkouts/${id}`, { method: 'DELETE' });
      if (res.ok) { if (editandoId === id) { setFormAberto(false); setEditandoId(null); } await carregarCheckouts(); }
    } catch { toast('Erro ao excluir.'); }
  };

  const upd = (patch: Partial<CheckoutConfigExtended>) => setCheckoutConfig(prev => ({ ...prev, ...patch }));
  const updMetodos = (patch: Partial<CheckoutConfig['metodos']>) =>
    setCheckoutConfig(prev => ({ ...prev, metodos: { ...prev.metodos, ...patch } }));
  const updMsgs = (patch: Partial<NonNullable<CheckoutConfig['mensagens']>>) =>
    setCheckoutConfig(prev => ({ ...prev, mensagens: { ...prev.mensagens, ...patch } }));
  const updConfirmacao = (patch: Partial<ConfirmacaoCompraConfig>) =>
    setCheckoutConfig(prev => ({ ...prev, confirmacao: { ...prev.confirmacao, ...patch } }));
  
  const toggleSelo = (id: string) => {
    const atual = checkoutConfig.selosExtras || [];
    upd({ selosExtras: atual.includes(id) ? atual.filter(s => s !== id) : [...atual, id] });
  };

  const handleUploadBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast('A imagem deve ter no máximo 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        upd({ bannerUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const copiarChavePix = () => {
    navigator.clipboard?.writeText('00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540525.005802BR5913RIFAZONE PAGAMENTOS6008BRASILIA62070503***6304E2CA');
    setCopiadoPix(true);
    setTimeout(() => setCopiadoPix(false), 2500);
  };

  const primary = checkoutConfig.corPrimaria || '#10b981';
  const bgColor = checkoutConfig.corFundo || '#020617';
  const conf = checkoutConfig.confirmacao || defaultExtended.confirmacao!;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl font-black text-white">Central de Checkouts & Pós-Venda</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Crie experiências de pagamento e telas de compra concluída personalizadas para cada campanha.</p>
        </div>
        {!formAberto && (
          <button onClick={handleNovo} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer">
            <Plus className="w-4 h-4" /> Criar Novo Checkout
          </button>
        )}
      </div>

      {/* Feedback */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-bold ${feedbackMsg.tipo === 'sucesso' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {feedbackMsg.tipo === 'sucesso' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span className="flex-1">{feedbackMsg.texto}</span>
          <button onClick={() => setFeedbackMsg(null)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* LISTA */}
      {!formAberto && (
        carregando ? (
          <div className="flex items-center justify-center py-16 text-slate-500 gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /><span className="text-sm">Carregando...</span>
          </div>
        ) : checkoutsSalvos.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-12 text-center space-y-4">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto">
              <CreditCard className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Nenhum checkout criado ainda</h3>
              <p className="text-xs text-slate-400 mt-1">Crie seu primeiro modelo de checkout personalizado com tela de confirmação.</p>
            </div>
            <button onClick={handleNovo} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl inline-flex items-center gap-2 transition cursor-pointer">
              <Plus className="w-4 h-4" /> Criar Primeiro Checkout
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {checkoutsSalvos.map(item => {
              const cfg = item.checkout as CheckoutConfigExtended;
              const cor = cfg.corPrimaria || '#10b981';
              const selosBadges = SELOS_DISPONIVEIS.filter(s => (cfg.selosExtras || []).includes(s.id));
              return (
                <div key={item.id} className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col gap-4 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${cor}20`, border: `1px solid ${cor}40` }}>
                      <CreditCard className="w-5 h-5" style={{ color: cor }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white leading-tight">{item.nome}</h3>
                      <p className="text-[10px] text-slate-500 font-mono">{item.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cfg.metodos?.pix !== false && <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg flex items-center gap-1"><QrCode className="w-3 h-3" /> Pix</span>}
                    {cfg.metodos?.cartao && <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold rounded-lg flex items-center gap-1"><CreditCard className="w-3 h-3" /> Cartão {cfg.parcelasMax}x</span>}
                    {cfg.metodos?.boleto && <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold rounded-lg flex items-center gap-1"><FileText className="w-3 h-3" /> Boleto</span>}
                    {cfg.cupomAtivo && <span className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold rounded-lg flex items-center gap-1"><Tag className="w-3 h-3" /> Cupons {(cfg.cupons || []).length > 0 ? `(${(cfg.cupons || []).length})` : ''}</span>}
                    {cfg.confirmacao?.botaoGrupoVipAtivo && <span className="px-2 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold rounded-lg flex items-center gap-1"><Users className="w-3 h-3" /> Grupo VIP</span>}
                  </div>
                  {selosBadges.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selosBadges.slice(0, 3).map(s => <span key={s.id} className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">{s.icon} {s.label}</span>)}
                      {selosBadges.length > 3 && <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md">+{selosBadges.length - 3}</span>}
                    </div>
                  )}
                  <div className="flex gap-2 mt-auto">
                    <button onClick={() => handleEditar(item)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-black rounded-xl flex items-center justify-center gap-1.5 transition border border-slate-700 cursor-pointer">
                      <Edit3 className="w-3.5 h-3.5 text-indigo-400" /> Editar
                    </button>
                    <button onClick={() => handleExcluir(item.id)} className="py-2.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl flex items-center justify-center transition border border-red-500/20 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* EDITOR */}
      {formAberto && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-7 space-y-5">

            {/* Voltar + Nome */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <button onClick={() => { setFormAberto(false); setEditandoId(null); setFeedbackMsg(null); }} className="text-xs text-slate-400 hover:text-white transition cursor-pointer">
                  ← Voltar para lista
                </button>
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">
                  {editandoId ? 'Editando' : 'Novo Checkout'}
                </span>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Nome do Modelo *</label>
                <input type="text" value={nomeCheckout} onChange={e => setNomeCheckout(e.target.value)} placeholder="Ex: Checkout Alta Conversão VIP" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
              </div>
            </div>

            {/* 1. Visual & Tipografia */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4 text-pink-400" /> 1. Identidade Visual & Tipografia
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Cor Primária (Botões & Destaques)', key: 'corPrimaria', def: '#10b981' },
                  { label: 'Cor de Fundo do Checkout', key: 'corFundo', def: '#020617' },
                ].map(c => (
                  <div key={c.key}>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">{c.label}</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={(checkoutConfig as any)[c.key] || c.def} onChange={e => upd({ [c.key]: e.target.value })} className="w-10 h-10 rounded-lg border-0 cursor-pointer bg-transparent" />
                      <input type="text" value={(checkoutConfig as any)[c.key] || c.def} onChange={e => upd({ [c.key]: e.target.value })} className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 focus:outline-none" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Seletor Visual de Tipografia com Prévias */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-indigo-400" /> Fonte Tipográfica do Checkout
                  </label>
                  <span className="text-[10px] text-indigo-400 font-mono font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {checkoutConfig.fonteFamilia || 'Inter'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {FONTES.map(f => {
                    const isSelected = (checkoutConfig.fonteFamilia || 'Inter') === f.value;
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => upd({ fonteFamilia: f.value })}
                        className={`p-3 rounded-xl border text-left transition flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-500/15 border-indigo-500 ring-1 ring-indigo-500/40 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                        style={{ fontFamily: f.value }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black">{f.label}</span>
                            <span className="text-[9px] text-slate-500 font-sans">{f.categoria}</span>
                          </div>
                          <span className="text-sm font-semibold opacity-90 block mt-0.5 truncate" style={{ color: isSelected ? '#a5b4fc' : undefined }}>
                            {f.amostra}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Banner de Topo com Upload Direto ou URL */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-300 block">
                  Banner do Topo no Checkout (Upload ou URL)
                </label>
                
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUploadBanner}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
                  >
                    <Upload className="w-4 h-4 text-emerald-400" /> Escolher do Computador
                  </button>
                  <input
                    type="url"
                    value={checkoutConfig.bannerUrl || ''}
                    onChange={e => upd({ bannerUrl: e.target.value })}
                    placeholder="Ou cole a URL direta da imagem (https://...)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {checkoutConfig.bannerUrl && (
                  <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-700 max-h-28 group">
                    <img
                      src={checkoutConfig.bannerUrl}
                      alt="Banner Preview"
                      className="w-full h-24 object-cover"
                      onError={e => (e.currentTarget.style.display = 'none')}
                    />
                    <button
                      type="button"
                      onClick={() => upd({ bannerUrl: '' })}
                      className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-500 text-white p-1.5 rounded-lg text-xs font-bold transition shadow"
                      title="Remover banner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Métodos */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-400" /> 2. Métodos de Pagamento
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <div onClick={() => updMetodos({ pix: !checkoutConfig.metodos.pix })} className={`p-4 rounded-xl border cursor-pointer transition flex flex-col gap-2 ${checkoutConfig.metodos.pix !== false ? 'bg-emerald-500/10 border-emerald-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}>
                  <div className="flex items-center justify-between"><QrCode className="w-5 h-5 text-emerald-400" /><div className={`w-5 h-5 rounded-full border-2 ${checkoutConfig.metodos.pix !== false ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'} flex items-center justify-center`}>{checkoutConfig.metodos.pix !== false && <CheckCircle2 className="w-3 h-3 text-slate-950" />}</div></div>
                  <div><p className="text-xs font-black text-white">Pix</p><p className="text-[10px] text-slate-400">Imediato</p></div>
                </div>
                <div onClick={() => updMetodos({ cartao: !checkoutConfig.metodos.cartao })} className={`p-4 rounded-xl border cursor-pointer transition flex flex-col gap-2 ${checkoutConfig.metodos.cartao ? 'bg-blue-500/10 border-blue-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}>
                  <div className="flex items-center justify-between"><CreditCard className="w-5 h-5 text-blue-400" /><div className={`w-5 h-5 rounded-full border-2 ${checkoutConfig.metodos.cartao ? 'bg-blue-500 border-blue-500' : 'border-slate-600'} flex items-center justify-center`}>{checkoutConfig.metodos.cartao && <CheckCircle2 className="w-3 h-3 text-slate-950" />}</div></div>
                  <div><p className="text-xs font-black text-white">Cartão</p><p className="text-[10px] text-slate-400">Parcelado</p></div>
                </div>
                <div onClick={() => updMetodos({ boleto: !checkoutConfig.metodos.boleto })} className={`p-4 rounded-xl border cursor-pointer transition flex flex-col gap-2 ${checkoutConfig.metodos.boleto ? 'bg-amber-500/10 border-amber-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}>
                  <div className="flex items-center justify-between"><FileText className="w-5 h-5 text-amber-400" /><div className={`w-5 h-5 rounded-full border-2 ${checkoutConfig.metodos.boleto ? 'bg-amber-500 border-amber-500' : 'border-slate-600'} flex items-center justify-center`}>{checkoutConfig.metodos.boleto && <CheckCircle2 className="w-3 h-3 text-slate-950" />}</div></div>
                  <div><p className="text-xs font-black text-white">Boleto</p><p className="text-[10px] text-slate-400">3 dias</p></div>
                </div>
              </div>
              {checkoutConfig.metodos.cartao && (
                <div className="p-4 bg-slate-950/80 border border-blue-900/40 rounded-xl grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Máx. Parcelas</label>
                    <select value={checkoutConfig.parcelasMax} onChange={e => upd({ parcelasMax: Number(e.target.value) })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n === 1 ? '1x à vista' : `Até ${n}x`}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Juros por</label>
                    <select value={checkoutConfig.taxaParcelamento} onChange={e => upd({ taxaParcelamento: e.target.value as any })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                      <option value="comprador">Comprador</option>
                      <option value="organizador">Organizador (Sem juros)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Textos */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" /> 3. Textos & Gatilhos Mentais
              </h2>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Texto do Botão Principal</label>
                <input type="text" value={checkoutConfig.textoBotao || ''} onChange={e => upd({ textoBotao: e.target.value })} placeholder="Garantir Minha Cota Agora" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Mensagem de Urgência (topo)</label>
                <input type="text" value={checkoutConfig.mensagens?.urgencia || ''} onChange={e => updMsgs({ urgencia: e.target.value })} placeholder="⚡ Seus números estão reservados!" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Mensagem de Escassez</label>
                <input type="text" value={checkoutConfig.mensagemEscassez || ''} onChange={e => upd({ mensagemEscassez: e.target.value })} placeholder="🔥 Apenas 47 cotas restantes!" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Instrução do Pix</label>
                <input type="text" value={checkoutConfig.mensagens?.pix || ''} onChange={e => updMsgs({ pix: e.target.value })} placeholder="Escaneie o QR Code ou copie o código." className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Texto de Rodapé do Checkout</label>
                <textarea value={checkoutConfig.textoRodape || ''} onChange={e => upd({ textoRodape: e.target.value })} rows={2} placeholder="Pagamento seguro com criptografia..." className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none resize-none" />
              </div>
            </div>

            {/* 4. Campos Obrigatórios */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> 4. Campos Obrigatórios no Checkout
              </h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-950 transition-colors">
                  <input
                    type="checkbox"
                    checked={checkoutConfig.exigirCpf || false}
                    onChange={e => upd({ exigirCpf: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <span className="text-xs text-slate-200 font-medium">Exigir CPF do comprador para participar</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-950 transition-colors">
                  <input
                    type="checkbox"
                    checked={checkoutConfig.exigirEmail || false}
                    onChange={e => upd({ exigirEmail: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <span className="text-xs text-slate-200 font-medium">Exigir E-mail do comprador para confirmação</span>
                </label>

                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkoutConfig.coletaDados?.coletarEndereco?.ativo || false}
                      onChange={e => upd({
                        coletaDados: {
                          ...(checkoutConfig.coletaDados || {}),
                          coletarEndereco: {
                            ...(checkoutConfig.coletaDados?.coletarEndereco || {}),
                            ativo: e.target.checked
                          }
                        }
                      })}
                      className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs text-slate-200 font-medium block">Coletar Endereço Completo do Comprador</span>
                      <span className="text-[11px] text-slate-400 block">Exibe campos de CEP, Logradouro, Número, Bairro, Cidade e UF no checkout</span>
                    </div>
                  </label>
                  {checkoutConfig.coletaDados?.coletarEndereco?.ativo && (
                    <label className="flex items-center gap-3 pl-7 pt-1.5 cursor-pointer border-t border-slate-800/60 mt-2">
                      <input
                        type="checkbox"
                        checked={checkoutConfig.coletaDados?.coletarEndereco?.obrigatorio || false}
                        onChange={e => upd({
                          coletaDados: {
                            ...(checkoutConfig.coletaDados || {}),
                            coletarEndereco: {
                              ...(checkoutConfig.coletaDados?.coletarEndereco || {}),
                              obrigatorio: e.target.checked
                            }
                          }
                        })}
                        className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 cursor-pointer"
                      />
                      <span className="text-xs text-amber-400 font-medium">Tornar preenchimento do endereço OBRIGATÓRIO</span>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* 5. Temporizador de Urgência & Estilos */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> 5. Temporizador de Urgência & Estilos
              </h2>
              <label className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-white">Ativar Contador Regressivo</p>
                  <p className="text-[11px] text-slate-400">Exibe tempo limite para efetuar o pagamento da reserva</p>
                </div>
                <div onClick={() => upd({ temporizadorAtivo: !checkoutConfig.temporizadorAtivo })} className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${checkoutConfig.temporizadorAtivo ? 'bg-amber-500' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checkoutConfig.temporizadorAtivo ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
              </label>

              {checkoutConfig.temporizadorAtivo && (
                <div className="space-y-3 pt-1 animate-in fade-in">
                  {/* Seletor de Estilo do Temporizador */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">Estilo Visual do Temporizador:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'fogo', label: 'Destaque Fogo', icon: '🔥', desc: 'Gradiente quente' },
                        { id: 'alerta', label: 'Alerta Vermelho', icon: '⚡', desc: 'Alta urgência' },
                        { id: 'minimalista', label: 'Minimalista', icon: '⏱️', desc: 'Clean moderno' },
                        { id: 'badge', label: 'Badge Escuro', icon: '⏳', desc: 'Mono digital' },
                      ].map(st => {
                        const isSel = (checkoutConfig.temporizadorEstilo || 'fogo') === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => upd({ temporizadorEstilo: st.id as any })}
                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                              isSel ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/50 text-white' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm">{st.icon}</span>
                              {isSel && <Check className="w-3.5 h-3.5 text-amber-400" />}
                            </div>
                            <span className="text-xs font-black block leading-tight">{st.label}</span>
                            <span className="text-[9px] text-slate-500">{st.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Duração (minutos)</label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={checkoutConfig.temporizadorMinutos || 10}
                        onChange={e => upd({ temporizadorMinutos: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Texto do Rótulo</label>
                      <input
                        type="text"
                        value={checkoutConfig.temporizadorTexto || '⏱️ Sua reserva expira em'}
                        onChange={e => upd({ temporizadorTexto: e.target.value })}
                        placeholder="⏱️ Sua reserva expira em"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Selos & Posição */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> 6. Selos de Segurança & Posicionamento
              </h2>
              <label className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-white">Exibir Selos de Confiança</p>
                  <p className="text-[11px] text-slate-400">Badges e garantias que aumentam a conversão</p>
                </div>
                <div onClick={() => upd({ selosSeguranca: !checkoutConfig.selosSeguranca })} className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${checkoutConfig.selosSeguranca ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checkoutConfig.selosSeguranca ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
              </label>

              {checkoutConfig.selosSeguranca && (
                <div className="space-y-3 pt-1 animate-in fade-in">
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">Posicionamento dos Selos:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => upd({ posicaoSelos: 'abaixo_botao' })}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                          (checkoutConfig.posicaoSelos || 'abaixo_botao') === 'abaixo_botao'
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Check className={`w-3.5 h-3.5 ${(checkoutConfig.posicaoSelos || 'abaixo_botao') === 'abaixo_botao' ? 'opacity-100' : 'opacity-0'}`} />
                        Abaixo do Botão de Pagamento
                      </button>
                      <button
                        type="button"
                        onClick={() => upd({ posicaoSelos: 'abaixo_banner' })}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                          checkoutConfig.posicaoSelos === 'abaixo_banner'
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Check className={`w-3.5 h-3.5 ${checkoutConfig.posicaoSelos === 'abaixo_banner' ? 'opacity-100' : 'opacity-0'}`} />
                        Abaixo do Banner no Topo
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {SELOS_DISPONIVEIS.map(selo => {
                      const ativo = (checkoutConfig.selosExtras || []).includes(selo.id);
                      return (
                        <div key={selo.id} onClick={() => toggleSelo(selo.id)} className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center gap-2 ${ativo ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                          <span className="text-base">{selo.icon}</span>
                          <span className="text-[10px] font-bold flex-1">{selo.label}</span>
                          {ativo && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 7. Cupom de Desconto */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" /> 7. Cupom de Desconto
              </h2>
              <label className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-950 transition-colors">
                <div>
                  <p className="text-xs font-bold text-white">Ativar Campo de Cupom no Checkout</p>
                  <p className="text-[11px] text-slate-400">Permite que o comprador insira códigos promocionais</p>
                </div>
                <div
                  onClick={() => upd({ cupomAtivo: !checkoutConfig.cupomAtivo, exibirCupom: !checkoutConfig.cupomAtivo })}
                  className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${checkoutConfig.cupomAtivo ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checkoutConfig.cupomAtivo ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
              </label>

              {checkoutConfig.cupomAtivo && (
                <div className="space-y-3 pt-1">
                  {(!checkoutConfig.cupons || checkoutConfig.cupons.length === 0) && (
                    <p className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                      ⚠️ Adicione pelo menos um cupom abaixo para que os compradores possam utilizá-lo.
                    </p>
                  )}

                  {(checkoutConfig.cupons || []).map((cup, i) => (
                    <div key={cup.id || i} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={cup.codigo}
                          onChange={e => {
                            const arr = [...(checkoutConfig.cupons || [])];
                            arr[i] = { ...arr[i], codigo: e.target.value.toUpperCase().replace(/\s/g, '') };
                            upd({ cupons: arr });
                          }}
                          placeholder="CÓDIGO (ex: VOLTA10)"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white uppercase font-mono font-bold focus:border-emerald-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const arr = (checkoutConfig.cupons || []).filter((_, idx) => idx !== i);
                            upd({ cupons: arr });
                          }}
                          className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                          title="Remover cupom"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={cup.tipo || 'percentual'}
                          onChange={e => {
                            const arr = [...(checkoutConfig.cupons || [])];
                            arr[i] = { ...arr[i], tipo: e.target.value as 'percentual' | 'fixo' };
                            upd({ cupons: arr });
                          }}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="percentual">Desconto em %</option>
                          <option value="fixo">Valor fixo (R$)</option>
                        </select>
                        {(cup.tipo || 'percentual') === 'fixo' ? (
                          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-3 focus-within:border-emerald-500">
                            <span className="text-slate-500 text-xs mr-1">R$</span>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={cup.valorFixo ?? ''}
                              onChange={e => {
                                const arr = [...(checkoutConfig.cupons || [])];
                                arr[i] = { ...arr[i], valorFixo: Number(e.target.value) };
                                upd({ cupons: arr });
                              }}
                              placeholder="5,00"
                              className="w-full bg-transparent py-2 text-xs text-white focus:outline-none"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-3 focus-within:border-emerald-500">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={cup.descontoPct ?? ''}
                              onChange={e => {
                                const arr = [...(checkoutConfig.cupons || [])];
                                arr[i] = { ...arr[i], descontoPct: Number(e.target.value) };
                                upd({ cupons: arr });
                              }}
                              placeholder="10"
                              className="w-full bg-transparent py-2 text-xs text-white focus:outline-none"
                            />
                            <span className="text-slate-500 text-xs ml-1">%</span>
                          </div>
                        )}
                      </div>

                      <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cup.ativo !== false}
                          onChange={e => {
                            const arr = [...(checkoutConfig.cupons || [])];
                            arr[i] = { ...arr[i], ativo: e.target.checked };
                            upd({ cupons: arr });
                          }}
                          className="w-3.5 h-3.5 rounded text-emerald-500 bg-slate-900 border-slate-700/50 cursor-pointer"
                        />
                        Cupom ativo para uso
                      </label>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      const novo: CupomDesconto = {
                        id: `cup-${Date.now()}`,
                        codigo: '',
                        tipo: 'percentual',
                        descontoPct: 10,
                        valorFixo: 0,
                        ativo: true,
                        criadoEm: new Date().toISOString()
                      };
                      upd({ cupons: [...(checkoutConfig.cupons || []), novo] });
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Adicionar cupom
                  </button>
                </div>
              )}
            </div>

            {/* 8. Tela de Compra Concluída (Sucesso & Pós-Venda) */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <PartyPopper className="w-4 h-4 text-emerald-400" /> 8. Tela de Compra Concluída (Pós-Pagamento)
                </h2>
                <button
                  type="button"
                  onClick={() => setPreviewScreen('sucesso')}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  Visualizar no Preview →
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Personalize os textos, botões e ações exibidos imediatamente após o pagamento ser confirmado pelo comprador.
              </p>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Título da Tela de Sucesso</label>
                <input
                  type="text"
                  value={conf.titulo || ''}
                  onChange={e => updConfirmacao({ titulo: e.target.value })}
                  placeholder="Pagamento Confirmado! 🎉"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Subtítulo / Mensagem Explicativa</label>
                <input
                  type="text"
                  value={conf.subtitulo || ''}
                  onChange={e => updConfirmacao({ subtitulo: e.target.value })}
                  placeholder="Seus números da sorte já foram vinculados ao seu WhatsApp!"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Mensagem de Agradecimento (Destaque)</label>
                <input
                  type="text"
                  value={conf.mensagemAgradecimento || ''}
                  onChange={e => updConfirmacao({ mensagemAgradecimento: e.target.value })}
                  placeholder="Obrigado por apoiar nosso projeto! Boa sorte!"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Banner Comemorativo da Confirmação (URL opcional)</label>
                <input
                  type="url"
                  value={conf.bannerSucessoUrl || ''}
                  onChange={e => updConfirmacao({ bannerSucessoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Opção Escolher Animação da Tela de Sucesso */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> Animação da Tela de Sucesso
                  </label>
                  <button
                    type="button"
                    onClick={() => dispararExplosaoConfetes()}
                    className="text-[10px] bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 font-black border border-purple-500/40 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3 text-purple-400" /> ⚡ Testar Efeito
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2 bg-slate-900 border border-slate-700/80 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PartyPopper className="w-4 h-4 text-purple-400" />
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {conf.animacaoSucesso === 'nenhuma' || conf.exibirConfetes === false
                            ? 'Nenhuma Animação'
                            : '🎉 Explosão de Confetes'}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {conf.animacaoSucesso === 'nenhuma' || conf.exibirConfetes === false
                            ? 'Sem efeito visual ao concluir'
                            : 'Explosão lateral com 2 canhões'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalAnimacaoAberto(true)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition shadow-sm cursor-pointer"
                    >
                      Escolher Animação
                    </button>
                  </div>
                </div>
              </div>

              {/* Toggles da Tela de Sucesso */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer">
                  <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-emerald-400" /> Exibir Lista de Números da Sorte
                  </span>
                  <input
                    type="checkbox"
                    checked={conf.exibirNumeros !== false}
                    onChange={e => updConfirmacao({ exibirNumeros: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer">
                  <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5 text-blue-400" /> Exibir Botão "Copiar Números"
                  </span>
                  <input
                    type="checkbox"
                    checked={conf.exibirBotaoCopiar !== false}
                    onChange={e => updConfirmacao({ exibirBotaoCopiar: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer">
                  <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-teal-400" /> Exibir Botão "Salvar / Compartilhar no WhatsApp"
                  </span>
                  <input
                    type="checkbox"
                    checked={conf.exibirBotaoWhatsapp !== false}
                    onChange={e => updConfirmacao({ exibirBotaoWhatsapp: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer">
                  <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-indigo-400" /> Exibir Botão "Acessar Área Meus Números"
                  </span>
                  <input
                    type="checkbox"
                    checked={conf.exibirBotaoMeusNumeros !== false}
                    onChange={e => updConfirmacao({ exibirBotaoMeusNumeros: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500"
                  />
                </label>
              </div>

              {/* Botão de Grupo VIP / Canal */}
              <div className="p-3.5 bg-slate-950/80 border border-teal-900/40 rounded-xl space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-teal-400" /> Botão para Grupo VIP / Canal do WhatsApp
                    </p>
                    <p className="text-[11px] text-slate-400">Leva o cliente ao seu grupo oficial logo após o pagamento</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!conf.botaoGrupoVipAtivo}
                    onChange={e => updConfirmacao({ botaoGrupoVipAtivo: e.target.checked })}
                    className="w-4 h-4 accent-teal-500"
                  />
                </label>

                {conf.botaoGrupoVipAtivo && (
                  <div className="space-y-2 pt-1 border-t border-slate-800">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Texto do Botão do Grupo</label>
                      <input
                        type="text"
                        value={conf.botaoGrupoVipTexto || ''}
                        onChange={e => updConfirmacao({ botaoGrupoVipTexto: e.target.value })}
                        placeholder="Entrar no Grupo VIP do WhatsApp"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Link do Grupo / Canal (URL)</label>
                      <input
                        type="url"
                        value={conf.botaoGrupoVipLink || ''}
                        onChange={e => updConfirmacao({ botaoGrupoVipLink: e.target.value })}
                        placeholder="https://chat.whatsapp.com/..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Instruções Extras Pós-Compra (Notas / Regras)</label>
                <textarea
                  value={conf.instrucoesPosCompra || ''}
                  onChange={e => updConfirmacao({ instrucoesPosCompra: e.target.value })}
                  rows={2}
                  placeholder="Ex: O sorteio será transmitido ao vivo em nosso Instagram às 20h..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* 9. Conversão & Retenção */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
              <h4 className="text-sm font-black text-white flex items-center gap-2">🔔 9. Conversão & Retenção</h4>

              {/* Notificações Sociais */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Notificações Sociais (Toast "Fulano comprou...")</span>
                    <span className="text-[11px] text-slate-400 block">Aumenta prova social e conversão com compras em tempo real</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!checkoutConfig.notificacoesSociais?.ativo}
                    onChange={e => upd({ notificacoesSociais: { ...checkoutConfig.notificacoesSociais, ativo: e.target.checked } })}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 w-4 h-4 cursor-pointer"
                  />
                </label>

                {checkoutConfig.notificacoesSociais?.ativo && (
                  <div className="space-y-3 pt-2 border-t border-slate-800 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Posição na Tela</label>
                        <select
                          value={checkoutConfig.notificacoesSociais?.posicao || 'base-esq'}
                          onChange={e => upd({ notificacoesSociais: { ...checkoutConfig.notificacoesSociais, ativo: true, posicao: e.target.value as any } })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                        >
                          <option value="base-esq">Inferior esquerda</option>
                          <option value="base-dir">Inferior direita</option>
                          <option value="topo-esq">Superior esquerda</option>
                          <option value="topo-dir">Superior direita</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Modo de Intervalo</label>
                        <select
                          value={checkoutConfig.notificacoesModoIntervalo || 'fixo'}
                          onChange={e => upd({ notificacoesModoIntervalo: e.target.value as any })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                        >
                          <option value="fixo">Intervalo Fixo</option>
                          <option value="aleatorio">Faixa Aleatória (mais natural)</option>
                        </select>
                      </div>
                    </div>

                    {(checkoutConfig.notificacoesModoIntervalo || 'fixo') === 'fixo' ? (
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Disparar a cada (segundos)</label>
                        <input
                          type="number" min={3} max={120}
                          value={checkoutConfig.notificacoesSociais?.intervalo || 12}
                          onChange={e => upd({ notificacoesSociais: { ...checkoutConfig.notificacoesSociais, ativo: true, intervalo: Number(e.target.value) } })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Mínimo (seg)</label>
                          <input
                            type="number" min={2} max={60}
                            value={checkoutConfig.notificacoesIntervaloMin || 6}
                            onChange={e => upd({ notificacoesIntervaloMin: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Máximo (seg)</label>
                          <input
                            type="number" min={4} max={120}
                            value={checkoutConfig.notificacoesIntervaloMax || 18}
                            onChange={e => upd({ notificacoesIntervaloMax: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Exit Pop-up */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-slate-200">Pop-up de retenção (Exit Pop-up)</span>
                  <input
                    type="checkbox"
                    checked={!!checkoutConfig.exitPopup?.ativo}
                    onChange={e => upd({ exitPopup: { ...checkoutConfig.exitPopup, ativo: e.target.checked } })}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 w-4 h-4 cursor-pointer"
                  />
                </label>
                {checkoutConfig.exitPopup?.ativo && (
                  <div className="mt-3">
                    <label className="text-[10px] text-slate-400 block mb-1">Gatilho</label>
                    <select
                      value={checkoutConfig.exitPopup?.gatilho || 'saida'}
                      onChange={e => upd({ exitPopup: { ...checkoutConfig.exitPopup, ativo: true, gatilho: e.target.value as any } })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                    >
                      <option value="saida">Mouse saindo pelo topo (desktop)</option>
                      <option value="aba">Trocar de aba/app</option>
                      <option value="voltar">Botão voltar do navegador</option>
                      <option value="tempo">Após X segundos na página</option>
                    </select>
                    {checkoutConfig.exitPopup?.gatilho === 'tempo' && (
                      <input
                        type="number" min={3}
                        value={checkoutConfig.exitPopup?.tempoSegundos || 20}
                        onChange={e => upd({ exitPopup: { ...checkoutConfig.exitPopup, ativo: true, gatilho: 'tempo', tempoSegundos: Number(e.target.value) } })}
                        placeholder="Segundos"
                        className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Salvar */}
            <div className="flex items-center gap-3">
              <button onClick={handleSalvar} disabled={salvando} className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black rounded-xl flex items-center justify-center gap-2 transition shadow-lg disabled:opacity-60 active:scale-[0.98] cursor-pointer">
                <Save className="w-5 h-5" />
                {salvando ? 'Salvando...' : editandoId ? 'Atualizar Checkout' : 'Salvar Checkout'}
              </button>
              <button onClick={() => { setFormAberto(false); setEditandoId(null); }} className="py-3.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition border border-slate-700 cursor-pointer">
                Cancelar
              </button>
            </div>
          </div>

          {/* Coluna de Preview Interativo em Tempo Real */}
          <div className="xl:col-span-5 space-y-4">
            <div className="sticky top-6 space-y-4">
              <div className="flex flex-col gap-2 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
                {/* Switcher entre Checkout e Tela de Sucesso */}
                <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl">
                  <button
                    onClick={() => setPreviewScreen('checkout')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${previewScreen === 'checkout' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Checkout
                  </button>
                  <button
                    onClick={() => setPreviewScreen('sucesso')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${previewScreen === 'sucesso' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <PartyPopper className="w-3.5 h-3.5" /> 🎉 Compra Concluída
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl">
                    {(['mobile', 'desktop'] as const).map(d => (
                      <button key={d} onClick={() => setPreviewDevice(d)} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${previewDevice === d ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                        {d === 'mobile' ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                        {d === 'mobile' ? 'Mobile' : 'Desktop'}
                      </button>
                    ))}
                  </div>

                  {previewScreen === 'checkout' && (
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl">
                      {checkoutConfig.metodos.pix !== false && (
                        <button
                          onClick={() => setPreviewTab('pix')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${previewTab === 'pix' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          Pix
                        </button>
                      )}
                      {checkoutConfig.metodos.cartao && (
                        <button
                          onClick={() => setPreviewTab('cartao')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${previewTab === 'cartao' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          Cartão
                        </button>
                      )}
                      {checkoutConfig.metodos.boleto && (
                        <button
                          onClick={() => setPreviewTab('boleto')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${previewTab === 'boleto' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          Boleto
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card de Preview Renderizado */}
              <div
                className={`${previewDevice === 'mobile' ? 'max-w-[360px] mx-auto' : 'w-full'} rounded-2xl border border-slate-700 overflow-hidden shadow-2xl transition-all`}
                style={{ fontFamily: checkoutConfig.fonteFamilia || 'Inter', backgroundColor: bgColor }}
              >
                {previewScreen === 'checkout' ? (
                  /* Preview do Formulário de Checkout */
                  <>
                    <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: `${primary}30` }}>
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <CreditCard className="w-4 h-4" style={{ color: primary }} /> Finalizar Compra
                      </h3>
                      <div className="w-7 h-7 bg-slate-800/80 rounded-full flex items-center justify-center text-slate-400 text-xs">✕</div>
                    </div>

                    <div className="p-4 space-y-3 max-h-[560px] overflow-y-auto">
                      {/* Banner de Topo */}
                      {checkoutConfig.bannerUrl && (
                        <img
                          src={checkoutConfig.bannerUrl}
                          alt="Banner"
                          className="w-full h-24 object-cover rounded-xl border border-slate-800 shadow"
                          onError={e => (e.currentTarget.style.display = 'none')}
                        />
                      )}

                      {/* Selos no topo se configurado */}
                      {checkoutConfig.selosSeguranca && checkoutConfig.posicaoSelos === 'abaixo_banner' && (checkoutConfig.selosExtras || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 justify-center py-1">
                          {SELOS_DISPONIVEIS.filter(s => (checkoutConfig.selosExtras || []).includes(s.id)).map(s => (
                            <span key={s.id} className="text-[9px] text-slate-400 flex items-center gap-1 bg-slate-900/80 border border-slate-800 px-2 py-0.5 rounded-lg shadow-sm">
                              {s.icon} {s.label}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Mensagem de Urgência */}
                      {checkoutConfig.mensagens?.urgencia && (
                        <div className="p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse" style={{ backgroundColor: `${primary}15`, border: `1px solid ${primary}40`, color: primary }}>
                          <Zap className="w-3.5 h-3.5 shrink-0" />{checkoutConfig.mensagens.urgencia}
                        </div>
                      )}

                      {/* Temporizador com Estilos Visuais */}
                      {checkoutConfig.temporizadorAtivo && (
                        <div
                          className={`p-2.5 rounded-xl flex items-center justify-between ${
                            (checkoutConfig.temporizadorEstilo || 'fogo') === 'fogo'
                              ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border border-orange-500/40 text-amber-300'
                              : checkoutConfig.temporizadorEstilo === 'alerta'
                                ? 'bg-red-500/15 border border-red-500/40 text-red-400 animate-pulse'
                                : checkoutConfig.temporizadorEstilo === 'minimalista'
                                  ? 'bg-slate-900 border border-slate-700 text-slate-300'
                                  : 'bg-slate-950 border border-amber-500/30 text-amber-400 font-mono'
                          }`}
                        >
                          <span className="text-[11px] font-bold flex items-center gap-1">
                            {(checkoutConfig.temporizadorEstilo || 'fogo') === 'fogo' && <Flame className="w-3.5 h-3.5 text-orange-400 animate-bounce" />}
                            {checkoutConfig.temporizadorTexto || '⏱️ Sua reserva expira em'}
                          </span>
                          <span className="text-sm font-black font-mono">
                            {String(checkoutConfig.temporizadorMinutos || 10).padStart(2,'0')}:00
                          </span>
                        </div>
                      )}

                      {/* Mensagem de Escassez */}
                      {checkoutConfig.mensagemEscassez && (
                        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] font-bold text-red-400 text-center">
                          {checkoutConfig.mensagemEscassez}
                        </div>
                      )}

                      {/* Seletor Interativo das Abas de Pagamento no Preview */}
                      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                        {checkoutConfig.metodos.pix !== false && (
                          <button
                            type="button"
                            onClick={() => setPreviewTab('pix')}
                            className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                              previewTab === 'pix' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <QrCode className="w-3.5 h-3.5" /> Pix
                          </button>
                        )}
                        {checkoutConfig.metodos.cartao && (
                          <button
                            type="button"
                            onClick={() => setPreviewTab('cartao')}
                            className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                              previewTab === 'cartao' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Cartão
                          </button>
                        )}
                        {checkoutConfig.metodos.boleto && (
                          <button
                            type="button"
                            onClick={() => setPreviewTab('boleto')}
                            className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                              previewTab === 'boleto' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5" /> Boleto
                          </button>
                        )}
                      </div>

                      {/* Prévia específica por método */}
                      {previewTab === 'pix' && (
                        <div className="p-3.5 bg-slate-950/90 border border-emerald-500/30 rounded-xl space-y-3 text-center">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-400 flex items-center gap-1">
                              <QrCode className="w-4 h-4" /> Pagamento Instantâneo via Pix
                            </span>
                            <span className="text-white font-black font-mono">R$ 25,00</span>
                          </div>

                          {/* QR Code Simulado de Alta Fidelidade */}
                          <div className="w-36 h-36 bg-white p-2 rounded-xl mx-auto flex items-center justify-center shadow-lg border border-slate-300">
                            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-950">
                              <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
                              {/* Quadrados de canto (Finders) */}
                              <rect x="5" y="5" width="26" height="26" fill="#000000" rx="3" />
                              <rect x="9" y="9" width="18" height="18" fill="#ffffff" rx="2" />
                              <rect x="13" y="13" width="10" height="10" fill="#000000" rx="1" />
                              <rect x="69" y="5" width="26" height="26" fill="#000000" rx="3" />
                              <rect x="73" y="9" width="18" height="18" fill="#ffffff" rx="2" />
                              <rect x="77" y="13" width="10" height="10" fill="#000000" rx="1" />
                              <rect x="5" y="69" width="26" height="26" fill="#000000" rx="3" />
                              <rect x="9" y="73" width="18" height="18" fill="#ffffff" rx="2" />
                              <rect x="13" y="77" width="10" height="10" fill="#000000" rx="1" />
                              {/* Padrões internos do QR Code */}
                              <rect x="36" y="8" width="6" height="6" fill="#000" />
                              <rect x="48" y="14" width="8" height="8" fill="#000" />
                              <rect x="36" y="24" width="12" height="6" fill="#000" />
                              <rect x="10" y="38" width="8" height="8" fill="#000" />
                              <rect x="24" y="44" width="8" height="6" fill="#000" />
                              <rect x="38" y="38" width="24" height="24" fill="#000" />
                              <rect x="44" y="44" width="12" height="12" fill="#fff" />
                              <rect x="48" y="48" width="4" height="4" fill="#000" />
                              <rect x="68" y="38" width="10" height="6" fill="#000" />
                              <rect x="82" y="44" width="8" height="10" fill="#000" />
                              <rect x="38" y="70" width="10" height="8" fill="#000" />
                              <rect x="54" y="76" width="16" height="8" fill="#000" />
                              <rect x="76" y="70" width="14" height="14" fill="#000" />
                            </svg>
                          </div>

                          <p className="text-[11px] text-slate-300">
                            {checkoutConfig.mensagens?.pix || 'Escaneie o QR Code acima no app do seu banco ou use a chave Copia e Cola.'}
                          </p>

                          <button
                            type="button"
                            onClick={copiarChavePix}
                            className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                              copiadoPix
                                ? 'bg-emerald-500 text-slate-950 shadow-md'
                                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                            }`}
                          >
                            {copiadoPix ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4 text-emerald-400" />}
                            {copiadoPix ? 'Código Pix Copiado com Sucesso!' : 'Copiar Código Pix Copia e Cola'}
                          </button>
                        </div>
                      )}

                      {previewTab === 'cartao' && (
                        <div className="space-y-3">
                          {/* Cartão de Crédito Digital Holográfico Interativo */}
                          <div className="relative rounded-2xl p-4 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/40 text-white shadow-xl space-y-3 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                            <div className="flex items-center justify-between">
                              <div className="w-9 h-7 rounded bg-amber-400/80 border border-amber-300 shadow-sm" />
                              <span className="font-mono text-xs font-black tracking-widest text-indigo-300">CREDIT CARD</span>
                            </div>
                            <p className="font-mono text-sm tracking-widest font-black text-center py-1 text-slate-200">
                              {cartaoNumero}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase">
                              <div>
                                <span className="block text-[8px] text-slate-500">TITULAR</span>
                                <span className="font-bold text-slate-200">{cartaoNome}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] text-slate-500">VALIDADE</span>
                                <span className="font-bold text-slate-200">{cartaoValidade}</span>
                              </div>
                            </div>
                          </div>

                          {/* Campos do Cartão */}
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={cartaoNumero}
                              onChange={e => setCartaoNumero(e.target.value)}
                              placeholder="Número do Cartão"
                              className="w-full h-9 bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 text-xs text-white focus:outline-none"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={cartaoValidade}
                                onChange={e => setCartaoValidade(e.target.value)}
                                placeholder="MM/AA"
                                className="h-9 bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 text-xs text-white focus:outline-none"
                              />
                              <input
                                type="text"
                                value={cartaoCVV}
                                onChange={e => setCartaoCVV(e.target.value)}
                                placeholder="CVV"
                                className="h-9 bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 text-xs text-white focus:outline-none"
                              />
                            </div>
                            <input
                              type="text"
                              value={cartaoNome}
                              onChange={e => setCartaoNome(e.target.value)}
                              placeholder="Nome impresso no cartão"
                              className="w-full h-9 bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 text-xs text-white focus:outline-none uppercase"
                            />
                            {/* Parcelamento */}
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 block">Opção de Parcelamento:</label>
                              <select
                                value={parcelaSelecionada}
                                onChange={e => setParcelaSelecionada(Number(e.target.value))}
                                className="w-full h-9 bg-slate-900 border border-slate-700 rounded-xl px-3 text-xs text-white focus:outline-none"
                              >
                                {Array.from({ length: checkoutConfig.parcelasMax || 12 }, (_, i) => i + 1).map(p => (
                                  <option key={p} value={p}>
                                    {p}x de R$ {(25 / p).toFixed(2).replace('.', ',')} {checkoutConfig.taxaParcelamento === 'organizador' ? '(Sem Juros)' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {previewTab === 'boleto' && (
                        <div className="p-3.5 bg-slate-950/90 border border-amber-500/30 rounded-xl space-y-3 text-center">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-amber-400 flex items-center gap-1">
                              <FileText className="w-4 h-4" /> Boleto Bancário
                            </span>
                            <span className="text-white font-black font-mono">R$ 25,00</span>
                          </div>
                          
                          {/* Código de barras simulado */}
                          <div className="bg-white p-2.5 rounded-lg space-y-1">
                            <div className="flex items-center justify-between h-8 gap-0.5 px-2">
                              {Array.from({ length: 42 }).map((_, i) => (
                                <div
                                  key={i}
                                  className="h-full bg-black"
                                  style={{ width: i % 3 === 0 ? '3px' : i % 5 === 0 ? '4px' : '1.5px' }}
                                />
                              ))}
                            </div>
                            <span className="text-[9px] font-mono text-slate-700 block tracking-widest">
                              34191.79001 01043.510047 91020.150008 5 91280000002500
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400">
                            Vencimento em 3 dias úteis. A confirmação do pagamento é realizada em até 24h a 48h.
                          </p>

                          <button
                            type="button"
                            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition"
                          >
                            <Copy className="w-3.5 h-3.5 text-amber-400" /> Copiar Linha Digitável
                          </button>
                        </div>
                      )}

                      {/* Campos do Comprador */}
                      <div className="space-y-2">
                        {['Nome completo', 'WhatsApp', 'Data de Nascimento'].map(f => (
                          <div key={f} className="h-9 bg-slate-900/80 border border-slate-700/50 rounded-xl px-3 flex items-center text-xs text-slate-500">{f}</div>
                        ))}
                        {checkoutConfig.exigirCpf && <div className="h-9 bg-slate-900/80 border border-slate-700/50 rounded-xl px-3 flex items-center text-xs text-slate-500">CPF (Obrigatório)</div>}
                        {checkoutConfig.exigirEmail && <div className="h-9 bg-slate-900/80 border border-slate-700/50 rounded-xl px-3 flex items-center text-xs text-slate-500">E-mail (Obrigatório)</div>}
                      </div>

                      {/* Cupom */}
                      {(checkoutConfig.cupomAtivo || checkoutConfig.exibirCupom) && (
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold">
                            <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-emerald-400" /> Tem um cupom?</span>
                            {(checkoutConfig.cupons || []).length > 0 && (
                              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                                {(checkoutConfig.cupons || []).filter(c => c.ativo !== false && c.codigo).length} cupom(ns) ativo(s)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              disabled
                              placeholder="Digite seu cupom"
                              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-400 uppercase font-mono"
                            />
                            <button
                              type="button"
                              disabled
                              className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg border border-slate-700"
                            >
                              Aplicar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Botão de Compra Principal */}
                      <button className="w-full py-3.5 rounded-xl text-sm font-black text-slate-950 shadow-lg transition" style={{ backgroundColor: primary, boxShadow: `0 8px 20px ${primary}40` }}>
                        {checkoutConfig.textoBotao || 'Garantir Minha Cota Agora'} →
                      </button>

                      {/* Selos de Segurança abaixo do botão */}
                      {checkoutConfig.selosSeguranca && (checkoutConfig.posicaoSelos || 'abaixo_botao') === 'abaixo_botao' && (checkoutConfig.selosExtras || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 justify-center pt-1">
                          {SELOS_DISPONIVEIS.filter(s => (checkoutConfig.selosExtras || []).includes(s.id)).map(s => (
                            <span key={s.id} className="text-[9px] text-slate-500 flex items-center gap-1 bg-slate-900/60 border border-slate-800 px-2 py-1 rounded-lg">
                              {s.icon} {s.label}
                            </span>
                          ))}
                        </div>
                      )}

                      {checkoutConfig.textoRodape && <p className="text-[10px] text-slate-600 text-center leading-snug">🔒 {checkoutConfig.textoRodape}</p>}
                    </div>
                  </>
                ) : (
                  /* Preview da Tela de Compra Concluída (Sucesso) */
                  <>
                    <div className="px-4 py-3 flex items-center justify-between border-b border-emerald-500/30">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider">Pós-Pagamento Confirmado</h3>
                      </div>
                      <div className="w-7 h-7 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 text-xs">✕</div>
                    </div>
                    <div className="p-4 space-y-3 max-h-[560px] overflow-y-auto text-center">
                      {conf.bannerSucessoUrl && (
                        <img src={conf.bannerSucessoUrl} alt="Sucesso" className="w-full h-24 object-cover rounded-xl border border-emerald-500/30 mb-2" onError={e => (e.currentTarget.style.display = 'none')} />
                      )}

                      <div className="w-14 h-14 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>

                      <div>
                        <h3 className="text-lg font-black text-white">{conf.titulo || 'Pagamento Confirmado! 🎉'}</h3>
                        <p className="text-xs text-slate-300 mt-1">{conf.subtitulo || 'Seus números já estão salvos e vinculados ao seu WhatsApp!'}</p>
                      </div>

                      {conf.mensagemAgradecimento && (
                        <p className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl">
                          {conf.mensagemAgradecimento}
                        </p>
                      )}

                      {conf.exibirNumeros !== false && (
                        <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-3 text-left">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                              <Ticket className="w-3 h-3" /> Bilhetes da Sorte (3):
                            </span>
                            {conf.exibirBotaoCopiar !== false && (
                              <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer">
                                <Copy className="w-2.5 h-2.5" /> Copiar
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {['04812', '09234', '15890'].map(n => (
                              <span key={n} className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-[11px] rounded">
                                {n}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {conf.instrucoesPosCompra && (
                        <div className="p-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-left text-[11px] text-slate-300">
                          <span className="text-[10px] font-bold text-amber-400 block mb-0.5">ℹ️ Informações:</span>
                          {conf.instrucoesPosCompra}
                        </div>
                      )}

                      <div className="space-y-2 pt-1">
                        {conf.botaoGrupoVipAtivo && conf.botaoGrupoVipLink && (
                          <div className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md">
                            <Users className="w-3.5 h-3.5" />
                            <span>{conf.botaoGrupoVipTexto || 'Entrar no Grupo VIP do WhatsApp'}</span>
                            <ExternalLink className="w-3 h-3 opacity-80" />
                          </div>
                        )}

                        {conf.exibirBotaoWhatsapp !== false && (
                          <div className="w-full py-2 bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5">
                            <MessageCircle className="w-3.5 h-3.5" /> Salvar / Compartilhar no WhatsApp
                          </div>
                        )}

                        {conf.exibirBotaoMeusNumeros !== false && (
                          <div className="w-full py-3 bg-emerald-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md">
                            <Ticket className="w-3.5 h-3.5" /> Acessar Área "Meus Números"
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <p className="text-center text-[10px] text-slate-500">Preview dinâmico — alterne entre as abas acima para testar o visual</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Escolher Animação */}
      {modalAnimacaoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-white space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold">Escolher Animação</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalAnimacaoAberto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Selecione o estilo de comemoração visual exibido na tela de compra concluída e nas cotas premiadas:
            </p>

            <div className="space-y-3">
              {/* Opção 1: Explosão de Confetes */}
              <div
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  conf.animacaoSucesso !== 'nenhuma' && conf.exibirConfetes !== false
                    ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
                onClick={() => {
                  updConfirmacao({ animacaoSucesso: 'explosao_confetes', exibirConfetes: true });
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <span className="text-2xl">🎉</span>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Explosão de Confetes
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
                          Recomendado
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Dispara dois canhões de confetes saindo das extremidades inferiores da tela, explodindo para cima e caindo em arco por todo canto.
                      </p>
                    </div>
                  </div>
                  {conf.animacaoSucesso !== 'nenhuma' && conf.exibirConfetes !== false && (
                    <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" />
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">Estilo: Explosão Lateral Dupla</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispararExplosaoConfetes();
                    }}
                    className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 font-bold rounded-lg text-xs flex items-center gap-1 border border-purple-500/30 transition cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-purple-400" /> ⚡ Testar Animação
                  </button>
                </div>
              </div>

              {/* Opção 2: Nenhuma Animação */}
              <div
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  conf.animacaoSucesso === 'nenhuma' || conf.exibirConfetes === false
                    ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
                onClick={() => {
                  updConfirmacao({ animacaoSucesso: 'nenhuma', exibirConfetes: false });
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <span className="text-2xl">🚫</span>
                    <div>
                      <h4 className="text-sm font-bold text-white">Nenhuma Animação</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Desativa efeitos visuais festivos na conclusão do pedido ou cotas premiadas.
                      </p>
                    </div>
                  </div>
                  {(conf.animacaoSucesso === 'nenhuma' || conf.exibirConfetes === false) && (
                    <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" />
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setModalAnimacaoAberto(false)}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
