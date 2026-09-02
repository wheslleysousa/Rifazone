import { confirmar } from '../../lib/confirm';
import { toast } from '../../lib/toast';
import React, { useState, useEffect, useRef } from 'react';
import { CheckoutConfig, CheckoutSalvo, DEFAULT_CHECKOUT_CONFIG, ConfirmacaoCompraConfig, CupomDesconto } from '../../types';
import { dispararExplosaoConfetes } from '../../utils/confettiUtils';
import { VisualTab } from './checkout/VisualTab';
import { PagamentoTab } from './checkout/PagamentoTab';
import { GatilhosTab } from './checkout/GatilhosTab';
import { CamposTab } from './checkout/CamposTab';
import { PosVendaTab } from './checkout/PosVendaTab';
import { OrdemElementosTab } from './checkout/OrdemElementosTab';
import { CheckoutConfigExtended } from './checkout/types_private';
import {
  CreditCard, QrCode, FileText, ShieldCheck, CheckCircle2,
  Trash2, Edit3, Plus, Save, RefreshCw, Smartphone,
  Monitor, AlertTriangle, Clock, Zap, MessageSquare,
  Palette, Type, X, PartyPopper, Users, Sparkles, Copy,
  Share2, Ticket, MessageCircle, ExternalLink, HelpCircle, Tag,
  Upload, Image, Check, Flame, Sliders, ChevronDown, CheckCheck, Layers
} from 'lucide-react';

interface Props {
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
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
  const [activeFormTab, setActiveFormTab] = useState<'visual' | 'pagamento' | 'gatilhos' | 'campos' | 'posvenda'>('visual');
  const [selectedPaymentCard, setSelectedPaymentCard] = useState<'pix' | 'cartao' | 'boleto'>('pix');

  const handleSelectPaymentCard = (method: 'pix' | 'cartao' | 'boleto') => {
    setSelectedPaymentCard(method);
    setPreviewTab(method);
  };
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
  
