import React, { useState, useEffect } from 'react';
import { CheckoutConfig, CheckoutSalvo, DEFAULT_CHECKOUT_CONFIG } from '../../types';
import {
  CreditCard, QrCode, FileText, ShieldCheck, CheckCircle2,
  Trash2, Edit3, Plus, Save, Sparkles, Copy, RefreshCw, Smartphone,
  Monitor, AlertTriangle, ArrowLeft, Lock, Check
} from 'lucide-react';

interface Props {
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const CheckoutBuilderView: React.FC<Props> = ({ authFetch }) => {
  const [checkoutsSalvos, setCheckoutsSalvos] = useState<CheckoutSalvo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Form State
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeCheckout, setNomeCheckout] = useState('Novo Checkout Personalizado');
  const [checkoutConfig, setCheckoutConfig] = useState<CheckoutConfig>(DEFAULT_CHECKOUT_CONFIG);

  // Preview Mode Tab
  const [previewTab, setPreviewTab] = useState<'pix' | 'cartao' | 'boleto'>('pix');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');

  useEffect(() => {
    carregarCheckouts();
  }, []);

  const carregarCheckouts = async () => {
    setCarregando(true);
    try {
      const res = await authFetch('/api/admin/checkouts');
      if (res.ok) {
        const data = await res.json();
        setCheckoutsSalvos(data);
      }
    } catch (err) {
      console.error('Erro ao carregar checkouts:', err);
    } finally {
      setCarregando(false);
    }
  };

  const handleSalvar = async () => {
    if (!nomeCheckout.trim()) {
      setFeedbackMsg({ tipo: 'erro', texto: 'Informe um nome para o modelo de checkout.' });
      return;
    }

    if (!checkoutConfig.metodos.pix && !checkoutConfig.metodos.cartao && !checkoutConfig.metodos.boleto) {
      setFeedbackMsg({ tipo: 'erro', texto: 'Selecione ao menos uma forma de pagamento (Pix, Cartão ou Boleto).' });
      return;
    }

    setSalvando(true);
    setFeedbackMsg(null);
    try {
      const res = await authFetch('/api/admin/checkouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editandoId || undefined,
          nome: nomeCheckout.trim(),
          checkout: checkoutConfig
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Erro ao salvar checkout.');
      }

      setFeedbackMsg({ tipo: 'sucesso', texto: 'Modelo de checkout salvo com sucesso!' });
      await carregarCheckouts();
    } catch (err: any) {
      setFeedbackMsg({ tipo: 'erro', texto: err.message || 'Falha ao salvar o checkout.' });
    } finally {
      setSalvando(false);
    }
  };

