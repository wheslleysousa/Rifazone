import React, { useState, useEffect } from 'react';
import { Campanha, Premio, CotaPremiada, Promocao, OfertaRelampago, Pedido } from '../types';
import {
  Plus, Trash2, Edit3, Eye, Trophy, Gift, Zap, Settings,
  Users, CheckCircle2, AlertCircle, RefreshCw, Key, LogOut, ArrowRight, DollarSign, Calendar,
  Sparkles, Mail, Lock, User as UserIcon, Link2, Copy,
  Menu, X, LayoutGrid, Ticket
} from 'lucide-react';
import {
  auth, observarAuth, cadastrarComEmail, entrarComEmail, entrarComGoogle, sair,
  traduzErroAuth, type User
} from '../lib/firebase';

interface Props {
  onSelectCampanha: (codigo: string) => void;
}

export const AdminPanel: React.FC<Props> = ({ onSelectCampanha }) => {
  // --- Auth (Firebase) ---
  const [user, setUser] = useState<User | null>(null);
  const [authPronto, setAuthPronto] = useState(false);
  const [modoCadastro, setModoCadastro] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginErro, setLoginErro] = useState('');
  const [carregandoLogin, setCarregandoLogin] = useState(false);

  // Requisição autenticada com o ID Token do Firebase sempre atualizado
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

  // Painel State
  const [campanhas, setCampanhas] = useState<any[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<'lista' | 'nova' | 'pedidos' | 'apuracao' | 'pagamento' | 'personalizacao'>('lista');
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

  // Link compartilhável após criar/salvar campanha
  const [linkCampanha, setLinkCampanha] = useState<{ codigo: string; titulo: string } | null>(null);
  const [linkCopiado, setLinkCopiado] = useState(false);

  // Menu lateral (responsivo — drawer no mobile)
  const [menuAberto, setMenuAberto] = useState(false);

  // Reset do formulário de nova campanha (reaproveitado no menu e nos botões)
  const iniciarNovaCampanha = () => {
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
  };

  // Configurações de pagamento (Mercado Pago do organizador)
  const [configPagamento, setConfigPagamento] = useState<any | null>(null);
  const [mpTokenInput, setMpTokenInput] = useState('');
  const [mpPublicKeyInput, setMpPublicKeyInput] = useState('');
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [configMsg, setConfigMsg] = useState('');
  const [configErro, setConfigErro] = useState('');

  // Personalização (marca + redes sociais)
  const [marca, setMarca] = useState<{ nomeMarca: string; logoUrl: string; corPrincipal: string; corDestaque: string }>({
    nomeMarca: '', logoUrl: '', corPrincipal: '#10b981', corDestaque: '#f59e0b'
  });
  const [redes, setRedes] = useState<{ whatsapp: string; telegram: string; instagram: string; tiktok: string; youtube: string }>({
    whatsapp: '', telegram: '', instagram: '', tiktok: '', youtube: ''
  });
  const [salvandoMarca, setSalvandoMarca] = useState(false);
  const [marcaMsg, setMarcaMsg] = useState('');

  const carregarConfig = async () => {
    try {
      const res = await authFetch('/api/admin/configuracoes');
      if (res.ok) {
        const data = await res.json();
        setConfigPagamento(data);
        setMpPublicKeyInput(data.mpPublicKey || '');
        if (data.marca) {
          setMarca({
            nomeMarca: data.marca.nomeMarca || '',
            logoUrl: data.marca.logoUrl || '',
            corPrincipal: data.marca.corPrincipal || '#10b981',
            corDestaque: data.marca.corDestaque || '#f59e0b'
          });
        }
        if (data.redes) {
          setRedes({
            whatsapp: data.redes.whatsapp || '',
            telegram: data.redes.telegram || '',
            instagram: data.redes.instagram || '',
            tiktok: data.redes.tiktok || '',
            youtube: data.redes.youtube || ''
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSalvarMarca = async (e: React.FormEvent) => {
    e.preventDefault();
    setMarcaMsg('');
    setSalvandoMarca(true);
    try {
      const res = await authFetch('/api/admin/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marca, redes })
      });
      if (res.ok) {
        const data = await res.json();
        setConfigPagamento(data);
        setMarcaMsg('Personalização salva! Ela aparece na página pública das suas campanhas.');
      } else {
        const d = await res.json();
        setMarcaMsg(d.error || 'Erro ao salvar.');
      }
    } catch {
      setMarcaMsg('Falha de conexão ao salvar.');
    } finally {
      setSalvandoMarca(false);
    }
  };

  const handleSalvarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigMsg('');
    setConfigErro('');
    setSalvandoConfig(true);
    try {
      const body: any = { mpPublicKey: mpPublicKeyInput };
      // Só envia o token se o organizador digitou um novo (campo em branco = mantém o atual)
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
        setConfigMsg('Credenciais salvas! Os pagamentos das suas campanhas cairão na sua conta Mercado Pago.');
      }
    } catch (err) {
      setConfigErro('Falha de conexão ao salvar.');
    } finally {
      setSalvandoConfig(false);
    }
  };

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
      const res = await authFetch('/api/admin/ia/gerar-campanha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Cadastro / Login com Firebase Authentication
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
      // onAuthStateChanged cuida do resto
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

  const handleLogout = async () => {
    try {
      await sair();
    } catch {
      // ignora
    }
    setCampanhas([]);
    setCampanhaSelecionada(null);
  };

  // Observa o estado de autenticação do Firebase
  useEffect(() => {
    const unsub = observarAuth(u => {
      setUser(u);
      setAuthPronto(true);
    });
    return () => unsub();
  }, []);

  // Carregar Campanhas
  const carregarCampanhas = async () => {
    if (!auth.currentUser) return;
    setCarregando(true);
    try {
      const res = await authFetch('/api/admin/campanhas');
      if (res.status === 401) {
        await handleLogout();
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
    if (user) {
      carregarCampanhas();
      carregarConfig();
    }
  }, [user]);

  // Carregar Pedidos
  const carregarPedidos = async (campanhaId: string) => {
    try {
      const res = await authFetch(`/api/admin/campanhas/${campanhaId}/pedidos`);
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

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        const salva = await res.json();
        await carregarCampanhas();
        setLinkCampanha({ codigo: salva.codigo, titulo: salva.titulo });
        setLinkCopiado(false);
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
      const res = await authFetch(`/api/admin/campanhas/${campanhaSelecionada.id}/sortear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await authFetch('/api/admin/limpar-reservas', {
        method: 'POST'
      });
      const data = await res.json();
      alert(`Reservas expiradas limpas com sucesso! Cotas liberadas: ${data.cotasLiberadas}`);
      carregarCampanhas();
    } catch (e) {
      alert('Erro ao limpar reservas.');
    }
  };

  // Enquanto o Firebase verifica se há sessão ativa
  if (!authPronto) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        <RefreshCw className="w-4 h-4 mr-2 animate-spin text-emerald-400" />
        Carregando...
      </div>
    );
  }

  // TELA DE CADASTRO / LOGIN DO ORGANIZADOR
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-white">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
              R
            </div>
            <div>
              <h1 className="text-xl font-black">RifaZone</h1>
              <p className="text-xs text-slate-400">
                {modoCadastro ? 'Crie sua conta de organizador' : 'Acesse seu painel de rifas'}
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
                    placeholder="Como você quer ser chamado"
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
              id="btn-entrar-admin"
              type="submit"
              disabled={carregandoLogin}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-emerald-500/20"
            >
              {carregandoLogin ? 'Aguarde...' : modoCadastro ? 'Criar conta' : 'Entrar'}
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
            {modoCadastro ? 'Já tem conta?' : 'Ainda não tem conta?'}{' '}
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

  // Itens do menu lateral
  const navItems: { chave: typeof abaAtiva; label: string; icon: React.ReactNode; onClick?: () => void; alerta?: boolean }[] = [
    { chave: 'lista', label: 'Campanhas', icon: <LayoutGrid className="w-4 h-4" /> },
    { chave: 'nova', label: 'Nova Campanha', icon: <Plus className="w-4 h-4" />, onClick: iniciarNovaCampanha },
    { chave: 'pedidos', label: 'Pedidos & Compradores', icon: <Users className="w-4 h-4" />, onClick: () => { if (campanhaSelecionada) carregarPedidos(campanhaSelecionada.id); setAbaAtiva('pedidos'); } },
    { chave: 'apuracao', label: 'Apuração / Sorteio', icon: <Trophy className="w-4 h-4" /> },
    { chave: 'pagamento', label: 'Pagamento', icon: <DollarSign className="w-4 h-4" />, alerta: !!(configPagamento && !configPagamento.mpConfigurado) },
    { chave: 'personalizacao', label: 'Personalização', icon: <Settings className="w-4 h-4" /> }
  ];

  const irPara = (item: typeof navItems[number]) => {
    if (item.onClick) item.onClick();
    else setAbaAtiva(item.chave);
    setMenuAberto(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 md:flex">
      {/* Overlay do drawer no mobile */}
      {menuAberto && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setMenuAberto(false)}
        />
      )}

      {/* Menu lateral (fixo no desktop, drawer no mobile) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ${
          menuAberto ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Marca */}
        <div className="flex items-center justify-between gap-3 px-5 h-16 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-emerald-500/20">
              R
            </div>
            <h2 className="text-lg font-black text-white leading-none">RifaZone</h2>
          </div>
          <button
            onClick={() => setMenuAberto(false)}
            className="md:hidden text-slate-400 hover:text-white"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.chave}
              onClick={() => irPara(item)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                abaAtiva === item.chave
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-300 hover:bg-slate-800 border border-transparent'
              }`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.chave === 'lista' && (
                <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">
                  {campanhas.length}
                </span>
              )}
              {item.alerta && (
                <span className="w-2 h-2 rounded-full bg-amber-400" title="Configure para receber pagamentos" />
              )}
            </button>
          ))}

          <button
            onClick={() => { handleLimparReservas(); setMenuAberto(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 border border-transparent transition"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span className="flex-1 text-left">Limpar Reservas</span>
          </button>
        </nav>

        {/* Rodapé: usuário + sair */}
        <div className="border-t border-slate-800 p-3">
          <div className="px-2 py-1 mb-2">
            <p className="text-[11px] text-slate-500">Conectado como</p>
            <p className="text-xs text-emerald-400 font-mono truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold rounded-xl border border-red-500/30 transition"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Área principal */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar mobile com hambúrguer */}
        <header className="md:hidden sticky top-0 z-20 bg-slate-900 border-b border-slate-800 h-14 flex items-center gap-3 px-4">
          <button
            onClick={() => setMenuAberto(true)}
            className="text-slate-300 hover:text-white"
            aria-label="Abrir menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-sm">R</div>
            <span className="font-black text-white">RifaZone</span>
          </div>
        </header>

      {/* Content Body */}
      <div className="flex-1 p-6 max-w-6xl w-full mx-auto">
        
        {/* ABA: LISTA DE CAMPANHAS */}
        {abaAtiva === 'lista' && (
          <div className="space-y-6">
            {/* Banner do link compartilhável após criar/salvar campanha */}
            {linkCampanha && (() => {
              const shareUrl = `${window.location.origin}/c/${linkCampanha.codigo}`;
              return (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0">
                        <Link2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white leading-tight">
                          Link da campanha "{linkCampanha.titulo}" pronto!
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Compartilhe este link para as pessoas comprarem as cotas:
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setLinkCampanha(null)}
                      className="text-slate-500 hover:text-slate-300 text-xs shrink-0"
                      title="Fechar"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-3 flex flex-col sm:flex-row items-stretch gap-2">
                    <code className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-emerald-300 font-mono break-all">
                      {shareUrl}
                    </code>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(shareUrl);
                            setLinkCopiado(true);
                            setTimeout(() => setLinkCopiado(false), 2000);
                          } catch {
                            setLinkCopiado(false);
                          }
                        }}
                        className="px-3 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
                      >
                        {linkCopiado ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {linkCopiado ? 'Copiado!' : 'Copiar'}
                      </button>
                      <button
                        onClick={() => onSelectCampanha(linkCampanha.codigo)}
                        className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition border border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Abrir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

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

        {/* ABA: PAGAMENTO (credenciais Mercado Pago do organizador) */}
        {abaAtiva === 'pagamento' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h3 className="text-xl font-black text-white">Pagamento — Mercado Pago</h3>
              <p className="text-xs text-slate-400">
                Conecte a sua conta do Mercado Pago para que os pagamentos Pix das suas campanhas
                caiam <strong className="text-emerald-400">direto na sua conta</strong>.
              </p>
            </div>

            {/* Status atual */}
            <div className={`rounded-2xl border p-4 flex items-center gap-3 ${
              configPagamento?.mpConfigurado
                ? 'border-emerald-500/40 bg-emerald-500/10'
                : 'border-amber-500/40 bg-amber-500/10'
            }`}>
              {configPagamento?.mpConfigurado ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-white">Conta conectada ✅</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Token: {configPagamento.mpTokenMascara}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-white">Ainda não conectado</p>
                    <p className="text-[11px] text-slate-400">
                      Enquanto não conectar, as vendas rodam em <strong>modo simulação</strong> (Pix de teste).
                    </p>
                  </div>
                </>
              )}
            </div>

            <form onSubmit={handleSalvarConfig} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Access Token do Mercado Pago
                </label>
                <input
                  type="password"
                  value={mpTokenInput}
                  onChange={e => setMpTokenInput(e.target.value)}
                  placeholder={configPagamento?.mpConfigurado ? '•••••• (deixe em branco para manter o atual)' : 'APP_USR-... ou TEST-...'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                  autoComplete="off"
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  Encontre em <span className="text-emerald-400">Mercado Pago Developers → Suas integrações → sua aplicação → Credenciais</span>.
                  Comece com o token de <strong>Teste</strong> (TEST-) antes de usar o de Produção (APP_USR-).
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Public Key (opcional)
                </label>
                <input
                  type="text"
                  value={mpPublicKeyInput}
                  onChange={e => setMpPublicKeyInput(e.target.value)}
                  placeholder="APP_USR-xxxxxxxx-xxxx-... ou TEST-..."
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

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={salvandoConfig}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  {salvandoConfig ? 'Salvando...' : 'Salvar credenciais'}
                </button>
              </div>
            </form>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-[11px] text-slate-400 space-y-1.5">
              <p className="text-slate-300 font-bold text-xs flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" /> Como funciona
              </p>
              <p>• O token é guardado com segurança no servidor e <strong>nunca</strong> é exibido de volta por completo.</p>
              <p>• Para o Pix confirmar sozinho, cadastre o webhook <code className="text-emerald-400">SUA_URL/api/webhooks/mercadopago</code> no painel do Mercado Pago.</p>
              <p>• O Mercado Pago cobra uma taxa por Pix recebido — considere isso no valor da cota.</p>
            </div>
          </div>
        )}

        {/* ABA: PERSONALIZAÇÃO (marca + redes sociais) */}
        {abaAtiva === 'personalizacao' && (
          <form onSubmit={handleSalvarMarca} className="max-w-2xl mx-auto space-y-6">
            <div>
              <h3 className="text-xl font-black text-white">Personalização da marca</h3>
              <p className="text-xs text-slate-400">
                Defina o nome, logo, cores e redes sociais que aparecem na página pública das suas campanhas.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nome da marca</label>
                <input
                  type="text"
                  value={marca.nomeMarca}
                  onChange={e => setMarca({ ...marca, nomeMarca: e.target.value })}
                  placeholder="Ex: Grupo Sorte Premiada"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">URL do logo</label>
                <input
                  type="url"
                  value={marca.logoUrl}
                  onChange={e => setMarca({ ...marca, logoUrl: e.target.value })}
                  placeholder="https://.../logo.png"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Cor principal</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={marca.corPrincipal} onChange={e => setMarca({ ...marca, corPrincipal: e.target.value })} className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-700" />
                    <input type="text" value={marca.corPrincipal} onChange={e => setMarca({ ...marca, corPrincipal: e.target.value })} className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Cor de destaque</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={marca.corDestaque} onChange={e => setMarca({ ...marca, corDestaque: e.target.value })} className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-700" />
                    <input type="text" value={marca.corDestaque} onChange={e => setMarca({ ...marca, corDestaque: e.target.value })} className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white" />
                  </div>
                </div>
              </div>
              {/* Prévia do gradiente */}
              <div className="rounded-xl h-12 flex items-center justify-center text-white text-xs font-bold" style={{ background: `linear-gradient(90deg, ${marca.corPrincipal}, ${marca.corDestaque})` }}>
                Prévia do gradiente
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h4 className="text-sm font-black text-white">Redes sociais</h4>
              {([
                ['whatsapp', 'Grupo no WhatsApp'],
                ['telegram', 'Grupo no Telegram'],
                ['instagram', 'Instagram'],
                ['tiktok', 'TikTok'],
                ['youtube', 'YouTube']
              ] as const).map(([campo, label]) => (
                <div key={campo}>
                  <label className="text-xs font-bold text-slate-300 block mb-1">{label}</label>
                  <input
                    type="url"
                    value={(redes as any)[campo]}
                    onChange={e => setRedes({ ...redes, [campo]: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            {marcaMsg && (
              <p className="text-xs text-emerald-300 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {marcaMsg}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={salvandoMarca}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/20"
              >
                {salvandoMarca ? 'Salvando...' : 'Salvar personalização'}
              </button>
            </div>
          </form>
        )}

        </div>
      </div>
    </div>
  );
};