  const updGateway = (gatewayId: string, patch: any) => {
    setCheckoutConfig(prev => ({
      ...prev,
      gateways: {
        ...(prev as any).gateways,
        [gatewayId]: {
          ...((prev as any).gateways?.[gatewayId] || {}),
          ...patch
        }
      }
    }));
  };
  
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
    e.target.value = '';
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {checkoutsSalvos.map(item => {
              const cfg = item.checkout as CheckoutConfigExtended;
              const cor = cfg.corPrimaria || '#10b981';
              const selosBadges = SELOS_DISPONIVEIS.filter(s => (cfg.selosExtras || []).includes(s.id));
              return (
                <div 
                  key={item.id} 
                  className="group bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-950/10 hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-inner" style={{ backgroundColor: `${cor}15`, border: `1px solid ${cor}30` }}>
                        <CreditCard className="w-5 h-5 transition-transform group-hover:scale-110" style={{ color: cor }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight group-hover:text-indigo-400 transition-colors">{item.nome}</h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {item.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Badges de Ativos */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cfg.metodos?.pix !== false && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-md flex items-center gap-1">
                        <QrCode className="w-3 h-3" /> Pix
                      </span>
                    )}
                    {cfg.metodos?.cartao && (
                      <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold rounded-md flex items-center gap-1">
                        <CreditCard className="w-3 h-3" /> Cartão {cfg.parcelasMax}x
                      </span>
                    )}
                    {cfg.metodos?.boleto && (
                      <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold rounded-md flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Boleto
                      </span>
                    )}
                    {cfg.cupomAtivo && (
                      <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold rounded-md flex items-center gap-1">
                        <Tag className="w-3 h-3" /> Cupom
                      </span>
                    )}
                    {cfg.confirmacao?.botaoGrupoVipAtivo && (
                      <span className="px-2 py-0.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold rounded-md flex items-center gap-1">
                        <Users className="w-3 h-3" /> VIP
                      </span>
                    )}
                  </div>

                  {/* Selos de segurança */}
                  {selosBadges.length > 0 && (
                    <div className="flex flex-wrap gap-1 border-t border-slate-800/80 pt-3">
                      {selosBadges.slice(0, 3).map(s => (
                        <span key={s.id} className="text-[9px] text-slate-400 bg-slate-950 border border-slate-800/60 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          {s.icon} {s.label}
                        </span>
                      ))}
                      {selosBadges.length > 3 && (
                        <span className="text-[9px] text-slate-500 bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded-md">
                          +{selosBadges.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex gap-2 mt-auto pt-2 border-t border-slate-800/60">
                    <button 
                      onClick={() => handleEditar(item)} 
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition border border-slate-700 hover:border-slate-600 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-400" /> Editar Ajustes
                    </button>
                    <button 
                      onClick={() => handleExcluir(item.id)} 
                      className="py-2.5 px-3.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 rounded-xl flex items-center justify-center transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
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

            {/* Navegação por Abas do Checkout Form */}
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto no-scrollbar">
              {[
                { id: 'visual', label: '1. Visual', icon: Palette },
                { id: 'pagamento', label: '2. Pagamento', icon: CreditCard },
                { id: 'gatilhos', label: '3. Gatilhos & Urgência', icon: Clock },
                { id: 'campos', label: '4. Campos & Cupons', icon: Tag },
                { id: 'posvenda', label: '5. Pós-Venda', icon: PartyPopper },
                { id: 'ordem', label: '6. Ordem', icon: Layers },
              ].map(tab => {
                const Icon = tab.icon;
                const isSel = activeFormTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFormTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      isSel
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Conteúdo da Aba Selecionada */}
            {activeFormTab === 'visual' && (
              <VisualTab
                checkoutConfig={checkoutConfig as CheckoutConfigExtended}
                upd={upd}
                fileInputRef={fileInputRef}
                handleUploadBanner={handleUploadBanner}
              />
            )}

            {activeFormTab === 'pagamento' && (
              <PagamentoTab
                checkoutConfig={checkoutConfig as CheckoutConfigExtended}
                upd={upd}
                updGateway={updGateway}
                selectedPaymentCard={selectedPaymentCard}
                handleSelectPaymentCard={handleSelectPaymentCard}
              />
            )}

            {activeFormTab === 'gatilhos' && (
              <GatilhosTab
                checkoutConfig={checkoutConfig as CheckoutConfigExtended}
                upd={upd}
                updMsgs={updMsgs}
                toggleSelo={toggleSelo}
              />
            )}

            {activeFormTab === 'campos' && (
              <CamposTab
                checkoutConfig={checkoutConfig as CheckoutConfigExtended}
                upd={upd}
              />
            )}

            {activeFormTab === 'posvenda' && (
              <PosVendaTab
                checkoutConfig={checkoutConfig as CheckoutConfigExtended}
                updConfirmacao={updConfirmacao}
                setPreviewScreen={setPreviewScreen}
                setModalAnimacaoAberto={setModalAnimacaoAberto}
              />
            )}

            {activeFormTab === 'ordem' && (
              <OrdemElementosTab
                checkoutConfig={checkoutConfig as CheckoutConfigExtended}
                upd={upd}
              />
            )}



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
                      {/* Banner de Topo (Imagem ou Vídeo) */}
                      {checkoutConfig.bannerTipo === 'video' && checkoutConfig.bannerVideoUrl ? (
                        <div className="rounded-xl overflow-hidden border border-slate-800 shadow bg-slate-950">
                          {checkoutConfig.bannerVideoUrl.includes('youtube.com') || checkoutConfig.bannerVideoUrl.includes('youtu.be') ? (
                            <div className="aspect-video w-full max-h-48">
                              <iframe
                                src={checkoutConfig.bannerVideoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                title="Vídeo do Checkout"
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          ) : (
                            <video
                              src={checkoutConfig.bannerVideoUrl}
                              controls
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-full max-h-44 object-contain bg-slate-950"
                            />
                          )}
                        </div>
                      ) : checkoutConfig.bannerUrl ? (
                        <div className="rounded-xl overflow-hidden border border-slate-800 shadow bg-slate-950 flex items-center justify-center">
                          <img
                            src={checkoutConfig.bannerUrl}
                            alt="Banner"
                            className={`w-full ${
                              checkoutConfig.bannerEnquadramento === 'cover'
                                ? 'h-28 object-cover'
                                : 'max-h-44 object-contain'
                            } rounded-xl`}
                            onError={e => (e.currentTarget.style.display = 'none')}
                          />
                        </div>
                      ) : null}

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
