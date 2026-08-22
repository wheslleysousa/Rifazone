import React, { useState, useEffect } from 'react';
import { Campanha, Premio, CotaPremiada, Promocao, OfertaRelampago, Pedido } from '../types';
import {
  Plus, Trash2, Edit3, Eye, Trophy, Gift, Zap, Settings,
  Users, CheckCircle2, AlertCircle, RefreshCw, Key, LogOut, ArrowRight, DollarSign, Calendar,
  Sparkles
} from 'lucide-react';

interface Props {
  onSelectCampanha: (codigo: string) => void;
}

export const AdminPanel: React.FC<Props> = ({ onSelectCampanha }) => {
  const [token, setToken] = useState<string>(() => localStorage.getItem('rifapix_admin_token') || '');
  const [email, setEmail] = useState<string>(() => localStorage.getItem('rifapix_admin_email') || 'wheslleyaviz@gmail.com');
  const [password, setPassword] = useState('admin');
  const [loginErro, setLoginErro] = useState('');
  const [carregandoLogin, setCarregandoLogin] = useState(false);

  // Painel State
  const [campanhas, setCampanhas] = useState<any[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<'lista' | 'nova' | 'pedidos' | 'apuracao'>('lista');
  const [carregando, setCarregando] = useState(false);
  const [campanhaSelecionada, setCampanhaSelecionada] = useState<any | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  // Form Campanha Nova/Edição
  const [form, setForm] = useState<Partial<Campanha>>({
    titulo: '',
    subtitulo: '',
    descricao: '<p>Participe do sorteio oficial! Pagamento instantâneo via Pix.</p>',
    bannerUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80',
    youtubeUrl: '',
    modelo: 'aleatorio',
    totalCotas: 10000,
    valorCota: 0.50,
    minPorCompra: 5,
    maxPorCompra: 1000,
    localSorteio: 'Loteria Federal',
    selo: 'Corre que essa vai rápido! 🔥',
    tempoReservaMin: 10,
    exibirRanking: true,
    exibirBarraProgresso: true,
    exibirPaginaGanhadores: true,
    exigirEmail: false,
    exigirCpf: false,
    status: 'publicada',
    premios: [{ posicao: 1, descricao: '1º Prêmio Principal' }],
    cotasPremiadas: [],
    promocoes: [
      { quantidade: 10, valor: 5.00, destaque: false },
      { quantidade: 30, valor: 14.00, destaque: false },
      { quantidade: 50, valor: 22.50, destaque: true },
      { quantidade: 100, valor: 40.00, destaque: false }
    ],
    ofertasRelampago: [
      {
        titulo: 'Oferta Turbinada 🔥',
        subtitulo: 'Adicione +20 cotas com 30% de desconto',
        cotasExtras: 20,
        preco: 7.00,
        selo: 'OFERTA LIMITADA'
      }
    ]
  });

  // Apuração State
  const [numeroSorteado, setNumeroSorteado] = useState('');
  const [resultadoApuracao, setResultadoApuracao] = useState<any | null>(null);
  const [apurando, setApurando] = useState(false);

  // Assistente de IA (Gemini) State
  const [iaAberto, setIaAberto] = useState(false);
  const [iaPremio, setIaPremio] = useState('');
  const [iaPublico, setIaPublico] = useState('');
  const [iaTom, setIaTom] = useState('animado e com urgência');
  const [iaGerando, setIaGerando] = useState(false);
  const [iaErro, setIaErro] = useState('');
  const [iaAviso, setIaAviso] = useState('');

  // Gerar conteúdo da campanha com IA e preencher o formulário
  const handleGerarComIA = async () => {
    if (!iaPremio.trim()) {
      setIaErro('Descreva o prêmio principal.');
      return;
    }
    setIaErro('');
    setIaAviso('');
    setIaGerando(true);

    try {
      const res = await fetch('/api/admin/ia/gerar-campanha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          premio: iaPremio,
          valorCota: form.valorCota,
          totalCotas: form.totalCotas,
          publico: iaPublico,
          tom: iaTom
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setIaErro(data.error || 'Erro ao gerar com IA.');
        return;
      }

      setForm(prev => ({
        ...prev,
        titulo: data.titulo || prev.titulo,
        subtitulo: data.subtitulo || prev.subtitulo,
        descricao: data.descricaoHtml || prev.descricao,
        selo: data.selo || prev.selo,
        premios: Array.isArray(data.premios) && data.premios.length > 0 ? data.premios : prev.premios,
        promocoes: Array.isArray(data.promocoes) && data.promocoes.length > 0 ? data.promocoes : prev.promocoes,
        ofertasRelampago: data.ofertaRelampago ? [data.ofertaRelampago] : prev.ofertasRelampago
      }));

      setIaAviso(
        data.isMock
          ? 'Conteúdo gerado em modo simulação (defina GEMINI_API_KEY para usar a IA real do Gemini).'
          : 'Conteúdo gerado com IA! Revise e ajuste antes de publicar.'
      );
      setIaAberto(false);
    } catch (err) {
      setIaErro('Falha de conexão ao gerar com IA.');
    } finally {
      setIaGerando(false);
    }
  };

  // Check login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErro('');
    setCarregandoLogin(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginErro(data.error || 'Credenciais inválidas.');
      } else {
        setToken(data.token);
        localStorage.setItem('rifapix_admin_token', data.token);
        localStorage.setItem('rifapix_admin_email', email);
      }
    } catch (err) {
      setLoginErro('Falha ao autenticar.');
    } finally {
      setCarregandoLogin(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('rifapix_admin_token');
  };

  // Carregar Campanhas
  const carregarCampanhas = async () => {
    if (!token) return;
    setCarregando(true);
    try {
      const res = await fetch('/api/admin/campanhas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      setCampanhas(data);
      if (data.length > 0 && !campanhaSelecionada) {
        setCampanhaSelecionada(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (token) {
      carregarCampanhas();
    }
  }, [token]);

  // Carregar Pedidos
  const carregarPedidos = async (campanhaId: string) => {
    try {
      const res = await fetch(`/api/admin/campanhas/${campanhaId}/pedidos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPedidos(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Salvar Campanha
  const handleSalvarCampanha = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = form.id ? `/api/admin/campanhas/${form.id}` : '/api/admin/campanhas';
      const method = form.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        await carregarCampanhas();
        setAbaAtiva('lista');
      } else {
        const d = await res.json();
        alert(d.error || 'Erro ao salvar campanha.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar.');
    }
  };

  // Apurar Sorteio
  const handleSortear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campanhaSelecionada || !numeroSorteado) return;
    setApurando(true);
    setResultadoApuracao(null);

    try {
      const res = await fetch(`/api/admin/campanhas/${campanhaSelecionada.id}/sortear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ numeroSorteado })
      });

      const data = await res.json();
      if (res.ok) {
        setResultadoApuracao(data);
        await carregarCampanhas();
      } else {
        alert(data.error || 'Erro ao sortear.');
      }
    } catch (e) {
      alert('Erro ao realizar apuração.');
    } finally {
      setApurando(false);
    }
  };

  // Limpar reservas
  const handleLimparReservas = async () => {
    try {
      const res = await fetch('/api/admin/limpar-reservas', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      alert(`Reservas expiradas limpas com sucesso! Cotas liberadas: ${data.cotasLiberadas}`);
      carregarCampanhas();
    } catch (e) {
      alert('Erro ao limpar reservas.');
    }
  };

  // TELA DE LOGIN ADMIN
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-white">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
              R
            </div>
            <div>
              <h1 className="text-xl font-black">Painel Administrativo</h1>
              <p className="text-xs text-slate-400">RifaPix & Gestão de Sorteios</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                E-mail de Administrador
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                required
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                E-mail configurado em ADMIN_EMAILS
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Senha de Acesso
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Senha"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                required
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                Padrão inicial: <code className="text-emerald-400 font-mono">admin</code> (ou altere no .env)
              </span>
            </div>

            {loginErro && (
              <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {loginErro}
              </p>
            )}

            <button
              id="btn-entrar-admin"
              type="submit"
              disabled={carregandoLogin}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-emerald-500/20"
            >
              {carregandoLogin ? 'Autenticando...' : 'Entrar no Painel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-base">
            R
          </div>
          <div>
            <h2 className="text-base font-black text-white leading-none">
              Painel Admin RifaPix
            </h2>
            <span className="text-[11px] text-emerald-400 font-mono">
              {email}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLimparReservas}
            title="Limpar cotas com reserva expirada no banco"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            Limpar Reservas
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg border border-red-500/30 flex items-center gap-1 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </header>

      {/* Tabs Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-6 flex items-center gap-4 overflow-x-auto">
        <button
          onClick={() => setAbaAtiva('lista')}
          className={`py-3 text-xs font-bold border-b-2 transition ${
            abaAtiva === 'lista'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Minhas Campanhas ({campanhas.length})
        </button>

        <button
          onClick={() => {
            setForm({
              titulo: '',
              subtitulo: '',
              descricao: '<p>Participe do sorteio oficial! Pagamento instantâneo via Pix.</p>',
              bannerUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80',
              modelo: 'aleatorio',
              totalCotas: 10000,
              valorCota: 0.50,
              minPorCompra: 5,
              maxPorCompra: 1000,
              localSorteio: 'Loteria Federal',
              selo: 'Corre que essa vai rápido! 🔥',
              tempoReservaMin: 10,
              exibirRanking: true,
              exibirBarraProgresso: true,
              exibirPaginaGanhadores: true,
              status: 'publicada',
              premios: [{ posicao: 1, descricao: '1º Prêmio Principal' }],
              cotasPremiadas: [],
              promocoes: [
                { quantidade: 10, valor: 5.00, destaque: false },
                { quantidade: 50, valor: 22.50, destaque: true }
              ],
              ofertasRelampago: []
            });
            setAbaAtiva('nova');
          }}
          className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1 transition ${
            abaAtiva === 'nova'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Nova Campanha
        </button>

        <button
          onClick={() => {
            if (campanhaSelecionada) carregarPedidos(campanhaSelecionada.id);
            setAbaAtiva('pedidos');
          }}
          className={`py-3 text-xs font-bold border-b-2 transition ${
            abaAtiva === 'pedidos'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Pedidos & Compradores
        </button>

        <button
          onClick={() => setAbaAtiva('apuracao')}
          className={`py-3 text-xs font-bold border-b-2 transition ${
            abaAtiva === 'apuracao'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Apuração / Sorteio
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 p-6 max-w-6xl w-full mx-auto">
        
        {/* ABA: LISTA DE CAMPANHAS */}
        {abaAtiva === 'lista' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white">Campanhas Ativas</h3>
                <p className="text-xs text-slate-400">Gerencie seus sorteios, visualize arrecadação e acesse as páginas públicas.</p>
              </div>
              <button
                onClick={() => setAbaAtiva('nova')}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-md shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                Criar Nova Campanha
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campanhas.map(c => (
                <div
                  key={c.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-1.5 ${
                          c.status === 'publicada' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {c.status}
                        </span>
                        <h4 className="text-base font-black text-white leading-snug">
                          {c.titulo}
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded">
                        /c/{c.codigo}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80 mb-4 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Arrecadado</span>
                        <span className="font-extrabold text-emerald-400">
                          R$ {c.estatisticas?.arrecadado?.toFixed(2)?.replace('.', ',') || '0,00'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Vendidas</span>
                        <span className="font-extrabold text-white">
                          {c.estatisticas?.vendidas || 0} / {c.totalCotas}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Progresso</span>
                        <span className="font-extrabold text-amber-400">
                          {c.estatisticas?.percentualVendido || 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => onSelectCampanha(c.codigo)}
                      className="flex-1 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver Página Pública
                    </button>

                    <button
                      onClick={() => {
                        setForm(c);
                        setAbaAtiva('nova');
                      }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setCampanhaSelecionada(c);
                        carregarPedidos(c.id);
                        setAbaAtiva('pedidos');
                      }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                      title="Ver Pedidos"
                    >
                      <Users className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: NOVA / EDITAR CAMPANHA */}
        {abaAtiva === 'nova' && (
          <form onSubmit={handleSalvarCampanha} className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div>
              <h3 className="text-xl font-black text-white">
                {form.id ? 'Editar Campanha' : 'Criar Nova Campanha de Sorteio'}
              </h3>
              <p className="text-xs text-slate-400">Configure todos os parâmetros da rifa e regras de premiação.</p>
            </div>

            {/* Assistente de IA (Gemini) */}
            <div className="rounded-2xl border border-violet-500/40 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-300 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white leading-none">Assistente de IA</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Gere título, subtítulo, regulamento e promoções automaticamente com o Gemini.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setIaAberto(v => !v); setIaErro(''); }}
                  className="px-3 py-1.5 bg-violet-500 hover:bg-violet-400 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-md shadow-violet-500/20 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {iaAberto ? 'Fechar' : 'Gerar com IA'}
                </button>
              </div>

              {iaAberto && (
                <div className="mt-4 space-y-3 border-t border-violet-500/20 pt-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Prêmio principal *</label>
                    <input
                      type="text"
                      value={iaPremio}
                      onChange={e => setIaPremio(e.target.value)}
                      placeholder="Ex: iPhone 16 Pro Max 256GB + R$ 2.000 no Pix"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Público-alvo (opcional)</label>
                      <input
                        type="text"
                        value={iaPublico}
                        onChange={e => setIaPublico(e.target.value)}
                        placeholder="Ex: jovens de 18 a 35 anos"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Tom de voz</label>
                      <input
                        type="text"
                        value={iaTom}
                        onChange={e => setIaTom(e.target.value)}
                        placeholder="Ex: animado e com urgência"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  {iaErro && (
                    <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {iaErro}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleGerarComIA}
                    disabled={iaGerando}
                    className="w-full py-2.5 bg-violet-500 hover:bg-violet-400 disabled:opacity-60 text-white font-black rounded-xl text-sm transition flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {iaGerando ? 'Gerando conteúdo...' : 'Gerar e preencher formulário'}
                  </button>
                  <p className="text-[11px] text-slate-500">
                    A IA preenche os campos abaixo. Você pode revisar e editar tudo antes de publicar.
                  </p>
                </div>
              )}

              {iaAviso && (
                <p className="mt-3 text-xs text-emerald-300 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {iaAviso}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Título da Campanha *</label>
                <input
                  type="text"
                  value={form.titulo || ''}
                  onChange={e => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: iPhone 16 Pro Max 256GB + R$ 2.000 no Pix"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Subtítulo / Chamada rápida</label>
                <input
                  type="text"
                  value={form.subtitulo || ''}
                  onChange={e => setForm({ ...form, subtitulo: e.target.value })}
                  placeholder="Ex: Sorteio pela Loteria Federal ou na venda de 100%"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Total de Cotas *</label>
                  <input
                    type="number"
                    value={form.totalCotas || 10000}
                    onChange={e => setForm({ ...form, totalCotas: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Valor por Cota (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.valorCota || 0.50}
                    onChange={e => setForm({ ...form, valorCota: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Tempo de Reserva (min)</label>
                  <input
                    type="number"
                    value={form.tempoReservaMin || 10}
                    onChange={e => setForm({ ...form, tempoReservaMin: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">URL da Imagem Banner</label>
                  <input
                    type="url"
                    value={form.bannerUrl || ''}
                    onChange={e => setForm({ ...form, bannerUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Local do Sorteio</label>
                  <input
                    type="text"
                    value={form.localSorteio || 'Loteria Federal'}
                    onChange={e => setForm({ ...form, localSorteio: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Regulamento / Descrição (HTML aceito)</label>
                <textarea
                  rows={4}
                  value={form.descricao || ''}
                  onChange={e => setForm({ ...form, descricao: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.exibirRanking}
                    onChange={e => setForm({ ...form, exibirRanking: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-500"
                  />
                  Exibir Ranking
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.exibirBarraProgresso}
                    onChange={e => setForm({ ...form, exibirBarraProgresso: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-500"
                  />
                  Exibir Progresso %
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.exigirCpf}
                    onChange={e => setForm({ ...form, exigirCpf: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-500"
                  />
                  Exigir CPF no Pix
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAbaAtiva('lista')}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/20"
              >
                Salvar e Publicar Campanha
              </button>
            </div>
          </form>
        )}

        {/* ABA: PEDIDOS & COMPRADORES */}
        {abaAtiva === 'pedidos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white">Pedidos e Compradores</h3>
                <p className="text-xs text-slate-400">Lista completa de transações Pix e números alocados.</p>
              </div>
              {campanhas.length > 0 && (
                <select
                  value={campanhaSelecionada?.id || ''}
                  onChange={e => {
                    const c = campanhas.find(item => item.id === e.target.value);
                    if (c) {
                      setCampanhaSelecionada(c);
                      carregarPedidos(c.id);
                    }
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {campanhas.map(c => (
                    <option key={c.id} value={c.id}>{c.titulo}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Comprador</th>
                    <th className="p-3.5">WhatsApp</th>
                    <th className="p-3.5">Cotas</th>
                    <th className="p-3.5">Total</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {pedidos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        Nenhum pedido registrado nesta campanha ainda.
                      </td>
                    </tr>
                  ) : (
                    pedidos.map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="p-3.5 font-bold text-white">{p.comprador?.nome}</td>
                        <td className="p-3.5 font-mono text-emerald-400">{p.comprador?.whatsapp}</td>
                        <td className="p-3.5 font-extrabold text-white">{p.quantidade} cotas</td>
                        <td className="p-3.5 font-bold text-emerald-400">R$ {p.valorTotal.toFixed(2).replace('.', ',')}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            p.status === 'pago' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400">
                          {new Date(p.criadoEm).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA: APURAÇÃO / SORTEIO */}
        {abaAtiva === 'apuracao' && (
          <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-3">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white">
                Apuração e Definição de Ganhador
              </h3>
              <p className="text-xs text-slate-400">
                Informe o número sorteado (ex: extraído da Loteria Federal). O sistema localizará automaticamente o comprador com a cota paga.
              </p>
            </div>

            <form onSubmit={handleSortear} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Selecione a Campanha
                </label>
                <select
                  value={campanhaSelecionada?.id || ''}
                  onChange={e => {
                    const c = campanhas.find(item => item.id === e.target.value);
                    if (c) setCampanhaSelecionada(c);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
                >
                  {campanhas.map(c => (
                    <option key={c.id} value={c.id}>{c.titulo} ({c.codigo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Número Sorteado Oficial
                </label>
                <input
                  type="text"
                  placeholder="Ex: 01234"
                  value={numeroSorteado}
                  onChange={e => setNumeroSorteado(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono font-black text-amber-400 focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={apurando}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-amber-500/20"
              >
                {apurando ? 'Apurando ganhador...' : 'APURAR RESULTADO AGORA'}
              </button>
            </form>

            {resultadoApuracao && (
              <div className="p-4 bg-slate-950 border border-amber-500/40 rounded-xl text-xs space-y-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Resultado da Apuração:
                </span>
                {resultadoApuracao.ganhador ? (
                  <div className="space-y-1 text-white">
                    <p>🎉 <strong>Ganhador(a):</strong> {resultadoApuracao.ganhador.nome}</p>
                    <p>📱 <strong>WhatsApp:</strong> {resultadoApuracao.ganhador.whatsapp}</p>
                    <p>🎟️ <strong>Cota Premiada:</strong> <span className="font-mono text-emerald-400 font-bold">{resultadoApuracao.ganhador.cota}</span></p>
                  </div>
                ) : (
                  <p className="text-slate-400">
                    O número informado ({numeroSorteado}) não foi vendido nesta campanha ou ainda estava vago.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
