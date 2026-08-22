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

export interface Campanha {
  id: string;
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
  exibirPremios?: boolean;
  exibirCotasPremiadas?: boolean;
  tempoAnimacaoSorteioSegundos?: number;
  exigirEmail: boolean;
  exigirCpf: boolean;
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
  // Meta Ads (Marketing API) — para a aba de Analytics
  metaAccessToken?: string | null;  // segredo — nunca retornado ao cliente
  metaAdAccountId?: string | null;  // ex: act_1234567890
  atualizadaEm: string;
}

// Dados de marca seguros para expor na página pública (sem segredos)
export interface MarcaPublica {
  nomeMarca: string | null;
  logoUrl: string | null;
  corPrincipal: string | null;
  corDestaque: string | null;
  redes: RedesSociais;
  metaPixelId: string | null;
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
  mpPaymentId: string | null;
  pixCopiaCola: string | null;
  pixQrCodeBase64: string | null;
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
