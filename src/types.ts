export interface Premio {
  posicao: number;
  descricao: string;
  corFundo?: string;
  corTexto?: string;
  corBadgeFundo?: string;
  corBadgeTexto?: string;
  corBorda?: string;
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
  descontoPct?: number;
  rotulo?: string;
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
    // Cores específicas individuais por seção de ícones
    iconePremios?: string;
    iconeRegulamento?: string;
    iconeCotasPremiadas?: string;
    iconeTopCompradores?: string;
    iconeGanhadores?: string;
    iconeMeusNumeros?: string;
    iconeSorteio?: string;
    // Cores de Selos e Badges
    seloBannerFundo?: string;
    seloBannerTexto?: string;
    seloPopularFundo?: string;
    seloPopularTexto?: string;
    botaoDestaqueFundo?: string;
    botaoDestaqueTexto?: string;
    // Cores específicas solicitadas
    barraProgressoFundo: string;
    barraProgressoPreenchimento: string;
    barraProgressoTexto: string;
    cardBarraProgressoFundo: string;
    botaoCotasFundo: string;
    botaoCotasTexto: string;
    botaoCotasNumero: string;
    botaoCotasBorda?: string;
    controlesFundo: string;
    controlesTexto: string;
    controlesInputFundo?: string;
    controlesInputTexto?: string;
    controlesBorda?: string;
    textoPrecoBarra: string;
    subtituloCor: string;
    localSorteioCor: string;
    // Cores da Seção de Prêmios
    premioFundo?: string;
    premioTexto?: string;
    premioBadgeFundo?: string;
    premioBadgeTexto?: string;
    premioBorda?: string;
    // Cores individuais de cada card de seção
    cardBannerFundo?: string;
    cardBannerBorda?: string;
    cardProgressoFundo?: string;
    cardProgressoBorda?: string;
    cardCotasFundo?: string;
    cardCotasBorda?: string;
    cardCotasTexto?: string;
    cardPremiosFundo?: string;
    cardPremiosBorda?: string;
    cardCotasPremiadasFundo?: string;
    cardCotasPremiadasBorda?: string;
    cardRankingFundo?: string;
    cardRankingBorda?: string;
    cardRegulamentoFundo?: string;
    cardRegulamentoBorda?: string;
    cardRegulamentoTexto?: string;
    cardGanhadoresFundo?: string;
    cardGanhadoresBorda?: string;
    rankingQtdCotasTexto?: string;
    rankingItemFundo?: string;
    ranking1Fundo?: string;
    ranking1Texto?: string;
    rankingOutroFundo?: string;
    rankingOutroTexto?: string;
    cardRegulamentoTituloCor?: string;
    ganhadorBlocoFundo?: string;
    ganhadorBlocoBorda?: string;
    ganhadorCotaTexto?: string;
    ganhadorTrofeuFundo?: string;
    cotaPremiadaLivreFundo?: string;
    cotaPremiadaLivreBorda?: string;
    cotaPremiadaLivreTexto?: string;
    cotaPremiadaAchadaFundo?: string;
    cotaPremiadaAchadaBorda?: string;
    cotaPremiadaAchadaTexto?: string;
    // Títulos / Cotas Premiadas - Disponível
    premiadoDisponivelFundo?: string;
    premiadoDisponivelTexto?: string;
    premiadoDisponivelBadgeFundo?: string;
    premiadoDisponivelBadgeTexto?: string;
    premiadoDisponivelBorda?: string;
    // Títulos / Cotas Premiadas - Ganho
    premiadoGanhoFundo?: string;
    premiadoGanhoTexto?: string;
    premiadoGanhoBadgeFundo?: string;
    premiadoGanhoBadgeTexto?: string;
    premiadoGanhoBorda?: string;
  };
  barraProgresso?: {
    titulo?: string;
    subtitulo?: string;
    rodape?: string;
    textoInterno?: string;
    altura?: number;
    raioBorda?: number;
    larguraMax?: string;
  };
  secaoIcones: {
    premios: string;
    cotasPremiadas: string;
    topCompradores: string;
    ganhadores: string;
    regulamento: string;
    descricao: string;
    meusNumeros?: string;
    sorteio?: string;
    botaoCompra?: string;
  };
  botao: {
    formato: 'reto' | 'arredondado' | 'pill' | 'super' | 'cortado' | 'inclinado' | 'square' | 'rounded' | 'pilled' | 'round';
    raioBorda: number; // 0 a 50
    tamanhoAltura: number; // slider px (ex: 12 a 24)
    tamanhoTexto: number; // slider px (ex: 12 a 20)
    estilo: 'solido' | 'vidro' | 'transparente' | '3d' | 'gradiente' | 'neon' | 'outline' | 'soft';
    sombraAltura?: number; // 3D shadow height (ex: 4px)
    sombraLargura?: number; // 3D shadow width / offset (ex: 4px)
    sombraOffsetX?: number;
    sombraOffsetY?: number;
    corSombra?: string; // 3D shadow color
    larguraBorda?: number;
    corBorda?: string;
    possuirBorda?: boolean;
    textoCompra: string;
    iconeCompra?: string;
    // Botões dos pacotes promocionais
    estiloPacotes?: 'solido' | 'vidro' | 'transparente' | '3d' | 'gradiente' | 'neon' | 'outline' | 'soft';
    raioBordaPacotes?: number; // 0 a 30
    tamanhoAlturaPacotes?: number; // slider px
    tamanhoTextoPacotes?: number;
    larguraBordaPacotes?: number;
    corBordaPacotes?: string;
    possuirBordaPacotes?: boolean;
    sombraAlturaPacotes?: number;
    sombraLarguraPacotes?: number;
    sombraOffsetXPacotes?: number;
    sombraOffsetYPacotes?: number;
    corSombraPacotes?: string;
    // Controles de ajuste manual (+ e -)
    estiloControles?: 'solido' | 'vidro' | 'transparente' | '3d' | 'gradiente' | 'neon' | 'outline' | 'soft';
    raioBordaControles?: number; // 0 a 30
    tamanhoControles?: number; // 32 a 56px
    tamanhoTextoControles?: number;
    larguraBordaControles?: number;
    corBordaControles?: string;
    possuirBordaControles?: boolean;
    sombraAlturaControles?: number;
    sombraLarguraControles?: number;
    sombraOffsetXControles?: number;
    sombraOffsetYControles?: number;
    corSombraControles?: string;
    // Cotas da grade manual
    estiloCotas?: 'solido' | 'vidro' | 'transparente' | '3d' | 'gradiente' | 'neon' | 'outline' | 'soft';
    raioBordaCotas?: number; // 0 a 20
    tamanhoCotas?: number;
    tamanhoTextoCotas?: number;
    larguraBordaCotas?: number;
    corBordaCotas?: string;
    possuirBordaCotas?: boolean;
    sombraAlturaCotas?: number;
    sombraLarguraCotas?: number;
    sombraOffsetXCotas?: number;
    sombraOffsetYCotas?: number;
    corSombraCotas?: string;
    // Cards das seções
    estiloCards?: 'solido' | 'vidro' | 'transparente' | '3d';
    raioBordaCards?: number; // 0 a 32
    tamanhoFonteCards?: number;
    tamanhoAlturaCards?: number;
    larguraBordaCards?: number;
    possuirBordaCards?: boolean;
    corBordaCards?: string;
    sombraAlturaCards?: number;
    sombraLarguraCards?: number;
    sombraOffsetXCards?: number;
    sombraOffsetYCards?: number;
    corSombraCards?: string;
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
    logoAlinhamento: 'esquerda' | 'centro' | 'direita';
  };
  bannerConfig?: {
    fullWidth?: boolean;
    overlayDegradeAtivo?: boolean;
    overlayDegrade?: string;
    overlayAltura?: number;
    seloAnimado?: boolean;
    seloEstilo?: 'pulso' | 'estatico';
    seloFundo?: string;
    seloTexto?: string;
    seloPosicao?: 'topo-esquerda' | 'topo-direita' | 'sobre-titulo';
  };
  ganhadorCelebracaoEstilo?: 'confetes' | 'nenhuma' | string;
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
    iconeCor: '#10b981',
    iconePremios: '#10b981',
    iconeRegulamento: '#10b981',
    iconeCotasPremiadas: '#10b981',
    iconeTopCompradores: '#10b981',
    iconeGanhadores: '#10b981',
    iconeMeusNumeros: '#10b981',
    iconeSorteio: '#10b981',
    barraProgressoFundo: '#1e293b',
    barraProgressoPreenchimento: '#10b981',
    barraProgressoTexto: '#ffffff',
    cardBarraProgressoFundo: '#1e293b',
    botaoCotasFundo: '#1e293b',
    botaoCotasTexto: '#94a3b8',
    botaoCotasNumero: '#ffffff',
    botaoCotasBorda: '#334155',
    controlesFundo: '#1e293b',
    controlesTexto: '#ffffff',
    controlesInputFundo: '#0f172a',
    controlesInputTexto: '#ffffff',
    controlesBorda: '#334155',
    textoPrecoBarra: '#10b981',
    subtituloCor: '#94a3b8',
    localSorteioCor: '#10b981',
    seloBannerFundo: '#f59e0b',
    seloBannerTexto: '#022c22',
    seloPopularFundo: '#f59e0b',
    seloPopularTexto: '#022c22',
    botaoDestaqueFundo: '#10b981',
    botaoDestaqueTexto: '#022c22',
    premioFundo: '#0f172a',
    premioTexto: '#ffffff',
    premioBadgeFundo: '#10b981',
    premioBadgeTexto: '#022c22',
    premioBorda: '#1e293b',
    cardBannerFundo: '#0f172a',
    cardBannerBorda: '#1e293b',
    cardProgressoFundo: '#0f172a',
    cardProgressoBorda: '#1e293b',
    cardCotasFundo: '#0f172a',
    cardCotasBorda: '#1e293b',
    cardCotasTexto: '#ffffff',
    cardPremiosFundo: '#0f172a',
    cardPremiosBorda: '#1e293b',
    cardCotasPremiadasFundo: '#0f172a',
    cardCotasPremiadasBorda: '#1e293b',
    cardRankingFundo: '#0f172a',
    cardRankingBorda: '#1e293b',
    cardRegulamentoFundo: '#0f172a',
    cardRegulamentoBorda: '#1e293b',
    cardRegulamentoTexto: '#cbd5e1',
    cardGanhadoresFundo: '#0f172a',
    cardGanhadoresBorda: '#1e293b',
    // Títulos / Cotas Premiadas
    premiadoDisponivelFundo: '#0f172a',
    premiadoDisponivelTexto: '#ffffff',
    premiadoDisponivelBadgeFundo: '#10b981',
    premiadoDisponivelBadgeTexto: '#022c22',
    premiadoDisponivelBorda: '#1e293b',
    premiadoGanhoFundo: '#1e1b4b',
    premiadoGanhoTexto: '#94a3b8',
    premiadoGanhoBadgeFundo: '#f59e0b',
    premiadoGanhoBadgeTexto: '#022c22',
    premiadoGanhoBorda: '#334155'
  },
  barraProgresso: {
    titulo: 'Progresso do sorteio',
    subtitulo: '',
    rodape: '',
    textoInterno: '{pct}% vendido',
    altura: 16,
    raioBorda: 9999,
    larguraMax: '100%'
  },
  secaoIcones: {
    premios: 'Trophy',
    cotasPremiadas: 'Ticket',
    topCompradores: 'TrendingUp',
    ganhadores: 'Users',
    regulamento: 'FileText',
    descricao: 'Info',
    meusNumeros: 'Ticket',
    sorteio: 'Calendar',
    botaoCompra: 'Sparkles'
  },
  botao: {
    formato: 'arredondado',
    raioBorda: 12,
    tamanhoAltura: 16,
    tamanhoTexto: 15,
    estilo: 'solido',
    iconeCompra: 'Sparkles',
    estiloPacotes: 'solido',
    estiloControles: 'solido',
    estiloCotas: 'solido',
    estiloCards: 'solido',
    raioBordaPacotes: 12,
    tamanhoAlturaPacotes: 12,
    sombraAlturaPacotes: 3,
    corSombraPacotes: '#047857',
    raioBordaControles: 12,
    tamanhoControles: 44,
    sombraAlturaControles: 3,
    corSombraControles: '#047857',
    raioBordaCotas: 8,
    sombraAlturaCotas: 2,
    corSombraCotas: '#047857',
    raioBordaCards: 16,
    sombraAlturaCards: 4,
    corSombraCards: '#0f172a',
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
    logoAlinhamento: 'centro',
  },
  bannerConfig: {
    fullWidth: true,
    overlayDegradeAtivo: true,
    overlayDegrade: 'linear-gradient(to top, rgba(0, 0, 0, 0.92) 0%, rgba(0, 0, 0, 0.6) 60%, transparent 100%)',
    overlayAltura: 100,
    seloAnimado: false,
    seloEstilo: 'estatico',
    seloFundo: '#f59e0b',
    seloTexto: '#022c22',
    seloPosicao: 'topo-esquerda'
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
  animacaoSucesso?: 'explosao_confetes' | 'nenhuma';
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
  layout?: 'padrao' | 'limpo' | 'passos' | 'rapido';
  metodoPrimario?: 'pix' | 'cartao' | 'boleto';
  metodos: {
    pix: boolean;
    cartao: boolean;
    boleto: boolean;
  };
  pixConfig?: {
    descontoPct?: number;
    descontoFixo?: number;
    permitirComprovante?: boolean;
    cascata?: string[];
  };
  cartaoConfig?: {
    exibirValorParcelado?: boolean;
  };
  // Exibir (ou ocultar) o campo de cupom de desconto no checkout
  exibirCupom?: boolean;
  cupomAtivo?: boolean;
  cupons?: CupomDesconto[];
  coletaDados?: {
    exigirEmail?: boolean;
    confirmarEmail?: boolean;
    exigirCpf?: boolean;
    exigirTelefone?: boolean;
    confirmarTelefone?: boolean;
    telefoneUnico?: boolean;
    coletarEndereco?: {
      ativo?: boolean;
      obrigatorio?: boolean;
    };
  };
  timerUrgencia?: {
    ativo?: boolean;
    minutos?: number;
    sticky?: boolean;
  };
  notificacoesSociais?: {
    ativo?: boolean;
    posicao?: 'topo-esq' | 'topo-dir' | 'base-esq' | 'base-dir';
    intervalo?: number;
    mensagens?: string[];
  };
  exitPopup?: {
    ativo?: boolean;
    gatilho?: 'saida' | 'voltar' | 'aba' | 'tempo';
    tempoSegundos?: number;
  };
  pixels?: {
    metaPixelId?: string;
    ga4Id?: string;
    tiktokPixelId?: string;
    utmifyId?: string;
  };
  pagamentosInternacionais?: boolean;
  redirectPosCompra?: string;
  orderBumps?: {
    id: string;
    titulo: string;
    descricao: string;
    preco: number;
    imagemUrl?: string;
  }[];
  // Campos originais:
  parcelasMax: number;
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
  layout: 'padrao',
  metodoPrimario: 'pix',
  metodos: {
    pix: true,
    cartao: true,
    boleto: false
  },
  pixConfig: {
    permitirComprovante: false,
    cascata: ['padrao']
  },
  cartaoConfig: {
    exibirValorParcelado: true
  },
  exibirCupom: true,
  coletaDados: {
    exigirEmail: false,
    confirmarEmail: false,
    exigirCpf: false,
    exigirTelefone: true,
    confirmarTelefone: false,
    telefoneUnico: true
  },
  parcelasMax: 12,
  taxaParcelamento: 'comprador',
  mensagens: {
    topo: 'Selecione a forma de pagamento:',
    pix: 'Aprovação imediata via Pix com QR Code e Copia e Cola.',
    cartao: 'Pague em até 12x no cartão de crédito.',
    sucesso: 'Pagamento aprovado! Boa sorte no sorteio.',
    urgencia: 'Finalize sua compra rápido, as cotas estão acabando!'
  },
  selosSeguranca: true,
  temporizadorAtivo: false,
  temporizadorMinutos: 15,
};

