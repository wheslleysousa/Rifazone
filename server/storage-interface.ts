import { Campanha, Pedido, Comprador, RankingItem, CotaPremiada, ConfigOrganizador, MarcaConfig, RedesSociais } from '../src/types.js';

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
  metaAccessToken?: string | null;
  metaAdAccountId?: string | null;
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
  saveConfig(ownerId: string, dados: DadosConfig): Promise<ConfigOrganizador>;
  getMpTokenPorCampanha(campanhaId: string): Promise<string | null>;

  // Manutenção / apuração
  limparReservasExpiradas(): Promise<number>;
  realizarSorteio(campanhaId: string, numeroSorteado: string): Promise<SorteioResult>;
}
