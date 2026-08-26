export interface Premio {
  posicao: number;
  descricao: string;
}

export interface CotaPremiada {
  numero: string;
  premio: string;
  status: 'disponivel' | 'encontrada';
  pedidoId: string | null;
  compradorNome?: string;
}

export interface Promocao {
  quantidade: number;
  valor: number;
  destaque: boolean;
}

export interface OfertaRelampago {
  id?: string;
  titulo: string;
  subtitulo: string;
  cotasExtras: number;
  preco: number;
  selo: string;
}

export interface TrilhaRecompensa {
  cotas: number;
  recompensa: string;
  icone?: string;
}

export interface RoletaItem {
  id?: string;
  titulo: string;
  cor: string;
  chancePct: number;
}

export interface TemaCampanha {
  cores: {
    primaria: string;
    destaque: string;
    fundo: string;
    texto: string;
    titulos: string;
    descricoes: string;
    botao: string;
    textoBotao: string;
    cardFundo: string;
    cardBorda: string;
    faviconFundo: string;
    iconeCor: string;
  };
  botao: {
    formato: 'reto' | 'arredondado' | 'pill' | 'super' | 'cortado' | 'inclinado' | 'square' | 'rounded' | 'pilled' | 'round';
    tamanhoAltura: number; // slider px (ex: 12 a 24)
    tamanhoTexto: number; // slider px (ex: 12 a 20)
    estilo: 'solido' | 'gradiente' | 'vidro' | 'transparente' | '3d' | 'neon' | 'outline' | 'soft';
    estiloPacotes?: 'solido' | 'gradiente' | 'vidro' | 'transparente' | '3d' | 'neon' | 'outline' | 'soft';
    estiloCotas?: 'solido' | 'gradiente' | 'vidro' | 'transparente' | '3d' | 'neon' | 'outline' | 'soft';
    sombraAltura?: number; // 3D shadow height (ex: 4px)
    sombraLargura?: number; // 3D shadow width / offset (ex: 4px)
    corSombra?: string; // 3D shadow color
    textoCompra: string;
  };
  tipografia: {
    fonteTitulo: string; // ex: 'Inter', 'Poppins', etc.
    fonteTexto: string;  // ex: 'Inter', 'Roboto', etc.
    tamanhoTitulo: number; // slider px
    tamanhoTexto: number;  // slider px
  };
  fundoMidia?: {
    tipo: 'cor' | 'imagem' | 'video';
    url?: string;
  };
  organizadorCabecalho?: {
    logoTamanho: number; // ex: 32 a 64
    logoAlinhamento: 'esquerda' | 'centro' | 'direita';
  };
  ganhadorCelebracaoEstilo?: 'confetes' | 'estrela' | 'fogo' | 'coracao' | 'moeda' | 'trofeu' | 'diamante' | 'raio' | 'coroa' | 'foguete';
  layout: {
    ordem: string[]; // ex: ['banner', 'barraProgresso', 'cotas', 'premios', 'premiadas', 'ranking', 'regulamento', 'ganhadores']
    visivel: Record<string, boolean>;
  };
}

export const GOOGLE_FONTS_LIST = [
  'Inter',
  'Poppins',
  'Montserrat',
  'Roboto',
  'Open Sans',
  'Lato',
  'Oswald',
  'Playfair Display',
  'Raleway',
  'Ubuntu',
  'Nunito',
  'Plus Jakarta Sans',
  'Outfit',
  'Syne',
  'Space Grotesk',
  'DM Sans',
  'Merriweather',
  'Cinzel',
  'Lexend',
  'Sora'
];

export interface EstiloSalvo {
  id: string;
  ownerId?: string;
  nome: string;
  tema: TemaCampanha;
  criadoEm: string;
}

export interface CheckoutSalvo {
  id: string;
  ownerId?: string;
  nome: string;
  checkout: CheckoutConfig;
  criadoEm: string;
}

