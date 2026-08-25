import { Campanha, Pedido, Comprador, RankingItem, CotaPremiada, ConfigOrganizador, MarcaConfig, RedesSociais, EstiloSalvo, TemaCampanha, MensagemFila, CheckoutSalvo, CheckoutConfig, CarteiraSaldo, TransacaoCarteira, SolicitacaoSaque } from '../src/types.js';

// Campos que o organizador pode salvar nas configurações
export interface DadosConfig {
  mpAccessToken?: string | null;
  mpPublicKey?: string | null;
  mpUserId?: string | number | null;
  mpConexaoTipo?: 'oauth' | 'manual' | null;
  mpConectadoEm?: string | null;
  marca?: MarcaConfig;
  redes?: RedesSociais;
  metaPixelId?: string | null;
  metaCapiToken?: string | null;
  metaAccessToken?: string | null;
  metaAdAccountId?: string | null;
  metaConexaoTipo?: 'oauth' | 'manual' | null;
  metaConectadoEm?: string | null;
  notificameToken?: string | null;
  
  // Gateways & Carteira
  metodoAtivo?: 'carteira' | 'mercadopago' | 'asaas' | 'efipay' | 'pay2m' | 'paggue' | 'pushinpay' | 'zettpay' | 'paggo365' | 'pix_manual' | 'crypto' | 'manual';
  carteiraConfig?: {
    ativo?: boolean;
    taxaVendaPct?: number;
    taxaSaqueImediato?: number;
    chavePixRecebimento?: string;
    nome?: string;
    dataNascimento?: string;
    email?: string;
    documento?: string;
    telefone?: string;
    tipoChavePix?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
    chavePix?: string;
    status?: 'pendente' | 'aprovado' | 'rejeitado';
    taxasPersonalizadas?: Record<string, {
      taxaVendaPct?: number;
      taxaSaqueImediato?: number;
      observacao?: string;
      atualizadoEm?: string;
    }>;
  };
  asaasConfig?: {
    apiKey?: string | null;
    chavePix?: string | null;
    webhookToken?: string | null;
    ambiente?: 'producao' | 'sandbox';
    repassarTaxa?: boolean;
    ativo?: boolean;
  };
  efipayConfig?: {
    clientId?: string | null;
    clientSecret?: string | null;
    chavePix?: string | null;
    clientIdHomologacao?: string | null;
    clientSecretHomologacao?: string | null;
    chavePixHomologacao?: string | null;
    ambiente?: 'producao' | 'homologacao';
    certificadoBase64?: string | null;
    certificadoNome?: string | null;
    repassarTaxa?: boolean;
    ativo?: boolean;
  };
  pay2mConfig?: {
    clientId?: string | null;
    secretKey?: string | null;
    clientSecret?: string | null;
    repassarTaxa?: boolean;
    ativo?: boolean;
  };
  paggueConfig?: {
    clientId?: string | null;
    clientKey?: string | null;
    clientSecret?: string | null;
    repassarTaxa?: boolean;
    ativo?: boolean;
  };
  pushinpayConfig?: {
    token?: string | null;
    repassarTaxa?: boolean;
    ativo?: boolean;
  };
  zettpayConfig?: {
    apiKey?: string | null;
    clientId?: string | null;
    clientSecret?: string | null;
    repassarTaxa?: boolean;
    ativo?: boolean;
  };
  paggo365Config?: {
    apiKey?: string | null;
    publicKey?: string | null;
    secretKey?: string | null;
    valorMinimo?: number;
    ativo?: boolean;
  };
  pixManualConfig?: {
    tipoChave: 'cpf_cnpj' | 'email' | 'telefone' | 'aleatoria';
    chavePix: string;
    nomeBeneficiario: string;
    instrucoes?: string;
    ativo?: boolean;
  };
  cryptoConfig?: {
    moeda?: 'USDT' | 'BTC';
    rede?: string;
    network?: string;
    walletAddress?: string;
    enderecoCarteira?: string;
    nomeIdentificacao?: string;
    ativo?: boolean;
  };
}

export interface EstatisticasCampanha {
  totalCotas: number;
  vendidas: number;
  reservadas: number;
  disponiveis: number;
  percentualVendido: number;
}

export interface MeusNumerosResult {
  comprador: Comprador | null;
  cotas: string[];
  pedidos: Pedido[];
}

export interface ConfirmarPedidoResult {
  success: boolean;
  cotasPremiadasEncontradas: CotaPremiada[];
  jaProcessado?: boolean;
}

export interface SorteioResult {
  campanha: Campanha;
  ganhador: { nome: string; whatsapp: string; cota: string; pedidoId: string } | null;
}

