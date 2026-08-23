import React, { useState, useEffect } from 'react';
import { Campanha, Pedido } from '../types';
import {
  LayoutDashboard, MessageSquare, LayoutGrid, Plus,
  Users, Ticket, RotateCw, Settings, LogOut, RefreshCw,
  Eye, Edit3, Link2, Copy, CheckCircle2, AlertCircle, Menu, X, Mail, Lock, User as UserIcon, Key,
  ExternalLink, Zap, Unlink, ShieldCheck, HelpCircle, ChevronDown, ChevronUp, Info,
  Trophy, Trash2, Play, Pause, Camera, Sparkles, Palette, BarChart3,
  ArrowLeft, Save
} from 'lucide-react';
import {
  auth, observarAuth, cadastrarComEmail, entrarComEmail, entrarComGoogle, sair,
  atualizarPerfilUsuario, atualizarEmailUsuario, atualizarSenhaUsuario,
  traduzErroAuth, type User
} from '../lib/firebase';
import { toReais } from '../lib/money';

// Sub-components lazy loaded
const DashboardView = React.lazy(() => import('./admin/DashboardView').then(m => ({ default: m.DashboardView })));
const AnalyticsView = React.lazy(() => import('./admin/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const RemarketingView = React.lazy(() => import('./admin/RemarketingView').then(m => ({ default: m.RemarketingView })));
const ClientesView = React.lazy(() => import('./admin/ClientesView').then(m => ({ default: m.ClientesView })));
const SorteadorView = React.lazy(() => import('./admin/SorteadorView').then(m => ({ default: m.SorteadorView })));
const CampanhasFormView = React.lazy(() => import('./admin/CampanhasFormView').then(m => ({ default: m.CampanhasFormView })));
const TemaBuilderView = React.lazy(() => import('./admin/TemaBuilderView').then(m => ({ default: m.TemaBuilderView })));
import { TEMA_PADRAO } from '../types';

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
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [modalTermosAberto, setModalTermosAberto] = useState(false);
  const [modalPrivacidadeAberto, setModalPrivacidadeAberto] = useState(false);

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
    descricao: '',
    bannerUrl: '',
    fotosCarrossel: [],
    youtubeUrl: '',
    modelo: 'aleatorio',
    totalCotas: undefined,
    valorCota: undefined,
    minPorCompra: undefined,
    maxPorCompra: undefined,
    localSorteio: 'Loteria Federal',
    selo: '',
    tempoReservaMin: undefined,
    exibirRanking: true,
    exibirBarraProgresso: true,
    exibirPaginaGanhadores: true,
    exigirEmail: false,
    exigirCpf: false,
    status: 'publicada',
    premios: [],
    cotasPremiadas: [],
    promocoes: [],
    descontoPorValorTotal: [],
    ofertasRelampago: []
  });
  const [salvandoCampanha, setSalvandoCampanha] = useState(false);
  const [formErro, setFormErro] = useState('');
  const [iaAviso, setIaAviso] = useState('');

  // Link compartilhável pós-salvar
  const [linkCampanha, setLinkCampanha] = useState<{ codigo: string; titulo: string } | null>(null);
  const [linkCopiado, setLinkCopiado] = useState(false);

  // Exclusão de campanha
  const [campanhaParaExcluir, setCampanhaParaExcluir] = useState<Campanha | null>(null);
  const [excluindoCampanha, setExcluindoCampanha] = useState(false);

  // Alternar Status da Campanha (Ativar / Pausar)
  const handleToggleStatusCampanha = async (campanha: Campanha) => {
    const statusAtual = campanha.status;
    const novoStatus = (statusAtual === 'publicada') ? 'pausada' : 'publicada';
    setCampanhas(prev => prev.map(c => c.id === campanha.id ? { ...c, status: novoStatus } : c));
    try {
      const res = await authFetch(`/api/admin/campanhas/${campanha.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...campanha, status: novoStatus })
      });
      if (!res.ok) {
        await carregarTudo();
      }
    } catch (e) {
      await carregarTudo();
    }
  };

  // Confirmar Exclusão de Campanha
  const handleExcluirCampanha = async () => {
    if (!campanhaParaExcluir) return;
    setExcluindoCampanha(true);
    try {
      const res = await authFetch(`/api/admin/campanhas/${campanhaParaExcluir.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCampanhaParaExcluir(null);
        await carregarTudo();
      } else {
        alert('Erro ao excluir campanha.');
      }
    } catch (e) {
      alert('Falha de conexão ao tentar excluir campanha.');
    } finally {
      setExcluindoCampanha(false);
    }
  };

  // Configurações Mercado Pago
  const [configPagamento, setConfigPagamento] = useState<any | null>(null);
  const [mpTokenInput, setMpTokenInput] = useState('');
  const [mpPublicKeyInput, setMpPublicKeyInput] = useState('');
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [iniciandoOAuth, setIniciandoOAuth] = useState(false);
  const [desconectandoMp, setDesconectandoMp] = useState(false);
  const [mostrarManualMp, setMostrarManualMp] = useState(false);
  const [redirectUriCopiada, setRedirectUriCopiada] = useState(false);
  const [configMsg, setConfigMsg] = useState('');
  const [configErro, setConfigErro] = useState('');

  // Sub-abas de configuração
  const [subAbaConfig, setSubAbaConfig] = useState<'perfil' | 'pix'>('perfil');
  const [perfilNome, setPerfilNome] = useState('');
  const [perfilFoto, setPerfilFoto] = useState('');
  const [perfilLogo, setPerfilLogo] = useState('');
  const [perfilEmail, setPerfilEmail] = useState('');
  const [perfilSenha, setPerfilSenha] = useState('');
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  // Inicializa dados do perfil
  useEffect(() => {
    if (user) {
      setPerfilNome(user.displayName || '');
      setPerfilFoto(user.photoURL || '');
      setPerfilEmail(user.email || '');
      if (configPagamento?.marca?.logoUrl) {
        setPerfilLogo(configPagamento.marca.logoUrl);
      }
    }
  }, [user, configPagamento]);

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSalvandoPerfil(true);
    setConfigMsg('');
    setConfigErro('');
    try {
      // 1) Atualiza perfil (nome e foto)
      if (perfilNome.trim() !== (user.displayName || '') || perfilFoto.trim() !== (user.photoURL || '')) {
        await atualizarPerfilUsuario(perfilNome.trim(), perfilFoto.trim());
      }
      
      // 2) Atualiza email se mudou
      if (perfilEmail.trim() !== (user.email || '')) {
        await atualizarEmailUsuario(perfilEmail.trim());
      }

      // 3) Atualiza senha se preenchida
      if (perfilSenha) {
        if (perfilSenha.length < 6) {
          throw new Error('A nova senha deve ter no mínimo 6 caracteres.');
        }
        await atualizarSenhaUsuario(perfilSenha);
        setPerfilSenha('');
      }

      // 4) Atualiza Logo da Marca na Config
      if (perfilLogo.trim() !== (configPagamento?.marca?.logoUrl || '')) {
        await authFetch('/api/admin/configuracoes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            marca: {
              ...configPagamento?.marca,
              logoUrl: perfilLogo.trim() || null
            }
          })
        });
      }

      // Recarrega o estado do usuário para refletir as alterações
      setUser({
        ...user,
        displayName: perfilNome.trim(),
        photoURL: perfilFoto.trim(),
        email: perfilEmail.trim()
      } as any);

      setConfigMsg('Seus dados de perfil foram atualizados com sucesso no Firebase!');
    } catch (err: any) {
      setConfigErro(traduzErroAuth(err?.code || '') || err.message || 'Erro ao atualizar dados da conta.');
    } finally {
      setSalvandoPerfil(false);
    }
  };

  // Observa Auth Firebase
  useEffect(() => {
    const unsub = observarAuth(u => {
      setUser(u);
      setAuthPronto(true);
    });
    return () => unsub();
  }, []);

  // Verifica parâmetros de retorno de OAuth do Mercado Pago na URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mpOauth = params.get('mp_oauth');
    const fbOauth = params.get('fb_oauth');
    const msg = params.get('msg');

    if (mpOauth === 'sucesso') {
      setAbaAtiva('configuracoes');
      setConfigMsg('🎉 Conta do Mercado Pago conectada com sucesso! Todos os seus recebimentos Pix cairão diretamente na sua conta.');
      setConfigErro('');
      // Limpa os parâmetros da URL sem recarregar
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (mpOauth === 'erro') {
      setAbaAtiva('configuracoes');
      setConfigErro(`Erro ao conectar com Mercado Pago: ${msg || 'Autorização não concluída.'}`);
      setConfigMsg('');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (fbOauth === 'sucesso') {
      setAbaAtiva('analytics');
      setConfigMsg('🎉 Conta do Facebook / Meta Ads conectada com sucesso via OAuth!');
      setConfigErro('');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (fbOauth === 'erro') {
      setAbaAtiva('analytics');
      setConfigErro(`Erro ao conectar com Facebook: ${msg || 'Autorização não concluída.'}`);
      setConfigMsg('');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
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
        if (dataConf.marca?.logoUrl) {
          setPerfilLogo(dataConf.marca.logoUrl);
        }
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
    if (modoCadastro && !aceitouTermos) {
      setLoginErro('Você deve aceitar os Termos de Uso e a Política de Privacidade para criar uma conta.');
      return;
    }
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

  // Iniciar fluxo OAuth do Mercado Pago (Conectar em 1 clique)
  const handleConectarMercadoPagoOAuth = async () => {
    setIniciandoOAuth(true);
    setConfigErro('');
    setConfigMsg('');
    try {
      const res = await authFetch('/api/auth/mercadopago/url');
      const data = await res.json();
      if (res.ok && data.url) {
        // Redireciona diretamente para o login oficial e consentimento do Mercado Pago
        window.location.href = data.url;
      } else {
        setConfigErro(data.error || 'Falha ao iniciar conexão com Mercado Pago. Verifique as configurações no servidor.');
      }
    } catch (err) {
      setConfigErro('Erro de conexão ao comunicar com o servidor.');
    } finally {
      setIniciandoOAuth(false);
    }
  };

  // Desconectar Mercado Pago
  const handleDesconectarMercadoPago = async () => {
    if (!window.confirm('Deseja realmente desconectar sua conta do Mercado Pago? As próximas compras não conseguirão gerar Pix até uma nova conta ser conectada.')) {
      return;
    }

    setDesconectandoMp(true);
    setConfigErro('');
    setConfigMsg('');
    try {
      const res = await authFetch('/api/admin/configuracoes/desconectar', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        await carregarTudo();
        setConfigMsg('Conta do Mercado Pago desconectada com sucesso.');
      } else {
        setConfigErro(data.error || 'Erro ao desconectar.');
      }
    } catch {
      setConfigErro('Erro de conexão ao desconectar.');
    } finally {
      setDesconectandoMp(false);
    }
  };

  // Salvar Config Mercado Pago Manualmente
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
      descricao: '',
      modalidade: 'paga',
      bannerUrl: '',
      fotosCarrossel: [],
      youtubeUrl: '',
      modelo: 'aleatorio',
      totalCotas: undefined,
      valorCota: 0.50, // Em Reais para o form
      minPorCompra: undefined,
      maxPorCompra: undefined,
      localSorteio: 'Loteria Federal',
      selo: '',
      tempoReservaMin: 15,
      exibirRanking: true,
      exibirBarraProgresso: true,
      exibirPaginaGanhadores: true,
      exibirQtdCotas: true,
      exibirCompradores: true,
      exibirSelo: true,
      exibirPremios: true,
      exibirCotasPremiadas: true,
      tempoAnimacaoSorteioSegundos: 3,
      exigirEmail: false,
      exigirCpf: false,
      status: 'rascunho',
      premios: [],
      cotasPremiadas: [],
      promocoes: [],
      descontoPorValorTotal: [],
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
            <img src={configPagamento?.marca?.logoUrl || "/logorifazone.png.jpeg"} alt="RifaZone" className="w-12 h-12 rounded-2xl shadow-xl shadow-emerald-500/10 object-cover" />
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

            {modoCadastro && (
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="aceite-termos-cadastro"
                  checked={aceitouTermos}
                  onChange={e => setAceitouTermos(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="aceite-termos-cadastro" className="text-[11px] text-slate-400 leading-snug cursor-pointer">
                  Li e concordo com os{' '}
                  <button
                    type="button"
                    onClick={() => setModalTermosAberto(true)}
                    className="text-emerald-400 underline font-medium hover:text-emerald-300"
                  >
                    Termos de Uso
                  </button>{' '}
                  e a{' '}
                  <button
                    type="button"
                    onClick={() => setModalPrivacidadeAberto(true)}
                    className="text-emerald-400 underline font-medium hover:text-emerald-300"
                  >
                    Política de Privacidade
                  </button>.
                </label>
              </div>
            )}

            {loginErro && (
              <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
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

          <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 pt-4 border-t border-slate-800 mt-4">
            <button
              type="button"
              onClick={() => setModalTermosAberto(true)}
              className="hover:text-slate-300 transition"
            >
              Termos de Uso
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setModalPrivacidadeAberto(true)}
              className="hover:text-slate-300 transition"
            >
              Política de Privacidade
            </button>
          </div>
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
        { id: 'analytics', label: 'Meta Ads', icon: <BarChart3 className="w-4 h-4 text-emerald-400" /> },
        { id: 'remarketing', label: 'Remarketing', icon: <MessageSquare className="w-4 h-4" /> },
      ]
    },
    {
      titulo: 'Operação',
      itens: [
        { id: 'campanhas', label: 'Campanhas', icon: <LayoutGrid className="w-4 h-4" />, count: campanhas.length },
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
            <img src={configPagamento?.marca?.logoUrl || "/logorifazone.png.jpeg"} alt="RifaZone" className="w-8 h-8 rounded-lg object-cover" />
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
            <div className="flex items-center gap-2">
              <img src={configPagamento?.marca?.logoUrl || "/logorifazone.png.jpeg"} alt="RifaZone" className="w-7 h-7 rounded-lg object-cover" />
              <span className="font-black text-white text-sm">RifaZone</span>
            </div>
          </div>
        </header>

        {/* Container Principal */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-none mx-auto space-y-6 overflow-x-hidden">
          <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center p-12 gap-3 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-slate-400">Carregando visualização...</p>
            </div>
          }>

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

          {/* ANALYTICS & META ADS */}
          {abaAtiva === 'analytics' && (
            <AnalyticsView
              campanhas={campanhas}
              pedidos={pedidos}
              authFetch={authFetch}
            />
          )}

          {/* 2. REMARKETING */}
          {abaAtiva === 'remarketing' && (
            <RemarketingView
              campanhas={campanhas}
              pedidos={pedidos}
              onRefresh={carregarTudo}
              authFetch={authFetch}
            />
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

          {/* TEMA EDITOR */}
          {abaAtiva === 'tema-editor' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAbaAtiva('campanhas')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h1 className="text-xl font-black text-white flex items-center gap-2">
                      <Palette className="w-5 h-5 text-emerald-400" />
                      Editor de Tema: {form.titulo}
                    </h1>
                    <p className="text-slate-400 text-xs">Ajuste as cores, tipografia e identidade visual da sua rifa.</p>
                  </div>
                </div>
                
                <button
                  onClick={handleSalvarCampanha}
                  disabled={salvandoCampanha}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {salvandoCampanha ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {salvandoCampanha ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <React.Suspense fallback={<div className="p-12 text-center text-slate-400">Carregando editor de temas...</div>}>
                  <TemaBuilderView
                    campanha={form}
                    onChangeCampanha={setForm}
                    tema={form.tema || TEMA_PADRAO}
                    onChangeTema={(novoTema) => setForm(prev => ({ ...prev, tema: novoTema }))}
                    onSalvar={handleSalvarCampanha}
                    salvando={salvandoCampanha}
                  />
                </React.Suspense>
              </div>
            </div>
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
                    Campanhas ({campanhas.length})
                  </h1>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Visualize suas rifas, pegue o link de divulgação oficial ou crie novas ações.
                  </p>
                </div>

                {campanhas.length > 0 && (
                  <button
                    onClick={handleNovaCampanha}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition shadow-md shadow-emerald-500/20 self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Criar Nova Campanha
                  </button>
                )}
              </div>

              {campanhas.length === 0 ? (
                /* Estado Vazio - Apenas o botão de criar primeira campanha */
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto my-6 space-y-5 shadow-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                    <LayoutGrid className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white mb-1.5">
                      Nenhuma campanha criada ainda
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Crie sua primeira rifa profissional com pagamentos instantâneos via Pix no Mercado Pago e comece a arrecadar agora mesmo!
                    </p>
                  </div>
                  <button
                    onClick={handleNovaCampanha}
                    className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl inline-flex items-center gap-2 transition shadow-lg shadow-emerald-500/25 active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                    Criar Primeira Campanha
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campanhas.map(c => (
                    <div
                      key={c.id}
                      className="group relative bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-emerald-500/5"
                    >
                      {/* Botão Excluir no Topo */}
                      <button
                        onClick={() => setCampanhaParaExcluir(c)}
                        className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 z-10"
                        title="Excluir Campanha"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div>
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex-1">
                            {/* Toggle Ativar / Pausar */}
                            <button
                              onClick={() => handleToggleStatusCampanha(c)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm ${
                                c.status === 'publicada'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                  : c.status === 'pausada'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {c.status === 'publicada' ? (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                  <span>ATIVA</span>
                                </>
                              ) : c.status === 'pausada' ? (
                                <>
                                  <Pause className="w-3 h-3 text-amber-400" />
                                  <span>PAUSADA</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3 text-slate-400" />
                                  <span>{c.status.toUpperCase()}</span>
                                </>
                              )}
                            </button>

                            <h4 className="text-lg font-black text-white leading-tight mt-3 line-clamp-2">
                              {c.titulo}
                            </h4>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
                              {c.codigo}
                            </span>
                          </div>
                        </div>

                        {/* Métricas Rápidas */}
                        <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/80 text-xs mb-4">
                          <div className="space-y-1">
                            <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Arrecadado</span>
                            <span className="text-sm font-black text-emerald-400 font-mono">
                              R$ {c.estatisticas?.arrecadado?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Progresso</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-white font-mono">
                                {c.estatisticas?.percentualVendido || 0}%
                              </span>
                              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 rounded-full" 
                                  style={{ width: `${c.estatisticas?.percentualVendido || 0}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ações Inferiores Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onSelectCampanha(c.codigo)}
                          className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-black rounded-2xl flex items-center justify-center gap-2 transition border border-slate-700"
                        >
                          <Eye className="w-4 h-4 text-slate-400" />
                          PRÉVIA
                        </button>

                        <button
                          onClick={() => {
                            setCampanhaSelecionada(c);
                            setAbaAtiva('sorteador');
                          }}
                          className="py-3 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-black rounded-2xl flex items-center justify-center gap-2 transition border border-amber-500/20"
                        >
                          <Trophy className="w-4 h-4" />
                          SORTEIO
                        </button>

                        <button
                          onClick={() => {
                            setForm(c);
                            setAbaAtiva('nova');
                          }}
                          className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-black rounded-2xl flex items-center justify-center gap-2 transition border border-slate-700"
                        >
                          <Edit3 className="w-4 h-4 text-slate-400" />
                          EDITAR RIFA
                        </button>

                        <button
                          onClick={() => {
                            setForm(c);
                            setAbaAtiva('tema-editor');
                          }}
                          className="py-3 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-black rounded-2xl flex items-center justify-center gap-2 transition border border-emerald-500/20"
                        >
                          <Palette className="w-4 h-4" />
                          TEMA & CORES
                        </button>

                        <button
                          onClick={async () => {
                            const shareUrl = `${window.location.origin}/c/${c.codigo}`;
                            await navigator.clipboard.writeText(shareUrl);
                            alert('Link da rifa copiado com sucesso!');
                          }}
                          className="col-span-2 py-3.5 px-3 bg-slate-100 hover:bg-white text-slate-900 text-[11px] font-black rounded-2xl flex items-center justify-center gap-2 transition shadow-xl active:scale-95"
                        >
                          <Copy className="w-4 h-4" />
                          COPIAR LINK DA RIFA
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              onVerPrevia={form.codigo ? () => onSelectCampanha(form.codigo!) : undefined}
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
                    Histórico detalhado de reservas (aguardando), pagamentos efetuados e pedidos expirados.
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
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                              p.status === 'pago' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                              p.status === 'expirado' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                              p.status === 'cancelado' ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' :
                              'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}>
                              {p.status === 'pendente' ? 'AGUARDANDO' : p.status}
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

          {/* 11. CONFIGURAÇÕES */}
          {abaAtiva === 'configuracoes' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-400" />
                  Configurações Gerais
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gerencie as informações do seu perfil de organizador e configure o gateway de recebimento Pix.
                </p>
              </div>

              {/* Seleção de Sub-abas */}
              <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => { setSubAbaConfig('perfil'); setConfigMsg(''); setConfigErro(''); }}
                  className={`flex-1 py-3 text-xs font-black rounded-xl transition flex items-center justify-center gap-2 ${
                    subAbaConfig === 'perfil'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  Minha Conta / Perfil
                </button>
                <button
                  type="button"
                  onClick={() => { setSubAbaConfig('pix'); setConfigMsg(''); setConfigErro(''); }}
                  className={`flex-1 py-3 text-xs font-black rounded-xl transition flex items-center justify-center gap-2 ${
                    subAbaConfig === 'pix'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  Integração Pix (Mercado Pago)
                </button>
              </div>

              {/* Mensagens de feedback */}
              {configMsg && (
                <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white mb-0.5">Tudo Certo!</p>
                    <p>{configMsg}</p>
                  </div>
                </div>
              )}

              {configErro && (
                <div className="p-4 rounded-2xl border border-red-500/40 bg-red-500/10 text-red-300 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white mb-0.5">Atenção</p>
                    <p>{configErro}</p>
                  </div>
                </div>
              )}

              {/* ABA 1: CONFIGURAÇÃO DE PERFIL */}
              {subAbaConfig === 'perfil' && (
                <form onSubmit={handleSalvarPerfil} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
                  <div className="flex flex-col sm:flex-row items-center gap-5 pb-2 border-b border-slate-800/80">
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-full bg-slate-950 border-2 border-emerald-500/30 overflow-hidden flex items-center justify-center shadow-lg">
                        {perfilFoto ? (
                          <img
                            src={perfilFoto}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              // Fallback se a imagem falhar
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(perfilNome || 'Rifa')}`;
                            }}
                          />
                        ) : (
                          <UserIcon className="w-8 h-8 text-slate-500" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center shadow-md border border-slate-900">
                        <Camera className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-center sm:text-left space-y-1">
                      <h3 className="text-sm font-black text-white">Foto do Organizador</h3>
                      <p className="text-[11px] text-slate-400 leading-normal max-w-sm">
                        Adicione um link direto de imagem (.jpg, .png ou .svg) ou clique no botão abaixo para gerar uma foto moderna baseada no seu nome.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const seed = perfilNome.trim() || user?.email || 'rifapix';
                          const randomNum = Math.floor(Math.random() * 1000);
                          setPerfilFoto(`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}-${randomNum}`);
                        }}
                        className="mt-1.5 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black rounded-lg transition flex items-center gap-1 mx-auto sm:mx-0"
                      >
                        <Sparkles className="w-3 h-3" />
                        Gerar Avatar Moderno
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                        Nome Completo / Fantasia *
                      </label>
                      <input
                        type="text"
                        required
                        value={perfilNome}
                        onChange={e => setPerfilNome(e.target.value)}
                        placeholder="Ex: Carlos Prêmios"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-emerald-400" />
                        E-mail de Acesso *
                      </label>
                      <input
                        type="email"
                        required
                        value={perfilEmail}
                        onChange={e => setPerfilEmail(e.target.value)}
                        placeholder="Ex: organizador@email.com"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                      Link da Imagem de Perfil
                    </label>
                    <input
                      type="url"
                      value={perfilFoto}
                      onChange={e => setPerfilFoto(e.target.value)}
                      placeholder="https://exemplo.com/sua-foto.png"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Palette className="w-3.5 h-3.5 text-emerald-400" />
                      Logo da Plataforma (Link da Imagem)
                    </label>
                    <input
                      type="url"
                      value={perfilLogo}
                      onChange={e => setPerfilLogo(e.target.value)}
                      placeholder="https://exemplo.com/seu-logo.png"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500 ml-1">Este logo aparecerá no topo do painel e nas páginas públicas das rifas.</p>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3.5">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      Alterar Senha de Acesso (Opcional)
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Se deseja alterar sua senha, preencha o campo abaixo. Deixe em branco se deseja continuar utilizando sua senha atual de acesso ao painel do organizador.
                    </p>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 block">
                        Nova Senha de Acesso
                      </label>
                      <input
                        type="password"
                        value={perfilSenha}
                        onChange={e => setPerfilSenha(e.target.value)}
                        placeholder="No mínimo 6 caracteres"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={salvandoPerfil}
                      className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                    >
                      {salvandoPerfil ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Salvando alterações...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Salvar Meus Dados
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* ABA 2: MERCADO PAGO CONFIGURAÇÕES */}
              {subAbaConfig === 'pix' && (
                <>
                  {/* STATUS ATUAL DA CONEXÃO */}
                  <div className={`rounded-2xl border p-5 shadow-lg transition-all ${
                    configPagamento?.mpConfigurado
                      ? 'border-emerald-500/40 bg-slate-900/90'
                      : 'border-slate-800 bg-slate-900/60'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                          configPagamento?.mpConfigurado
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {configPagamento?.mpConfigurado ? (
                            <ShieldCheck className="w-6 h-6" />
                          ) : (
                            <AlertCircle className="w-6 h-6 text-amber-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-black text-white">
                              {configPagamento?.mpConfigurado ? 'Mercado Pago Conectado e Ativo' : 'Nenhuma Conta Conectada'}
                            </h3>
                            {configPagamento?.mpConfigurado && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                configPagamento.mpConexaoTipo === 'oauth'
                                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}>
                                {configPagamento.mpConexaoTipo === 'oauth' ? 'OAuth Oficial' : 'Chave Manual'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {configPagamento?.mpConfigurado
                              ? 'Seus sorteios estão autorizados a emitir Pix oficiais e receber notificações instantâneas.'
                              : 'Conecte sua conta do Mercado Pago para que os pagamentos Pix caiam direto no seu saldo.'}
                          </p>

                          {configPagamento?.mpConfigurado && (
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                              {configPagamento.mpUserId && (
                                <div>
                                  <span className="text-slate-500 block text-[10px]">ID do Usuário MP:</span>
                                  <span className="text-slate-300 font-bold">{configPagamento.mpUserId}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-slate-500 block text-[10px]">Token Ativo:</span>
                                <span className="text-emerald-400 font-bold">{configPagamento.mpTokenMascara}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {configPagamento?.mpConfigurado && (
                        <button
                          type="button"
                          onClick={handleDesconectarMercadoPago}
                          disabled={desconectandoMp}
                          className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 self-start sm:self-center shrink-0"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                          {desconectandoMp ? 'Desconectando...' : 'Desconectar'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* CARD PRINCIPAL: CONECTAR COM 1 CLIQUE VIA OAUTH */}
                  <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-950/40 via-slate-900 to-slate-900 p-6 space-y-4 shadow-xl">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-black uppercase tracking-wider border border-sky-500/30 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-sky-400" />
                            Recomendado • 1 Clique
                          </span>
                        </div>
                        <h2 className="text-base font-black text-white">
                          Conectar Conta Mercado Pago (OAuth)
                        </h2>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Autorize a plataforma em segundos. Você será direcionado para o site oficial do Mercado Pago para fazer login e autorizar os recebimentos.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleConectarMercadoPagoOAuth}
                        disabled={iniciandoOAuth}
                        className="w-full sm:w-auto px-6 py-3.5 bg-[#009EE3] hover:bg-[#0086c3] text-white font-black text-sm rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2.5 transition active:scale-[0.99] disabled:opacity-70 cursor-pointer"
                      >
                        {iniciandoOAuth ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Iniciando autorização segura...
                          </>
                        ) : (
                          <>
                            <span className="font-black text-base">MP</span>
                            <span>{configPagamento?.mpConfigurado ? 'Reconectar com Mercado Pago' : 'Conectar com Mercado Pago'}</span>
                            <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
                          </>
                        )}
                      </button>
                    </div>

                    {/* Ajuda para o Dono do App se OAuth ainda não tiver CLIENT_ID no Render */}
                    {!configPagamento?.oauthConfiguradoNoServidor && (
                      <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                          <Info className="w-4 h-4 shrink-0" />
                          Instruções para o Dono da Plataforma (Configuração única no Render)
                        </div>
                        <p>
                          Para que qualquer usuário possa clicar no botão acima e conectar a conta dele automaticamente, adicione as variáveis no seu <strong>Render Dashboard → Environment</strong>:
                        </p>
                        <div className="font-mono text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1">
                          <div><strong className="text-sky-400">MP_CLIENT_ID</strong> = <em>Seu Application ID do Mercado Pago</em></div>
                          <div><strong className="text-sky-400">MP_CLIENT_SECRET</strong> = <em>Seu Client Secret do Mercado Pago</em></div>
                        </div>
                        <div className="pt-1">
                          <p className="text-slate-400 mb-1.5">
                            E cadastre a <strong>URL de Retorno (Redirect URI)</strong> no portal Mercado Pago Developers:
                          </p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-emerald-300 font-mono break-all">
                              {configPagamento?.oauthRedirectUri || `${window.location.origin}/api/auth/mercadopago/callback`}
                            </code>
                            <button
                              type="button"
                              onClick={async () => {
                                const uri = configPagamento?.oauthRedirectUri || `${window.location.origin}/api/auth/mercadopago/callback`;
                                await navigator.clipboard.writeText(uri);
                                setRedirectUriCopiada(true);
                                setTimeout(() => setRedirectUriCopiada(false), 2000);
                              }}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1 shrink-0"
                            >
                              {redirectUriCopiada ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              {redirectUriCopiada ? 'Copiado!' : 'Copiar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* OPÇÃO 2: CONFIGURAÇÃO MANUAL (EXPANSÍVEL / AVANÇADO) */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                    <button
                      type="button"
                      onClick={() => setMostrarManualMp(!mostrarManualMp)}
                      className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <Key className="w-4 h-4 text-slate-400" />
                        <div>
                          <h3 className="text-xs font-bold text-white">
                            Configuração Manual via Access Token (Avançado)
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            Insira diretamente o seu Access Token de Produção ou Teste gerado no portal do desenvolvedor.
                          </p>
                        </div>
                      </div>
                      {mostrarManualMp ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {mostrarManualMp && (
                      <form onSubmit={handleSalvarConfig} className="p-6 pt-0 border-t border-slate-800/80 space-y-4 animate-in fade-in">
                        <div className="pt-4">
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
                            Começa com <strong className="text-emerald-400">APP_USR-</strong> (produção) ou <strong className="text-amber-400">TEST-</strong> (teste).
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

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            disabled={salvandoConfig}
                            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 text-xs font-black rounded-xl shadow-md transition"
                          >
                            {salvandoConfig ? 'Salvando...' : 'Salvar Chaves Manualmente'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Informações de Segurança */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-[11px] text-slate-400 space-y-1.5">
                    <p className="text-slate-300 font-bold text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Segurança & Recebimento Direto
                    </p>
                    <p>• O dinheiro dos bilhetes Pix é creditado <strong>diretamente na conta do organizador</strong> vinculada, sem retenção por intermediários.</p>
                    <p>• A aprovação é processada via Webhook em milissegundos e atualiza o comprador na hora.</p>
                  </div>
                </>
              )}
            </div>
          )}

          </React.Suspense>
        </main>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE CAMPANHA */}
      {campanhaParaExcluir && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white leading-tight">Excluir Campanha?</h3>
                <p className="text-xs text-slate-400">Ação de exclusão permanente</p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <p className="text-xs text-slate-300">
                Tem certeza que deseja excluir a campanha:
              </p>
              <p className="text-sm font-black text-white bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                "{campanhaParaExcluir.titulo}"
              </p>
              <p className="text-[11px] text-red-400 font-medium pt-1">
                ⚠️ Essa ação é irreversível e removerá todos os dados, bilhetes e estatísticas associados a esta ação.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setCampanhaParaExcluir(null)}
                disabled={excluindoCampanha}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluirCampanha}
                disabled={excluindoCampanha}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl shadow-lg shadow-red-600/25 transition flex items-center justify-center gap-2"
              >
                {excluindoCampanha ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Sim, Excluir Campanha
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TERMOS DE USO */}
      {modalTermosAberto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-white">Termos de Uso da Plataforma</h3>
              <button
                onClick={() => setModalTermosAberto(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <p><strong>1. Aceitação dos Termos:</strong> Ao se cadastrar e utilizar o painel de gestão, você concorda expressamente com estes Termos de Uso e com a nossa Política de Privacidade.</p>
              <p><strong>2. Conta do Organizador:</strong> O usuário é o único responsável pela veracidade dos dados cadastrados, pela segurança de sua senha e por todas as campanhas de arrecadação criadas em sua conta.</p>
              <p><strong>3. Integração com Gateway de Pagamento:</strong> A plataforma permite conectar seu gateway (como Mercado Pago) para recebimento direto. A RifaZone não retém valores de transações diretas entre organizadores e participantes.</p>
              <p><strong>4. Conformidade Legal:</strong> O organizador declara estar em total conformidade com as leis vigentes em sua jurisdição aplicáveis a sorteios, arrecadações e proteção ao consumidor.</p>
              <p><strong>5. Modificações:</strong> Reservamo-nos o direito de atualizar estes termos a qualquer momento, notificando os usuários ativos em caso de alterações substanciais.</p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setModalTermosAberto(false)}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POLÍTICA DE PRIVACIDADE */}
      {modalPrivacidadeAberto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-white">Política de Privacidade</h3>
              <button
                onClick={() => setModalPrivacidadeAberto(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <p><strong>1. Coleta de Dados:</strong> Coletamos informações fornecidas no cadastro (nome, e-mail) e dados transacionais estritamente necessários para a operação das campanhas e segurança da plataforma.</p>
              <p><strong>2. Uso das Informações:</strong> Seus dados são utilizados para autenticação segura via Firebase Authentication, gerenciamento de campanhas, emissão de relatórios e suporte técnico.</p>
              <p><strong>3. Segurança de Dados:</strong> Empregamos criptografia de ponta e padrões rigorosos de segurança em nuvem para proteger suas informações contra acesso não autorizado.</p>
              <p><strong>4. Compartilhamento:</strong> Não comercializamos seus dados pessoais. O compartilhamento ocorre apenas quando necessário com provedores de infraestrutura (Firebase/Google Cloud) e gateways de pagamento autorizados por você.</p>
              <p><strong>5. Seus Direitos:</strong> Você pode a qualquer momento solicitar a exportação ou exclusão definitiva de seus dados e conta diretamente pelo painel ou suporte.</p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setModalPrivacidadeAberto(false)}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
