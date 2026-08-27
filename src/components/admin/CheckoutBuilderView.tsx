import React, { useState, useEffect } from 'react';
import { CheckoutConfig, CheckoutSalvo, DEFAULT_CHECKOUT_CONFIG, ConfirmacaoCompraConfig } from '../../types';
import {
  CreditCard, QrCode, FileText, ShieldCheck, CheckCircle2,
  Trash2, Edit3, Plus, Save, RefreshCw, Smartphone,
  Monitor, AlertTriangle, Clock, Zap, MessageSquare,
  Palette, Type, X, PartyPopper, Users, Sparkles, Copy,
  Share2, Ticket, MessageCircle, ExternalLink, HelpCircle
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
  mensagemEscassez?: string;
  selosExtras?: string[];
  confirmacao?: ConfirmacaoCompraConfig;
  exigirCpf?: boolean;
  exigirEmail?: boolean;
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
  { value: 'Inter', label: 'Inter (Padrão)' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Outfit', label: 'Outfit' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Poppins', label: 'Poppins' },
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
  mensagemEscassez: '',
  selosExtras: ['ssl', 'aprovacao'],
  confirmacao: {
    titulo: 'Pagamento Confirmado! 🎉',
    subtitulo: 'Seus números já estão salvos e vinculados ao seu WhatsApp!',
    mensagemAgradecimento: 'Obrigado por participar! Boa sorte no sorteio.',
    bannerSucessoUrl: '',
    exibirConfetes: true,
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
    if (!confirm('Excluir este checkout?')) return;
    try {
      const res = await authFetch(`/api/admin/checkouts/${id}`, { method: 'DELETE' });
      if (res.ok) { if (editandoId === id) { setFormAberto(false); setEditandoId(null); } await carregarCheckouts(); }
    } catch { alert('Erro ao excluir.'); }
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
          <button onClick={handleNovo} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-600/20 active:scale-95">
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
            <button onClick={handleNovo} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl inline-flex items-center gap-2 transition">
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
                    {cfg.confirmacao?.botaoGrupoVipAtivo && <span className="px-2 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold rounded-lg flex items-center gap-1"><Users className="w-3 h-3" /> Grupo VIP</span>}
                  </div>
                  {selosBadges.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selosBadges.slice(0, 3).map(s => <span key={s.id} className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">{s.icon} {s.label}</span>)}
                      {selosBadges.length > 3 && <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md">+{selosBadges.length - 3}</span>}
                    </div>
                  )}
                  <div className="flex gap-2 mt-auto">
                    <button onClick={() => handleEditar(item)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-black rounded-xl flex items-center justify-center gap-1.5 transition border border-slate-700">
                      <Edit3 className="w-3.5 h-3.5 text-indigo-400" /> Editar
                    </button>
                    <button onClick={() => handleExcluir(item.id)} className="py-2.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl flex items-center justify-center transition border border-red-500/20">
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
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-7 space-y-5">

            {/* Voltar + Nome */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <button onClick={() => { setFormAberto(false); setEditandoId(null); setFeedbackMsg(null); }} className="text-xs text-slate-400 hover:text-white transition">
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

            {/* 1. Visual */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4 text-pink-400" /> 1. Identidade Visual do Checkout
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Cor Primária (Botões)', key: 'corPrimaria', def: '#10b981' },
                  { label: 'Cor de Fundo', key: 'corFundo', def: '#020617' },
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
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  <Type className="w-3 h-3 inline mr-1" />Tipografia
                </label>
                <select value={checkoutConfig.fonteFamilia || 'Inter'} onChange={e => upd({ fonteFamilia: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none">
                  {FONTES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Banner de Topo no Checkout (URL — opcional)</label>
                <input type="url" value={checkoutConfig.bannerUrl || ''} onChange={e => upd({ bannerUrl: e.target.value })} placeholder="https://..." className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
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
                <label className="flex items-center gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-950 transition-colors">
                  <input
                    type="checkbox"
                    checked={checkoutConfig.exibirCupom !== false}
                    onChange={e => upd({ exibirCupom: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <span className="text-xs text-slate-200 font-medium">Exibir campo de cupom de desconto no checkout</span>
                </label>
              </div>
            </div>
            {/* 5. Temporizador */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> 5. Temporizador de Urgência
              </h2>
              <label className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-white">Ativar Contador Regressivo</p>
                  <p className="text-[11px] text-slate-400">Exibe "Reserva expira em..." no checkout</p>
                </div>
                <div onClick={() => upd({ temporizadorAtivo: !checkoutConfig.temporizadorAtivo })} className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${checkoutConfig.temporizadorAtivo ? 'bg-amber-500' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checkoutConfig.temporizadorAtivo ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
              </label>
              {checkoutConfig.temporizadorAtivo && (
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Duração (minutos)</label>
                  <select value={checkoutConfig.temporizadorMinutos || 10} onChange={e => upd({ temporizadorMinutos: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                    {[5,10,15,20,30].map(m => <option key={m} value={m}>{m} minutos</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* 5. Selos */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> 5. Selos de Segurança
              </h2>
              <label className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-white">Exibir Selos de Confiança</p>
                  <p className="text-[11px] text-slate-400">Badges que aumentam a conversão</p>
                </div>
                <div onClick={() => upd({ selosSeguranca: !checkoutConfig.selosSeguranca })} className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${checkoutConfig.selosSeguranca ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checkoutConfig.selosSeguranca ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
              </label>
              {checkoutConfig.selosSeguranca && (
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
              )}
            </div>

            {/* 6. NOVA SEÇÃO: Tela de Confirmação de Compra (Sucesso & Pós-Venda) */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <PartyPopper className="w-4 h-4 text-emerald-400" /> 6. Tela de Compra Concluída (Pós-Pagamento)
                </h2>
                <button
                  type="button"
                  onClick={() => setPreviewScreen('sucesso')}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition"
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

              {/* Toggles da Tela de Sucesso */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer">
                  <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> Disparar Animação de Confetes
                  </span>
                  <input
                    type="checkbox"
                    checked={conf.exibirConfetes !== false}
                    onChange={e => updConfirmacao({ exibirConfetes: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500"
                  />
                </label>

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

            {/* Conversão & Retenção */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
              <h4 className="text-sm font-black text-white flex items-center gap-2">🔔 Conversão & Retenção</h4>

              {/* Notificações Sociais */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-slate-200">Notificações sociais (toast "fulano comprou")</span>
                  <input
                    type="checkbox"
                    checked={!!checkoutConfig.notificacoesSociais?.ativo}
                    onChange={e => upd({ notificacoesSociais: { ...checkoutConfig.notificacoesSociais, ativo: e.target.checked } })}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 w-4 h-4"
                  />
                </label>
                {checkoutConfig.notificacoesSociais?.ativo && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Posição</label>
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
                      <label className="text-[10px] text-slate-400 block mb-1">Intervalo (seg)</label>
                      <input
                        type="number" min={4}
                        value={checkoutConfig.notificacoesSociais?.intervalo || 12}
                        onChange={e => upd({ notificacoesSociais: { ...checkoutConfig.notificacoesSociais, ativo: true, intervalo: Number(e.target.value) } })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                      />
                    </div>
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
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 w-4 h-4"
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
              <button onClick={handleSalvar} disabled={salvando} className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black rounded-xl flex items-center justify-center gap-2 transition shadow-lg disabled:opacity-60 active:scale-[0.98]">
                <Save className="w-5 h-5" />
                {salvando ? 'Salvando...' : editandoId ? 'Atualizar Checkout' : 'Salvar Checkout'}
              </button>
              <button onClick={() => { setFormAberto(false); setEditandoId(null); }} className="py-3.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition border border-slate-700">
                Cancelar
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="xl:col-span-5 space-y-4">
            <div className="sticky top-6 space-y-4">
              <div className="flex flex-col gap-2 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
                {/* Switcher entre Checkout e Tela de Sucesso */}
                <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl">
                  <button
                    onClick={() => setPreviewScreen('checkout')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${previewScreen === 'checkout' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Checkout
                  </button>
                  <button
                    onClick={() => setPreviewScreen('sucesso')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${previewScreen === 'sucesso' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <PartyPopper className="w-3.5 h-3.5" /> 🎉 Compra Concluída
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl">
                    {(['mobile', 'desktop'] as const).map(d => (
                      <button key={d} onClick={() => setPreviewDevice(d)} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${previewDevice === d ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                        {d === 'mobile' ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                        {d === 'mobile' ? 'Mobile' : 'Desktop'}
                      </button>
                    ))}
                  </div>

                  {previewScreen === 'checkout' && (
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl">
                      {checkoutConfig.metodos.pix !== false && <button onClick={() => setPreviewTab('pix')} className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${previewTab === 'pix' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>Pix</button>}
                      {checkoutConfig.metodos.cartao && <button onClick={() => setPreviewTab('cartao')} className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${previewTab === 'cartao' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Cartão</button>}
                      {checkoutConfig.metodos.boleto && <button onClick={() => setPreviewTab('boleto')} className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${previewTab === 'boleto' ? 'bg-amber-600 text-white' : 'text-slate-500'}`}>Boleto</button>}
                    </div>
                  )}
                </div>
              </div>

              {/* Card de Preview */}
              <div className={`${previewDevice === 'mobile' ? 'max-w-[360px] mx-auto' : 'w-full'} rounded-2xl border border-slate-700 overflow-hidden shadow-2xl transition-all`} style={{ fontFamily: checkoutConfig.fonteFamilia || 'Inter', backgroundColor: bgColor }}>
                
                {previewScreen === 'checkout' ? (
                  /* Preview do Formulário de Checkout */
                  <>
                    <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: `${primary}30` }}>
                      <h3 className="text-sm font-black text-white">Finalizar Compra</h3>
                      <div className="w-7 h-7 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 text-xs">✕</div>
                    </div>
                    <div className="p-4 space-y-3 max-h-[520px] overflow-y-auto">
                      {checkoutConfig.bannerUrl && <img src={checkoutConfig.bannerUrl} alt="banner" className="w-full h-20 object-cover rounded-xl" onError={e => (e.currentTarget.style.display = 'none')} />}
                      {checkoutConfig.mensagens?.urgencia && (
                        <div className="p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse" style={{ backgroundColor: `${primary}15`, border: `1px solid ${primary}40`, color: primary }}>
                          <Zap className="w-3.5 h-3.5 shrink-0" />{checkoutConfig.mensagens.urgencia}
                        </div>
                      )}
                      {checkoutConfig.temporizadorAtivo && (
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                          <span className="text-[11px] text-amber-300 font-bold">⏱️ Reserva expira em</span>
                          <span className="text-sm font-black text-amber-400 font-mono">{String(checkoutConfig.temporizadorMinutos || 10).padStart(2,'0')}:00</span>
                        </div>
                      )}
                      {checkoutConfig.mensagemEscassez && (
                        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] font-bold text-red-400 text-center">{checkoutConfig.mensagemEscassez}</div>
                      )}
                      <div className="space-y-2">
                        {['Nome completo', 'WhatsApp', 'Data de Nascimento'].map(f => (
                          <div key={f} className="h-9 bg-slate-900/80 border border-slate-700/50 rounded-xl px-3 flex items-center text-xs text-slate-500">{f}</div>
                        ))}
                      </div>
                      <button className="w-full py-3.5 rounded-xl text-sm font-black text-slate-950 shadow-lg transition" style={{ backgroundColor: primary, boxShadow: `0 8px 20px ${primary}40` }}>
                        {checkoutConfig.textoBotao || 'Garantir Minha Cota Agora'} →
                      </button>
                      {checkoutConfig.selosSeguranca && (checkoutConfig.selosExtras || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 justify-center pt-1">
                          {SELOS_DISPONIVEIS.filter(s => (checkoutConfig.selosExtras || []).includes(s.id)).map(s => (
                            <span key={s.id} className="text-[9px] text-slate-500 flex items-center gap-1 bg-slate-900/60 border border-slate-800 px-2 py-1 rounded-lg">{s.icon} {s.label}</span>
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
                    <div className="p-4 space-y-3 max-h-[520px] overflow-y-auto text-center">
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
                              <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
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
    </div>
  );
};
