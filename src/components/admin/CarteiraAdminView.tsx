import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Check, X, Clock, RefreshCw, Wallet, Users, 
  ArrowLeft, ArrowUpRight, Settings, User, Edit3, Lock, AlertTriangle, Zap,
  Bell, FileText, Filter, MessageSquare, TrendingUp, CheckCircle2,
  XCircle, Search, MoreVertical, Copy, ChevronRight, CheckCheck,
  Calendar, Phone, Mail, Award, DollarSign, ExternalLink, Trash2, Calculator, History, ArrowDownLeft
} from 'lucide-react';

interface CarteiraAdminViewProps {
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const CarteiraAdminView: React.FC<CarteiraAdminViewProps> = ({ authFetch }) => {
  // Controle de Visualização Principal: Dashboard Geral ou Página Dedicada "Configurações de Usuários"
  const [visao, setVisao] = useState<'dashboard' | 'configuracoes_usuarios'>('dashboard');

  // Sub-abas dentro de "Configurações de Usuários"
  const [abaConfig, setAbaConfig] = useState<'todos' | 'solicitacoes' | 'saques'>('todos');
  const [filtroSolicitacao, setFiltroSolicitacao] = useState<'todas' | 'diminuicao_taxa' | 'liberacao_carteira'>('todas');
  const [buscaUsuario, setBuscaUsuario] = useState('');

  // Dados
  const [usuariosCarteira, setUsuariosCarteira] = useState<any[]>([]);
  const [taxasPersonalizadasMap, setTaxasPersonalizadasMap] = useState<Record<string, { taxaVendaPct?: number; taxaSaqueImediato?: number; observacao?: string; atualizadoEm?: string }>>({});
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
  const [saques, setSaques] = useState<any[]>([]);
  const [carregandoSaques, setCarregandoSaques] = useState(false);
  const [processandoSaqueId, setProcessandoSaqueId] = useState<string | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [saqueParaRejeitar, setSaqueParaRejeitar] = useState<any | null>(null);

  // Taxas Globais
  const [globalTaxaVenda, setGlobalTaxaVenda] = useState(8.0);
  const [globalTaxaSaque, setGlobalTaxaSaque] = useState(5.00);
  const [modoEdicaoGlobal, setModoEdicaoGlobal] = useState(false);
  const [modalConfirmacaoOpen, setModalConfirmacaoOpen] = useState(false);
  const [salvandoGlobal, setSalvandoGlobal] = useState(false);

  // Chave Pix Master do Administrador (Recebimento de Lucros e Taxas do App)
  const [chavePixAdmin, setChavePixAdmin] = useState('');
  const [tipoChavePixAdmin, setTipoChavePixAdmin] = useState<'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'>('cpf');
  const [titularPixAdmin, setTitularPixAdmin] = useState('');
  const [salvandoPixAdmin, setSalvandoPixAdmin] = useState(false);
  const [modoEdicaoPixAdmin, setModoEdicaoPixAdmin] = useState(false);

  // Configurações e Ambiente Efí Pay (Detectado via Variáveis de Ambiente)
  const [ambienteEfipay, setAmbienteEfipay] = useState<'producao' | 'homologacao'>('producao');
  const [efipayInfo, setEfipayInfo] = useState<any>(null);

  // Painel Financeiro & Métricas Globais do Super Admin
  const [metricasFinanceiras, setMetricasFinanceiras] = useState<any | null>(null);
  const [carregandoMetricas, setCarregandoMetricas] = useState(false);
  const [modalRetiradaLucroOpen, setModalRetiradaLucroOpen] = useState(false);
  const [valorRetiradaLucro, setValorRetiradaLucro] = useState('');
  const [obsRetiradaLucro, setObsRetiradaLucro] = useState('');
  const [salvandoRetiradaLucro, setSalvandoRetiradaLucro] = useState(false);

  // Modal de Edição de Taxas (via menu 3 pontinhos)
  const [usuarioParaEditarTaxas, setUsuarioParaEditarTaxas] = useState<any | null>(null);
  const [menuAbertoId, setMenuAbertoId] = useState<string | null>(null);
  const [taxaVendaModal, setTaxaVendaModal] = useState<number | string>(8.0);
  const [taxaSaqueModal, setTaxaSaqueModal] = useState<number | string>(4.50);
  const [obsModal, setObsModal] = useState('');
  const [salvandoModal, setSalvandoModal] = useState(false);

  // Modal de Exclusão de Usuário da Carteira
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<any | null>(null);
  const [excluindoUsuario, setExcluindoUsuario] = useState(false);
  const [desvincularApenas, setDesvincularApenas] = useState(false);

  // Feedbacks e Alertas
  const [feedbackAcao, setFeedbackAcao] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [idCopiado, setIdCopiado] = useState<string | null>(null);

  // Teste de Conexão Efí Pay
  const [testandoConexao, setTestandoConexao] = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState<any>(null);
  const [copiadoTeste, setCopiadoTeste] = useState(false);
  
  // Registro de Webhook Efí Pay para saques
  const [registrandoWebhook, setRegistrandoWebhook] = useState(false);
  const [resultadoWebhook, setResultadoWebhook] = useState<{ success: boolean; detalhes: string } | null>(null);

  // Notificador temporário
  const mostrarFeedback = (tipo: 'sucesso' | 'erro', texto: string) => {
    setFeedbackAcao({ tipo, texto });
    setTimeout(() => {
      setFeedbackAcao(null);
    }, 4500);
  };

  const carregarUsuariosCarteira = async () => {
    setCarregandoUsuarios(true);
    try {
      const res = await authFetch('/api/admin/usuarios/carteira');
      if (res.ok) {
        const data = await res.json();
        setUsuariosCarteira(data.usuarios || []);
        if (data.taxasPersonalizadas) {
          setTaxasPersonalizadasMap(data.taxasPersonalizadas);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar usuários da carteira:', err);
    } finally {
      setCarregandoUsuarios(false);
    }
  };

  const carregarMetricasFinanceiras = async () => {
    setCarregandoMetricas(true);
    try {
      const res = await authFetch('/api/admin/carteira/metricas-financeiras');
      if (res.ok) {
        const data = await res.json();
        setMetricasFinanceiras(data);
        if (data.efipayStatus) {
          setAmbienteEfipay(data.efipayStatus.ambiente === 'homologacao' ? 'homologacao' : 'producao');
          setEfipayInfo(data.efipayStatus);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar métricas financeiras globais:', err);
    } finally {
      setCarregandoMetricas(false);
    }
  };

  const carregarSaques = async () => {
    setCarregandoSaques(true);
    try {
      const res = await authFetch('/api/admin/carteira/saques');
      if (res.ok) {
        const data = await res.json();
        setSaques(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao carregar saques:', err);
    } finally {
      setCarregandoSaques(false);
    }
  };

  const handleAprovarSaque = async (saqueId: string, enviarPixViaEfi: boolean) => {
    setProcessandoSaqueId(saqueId);
    try {
      const res = await authFetch(`/api/admin/carteira/saques/${saqueId}/aprovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enviarPixViaEfi })
      });
      const data = await res.json();
      if (res.ok) {
        mostrarFeedback('sucesso', enviarPixViaEfi ? 'Saque aprovado e transferência Pix realizada com sucesso via Efí Pay!' : 'Saque marcado como pago manualmente com sucesso!');
        await carregarDados();
      } else {
        mostrarFeedback('erro', data.error || 'Erro ao aprovar saque.');
      }
    } catch (err: any) {
      mostrarFeedback('erro', err.message || 'Falha ao conectar ao servidor.');
    } finally {
      setProcessandoSaqueId(null);
    }
  };

  const handleRejeitarSaque = async (saqueId: string, motivo: string) => {
    setProcessandoSaqueId(saqueId);
    try {
      const res = await authFetch(`/api/admin/carteira/saques/${saqueId}/rejeitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo })
      });
      const data = await res.json();
      if (res.ok) {
        mostrarFeedback('sucesso', 'Solicitação de saque rejeitada e saldo estornado para o organizador com sucesso!');
        setSaqueParaRejeitar(null);
        setMotivoRejeicao('');
        await carregarDados();
      } else {
        mostrarFeedback('erro', data.error || 'Erro ao rejeitar saque.');
      }
    } catch (err: any) {
      mostrarFeedback('erro', err.message || 'Falha ao conectar ao servidor.');
    } finally {
      setProcessandoSaqueId(null);
    }
  };

  const carregarDados = async () => {
    try {
      const res = await authFetch('/api/admin/configuracoes');
      const data = await res.json();
      if (res.ok && data) {
        if (data.carteiraConfig?.taxasPersonalizadas) {
          setTaxasPersonalizadasMap(data.carteiraConfig.taxasPersonalizadas);
        }
        if (data.carteiraConfig) {
          setGlobalTaxaVenda(data.carteiraConfig.taxaVendaPct ?? 8.0);
          setGlobalTaxaSaque(data.carteiraConfig.taxaSaqueImediato ?? 4.50);
          setChavePixAdmin(data.carteiraConfig.chavePixRecebimento || data.carteiraConfig.chavePix || '');
          setTipoChavePixAdmin(data.carteiraConfig.tipoChavePixRecebimento || data.carteiraConfig.tipoChavePix || 'cpf');
          setTitularPixAdmin(data.carteiraConfig.nomeTitularRecebimento || data.carteiraConfig.nome || '');
        }
      }
    } catch (e) {
      console.error('Erro ao carregar configurações:', e);
    }
    await Promise.all([
      carregarUsuariosCarteira(),
      carregarMetricasFinanceiras(),
      carregarSaques()
    ]);
  };

  // Salvar Chave Pix Master do Administrador (Para recebimento das taxas/lucros)
  const handleSalvarPixAdmin = async () => {
    setSalvandoPixAdmin(true);
    try {
      const res = await authFetch('/api/admin/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carteiraConfig: {
            chavePixRecebimento: chavePixAdmin.trim(),
            tipoChavePixRecebimento: tipoChavePixAdmin,
            nomeTitularRecebimento: titularPixAdmin.trim()
          }
        })
      });
      if (res.ok) {
        mostrarFeedback('sucesso', 'Chave Pix Master do Administrador salva com sucesso! Os lucros das taxas serão direcionados para esta conta.');
        setModoEdicaoPixAdmin(false);
      } else {
        const d = await res.json();
        mostrarFeedback('erro', d.error || 'Falha ao salvar Chave Pix Master.');
      }
    } catch (err: any) {
      mostrarFeedback('erro', err.message || 'Erro ao conectar ao servidor.');
    } finally {
      setSalvandoPixAdmin(false);
    }
  };

