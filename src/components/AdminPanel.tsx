import React, { useState, useEffect } from 'react';
import { Campanha, Pedido } from '../types';
import {
  LayoutDashboard, MessageSquare, LayoutGrid, Plus,
  Users, Ticket, RotateCw, Settings, LogOut, RefreshCw,
  Eye, Edit3, Link2, Copy, CheckCircle2, AlertCircle, Menu, X, Mail, Lock, User as UserIcon, Key
} from 'lucide-react';
import {
  auth, observarAuth, cadastrarComEmail, entrarComEmail, entrarComGoogle, sair,
  traduzErroAuth, type User
} from '../lib/firebase';

// Sub-components import
import { DashboardView } from './admin/DashboardView';
import { RemarketingView } from './admin/RemarketingView';
import { ClientesView } from './admin/ClientesView';
import { SorteadorView } from './admin/SorteadorView';
import { CampanhasFormView } from './admin/CampanhasFormView';

interface Props {
  onSelectCampanha: (codigo: string) => void;
}

export const AdminPanel: React.FC<Props> = ({ onSelectCampanha }) => {
  // Auth
  const [user, setUser] = useState<User | null>(null);
  const [authPronto, setAuthPronto] = useState(false);
  const [modoCadastro, setModoCadastro] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginErro, setLoginErro] = useState('');
  const [carregandoLogin, setCarregandoLogin] = useState(false);

  // Authenticated fetch with Firebase token
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const u = auth.currentUser;
    if (!u) throw new Error('Não autenticado');
    const idToken = await u.getIdToken();
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${idToken}`
      }
    });
  };

  // State
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [campanhaSelecionada, setCampanhaSelecionada] = useState<Campanha | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  // Aba ativa: dashboard | planos | remarketing | premiacoes | campanhas | nova | clientes | ranking | pedidos | sorteador | afiliados | configuracoes
  const [abaAtiva, setAbaAtiva] = useState<string>('dashboard');

  // Form Campanha
  const [form, setForm] = useState<Partial<Campanha>>({
    titulo: '',
    subtitulo: '',
    descricao: '<p>Participe do sorteio oficial! Pagamento instantâneo via Pix.</p>',
    bannerUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80',
    fotosCarrossel: [],
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
      { quantidade: 50, valor: 22.50, destaque: true }
    ],
    ofertasRelampago: []
  });
  const [salvandoCampanha, setSalvandoCampanha] = useState(false);
  const [formErro, setFormErro] = useState('');
  const [iaAviso, setIaAviso] = useState('');

  // Link compartilhável pós-salvar
  const [linkCampanha, setLinkCampanha] = useState<{ codigo: string; titulo: string } | null>(null);
  const [linkCopiado, setLinkCopiado] = useState(false);

  // Configurações Mercado Pago
  const [configPagamento, setConfigPagamento] = useState<any | null>(null);
  const [mpTokenInput, setMpTokenInput] = useState('');
  const [mpPublicKeyInput, setMpPublicKeyInput] = useState('');
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [configMsg, setConfigMsg] = useState('');
  const [configErro, setConfigErro] = useState('');

  // Observa Auth Firebase
  useEffect(() => {
    const unsub = observarAuth(u => {
      setUser(u);
      setAuthPronto(true);
    });
    return () => unsub();
  }, []);

  // Carregar dados iniciais
  const carregarTudo = async () => {
    if (!auth.currentUser) return;
    setCarregando(true);
    try {
      // 1) Campanhas
      const resCamp = await authFetch('/api/admin/campanhas');
      if (resCamp.ok) {
        const dataCamp = await resCamp.json();
        setCampanhas(dataCamp);
        if (dataCamp.length > 0 && !campanhaSelecionada) {
          setCampanhaSelecionada(dataCamp[0]);
        }
      }

      // 2) Pedidos gerais
      const resPed = await authFetch('/api/admin/pedidos');
      if (resPed.ok) {
        const dataPed = await resPed.json();
        setPedidos(dataPed);
      }

      // 3) Config Mercado Pago
      const resConf = await authFetch('/api/admin/configuracoes');
      if (resConf.ok) {
        const dataConf = await resConf.json();
        setConfigPagamento(dataConf);
        setMpPublicKeyInput(dataConf.mpPublicKey || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (user) {
      carregarTudo();
    }
  }, [user]);

  // Logout
  const handleLogout = async () => {
    try {
      await sair();
    } catch {}
    setCampanhas([]);
    setPedidos([]);
    setCampanhaSelecionada(null);
  };

  // Login
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErro('');
    setCarregandoLogin(true);
    try {
      if (modoCadastro) {
        await cadastrarComEmail(nome.trim(), email.trim(), password);
      } else {
        await entrarComEmail(email.trim(), password);
      }
    } catch (err: any) {
      setLoginErro(traduzErroAuth(err?.code || ''));
    } finally {
      setCarregandoLogin(false);
    }
  };

  const handleLoginGoogle = async () => {
    setLoginErro('');
    setCarregandoLogin(true);
    try {
      await entrarComGoogle();
    } catch (err: any) {
      setLoginErro(traduzErroAuth(err?.code || ''));
    } finally {
      setCarregandoLogin(false);
    }
  };

  // Salvar Campanha
  const handleSalvarCampanha = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErro('');
    setSalvandoCampanha(true);
    try {
      const url = form.id ? `/api/admin/campanhas/${form.id}` : '/api/admin/campanhas';
      const method = form.id ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const salva = await res.json();
      if (res.ok) {
        await carregarTudo();
        setLinkCampanha({ codigo: salva.codigo, titulo: salva.titulo });
        setLinkCopiado(false);
        setAbaAtiva('campanhas');
      } else {
        setFormErro(salva.error || 'Erro ao salvar campanha.');
      }
    } catch (err) {
      setFormErro('Falha de conexão ao salvar.');
    } finally {
      setSalvandoCampanha(false);
    }
  };

  // Gerar com IA
  const handleGerarComIA = async () => {
    const premio = prompt('Qual é o prêmio principal da sua rifa? (Ex: iPhone 16 Pro Max 256GB + R$ 2.000 no Pix)');
    if (!premio || !premio.trim()) return;

    setIaAviso('Gerando dados persuasivos com a inteligência artificial Gemini...');
    try {
      const res = await authFetch('/api/admin/ia/gerar-campanha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          premio: premio.trim(),
          valorCota: form.valorCota,
          totalCotas: form.totalCotas,
          tom: 'animado, profissional e com senso de urgência'
        })
      });

      const data = await res.json();
      if (res.ok) {
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
        setIaAviso('✨ Conteúdo gerado com IA! Revise e publique quando quiser.');
      } else {
        setIaAviso('');
        alert(data.error || 'Erro ao gerar com IA.');
      }
    } catch (err) {
      setIaAviso('');
      alert('Erro de conexão ao chamar assistente de IA.');
    }
  };

  // Apurar Sorteio
  const handleApurarCampanha = async (campanhaId: string, numeroSorteado: string) => {
    const res = await authFetch(`/api/admin/campanhas/${campanhaId}/sortear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numeroSorteado })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao sortear.');
    await carregarTudo();
    return data;
  };

  // Salvar Config Mercado Pago
  const handleSalvarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigMsg('');
    setConfigErro('');
    setSalvandoConfig(true);
    try {
      const body: any = { mpPublicKey: mpPublicKeyInput };
      if (mpTokenInput.trim()) body.mpAccessToken = mpTokenInput.trim();

      const res = await authFetch('/api/admin/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        setConfigErro(data.error || 'Erro ao salvar.');
      } else {
        setConfigPagamento(data);
        setMpTokenInput('');
        setConfigMsg('Credenciais salvas com sucesso! Seus pagamentos Pix estão 100% integrados.');
      }
    } catch (err) {
      setConfigErro('Falha de conexão ao salvar.');
    } finally {
      setSalvandoConfig(false);
    }
  };

  // Limpar reservas expiradas
  const handleLimparReservas = async () => {
    try {
      const res = await authFetch('/api/admin/limpar-reservas', { method: 'POST' });
      const data = await res.json();
      alert(`Reservas expiradas limpas com sucesso! Cotas liberadas: ${data.cotasLiberadas}`);
      carregarTudo();
    } catch {
      alert('Erro ao limpar reservas.');
    }
  };

  // Form Reset
  const handleNovaCampanha = () => {
    setForm({
      titulo: '',
      subtitulo: '',
      descricao: '<p>Participe do sorteio oficial! Pagamento instantâneo via Pix.</p>',
      bannerUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80',
      fotosCarrossel: [],
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
        { quantidade: 50, valor: 22.50, destaque: true }
      ],
      ofertasRelampago: []
    });
    setIaAviso('');
    setFormErro('');
    setAbaAtiva('nova');
  };

  if (!authPronto) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        <RefreshCw className="w-4 h-4 mr-2 animate-spin text-emerald-400" />
        Carregando painel...
      </div>
    );
  }

  // TELA DE CADASTRO / LOGIN
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
              R
            </div>
            <div>
              <h1 className="text-xl font-black">RifaZone</h1>
              <p className="text-xs text-slate-400">
                {modoCadastro ? 'Crie sua conta organizadora' : 'Painel de Gestão e Vendas'}
              </p>
            </div>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {modoCadastro && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Seu nome</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Como deseja ser chamado"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={modoCadastro ? 'Mínimo 6 caracteres' : 'Sua senha'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {loginErro && (
              <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {loginErro}
              </p>
            )}

            <button
              type="submit"
              disabled={carregandoLogin}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-emerald-500/20"
            >
              {carregandoLogin ? 'Aguarde...' : modoCadastro ? 'Criar conta de organizador' : 'Acessar Painel'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[11px] text-slate-500 uppercase tracking-wider">ou</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <button
            type="button"
            onClick={handleLoginGoogle}
            disabled={carregandoLogin}
            className="w-full py-2.5 bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-800 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 border border-slate-300"
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continuar com Google
          </button>

          <p className="text-center text-xs text-slate-400 mt-5">
            {modoCadastro ? 'Já possui conta?' : 'Ainda não tem conta?'}{' '}
            <button
              type="button"
              onClick={() => { setModoCadastro(v => !v); setLoginErro(''); }}
              className="text-emerald-400 font-bold hover:underline"
            >
              {modoCadastro ? 'Fazer login' : 'Cadastre-se grátis'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ITENS DO MENU LATERAL (ESTILO RIFA 365)
  const navSections = [
    {
      titulo: 'Principal',
      itens: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'remarketing', label: 'Remarketing', icon: <MessageSquare className="w-4 h-4" /> },
      ]
    },
    {
      titulo: 'Operação',
      itens: [
        { id: 'campanhas', label: 'Campanhas', icon: <LayoutGrid className="w-4 h-4" />, count: campanhas.length },
        { id: 'nova', label: 'Nova Campanha', icon: <Plus className="w-4 h-4" />, onClick: handleNovaCampanha },
        { id: 'clientes', label: 'Histórico de Clientes', icon: <Users className="w-4 h-4" /> },
        { id: 'pedidos', label: 'Pedidos & Transações', icon: <Ticket className="w-4 h-4" /> },
      ]
    },
    {
      titulo: 'Ferramentas & Ajustes',
      itens: [
        { id: 'sorteador', label: 'Sorteador Oficial', icon: <RotateCw className="w-4 h-4" /> },
        { id: 'configuracoes', label: 'Configurações (Pix)', icon: <Settings className="w-4 h-4" />, alerta: !configPagamento?.mpConfigurado },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 md:flex">
      
      {/* Overlay Mobile */}
      {menuAberto && (
        <div
          className="fixed inset-0 bg-black/70 z-30 md:hidden"
          onClick={() => setMenuAberto(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ${
          menuAberto ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-slate-950 text-base shadow-md shadow-emerald-500/20">
              R
            </div>
            <div>
              <h2 className="text-base font-black text-white leading-none">RifaZone</h2>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Painel Pro</span>
            </div>
          </div>
          <button
            onClick={() => setMenuAberto(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {navSections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-3 block">
                {sec.titulo}
              </span>
              {sec.itens.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    else setAbaAtiva(item.id);
                    setMenuAberto(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition ${
                    abaAtiva === item.id
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.count !== undefined && (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-mono">
                      {item.count}
                    </span>
                  )}
                  {item.alerta && (
                    <span className="w-2 h-2 rounded-full bg-amber-400" title="Configuração necessária" />
                  )}
                </button>
              ))}
            </div>
          ))}

          <button
            onClick={() => { handleLimparReservas(); setMenuAberto(false); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent transition"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span className="flex-1 text-left">Limpar Reservas</span>
          </button>
        </nav>

        {/* Rodapé Usuário */}
        <div className="border-t border-slate-800 p-3 shrink-0">
          <div className="px-2 py-1 mb-2">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Organizador</p>
            <p className="text-xs text-emerald-400 font-mono truncate">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl border border-red-500/30 transition"
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DE CONTEÚDO */}
      <div className="flex-1 min-w-0 flex flex-col">
        
        {/* Header Mobile */}
        <header className="md:hidden sticky top-0 z-20 bg-slate-900 border-b border-slate-800 h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuAberto(true)}
              className="text-slate-300 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-black text-white">RifaZone</span>
          </div>
        </header>

        {/* Container Principal */}
        <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto space-y-6">

          {/* 1. DASHBOARD */}
          {abaAtiva === 'dashboard' && (
            <DashboardView
              campanhas={campanhas}
              pedidos={pedidos}
              onNovaCampanha={handleNovaCampanha}
              onSelectCampanha={onSelectCampanha}
              mpConfigurado={!!configPagamento?.mpConfigurado}
              onIrParaConfig={() => setAbaAtiva('configuracoes')}
              onNavigateTab={(tab) => setAbaAtiva(tab)}
            />
          )}

          {/* 2. REMARKETING */}
          {abaAtiva === 'remarketing' && (
            <RemarketingView pedidos={pedidos} onRefresh={carregarTudo} />
          )}

          {/* 3. HISTÓRICO DE CLIENTES */}
          {abaAtiva === 'clientes' && <ClientesView pedidos={pedidos} />}

          {/* 4. SORTEADOR */}
          {abaAtiva === 'sorteador' && (
            <SorteadorView
              campanhas={campanhas}
              pedidos={pedidos}
              onApurarCampanha={handleApurarCampanha}
            />
          )}

          {/* 5. LISTA DE CAMPANHAS */}
          {abaAtiva === 'campanhas' && (
            <div className="space-y-6">
              
              {/* Banner pós criação */}
              {linkCampanha && (() => {
                const shareUrl = `${window.location.origin}/c/${linkCampanha.codigo}`;
                return (
                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 animate-in fade-in">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                          <Link2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white">
                            Link da rifa "{linkCampanha.titulo}" pronto!
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Compartilhe este link oficial para seus clientes comprarem as cotas:
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setLinkCampanha(null)}
                        className="text-slate-500 hover:text-slate-300 text-xs"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="mt-3 flex flex-col sm:flex-row items-stretch gap-2">
                      <code className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono break-all">
                        {shareUrl}
                      </code>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(shareUrl);
                            setLinkCopiado(true);
                            setTimeout(() => setLinkCopiado(false), 2000);
                          }}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 transition"
                        >
                          {linkCopiado ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {linkCopiado ? 'Copiado!' : 'Copiar Link'}
                        </button>
                        <button
                          onClick={() => onSelectCampanha(linkCampanha.codigo)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition border border-slate-700"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Abrir Rifa
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-emerald-400" />
                    Todas as Campanhas
                  </h1>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Visualize, edite ou acompanhe o status de arrecadação de todas as suas rifas.
                  </p>
                </div>

                <button
                  onClick={handleNovaCampanha}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition shadow-md shadow-emerald-500/20 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  Criar Nova Campanha
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campanhas.map(c => (
                  <div
                    key={c.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-1.5 ${
                            c.status === 'publicada'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300'
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

                      <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs">
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

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                      <button
                        onClick={() => onSelectCampanha(c.codigo)}
                        className="flex-1 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver Rifa Pública
                      </button>

                      <button
                        onClick={() => {
                          setForm(c);
                          setAbaAtiva('nova');
                        }}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                        title="Editar Campanha"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setCampanhaSelecionada(c);
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

          {/* 9. FORMULÁRIO DE NOVA / EDITAR CAMPANHA */}
          {abaAtiva === 'nova' && (
            <CampanhasFormView
              form={form}
              setForm={setForm}
              onSalvar={handleSalvarCampanha}
              salvando={salvandoCampanha}
              erro={formErro}
              onCancelar={() => setAbaAtiva('campanhas')}
              onAbrirIA={handleGerarComIA}
              iaAviso={iaAviso}
            />
          )}

          {/* 10. PEDIDOS & TRANSAÇÕES */}
          {abaAtiva === 'pedidos' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-emerald-400" />
                    Pedidos e Transações Pix ({pedidos.length})
                  </h1>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Histórico detalhado de reservas, pagamentos efetuados e bilhetes gerados.
                  </p>
                </div>

                <button
                  onClick={carregarTudo}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Atualizar
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto shadow-lg">
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
                          Nenhum pedido registrado ainda.
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

          {/* 11. CONFIGURAÇÕES (MERCADO PAGO) */}
          {abaAtiva === 'configuracoes' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-400" />
                  Configurações — Mercado Pago Pix
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Conecte suas credenciais do Mercado Pago para que todo o dinheiro do Pix caia direto na sua conta bancária sem comissão de terceiros.
                </p>
              </div>

              {/* Status do Mercado Pago */}
              <div className={`rounded-2xl border p-4 flex items-center gap-3 ${
                configPagamento?.mpConfigurado
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-amber-500/40 bg-amber-500/10'
              }`}>
                {configPagamento?.mpConfigurado ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-white">Mercado Pago Conectado ✅</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Token Ativo: {configPagamento.mpTokenMascara}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-white">Credenciais Pendentes</p>
                      <p className="text-[11px] text-slate-400">
                        Insira seu Access Token abaixo. Em modo de teste, a plataforma simula os pagamentos automaticamente.
                      </p>
                    </div>
                  </>
                )}
              </div>

              <form onSubmit={handleSalvarConfig} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Access Token do Mercado Pago *
                  </label>
                  <input
                    type="password"
                    value={mpTokenInput}
                    onChange={e => setMpTokenInput(e.target.value)}
                    placeholder={configPagamento?.mpConfigurado ? '•••••••••••• (deixe em branco para manter o token atual)' : 'APP_USR-... ou TEST-...'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                    autoComplete="off"
                  />
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Obtenha em <strong className="text-emerald-400">Mercado Pago Developers → Suas integrações → Credenciais</strong>.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Public Key (Opcional)
                  </label>
                  <input
                    type="text"
                    value={mpPublicKeyInput}
                    onChange={e => setMpPublicKeyInput(e.target.value)}
                    placeholder="APP_USR-xxxxxxxx ou TEST-xxxx"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                    autoComplete="off"
                  />
                </div>

                {configErro && (
                  <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {configErro}
                  </p>
                )}
                {configMsg && (
                  <p className="text-xs text-emerald-300 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {configMsg}
                  </p>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={salvandoConfig}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/20"
                  >
                    {salvandoConfig ? 'Salvando...' : 'Salvar Credenciais do Mercado Pago'}
                  </button>
                </div>
              </form>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-[11px] text-slate-400 space-y-1.5">
                <p className="text-slate-300 font-bold text-xs flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  Como Funciona o Pix Direto
                </p>
                <p>• O Access Token é armazenado criptografado no servidor e utilizado exclusivamente para gerar a cobrança Pix.</p>
                <p>• Quando o cliente paga no app do banco, o Mercado Pago envia a confirmação automática para o sistema e os bilhetes são ativados na hora.</p>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
};
