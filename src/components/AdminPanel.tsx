import { confirmar } from '../lib/confirm';
import { toast } from '../lib/toast';
import React, { useState, useEffect } from 'react';
import { Campanha, Pedido } from '../types';
import {
  LayoutDashboard, MessageSquare, LayoutGrid, Plus,
  Users, Ticket, RotateCw, Settings, LogOut, RefreshCw,
  Eye, Edit3, Link2, Copy, CheckCircle2, AlertCircle, Menu, X, Mail, Lock, User as UserIcon, Key,
  ExternalLink, Zap, Unlink, ShieldCheck, HelpCircle, ChevronDown, ChevronUp, Info,
  Trophy, Trash2, Play, Pause, Camera, Sparkles, Palette, BarChart3, Image as ImageIcon,
  ArrowLeft, Save, CreditCard, Wallet, Search,
  PanelLeftClose, PanelLeftOpen, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  auth, observarAuth, cadastrarComEmail, entrarComEmail, entrarComGoogle, sair,
  atualizarPerfilUsuario, atualizarEmailUsuario, atualizarSenhaUsuario, reautenticarEAlterarSenha,
  enviarResetSenha, traduzErroAuth, type User
} from '../lib/firebase';
import { toReais } from '../lib/money';
import { uploadImageToStorage } from '../lib/image-upload';
import { lazyWithRetry } from '../lib/lazy-retry';

