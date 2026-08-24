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
  const [carteiraDataNascimento, setCarteiraDataNascimento] = useState('');
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
          setCarteiraDataNascimento(data.carteiraConfig.dataNascimento || '');
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
          dataNascimento: carteiraDataNascimento.trim(),
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
    { id: 'carteira', nome: 'Carteira do Sistema', tag: 'Sistema do App', desc: 'O sistema do próprio aplicativo fará a transferência direta para a sua conta / chave Pix cadastrada.', icon: <Wallet className="w-5 h-5 text-emerald-400" /> },
    { id: 'mercadopago', nome: 'Mercado Pago', tag: 'OAuth & API', desc: 'Conexão instantânea com liberação rápida dos pagamentos. Taxa padrão do gateway.', icon: <Zap className="w-5 h-5 text-blue-400" /> },
    ...(isAdminUser ? [{ id: 'efipay', nome: 'Efí Pay (Própria)', tag: 'API Direta (Admin)', desc: 'Sua conta Efí Pay individual com chaves de API próprias.', icon: <ShieldCheck className="w-5 h-5 text-orange-400" /> }] : []),
    { id: 'pushinpay', nome: 'PushinPay', tag: 'Gateway Especializado', desc: 'Baixa instantânea focada no ecossistema de campanhas e cotas.', icon: <ExternalLink className="w-5 h-5 text-indigo-400" /> },
    { id: 'pay2m', nome: 'Pay2M', tag: 'Baixa Automática', desc: 'Processamento Pix de alta velocidade com conciliação em tempo real.', icon: <CreditCard className="w-5 h-5 text-teal-400" /> },
    { id: 'paggue', nome: 'Paggue', tag: 'Gateway Pix', desc: 'API simplificada de split e liquidação de vendas.', icon: <Layers className="w-5 h-5 text-cyan-400" /> },
    { id: 'zettpay', nome: 'ZettPay', tag: 'Baixa Automática', desc: 'Integração com confirmação de Pix via webhook.', icon: <Zap className="w-5 h-5 text-yellow-400" /> },
    { id: 'paggo365', nome: 'Paggo365', tag: 'Especial Rifa', desc: 'Gateway projetado para sorteios com alta volumetria.', icon: <Globe className="w-5 h-5 text-rose-400" /> },
    { id: 'crypto', nome: 'Cripto / Web3', tag: 'USDT TRC20 / BEP20', desc: 'Aceite pagamentos descentralizados em criptomoedas.', icon: <Coins className="w-5 h-5 text-amber-400" /> },
  ];

  const isGatewayConnected = (id: string) => {
    if (id === 'carteira') return carteiraStatus === 'aprovado';
    if (id === 'mercadopago') return Boolean(mpAccessToken.trim());
    if (id === 'pushinpay') return Boolean(pushinToken.trim());
    if (id === 'pay2m') return Boolean(pay2mClientId.trim() && pay2mSecretKey.trim());
    if (id === 'paggue') return Boolean(paggueClientId.trim() && paggueClientSecret.trim());
    if (id === 'zettpay') return Boolean(zettpayApiKey.trim());
    if (id === 'paggo365') return Boolean(paggoApiKey.trim());
    if (id === 'crypto') return Boolean(cryptoWallet.trim());
    if (id === 'efipay') return Boolean(efiClientId.trim());
    return false;
  };

  const handleDesconectar = async (gatewayId: string) => {
    if (gatewayId === 'mercadopago') { setMpAccessToken(''); setMpPublicKey(''); }
    if (gatewayId === 'pushinpay') { setPushinToken(''); }
    if (gatewayId === 'pay2m') { setPay2mClientId(''); setPay2mSecretKey(''); }
    if (gatewayId === 'paggue') { setPaggueClientId(''); setPaggueClientSecret(''); }
    if (gatewayId === 'zettpay') { setZettpayApiKey(''); }
    if (gatewayId === 'paggo365') { setPaggoApiKey(''); }
    if (gatewayId === 'crypto') { setCryptoWallet(''); }
    if (gatewayId === 'efipay') { setEfiClientId(''); setEfiClientSecret(''); setEfiChavePix(''); }
    
    if (metodoAtivo === gatewayId) {
      setMetodoAtivo('carteira');
    }
    await handleSalvar(metodoAtivo === gatewayId ? 'carteira' : metodoAtivo, true);
  };

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
          const connected = isGatewayConnected(g.id);

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
                    isCarteira && !carteiraStatus
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : isAtivo 
                        ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30' 
                        : connected
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {isCarteira && !carteiraStatus ? 'PENDENTE SOLICITAÇÃO' : isAtivo ? 'ATIVO NO SITE' : connected ? 'CONECTADO' : g.tag}
                  </span>
                </div>

                <h4 className="text-sm font-black text-white group-hover:text-sky-300 transition-colors flex items-center gap-2">
                  {g.nome}
                </h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{g.desc}</p>

                {isCarteira && carteiraStatus === 'aprovado' && carteiraChavePix && (
                  <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 flex items-center gap-1.5 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">Pix de Saque: {carteiraChavePix}</span>
                  </div>
                )}

                {isCarteira && carteiraStatus === 'pendente' && (
                  <div className="mt-3 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                    <span>Aguardando confirmação (até 24h)</span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                {isCarteira ? (
                  <>
                    {!carteiraStatus ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalGateway('carteira');
                        }}
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl text-center transition shadow-md"
                      >
                        Fazer Solicitação
                      </button>
                    ) : carteiraStatus === 'pendente' ? (
                      <span className="w-full text-center text-xs font-bold text-amber-400 py-1">
                        Aguardando Aprovação (Até 24h)
                      </span>
                    ) : carteiraStatus === 'rejeitado' ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalGateway('carteira');
                        }}
                        className="w-full py-2 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-xl text-center transition"
                      >
                        Fazer Nova Solicitação
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalGateway('carteira');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-xl font-bold transition"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          Meu Cadastro / Dados
                        </button>

                        {onAbrirCarteira && (
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
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {connected ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalGateway(g.id as MetodoPagamentoAtivo);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-xl font-bold transition"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          Gerenciar
                        </button>
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
                          {isAtivo ? '✓ Principal' : 'Usar como Padrão'}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalGateway(g.id as MetodoPagamentoAtivo);
                        }}
                        className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black rounded-xl text-center transition shadow-md"
                      >
                        Conectar
                      </button>
                    )}
                  </>
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
                    {modalGateway === 'carteira' && carteiraStatus !== 'aprovado' ? 'Solicitar Acesso à' : 'Configurar'} {gatewayAbertoInfo?.nome}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {modalGateway === 'carteira' && carteiraStatus !== 'aprovado' 
                      ? 'Preencha os dados abaixo para receber transferências diretas.'
                      : 'Gerencie sua conexão e credenciais de pagamento.'
                    }
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
              {/* Opção de Ativar como Gateway Principal (Apenas se for carteira aprovada ou outro gateway conectado) */}
              {(modalGateway !== 'carteira' || carteiraStatus === 'aprovado') && (
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
              )}

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
                    {carteiraStatus === 'aprovado' ? (
                      <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400"/> Conta Aprovada
                          </h5>
                        </div>
                        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
                          <div className="flex justify-between"><span className="text-slate-400">Titular:</span> <span className="text-white font-bold">{carteiraNome}</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">CPF/CNPJ:</span> <span className="text-white font-bold">{carteiraDocumento}</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">Chave Pix:</span> <span className="text-emerald-400 font-bold">{carteiraChavePix}</span></div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setModalGateway(null);
                              if (onAbrirCarteira) onAbrirCarteira();
                            }}
                            className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold w-full sm:w-auto"
                          >
                            Abrir Minha Carteira
                          </button>
                        </div>
                      </div>
                    ) : carteiraStatus === 'pendente' ? (
                      <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center space-y-3">
                        <RefreshCw className="w-10 h-10 text-amber-400 mx-auto animate-spin" />
                        <div>
                          <h4 className="text-sm font-black text-amber-300">Aguardando Confirmação</h4>
                          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                            Sua solicitação de uso da carteira foi enviada com sucesso. <br />
                            <strong>Aguardando confirmação, esse processo pode levar até 24 horas.</strong>
                          </p>
                        </div>
                      </div>
                    ) : carteiraStatus === 'rejeitado' ? (
                      <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center space-y-3">
                        <X className="w-10 h-10 text-rose-400 mx-auto" />
                        <div>
                          <h4 className="text-sm font-black text-rose-300">Solicitação Rejeitada</h4>
                          <p className="text-xs text-slate-300 mt-1">Infelizmente sua solicitação não foi aprovada pelo administrador.</p>
                        </div>
                        <button onClick={() => setCarteiraStatus('')} className="px-4 py-2 mt-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold">Fazer Nova Solicitação</button>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-4">
                        <h5 className="text-sm font-black text-white">Solicitar Acesso à Carteira do Sistema</h5>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-300">Nome Completo *</label>
                              <input
                                type="text"
                                value={carteiraNome}
                                onChange={e => setCarteiraNome(e.target.value)}
                                placeholder="Seu nome completo"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-300">Data de Nascimento *</label>
                              <input
                                type="date"
                                value={carteiraDataNascimento}
                                onChange={e => setCarteiraDataNascimento(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-300">E-mail *</label>
                              <input
                                type="email"
                                value={carteiraEmail}
                                onChange={e => setCarteiraEmail(e.target.value)}
                                placeholder="seu@email.com"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-300">CPF ou CNPJ *</label>
                              <input
                                type="text"
                                value={carteiraDocumento}
                                onChange={e => setCarteiraDocumento(e.target.value)}
                                placeholder="000.000.000-00"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                              <label className="text-[11px] font-bold text-slate-300">Número de Celular (WhatsApp) *</label>
                              <input
                                type="text"
                                value={carteiraTelefone}
                                onChange={e => setCarteiraTelefone(e.target.value)}
                                placeholder="(00) 00000-0000"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-3 pt-3 border-t border-slate-800">
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-300 block">Tipo de Chave Pix para Saque *</label>
                              <select
                                value={carteiraTipoPix}
                                onChange={e => setCarteiraTipoPix(e.target.value as any)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                              >
                                <option value="cpf">CPF</option>
                                <option value="cnpj">CNPJ</option>
                                <option value="email">E-mail</option>
                                <option value="telefone">Telefone</option>
                                <option value="aleatoria">Chave Aleatória</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-300">Chave Pix Correspondente *</label>
                              <input
                                type="text"
                                value={carteiraChavePix}
                                onChange={e => setCarteiraChavePix(e.target.value)}
                                placeholder="Digite sua chave pix aqui"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={salvando || !carteiraChavePix || !carteiraNome || !carteiraDocumento || !carteiraEmail || !carteiraTelefone}
                            onClick={async () => {
                              setCarteiraStatus('pendente');
                              await handleSalvar('carteira', true);
                            }}
                            className="w-full py-3.5 mt-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                          >
                            {salvando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Fazer Solicitação
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* OUTROS GATEWAYS DE PAGAMENTO */}
              {modalGateway && modalGateway !== 'carteira' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-black text-white flex items-center gap-1.5">
                        Status da Conexão: {isGatewayConnected(modalGateway) ? (
                          <span className="text-emerald-400 inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Conectado</span>
                        ) : (
                          <span className="text-slate-400 inline-flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Desconectado</span>
                        )}
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Insira abaixo as credenciais de API fornecidas pelo seu gateway.
                      </p>
                    </div>
                    {isGatewayConnected(modalGateway) && (
                      <button
                        type="button"
                        onClick={() => handleDesconectar(modalGateway)}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-xl transition"
                      >
                        Desconectar
                      </button>
                    )}
                  </div>

                  {modalGateway === 'mercadopago' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300">Access Token (Mercado Pago)</label>
                        <input
                          type="password"
                          value={mpAccessToken}
                          onChange={e => setMpAccessToken(e.target.value)}
                          placeholder="APP_USR-..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300">Public Key (Opcional)</label>
                        <input
                          type="text"
                          value={mpPublicKey}
                          onChange={e => setMpPublicKey(e.target.value)}
                          placeholder="APP_USR-..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {modalGateway === 'pushinpay' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300">Token de API (PushinPay)</label>
                        <input
                          type="password"
                          value={pushinToken}
                          onChange={e => setPushinToken(e.target.value)}
                          placeholder="Bearer Token..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {modalGateway === 'pay2m' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300">Client ID / API Key (Pay2M)</label>
                        <input
                          type="text"
                          value={pay2mClientId}
                          onChange={e => setPay2mClientId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300">Secret Key (Pay2M)</label>
                        <input
                          type="password"
                          value={pay2mSecretKey}
                          onChange={e => setPay2mSecretKey(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {modalGateway === 'paggue' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300">Client ID (Paggue)</label>
                        <input
                          type="text"
                          value={paggueClientId}
                          onChange={e => setPaggueClientId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300">Client Secret (Paggue)</label>
                        <input
                          type="password"
                          value={paggueClientSecret}
                          onChange={e => setPaggueClientSecret(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {modalGateway === 'zettpay' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300">API Key (ZettPay)</label>
                        <input
                          type="password"
                          value={zettpayApiKey}
                          onChange={e => setZettpayApiKey(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {modalGateway === 'paggo365' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300">API Key (Paggo365)</label>
                        <input
                          type="password"
                          value={paggoApiKey}
                          onChange={e => setPaggoApiKey(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {modalGateway === 'crypto' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300">Endereço da Carteira USDT</label>
                        <input
                          type="text"
                          value={cryptoWallet}
                          onChange={e => setCryptoWallet(e.target.value)}
                          placeholder="0x... ou T..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300">Rede</label>
                        <select
                          value={cryptoNetwork}
                          onChange={e => setCryptoNetwork(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="TRC20">TRC20 (Tron)</option>
                          <option value="BEP20">BEP20 (Binance Smart Chain)</option>
                          <option value="ERC20">ERC20 (Ethereum)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {modalGateway === 'efipay' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300">Client ID (Efí Pay)</label>
                        <input
                          type="text"
                          value={efiClientId}
                          onChange={e => setEfiClientId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300">Client Secret (Efí Pay)</label>
                        <input
                          type="password"
                          value={efiClientSecret}
                          onChange={e => setEfiClientSecret(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300">Chave Pix</label>
                        <input
                          type="text"
                          value={efiChavePix}
                          onChange={e => setEfiChavePix(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={salvando}
                    onClick={() => handleSalvar(modalGateway as MetodoPagamentoAtivo, true)}
                    className="w-full py-3.5 mt-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                  >
                    {salvando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Salvar e Conectar
                  </button>
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