/**
 * Contrato comum aos backends de armazenamento (arquivo local e Firestore).
 * Todas as operações são assíncronas para suportar o Firestore.
 */
export interface Storage {
  // Campanhas
  getCampanhas(ownerId?: string): Promise<Campanha[]>;
  getCampanhaById(id: string): Promise<Campanha | null>;
  getCampanhaByCodigo(codigo: string): Promise<Campanha | null>;
  saveCampanha(campanha: Campanha): Promise<Campanha>;
  deleteCampanha(id: string): Promise<boolean>;

  // Cotas & estatísticas
  getEstatisticasCampanha(campanhaId: string, totalCotas: number): Promise<EstatisticasCampanha>;
  getRankingCampanha(campanhaId: string): Promise<RankingItem[]>;
  getCotasOcupadas(campanhaId: string): Promise<Record<string, { status: 'reservado' | 'vendido' }>>;
  reservarCotas(campanha: Campanha, numerosDesejados: string[], pedidoId: string, compradorId: string, compradorNome: string): Promise<void>;
  sortearCotasLivres(campanha: Campanha, quantidade: number): Promise<string[]>;

  // Pedidos
  savePedido(pedido: Pedido): Promise<Pedido>;
  getPedido(id: string): Promise<Pedido | null>;
  getPedidosPorCampanha(campanhaId: string): Promise<Pedido[]>;
  getTodosPedidos(): Promise<Pedido[]>;
  confirmarPedido(pedidoId: string, mpPaymentId?: string): Promise<ConfirmarPedidoResult>;
  getMeusNumeros(campanhaId: string, rawWhatsapp: string): Promise<MeusNumerosResult>;

  // Comprador
  saveComprador(comprador: Comprador): Promise<Comprador>;

  // Configurações de pagamento (Mercado Pago por organizador)
  getConfig(ownerId: string): Promise<ConfigOrganizador | null>;
  getTodasConfiguracoes(): Promise<{ ownerId: string; config: ConfigOrganizador }[]>;
  saveConfig(ownerId: string, dados: DadosConfig): Promise<ConfigOrganizador>;
  deleteConfig(ownerId: string): Promise<boolean>;
  getMpTokenPorCampanha(campanhaId: string): Promise<string | null>;

  // Manutenção / apuração
  limparReservasExpiradas(): Promise<{ cotasLiberadas: number; pedidosExpirados: number } | number>;
  realizarSorteio(campanhaId: string, numeroSorteado: string): Promise<SorteioResult>;

  // Estilos de tema salvos pelo organizador
  salvarEstilo(ownerId: string, estilo: { id?: string; nome: string; tema: TemaCampanha }): Promise<EstiloSalvo>;
  listarEstilos(ownerId: string): Promise<EstiloSalvo[]>;
  excluirEstilo(ownerId: string, id: string): Promise<boolean>;

  // Checkouts salvos pelo organizador
  salvarCheckout(ownerId: string, checkoutData: { id?: string; nome: string; checkout: CheckoutConfig }): Promise<CheckoutSalvo>;
  listarCheckouts(ownerId: string): Promise<CheckoutSalvo[]>;
  excluirCheckout(ownerId: string, id: string): Promise<boolean>;

  // Fila de Mensagens (Automação / Outbox)
  enfileirarMensagem(msg: Omit<MensagemFila, 'id' | 'criadoEm' | 'status'>): Promise<MensagemFila>;
  listarFilaPendente(limitNum: number): Promise<MensagemFila[]>;
  marcarStatusMensagem(id: string, status: 'pendente' | 'enviada' | 'erro' | 'cancelada', erro?: string): Promise<MensagemFila | null>;
  listarTodasMensagensFila(campanhaId?: string): Promise<MensagemFila[]>;

  // Carteira do Sistema & Saques
  getCarteiraSaldo(ownerId: string): Promise<CarteiraSaldo>;
  creditarVendaCarteira(ownerId: string, valorBruto: number, taxaPct: number, pedidoId: string, descricao: string): Promise<TransacaoCarteira>;
  solicitarSaque(dados: Omit<SolicitacaoSaque, 'id' | 'criadoEm' | 'status'>): Promise<SolicitacaoSaque>;
  listarTransacoesCarteira(ownerId: string): Promise<TransacaoCarteira[]>;
  listarSolicitacoesSaque(ownerId?: string): Promise<SolicitacaoSaque[]>;
  atualizarStatusSaque(saqueId: string, status: 'aprovado' | 'pago' | 'rejeitado', codigoAutenticacao?: string, observacao?: string): Promise<SolicitacaoSaque | null>;
}