  const handleEditar = (item: CheckoutSalvo) => {
    setEditandoId(item.id);
    setNomeCheckout(item.nome);
    setCheckoutConfig(item.checkout);
    setFeedbackMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNovoCheckout = () => {
    setEditandoId(null);
    setNomeCheckout('Novo Checkout Personalizado');
    setCheckoutConfig(DEFAULT_CHECKOUT_CONFIG);
    setFeedbackMsg(null);
  };

  const handleExcluir = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este modelo de checkout?')) return;
    try {
      const res = await authFetch(`/api/admin/checkouts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (editandoId === id) handleNovoCheckout();
        await carregarCheckouts();
      }
    } catch (err) {
      alert('Erro ao excluir checkout.');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl font-black text-white">Central de Checkouts Personalizáveis</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Crie, personalize e gerencie os modelos de checkout que serão utilizados nas suas campanhas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNovoCheckout}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 transition border border-slate-700"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            Novo Checkout
          </button>
          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-2 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {salvando ? 'Salvando...' : 'Salvar Checkout'}
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-bold ${
          feedbackMsg.tipo === 'sucesso'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {feedbackMsg.tipo === 'sucesso' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{feedbackMsg.texto}</span>
        </div>
      )}

      {/* Grid Principal: Formulário + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Coluna Esquerda: Editor de Configurações */}
        <div className="lg:col-span-7 space-y-6">

          {/* Nome do Checkout */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              1. Identificação do Modelo
            </h2>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Nome do Checkout *
              </label>
              <input
                type="text"
                value={nomeCheckout}
                onChange={e => setNomeCheckout(e.target.value)}
                placeholder="Ex: Checkout Oficial Pix + Cartão 12x"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Formas de Pagamento Aceitas */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              2. Formas de Pagamento Habilitadas
            </h2>

            <div className="space-y-3">
              {/* PIX */}
              <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                checkoutConfig.metodos.pix
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checkoutConfig.metodos.pix}
                    onChange={e => setCheckoutConfig(prev => ({
                      ...prev,
                      metodos: { ...prev.metodos, pix: e.target.checked }
                    }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
                  />
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold block">Pix Transparente</span>
                      <span className="text-[11px] text-slate-400">Aprovação imediata com QR Code e Copia e Cola</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                  Recomendado
                </span>
              </label>

              {/* CARTÃO DE CRÉDITO */}
              <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                checkoutConfig.metodos.cartao
                  ? 'bg-blue-500/10 border-blue-500/40 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checkoutConfig.metodos.cartao}
                    onChange={e => setCheckoutConfig(prev => ({
                      ...prev,
                      metodos: { ...prev.metodos, cartao: e.target.checked }
                    }))}
                    className="w-4 h-4 rounded text-blue-500 bg-slate-900 border-slate-700"
                  />
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                    <div>
                      <span className="text-xs font-bold block">Cartão de Crédito (até 12x)</span>
                      <span className="text-[11px] text-slate-400">Tokenização segura direto no navegador via Mercado Pago</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
                  Alta Conversão
                </span>
              </label>

              {/* BOLETO BANCÁRIO */}
              <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                checkoutConfig.metodos.boleto
                  ? 'bg-amber-500/10 border-amber-500/40 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checkoutConfig.metodos.boleto}
                    onChange={e => setCheckoutConfig(prev => ({
                      ...prev,
                      metodos: { ...prev.metodos, boleto: e.target.checked }
                    }))}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
                  />
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-400" />
                    <div>
                      <span className="text-xs font-bold block">Boleto Bancário</span>
                      <span className="text-[11px] text-slate-400">Emissão de boleto com código de barras e linha digitável</span>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Configuração de Parcelamento do Cartão */}
          {checkoutConfig.metodos.cartao && (
            <div className="bg-slate-900 border border-blue-500/30 p-5 rounded-2xl space-y-4 animate-in fade-in-50">
              <h2 className="text-sm font-bold text-blue-400 flex items-center gap-2 uppercase tracking-wider">
                <CreditCard className="w-4 h-4" />
                3. Regras de Parcelamento no Cartão
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Máximo de Parcelas Habilitado
                  </label>
                  <select
                    value={checkoutConfig.parcelasMax}
                    onChange={e => setCheckoutConfig(prev => ({ ...prev, parcelasMax: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                      <option key={n} value={n}>
                        {n === 1 ? '1x (Apenas à Vista)' : `Até ${n}x parceladas`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Quem Absorve Taxa de Parcelamento
                  </label>
                  <select
                    value={checkoutConfig.taxaParcelamento}
                    onChange={e => setCheckoutConfig(prev => ({ ...prev, taxaParcelamento: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="comprador">Comprador (Sem juros para organizador)</option>
                    <option value="organizador">Organizador (Oferecer Sem Juros)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Textos & Mensagens Customizáveis */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-emerald-400" />
              4. Textos e Mensagens do Checkout
            </h2>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Título Superior do Checkout
                </label>
                <input
                  type="text"
                  value={checkoutConfig.mensagens?.topo || ''}
                  onChange={e => setCheckoutConfig(prev => ({
                    ...prev,
                    mensagens: { ...prev.mensagens, topo: e.target.value }
                  }))}
                  placeholder="Selecione a forma de pagamento:"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Texto Explicativo Pix
                </label>
                <input
                  type="text"
                  value={checkoutConfig.mensagens?.pix || ''}
                  onChange={e => setCheckoutConfig(prev => ({
                    ...prev,
                    mensagens: { ...prev.mensagens, pix: e.target.value }
                  }))}
                  placeholder="Aprovação imediata via Pix com QR Code e Copia e Cola."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Texto Explicativo Cartão
                </label>
                <input
                  type="text"
                  value={checkoutConfig.mensagens?.cartao || ''}
                  onChange={e => setCheckoutConfig(prev => ({
                    ...prev,
                    mensagens: { ...prev.mensagens, cartao: e.target.value }
                  }))}
                  placeholder="Pagamento rápido e seguro processado no cartão de crédito."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Alerta de Reserva / Urgência
                </label>
                <input
                  type="text"
                  value={checkoutConfig.mensagens?.urgencia || ''}
                  onChange={e => setCheckoutConfig(prev => ({
                    ...prev,
                    mensagens: { ...prev.mensagens, urgencia: e.target.value }
                  }))}
                  placeholder="Seus números estão reservados por tempo limitado. Conclua o pagamento!"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Selos de Segurança */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              5. Selos e Gatilhos de Confiança
            </h2>

            <label className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Exibir Selos de Segurança e Criptografia SSL</span>
                  <span className="text-[11px] text-slate-400">Mostra ícones de garantia, SSL 256-bit e aprovação instantânea</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={checkoutConfig.selosSeguranca}
                onChange={e => setCheckoutConfig(prev => ({ ...prev, selosSeguranca: e.target.checked }))}
                className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
              />
            </label>
          </div>

          {/* Lista de Checkouts Salvos */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <Copy className="w-4 h-4 text-emerald-400" />
              Modelos de Checkout Criados ({checkoutsSalvos.length})
            </h2>

            {carregando ? (
              <div className="text-center py-6 text-xs text-slate-500">Carregando seus checkouts...</div>
            ) : checkoutsSalvos.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl">
                <p className="text-xs text-slate-400">Você ainda não criou checkouts personalizados.</p>
                <p className="text-[11px] text-slate-500 mt-1">Configure os dados acima e clique em "Salvar Checkout".</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {checkoutsSalvos.map(item => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                      editandoId === item.id
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">{item.nome}</span>
                      <div className="flex items-center gap-2 mt-1">
                        {item.checkout.metodos.pix && <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">PIX</span>}
                        {item.checkout.metodos.cartao && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono">Cartão {item.checkout.parcelasMax}x</span>}
                        {item.checkout.metodos.boleto && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">Boleto</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditar(item)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleExcluir(item.id)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                        title="Excluir Checkout"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Coluna Direita: LIVE PREVIEW DO CHECKOUT */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                <Monitor className="w-4 h-4 text-emerald-400" />
                Live Preview do Checkout
              </span>

              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-lg text-xs transition ${previewDevice === 'mobile' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                  title="Visão Mobile"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-lg text-xs transition ${previewDevice === 'desktop' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                  title="Visão Desktop"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Container da Simulação */}
            <div className={`mx-auto bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl transition-all ${
              previewDevice === 'mobile' ? 'max-w-xs' : 'w-full'
            }`}>

              {/* Simulação de Header do Modal */}
              <div className="border-b border-slate-800 pb-3 mb-3 text-center">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Reserva de Cotas</span>
                <h3 className="text-sm font-black text-white mt-0.5">iPhone 16 Pro Max 256GB</h3>
                <p className="text-xs text-slate-400 mt-1">10 cotas selecionadas • <strong className="text-emerald-400">R$ 5,00</strong></p>
              </div>

              {/* Alerta de Urgência */}
              {checkoutConfig.mensagens?.urgencia && (
                <div className="p-2.5 mb-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 font-medium flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span>{checkoutConfig.mensagens.urgencia}</span>
                </div>
              )}

              {/* Botões de Seleção de Pagamento */}
              <div className="mb-3 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {checkoutConfig.mensagens?.topo || 'Selecione a forma de pagamento:'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {checkoutConfig.metodos.pix && (
                    <button
                      type="button"
                      onClick={() => setPreviewTab('pix')}
                      className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition ${
                        previewTab === 'pix' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Pix</span>
                    </button>
                  )}
                  {checkoutConfig.metodos.cartao && (
                    <button
                      type="button"
                      onClick={() => setPreviewTab('cartao')}
                      className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition ${
                        previewTab === 'cartao' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Cartão</span>
                    </button>
                  )}
                  {checkoutConfig.metodos.boleto && (
                    <button
                      type="button"
                      onClick={() => setPreviewTab('boleto')}
                      className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition ${
                        previewTab === 'boleto' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Boleto</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Corpo da Tela de Acordo com Aba Selecionada */}
              {previewTab === 'pix' && (
                <div className="space-y-2 text-center p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <p className="text-[11px] text-slate-300 leading-tight">
                    {checkoutConfig.mensagens?.pix || 'Aprovação imediata via Pix com QR Code e Copia e Cola.'}
                  </p>
                  <div className="w-24 h-24 bg-white p-1.5 rounded-lg mx-auto flex items-center justify-center">
                    <QrCode className="w-20 h-20 text-slate-950" />
                  </div>
                  <button className="w-full py-2 bg-emerald-500 text-slate-950 font-black text-xs rounded-lg shadow-md">
                    COPIAR CÓDIGO PIX (R$ 5,00)
                  </button>
                </div>
              )}

              {previewTab === 'cartao' && (
                <div className="space-y-2 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <p className="text-[11px] text-slate-300 leading-tight mb-2">
                    {checkoutConfig.mensagens?.cartao || 'Pagamento rápido e seguro processado no cartão de crédito.'}
                  </p>
                  <div className="space-y-2 text-[11px]">
                    <div className="bg-slate-950 border border-slate-700 p-2 rounded-lg text-slate-400">
                      0000 0000 0000 0000
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-950 border border-slate-700 p-2 rounded-lg text-slate-400">MM/AA</div>
                      <div className="bg-slate-950 border border-slate-700 p-2 rounded-lg text-slate-400">CVV</div>
                    </div>
                    <div className="bg-slate-950 border border-slate-700 p-2 rounded-lg text-slate-200 font-bold">
                      Parcelas: até {checkoutConfig.parcelasMax}x de R$ {(5 / checkoutConfig.parcelasMax).toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                  <button className="w-full py-2 bg-blue-500 text-white font-black text-xs rounded-lg shadow-md mt-2">
                    PAGAR NO CARTÃO (R$ 5,00)
                  </button>
                </div>
              )}

              {previewTab === 'boleto' && (
                <div className="space-y-2 text-center p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <p className="text-[11px] text-slate-300 leading-tight">
                    Emissão de boleto bancário com vencimento em até 3 dias.
                  </p>
                  <button className="w-full py-2 bg-amber-500 text-slate-950 font-black text-xs rounded-lg shadow-md">
                    GERAR BOLETO BANCÁRIO
                  </button>
                </div>
              )}

              {/* Selos de Segurança no Preview */}
              {checkoutConfig.selosSeguranca && (
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-center gap-3 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-400" /> SSL 256-bit</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-emerald-400" /> Compra Segura</span>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
