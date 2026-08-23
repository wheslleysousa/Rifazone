import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Campanha, Cota, Pedido, Comprador, RankingItem, CotaPremiada, ConfigOrganizador, EstiloSalvo, TemaCampanha, CheckoutSalvo, CheckoutConfig, MensagemFila } from '../src/types.js';
import { Storage, EstatisticasCampanha, MeusNumerosResult, ConfirmarPedidoResult, SorteioResult, DadosConfig } from './storage-interface.js';
import { mergeConfig } from './config-utils.js';
import { decryptToken } from './crypto-utils.js';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const CAMPANHAS_FILE = path.join(DATA_DIR, 'campanhas.json');
const COTAS_FILE = path.join(DATA_DIR, 'cotas.json');
const PEDIDOS_FILE = path.join(DATA_DIR, 'pedidos.json');
const COMPRADORES_FILE = path.join(DATA_DIR, 'compradores.json');
const CONFIGS_FILE = path.join(DATA_DIR, 'configuracoes.json');
const ESTILOS_FILE = path.join(DATA_DIR, 'estilos.json');
const CHECKOUTS_FILE = path.join(DATA_DIR, 'checkouts.json');
const FILA_FILE = path.join(DATA_DIR, 'fila.json');

function loadJson<T>(file: string, fallback: T): T {
  try {
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf-8');
      return JSON.parse(data) as T;
    }
  } catch (err) {
    console.error(`Erro ao carregar ${file}:`, err);
  }
  return fallback;
}

function saveJson(file: string, data: any) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Erro ao salvar ${file}:`, err);
  }
}

// Initial seed if empty
const seedCampanhas: Campanha[] = [
  {
    id: 'camp-demo-01',
    codigo: 'iphone-16-pro',
    titulo: 'iPhone 16 Pro Max 256GB + R$ 2.000 no Pix',
    subtitulo: 'Sorteio pela Loteria Federal ou na compra de todas as cotas!',
    descricao: `<p><strong>Participe do nosso grande sorteio oficial!</strong></p>