export const TEMA_PADRAO: TemaCampanha = {
  cores: {
    primaria: '#10b981',
    destaque: '#059669',
    fundo: '#0f172a',
    texto: '#f8fafc',
    titulos: '#ffffff',
    descricoes: '#94a3b8',
    botao: '#10b981',
    textoBotao: '#022c22',
    cardFundo: '#1e293b',
    cardBorda: '#334155',
    faviconFundo: '#334155',
    iconeCor: '#10b981'
  },
  botao: {
    formato: 'arredondado',
    tamanhoAltura: 16,
    tamanhoTexto: 15,
    estilo: 'solido',
    estiloPacotes: 'solido',
    estiloCotas: 'solido',
    sombraAltura: 4,
    sombraLargura: 4,
    corSombra: '#047857',
    textoCompra: 'GARANTIR MEUS NÚMEROS'
  },
  tipografia: {
    fonteTitulo: 'Inter',
    fonteTexto: 'Inter',
    tamanhoTitulo: 24,
    tamanhoTexto: 16
  },
  fundoMidia: {
    tipo: 'cor',
    url: ''
  },
  organizadorCabecalho: {
    logoTamanho: 40,
    logoAlinhamento: 'centro'
  },
  ganhadorCelebracaoEstilo: 'confetes',
  layout: {
    ordem: ['banner', 'barraProgresso', 'cotas', 'premios', 'premiadas', 'ranking', 'regulamento', 'ganhadores'],
    visivel: {
      banner: true,
      barraProgresso: true,
      cotas: true,
      premios: true,
      premiadas: true,
      ranking: true,
      regulamento: true,
      ganhadores: true,
      contador: true,
      provaSocial: true,
      organizador: true
    }
  }
};

export interface ConfirmacaoCompraConfig {
  titulo?: string;
  subtitulo?: string;
  mensagemAgradecimento?: string;
  exibirConfetes?: boolean;
  exibirNumeros?: boolean;
  exibirBotaoCopiar?: boolean;
  exibirBotaoWhatsapp?: boolean;
  exibirBotaoMeusNumeros?: boolean;
  botaoGrupoVipAtivo?: boolean;
  botaoGrupoVipTexto?: string;
  botaoGrupoVipLink?: string;
  bannerSucessoUrl?: string;
  instrucoesPosCompra?: string;
}

export interface CheckoutConfig {
  metodos: {
    pix: boolean;
    cartao: boolean;
    boleto: boolean;
  };
  parcelasMax: number; // ex: 1 a 12
  taxaParcelamento: 'comprador' | 'organizador';
  mensagens: {
    topo?: string;
    pix?: string;
    cartao?: string;
    sucesso?: string;
    urgencia?: string;
  };
  selosSeguranca: boolean;
  confirmacao?: ConfirmacaoCompraConfig;
  corPrimaria?: string;
  corFundo?: string;
  fonteFamilia?: string;
  textoBotao?: string;
  textoRodape?: string;
  bannerUrl?: string;
  temporizadorAtivo?: boolean;
  temporizadorMinutos?: number;
  mensagemEscassez?: string;
  selosExtras?: string[];
}

