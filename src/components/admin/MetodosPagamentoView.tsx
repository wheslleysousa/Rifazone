import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Wallet, Zap, CheckCircle2, 
  AlertCircle, RefreshCw, Layers, X,
  Check, Edit3, Coins, Globe, Trash2
} from 'lucide-react';
import { ConfigOrganizador, MetodoPagamentoAtivo } from '../../types';

interface MetodosPagamentoViewProps {
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
  onAbrirCarteira?: () => void;
  isAdmin?: boolean;
  userEmail?: string;
  initialAba?: string;
}

export const MetodosPagamentoView: React.FC<MetodosPagamentoViewProps> = ({ 
  authFetch, 
  onAbrirCarteira
}) => {
  const [config, setConfig] = useState<ConfigOrganizador | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState('');
  const [msgErro, setMsgErro] = useState('');

  // Gateway ativo selecionado
  const [metodoAtivo, setMetodoAtivo] = useState<MetodoPagamentoAtivo>('carteira');
  // Modal de configuração aberto (null se nenhum)
  const [modalGateway, setModalGateway] = useState<MetodoPagamentoAtivo | null>(null);

  // Mercado Pago OAuth State
  const [conectandoOAuth, setConectandoOAuth] = useState(false);
  const [popupOauthAberto, setPopupOauthAberto] = useState(false);
  const [oauthAuthUrl, setOauthAuthUrl] = useState('');

  // Form States para Carteira do Sistema
  const [carteiraTaxaPct, setCarteiraTaxaPct] = useState(8.0);
  const [carteiraTaxaSaque, setCarteiraTaxaSaque] = useState(4.50);
  const [carteiraNome, setCarteiraNome] = useState('');
  const [carteiraDataNascimento, setCarteiraDataNascimento] = useState('');
  const [carteiraEmail, setCarteiraEmail] = useState('');
  const [carteiraDocumento, setCarteiraDocumento] = useState('');
  const [carteiraTipoPix, setCarteiraTipoPix] = useState<'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'>('cpf');
  const [carteiraChavePix, setCarteiraChavePix] = useState('');
  const [carteiraTelefone, setCarteiraTelefone] = useState('');
  const [carteiraStatus, setCarteiraStatus] = useState<"pendente" | "aprovado" | "rejeitado" | "">('');
  const [editandoCarteira, setEditandoCarteira] = useState(false);

  // Mercado Pago
  const [mpAccessToken, setMpAccessToken] = useState('');
  const [mpPublicKey, setMpPublicKey] = useState('');

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
        setMetodoAtivo(data.metodoAtivo || (data.mpConfigurado || data.mpAccessToken ? 'mercadopago' : 'carteira'));

        // Preenche campos da Carteira do Sistema
        if (data.carteiraConfig) {
          setCarteiraTaxaPct(data.carteiraConfig.taxaVendaPct ?? 8.0);
          setCarteiraTaxaSaque(data.carteiraConfig.taxaSaqueImediato ?? 4.50);
          setCarteiraNome(data.carteiraConfig.nome || data.nomeIdentificacao || '');
          setCarteiraDataNascimento(data.carteiraConfig.dataNascimento || '');
          setCarteiraEmail(data.carteiraConfig.email || data.emailSuporte || '');
          setCarteiraDocumento(data.carteiraConfig.documento || '');
          setCarteiraTipoPix(data.carteiraConfig.tipoChavePix || 'cpf');
          setCarteiraChavePix(data.carteiraConfig.chavePix || '');
          setCarteiraTelefone(data.carteiraConfig.telefone || '');
          setCarteiraStatus(data.carteiraConfig.status || '');
        }
        if (data.mpAccessToken) {
          setMpAccessToken(data.mpAccessToken || '');
        }
        if (data.mpPublicKey) {
          setMpPublicKey(data.mpPublicKey || '');
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

  // Escuta mensagens do popup OAuth do Mercado Pago
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' || event.data?.type === 'MP_OAUTH_SUCCESS') {
        setMsgSucesso('Conta Mercado Pago conectada com sucesso! Pagamentos Pix ativados.');
        setConectandoOAuth(false);
        setPopupOauthAberto(false);
        carregarConfiguracoes();
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setMsgErro(event.data?.error || 'Erro ao conectar conta do Mercado Pago.');
        setConectandoOAuth(false);
        setPopupOauthAberto(false);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  // Escuta retorno por URL de fallback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mp_oauth') === 'sucesso') {
      setMsgSucesso('Conta Mercado Pago conectada com sucesso! Pagamentos Pix ativados.');
      carregarConfiguracoes();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('mp_oauth') === 'erro') {
      setMsgErro(params.get('msg') || 'Erro ao conectar conta do Mercado Pago.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Dispara a conexão direta OAuth do Mercado Pago
  const iniciarConexaoMercadoPago = async () => {
    setConectandoOAuth(true);
    setMsgErro('');
    setMsgSucesso('');
    try {
      const origin = window.location.origin;
      const res = await authFetch(`/api/auth/mercadopago/url?origin=${encodeURIComponent(origin)}`);
      const data = await res.json();
      
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Não foi possível gerar o link de login do Mercado Pago.');
      }

      setOauthAuthUrl(data.url);
      setPopupOauthAberto(true);

      const popupWidth = 600;
      const popupHeight = 750;
      const left = Math.max(0, (window.screen.width - popupWidth) / 2);
      const top = Math.max(0, (window.screen.height - popupHeight) / 2);

      const popup = window.open(
        data.url,
        'mercadopago_oauth',
        `width=${popupWidth},height=${popupHeight},top=${top},left=${left},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // Se popup foi bloqueado pelo navegador, redireciona diretamente
        window.location.href = data.url;
      }
    } catch (err: any) {
      setMsgErro(err.message || 'Falha ao iniciar conexão com Mercado Pago.');
      setConectandoOAuth(false);
      setPopupOauthAberto(false);
    }
  };

  const handleSalvar = async (metodoParaAtivar?: MetodoPagamentoAtivo, fecharModal: boolean = false, statusCarteiraOverride?: string) => {
    setSalvando(true);
    setMsgSucesso('');
    setMsgErro('');

    const targetMetodo = metodoParaAtivar || metodoAtivo;
    const finalStatus = statusCarteiraOverride || carteiraStatus || "pendente";

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
          status: finalStatus
        },
        mpAccessToken: mpAccessToken.trim(),
        mpPublicKey: mpPublicKey.trim(),
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

  const isGatewayConnected = (id: string) => {
    if (id === 'carteira') return carteiraStatus === 'aprovado';
    if (id === 'mercadopago') return Boolean(config?.mpConfigurado || mpAccessToken.trim());
    if (id === 'pushinpay') return Boolean(pushinToken.trim());
    if (id === 'pay2m') return Boolean(pay2mClientId.trim() && pay2mSecretKey.trim());
    if (id === 'paggue') return Boolean(paggueClientId.trim() && paggueClientSecret.trim());
    if (id === 'zettpay') return Boolean(zettpayApiKey.trim());
    if (id === 'paggo365') return Boolean(paggoApiKey.trim());
    if (id === 'crypto') return Boolean(cryptoWallet.trim());
    return false;
  };

  const handleDesconectar = async (gatewayId: string) => {
    if (gatewayId === 'mercadopago') { 
      setMpAccessToken(''); 
      setMpPublicKey(''); 
      try {
        await authFetch('/api/admin/configuracoes/desconectar', { method: 'POST' });
      } catch (e) {
        console.error(e);
      }
    }
    if (gatewayId === 'pushinpay') { setPushinToken(''); }
    if (gatewayId === 'pay2m') { setPay2mClientId(''); setPay2mSecretKey(''); }
    if (gatewayId === 'paggue') { setPaggueClientId(''); setPaggueClientSecret(''); }
    if (gatewayId === 'zettpay') { setZettpayApiKey(''); }
    if (gatewayId === 'paggo365') { setPaggoApiKey(''); }
    if (gatewayId === 'crypto') { setCryptoWallet(''); }
    
    if (metodoAtivo === gatewayId) {
      setMetodoAtivo('carteira');
    }
    await handleSalvar(metodoAtivo === gatewayId ? 'carteira' : metodoAtivo, true);
  };

  // Lista dos métodos de pagamento (Efí Pay removido conforme solicitado)
  const metodosDePagamento = [
    { 
      id: 'mercadopago', 
      nome: 'Mercado Pago', 
      desc: 'Recebimento Pix direto na sua conta do Mercado Pago sem taxas extras da plataforma.', 
      icon: <Zap className="w-5 h-5 text-blue-400" />
    },
    { 
      id: 'carteira', 
      nome: 'Carteira do Sistema', 
      desc: `Taxa de ${carteiraTaxaPct}% por venda e R$ ${carteiraTaxaSaque.toFixed(2)} por saque Pix transferido automaticamente para sua conta.`, 
      icon: <Wallet className="w-5 h-5 text-emerald-400" />
    },
    { 
      id: 'pushinpay', 
      nome: 'PushinPay', 
      desc: 'Taxa Pix por transação com liquidação imediata e alta performance para volumes elevados.', 
      icon: <CreditCard className="w-5 h-5 text-indigo-400" /> 
    },
    { 
      id: 'pay2m', 
      nome: 'Pay2M', 
      desc: 'Taxa Pix de ~1.20% a 2.30% por venda com conciliação automática e saques programados.', 
      icon: <CreditCard className="w-5 h-5 text-teal-400" /> 
    },
    { 
      id: 'paggue', 
      nome: 'Paggue', 
      desc: 'Taxa Pix de ~1.50% por transação com split automático de comissões e liquidação rápida.', 
      icon: <Layers className="w-5 h-5 text-cyan-400" /> 
    },
    { 
      id: 'zettpay', 
      nome: 'ZettPay', 
      desc: 'Taxa Pix com confirmação instantânea via webhook e tarifas reduzidas por volume de vendas.', 
      icon: <Zap className="w-5 h-5 text-yellow-400" /> 
    },
    { 
      id: 'paggo365', 
      nome: 'Paggo365', 
      desc: 'Taxa Pix de ~2.99% por venda, desenvolvida para processamento contínuo em rifas e sorteios.', 
      icon: <Globe className="w-5 h-5 text-rose-400" /> 
    },
    { 
      id: 'crypto', 
      nome: 'Cripto / Web3', 
      desc: 'Taxa zero da plataforma. Apenas a taxa de rede blockchain (USDT TRC20 / BEP20).', 
      icon: <Coins className="w-5 h-5 text-amber-400" /> 
    }
  ];

  const gatewayAbertoInfo = metodosDePagamento.find(g => g.id === modalGateway);
  const mpConectado = isGatewayConnected('mercadopago');

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-sm font-medium">Carregando métodos de pagamento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <CreditCard className="w-5 h-5" />
            </div>
            Métodos de Pagamento
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Configure o gateway de pagamento para receber os valores das suas campanhas.
          </p>
        </div>

        {metodoAtivo && (
          <div className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-2 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Método Ativo: <span className="text-emerald-400 font-bold">{metodosDePagamento.find(g => g.id === metodoAtivo)?.nome || 'Nenhum'}</span>
          </div>
        )}
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

      {/* Aviso de Janela OAuth Popup aberta */}
      {popupOauthAberto && oauthAuthUrl && (
        <div className="p-4 rounded-2xl border border-blue-500/40 bg-blue-500/10 text-blue-300 text-xs font-semibold flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
            <div>
              <p className="text-white font-bold">Autorização no Mercado Pago em andamento...</p>
              <p className="text-[11px] text-blue-200 mt-0.5">Faça login na janela que se abriu para autorizar a conexão.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href={oauthAuthUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="px-3 py-1.5 bg-[#009ee3] hover:bg-[#0081b8] text-white rounded-xl text-xs font-bold transition"
            >
              Abrir janela novamente
            </a>
            <button 
              onClick={() => { setPopupOauthAberto(false); setConectandoOAuth(false); }} 
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* CARDS DOS MÉTODOS DE PAGAMENTO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metodosDePagamento.map(g => {
          const isAtivo = metodoAtivo === g.id;
          const isCarteira = g.id === 'carteira';
          const isMp = g.id === 'mercadopago';
          const conectado = isGatewayConnected(g.id);

          return (
            <div
              key={g.id}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all duration-200 ${
                isAtivo
                  ? 'border-emerald-500/80 bg-slate-900 shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/30'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <div>
                {/* 1. Nome do Gateway */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl border ${
                    isAtivo 
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                      : 'bg-slate-800/80 border-slate-700/60 text-slate-300'
                  }`}>
                    {g.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        {g.nome}
                        {isAtivo && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                            Ativo
                          </span>
                        )}
                      </h3>
                      {!isAtivo && conectado && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Conectado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Informações das Taxas */}
                <p className="text-xs text-slate-400 leading-relaxed min-h-[44px]">
                  {g.desc}
                </p>
              </div>

              {/* 3. Ações */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                {/* CARTEIRA DO SISTEMA */}
                {isCarteira && (
                  carteiraStatus === 'aprovado' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (onAbrirCarteira) {
                          onAbrirCarteira();
                        } else {
                          setModalGateway('carteira');
                        }
                      }}
                      className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-2"
                    >
                      <Wallet className="w-4 h-4" />
                      Abrir Minha Carteira
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setModalGateway('carteira')}
                      className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
                    >
                      <Wallet className="w-4 h-4" />
                      Solicitar Acesso à Carteira
                    </button>
                  )
                )}

                {/* MERCADO PAGO: VAI DIRETO PARA O OAUTH AO CLICAR */}
                {isMp && (
                  !mpConectado ? (
                    <button
                      type="button"
                      disabled={conectandoOAuth}
                      onClick={iniciarConexaoMercadoPago}
                      className="w-full py-2.5 px-4 bg-[#009ee3] hover:bg-[#0081b8] disabled:opacity-70 text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-2"
                    >
                      {conectandoOAuth ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Conectando ao Mercado Pago...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Conectar Mercado Pago
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      {!isAtivo ? (
                        <button
                          type="button"
                          onClick={() => handleSalvar('mercadopago')}
                          className="flex-1 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Tornar Ativo
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={conectandoOAuth}
                          onClick={iniciarConexaoMercadoPago}
                          className="flex-1 py-2.5 px-3 bg-[#009ee3] hover:bg-[#0081b8] text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          {conectandoOAuth ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                          Reconectar
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => handleDesconectar('mercadopago')}
                        title="Desconectar Mercado Pago"
                        className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                )}

                {/* DEMAIS GATEWAYS */}
                {!isCarteira && !isMp && (
                  !conectado ? (
                    <button
                      type="button"
                      onClick={() => setModalGateway(g.id as MetodoPagamentoAtivo)}
                      className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
                    >
                      Conectar {g.nome}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      {!isAtivo ? (
                        <button
                          type="button"
                          onClick={() => handleSalvar(g.id as MetodoPagamentoAtivo)}
                          className="flex-1 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Tornar Ativo
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setModalGateway(g.id as MetodoPagamentoAtivo)}
                          className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                        >
                          Configurar
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => handleDesconectar(g.id)}
                        title={`Desconectar ${g.nome}`}
                        className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE SOLICITAÇÃO DA CARTEIRA OU DEMAIS GATEWAYS MANUAIS */}
      {modalGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div 
            className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-slate-800 border border-slate-700">
                  {gatewayAbertoInfo?.icon}
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    {modalGateway === 'carteira' ? 'Solicitar Acesso à Carteira do Sistema' : `Configuração - ${gatewayAbertoInfo?.nome}`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {modalGateway === 'carteira' 
                      ? 'Preencha seus dados para habilitar os saques automáticos via Pix.'
                      : 'Configure suas chaves de API e credenciais de integração.'
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
            <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
              {/* 1. CARTEIRA DO SISTEMA */}
              {modalGateway === 'carteira' && (
                <div className="space-y-4">
                  {carteiraStatus === 'aprovado' && !editandoCarteira ? (
                    <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400"/> Conta Aprovada
                        </h5>
                        <button
                          type="button"
                          onClick={() => setEditandoCarteira(true)}
                          className="text-xs text-emerald-400 hover:underline font-bold"
                        >
                          Editar Dados
                        </button>
                      </div>
                      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
                        <div className="flex justify-between"><span className="text-slate-400">Titular:</span> <span className="text-white font-bold">{carteiraNome || '-'}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">E-mail:</span> <span className="text-white font-bold">{carteiraEmail || '-'}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">CPF/CNPJ:</span> <span className="text-white font-bold">{carteiraDocumento || '-'}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Telefone:</span> <span className="text-white font-bold">{carteiraTelefone || '-'}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Chave Pix:</span> <span className="text-emerald-400 font-bold">{carteiraChavePix || '-'} ({carteiraTipoPix.toUpperCase()})</span></div>
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
                  ) : carteiraStatus === 'pendente' && !editandoCarteira ? (
                    <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-4">
                      <div className="flex items-start gap-3">
                        <RefreshCw className="w-8 h-8 text-amber-400 shrink-0 mt-0.5 animate-spin" />
                        <div className="flex-1">
                          <h4 className="text-sm font-black text-amber-300">Solicitação em Análise</h4>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            Sua solicitação de acesso à carteira do sistema foi enviada e está aguardando liberação.
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
                        <div className="flex justify-between"><span className="text-slate-400">Titular:</span> <span className="text-white font-bold">{carteiraNome || '-'}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">E-mail:</span> <span className="text-white font-bold">{carteiraEmail || '-'}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">CPF/CNPJ:</span> <span className="text-white font-bold">{carteiraDocumento || '-'}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Celular:</span> <span className="text-white font-bold">{carteiraTelefone || '-'}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Chave Pix:</span> <span className="text-amber-400 font-mono font-bold">{carteiraChavePix || '-'} ({carteiraTipoPix.toUpperCase()})</span></div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditandoCarteira(true)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          Editar Dados da Solicitação
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
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
                          let novoStatus = carteiraStatus;
                          if (!carteiraStatus || carteiraStatus === 'rejeitado') {
                            novoStatus = 'pendente';
                            setCarteiraStatus('pendente');
                          }
                          await handleSalvar('carteira', true, novoStatus);
                          setEditandoCarteira(false);
                        }}
                        className="w-full py-3.5 mt-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                      >
                        {salvando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {carteiraStatus === 'pendente' || carteiraStatus === 'aprovado' ? 'Salvar e Atualizar Dados' : 'Enviar Solicitação de Carteira'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* DEMAIS GATEWAYS (PUSHINPAY, PAY2M, ETC) */}
              {modalGateway && modalGateway !== 'carteira' && (
                <div className="space-y-4">
                  {modalGateway === 'pushinpay' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-[11px] text-indigo-200 leading-relaxed">
                        Acesse o painel da <span className="font-mono text-indigo-300">PushinPay</span>, vá em Integrações / API e copie o seu <strong>Token de API</strong>.
                      </div>
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
                      <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-2xl text-[11px] text-teal-200 leading-relaxed">
                        No painel <span className="font-mono text-teal-300">Pay2M</span>, copie o seu <strong>Client ID</strong> e <strong>Secret Key</strong>.
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300">Client ID (Pay2M)</label>
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
                      <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-[11px] text-cyan-200 leading-relaxed">
                        No painel da <span className="font-mono text-cyan-300">Paggue</span>, copie o seu <strong>Client ID</strong> e o <strong>Client Secret</strong>.
                      </div>
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