export interface CupomDesconto {
  id?: string;
  codigo: string; // ex: 'VOLTA10' ou 'QUERO20'
  tipo?: 'percentual' | 'fixo'; // default 'percentual' (compatibilidade)
  descontoPct: number; // usado quando tipo = 'percentual' (ex: 10 = 10%)
  valorFixo?: number;  // em REAIS, usado quando tipo = 'fixo' (ex: 5 = R$ 5,00)
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
  exibirBotaoCompartilhar?: boolean;
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
  autoplayGaleria?: boolean;
  autoplayIntervaloGaleria?: number;
  exigirEmail: boolean;
  exigirCpf: boolean;
  // Coleta de @ das redes sociais do comprador no cadastro (Instagram/TikTok/WhatsApp)
  coletarRedesSociais?: {
    ativo?: boolean;
    instagram?: boolean;
    tiktok?: boolean;
    whatsapp?: boolean;
    obrigatorio?: boolean;
  };
  // Coleta de endereço completo no checkout
  coletarEndereco?: {
    ativo?: boolean;
    obrigatorio?: boolean;
  };
  exibirCabecalhoTipo?: 'nome' | 'logo';
  cabecalhoLogoTamanho?: number;
  cabecalhoLogoUrl?: string;
  cabecalhoLogoLarguraTotal?: boolean;
  tituloSelecaoCotas?: string;
  // Aviso de segurança exibido na consulta "Meus Números" (anti-golpe).
  avisoSegurancaAtivo?: boolean;
  avisoSegurancaTexto?: string;
  tema?: TemaCampanha;
  checkoutId?: string;
  checkout?: CheckoutConfig;
  remarketing?: RemarketingConfig;
  cupons?: CupomDesconto[];
  // Master switch do campo de cupom no checkout: só aparece se o organizador ativar.
  cupomAtivo?: boolean;
  status: 'rascunho' | 'publicada' | 'pausada' | 'encerrada';
  // Exclusão lógica: a campanha some da lista/venda, mas o registro e todo o
  // faturamento (pedidos pagos, saldo, histórico) são preservados para saque.
  excluidaEm?: string | null;
  encerradaEm?: string | null;
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
  mpConfigurado?: boolean;
  mpTokenMascara?: string | null;
  oauthConfiguradoNoServidor?: boolean;
  oauthRedirectUri?: string;
  mpClientIdConfigurado?: boolean;
  isAdmin?: boolean;
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
  instagram?: string | null;
  tiktok?: string | null;
  nomeSocial?: string | null;
  dataNascimento?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  uf?: string | null;
  cidade?: string | null;
  complemento?: string | null;
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
    instagram?: string | null;
    tiktok?: string | null;
    nomeSocial?: string | null;
    dataNascimento?: string | null;
    cep?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    bairro?: string | null;
    uf?: string | null;
    cidade?: string | null;
    complemento?: string | null;
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
