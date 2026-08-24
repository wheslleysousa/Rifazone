import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Wallet, Zap, ShieldCheck, CheckCircle2, 
  AlertCircle, ExternalLink, Copy, RefreshCw, Key, 
  Building2, Globe, Sparkles, Coins, Lock, HelpCircle, Layers, X,
  Settings, Check, User, Mail, FileText, ArrowRight, Trash2
} from 'lucide-react';
import { ConfigOrganizador, MetodoPagamentoAtivo } from '../../types';

interface MetodosPagamentoViewProps {
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
  onAbrirCarteira?: () => void;
  isAdmin?: boolean;
  userEmail?: string;
  initialAba?: 'gateways' | 'taxas';
}

export const MetodosPagamentoView: React.FC<MetodosPagamentoViewProps> = ({ 
  authFetch, 
  onAbrirCarteira, 
  isAdmin = false, 
  userEmail = '',
  initialAba = 'gateways'
}) => {
  const [config, setConfig] = useState<ConfigOrganizador | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState('');
  const [msgErro, setMsgErro] = useState('');
  const [copiadoWebhook, setCopiadoWebhook] = useState(false);
  const [abaInterna, setAbaInterna] = useState<'gateways' | 'taxas'>(initialAba);

  // Super Admin flag
  const [isAdminUser, setIsAdminUser] = useState(isAdmin);

  // Gateway ativo selecionado
  const [metodoAtivo, setMetodoAtivo] = useState<MetodoPagamentoAtivo>('carteira');
  // Modal de configuração aberto (null se nenhum)
  const [modalGateway, setModalGateway] = useState<MetodoPagamentoAtivo | null>(null);

  // Form States para Carteira do Sistema (Efí Pay Integrada)
  const [carteiraTaxaPct, setCarteiraTaxaPct] = useState(5.0);
  const [carteiraTaxaSaque, setCarteiraTaxaSaque] = useState(4.50);
  const [carteiraNome, setCarteiraNome] = useState('');
  const [carteiraEmail, setCarteiraEmail] = useState('');
  const [carteiraDocumento, setCarteiraDocumento] = useState('');
  const [carteiraTipoPix, setCarteiraTipoPix] = useState<'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'>('cpf');
  const [carteiraChavePix, setCarteiraChavePix] = useState('');
  const [carteiraTelefone, setCarteiraTelefone] = useState('');
  const [carteiraStatus, setCarteiraStatus] = useState<"pendente" | "aprovado" | "rejeitado" | "">('');

  // Taxas Personalizadas por Usuário (Super Admin)
  const [taxasPersonalizadasMap, setTaxasPersonalizadasMap] = useState<Record<string, { taxaVendaPct?: number; taxaSaqueImediato?: number; observacao?: string; atualizadoEm?: string }>>({});
  const [targetUserInput, setTargetUserInput] = useState('');
  const [targetTaxaVenda, setTargetTaxaVenda] = useState(3.0);
  const [targetTaxaSaque, setTargetTaxaSaque] = useState(0.0);
  const [targetObs, setTargetObs] = useState('');
  const [salvandoUserTaxa, setSalvandoUserTaxa] = useState(false);

  // Mercado Pago
  const [mpAccessToken, setMpAccessToken] = useState('');
  const [mpPublicKey, setMpPublicKey] = useState('');

  // Efí Pay Direta
  const [efiClientId, setEfiClientId] = useState('');
  const [efiClientSecret, setEfiClientSecret] = useState('');
  const [efiChavePix, setEfiChavePix] = useState('');
  const [efiClientIdHomologacao, setEfiClientIdHomologacao] = useState('');
  const [efiClientSecretHomologacao, setEfiClientSecretHomologacao] = useState('');
  const [efiChavePixHomologacao, setEfiChavePixHomologacao] = useState('');
  const [efiAmbiente, setEfiAmbiente] = useState<'producao' | 'homologacao'>('producao');
  const [efiAbaAmbiente, setEfiAbaAmbiente] = useState<'producao' | 'homologacao'>('producao');

  // PushinPay
  const [pushinToken, setPushinToken] = useState('');

  // Pay2M
  const [pay2mClientId, setPay2mClientId] = useState('');
  const [pay2mSecretKey, setPay2mSecretKey] = useState('');

  // Paggue
  const [paggueClientId, setPaggueClientId] = useState('');
  const [paggueClientSecret, setPaggueClientSecret] = useState('');

  // ZettPay
  const [zettpayApiKey, setZettpayApiKey] = useState('');

  // Paggo365
  const [paggoApiKey, setPaggoApiKey] = useState('');

  // Cripto
  const [cryptoWallet, setCryptoWallet] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState('TRC20');

  const carregarConfiguracoes = async () => {
    setCarregando(true);
    try {
      const res = await authFetch('/api/admin/configuracoes');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        if (data.isAdmin !== undefined) {
          setIsAdminUser(data.isAdmin);
        }
        setMetodoAtivo(data.metodoAtivo || (data.mpAccessToken ? 'mercadopago' : 'carteira'));

        // Preenche campos da Carteira do Sistema
        if (data.carteiraConfig) {
          setCarteiraTaxaPct(data.carteiraConfig.taxaVendaPct ?? 5.0);
          setCarteiraTaxaSaque(data.carteiraConfig.taxaSaqueImediato ?? 4.50);
          setCarteiraNome(data.carteiraConfig.nome || data.nomeIdentificacao || '');
          setCarteiraEmail(data.carteiraConfig.email || data.emailSuporte || '');
          setCarteiraDocumento(data.carteiraConfig.documento || '');
          setCarteiraTipoPix(data.carteiraConfig.tipoChavePix || 'cpf');
          setCarteiraChavePix(data.carteiraConfig.chavePix || '');
          setCarteiraTelefone(data.carteiraConfig.telefone || '');
          setCarteiraStatus(data.carteiraConfig.status || '');
          if (data.carteiraConfig.taxasPersonalizadas) {
            setTaxasPersonalizadasMap(data.carteiraConfig.taxasPersonalizadas);
          }
        }
        if (data.mpAccessToken) {
          setMpAccessToken(data.mpAccessToken || '');
        }
        if (data.mpPublicKey) {
          setMpPublicKey(data.mpPublicKey || '');
        }
        if (data.efipayConfig) {
          setEfiClientId(data.efipayConfig.clientId || '');
          setEfiClientSecret(data.efipayConfig.clientSecret || '');
          setEfiChavePix(data.efipayConfig.chavePix || '');
          setEfiClientIdHomologacao(data.efipayConfig.clientIdHomologacao || '');
          setEfiClientSecretHomologacao(data.efipayConfig.clientSecretHomologacao || '');
          setEfiChavePixHomologacao(data.efipayConfig.chavePixHomologacao || '');
          setEfiAmbiente(data.efipayConfig.ambiente || 'producao');
        }
        if (data.pushinpayConfig) {
          setPushinToken(data.pushinpayConfig.token || '');
        }
        if (data.pay2mConfig) {
          setPay2mClientId(data.pay2mConfig.clientId || '');
          setPay2mSecretKey(data.pay2mConfig.secretKey || '');
        }
        if (data.paggueConfig) {
          setPaggueClientId(data.paggueConfig.clientId || '');
          setPaggueClientSecret(data.paggueConfig.clientSecret || '');
        }
        if (data.zettpayConfig) {
          setZettpayApiKey(data.zettpayConfig.apiKey || '');
        }
        if (data.paggo365Config) {
          setPaggoApiKey(data.paggo365Config.apiKey || '');
        }
        if (data.cryptoConfig) {
          setCryptoWallet(data.cryptoConfig.walletAddress || '');
          setCryptoNetwork(data.cryptoConfig.network || 'TRC20');
        }
      }
    } catch (err) {
      console.error('Erro ao carregar configurações de pagamento:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const handleSalvarUserTaxa = async (targetUser: string, remover: boolean = false) => {
    if (!targetUser || !targetUser.trim()) {
      setMsgErro('Informe o e-mail ou ID do usuário.');
      return;
    }
    setSalvandoUserTaxa(true);
    setMsgSucesso('');
    setMsgErro('');
    try {
      const res = await authFetch('/api/admin/usuarios/taxa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUser: targetUser.trim(),
          taxaVendaPct: Number(targetTaxaVenda),
          taxaSaqueImediato: Number(targetTaxaSaque),
          observacao: targetObs.trim(),
          remover
        })
      });
      const data = await res.json();
      if (res.ok && data.taxasPersonalizadas) {
        setTaxasPersonalizadasMap(data.taxasPersonalizadas);
        setTargetUserInput('');
        setTargetObs('');
        setMsgSucesso(remover ? 'Taxa personalizada removida!' : 'Taxa de comissão do usuário atualizada com sucesso!');
      } else {
        setMsgErro(data.error || 'Erro ao atualizar taxa do usuário.');
      }
    } catch (err: any) {
      setMsgErro(err.message || 'Erro ao conectar ao servidor.');
    } finally {
      setSalvandoUserTaxa(false);
    }
  };

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const handleSalvar = async (metodoParaAtivar?: MetodoPagamentoAtivo, fecharModal: boolean = false) => {
    setSalvando(true);
    setMsgSucesso('');
    setMsgErro('');

    const targetMetodo = metodoParaAtivar || metodoAtivo;

    try {
      const payload: any = {
        metodoAtivo: targetMetodo,
        carteiraConfig: {
          ativo: targetMetodo === 'carteira',
          taxaVendaPct: Number(carteiraTaxaPct),
          taxaSaqueImediato: Number(carteiraTaxaSaque),
          nome: carteiraNome.trim(),
          email: carteiraEmail.trim(),
          documento: carteiraDocumento.trim(),
          tipoChavePix: carteiraTipoPix,
          chavePix: carteiraChavePix.trim(),
          telefone: carteiraTelefone.trim(),
          status: carteiraStatus || "pendente"
        },
        mpAccessToken: mpAccessToken.trim(),
        mpPublicKey: mpPublicKey.trim(),
        efipayConfig: {
          ativo: targetMetodo === 'efipay',
          clientId: efiClientId.trim(),
          clientSecret: efiClientSecret.trim(),
          chavePix: efiChavePix.trim(),
          clientIdHomologacao: efiClientIdHomologacao.trim(),
          clientSecretHomologacao: efiClientSecretHomologacao.trim(),
          chavePixHomologacao: efiChavePixHomologacao.trim(),
          ambiente: efiAmbiente
        },
        pushinpayConfig: {
          ativo: targetMetodo === 'pushinpay',
          token: pushinToken.trim()
        },
        pay2mConfig: {
          ativo: targetMetodo === 'pay2m',
          clientId: pay2mClientId.trim(),
          secretKey: pay2mSecretKey.trim()
        },
        paggueConfig: {
          ativo: targetMetodo === 'paggue',
          clientId: paggueClientId.trim(),
          clientSecret: paggueClientSecret.trim()
        },
        zettpayConfig: {
          ativo: targetMetodo === 'zettpay',
          apiKey: zettpayApiKey.trim()
        },
        paggo365Config: {
          ativo: targetMetodo === 'paggo365',
          apiKey: paggoApiKey.trim()
        },
        cryptoConfig: {
          ativo: targetMetodo === 'crypto',
          walletAddress: cryptoWallet.trim(),
          network: cryptoNetwork
        }
      };

      const res = await authFetch('/api/admin/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar configurações.');
      }

      setMetodoAtivo(targetMetodo);
      setMsgSucesso('Configurações salvas com sucesso!');
      if (fecharModal) {
        setModalGateway(null);
      }
      await carregarConfiguracoes();
    } catch (err: any) {
      setMsgErro(err.message || 'Falha ao salvar configurações.');
    } finally {
      setSalvando(false);
    }
  };

  const gateways = [
    { id: 'carteira', nome: 'Carteira do Sistema', tag: 'Efí Pay Integrada', desc: 'Isenção de chave API. Receba via Efí Pay com saldo em conta e saques automáticos no Pix.', icon: <Wallet className="w-5 h-5 text-emerald-400" /> },
    { id: 'mercadopago', nome: 'Mercado Pago', tag: 'OAuth & API', desc: 'Conexão instantânea com liberação rápida dos pagamentos.', icon: <Zap className="w-5 h-5 text-blue-400" /> },
    ...(isAdminUser ? [{ id: 'efipay', nome: 'Efí Pay (Própria)', tag: 'API Direta (Admin)', desc: 'Sua conta Efí Pay individual com chaves de API próprias.', icon: <ShieldCheck className="w-5 h-5 text-orange-400" /> }] : []),
    { id: 'pushinpay', nome: 'PushinPay', tag: 'Gateway Especializado', desc: 'Baixa instantânea focada no ecossistema de campanhas e cotas.', icon: <ExternalLink className="w-5 h-5 text-indigo-400" /> },
    { id: 'pay2m', nome: 'Pay2M', tag: 'Baixa Automática', desc: 'Processamento Pix de alta velocidade com conciliação em tempo real.', icon: <CreditCard className="w-5 h-5 text-teal-400" /> },
    { id: 'paggue', nome: 'Paggue', tag: 'Gateway Pix', desc: 'API simplificada de split e liquidação de vendas.', icon: <Layers className="w-5 h-5 text-cyan-400" /> },
    { id: 'zettpay', nome: 'ZettPay', tag: 'Baixa Automática', desc: 'Integração com confirmação de Pix via webhook.', icon: <Zap className="w-5 h-5 text-yellow-400" /> },
    { id: 'paggo365', nome: 'Paggo365', tag: 'Especial Rifa', desc: 'Gateway projetado para sorteios com alta volumetria.', icon: <Globe className="w-5 h-5 text-rose-400" /> },
    { id: 'crypto', nome: 'Cripto / Web3', tag: 'USDT TRC20 / BEP20', desc: 'Aceite pagamentos descentralizados em criptomoedas.', icon: <Coins className="w-5 h-5 text-amber-400" /> },
  ];

  const webhookBaseUrl = window.location.origin;
  const gatewayAbertoInfo = gateways.find(g => g.id === modalGateway);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <CreditCard className="w-5 h-5" />
            </div>
            Métodos de Pagamento & Gateways Pix
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Clique em qualquer método para abrir o pop-up de configuração.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Método Ativo: <span className="text-emerald-400 font-black">{gateways.find(g => g.id === metodoAtivo)?.nome}</span>
          </div>

          {onAbrirCarteira && (
            <button
              onClick={onAbrirCarteira}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition"
            >
              <Wallet className="w-4 h-4" />
              Abrir Minha Carteira
            </button>
          )}
        </div>
      </div>

      {/* Alertas */}
      {msgSucesso && (
        <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs font-semibold flex items-center justify-between gap-2.5 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p>{msgSucesso}</p>
          </div>
          <button onClick={() => setMsgSucesso('')} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {msgErro && (
        <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs font-semibold flex items-center justify-between gap-2.5 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <p>{msgErro}</p>
          </div>
          <button onClick={() => setMsgErro('')} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* GRADE DE GATEWAYS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {gateways.map(g => {
          const isAtivo = metodoAtivo === g.id;
          const isCarteira = g.id === 'carteira';

          return (
            <div
              key={g.id}
              onClick={() => setModalGateway(g.id as MetodoPagamentoAtivo)}
              className={`p-5 rounded-3xl border cursor-pointer transition-all duration-200 flex flex-col justify-between group relative overflow-hidden ${
                isAtivo
                  ? 'border-emerald-500/80 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                  : 'border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-900 shadow-lg'
              }`}
            >
              {isAtivo && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none -mr-4 -mt-4 blur-xl"></div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 rounded-2xl border transition ${
                    isAtivo ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/80 border-slate-700/60'
                  }`}>
                    {g.icon}
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    isAtivo 
                      ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {isAtivo ? 'ATIVO NO SITE' : g.tag}
                  </span>
                </div>

                <h4 className="text-sm font-black text-white group-hover:text-sky-300 transition-colors flex items-center gap-2">
                  {g.nome}
                </h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{g.desc}</p>

                {isCarteira && carteiraChavePix && (
                  <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 flex items-center gap-1.5 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">Pix de Saque: {carteiraChavePix}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalGateway(g.id as MetodoPagamentoAtivo);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-xl font-bold transition"
                >
                  <Settings className="w-3.5 h-3.5" />
                  {isCarteira ? 'Meu Cadastro / Dados' : 'Configurar'}
                </button>

                {isCarteira && onAbrirCarteira ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAbrirCarteira();
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition"
                  >
                    <span>Minha Carteira</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSalvar(g.id as MetodoPagamentoAtivo, false);
                    }}
                    className={`text-xs font-bold transition px-2.5 py-1 rounded-lg ${
                      isAtivo
                        ? 'text-emerald-400 font-black'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {isAtivo ? '✓ Principal' : 'Ativar no Site'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* POPUP / MODAL DE CONFIGURAÇÃO DO GATEWAY */}
      {modalGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div 
            className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-slate-800 border border-slate-700">
                  {gatewayAbertoInfo?.icon}
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    Configurar {gatewayAbertoInfo?.nome}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Defina suas credenciais e parâmetros operacionais.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalGateway(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar">
              {/* Opção de Ativar como Gateway Principal */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Definir como Gateway Ativo no Site
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Quando ativo, todos os pagamentos Pix do site serão processados por este método.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMetodoAtivo(modalGateway)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition border flex items-center gap-1.5 ${
                    metodoAtivo === modalGateway
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {metodoAtivo === modalGateway ? <Check className="w-3.5 h-3.5" /> : null}
                  {metodoAtivo === modalGateway ? 'Método Ativo' : 'Tornar Ativo'}
                </button>
              </div>

              {/* 1. CARTEIRA DO SISTEMA (EFÍ PAY INTEGRADA) */}
              {modalGateway === 'carteira' && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h5 className="font-black text-emerald-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Carteira Oficial com Tecnologia Efí Pay (Gerencianet)
                      </h5>
                      {isAdminUser && (
                        <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-wide">
                          Painel Super Admin
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {isAdminUser 
                        ? 'Você está no modo Super Admin (wheslleyaviz@gmail.com). Aqui você define a taxa padrão global, insere as credenciais mestre da Efí Pay para todo o sistema e gerencia taxas customizadas (ex: 1%) para usuários específicos.'
                        : 'Não é necessário contratar chaves de API próprias. As transações são geradas pela Efí Pay da plataforma. Seu saldo fica acumulado com retenção automática da sua taxa e você pode solicitar saques via Pix a qualquer momento.'
                      }
                    </p>
                  </div>

                  {/* PARA SUPER ADMIN: CONFIGURAÇÃO MESTRE DA EFÍ PAY FOI REMOVIDA DAQUI (FICA SÓ NO ENV E NA NOVA ABA) */}
                  
                  
                  {/* CADASTRO DE CONTA NA CARTEIRA */}
                  <div className="mt-4">
                    {carteiraChavePix ? (
                      <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black text-white uppercase tracking-wider">Sua Conta está Ativa</h5>
                        </div>
                        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
                          <div className="flex justify-between"><span className="text-slate-400">Titular:</span> <span className="text-white font-bold">{carteiraNome}</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">Chave Pix:</span> <span className="text-emerald-400 font-bold">{carteiraChavePix}</span></div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => { setCarteiraChavePix(''); setCarteiraNome(''); }}
                            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-xs font-bold"
                          >
                            Excluir Conta
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setModalGateway(null);
                              if (onAbrirCarteira) onAbrirCarteira();
                            }}
                            className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold"
                          >
                            Abrir Carteira
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-4">
                        <h5 className="text-sm font-black text-white">Criar Conta na Carteira</h5>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-300">Nome Completo do Titular *</label>
                            <input
                              type="text"
                              value={carteiraNome}
                              onChange={e => setCarteiraNome(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-300">Documento (CPF/CNPJ)</label>
                            <input
                              type="text"
                              value={carteiraDocumento}
                              onChange={e => setCarteiraDocumento(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-300">Chave Pix para Saques *</label>
                            <input
                              type="text"
                              value={carteiraChavePix}
                              onChange={e => setCarteiraChavePix(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            disabled={salvando || !carteiraChavePix || !carteiraNome}
                            onClick={async () => {
                              await handleSalvar('carteira', false);
                              if (onAbrirCarteira) {
                                setModalGateway(null);
                                onAbrirCarteira();
                              }
                            }}
                            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-black rounded-xl"
                          >
                            Concluir Cadastro
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MetodosPagamentoView;