// Sub-components lazy loaded
const DashboardView = lazyWithRetry(() => import('./admin/DashboardView').then(m => ({ default: m.DashboardView })));
const AnalyticsView = lazyWithRetry(() => import('./admin/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const RemarketingView = lazyWithRetry(() => import('./admin/RemarketingView').then(m => ({ default: m.RemarketingView })));
const HistoricoView = lazyWithRetry(() => import('./admin/HistoricoView').then(m => ({ default: m.HistoricoView })));
const SorteadorView = lazyWithRetry(() => import('./admin/SorteadorView').then(m => ({ default: m.SorteadorView })));
const BuscarGanhadorView = lazyWithRetry(() => import('./admin/BuscarGanhadorView').then(m => ({ default: m.BuscarGanhadorView })));
const CampanhasFormView = lazyWithRetry(() => import('./admin/CampanhasFormView').then(m => ({ default: m.CampanhasFormView })));
const TemaBuilderView = lazyWithRetry(() => import('./admin/TemaBuilderView').then(m => ({ default: m.TemaBuilderView })));
const CheckoutBuilderView = lazyWithRetry(() => import('./admin/CheckoutBuilderView').then(m => ({ default: m.CheckoutBuilderView })));
const CarteiraView = lazyWithRetry(() => import('./admin/CarteiraView').then(m => ({ default: m.CarteiraView })));
const CarteiraAdminView = lazyWithRetry(() => import('./admin/CarteiraAdminView').then(m => ({ default: m.CarteiraAdminView })));
const MetodosPagamentoView = lazyWithRetry(() => import('./admin/MetodosPagamentoView').then(m => ({ default: m.MetodosPagamentoView })));
import { TEMA_PADRAO } from '../types';

interface Props {
  onSelectCampanha: (codigo: string) => void;
  onNavigateComoFunciona?: () => void;
}

export const AdminPanel: React.FC<Props> = ({ onSelectCampanha, onNavigateComoFunciona }) => {
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
  // Recuperação de senha
  const [resetMsg, setResetMsg] = useState('');
  const [enviandoReset, setEnviandoReset] = useState(false);

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
  const [sidebarModo, setSidebarModo] = useState<'compacto' | 'expandido'>(() => {
    try {
      const salvo = localStorage.getItem('rifazone_admin_sidebar');
      if (salvo === 'compacto' || salvo === 'expandido') return salvo;
    } catch {}
    return 'expandido';
  });

  const alternarSidebarModo = () => {
    setSidebarModo(prev => {
      const novo = prev === 'compacto' ? 'expandido' : 'compacto';
      try {
        localStorage.setItem('rifazone_admin_sidebar', novo);
      } catch {}
      return novo;
    });
  };

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
    exibirSeloOficial: true,
    exigirEmail: false,
    exigirCpf: false,
    autoplayGaleria: false,
    autoplayIntervaloGaleria: 5,
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
        toast('Erro ao excluir campanha.');
      }
    } catch (e) {
      toast('Falha de conexão ao tentar excluir campanha.');
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
  const [subAbaConfig, setSubAbaConfig] = useState<'perfil' | 'carteira-sistema'>('perfil');
  const [modoEdicaoPerfil, setModoEdicaoPerfil] = useState(false);
  const [perfilNome, setPerfilNome] = useState('');
  const [perfilFoto, setPerfilFoto] = useState('');
  const [perfilLogo, setPerfilLogo] = useState('');
  const [perfilCapa, setPerfilCapa] = useState('');
  const [perfilEmail, setPerfilEmail] = useState('');
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  // Alteração de Senha com Reautenticação
  const [modoAlterarSenha, setModoAlterarSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  // Inicializa dados do perfil
  useEffect(() => {
    if (user) {
      setPerfilNome(user.displayName || '');
      setPerfilFoto(configPagamento?.marca?.fotoPerfilUrl || user.photoURL || '');
      setPerfilEmail(user.email || '');
      if (configPagamento?.marca?.logoUrl) {
        setPerfilLogo(configPagamento.marca.logoUrl);
      }
      if (configPagamento?.marca?.capaUrl) {
        setPerfilCapa(configPagamento.marca.capaUrl);
      }
    }
  }, [user, configPagamento]);

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Mesma pipeline do resto do app: comprime e envia p/ storage (Cloudinary),
      // evitando base64 gigante embutido na config.
      const url = await uploadImageToStorage(file, 'organizadores', 400, 400, 0.85);
      setPerfilFoto(url);
    } catch (err: any) {
      setConfigErro(err?.message || 'Não foi possível enviar a foto. Tente outra imagem.');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImageToStorage(file, 'logoscabecalho', 600, 600, 0.9);
      setPerfilLogo(url);
    } catch (err: any) {
      setConfigErro(err?.message || 'Não foi possível enviar a logo. Tente outra imagem.');
    }
  };

  const handleCapaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImageToStorage(file, 'organizadores', 1200, 600, 0.85);
      setPerfilCapa(url);
    } catch (err: any) {
      setConfigErro(err?.message || 'Não foi possível enviar a foto de capa.');
    }
  };

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

      // 2) Atualiza Marca (Nome, Logo, Capa, FotoPerfil) na Config
      await authFetch('/api/admin/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marca: {
            ...configPagamento?.marca,
            nomeMarca: perfilNome.trim() || null,
            logoUrl: perfilLogo.trim() || null,
            capaUrl: perfilCapa.trim() || null,
            fotoPerfilUrl: perfilFoto.trim() || null
          }
        })
      });

      // Recarrega o estado do usuário para refletir as alterações
      setUser({
        ...user,
        displayName: perfilNome.trim(),
        photoURL: perfilFoto.trim()
      } as any);

      setConfigMsg('Informações do seu perfil foram salvas com sucesso!');
      setModoEdicaoPerfil(false);
    } catch (err: any) {
      setConfigErro(traduzErroAuth(err?.code || '') || err.message || 'Erro ao atualizar dados da conta.');
    } finally {
      setSalvandoPerfil(false);
    }
  };

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigMsg('');
    setConfigErro('');

    if (!senhaAtual) {
      setConfigErro('Informe sua senha atual para confirmação.');
      return;
    }
    if (!novaSenha || novaSenha.length < 6) {
      setConfigErro('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarNovaSenha) {
      setConfigErro('A nova senha e a confirmação não coincidem.');
      return;
    }

    setSalvandoSenha(true);
    try {
      await reautenticarEAlterarSenha(senhaAtual, novaSenha);
      setConfigMsg('Sua senha foi alterada com sucesso!');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarNovaSenha('');
      setModoAlterarSenha(false);
    } catch (err: any) {
      console.error('Erro ao alterar senha:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setConfigErro('A senha atual está incorreta. Verifique sua senha e tente novamente.');
      } else {
        setConfigErro(traduzErroAuth(err.code) || err.message || 'Erro ao alterar a senha.');
      }
    } finally {
      setSalvandoSenha(false);
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
      // Dispara o Warmup / Pré-carregamento em background para todas as APIs cadastradas (Efí Pay, Facebook, Carteira, etc.)
      authFetch('/api/admin/warmup').catch(() => {});

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

  const handleResetSenha = async () => {
    setLoginErro('');
    setResetMsg('');
    if (!email.trim()) {
      setLoginErro('Digite seu e-mail no campo acima para receber o link de redefinição de senha.');
      return;
    }
    setEnviandoReset(true);
    try {
      await enviarResetSenha(email.trim());
      setResetMsg('Enviamos um link de redefinição de senha para o seu e-mail. Confira a caixa de entrada e o spam.');
    } catch (err: any) {
      setLoginErro(traduzErroAuth(err?.code || '') || 'Não foi possível enviar o e-mail de redefinição. Verifique o endereço e tente novamente.');
    } finally {
      setEnviandoReset(false);
    }
  };

  // Salvar Campanha
  const handleSalvarCampanha = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormErro('');
    setSalvandoCampanha(true);
    try {
      const url = form.id ? `/api/admin/campanhas/${form.id}` : '/api/admin/campanhas';
      const method = form.id ? 'PUT' : 'POST';

      const formPayload = {
        ...form,
        organizadorNome: perfilNome || user?.displayName || form.organizadorNome || null,
        organizadorFoto: perfilFoto || user?.photoURL || form.organizadorFoto || null,
        organizadorCapa: perfilCapa || configPagamento?.marca?.capaUrl || form.organizadorCapa || null,
        cabecalhoLogoUrl: perfilLogo || configPagamento?.marca?.logoUrl || form.cabecalhoLogoUrl || null
      };

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formPayload)
      });

      let salva: any = {};
      try {
        salva = await res.json();
      } catch {
        throw new Error('Resposta inesperada do servidor.');
      }

      if (res.ok) {
        await carregarTudo();
        setLinkCampanha({ codigo: salva.codigo, titulo: salva.titulo });
        setLinkCopiado(false);
        setAbaAtiva('campanhas');
      } else {
        setFormErro(salva.error || `Erro ao salvar campanha. (HTTP ${res.status})`);
      }
    } catch (err: any) {
      setFormErro(`Falha de conexão ao salvar: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setSalvandoCampanha(false);
    }
  };

  // Gerar com IA
  const handleGerarComIA = async () => {
    const premio = prompt('Descreva o que vai ser a sua rifa:\n(Ex: Rifa de um iPhone 15 por R$ 0,50 cada cota)');
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
        toast(data.error || 'Erro ao gerar com IA.');
      }
    } catch (err) {
      setIaAviso('');
      toast('Erro de conexão ao chamar assistente de IA.');
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
    if (!(await confirmar({ titulo: 'Desconectar Mercado Pago', mensagem: 'As próximas compras não conseguirão gerar Pix até uma nova conta ser conectada. Deseja continuar?', perigo: true, confirmarLabel: 'Desconectar' }))) {
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
      toast(`Reservas expiradas limpas com sucesso! Cotas liberadas: ${data.cotasLiberadas}`);
      carregarTudo();
    } catch {
      toast('Erro ao limpar reservas.');
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
      exibirSeloOficial: true,
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
            <img src="/logorifazone.png.jpeg" alt="RifaZone" className="w-12 h-12 rounded-2xl shadow-xl shadow-emerald-500/10 object-cover" />
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Senha</label>
                {!modoCadastro && (
                  <button
                    type="button"
                    onClick={handleResetSenha}
                    disabled={enviandoReset}
                    className="text-[11px] text-emerald-400 font-semibold hover:text-emerald-300 hover:underline disabled:opacity-60"
                  >
                    {enviandoReset ? 'Enviando...' : 'Esqueci minha senha'}
                  </button>
                )}
              </div>
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

            {resetMsg && (
              <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {resetMsg}
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
            disabled={true}
            title="Login via Google temporariamente suspenso durante a migração para Supabase"
            className="w-full py-2.5 bg-slate-800/60 opacity-60 cursor-not-allowed text-slate-400 font-medium rounded-xl text-xs transition flex items-center justify-center gap-2 border border-slate-700/60"
          >
            <svg className="w-4 h-4 grayscale opacity-70" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continuar com Google (Em breve via Supabase)
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
      titulo: 'Menu Principal',
      itens: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'campanhas', label: 'Campanhas', icon: <LayoutGrid className="w-4 h-4" />, count: campanhas.length },
        { id: 'analytics', label: 'Meta Ads', icon: <BarChart3 className="w-4 h-4 text-emerald-400" /> },
        { id: 'remarketing', label: 'Remarketing', icon: <MessageSquare className="w-4 h-4" /> },
        { id: 'historico', label: 'Histórico', icon: <Users className="w-4 h-4" /> },
      ]
    },
    {
      titulo: 'Funcionalidades',
      itens: [
        { id: 'sorteador', label: 'Sorteador Oficial', icon: <RotateCw className="w-4 h-4" /> },
        { id: 'buscar_ganhador', label: 'Buscar Ganhador / Cota', icon: <Search className="w-4 h-4 text-emerald-400" /> },
      ]
    },
    {
      titulo: 'Personalização & Ajustes',
      itens: [
        { id: 'checkouts', label: 'Checkout', icon: <CreditCard className="w-4 h-4 text-indigo-400" /> },
        { id: 'metodos-pagamento', label: 'Métodos de Pagamento', icon: <Wallet className="w-4 h-4 text-emerald-400" /> },
        { id: 'configuracoes', label: 'Configurações', icon: <Settings className="w-4 h-4" />, alerta: !configPagamento?.mpConfigurado },
        ...(onNavigateComoFunciona ? [{ id: 'como-funciona', label: 'Como Funciona (Público)', icon: <HelpCircle className="w-4 h-4 text-sky-400" />, onClick: onNavigateComoFunciona }] : [])
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
        className={`fixed md:sticky top-0 left-0 z-40 h-screen shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out ${
          menuAberto ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 ${
          sidebarModo === 'compacto' ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand & Botão de Expansão/Recolhimento */}
        <div className={`flex items-center ${sidebarModo === 'compacto' ? 'justify-center px-2' : 'justify-between px-4'} h-16 border-b border-slate-800 shrink-0`}>
          <div
            onClick={sidebarModo === 'compacto' ? alternarSidebarModo : undefined}
            className={`flex items-center gap-2.5 overflow-hidden ${sidebarModo === 'compacto' ? 'cursor-pointer hover:opacity-80 transition' : ''}`}
            title={sidebarModo === 'compacto' ? 'Clique para expandir o menu' : undefined}
          >
            <img src="/logorifazone.png.jpeg" alt="RifaZone" className="w-8 h-8 rounded-lg object-cover shrink-0 shadow-sm" />
            {sidebarModo !== 'compacto' && (
              <div className="truncate">
                <h2 className="text-base font-black text-white leading-none truncate">RifaZone</h2>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Painel Pro</span>
              </div>
            )}
          </div>

          {/* Botão de Toggle (1 clique expande, 1 clique recolhe) */}
          <button
            onClick={alternarSidebarModo}
            title={sidebarModo === 'compacto' ? 'Expandir Menu' : 'Recolher Menu (Diminuir)'}
            className={`hidden md:flex items-center justify-center p-2 rounded-xl transition cursor-pointer ${
              sidebarModo === 'compacto'
                ? 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-700'
            }`}
          >
            {sidebarModo === 'compacto' ? (
              <PanelLeftOpen className="w-4 h-4 text-emerald-400" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => setMenuAberto(false)}
            className="md:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links Navigation */}
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-4 custom-scrollbar">
          {navSections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              {sidebarModo !== 'compacto' && (
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-3 block">
                  {sec.titulo}
                </span>
              )}
              {sec.itens.map(item => (
                <button
                  key={item.id}
                  title={sidebarModo === 'compacto' ? item.label : undefined}
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    else setAbaAtiva(item.id);
                    setMenuAberto(false);
                  }}
                  className={`w-full flex items-center gap-3 py-2.5 rounded-xl text-xs font-bold transition group relative cursor-pointer ${
                    sidebarModo === 'compacto' ? 'justify-center px-0' : 'px-3'
                  } ${
                    abaAtiva === item.id
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <div className="shrink-0">{item.icon}</div>
                  {sidebarModo !== 'compacto' && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {item.count !== undefined && (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-mono">
                          {item.count}
                        </span>
                      )}
                      {item.alerta && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Configuração necessária" />
                      )}
                    </>
                  )}
                  {sidebarModo === 'compacto' && (
                    <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-800 text-white text-[11px] font-bold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition z-50 border border-slate-700">
                      {item.label}
                      {item.count !== undefined && ` (${item.count})`}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Rodapé Usuário & Botão Alternar Menu */}
        <div className="border-t border-slate-800 p-2.5 shrink-0 space-y-2">
          {/* Botão de Expansão/Recolhimento Rápido no Rodapé */}
          <button
            onClick={alternarSidebarModo}
            title={sidebarModo === 'compacto' ? 'Expandir Menu' : 'Recolher Menu (Diminuir)'}
            className={`w-full hidden md:flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              sidebarModo === 'compacto'
                ? 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border-slate-800 hover:border-slate-700'
                : 'bg-slate-950/60 hover:bg-slate-950 text-slate-400 hover:text-white border-slate-800/80 hover:border-slate-700'
            }`}
          >
            {sidebarModo === 'compacto' ? (
              <PanelLeftOpen className="w-4 h-4 text-emerald-400" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4 text-slate-400" />
                <span className="text-[11px]">Recolher Menu</span>
              </>
            )}
          </button>

          {sidebarModo !== 'compacto' ? (
            <>
              <div className="px-2.5 py-1.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
                <p className="text-[9px] text-slate-500 uppercase font-bold">Organizador</p>
                <p className="text-[11px] text-emerald-400 font-mono truncate">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl border border-red-500/30 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sair da Conta
              </button>
            </>
          ) : (
            <button
              onClick={handleLogout}
              title="Sair da Conta"
              className="w-full flex items-center justify-center p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DE CONTEÚDO */}
      <div className="flex-1 min-w-0 flex flex-col">
        
        {/* Header Mobile */}
        <header className="md:hidden sticky top-0 z-20 bg-slate-900 border-b border-slate-800 h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuAberto(prev => !prev)}
              className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="Alternar Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <img src="/logorifazone.png.jpeg" alt="RifaZone" className="w-7 h-7 rounded-lg object-cover" />
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

          {/* CARTEIRA DO SISTEMA & SAQUES */}
          {abaAtiva === 'carteira' && (
            <CarteiraView authFetch={authFetch} carteiraConfigProp={configPagamento?.carteiraConfig} />
          )}

          {/* MÉTODOS DE PAGAMENTO (MULTI-GATEWAY) */}
          {abaAtiva === 'metodos-pagamento' && (
            <MetodosPagamentoView 
              authFetch={authFetch} 
              onAbrirCarteira={() => setAbaAtiva('carteira')}
              isAdmin={user?.email === 'wheslleyaviz@gmail.com'}
              userEmail={user?.email || ''}
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

          {/* HISTÓRICO UNIFICADO */}
          {abaAtiva === 'historico' && <HistoricoView pedidos={pedidos} authFetch={authFetch} />}

          {/* BUSCAR GANHADOR */}
          {abaAtiva === 'buscar_ganhador' && <BuscarGanhadorView pedidos={pedidos} />}

          {/* 4. SORTEADOR */}
          {abaAtiva === 'sorteador' && (
            <SorteadorView
              campanhas={campanhas}
              pedidos={pedidos}
              onApurarCampanha={handleApurarCampanha}
            />
          )}

          {/* CHECKOUTS BUILDER */}
          {abaAtiva === 'checkouts' && (
            <CheckoutBuilderView authFetch={authFetch} />
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
                            <span 
                              className="text-[11px] font-mono font-bold text-slate-300 bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 rounded-lg"
                              title={`Link amigável: /c/${c.codigo}`}
                            >
                              /{c.codigo}
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
                            toast('Link da rifa copiado com sucesso!');
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
              authFetch={authFetch}
            />
          )}

          {/* Pedidos & transações agora ficam no Histórico (sub-aba "Pedidos"),
              evitando uma aba solta e inalcançável. */}

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
              <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-2xl flex-wrap">
                <button
                  type="button"
                  onClick={() => { setSubAbaConfig('perfil'); setConfigMsg(''); setConfigErro(''); }}
                  className={`flex-1 min-w-[140px] py-3 text-xs font-black rounded-xl transition flex items-center justify-center gap-2 ${
                    subAbaConfig === 'perfil'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  Minha Conta
                </button>
                
                {user?.email === 'wheslleyaviz@gmail.com' && (
                  <button
                    type="button"
                    onClick={() => { setSubAbaConfig('carteira-sistema'); setConfigMsg(''); setConfigErro(''); }}
                    className={`flex-1 min-w-[140px] py-3 text-xs font-black rounded-xl transition flex items-center justify-center gap-2 ${
                      subAbaConfig === 'carteira-sistema'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    Carteira do Sistema (Admin)
                  </button>
                )}
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

              {/* ABA MINHA CONTA */}
              {subAbaConfig === 'perfil' && (
                <div className="space-y-6">
                  {!modoEdicaoPerfil ? (
                    /* Visualização do Perfil */
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                      <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-800/80">
                        <div className="w-24 h-24 rounded-full bg-slate-950 border-2 border-emerald-500/40 overflow-hidden flex items-center justify-center shadow-lg shrink-0">
                          {perfilFoto ? (
                            <img
                              src={perfilFoto}
                              alt="Foto de Perfil"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <UserIcon className="w-10 h-10 text-slate-500" />
                          )}
                        </div>
                        <div className="text-center sm:text-left space-y-1.5 flex-1">
                          <h2 className="text-lg font-black text-white">{perfilNome || user?.displayName || 'Organizador'}</h2>
                          <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-emerald-400" />
                            {user?.email}
                          </p>
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => setModoEdicaoPerfil(true)}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 mx-auto sm:mx-0"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Editar Informações
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Dados Básicos */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Nome Completo / Fantasia</span>
                          <p className="text-sm font-black text-white">{perfilNome || 'Não informado'}</p>
                        </div>
                        <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400">E-mail Cadastrado</span>
                          <p className="text-sm font-black text-emerald-400 font-mono">{user?.email}</p>
                        </div>
                      </div>

                      {/* Visualização de Capa e Logo */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
                        <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Sua Logo de Organizador / Marca</span>
                          {perfilLogo ? (
                            <div className="h-16 rounded-xl bg-slate-900 border border-slate-800 p-2 flex items-center justify-center">
                              <img src={perfilLogo} alt="Sua Logo" className="max-h-full object-contain" />
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic">Nenhuma logo cadastrada</p>
                          )}
                        </div>

                        <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Foto de Fundo / Capa do Perfil</span>
                          {perfilCapa ? (
                            <div className="h-16 rounded-xl overflow-hidden border border-slate-800 relative bg-slate-900 flex items-center justify-center">
                              <img src={perfilCapa} className="absolute inset-0 w-full h-full object-cover blur-md opacity-40 scale-110 select-none pointer-events-none" alt="" />
                              <img src={perfilCapa} alt="Capa do Perfil" className="relative z-10 max-h-full object-contain" />
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic">Nenhuma foto de capa cadastrada</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Edição de Informações */
                    <form onSubmit={handleSalvarPerfil} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl animate-in fade-in">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                        <h3 className="text-sm font-black text-white flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-emerald-400" />
                          Editar Informações Pessoais
                        </h3>
                        <button
                          type="button"
                          onClick={() => setModoEdicaoPerfil(false)}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          Cancelar
                        </button>
                      </div>

                      {/* Upload de Foto de Perfil */}
                      <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                        <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-emerald-500/40 overflow-hidden flex items-center justify-center shrink-0">
                          {perfilFoto ? (
                            <img src={perfilFoto} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-8 h-8 text-slate-500" />
                          )}
                        </div>
                        <div className="space-y-2 text-center sm:text-left flex-1">
                          <h4 className="text-xs font-bold text-white">Foto do Perfil</h4>
                          <p className="text-[11px] text-slate-400">Selecione uma foto de perfil do organizador. <span className="text-emerald-400 font-semibold block sm:inline sm:ml-1">(Recomendado: 400x400px, formato quadrado 1:1)</span></p>
                          <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 cursor-pointer transition">
                             <Camera className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Upload da Foto</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFotoUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Campo Nome */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300">Nome Completo / Fantasia *</label>
                          <input
                            type="text"
                            required
                            value={perfilNome}
                            onChange={e => setPerfilNome(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                          />
                        </div>

                        {/* Campo Email Bloqueado */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-300">E-mail (Bloqueado)</label>
                            <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                              Não alterável
                            </span>
                          </div>
                          <input
                            type="email"
                            disabled
                            value={user?.email || ''}
                            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed font-mono"
                          />
                        </div>
                      </div>

                      {/* Logo da Marca */}
                      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Palette className="w-3.5 h-3.5 text-emerald-400" />
                              Sua Logo de Organizador / Marca
                            </h4>
                            <p className="text-[11px] text-slate-400">A sua logo personalizada que aparece ao lado de sua foto de perfil no topo da página de suas rifas (quando ativada). <span className="text-emerald-400 font-semibold block">(Recomendado: Logo horizontal com fundo transparente, 600x200px ou proporção 3:1)</span></p>
                          </div>
                          {perfilLogo && (
                            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 p-1 flex items-center justify-center overflow-hidden">
                              <img src={perfilLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                            </div>
                          )}
                        </div>

                        <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 cursor-pointer transition">
                          <Camera className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Upload do Logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Foto de Fundo / Capa do Perfil */}
                      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                              Foto de Fundo / Capa do Perfil
                            </h4>
                            <p className="text-[11px] text-slate-400">Exibida no topo da sua página pública de organizador. <span className="text-emerald-400 font-semibold block">(Recomendado: Banner horizontal, 1200x400px ou proporção 3:1 para melhor enquadramento)</span></p>
                          </div>
                          {perfilCapa && (
                            <div className="w-20 h-12 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden">
                              <img src={perfilCapa} alt="Capa" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>

                        <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 cursor-pointer transition">
                          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Upload da Foto de Capa</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCapaUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setModoEdicaoPerfil(false)}
                          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={salvandoPerfil}
                          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2"
                        >
                          {salvandoPerfil ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Salvar Alterações
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* SEÇÃO ALTERAR SENHA */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black text-white flex items-center gap-2">
                          <Lock className="w-4 h-4 text-amber-400" />
                          Alterar Senha da Conta
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Para sua segurança, informe sua senha atual para definir uma nova senha.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModoAlterarSenha(!modoAlterarSenha)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-xl transition"
                      >
                        {modoAlterarSenha ? 'Fechar Formatos' : 'Alterar Senha'}
                      </button>
                    </div>

                    {modoAlterarSenha && (
                      <form onSubmit={handleAlterarSenha} className="pt-4 border-t border-slate-800 space-y-4 animate-in fade-in">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300">1. Senha Atual da Conta *</label>
                          <input
                            type="password"
                            required
                            value={senhaAtual}
                            onChange={e => setSenhaAtual(e.target.value)}
                            placeholder="Digite sua senha atual"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-300">2. Nova Senha *</label>
                            <input
                              type="password"
                              required
                              value={novaSenha}
                              onChange={e => setNovaSenha(e.target.value)}
                              placeholder="Mínimo de 6 caracteres"
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-300">3. Confirmar Nova Senha *</label>
                            <input
                              type="password"
                              required
                              value={confirmarNovaSenha}
                              onChange={e => setConfirmarNovaSenha(e.target.value)}
                              placeholder="Repita a nova senha"
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            disabled={salvandoSenha}
                            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2"
                          >
                            {salvandoSenha ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Validando e Alterando Senha...
                              </>
                            ) : (
                              <>
                                <Lock className="w-4 h-4" />
                                Confirmar Alteração de Senha
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* ABA 2: MÉTODOS DE PAGAMENTO OU TAXAS DO ADMIN */}
              {(subAbaConfig === 'pix' || subAbaConfig === 'taxas') && (
                <MetodosPagamentoView 
                  authFetch={authFetch}
                  onAbrirCarteira={() => setAbaAtiva('carteira')}
                  isAdmin={user?.email?.toLowerCase() === 'wheslleyaviz@gmail.com' || Boolean(configPagamento?.isAdmin)}
                  userEmail={user?.email || ''}
                  initialAba={subAbaConfig === 'taxas' ? 'taxas' : 'gateways'}
                />
              )}

              {/* ABA 3: CARTEIRA DO SISTEMA (SUPER ADMIN) */}
              {subAbaConfig === 'carteira-sistema' && user?.email === 'wheslleyaviz@gmail.com' && (
                <div className="animate-in fade-in">
                  <React.Suspense fallback={<div className="flex justify-center p-8"><RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" /></div>}>
                    <CarteiraAdminView authFetch={authFetch} />
                  </React.Suspense>
                </div>
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