export const DEFAULT_CHECKOUT_CONFIG: CheckoutConfig = {
  metodos: {
    pix: true,
    cartao: true,
    boleto: false
  },
  parcelasMax: 12,
  taxaParcelamento: 'comprador',
  mensagens: {
    topo: 'Selecione a forma de pagamento:',
    pix: 'Aprovação imediata via Pix com QR Code e Copia e Cola.',
    cartao: 'Pagamento rápido e seguro processado no cartão de crédito.',
    sucesso: 'Seu pagamento foi confirmado! Seus números foram gerados com sucesso.',
    urgencia: 'Seus números estão reservados por tempo limitado. Conclua o pagamento!'
  },
  selosSeguranca: true,
  confirmacao: {
    titulo: 'Pagamento Confirmado! 🎉',
    subtitulo: 'Seu pagamento foi processado com sucesso. Seus números já estão salvos e vinculados ao seu WhatsApp!',
    mensagemAgradecimento: 'Obrigado por participar! Boa sorte no sorteio!',
    exibirConfetes: true,
    exibirNumeros: true,
    exibirBotaoCopiar: true,
    exibirBotaoWhatsapp: true,
    exibirBotaoMeusNumeros: true,
    botaoGrupoVipAtivo: false,
    botaoGrupoVipTexto: 'Entrar no Grupo VIP do WhatsApp',
    botaoGrupoVipLink: '',
    bannerSucessoUrl: '',
    instrucoesPosCompra: 'Acompanhe a apuração e o sorteio oficial pelos nossos canais oficiais.'
  },
  corPrimaria: '#10b981',
  corFundo: '#020617',
  fonteFamilia: 'Inter',
  textoBotao: 'GERAR PIX AGORA',
  textoRodape: 'Pagamento 100% seguro com tecnologia criptografada de ponta a ponta.',
  temporizadorAtivo: false,
  temporizadorMinutos: 10,
  mensagemEscassez: '🔥 Alta demanda: restam poucas cotas disponíveis para este sorteio!',
  selosExtras: ['ssl', 'aprovacao']
};

export interface CupomDesconto {
  id?: string;
  codigo: string; // ex: 'VOLTA10' ou 'QUERO20'
  descontoPct: number; // ex: 10 para 10%
  ativo?: boolean;
  criadoEm?: string;
}

export interface RegraNaoPagou {
  faltandoMin?: number;      // ex: 5 (antes de expirar)
  aposExpirarMin?: number;   // ex: 0, 1440 (24h), 10080 (7 dias)
  cupom?: string;
  descontoPct?: number;
  mensagem: string;          // suporta {nome},{campanha},{link},{cupom},{numeros}
}

export interface RegraPago {
  ativo: boolean;
  enviarNumeros: boolean;    // manda a lista de cotas ganhas
  mensagem: string;          // {nome},{campanha},{qtd},{numeros}
}

export interface RemarketingConfig {
  ativo: boolean;
  canal: 'whatsapp' | 'email' | 'ambos';
  regrasNaoPagou: RegraNaoPagou[];
  regraPago: RegraPago;
  somenteSeCampanhaAtiva: boolean; // regras de +24h/+7d só disparam se a campanha ainda estiver publicada
  // Retrocompatibilidade se necessário
  aguardando?: any[];
  expirado?: any[];
}

export interface MensagemFila {
  id: string;
  ownerId: string;
  campanhaId: string;
  pedidoId: string;
  para: string; // whatsapp com DDI 55
  canal: 'whatsapp' | 'email' | 'ambos';
  texto: string;
  tipo: 'nao_pagou' | 'pago';
  status: 'pendente' | 'enviada' | 'erro' | 'cancelada';
  erro?: string;
  chaveIdempotencia: string; // ex: pedidoId+regra
  criadoEm: string;
  enviadoEm?: string | null;
}