<ul>
<li><strong>1º Prêmio:</strong> iPhone 16 Pro Max 256GB Lacrado (ou R$ 9.000 no Pix direto na sua conta)</li>
<li><strong>2º Prêmio:</strong> R$ 1.500 no Pix</li>
<li><strong>3º Prêmio:</strong> R$ 500 no Pix</li>
</ul>
<p>Sorteio com base na <strong>Loteria Federal</strong>. O pagamento é confirmado instantaneamente via <strong>Pix Mercado Pago</strong>. Os números são liberados automaticamente no seu WhatsApp após a confirmação!</p>`,
    bannerUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80',
    youtubeUrl: null,
    modelo: 'aleatorio',
    totalCotas: 10000,
    valorCota: 0.35,
    minPorCompra: 5,
    maxPorCompra: 1000,
    localSorteio: 'Loteria Federal',
    dataSorteio: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    premios: [
      { posicao: 1, descricao: 'iPhone 16 Pro Max 256GB ou R$ 9.000 no Pix' },
      { posicao: 2, descricao: 'R$ 1.500 no Pix' },
      { posicao: 3, descricao: 'R$ 500 no Pix' }
    ],
    cotasPremiadas: [
      { numero: '00777', premio: 'R$ 200 no Pix na hora', status: 'disponivel', pedidoId: null },
      { numero: '01234', premio: 'R$ 100 no Pix na hora', status: 'disponivel', pedidoId: null },
      { numero: '05555', premio: 'R$ 500 no Pix na hora', status: 'disponivel', pedidoId: null },
      { numero: '08888', premio: 'R$ 100 no Pix na hora', status: 'disponivel', pedidoId: null }
    ],
    promocoes: [
      { quantidade: 10, valor: 3.50, destaque: false },
      { quantidade: 30, valor: 9.90, destaque: false },
      { quantidade: 50, valor: 15.00, destaque: true },
      { quantidade: 100, valor: 28.00, destaque: false },
      { quantidade: 250, valor: 65.00, destaque: false },
      { quantidade: 500, valor: 120.00, destaque: false }
    ],
    ofertasRelampago: [
      {
        id: 'oferta-1',
        titulo: 'Oferta Turbinada 🔥',
        subtitulo: 'Adicione +20 cotas por apenas R$ 4,90 (Economia de 30%)',
        cotasExtras: 20,
        preco: 4.90,
        selo: 'OFERTA LIMITADA'
      }
    ],
    selo: 'Corre que essa vai rápido! 🔥',
    tempoReservaMin: 10,
    exibirRanking: true,
    exibirBarraProgresso: true,
    exibirPaginaGanhadores: true,
    exigirEmail: false,
    exigirCpf: false,
    status: 'publicada',
    numeroSorteado: null,
    ganhador: null,
    criadaEm: new Date().toISOString()
  }
];

// Backend de armazenamento em ARQUIVO local (fallback para dev/preview sem Firestore).
export class FileStorage implements Storage {
  private campanhas: Map<string, Campanha> = new Map();
  // Map key: `${campanhaId}:${numero}` -> Cota
  private cotas: Map<string, Cota> = new Map();
  private pedidos: Map<string, Pedido> = new Map();
  private compradores: Map<string, Comprador> = new Map();
  // Configurações de pagamento por organizador (key = ownerId)
  private configs: Map<string, ConfigOrganizador> = new Map();
  // Estilos de temas salvos
  private estilos: Map<string, EstiloSalvo> = new Map();
  // Checkouts salvos
  private checkouts: Map<string, CheckoutSalvo> = new Map();
  private fila: Map<string, MensagemFila> = new Map();

  constructor() {
    this.loadAll();
  }

  private loadAll() {
    const campanhasList = loadJson<Campanha[]>(CAMPANHAS_FILE, seedCampanhas);
    campanhasList.forEach(c => this.campanhas.set(c.id, c));
    
    // If empty, save seed
    if (!fs.existsSync(CAMPANHAS_FILE)) {
      this.saveCampanhas();
    }

    const cotasList = loadJson<Cota[]>(COTAS_FILE, []);
    cotasList.forEach(c => {
      // Need campaign id if stored
    });
    // Store as array with campaignId
    const rawCotas = loadJson<{ campanhaId: string; cota: Cota }[]>(COTAS_FILE, []);
    rawCotas.forEach(item => {
      this.cotas.set(`${item.campanhaId}:${item.cota.numero}`, item.cota);
    });

    const pedidosList = loadJson<Pedido[]>(PEDIDOS_FILE, []);
    pedidosList.forEach(p => this.pedidos.set(p.id, p));

    const compradoresList = loadJson<Comprador[]>(COMPRADORES_FILE, []);
    compradoresList.forEach(c => this.compradores.set(c.id, c));

    const configsList = loadJson<ConfigOrganizador[]>(CONFIGS_FILE, []);
    configsList.forEach(c => this.configs.set(c.ownerId, c));

    const estilosList = loadJson<EstiloSalvo[]>(ESTILOS_FILE, []);
    estilosList.forEach(e => this.estilos.set(e.id, e));

    const checkoutsList = loadJson<CheckoutSalvo[]>(CHECKOUTS_FILE, []);
    checkoutsList.forEach(chk => this.checkouts.set(chk.id, chk));

    const filaList = loadJson<MensagemFila[]>(FILA_FILE, []);
    filaList.forEach(m => this.fila.set(m.id, m));
  }

  private saveConfigs() {
    saveJson(CONFIGS_FILE, Array.from(this.configs.values()));
  }

  private saveEstilos() {
    saveJson(ESTILOS_FILE, Array.from(this.estilos.values()));
  }

  private saveCheckouts() {
    saveJson(CHECKOUTS_FILE, Array.from(this.checkouts.values()));
  }

  private saveFila() {
    saveJson(FILA_FILE, Array.from(this.fila.values()));
  }

  private saveCampanhas() {
    saveJson(CAMPANHAS_FILE, Array.from(this.campanhas.values()));
  }

  private saveCotas() {
    const rawCotas = Array.from(this.cotas.entries()).map(([key, cota]) => {
      const campanhaId = key.split(':')[0];
      return { campanhaId, cota };
    });
    saveJson(COTAS_FILE, rawCotas);
  }

  private savePedidos() {
    saveJson(PEDIDOS_FILE, Array.from(this.pedidos.values()));
  }

  private saveCompradores() {
    saveJson(COMPRADORES_FILE, Array.from(this.compradores.values()));
  }

  // --- Campanhas ---
  // Lista campanhas. Se ownerId for informado, retorna apenas as do organizador.
  public async getCampanhas(ownerId?: string): Promise<Campanha[]> {
    return Array.from(this.campanhas.values())
      .filter(c => !ownerId || c.ownerId === ownerId)
      .sort((a, b) =>
        new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime()
      );
  }

  public async getCampanhaById(id: string): Promise<Campanha | null> {
    return this.campanhas.get(id) || null;
  }

  public async getCampanhaByCodigo(codigo: string): Promise<Campanha | null> {
    const normalized = codigo.toLowerCase().trim();
    for (const c of this.campanhas.values()) {
      if (c.codigo.toLowerCase() === normalized) {
        return c;
      }
    }
    return null;
  }

  public async saveCampanha(campanha: Campanha): Promise<Campanha> {
    if (!campanha.id) {
      campanha.id = 'camp-' + crypto.randomUUID().slice(0, 8);
    }
    if (!campanha.criadaEm) {
      campanha.criadaEm = new Date().toISOString();
    }
    campanha.atualizadaEm = new Date().toISOString();
    this.campanhas.set(campanha.id, campanha);
    this.saveCampanhas();
    return campanha;
  }

  public async deleteCampanha(id: string): Promise<boolean> {
    const deleted = this.campanhas.delete(id);
    if (deleted) {
      this.saveCampanhas();
    }
    return deleted;
  }

  // --- Cotas & Estatísticas ---
  public async getEstatisticasCampanha(campanhaId: string, totalCotas: number): Promise<EstatisticasCampanha> {
    const agora = Date.now();
    let vendidas = 0;
    let reservadas = 0;

    for (const [key, cota] of this.cotas.entries()) {
      if (key.startsWith(`${campanhaId}:`)) {
        if (cota.status === 'vendido') {
          vendidas++;
        } else if (cota.status === 'reservado') {
          if (cota.reservadoAte && new Date(cota.reservadoAte).getTime() > agora) {
            reservadas++;
          }
        }
      }
    }

    const disponiveis = Math.max(0, totalCotas - vendidas - reservadas);
    const percentualVendido = totalCotas > 0 ? Number(((vendidas / totalCotas) * 100).toFixed(1)) : 0;

    return {
      totalCotas,
      vendidas,
      reservadas,
      disponiveis,
      percentualVendido
    };
  }

  public async getRankingCampanha(campanhaId: string): Promise<RankingItem[]> {
    const mapaRanking: Record<string, { nome: string; whatsapp: string; quantidade: number }> = {};

    for (const pedido of this.pedidos.values()) {
      if (pedido.campanhaId === campanhaId && pedido.status === 'pago') {
        const key = pedido.compradorId;
        if (!mapaRanking[key]) {
          mapaRanking[key] = {
            nome: pedido.comprador.nome,
            whatsapp: pedido.comprador.whatsapp,
            quantidade: 0
          };
        }
        mapaRanking[key].quantidade += pedido.quantidade;
      }
    }

    const items = Object.values(mapaRanking)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10)
      .map((item, idx) => {
        // Mask phone: (11) 9****-1234
        const w = item.whatsapp.replace(/\D/g, '');
        let masked = item.whatsapp;
        if (w.length >= 10) {
          masked = `(${w.slice(0, 2)}) *****-${w.slice(-4)}`;
        }
        return {
          posicao: idx + 1,
          nome: item.nome,
          whatsappMascara: masked,
          quantidadeCotas: item.quantidade
        };
      });

    return items;
  }

  public isCotaLivre(campanhaId: string, numero: string, agora: number = Date.now()): boolean {
    const key = `${campanhaId}:${numero}`;
    const cota = this.cotas.get(key);
    if (!cota) return true; // sem documento = livre
    if (cota.status === 'vendido') return false;
    if (cota.status === 'reservado') {
      if (cota.reservadoAte && new Date(cota.reservadoAte).getTime() > agora) {
        return false; // ainda válida
      }
      return true; // expirada = livre (lazy expiration)
    }
    return true;
  }

  public async getCotasOcupadas(campanhaId: string): Promise<Record<string, { status: 'reservado' | 'vendido' }>> {
    const agora = Date.now();
    const result: Record<string, { status: 'reservado' | 'vendido' }> = {};

    for (const [key, cota] of this.cotas.entries()) {
      if (key.startsWith(`${campanhaId}:`)) {
        const numero = key.split(':')[1];
        if (cota.status === 'vendido') {
          result[numero] = { status: 'vendido' };
        } else if (cota.status === 'reservado') {
          if (cota.reservadoAte && new Date(cota.reservadoAte).getTime() > agora) {
            result[numero] = { status: 'reservado' };
          }
        }
      }
    }
    return result;
  }

  // --- Reserva Atômica ---
  public async reservarCotas(
    campanha: Campanha,
    numerosDesejados: string[],
    pedidoId: string,
    compradorId: string,
    compradorNome: string
  ): Promise<void> {
    const agora = Date.now();
    const reservadoAte = new Date(agora + campanha.tempoReservaMin * 60 * 1000).toISOString();

    // 1) Checa colisão
    for (const numero of numerosDesejados) {
      const key = `${campanha.id}:${numero}`;
      const cota = this.cotas.get(key);
      if (cota) {
        const reservaValida = cota.status === 'reservado' && cota.reservadoAte && new Date(cota.reservadoAte).getTime() > agora;
        if (cota.status === 'vendido' || reservaValida) {
          throw new Error(`Número ${numero} já está reservado ou vendido.`);
        }
      }
    }

    // 2) Reserva todos
    for (const numero of numerosDesejados) {
      const key = `${campanha.id}:${numero}`;
      this.cotas.set(key, {
        numero,
        status: 'reservado',
        pedidoId,
        compradorId,
        compradorNome,
        reservadoAte
      });
    }
    this.saveCotas();
  }

  // Sorteia cotas livres aleatoriamente
  public async sortearCotasLivres(campanha: Campanha, quantidade: number): Promise<string[]> {
    const total = campanha.totalCotas;
    const padding = String(total - 1).length;
    const agora = Date.now();
    const selecionados = new Set<string>();

    const maxAttempts = quantidade * 100 + 5000;
    let attempts = 0;

    while (selecionados.size < quantidade && attempts < maxAttempts) {
      attempts++;
      const rand = Math.floor(Math.random() * total);
      const numeroStr = String(rand).padStart(padding, '0');

      if (!selecionados.has(numeroStr) && this.isCotaLivre(campanha.id, numeroStr, agora)) {
        selecionados.add(numeroStr);
      }
    }

    if (selecionados.size < quantidade) {
      // Linear scan fallback
      for (let i = 0; i < total && selecionados.size < quantidade; i++) {
        const numStr = String(i).padStart(padding, '0');
        if (!selecionados.has(numStr) && this.isCotaLivre(campanha.id, numStr, agora)) {
          selecionados.add(numStr);
        }
      }
    }

    if (selecionados.size < quantidade) {
      throw new Error(`Não há cotas suficientes disponíveis. Solicitadas: ${quantidade}, Disponíveis: ${selecionados.size}`);
    }

    return Array.from(selecionados);
  }

  // --- Pedidos ---
  public async savePedido(pedido: Pedido): Promise<Pedido> {
    this.pedidos.set(pedido.id, pedido);
    this.savePedidos();
    return pedido;
  }

  public async getPedido(id: string): Promise<Pedido | null> {
    return this.pedidos.get(id) || null;
  }

  public async getPedidosPorCampanha(campanhaId: string): Promise<Pedido[]> {
    return Array.from(this.pedidos.values())
      .filter(p => p.campanhaId === campanhaId)
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  public async getTodosPedidos(): Promise<Pedido[]> {
    return Array.from(this.pedidos.values())
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  // Confirmação atômica e idempotente
  public async confirmarPedido(pedidoId: string, mpPaymentId?: string): Promise<ConfirmarPedidoResult> {
    const pedido = this.pedidos.get(pedidoId);
    if (!pedido) return { success: false, cotasPremiadasEncontradas: [] };

    if (pedido.status === 'pago') {
      return { success: true, cotasPremiadasEncontradas: [] }; // Idempotente
    }

    pedido.status = 'pago';
    pedido.pagoEm = new Date().toISOString();
    if (mpPaymentId) {
      pedido.mpPaymentId = String(mpPaymentId);
    }
    this.savePedidos();

    // Converte cotas reservadas -> vendidas
    for (const numero of pedido.numeros) {
      const key = `${pedido.campanhaId}:${numero}`;
      this.cotas.set(key, {
        numero,
        status: 'vendido',
        pedidoId: pedido.id,
        compradorId: pedido.compradorId,
        compradorNome: pedido.comprador.nome,
        reservadoAte: null
      });
    }
    this.saveCotas();

    // Verificar se acertou alguma Cota Premiada
    const cotasPremiadasEncontradas: CotaPremiada[] = [];
    const campanha = this.campanhas.get(pedido.campanhaId);
    if (campanha && campanha.cotasPremiadas && campanha.cotasPremiadas.length > 0) {
      let mudouCampanha = false;
      campanha.cotasPremiadas.forEach(cp => {
        if (pedido.numeros.includes(cp.numero) && cp.status === 'disponivel') {
          cp.status = 'encontrada';
          cp.pedidoId = pedido.id;
          cp.compradorNome = pedido.comprador.nome;
          cotasPremiadasEncontradas.push(cp);
          mudouCampanha = true;
        }
      });
      if (mudouCampanha) {
        await this.saveCampanha(campanha);
      }
    }

    return { success: true, cotasPremiadasEncontradas };
  }

  // Meus números por WhatsApp
  public async getMeusNumeros(campanhaId: string, rawWhatsapp: string): Promise<MeusNumerosResult> {
    const cleanPhone = rawWhatsapp.replace(/\D/g, '');
    const pedidosPagos = Array.from(this.pedidos.values()).filter(p => 
      p.campanhaId === campanhaId &&
      p.status === 'pago' &&
      p.comprador.whatsapp.replace(/\D/g, '') === cleanPhone
    );

    const todasCotas: string[] = [];
    pedidosPagos.forEach(p => {
      todasCotas.push(...p.numeros);
    });

    const comprador = this.compradores.get(cleanPhone) || null;

    return {
      comprador,
      cotas: Array.from(new Set(todasCotas)).sort((a, b) => a.localeCompare(b)),
      pedidos: pedidosPagos
    };
  }

  // --- Comprador ---
  public async saveComprador(comprador: Comprador): Promise<Comprador> {
    const cleanId = comprador.whatsapp.replace(/\D/g, '');
    comprador.id = cleanId;
    this.compradores.set(cleanId, comprador);
    this.saveCompradores();
    return comprador;
  }

  // --- Configurações de pagamento por organizador ---
  public async getConfig(ownerId: string): Promise<ConfigOrganizador | null> {
    return this.configs.get(ownerId) || null;
  }

  public async saveConfig(ownerId: string, dados: DadosConfig): Promise<ConfigOrganizador> {
    const config = mergeConfig(ownerId, this.configs.get(ownerId) || null, dados);
    this.configs.set(ownerId, config);
    this.saveConfigs();
    return config;
  }

  // Retorna o Access Token do Mercado Pago do organizador dono da campanha (descriptografado).
  public async getMpTokenPorCampanha(campanhaId: string): Promise<string | null> {
    const campanha = this.campanhas.get(campanhaId);
    if (!campanha || !campanha.ownerId) return null;
    const config = this.configs.get(campanha.ownerId);
    return decryptToken(config?.mpAccessToken) || null;
  }

  // --- Limpeza de reservas expiradas ---
  public async limparReservasExpiradas(): Promise<{ cotasLiberadas: number; pedidosExpirados: number }> {
    const agora = Date.now();
    let cotasLiberadas = 0;
    let pedidosExpirados = 0;

    for (const [key, cota] of this.cotas.entries()) {
      if (cota.status === 'reservado' && cota.reservadoAte && new Date(cota.reservadoAte).getTime() <= agora) {
        this.cotas.delete(key);
        cotasLiberadas++;
      }
    }

    for (const pedido of this.pedidos.values()) {
      if (pedido.status === 'pendente' && new Date(pedido.expiraEm).getTime() <= agora) {
        pedido.status = 'expirado';
        pedidosExpirados++;
        for (const [key, cota] of this.cotas.entries()) {
          if (cota.pedidoId === pedido.id && cota.status === 'reservado') {
            this.cotas.delete(key);
            cotasLiberadas++;
          }
        }
      }
    }

    if (cotasLiberadas > 0) {
      this.saveCotas();
    }
    if (pedidosExpirados > 0) {
      this.savePedidos();
    }

    return { cotasLiberadas, pedidosExpirados };
  }

  // --- Apuração / Sorteio de Campanha ---
  public async realizarSorteio(campanhaId: string, numeroSorteado: string): Promise<SorteioResult> {
    const campanha = this.campanhas.get(campanhaId);
    if (!campanha) throw new Error('Campanha não encontrada');

    const key = `${campanhaId}:${numeroSorteado}`;
    const cota = this.cotas.get(key);

    let ganhador = null;
    if (cota && cota.status === 'vendido') {
      const pedido = this.pedidos.get(cota.pedidoId);
      ganhador = {
        nome: cota.compradorNome || pedido?.comprador.nome || 'Ganhador',
        whatsapp: pedido?.comprador.whatsapp || '',
        cota: numeroSorteado,
        pedidoId: cota.pedidoId
      };
    }

    const historico = campanha.ganhadoresHistorico || [];
    if (ganhador) {
      const jaExiste = historico.some(h => h.cota === numeroSorteado);
      if (!jaExiste) {
        historico.push({
          nome: ganhador.nome,
          whatsapp: ganhador.whatsapp,
          cota: numeroSorteado,
          pedidoId: ganhador.pedidoId,
          dataSorteio: new Date().toISOString()
        });
      }
    }

    campanha.ganhadoresHistorico = historico;
    campanha.status = 'encerrada';
    campanha.numeroSorteado = numeroSorteado;
    campanha.ganhador = ganhador;
    await this.saveCampanha(campanha);

    return { campanha, ganhador };
  }

  // --- Estilos de Tema Salvos ---
  public async salvarEstilo(ownerId: string, estilo: { id?: string; nome: string; tema: TemaCampanha }): Promise<EstiloSalvo> {
    const id = estilo.id || `estilo-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const estiloSalvo: EstiloSalvo = {
      id,
      ownerId,
      nome: estilo.nome.trim() || 'Estilo Sem Nome',
      tema: estilo.tema,
      criadoEm: new Date().toISOString()
    };
    this.estilos.set(id, estiloSalvo);
    this.saveEstilos();
    return estiloSalvo;
  }

  public async listarEstilos(ownerId: string): Promise<EstiloSalvo[]> {
    return Array.from(this.estilos.values())
      .filter(e => !e.ownerId || e.ownerId === ownerId)
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  public async excluirEstilo(ownerId: string, id: string): Promise<boolean> {
    const estilo = this.estilos.get(id);
    if (!estilo) return false;
    if (estilo.ownerId && estilo.ownerId !== ownerId) return false;
    this.estilos.delete(id);
    this.saveEstilos();
    return true;
  }

  // --- Checkouts Salvos ---
  public async salvarCheckout(ownerId: string, checkoutData: { id?: string; nome: string; checkout: CheckoutConfig }): Promise<CheckoutSalvo> {
    const id = checkoutData.id || `chk-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const item: CheckoutSalvo = {
      id,
      ownerId,
      nome: checkoutData.nome.trim() || 'Checkout Sem Nome',
      checkout: checkoutData.checkout,
      criadoEm: new Date().toISOString()
    };
    this.checkouts.set(id, item);
    this.saveCheckouts();
    return item;
  }

  public async listarCheckouts(ownerId: string): Promise<CheckoutSalvo[]> {
    return Array.from(this.checkouts.values())
      .filter(c => !c.ownerId || c.ownerId === ownerId)
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  public async excluirCheckout(ownerId: string, id: string): Promise<boolean> {
    const chk = this.checkouts.get(id);
    if (!chk) return false;
    if (chk.ownerId && chk.ownerId !== ownerId) return false;
    this.checkouts.delete(id);
    this.saveCheckouts();
    return true;
  }

  // --- Fila de Mensagens (Automação / Outbox) ---
  public async enfileirarMensagem(msg: Omit<MensagemFila, 'id' | 'criadoEm' | 'status'>): Promise<MensagemFila> {
    const existingMsg = Array.from(this.fila.values()).find(
      m => m.chaveIdempotencia === msg.chaveIdempotencia
    );
    if (existingMsg) {
      return existingMsg;
    }

    const id = `msg-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const novaMsg: MensagemFila = {
      ...msg,
      id,
      status: 'pendente',
      criadoEm: new Date().toISOString()
    };

    this.fila.set(id, novaMsg);
    this.saveFila();
    return novaMsg;
  }

  public async listarFilaPendente(limitNum: number): Promise<MensagemFila[]> {
    return Array.from(this.fila.values())
      .filter(m => m.status === 'pendente')
      .slice(0, limitNum);
  }

  public async marcarStatusMensagem(id: string, status: 'pendente' | 'enviada' | 'erro' | 'cancelada', erro?: string): Promise<MensagemFila | null> {
    const msg = this.fila.get(id);
    if (!msg) return null;

    msg.status = status;
    if (erro) msg.erro = erro;
    if (status === 'enviada') {
      msg.enviadoEm = new Date().toISOString();
    }

    this.fila.set(id, msg);
    this.saveFila();
    return msg;
  }

  public async listarTodasMensagensFila(campanhaId?: string): Promise<MensagemFila[]> {
    let list = Array.from(this.fila.values());
    if (campanhaId) {
      list = list.filter(m => m.campanhaId === campanhaId);
    }
    return list.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }
}