  // Registrar Retirada de Lucro do Super Admin
  const handleRegistrarRetiradaLucro = async () => {
    const val = Number(valorRetiradaLucro.replace(',', '.'));
    if (!val || val <= 0) {
      mostrarFeedback('erro', 'Informe um valor de retirada válido.');
      return;
    }

    setSalvandoRetiradaLucro(true);
    try {
      const res = await authFetch('/api/admin/carteira/registrar-retirada-lucro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor: val,
          descricao: obsRetiradaLucro.trim() || 'Retirada de Lucro da Plataforma'
        })
      });

      const data = await res.json();
      if (res.ok) {
        mostrarFeedback('sucesso', `Retirada de R$ ${val.toFixed(2)} registrada com sucesso!`);
        setModalRetiradaLucroOpen(false);
        setValorRetiradaLucro('');
        setObsRetiradaLucro('');
        await carregarMetricasFinanceiras();
      } else {
        mostrarFeedback('erro', data.error || 'Erro ao registrar retirada de lucro.');
      }
    } catch (e: any) {
      mostrarFeedback('erro', e.message || 'Falha ao conectar com o servidor.');
    } finally {
      setSalvandoRetiradaLucro(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Fechar menu de 3 pontinhos ao clicar fora
  useEffect(() => {
    const handleClickFora = (e: MouseEvent) => {
      if (menuAbertoId && !(e.target as HTMLElement).closest('.menu-3-pontinhos')) {
        setMenuAbertoId(null);
      }
    };
    document.addEventListener('click', handleClickFora);
    return () => document.removeEventListener('click', handleClickFora);
  }, [menuAbertoId]);

  // Cálculos de Usuários e Solicitações
  const totalCadastrados = usuariosCarteira.length;
  const usuariosAtivosCount = usuariosCarteira.filter(u => 
    u.carteiraConfig?.status === 'aprovado' || (u.faturamentoTotal && u.faturamentoTotal > 0) || (u.qtdCampanhas && u.qtdCampanhas > 0)
  ).length;

  const pendentesLiberacao = usuariosCarteira.filter(u => u.carteiraConfig?.status === 'pendente');
  const pendentesReducao = usuariosCarteira.filter(u => u.carteiraConfig?.solicitacaoReducaoTaxa?.status === 'pendente');
  const totalSolicitacoes = pendentesLiberacao.length + pendentesReducao.length;

  // Filtragem da busca na tabela de usuários
  const usuariosFiltrados = usuariosCarteira.filter(u => {
    const termo = buscaUsuario.toLowerCase().trim();
    if (!termo) return true;
    const nome = (u.nome || u.carteiraConfig?.nome || '').toLowerCase();
    const email = (u.email || u.carteiraConfig?.email || u.ownerId || '').toLowerCase();
    const doc = (u.documento || u.carteiraConfig?.documento || '').toLowerCase();
    const cel = (u.telefone || u.carteiraConfig?.telefone || '').toLowerCase();
    const id = (u.ownerId || '').toLowerCase();
    return nome.includes(termo) || email.includes(termo) || doc.includes(termo) || cel.includes(termo) || id.includes(termo);
  });

  // Ações de Solicitação: Aceitar ou Rejeitar Liberação de Carteira
  const handleAlterarStatusCarteira = async (userId: string, status: 'aprovado' | 'rejeitado') => {
    try {
      const res = await authFetch('/api/admin/configuracoes/status-carteira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status })
      });
      if (res.ok) {
        setUsuariosCarteira(prev => prev.map(u => 
          u.ownerId === userId 
            ? { ...u, carteiraConfig: { ...u.carteiraConfig, status, rejeitadoEm: status === 'rejeitado' ? Date.now() : null } } 
            : u
        ));
        if (status === 'aprovado') {
          mostrarFeedback('sucesso', 'Solicitação aceita! Carteira do usuário liberada com sucesso.');
        } else {
          mostrarFeedback('erro', 'Solicitação rejeitada. A regra de cooldown de 7 dias foi aplicada para este usuário.');
        }
      } else {
        const d = await res.json();
        mostrarFeedback('erro', d.error || 'Erro ao processar solicitação.');
      }
    } catch (err: any) {
      mostrarFeedback('erro', err.message || 'Falha de comunicação com o servidor.');
    }
  };

  // Ações de Solicitação: Aceitar ou Rejeitar Redução de Taxa
  const handleResponderReducaoTaxa = async (userId: string, status: 'aprovado' | 'rejeitado', taxaVendaAprovada?: number, taxaSaqueAprovada?: number) => {
    try {
      const res = await authFetch('/api/admin/configuracoes/status-reducao-taxa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status, taxaVendaAprovada, taxaSaqueAprovada })
      });
      const data = await res.json();
      if (res.ok) {
        setUsuariosCarteira(prev => prev.map(u => {
          if (u.ownerId === userId) {
            return {
              ...u,
              carteiraConfig: {
                ...u.carteiraConfig,
                solicitacaoReducaoTaxa: {
                  ...u.carteiraConfig?.solicitacaoReducaoTaxa,
                  status
                }
              }
            };
          }
          return u;
        }));
        if (data.taxasPersonalizadas) {
          setTaxasPersonalizadasMap(data.taxasPersonalizadas);
        }
        if (status === 'aprovado') {
          mostrarFeedback('sucesso', 'Solicitação de redução aceita! Taxas especiais aplicadas à conta do usuário.');
        } else {
          mostrarFeedback('erro', 'Solicitação de redução de taxa rejeitada.');
        }
      } else {
        mostrarFeedback('erro', data.error || 'Erro ao responder solicitação.');
      }
    } catch (e: any) {
      mostrarFeedback('erro', e.message || 'Erro ao conectar ao servidor.');
    }
  };

  // Salvar Taxas Personalizadas do Modal (3 pontinhos)
  const handleSalvarTaxaModal = async (remover: boolean = false) => {
    if (!usuarioParaEditarTaxas) return;
    setSalvandoModal(true);
    try {
      const targetUser = usuarioParaEditarTaxas.ownerId;
      const res = await authFetch('/api/admin/usuarios/taxa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUser,
          taxaVendaPct: Number(taxaVendaModal),
          taxaSaqueImediato: Number(taxaSaqueModal),
          observacao: obsModal.trim() || 'Definida pelo Administrador',
          remover
        })
      });
      const data = await res.json();
      if (res.ok && data.taxasPersonalizadas) {
        setTaxasPersonalizadasMap(data.taxasPersonalizadas);
        mostrarFeedback('sucesso', remover ? 'Taxa personalizada removida. Usuário volta a utilizar as taxas globais.' : 'Taxas personalizadas salvas com sucesso!');
        setUsuarioParaEditarTaxas(null);
        await carregarUsuariosCarteira();
      } else {
        mostrarFeedback('erro', data.error || 'Erro ao salvar taxas.');
      }
    } catch (e: any) {
      mostrarFeedback('erro', e.message || 'Erro na requisição.');
    } finally {
      setSalvandoModal(false);
    }
  };

  // Enviar Mensagem no WhatsApp do Usuário
  const handleAbrirWhatsapp = (u: any) => {
    const rawTelefone = u.telefone || u.carteiraConfig?.telefone || '';
    const cleanPhone = rawTelefone.replace(/\D/g, '');

    if (!cleanPhone) {
      mostrarFeedback('erro', 'Este usuário não possui número de celular cadastrado.');
      return;
    }

    // Se o número tiver 10 ou 11 dígitos (DDD + número), adiciona código do Brasil (55)
    let fullPhone = cleanPhone;
    if (fullPhone.length === 10 || fullPhone.length === 11) {
      fullPhone = `55${fullPhone}`;
    }

    const nome = u.nome || u.carteiraConfig?.nome || 'Organizador';
    const textoPadrao = `Olá ${nome}, tudo bem? Sou o administrador da plataforma de rifas.`;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(textoPadrao)}`;

    window.open(url, '_blank');
    mostrarFeedback('sucesso', `Abrindo conversa do WhatsApp com ${nome}...`);
  };

  // Excluir ou Desvincular Usuário da Carteira do Sistema
  const handleExcluirUsuario = async () => {
    if (!usuarioParaExcluir) return;
    setExcluindoUsuario(true);
    try {
      const res = await authFetch('/api/admin/usuarios/excluir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: usuarioParaExcluir.ownerId,
          email: usuarioParaExcluir.email || usuarioParaExcluir.carteiraConfig?.email,
          desvincularApenas
        })
      });

      const data = await res.json();
      if (res.ok) {
        mostrarFeedback('sucesso', desvincularApenas 
          ? `Carteira de ${usuarioParaExcluir.nome || usuarioParaExcluir.ownerId} desvinculada com sucesso!` 
          : `Usuário ${usuarioParaExcluir.nome || usuarioParaExcluir.ownerId} excluído da carteira do sistema com sucesso!`);
        setUsuarioParaExcluir(null);
        await carregarUsuariosCarteira();
      } else {
        mostrarFeedback('erro', data.error || 'Erro ao excluir usuário.');
      }
    } catch (e: any) {
      mostrarFeedback('erro', e.message || 'Falha ao conectar com o servidor.');
    } finally {
      setExcluindoUsuario(false);
    }
  };

  // Salvar Taxas Globais
  const handleSalvarGlobal = async () => {
    setSalvandoGlobal(true);
    try {
      const res = await authFetch('/api/admin/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carteiraConfig: {
            taxaVendaPct: Number(globalTaxaVenda),
            taxaSaqueImediato: Number(globalTaxaSaque)
          }
        })
      });
      if (res.ok) {
        mostrarFeedback('sucesso', 'Taxas globais salvas com sucesso para todos os organizadores.');
        setModoEdicaoGlobal(false);
        setModalConfirmacaoOpen(false);
      } else {
        const d = await res.json();
        mostrarFeedback('erro', d.error || 'Falha ao salvar taxas globais.');
      }
    } catch (err: any) {
      mostrarFeedback('erro', err.message || 'Erro de rede ao salvar taxas globais.');
    } finally {
      setSalvandoGlobal(false);
    }
  };

  // Testar conexão Efí Pay
  const handleTestarConexao = async () => {
    setTestandoConexao(true);
    setResultadoTeste(null);
    try {
      const res = await authFetch('/api/admin/carteira/testar-conexao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setResultadoTeste(data);
    } catch (err: any) {
      setResultadoTeste({
        success: false,
        details: err.message || 'Falha ao conectar com o servidor.'
      });
    } finally {
      setTestandoConexao(false);
    }
  };

  // Registrar Webhook Efí Pay para Saques Automáticos (Evitar erro conta_chave_sem_webhook)
  const handleRegistrarWebhook = async () => {
    setRegistrandoWebhook(true);
    setResultadoWebhook(null);
    try {
      const res = await authFetch('/api/admin/efipay/register-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setResultadoWebhook(data);
      if (data.success) {
        mostrarFeedback('sucesso', 'Webhook cadastrado com sucesso na Efí Pay! Saques automáticos via Pix liberados.');
      } else {
        mostrarFeedback('erro', data.detalhes || 'Falha ao registrar webhook.');
      }
    } catch (err: any) {
      setResultadoWebhook({
        success: false,
        detalhes: err.message || 'Falha ao conectar com o servidor.'
      });
      mostrarFeedback('erro', err.message || 'Falha ao conectar com o servidor.');
    } finally {
      setRegistrandoWebhook(false);
    }
  };

  // Helper para cálculo de idade
  const calcularIdade = (dataNascimento: string | null | undefined): string => {
    if (!dataNascimento) return '-';
    try {
      const partes = dataNascimento.includes('-') ? dataNascimento.split('-') : dataNascimento.split('/');
      let ano = 0, mes = 0, dia = 0;
      if (dataNascimento.includes('-')) {
        ano = parseInt(partes[0]);
        mes = parseInt(partes[1]) - 1;
        dia = parseInt(partes[2]);
      } else {
        dia = parseInt(partes[0]);
        mes = parseInt(partes[1]) - 1;
        ano = parseInt(partes[2]);
      }
      const hoje = new Date();
      let idade = hoje.getFullYear() - ano;
      const m = hoje.getMonth() - mes;
      if (m < 0 || (m === 0 && hoje.getDate() < dia)) {
        idade--;
      }
      return idade > 0 && idade < 120 ? `${idade} anos` : '-';
    } catch (e) {
      return '-';
    }
  };

  // Helper para formatação de data
  const formatarData = (iso: string | null | undefined): string => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
      return '-';
    }
  };

  const copiarTexto = (texto: string, id: string) => {
    navigator.clipboard.writeText(texto);
    setIdCopiado(id);
    setTimeout(() => setIdCopiado(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* FEEDBACK FLUTUANTE / NOTIFICAÇÃO */}
      {feedbackAcao && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-2xl transition-all animate-in slide-in-from-top-2 duration-300 ${
          feedbackAcao.tipo === 'sucesso' 
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {feedbackAcao.tipo === 'sucesso' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
            <span>{feedbackAcao.texto}</span>
          </div>
          <button type="button" onClick={() => setFeedbackAcao(null)} className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISÃO 1: DASHBOARD GERAL (Cards de Usuários, Taxas Globais, Efí Pay)     */}
      {/* ========================================================================= */}
      {visao === 'dashboard' && (
        <div className="space-y-6">

          {/* CABEÇALHO DO PAINEL ADMIN */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white">Carteira & Gestão de Usuários</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Super Admin
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gerencie as contas dos organizadores, solicitações de liberação e regras tarifárias.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={carregarDados}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition flex items-center gap-2 self-start sm:self-auto shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${carregandoUsuarios || carregandoMetricas ? 'animate-spin' : ''}`} />
              Atualizar Métricas
            </button>
          </div>

          {/* ===================================================================== */}
          {/* SEÇÃO 1: PAINEL FINANCEIRO GLOBAL DO SUPER ADMIN (5 HERO CARDS)       */}
          {/* ===================================================================== */}
          
          {/* ===================================================================== */}
          {/* SEÇÃO 1: PAINEL FINANCEIRO GLOBAL DO SUPER ADMIN (5 HERO CARDS)       */}
          {/* ===================================================================== */}
          
          {(() => {
            const safeMetricas = metricasFinanceiras || {
              saldoRealBanco: null,
              saldoCustodiaOrganizadores: 0,
              lucroDisponivelParaRetirada: 0,
              totalSacadoOrganizadores: 0,
              totalLucroRetiradoAdmin: 0,
              saldoTotalNaEfi: 0
            };
            const isRealBanco = safeMetricas.saldoRealBanco !== null && safeMetricas.saldoRealBanco !== undefined;
            const valorExibido = isRealBanco ? safeMetricas.saldoRealBanco : (safeMetricas.saldoTotalNaEfi || 0);

            return (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-in fade-in">
                  
                  {/* CARD 1: SALDO TOTAL */}
                  <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 border border-sky-500/30 rounded-3xl space-y-3 shadow-xl relative overflow-hidden group hover:border-sky-500/50 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5" />
                        Saldo Total
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                        <DollarSign className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-sky-400 font-mono tracking-tight">
                        R$ {Number(valorExibido).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] mt-1.5 flex items-center gap-1 font-bold">
                        <span className={`w-1.5 h-1.5 rounded-full ${isRealBanco ? 'bg-emerald-400 animate-pulse' : 'bg-sky-400'}`}></span>
                        <span className={isRealBanco ? 'text-emerald-400' : 'text-sky-300'}>
                          {isRealBanco ? '100% Real via API Efí Pay' : 'Calculado via banco de dados'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: SALDO DOS USUÁRIOS (CUSTÓDIA) */}
                  <div className="p-5 bg-slate-950 border border-slate-800/90 rounded-3xl space-y-3 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-purple-400" />
                        Saldo dos Usuários
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-purple-300 font-mono tracking-tight">
                        R$ {Number(safeMetricas.saldoCustodiaOrganizadores).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] mt-1.5 flex items-center gap-1 font-bold">
                        <span className={`w-1.5 h-1.5 rounded-full ${isRealBanco ? 'bg-purple-400' : 'bg-purple-400/70'}`}></span>
                        <span className={isRealBanco ? 'text-slate-400' : 'text-purple-300/80'}>
                          {isRealBanco ? 'Soma em custódia dos usuários' : 'Conciliado pelas vendas da plataforma'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: SALDO DISPONÍVEL PARA SAQUE (LUCRO DO ADMIN SUBTRAINDO TAXAS) */}
                  <div className="p-5 bg-gradient-to-br from-emerald-950/60 via-slate-950 to-slate-950 border border-emerald-500/40 rounded-3xl space-y-3 shadow-xl relative overflow-hidden group hover:border-emerald-500/70 transition flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" />
                          Saldo p/ Saque (Seu Lucro)
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight mt-1.5">
                        R$ {Number(safeMetricas.lucroDisponivelParaRetirada).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] mt-1 flex items-center gap-1 font-bold">
                        <span className={`w-1.5 h-1.5 rounded-full ${isRealBanco ? 'bg-emerald-400' : 'bg-emerald-400/70'}`}></span>
                        <span className={isRealBanco ? 'text-slate-400' : 'text-emerald-300/80'}>
                          {isRealBanco ? 'Seu lucro real líquido retido' : 'Lucro das taxas de vendas retidas'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setModalRetiradaLucroOpen(true)}
                      className="w-full mt-2 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Sacar Lucro via Pix
                    </button>
                  </div>

                  {/* CARD 4: TOTAL SACADO POR USUÁRIOS */}
                  <div className="p-5 bg-slate-950 border border-slate-800/90 rounded-3xl space-y-3 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <ArrowDownLeft className="w-3.5 h-3.5 text-amber-400" />
                        Sacado por Usuários
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                        R$ {Number(safeMetricas.totalSacadoOrganizadores).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1.5">
                        Total sacado pelos usuários
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: TOTAL SACADO GERAL (USUÁRIOS + ADMIN RETIRADAS) */}
                  <div className="p-5 bg-slate-950 border border-slate-800/90 rounded-3xl space-y-3 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                        Total Sacado
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-purple-300 font-mono tracking-tight">
                        R$ {Number((safeMetricas.totalSacadoOrganizadores || 0) + (safeMetricas.totalLucroRetiradoAdmin || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1.5">
                        Total de saques (Usuários + Seu)
                      </div>
                    </div>
                  </div>

                </div>

                {!isRealBanco && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-[11px] text-amber-300 font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse"></span>
                    <span>Informação indisponível no momento</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* GRID DE CARDS PRINCIPAIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* CARD 1: USUÁRIOS (COM QUANTIDADE ATIVA E BOTÃO CONFIGURAÇÕES DE USUÁRIOS) */}
            <div className="p-6 bg-slate-950 border border-slate-800 hover:border-slate-700/80 rounded-3xl space-y-5 shadow-2xl relative overflow-hidden flex flex-col justify-between group transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">Usuários</h3>
                      <p className="text-xs text-slate-400">Controle e cadastro de organizadores</p>
                    </div>
                  </div>

                  {totalSolicitacoes > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-500 text-white flex items-center gap-1.5 animate-pulse shadow-lg shadow-rose-500/30">
                      <Bell className="w-3 h-3" />
                      {totalSolicitacoes} {totalSolicitacoes === 1 ? 'solicitação' : 'solicitações'}
                    </span>
                  )}
                </div>

                {/* MÉTRICAS DE USUÁRIOS */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800/80">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Usuários Ativos</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-2xl font-black text-emerald-400 font-mono">{usuariosAtivosCount}</span>
                      <span className="text-[11px] text-slate-500">ativos</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800/80">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Total Cadastrados</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-2xl font-black text-white font-mono">{totalCadastrados}</span>
                      <span className="text-[11px] text-slate-500">contas</span>
                    </div>
                  </div>
                </div>

                {/* AVISO DE SOLICITAÇÕES SE HOUVER */}
                {totalSolicitacoes > 0 ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                      <Bell className="w-3.5 h-3.5 text-amber-400" />
                      Solicitações aguardando resposta:
                    </div>
                    <div className="text-slate-300 text-[11px] flex flex-wrap gap-2">
                      {pendentesLiberacao.length > 0 && (
                        <span>• <strong>{pendentesLiberacao.length}</strong> liberação de carteira</span>
                      )}
                      {pendentesReducao.length > 0 && (
                        <span>• <strong>{pendentesReducao.length}</strong> redução de taxas</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-900/50 border border-slate-800/60 rounded-2xl text-xs text-slate-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Nenhuma solicitação pendente no momento.</span>
                  </div>
                )}
              </div>

              {/* BOTÃO PRINCIPAL: CONFIGURAÇÕES DE USUÁRIOS */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setVisao('configuracoes_usuarios');
                    setAbaConfig(totalSolicitacoes > 0 ? 'solicitacoes' : 'todos');
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-2xl shadow-xl shadow-sky-500/20 transition flex items-center justify-center gap-2 group-hover:scale-[1.01]"
                >
                  <Settings className="w-4 h-4" />
                  Configurações de Usuários
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>

            {/* CARD 2: TAXAS GLOBAIS DO SISTEMA */}
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-5 shadow-2xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">Taxas Globais do Sistema</h3>
                      <p className="text-xs text-slate-400">Padrão aplicado aos organizadores</p>
                    </div>
                  </div>

                  {!modoEdicaoGlobal ? (
                    <button
                      type="button"
                      onClick={() => setModoEdicaoGlobal(true)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Editar Taxas
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                      Modo Edição
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                      Taxa sobre Vendas (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      disabled={!modoEdicaoGlobal}
                      value={globalTaxaVenda}
                      onChange={e => setGlobalTaxaVenda(e.target.value === '' ? '' : e.target.value)}
                      className={`w-full border rounded-2xl px-3.5 py-2.5 text-sm font-mono font-bold focus:outline-none transition ${
                        modoEdicaoGlobal
                          ? 'bg-slate-900 border-amber-500 text-white focus:border-amber-400 shadow-inner'
                          : 'bg-slate-900/50 border-slate-800 text-emerald-400 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                      Tarifa por Saque (R$)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      disabled={!modoEdicaoGlobal}
                      value={globalTaxaSaque}
                      onChange={e => setGlobalTaxaSaque(e.target.value === '' ? '' : e.target.value)}
                      className={`w-full border rounded-2xl px-3.5 py-2.5 text-sm font-mono font-bold focus:outline-none transition ${
                        modoEdicaoGlobal
                          ? 'bg-slate-900 border-amber-500 text-white focus:border-amber-400 shadow-inner'
                          : 'bg-slate-900/50 border-slate-800 text-sky-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Essas tarifas são cobradas automaticamente sobre cada rifa paga e solicitação de transferência Pix para os organizadores que utilizam a carteira master.
                </p>
              </div>

              {modoEdicaoGlobal ? (
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      carregarDados();
                      setModoEdicaoGlobal(false);
                    }}
                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-2xl border border-slate-800 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalConfirmacaoOpen(true)}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Salvar Taxas
                  </button>
                </div>
              ) : (
                <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                  <span>Taxas protegidas contra alterações acidentais.</span>
                </div>
              )}
            </div>
          </div>

          {/* SEÇÃO 2: CHAVE PIX MASTER DO ADMINISTRADOR (RECEBIMENTO DE LUCROS/TAXAS) */}
          <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-5 shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Chave Pix Master (Suas Taxas)</h3>
                    <p className="text-xs text-slate-400">Conta de destino do seu lucro sobre vendas e saques</p>
                  </div>
                </div>

                {!modoEdicaoPixAdmin ? (
                  <button
                    type="button"
                    onClick={() => setModoEdicaoPixAdmin(true)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Editar Chave
                  </button>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                    Editando
                  </span>
                )}
              </div>

              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Tipo</label>
                    <select
                      disabled={!modoEdicaoPixAdmin}
                      value={tipoChavePixAdmin}
                      onChange={e => setTipoChavePixAdmin(e.target.value as any)}
                      className={`w-full border rounded-2xl px-3 py-2 text-xs font-bold focus:outline-none transition ${
                        modoEdicaoPixAdmin
                          ? 'bg-slate-900 border-emerald-500 text-white'
                          : 'bg-slate-900/50 border-slate-800 text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="email">E-mail</option>
                      <option value="telefone">Telefone</option>
                      <option value="aleatoria">Aleatória</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Chave Pix</label>
                    <input
                      type="text"
                      disabled={!modoEdicaoPixAdmin}
                      placeholder="Ex: 000.000.000-00 ou seu@email.com"
                      value={chavePixAdmin}
                      onChange={e => setChavePixAdmin(e.target.value)}
                      className={`w-full border rounded-2xl px-3.5 py-2 text-xs font-mono font-bold focus:outline-none transition ${
                        modoEdicaoPixAdmin
                          ? 'bg-slate-900 border-emerald-500 text-white focus:border-emerald-400'
                          : 'bg-slate-900/50 border-slate-800 text-emerald-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Titular / Banco (Opcional)</label>
                  <input
                    type="text"
                    disabled={!modoEdicaoPixAdmin}
                    placeholder="Ex: Wheslley Aviz - Banco Inter / Nubank"
                    value={titularPixAdmin}
                    onChange={e => setTitularPixAdmin(e.target.value)}
                    className={`w-full border rounded-2xl px-3.5 py-2 text-xs font-bold focus:outline-none transition ${
                      modoEdicaoPixAdmin
                        ? 'bg-slate-900 border-emerald-500 text-white focus:border-emerald-400'
                        : 'bg-slate-900/50 border-slate-800 text-slate-300 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Como funciona o fluxo de recebimento:
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  1. <strong>Pagamento:</strong> O comprador paga o Pix ➔ 100% entra na sua conta Efí Pay central.
                  <br />
                  2. <strong>Cálculo:</strong> O sistema desconta a taxa de porcentagem (ex: {globalTaxaVenda}%) como seu lucro.
                  <br />
                  3. <strong>Saque:</strong> Ao sacar, o organizador paga a taxa (ex: R$ {Number(globalTaxaSaque).toFixed(2)}) e você recebe a transferência líquida das taxas para a sua chave Pix cadastrada acima.
                </p>
              </div>
            </div>

            {modoEdicaoPixAdmin && (
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    carregarDados();
                    setModoEdicaoPixAdmin(false);
                  }}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-2xl border border-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={salvandoPixAdmin}
                  onClick={handleSalvarPixAdmin}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
                >
                  {salvandoPixAdmin ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Salvar Chave Pix
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VISÃO 2: PÁGINA DEDICADA "CONFIGURAÇÕES DE USUÁRIOS" (Tabela e Solicitações) */}
      {/* ========================================================================= */}
      {visao === 'configuracoes_usuarios' && (
        <div className="space-y-6">

          {/* BARRA SUPERIOR: BOTÃO VOLTAR E ABAS DEDICADAS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-2xl">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setVisao('dashboard')}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl border border-slate-800 transition flex items-center gap-1.5 text-xs font-bold"
                title="Voltar ao Painel Geral"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Voltar</span>
              </button>

              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  Configurações de Usuários
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {usuariosCarteira.length} Usuários
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Tabela de cadastro estilo planilha e gestão de solicitações</p>
              </div>
            </div>

            {/* ABAS NO TOPO DIREITO: TODOS OS USUÁRIOS, SOLICITAÇÕES & SAQUES */}
            <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto flex-wrap">
              <button
                type="button"
                onClick={() => setAbaConfig('todos')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                  abaConfig === 'todos'
                    ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                Todos os Usuários
              </button>

              <button
                type="button"
                onClick={() => setAbaConfig('solicitacoes')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 relative ${
                  abaConfig === 'solicitacoes'
                    ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Bell className="w-4 h-4" />
                Solicitações
                {totalSolicitacoes > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    abaConfig === 'solicitacoes' ? 'bg-slate-950 text-sky-400' : 'bg-rose-500 text-white animate-pulse'
                  }`}>
                    {totalSolicitacoes}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setAbaConfig('saques')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 relative ${
                  abaConfig === 'saques'
                    ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                Saques Organizados
                {saques.filter(s => s.status === 'pendente').length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    abaConfig === 'saques' ? 'bg-slate-950 text-sky-400' : 'bg-amber-500 text-slate-950 animate-pulse'
                  }`}>
                    {saques.filter(s => s.status === 'pendente').length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SUB-ABA: SOLICITAÇÕES (LIBERAÇÃO DE CARTEIRA & REDUÇÃO DE TAXAS)           */}
          {/* ========================================================================= */}
          {abaConfig === 'solicitacoes' && (
            <div className="space-y-5 animate-in fade-in">
              
              {/* FILTROS SUPERIORES DE SOLICITAÇÃO */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-bold">
                  <Filter className="w-4 h-4 text-sky-400" />
                  <span>Filtrar por tipo de solicitação:</span>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setFiltroSolicitacao('todas')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      filtroSolicitacao === 'todas' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todas ({totalSolicitacoes})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroSolicitacao('liberacao_carteira')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      filtroSolicitacao === 'liberacao_carteira' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Uso da Carteira ({pendentesLiberacao.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroSolicitacao('diminuicao_taxa')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      filtroSolicitacao === 'diminuicao_taxa' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Diminuição de Taxa ({pendentesReducao.length})
                  </button>
                </div>
              </div>

              {/* LISTA DE SOLICITAÇÕES */}
              {totalSolicitacoes === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs bg-slate-950 rounded-3xl border border-dashed border-slate-800 space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
                  <h4 className="text-sm font-black text-slate-200">Nenhuma solicitação pendente</h4>
                  <p className="text-slate-500 max-w-sm mx-auto">
                    Todas as solicitações de liberação da carteira do sistema e diminuição de taxas foram atendidas.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">

                  {/* 1. SOLICITAÇÕES DE USO DA CARTEIRA DO SISTEMA */}
                  {(filtroSolicitacao === 'todas' || filtroSolicitacao === 'liberacao_carteira') && pendentesLiberacao.map(u => (
                    <div key={`lib-${u.ownerId}`} className="p-5 bg-slate-950 border border-emerald-500/30 rounded-3xl space-y-4 shadow-xl relative overflow-hidden animate-in fade-in">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Solicitação de Uso da Carteira do Sistema
                          </span>
                          <h4 className="text-base font-black text-white mt-1.5">{u.nome || u.carteiraConfig?.nome || 'Usuário Sem Nome'}</h4>
                          <p className="text-xs text-slate-400 font-mono">{u.email || u.carteiraConfig?.email || u.ownerId}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1.5 bg-slate-900 text-emerald-400 font-mono text-xs font-bold rounded-xl border border-slate-800">
                            Faturamento: R$ {(u.faturamentoTotal || 0).toFixed(2)}
                          </span>
                          <span className="px-3 py-1.5 bg-slate-900 text-sky-400 font-mono text-xs font-bold rounded-xl border border-slate-800">
                            {u.qtdCampanhas || 0} Campanhas
                          </span>
                        </div>
                      </div>

                      {/* INFORMAÇÕES COMPLETAS DO USUÁRIO */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800/80 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[11px]">CPF / CNPJ:</span>
                          <span className="text-white font-mono font-bold">{u.documento || u.carteiraConfig?.documento || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Celular (WhatsApp):</span>
                          <span className="text-white font-bold">{u.telefone || u.carteiraConfig?.telefone || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Idade / Nascimento:</span>
                          <span className="text-white font-bold">
                            {calcularIdade(u.dataNascimento || u.carteiraConfig?.dataNascimento)} ({formatarData(u.dataNascimento || u.carteiraConfig?.dataNascimento)})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Chave Pix para Saque:</span>
                          <span className="text-emerald-400 font-mono font-bold truncate block">
                            {u.carteiraConfig?.chavePix || '-'} ({u.carteiraConfig?.tipoChavePix || 'pix'})
                          </span>
                        </div>
                      </div>

                      {/* BOTÕES: ACEITAR E REJEITAR */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        <span className="text-[11px] text-slate-400 leading-relaxed">
                          Ao <strong>Rejeitar</strong>, o usuário ficará em cooldown de <strong>7 dias</strong> antes de poder enviar nova solicitação.
                        </span>

                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => handleAlterarStatusCarteira(u.ownerId, 'rejeitado')}
                            className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4 text-rose-400" />
                            Rejeitar (7 dias)
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAlterarStatusCarteira(u.ownerId, 'aprovado')}
                            className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Aceitar Solicitação
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* 2. SOLICITAÇÕES DE DIMINUIÇÃO DE TAXA */}
                  {(filtroSolicitacao === 'todas' || filtroSolicitacao === 'diminuicao_taxa') && pendentesReducao.map(u => {
                    const sol = u.carteiraConfig?.solicitacaoReducaoTaxa || {};
                    return (
                      <div key={`red-${u.ownerId}`} className="p-5 bg-slate-950 border border-amber-500/40 rounded-3xl space-y-4 shadow-xl relative overflow-hidden animate-in fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                          <div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Solicitação de Diminuição de Taxa
                            </span>
                            <h4 className="text-base font-black text-white mt-1.5">{u.nome || u.carteiraConfig?.nome || 'Usuário Sem Nome'}</h4>
                            <p className="text-xs text-slate-400 font-mono">{u.email || u.carteiraConfig?.email || u.ownerId}</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <div className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-mono">
                              <span className="text-slate-400 block text-[10px]">Taxa Venda Pedida:</span>
                              <span className="text-amber-300 font-bold">{sol.taxaVendaDesejada}%</span>
                            </div>
                            <div className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-mono">
                              <span className="text-slate-400 block text-[10px]">Taxa Saque Pedida:</span>
                              <span className="text-amber-300 font-bold">R$ {(Number(sol.taxaSaqueDesejada) || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* JUSTIFICATIVA E DADOS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1">
                            <span className="text-slate-400 font-bold flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                              Mensagem / Justificativa do Usuário:
                            </span>
                            <p className="text-slate-200 italic leading-relaxed">
                              "{sol.mensagem || 'O usuário não incluiu uma mensagem detalhada.'}"
                            </p>
                          </div>

                          <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1 font-mono">
                            <span className="text-slate-400 font-bold block font-sans">Histórico do Organizador:</span>
                            <div className="flex justify-between text-slate-300">
                              <span>Faturamento Total:</span>
                              <span className="text-emerald-400 font-bold">R$ {(u.faturamentoTotal || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span>Total de Campanhas:</span>
                              <span className="text-sky-400 font-bold">{u.qtdCampanhas || 0}</span>
                            </div>
                            <div className="flex justify-between text-slate-400 text-[10px]">
                              <span>Data da Solicitação:</span>
                              <span>{formatarData(sol.enviadoEm)}</span>
                            </div>
                          </div>
                        </div>

                        {/* BOTÕES: ACEITAR E REJEITAR REDUÇÃO */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                          <span className="text-[11px] text-slate-400">
                            Ao aceitar, as taxas solicitadas entrarão em vigor imediatamente na conta deste usuário.
                          </span>

                          <div className="flex items-center gap-2.5 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => handleResponderReducaoTaxa(u.ownerId, 'rejeitado')}
                              className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                            >
                              <XCircle className="w-4 h-4 text-rose-400" />
                              Rejeitar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleResponderReducaoTaxa(u.ownerId, 'aprovado', sol.taxaVendaDesejada, sol.taxaSaqueDesejada)}
                              className="flex-1 sm:flex-none px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Aceitar e Aplicar Taxas
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-ABA: SAQUES ORGANIZADOS (MANUAL APPROVAL WORKFLOW)                   */}
          {/* ========================================================================= */}
          {abaConfig === 'saques' && (
            <div className="space-y-5 animate-in fade-in">
              {/* METRICAS RAPIDAS DE SAQUE */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pendentes de Aprovação</span>
                  <span className="text-xl font-black text-amber-400 font-mono block mt-1">
                    {saques.filter(s => s.status === 'pendente').length} solicitações
                  </span>
                </div>
                <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Pago aos Organizadores</span>
                  <span className="text-xl font-black text-emerald-400 font-mono block mt-1">
                    R$ {saques
                      .filter(s => s.status === 'pago' || s.status === 'aprovado')
                      .reduce((sum, s) => sum + (Number(s.valorSolicitado) || 0), 0)
                      .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total de Taxas Coletadas</span>
                  <span className="text-xl font-black text-sky-400 font-mono block mt-1">
                    R$ {saques
                      .filter(s => s.status === 'pago' || s.status === 'aprovado')
                      .reduce((sum, s) => sum + (Number(s.taxaSaque) || 0), 0)
                      .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* LISTA DE SAQUES */}
              <div className="bg-slate-900/80 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-white text-base">Solicitações de Saque</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Gerencie os saques solicitados pelos organizadores da plataforma</p>
                  </div>
                  <button
                    type="button"
                    onClick={carregarSaques}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition"
                    title="Atualizar lista"
                  >
                    <RefreshCw className={`w-4 h-4 ${carregandoSaques ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {carregandoSaques ? (
                  <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
                    <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
                    <p className="text-xs font-medium">Carregando histórico de saques da plataforma...</p>
                  </div>
                ) : saques.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-xs font-semibold">Nenhuma solicitação de saque cadastrada até o momento.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/80">
                    {saques.map((s) => {
                      const isPendente = s.status === 'pendente';
                      const isPago = s.status === 'pago' || s.status === 'aprovado';
                      const isRejeitado = s.status === 'rejeitado';
                      
                      // Encontra dados do usuário correspondente
                      const userObj = usuariosCarteira.find(u => u.ownerId === s.ownerId);
                      const userName = userObj?.nome || s.ownerName || 'Organizador';
                      const userEmail = userObj?.email || s.ownerEmail || 'E-mail não informado';

                      return (
                        <div key={s.id} className={`p-5 transition ${isPendente ? 'bg-amber-950/10' : ''}`}>
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            
                            {/* INFO DO SOLICITANTE */}
                            <div className="space-y-1.5 flex-1 min-w-[200px]">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-white text-sm">{userName}</span>
                                <span className="text-[10px] text-slate-500 font-mono">ID: {s.ownerId?.slice(0, 8)}...</span>
                                {isPendente && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                                    Pendente
                                  </span>
                                )}
                                {isPago && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    Pago/Aprovado
                                  </span>
                                )}
                                {isRejeitado && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                    Rejeitado
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                                <span>{userEmail}</span>
                                <span className="text-slate-600">•</span>
                                <span>Solicitado em: {s.criadoEm ? new Date(s.criadoEm).toLocaleDateString('pt-BR') + ' ' + new Date(s.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Data indisponível'}</span>
                              </div>
                            </div>

                            {/* VALORES */}
                            <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800/80 min-w-[260px]">
                              <div className="text-center">
                                <span className="text-[9px] text-slate-500 font-bold uppercase block">Solicitado</span>
                                <span className="text-xs font-black text-slate-300 font-mono">
                                  R$ {Number(s.valorSolicitado).toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                              <div className="text-center border-x border-slate-800/80 px-2">
                                <span className="text-[9px] text-slate-500 font-bold uppercase block">Taxa</span>
                                <span className="text-xs font-black text-rose-400/90 font-mono">
                                  - R$ {Number(s.taxaSaque).toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                              <div className="text-center">
                                <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Líquido</span>
                                <span className="text-xs font-black text-emerald-400 font-mono">
                                  R$ {Number(s.valorLiquido).toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            </div>

                            {/* DADOS PIX */}
                            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/50 min-w-[220px] flex items-center justify-between gap-2.5">
                              <div>
                                <span className="text-[9px] text-slate-500 font-bold uppercase block">Destinatário Pix</span>
                                <span className="text-xs font-black text-slate-200 block truncate max-w-[170px] mt-0.5">
                                  {s.chavePix}
                                </span>
                                <span className="text-[9px] text-slate-400 font-medium uppercase mt-0.5 block">
                                  Chave: {s.tipoChavePix || 'pix'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(s.chavePix || '');
                                  mostrarFeedback('sucesso', 'Chave Pix copiada para a área de transferência!');
                                }}
                                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition shrink-0 border border-slate-800"
                                title="Copiar Chave Pix"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>

                          </div>

                          {/* HISTÓRICO / OBSERVAÇÕES */}
                          {s.observacao && (
                            <div className="mt-3 bg-slate-950/40 px-3.5 py-2.5 rounded-xl border border-slate-800/60 text-[11px] text-slate-400">
                              <span className="font-bold text-slate-300 block mb-0.5">Histórico do Saque:</span>
                              {s.observacao}
                            </div>
                          )}

                          {/* PAINEL DE AÇÃO SE PENDENTE */}
                          {isPendente && (
                            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/50">
                              <span className="text-[10px] text-amber-500/90 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Confirme as informações bancárias e a chave Pix antes de efetuar o pagamento.
                              </span>

                              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                                <button
                                  type="button"
                                  disabled={processandoSaqueId !== null}
                                  onClick={() => setSaqueParaRejeitar(s)}
                                  className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                                >
                                  <X className="w-4 h-4 text-rose-400" />
                                  Rejeitar
                                </button>

                                <button
                                  type="button"
                                  disabled={processandoSaqueId !== null}
                                  onClick={() => handleAprovarSaque(s.id, false)}
                                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                                  title="Aprova no sistema sem disparar API Efí"
                                >
                                  <Check className="w-4 h-4 text-slate-400" />
                                  Pagar Manualmente
                                </button>

                                <button
                                  type="button"
                                  disabled={processandoSaqueId !== null}
                                  onClick={() => handleAprovarSaque(s.id, true)}
                                  className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
                                >
                                  {processandoSaqueId === s.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Zap className="w-4 h-4 fill-slate-950" />
                                  )}
                                  Aprovar e Enviar Pix (Efí)
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-ABA: TODOS OS USUÁRIOS (TABELA FORMATO PLANILHA COMPLETA)             */}
          {/* ========================================================================= */}
          {/* ========================================================================= */}
          {abaConfig === 'todos' && (
            <div className="space-y-4 animate-in fade-in">

              {/* BARRA DE PESQUISA & ATUALIZAÇÃO */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="relative w-full sm:w-96">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={buscaUsuario}
                    onChange={e => setBuscaUsuario(e.target.value)}
                    placeholder="Buscar por nome, email, CPF/CNPJ ou ID..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                  />
                  {buscaUsuario && (
                    <button type="button" onClick={() => setBuscaUsuario('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-xs text-slate-400 font-mono">
                    Exibindo <strong>{usuariosFiltrados.length}</strong> de <strong>{usuariosCarteira.length}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={carregarUsuariosCarteira}
                    className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition"
                    title="Atualizar Tabela"
                  >
                    <RefreshCw className={`w-4 h-4 ${carregandoUsuarios ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* TABELA ESTILO PLANILHA (SPREADSHEET VIEW) */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
                    
                    {/* CABEÇALHO DA PLANILHA */}
                    <thead>
                      <tr className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px] tracking-wider sticky top-0 z-10">
                        <th className="p-3.5 pl-5">Nome do Usuário</th>
                        <th className="p-3.5">Idade / Nasc.</th>
                        <th className="p-3.5">CPF / CNPJ</th>
                        <th className="p-3.5">E-mail</th>
                        <th className="p-3.5">Celular</th>
                        <th className="p-3.5">Cadastro</th>
                        <th className="p-3.5">ID Usuário</th>
                        <th className="p-3.5 text-right">Faturamento</th>
                        <th className="p-3.5 text-right">Saldo Disp.</th>
                        <th className="p-3.5 text-center">Campanhas</th>
                        <th className="p-3.5 text-center">Status Carteira</th>
                        <th className="p-3.5 text-center">Taxa Venda</th>
                        <th className="p-3.5 text-center">Taxa Saque</th>
                        <th className="p-3.5 pr-5 text-center">Ações</th>
                      </tr>
                    </thead>

                    {/* CORPO DA PLANILHA */}
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {carregandoUsuarios ? (
                        <tr>
                          <td colSpan={14} className="p-12 text-center text-slate-400 text-xs">
                            <div className="flex items-center justify-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                              Carregando dados dos usuários...
                            </div>
                          </td>
                        </tr>
                      ) : usuariosFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={14} className="p-12 text-center text-slate-500 text-xs">
                            Nenhum usuário encontrado com os filtros atuais.
                          </td>
                        </tr>
                      ) : (
                        usuariosFiltrados.map((u, idx) => {
                          const custom = taxasPersonalizadasMap[u.ownerId.toLowerCase()] || {};
                          const status = u.carteiraConfig?.status || (u.carteiraConfig?.chavePix ? 'pendente' : 'inativo');
                          const taxaVendaEfetiva = custom.taxaVendaPct !== undefined ? custom.taxaVendaPct : globalTaxaVenda;
                          const taxaSaqueEfetiva = custom.taxaSaqueImediato !== undefined ? custom.taxaSaqueImediato : globalTaxaSaque;
                          const isCustom = custom.taxaVendaPct !== undefined || custom.taxaSaqueImediato !== undefined;

                          return (
                            <tr key={u.ownerId || idx} className="hover:bg-slate-900/60 transition group">
                              
                              {/* 1. Nome */}
                              <td className="p-3.5 pl-5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-slate-800 text-sky-400 font-black text-[11px] flex items-center justify-center border border-slate-700 uppercase shrink-0">
                                    {(u.nome || u.carteiraConfig?.nome || u.ownerId || 'U').charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-bold text-white block truncate max-w-[150px]">
                                      {u.nome || u.carteiraConfig?.nome || 'Sem Nome'}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* 2. Idade */}
                              <td className="p-3.5 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                                {calcularIdade(u.dataNascimento || u.carteiraConfig?.dataNascimento)}
                              </td>

                              {/* 3. CPF / CNPJ */}
                              <td className="p-3.5 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                                {u.documento || u.carteiraConfig?.documento || '-'}
                              </td>

                              {/* 4. E-mail */}
                              <td className="p-3.5 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                                <span className="truncate max-w-[180px] block" title={u.email || u.carteiraConfig?.email || u.ownerId}>
                                  {u.email || u.carteiraConfig?.email || u.ownerId}
                                </span>
                              </td>

                              {/* 5. Celular */}
                              <td className="p-3.5 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                                {u.telefone || u.carteiraConfig?.telefone || '-'}
                              </td>

                              {/* 6. Desde quando é usuário */}
                              <td className="p-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                                {formatarData(u.criadoEm)}
                              </td>

                              {/* 7. ID Usuário */}
                              <td className="p-3.5 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => copiarTexto(u.ownerId, `id-${u.ownerId}`)}
                                  className="hover:text-sky-400 flex items-center gap-1 group/btn"
                                  title="Clique para copiar UID"
                                >
                                  <span>{u.ownerId.slice(0, 8)}...</span>
                                  {idCopiado === `id-${u.ownerId}` ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 opacity-0 group-hover/btn:opacity-100" />}
                                </button>
                              </td>

                              {/* 8. Faturamento */}
                              <td className="p-3.5 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                                R$ {(u.faturamentoTotal || 0).toFixed(2)}
                              </td>

                              {/* Saldo Disponível */}
                              <td className="p-3.5 text-right font-mono font-bold text-purple-400 whitespace-nowrap">
                                R$ {(u.saldoDisponivel || 0).toFixed(2)}
                              </td>

                              {/* 9. Campanhas */}
                              <td className="p-3.5 text-center font-mono font-bold text-sky-400 whitespace-nowrap">
                                {u.qtdCampanhas || 0}
                              </td>

                              {/* 10. Status Carteira */}
                              <td className="p-3.5 text-center whitespace-nowrap">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                  status === 'aprovado'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : status === 'rejeitado'
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                    : status === 'pendente'
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}>
                                  {status === 'aprovado' ? 'Aprovado' : status === 'rejeitado' ? 'Rejeitado' : status === 'pendente' ? 'Pendente' : 'Inativo'}
                                </span>
                              </td>

                              {/* 11. Taxa Venda */}
                              <td className="p-3.5 text-center font-mono whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  isCustom ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-300'
                                }`}>
                                  {taxaVendaEfetiva}%
                                </span>
                              </td>

                              {/* 12. Taxa Saque */}
                              <td className="p-3.5 text-center font-mono whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  isCustom ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-300'
                                }`}>
                                  R$ {Number(taxaSaqueEfetiva).toFixed(2)}
                                </span>
                              </td>

                              {/* 13. Menu de Ações (3 pontinhos) */}
                              <td className="p-3.5 pr-5 text-center relative menu-3-pontinhos">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuAbertoId(menuAbertoId === u.ownerId ? null : u.ownerId);
                                  }}
                                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                                  title="Opções do Usuário"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {/* DROPDOWN MENU DO BOTÃO 3 PONTINHOS */}
                                {menuAbertoId === u.ownerId && (
                                  <div className="absolute right-6 top-10 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-1.5 z-30 text-left animate-in fade-in zoom-in-95 duration-150">
                                    
                                    {/* Opção 1: Mandar mensagem no WhatsApp */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleAbrirWhatsapp(u);
                                        setMenuAbertoId(null);
                                      }}
                                      className="w-full px-3.5 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-2 transition"
                                      title="Conversar com o organizador pelo WhatsApp"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                                      Mandar WhatsApp
                                    </button>

                                    {/* Opção 2: Editar Taxas */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setUsuarioParaEditarTaxas(u);
                                        setTaxaVendaModal(custom.taxaVendaPct !== undefined ? custom.taxaVendaPct : globalTaxaVenda);
                                        setTaxaSaqueModal(custom.taxaSaqueImediato !== undefined ? custom.taxaSaqueImediato : globalTaxaSaque);
                                        setObsModal(custom.observacao || '');
                                        setMenuAbertoId(null);
                                      }}
                                      className="w-full px-3.5 py-2 text-xs font-bold text-white hover:bg-sky-500/20 hover:text-sky-300 flex items-center gap-2 transition"
                                    >
                                      <Settings className="w-3.5 h-3.5 text-sky-400" />
                                      Editar Taxas
                                    </button>

                                    {/* Opção 3: Aprovar Carteira se pendente/rejeitado */}
                                    {status !== 'aprovado' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleAlterarStatusCarteira(u.ownerId, 'aprovado');
                                          setMenuAbertoId(null);
                                        }}
                                        className="w-full px-3.5 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-2 transition"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Liberar Carteira
                                      </button>
                                    )}

                                    {/* Opção 4: Rejeitar se aprovado/pendente */}
                                    {status !== 'rejeitado' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleAlterarStatusCarteira(u.ownerId, 'rejeitado');
                                          setMenuAbertoId(null);
                                        }}
                                        className="w-full px-3.5 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/20 flex items-center gap-2 transition"
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                        Rejeitar Carteira
                                      </button>
                                    )}

                                    <div className="h-px bg-slate-800 my-1"></div>

                                    {/* Opção 5: Copiar Pix */}
                                    {u.carteiraConfig?.chavePix && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          copiarTexto(u.carteiraConfig.chavePix, `pix-${u.ownerId}`);
                                          mostrarFeedback('sucesso', 'Chave Pix copiada para a área de transferência!');
                                          setMenuAbertoId(null);
                                        }}
                                        className="w-full px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition"
                                      >
                                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                                        Copiar Chave Pix
                                      </button>
                                    )}

                                    {/* Opção 6: Copiar E-mail */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        copiarTexto(u.email || u.carteiraConfig?.email || u.ownerId, `mail-${u.ownerId}`);
                                        mostrarFeedback('sucesso', 'E-mail copiado para a área de transferência!');
                                        setMenuAbertoId(null);
                                      }}
                                      className="w-full px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition"
                                    >
                                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                                      Copiar E-mail
                                    </button>

                                    <div className="h-px bg-slate-800 my-1"></div>

                                    {/* Opção 7: Excluir da Carteira / Excluir Conta */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setUsuarioParaExcluir(u);
                                        setDesvincularApenas(false);
                                        setMenuAbertoId(null);
                                      }}
                                      className="w-full px-3.5 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 flex items-center gap-2 transition"
                                      title="Excluir ou desvincular usuário da carteira"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                      Excluir da Carteira
                                    </button>
                                  </div>
                                )}
                              </td>

                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EDITAR TAXAS PERSONALIZADAS DO USUÁRIO (VIA 3 PONTINHOS)         */}
      {/* ========================================================================= */}
      {usuarioParaEditarTaxas && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">Editar Taxas do Usuário</h4>
                  <p className="text-xs text-slate-400">{usuarioParaEditarTaxas.nome || usuarioParaEditarTaxas.ownerId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUsuarioParaEditarTaxas(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>E-mail:</span>
                  <span className="text-white font-bold">{usuarioParaEditarTaxas.email || usuarioParaEditarTaxas.ownerId}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>CPF/CNPJ:</span>
                  <span className="text-white font-bold">{usuarioParaEditarTaxas.documento || usuarioParaEditarTaxas.carteiraConfig?.documento || '-'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Faturamento:</span>
                  <span className="text-emerald-400 font-bold">R$ {(usuarioParaEditarTaxas.faturamentoTotal || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 block">Taxa sobre Venda (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={taxaVendaModal}
                    onChange={e => setTaxaVendaModal(e.target.value === '' ? '' : e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Padrão global: {globalTaxaVenda}%</span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 block">Tarifa por Saque (R$) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={taxaSaqueModal}
                    onChange={e => setTaxaSaqueModal(e.target.value === '' ? '' : e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Padrão global: R$ {Number(globalTaxaSaque).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">Motivo / Observação</label>
                <input
                  type="text"
                  value={obsModal}
                  onChange={e => setObsModal(e.target.value)}
                  placeholder="Ex: Cliente VIP / Volume alto de vendas"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleSalvarTaxaModal(true)}
                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-bold transition"
              >
                Restaurar Padrão
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUsuarioParaEditarTaxas(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={salvandoModal}
                  onClick={() => handleSalvarTaxaModal(false)}
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-sky-500/20 transition flex items-center gap-1.5"
                >
                  {salvandoModal ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Salvar Taxas
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CONFIRMAÇÃO DE ALTERAÇÃO DE TAXAS GLOBAIS                       */}
      {/* ========================================================================= */}
      {modalConfirmacaoOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-white">Confirmar Novas Taxas Globais</h4>
                <p className="text-xs text-slate-400">Impactará todos os organizadores padrão</p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed">
                As novas tarifas padrão passarão a vigorar imediatamente para todos os organizadores que utilizam a carteira master do sistema (exceto aqueles com taxa personalizada):
              </p>
              
              <div className="space-y-2 pt-2 border-t border-slate-800 font-mono">
                <div className="flex justify-between items-center text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                  <span>Nova Taxa de Venda:</span>
                  <span className="text-sm">{globalTaxaVenda}%</span>
                </div>
                <div className="flex justify-between items-center text-sky-400 font-bold bg-sky-500/10 p-2 rounded-xl border border-sky-500/20">
                  <span>Nova Tarifa de Saque:</span>
                  <span className="text-sm">R$ {Number(globalTaxaSaque).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModalConfirmacaoOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={salvandoGlobal}
                onClick={handleSalvarGlobal}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2"
              >
                {salvandoGlobal ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirmar e Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CONFIRMAÇÃO DE EXCLUSÃO DE USUÁRIO DA CARTEIRA DO SISTEMA        */}
      {/* ========================================================================= */}
      {usuarioParaExcluir && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            
            {/* Cabeçalho do Modal */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-rose-400 shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">Excluir Usuário da Carteira</h4>
                  <p className="text-xs text-slate-400">Confirmação de remoção e impacto no sistema</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUsuarioParaExcluir(null)}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cartão de Resumo do Usuário */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nome / Marca:</span>
                <span className="font-bold text-white text-sm">{usuarioParaExcluir.nome || usuarioParaExcluir.carteiraConfig?.nome || 'Organizador'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">E-mail:</span>
                <span className="font-mono text-slate-300">{usuarioParaExcluir.email || usuarioParaExcluir.carteiraConfig?.email || usuarioParaExcluir.ownerId}</span>
              </div>
              {usuarioParaExcluir.documento && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">CPF / CNPJ:</span>
                  <span className="font-mono text-slate-300">{usuarioParaExcluir.documento}</span>
                </div>
              )}
              {usuarioParaExcluir.telefone && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Telefone / WhatsApp:</span>
                  <span className="font-mono text-slate-300">{usuarioParaExcluir.telefone}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-400">Total Faturado na Carteira:</span>
                <span className="font-bold text-emerald-400 text-xs">
                  R$ {Number(usuarioParaExcluir.faturamentoTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Campanhas Criadas:</span>
                <span className="font-bold text-sky-400 text-xs">{usuarioParaExcluir.qtdCampanhas || 0} campanhas</span>
              </div>
            </div>

            {/* O que vai acontecer */}
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>O que vai acontecer ao confirmar:</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 list-disc pl-4 text-[11px] leading-relaxed">
                <li><strong className="text-white">Acesso Desativado:</strong> O usuário será removido da gestão da carteira e não poderá mais movimentar saques centrais.</li>
                <li><strong className="text-white">Taxas Revogadas:</strong> Quaisquer taxas personalizadas atribuídas a este usuário serão excluídas.</li>
                <li><strong className="text-white">Dados Limpos:</strong> As configurações e chaves de pagamento vinculadas a esta conta serão removidas da administração.</li>
                <li><strong className="text-white">Reativação:</strong> Para voltar a utilizar a carteira, o usuário terá que solicitar uma nova aprovação do zero.</li>
              </ul>
            </div>

            {/* Opção de desvincular ou exclusão completa */}
            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center gap-3">
              <input
                type="checkbox"
                id="desvincularApenasCheck"
                checked={desvincularApenas}
                onChange={e => setDesvincularApenas(e.target.checked)}
                className="w-4 h-4 rounded text-rose-500 bg-slate-900 border-slate-700 focus:ring-rose-500 cursor-pointer"
              />
              <label htmlFor="desvincularApenasCheck" className="text-xs text-slate-300 cursor-pointer select-none">
                Apenas desvincular a carteira (mantém o perfil base do usuário inativo)
              </label>
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setUsuarioParaExcluir(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={excluindoUsuario}
                onClick={handleExcluirUsuario}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center gap-2"
              >
                {excluindoUsuario ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {desvincularApenas ? 'Confirmar Desvinculação' : 'Confirmar e Excluir Usuário'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: REGISTRAR RETIRADA DE LUCRO DO SUPER ADMIN                       */}
      {/* ========================================================================= */}
      {modalRetiradaLucroOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Registrar Retirada de Lucro</h3>
                  <p className="text-xs text-slate-400">Transferência do seu lucro para a sua conta pessoal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalRetiradaLucroOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Painel de Saldo Disponível */}
            <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Lucro Disponível</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  R$ {Number(metricasFinanceiras?.lucroDisponivelParaRetirada || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                <span>Chave Pix de Destino:</span>
                <span className="block font-mono text-white font-bold">{chavePixAdmin || 'Não cadastrada'}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Valor da Retirada (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={valorRetiradaLucro}
                    onChange={e => setValorRetiradaLucro(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm font-mono font-black focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setValorRetiradaLucro(String(metricasFinanceiras?.lucroDisponivelParaRetirada || 0))}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-lg transition"
                  >
                    Valor Total (Tudo)
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Descrição / Observação (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Retirada de lucro semanal para conta bancária"
                  value={obsRetiradaLucro}
                  onChange={e => setObsRetiradaLucro(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[11px] text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Esta retirada abaterá o saldo disponível para você manter o controle exato do que já foi sacado para a sua conta.</span>
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalRetiradaLucroOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={salvandoRetiradaLucro || !valorRetiradaLucro}
                onClick={handleRegistrarRetiradaLucro}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
              >
                {salvandoRetiradaLucro ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirmar Retirada
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: REJEITAR SOLICITAÇÃO DE SAQUE COM MOTIVO                         */}
      {/* ========================================================================= */}
      {saqueParaRejeitar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <XCircle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Rejeitar Solicitação de Saque</h3>
                  <p className="text-xs text-slate-400">O valor será integralmente estornado ao usuário</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSaqueParaRejeitar(null)}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Solicitante:</span>
                  <span className="font-extrabold text-white">
                    {usuariosCarteira.find(u => u.ownerId === saqueParaRejeitar.ownerId)?.nome || saqueParaRejeitar.ownerName || 'Organizador'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Valor Bruto:</span>
                  <span className="font-extrabold text-rose-400 font-mono">
                    R$ {Number(saqueParaRejeitar.valorSolicitado).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Motivo da Rejeição (Será exibido ao usuário) *
                </label>
                <textarea
                  placeholder="Ex: Dados bancários ou chave Pix inválida. Por favor, corrija em suas configurações e solicite novamente."
                  value={motivoRejeicao}
                  onChange={e => setMotivoRejeicao(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-3 text-xs focus:border-rose-500 focus:outline-none min-h-[100px] resize-none"
                  required
                />
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSaqueParaRejeitar(null);
                  setMotivoRejeicao('');
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={!motivoRejeicao.trim() || processandoSaqueId !== null}
                onClick={() => handleRejeitarSaque(saqueParaRejeitar.id, motivoRejeicao)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/20 transition flex items-center gap-2"
              >
                {processandoSaqueId === saqueParaRejeitar.id ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 text-white" />
                )}
                Confirmar Rejeição
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
export default CarteiraAdminView;