export interface Campanha {
  id: string;
  modalidade?: 'paga' | 'gratis'; // Rifa paga vs Sorteio gratuito
  ownerId?: string; // uid do organizador (Firebase Auth) dono da campanha
  ownerEmail?: string; // email do organizador (referência)
  codigo: string; // curto e único, ex: 'civic-turbo' ou 'iphone-16'
  titulo: string;
  subtitulo?: string;
  descricao: string; // regulamento / detalhes
  bannerUrl: string;
  fotosCarrossel?: string[]; // fotos adicionais para carrossel
  youtubeUrl: string | null;
  modelo: 'aleatorio' | 'manual';
  totalCotas: number; // ex: 10000 ou 100000
  valorCota: number; // em reais, ex: 0.03 ou 0.50
  minPorCompra: number;
  maxPorCompra: number;
  localSorteio: string; // ex: "Loteria Federal"
  dataSorteio: string | null; // ISO string
  agendamentoAtivo?: boolean;
  metaPixelId?: string | null;
  metaCampaignId?: string | null; // Adicionado para associação com campanhas do Facebook
  dataInicio?: string | null;
  dataTermino?: string | null;
  descontoPorValorTotal?: { aPartirDeValor: number; valorCotaComDesconto: number }[];
  organizadorNome?: string;
  organizadorFoto?: string;
  organizadorWhatsapp?: string;
  organizadorInstagram?: string;
  organizadorTiktok?: string;
  premios: Premio[];
  cotasPremiadas: CotaPremiada[];
  promocoes: Promocao[];
  ofertasRelampago: OfertaRelampago[];
  selo: string | null; // ex: "Corre que essa vai rápido! 🔥"
  tempoReservaMin: number; // ex: 7 ou 15
  filtroInicialCotas?: 'todas' | 'disponiveis' | 'reservadas';
  ebookUrl?: string | null; // link do brinde digital pós-pagamento
  ebookTitulo?: string | null;
  roletaPremiada?: {
    ativa: boolean;
    itens: RoletaItem[];
  } | null;
  trilhaPremios?: TrilhaRecompensa[];
  afiliadosAtivo?: boolean;
  comissaoAfiliadoPct?: number;
  exibirRanking: boolean;
  exibirBarraProgresso: boolean;
  exibirPaginaGanhadores: boolean;
  exibirQtdCotas?: boolean;
  exibirCompradores?: boolean;
  exibirSelo?: boolean;
  exibirSeloOficial?: boolean;
  exibirPremios?: boolean;
  exibirCotasPremiadas?: boolean;
  tempoAnimacaoSorteioSegundos?: number;
  exigirEmail: boolean;
  exigirCpf: boolean;
  tema?: TemaCampanha;
  checkoutId?: string;
  checkout?: CheckoutConfig;
  remarketing?: RemarketingConfig;
  cupons?: CupomDesconto[];
  status: 'rascunho' | 'publicada' | 'pausada' | 'encerrada';
  numeroSorteado: string | null;
  ganhador?: {
    nome: string;
    whatsapp: string;
    cota: string;
    pedidoId: string;
  } | null;
  ganhadoresHistorico?: GanhadorRecord[];
  criadaEm: string;
  atualizadaEm?: string;
}

export interface GanhadorRecord {
  nome: string;
  whatsapp: string;
  cota: string;
  pedidoId?: string;
  premioDescricao?: string;
  dataSorteio?: string;
}

export interface Cota {
  numero: string;
  status: 'reservado' | 'vendido';
  pedidoId: string;
  reservadoAte: string | null; // ISO string
  compradorId: string | null;
  compradorNome?: string;
}

// Redes sociais do organizador (exibidas na página pública)
export interface RedesSociais {
  whatsapp?: string | null;
  telegram?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
}

// Marca do organizador (personalização da página pública)
export interface MarcaConfig {
  nomeMarca?: string | null;
  logoUrl?: string | null;
  corPrincipal?: string | null; // ex: #2563eb
  corDestaque?: string | null;  // ex: #10b981
}

// Configurações por organizador
export interface ConfigOrganizador {
  ownerId: string;
  // Pagamento (Mercado Pago)
  mpAccessToken: string | null; // segredo — nunca enviado de volta ao cliente
  mpPublicKey: string | null;   // pública — pode ser exibida
  // Conexão Mercado Pago (OAuth ou manual)
  mpUserId?: string | number | null;
  mpConexaoTipo?: 'oauth' | 'manual' | null;
  mpConectadoEm?: string | null;
  // Marca / personalização
  marca?: MarcaConfig;
  redes?: RedesSociais;
  // Pixels & Anúncios
  metaPixelId?: string | null;      // público — injetado na página pública
  metaCapiToken?: string | null;    // segredo — para Conversions API (server-side)
  // Meta Ads (Marketing API) — para a aba de Analytics
  metaAccessToken?: string | null;  // segredo — nunca retornado ao cliente
  metaAdAccountId?: string | null;  // ex: act_1234567890
  metaConexaoTipo?: 'oauth' | 'manual' | null;
  metaConectadoEm?: string | null;
  notificameToken?: string | null;  // segredo — para envio via WhatsApp Notificame
  
