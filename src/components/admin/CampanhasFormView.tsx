import React, { useState } from 'react';
import { 
  Save, Sparkles, Plus, Trash2, Trophy, Gift, Zap, Image, 
  Youtube, FileText, CheckCircle2, AlertCircle, ArrowLeft,
  LayoutGrid, HelpCircle, Flame, Lock, Eye, Star, Info
} from 'lucide-react';
import { Campanha, Premio, CotaPremiada, Promocao, OfertaRelampago } from '../../types';

interface Props {
  form: Partial<Campanha>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Campanha>>>;
  onSalvar: (e: React.FormEvent) => void;
  salvando: boolean;
  erro: string;
  onCancelar: () => void;
  onAbrirIA: () => void;
  iaAviso: string;
}

export const CampanhasFormView: React.FC<Props> = ({
  form,
  setForm,
  onSalvar,
  salvando,
  erro,
  onCancelar,
  onAbrirIA,
  iaAviso
}) => {
  const [novaFotoUrl, setNovaFotoUrl] = useState('');
  const [abaInterna, setAbaInterna] = useState<'basico' | 'midia' | 'premios' | 'promocoes' | 'upsell' | 'extras'>('basico');

  const selosPredefinidos = [
    '🔥 Corre que essa vai rápido!',
    '⚡ Últimos Dias / Quase Esgotando',
    '💎 Prêmio Exclusivo e Raro',
    '🚀 Lançamento Oficial',
    '⭐ Destaque Especial da Semana',
    '🎁 Compre e Ganhe Bônus Instantâneo',
    '🏆 Sorteio Confirmado'
  ];

  // Adicionar foto ao carrossel
  const handleAdicionarFoto = () => {
    if (!novaFotoUrl.trim()) return;
    const fotos = form.fotosCarrossel || [];
    setForm(prev => ({ ...prev, fotosCarrossel: [...fotos, novaFotoUrl.trim()] }));
    setNovaFotoUrl('');
  };

  const handleRemoverFoto = (idx: number) => {
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

  // Cotas Premiadas
  const handleAddCotaPremiada = () => {
    const cps = form.cotasPremiadas || [];
    setForm(prev => ({
      ...prev,
      cotasPremiadas: [
        ...cps,
        { numero: '', premio: 'R$ 100 no Pix', status: 'disponivel', pedidoId: null }
      ]
    }));
  };

  const handleRemoveCotaPremiada = (idx: number) => {
    const cps = (form.cotasPremiadas || []).filter((_, i) => i !== idx);
    setForm(prev => ({ ...prev, cotasPremiadas: cps }));
  };

  // Promoções de Pacotes
  const handleAddPromo = () => {
    const promos = form.promocoes || [];
    setForm(prev => ({
      ...prev,
      promocoes: [...promos, { quantidade: 20, valor: 10.00, destaque: false }]
    }));
  };

  const handleRemovePromo = (idx: number) => {
    const promos = (form.promocoes || []).filter((_, i) => i !== idx);
    setForm(prev => ({ ...prev, promocoes: promos }));
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
          titulo: 'Oferta Especial Turbinada 🔥',
          subtitulo: 'Adicione mais cotas com super desconto exclusivo',
          cotasExtras: 25,
          preco: 8.50,
          selo: 'OFERTA ÚNICA'
        }
      ]
    }));
  };

  const handleRemoveOferta = (idx: number) => {
    const ofertas = (form.ofertasRelampago || []).filter((_, i) => i !== idx);
    setForm(prev => ({ ...prev, ofertasRelampago: ofertas }));
  };

  return (
    <div className="space-y-6">
      
      {/* Header do Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancelar}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {form.id ? 'Editar Campanha' : 'Criar Nova Campanha Completa'}
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Configure regulamento, fotos, cotas premiadas, promoções e IA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAbrirIA}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition"
            >
              <Sparkles className="w-4 h-4" />
              Assistente com IA (Gemini)
            </button>

            <button
              type="button"
              onClick={onSalvar}
              disabled={salvando}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition"
            >
              <Save className="w-4 h-4" />
              {salvando ? 'Salvando...' : 'Publicar Campanha'}
            </button>
          </div>
        </div>

        {iaAviso && (
          <div className="mt-4 p-3 bg-purple-950/50 border border-purple-500/30 rounded-xl text-xs text-purple-200 flex items-center gap-2">
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

        {/* Sub-abas de Navegação no Formulário */}
        <div className="flex flex-wrap gap-1.5 mt-5 pt-4 border-t border-slate-800">
          {[
            { id: 'basico', label: '1. Dados Básicos & Cotas' },
            { id: 'midia', label: '2. Banner, Carrossel & Vídeo' },
            { id: 'premios', label: '3. Prêmios & Cotas Premiadas' },
            { id: 'promocoes', label: '4. Promoções & Descontos' },
            { id: 'upsell', label: '5. Ofertas Relâmpago (Até 2)' },
            { id: 'extras', label: '6. E-book, Roleta & Extras' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAbaInterna(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                abaInterna === tab.id
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={onSalvar} className="space-y-6">
        
        {/* ABA 1: DADOS BÁSICOS */}
        {abaInterna === 'basico' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in">
            <h3 className="text-sm font-black text-white mb-2">Informações da Campanha</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Título da Rifa / Sorteio *
                </label>
                <input
                  type="text"
                  placeholder="Ex: iPhone 16 Pro Max 256GB Lacrado"
                  value={form.titulo || ''}
                  onChange={e => setForm(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Subtítulo / Chamada rápida
                </label>
                <input
                  type="text"
                  placeholder="Ex: Por apenas R$ 0,50! Entrega grátis para todo o Brasil."
                  value={form.subtitulo || ''}
                  onChange={e => setForm(prev => ({ ...prev, subtitulo: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Modelo e Valores */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Modelo de Escolha
                </label>
                <select
                  value={form.modelo || 'aleatorio'}
                  onChange={e => setForm(prev => ({ ...prev, modelo: e.target.value as any }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="aleatorio">Aleatório (Automático pelo sistema)</option>
                  <option value="manual">Manual (Cliente escolhe no grid)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Total de Cotas *
                </label>
                <select
                  value={form.totalCotas || 10000}
                  onChange={e => setForm(prev => ({ ...prev, totalCotas: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="100">100 cotas (00 a 99)</option>
                  <option value="500">500 cotas (000 a 499)</option>
                  <option value="1000">1.000 cotas (000 a 999)</option>
                  <option value="5000">5.000 cotas (0000 a 4999)</option>
                  <option value="10000">10.000 cotas (0000 a 9999)</option>
                  <option value="50000">50.000 cotas (00000 a 49999)</option>
                  <option value="100000">100.000 cotas (00000 a 99999)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Valor por Cota (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.valorCota || 0.50}
                  onChange={e => setForm(prev => ({ ...prev, valorCota: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Tempo Reserva Pix (Minutos)
                </label>
                <input
                  type="number"
                  min="3"
                  max="60"
                  value={form.tempoReservaMin || 10}
                  onChange={e => setForm(prev => ({ ...prev, tempoReservaMin: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Mínimo e Máximo por Compra */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Mínimo de Cotas por Pedido
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.minPorCompra || 5}
                  onChange={e => setForm(prev => ({ ...prev, minPorCompra: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Máximo de Cotas por Pedido
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.maxPorCompra || 1000}
                  onChange={e => setForm(prev => ({ ...prev, maxPorCompra: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Local do Sorteio
                </label>
                <select
                  value={form.localSorteio || 'Loteria Federal'}
                  onChange={e => setForm(prev => ({ ...prev, localSorteio: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Loteria Federal">Loteria Federal</option>
                  <option value="Deu no Poste">Deu no Poste</option>
                  <option value="Sorteio ao Vivo Instagram">Sorteio ao Vivo Instagram</option>
                  <option value="Sorteador Eletrônico">Sorteador Eletrônico Oficial</option>
                </select>
              </div>
            </div>

            {/* Selo / Flag de Exibição */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Selo de Destaque / Flag Promocional
              </label>
              <div className="flex gap-2">
                <select
                  value={selosPredefinidos.includes(form.selo || '') ? form.selo || '' : 'outro'}
                  onChange={e => {
                    if (e.target.value !== 'outro') {
                      setForm(prev => ({ ...prev, selo: e.target.value }));
                    }
                  }}
                  className="w-1/2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Nenhum selo</option>
                  {selosPredefinidos.map((s, idx) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                  <option value="outro">Personalizado...</option>
                </select>

                <input
                  type="text"
                  placeholder="Ou digite um selo customizado..."
                  value={form.selo || ''}
                  onChange={e => setForm(prev => ({ ...prev, selo: e.target.value }))}
                  className="w-1/2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Descrição / Regulamento */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Regulamento & Detalhes da Entrega
              </label>
              <textarea
                rows={4}
                value={form.descricao || ''}
                onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-sans focus:border-emerald-500 focus:outline-none leading-relaxed"
                placeholder="Regras do sorteio, prazos de envio e especificações do prêmio..."
              />
            </div>
          </div>
        )}

        {/* ABA 2: MÍDIA (BANNER, CARROSSEL E YOUTUBE) */}
        {abaInterna === 'midia' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-sm font-black text-white mb-1">Banner Principal</h3>
              <p className="text-xs text-slate-400 mb-3">
                URL da imagem principal de destaque (proporção 16:9 recomendada).
              </p>
              <input
                type="url"
                placeholder="https://exemplo.com/foto-premio.jpg"
                value={form.bannerUrl || ''}
                onChange={e => setForm(prev => ({ ...prev, bannerUrl: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
              {form.bannerUrl && (
                <div className="mt-3 w-full max-w-md aspect-[16/9] rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  <img src={form.bannerUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Carrossel de Fotos Adicionais */}
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-sm font-black text-white mb-1">Carrossel de Fotos Adicionais</h3>
              <p className="text-xs text-slate-400 mb-3">
                Adicione mais ângulos e detalhes do prêmio para aumentar a confiança do comprador.
              </p>

              <div className="flex gap-2 mb-3">
                <input
                  type="url"
                  placeholder="URL da foto adicional..."
                  value={novaFotoUrl}
                  onChange={e => setNovaFotoUrl(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAdicionarFoto}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl text-xs flex items-center gap-1 border border-slate-700"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </button>
              </div>

              {form.fotosCarrossel && form.fotosCarrossel.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {form.fotosCarrossel.map((foto, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-800 aspect-video bg-slate-950">
                      <img src={foto} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoverFoto(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vídeo do YouTube */}
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-sm font-black text-white mb-1 flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-500" />
                Vídeo de Demonstração (YouTube)
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Cole o link do YouTube do vídeo mostrando o produto/prêmio em detalhes.
              </p>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=XXXXX ou https://youtu.be/XXXXX"
                value={form.youtubeUrl || ''}
                onChange={e => setForm(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
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
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Prêmios Principais do Sorteio
                  </h3>
                  <p className="text-xs text-slate-400">1º, 2º, 3º lugar, etc.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPremio}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-xs flex items-center gap-1 border border-slate-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Prêmio
                </button>
              </div>

              <div className="space-y-2">
                {(form.premios || []).map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-black text-xs shrink-0">
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
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
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
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Gift className="w-4 h-4 text-emerald-400" />
                    Cotas Premiadas (Instantâneas no Pix)
                  </h3>
                  <p className="text-xs text-slate-400">
                    O comprador que comprar o número especificado ganha o prêmio na hora!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCotaPremiada}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl text-xs flex items-center gap-1 border border-slate-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nova Cota Premiada
                </button>
              </div>

              <div className="space-y-2">
                {(form.cotasPremiadas || []).map((cp, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                    <input
                      type="text"
                      placeholder="Número da Cota (ex: 0421)"
                      value={cp.numero}
                      onChange={e => {
                        const arr = [...(form.cotasPremiadas || [])];
                        arr[idx].numero = e.target.value;
                        setForm(prev => ({ ...prev, cotasPremiadas: arr }));
                      }}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-emerald-400 focus:outline-none"
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
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
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
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: PROMOÇÕES */}
        {abaInterna === 'promocoes' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white">Pacotes Promocionais de Cotas</h3>
                <p className="text-xs text-slate-400">
                  Descontos por volume para acelerar o fechamento das cotas.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddPromo}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl text-xs flex items-center gap-1 border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Pacote
              </button>
            </div>

            <div className="space-y-3">
              {(form.promocoes || []).map((promo, idx) => (
                <div key={idx} className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Quantidade de Cotas</label>
                    <input
                      type="number"
                      min="1"
                      value={promo.quantidade}
                      onChange={e => {
                        const arr = [...(form.promocoes || [])];
                        arr[idx].quantidade = Number(e.target.value);
                        setForm(prev => ({ ...prev, promocoes: arr }));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Valor do Pacote (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={promo.valor}
                      onChange={e => {
                        const arr = [...(form.promocoes || [])];
                        arr[idx].valor = Number(e.target.value);
                        setForm(prev => ({ ...prev, promocoes: arr }));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-3 sm:pt-0">
                    <input
                      type="checkbox"
                      id={`promo-destaque-${idx}`}
                      checked={promo.destaque}
                      onChange={e => {
                        const arr = [...(form.promocoes || [])];
                        arr[idx].destaque = e.target.checked;
                        setForm(prev => ({ ...prev, promocoes: arr }));
                      }}
                      className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
                    />
                    <label htmlFor={`promo-destaque-${idx}`} className="text-xs text-slate-300">
                      Selo "Mais Popular"
                    </label>
                  </div>

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => handleRemovePromo(idx)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 5: UPSELL / OFERTAS RELÂMPAGO */}
        {abaInterna === 'upsell' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Ofertas Relâmpago (Upsell no Checkout)
                </h3>
                <p className="text-xs text-slate-400">
                  Apresente até 2 ofertas irresistíveis antes do pagamento para aumentar o ticket médio.
                </p>
              </div>

              {(form.ofertasRelampago || []).length < 2 && (
                <button
                  type="button"
                  onClick={handleAddOferta}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-xs flex items-center gap-1 border border-slate-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Oferta ({(form.ofertasRelampago || []).length}/2)
                </button>
              )}
            </div>

            <div className="space-y-4">
              {(form.ofertasRelampago || []).map((of, idx) => (
                <div key={idx} className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                      Oferta #{idx + 1}
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
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
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
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
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
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
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
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-amber-400 focus:outline-none"
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
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
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
              <h3 className="text-sm font-black text-white flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-emerald-400" />
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
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />

                <input
                  type="url"
                  placeholder="Link de Download (Google Drive, Dropbox, PDF...)"
                  value={form.ebookUrl || ''}
                  onChange={e => setForm(prev => ({ ...prev, ebookUrl: e.target.value }))}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Roleta Premiada Bônus */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
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

            {/* Exigências de Cadastro */}
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-sm font-black text-white mb-2">Campos Obrigatórios no Checkout</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-cpf"
                    checked={form.exigirCpf || false}
                    onChange={e => setForm(prev => ({ ...prev, exigirCpf: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
                  />
                  <label htmlFor="chk-cpf" className="text-xs text-slate-300">
                    Exigir CPF do comprador para participar
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-email"
                    checked={form.exigirEmail || false}
                    onChange={e => setForm(prev => ({ ...prev, exigirEmail: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
                  />
                  <label htmlFor="chk-email" className="text-xs text-slate-300">
                    Exigir E-mail do comprador
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

      </form>
    </div>
  );
};