  // MÉTODOS DE PAGAMENTO E GATEWAYS
  metodoAtivo?: 'carteira' | 'mercadopago' | 'asaas' | 'efipay' | 'pay2m' | 'paggue' | 'pushinpay' | 'zettpay' | 'paggo365' | 'pix_manual' | 'crypto' | 'manual';
  
  // Carteira do Sistema (Efí Pay Integrada)
  carteiraConfig?: {
    ativo?: boolean;
    taxaVendaPct?: number; // ex: 5.0 para 5.0%
    taxaSaqueImediato?: number; // ex: 4.50
    chavePixRecebimento?: string;
    tipoChavePixRecebimento?: string;
    nomeTitularRecebimento?: string;
    isencaoTaxaPublicacao?: boolean;
    nome?: string;
    dataNascimento?: string;
    email?: string;
    documento?: string;
    tipoChavePix?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
    chavePix?: string;
    telefone?: string;
    status?: "pendente" | "aprovado" | "rejeitado";
    // Map de taxas personalizadas por usuário (gerenciadas pelo Super Admin)
    taxasPersonalizadas?: Record<string, {
      taxaVendaPct?: number;
      taxaSaqueImediato?: number;
      observacao?: string;
      atualizadoEm?: string;
    }>;
  };
  
  // Asaas (Direto)
  asaasConfig?: {
    apiKey?: string | null;
    chavePix?: string | null;
    webhookToken?: string | null;
    ambiente?: 'producao' | 'sandbox';
    repassarTaxa?: boolean;
    ativo?: boolean;
  };

  // EFIPAY (Gerencianet)
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

  // Pay2M
  pay2mConfig?: {
    clientId?: string | null;
    secretKey?: string | null;
    clientSecret?: string | null;
    repassarTaxa?: boolean;
    ativo?: boolean;
  };

  // Paggue
  paggueConfig?: {
    clientId?: string | null;
    clientKey?: string | null;
    clientSecret?: string | null;
    repassarTaxa?: boolean;
    ativo?: boolean;
  };

  // PushinPay
  pushinpayConfig?: {
    token?: string | null;
    repassarTaxa?: boolean;
    ativo?: boolean;
  };

  // ZettPay
  zettpayConfig?: {
    apiKey?: string | null;
    clientId?: string | null;
    clientSecret?: string | null;
    repassarTaxa?: boolean;
    ativo?: boolean;
  };

  // Paggo365
  paggo365Config?: {
    apiKey?: string | null;
    publicKey?: string | null;
    secretKey?: string | null;
    valorMinimo?: number;
    ativo?: boolean;
  };

  // Pix Manual
  pixManualConfig?: {
    tipoChave: 'cpf_cnpj' | 'email' | 'telefone' | 'aleatoria';
    chavePix: string;
    nomeBeneficiario: string;
    instrucoes?: string;
    ativo?: boolean;
  };

  // Crypto (USDT/BTC)
  cryptoConfig?: {
    moeda?: 'USDT' | 'BTC';
    rede?: string;
    network?: string;
    walletAddress?: string;
    enderecoCarteira?: string;
    nomeIdentificacao?: string;
    ativo?: boolean;
  };

  atualizadaEm: string;
}

export type MetodoPagamentoAtivo = 
  | 'carteira'
  | 'asaas'
  | 'mercadopago'
  | 'efipay'
  | 'pushinpay'
  | 'pay2m'
  | 'paggue'
  | 'zettpay'
  | 'paggo365'
  | 'crypto'
  | 'manual';

// Entidades de Carteira do Sistema & Saques
export interface CarteiraSaldo {
  ownerId?: string;
  saldoTotal?: number;
  saldoDisponivel: number;
  saldoPendente: number;
  totalVendido?: number;
  totalArrecadado?: number;
  totalSacado: number;
  totalTaxasPagas?: number;
  totalTaxas?: number;
  atualizadoEm?: string;
}

export interface TransacaoCarteira {
  id: string;
  ownerId: string;
  tipo: 'venda' | 'saque' | 'taxa_plataforma' | 'estorno';
  valorBruto: number;
  taxaPercentual?: number;
  taxaValor?: number;
  taxa?: number;
  valorLiquido: number;
  status: 'concluida' | 'processando' | 'pendente' | 'cancelada';
  descricao: string;
  pedidoId?: string;
  referenciaId?: string;
  criadoEm: string;
}

export interface SolicitacaoSaque {
  id: string;
  ownerId: string;
  valorSolicitado: number;
  taxaSaque: number;
  valorLiquido: number;
  modalidade: 'imediato' | 'd_mais_um' | 'dia_seguinte';
  tipoChavePix?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  chavePix?: string;
  bancoInfo?: {
    banco: string;
    agencia: string;
    conta: string;
    digito?: string;
    tipoConta?: string;
    titular?: string;
    documento?: string;
  };
  dadosBancarios?: {
    banco: string;
    agencia: string;
    conta: string;
    digito: string;
    tipoConta: 'corrente' | 'poupanca';
  };
  status: 'pendente' | 'aprovado' | 'pago' | 'rejeitado';
  codigoAutenticacao?: string;
  criadoEm: string;
  processadoEm?: string | null;
  observacao?: string;
}

// Dados de marca seguros para expor na página pública (sem segredos)
export interface MarcaPublica {
  nomeMarca: string | null;
  logoUrl: string | null;
  corPrincipal: string | null;
  corDestaque: string | null;
  redes: RedesSociais;
  metaPixelId: string | null;
  mpPublicKey?: string | null;
}

export interface Comprador {
  id: string;
  nome: string;
  whatsapp: string;
  cpf: string | null;
  email: string | null;
  criadoEm: string;
}

export interface Pedido {
  id: string;
  ownerId?: string;
  campanhaId: string;
  compradorId: string;
  comprador: {
    nome: string;
    whatsapp: string;
    cpf?: string | null;
    email?: string | null;
  };
  numeros: string[];
  quantidade: number;
  valorTotal: number;
  status: 'pendente' | 'pago' | 'expirado' | 'cancelado';
  metodoPagamento?: 'pix' | 'cartao' | 'boleto' | 'gratis';
  mpPaymentId: string | null;
  efiPaymentId?: string | null;
  pixCopiaCola: string | null;
  pixQrCodeBase64: string | null;
  boletoUrl?: string | null;
  boletoLinhaDigitavel?: string | null;
  boletoCodigoBarras?: string | null;
  cartaoInfo?: {
    brand?: string;
    ultimosDigitos?: string;
    parcelas?: number;
  } | null;
  cupomAplicado?: {
    codigo: string;
    descontoPct: number;
    valorDesconto: number;
  } | null;
  remarketingEnviado?: string[]; // IDs/Chaves das regras já disparadas
  expiraEm: string; // ISO string
  criadoEm: string;
  pagoEm: string | null;
}

export interface RankingItem {
  posicao: number;
  nome: string;
  whatsappMascara: string;
  quantidadeCotas: number;
}

export interface CampanhaPublicaResponse {
  campanha: Campanha;
  estatisticas: {
    totalCotas: number;
    vendidas: number;
    reservadas: number;
    disponiveis: number;
    percentualVendido: number;
    arrecadado: number;
  };
  ranking: RankingItem[];
  marca?: MarcaPublica;
  cotasOcupadas?: Record<string, { status: 'reservado' | 'vendido' }>;
}
