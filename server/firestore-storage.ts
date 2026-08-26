import { initializeApp, getApps, cert, applicationDefault, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore, type Transaction } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Campanha, Cota, Pedido, Comprador, RankingItem, CotaPremiada, ConfigOrganizador, EstiloSalvo, TemaCampanha, CheckoutSalvo, CheckoutConfig, MensagemFila, CarteiraSaldo, TransacaoCarteira, SolicitacaoSaque } from '../src/types.js';
import { Storage, EstatisticasCampanha, MeusNumerosResult, ConfirmarPedidoResult, SorteioResult, DadosConfig } from './storage-interface.js';
import { mergeConfig } from './config-utils.js';
import { decryptToken } from './crypto-utils.js';
import { extrairValorReaisPedido, isPedidoProcessedByCarteira } from './money-utils.js';

// Lê o databaseId (Firestore nomeado) do config do Firebase.
function getDatabaseId(): string | undefined {
  if (process.env.FIRESTORE_DATABASE_ID) return process.env.FIRESTORE_DATABASE_ID.trim();
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));
    return cfg.firestoreDatabaseId || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Descobre as credenciais do Admin SDK a partir do ambiente:
 * - FIREBASE_SERVICE_ACCOUNT: JSON da service account (string) OU caminho para o arquivo.
 * - GOOGLE_APPLICATION_CREDENTIALS: caminho padrão (applicationDefault()).
 * Retorna null se nada estiver configurado (aí caímos no armazenamento em arquivo).
 */
export function firebaseCredencialDisponivel(): boolean {
  return !!(process.env.FIREBASE_SERVICE_ACCOUNT?.trim() || process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim());
}

function initApp(): App {
  if (getApps().length) return getApps()[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (raw) {
    let json: any;
    if (raw.startsWith('{')) {
      json = JSON.parse(raw);
    } else {
      // trata como caminho de arquivo
      json = JSON.parse(fs.readFileSync(raw, 'utf-8'));
    }
    // A private_key costuma vir com \n escapado quando colada em variável de ambiente
    if (json.private_key && typeof json.private_key === 'string') {
      json.private_key = json.private_key.replace(/\\n/g, '\n');
    }
    return initializeApp({ credential: cert(json) });
  }

  // GOOGLE_APPLICATION_CREDENTIALS
  return initializeApp({ credential: applicationDefault() });
}

const seedFeito = { done: false };

/**
 * Backend de armazenamento no FIRESTORE (produção — dados reais e persistentes).
 * Modelo de dados (conforme a spec):
 *   campanhas/{id}
 *   campanhas/{id}/cotas/{numero}   (apenas cotas ocupadas)
 *   pedidos/{id}
 *   compradores/{id}
 *   configuracoes/{ownerId}
 */
export class FirestoreStorage implements Storage {
  private db: Firestore;

  constructor() {
    const app = initApp();
    const dbId = getDatabaseId();
    this.db = dbId ? getFirestore(app, dbId) : getFirestore(app);
    console.log(`Firestore conectado${dbId ? ` (database: ${dbId})` : ''}.`);
  }

  private campanhasCol() { return this.db.collection('campanhas'); }
  private cotasCol(campanhaId: string) { return this.campanhasCol().doc(campanhaId).collection('cotas'); }
  private pedidosCol() { return this.db.collection('pedidos'); }
  private compradoresCol() { return this.db.collection('compradores'); }
  private configsCol() { return this.db.collection('configuracoes'); }
  private estilosCol(ownerId: string) { return this.db.collection('estilos').doc(ownerId).collection('temas'); }
  private checkoutsCol(ownerId: string) { return this.db.collection('checkouts').doc(ownerId).collection('itens'); }
  private filaCol() { return this.db.collection('mensagens_fila'); }
  private transacoesCol() { return this.db.collection('transacoes_carteira'); }
  private saquesCol() { return this.db.collection('solicitacoes_saque'); }

  // --- Campanhas ---
  public async getCampanhas(ownerId?: string): Promise<Campanha[]> {
    let query: FirebaseFirestore.Query = this.campanhasCol();
    if (ownerId) query = query.where('ownerId', '==', ownerId);
    const snap = await query.get();
    const lista = snap.docs.map(d => d.data() as Campanha);
    return lista.sort((a, b) => new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime());
  }

  public async getCampanhaById(id: string): Promise<Campanha | null> {
    const doc = await this.campanhasCol().doc(id).get();
    return doc.exists ? (doc.data() as Campanha) : null;
  }

  public async getCampanhaByCodigo(codigo: string): Promise<Campanha | null> {
    const normalized = codigo.toLowerCase().trim();
    const snap = await this.campanhasCol().where('codigo', '==', normalized).limit(1).get();
    if (snap.empty) return null;
    return snap.docs[0].data() as Campanha;
  }

  public async saveCampanha(campanha: Campanha): Promise<Campanha> {
    if (!campanha.id) campanha.id = 'camp-' + crypto.randomUUID().slice(0, 8);
    if (!campanha.criadaEm) campanha.criadaEm = new Date().toISOString();
    campanha.atualizadaEm = new Date().toISOString();
    // Firestore não aceita undefined em documentos
    const limpo = JSON.parse(JSON.stringify(campanha));
    await this.campanhasCol().doc(campanha.id).set(limpo, { merge: false });
    return campanha;
  }

  public async deleteCampanha(id: string): Promise<boolean> {
    const ref = this.campanhasCol().doc(id);
    const doc = await ref.get();
    if (!doc.exists) return false;
    // Apaga subcoleção de cotas em lotes
    await this.db.recursiveDelete(ref);
    return true;
  }

  // --- Cotas & Estatísticas ---
  public async getEstatisticasCampanha(campanhaId: string, totalCotas: number): Promise<EstatisticasCampanha> {
    const nowIso = new Date().toISOString();
    const cotas = this.cotasCol(campanhaId);

    const vendidasAgg = await cotas.where('status', '==', 'vendido').count().get();
    const vendidas = vendidasAgg.data().count;

    // reservadas ainda válidas (reservadoAte no futuro)
    const reservadasAgg = await cotas
      .where('status', '==', 'reservado')
      .where('reservadoAte', '>', nowIso)
      .count()
      .get();
    const reservadas = reservadasAgg.data().count;

    const disponiveis = Math.max(0, totalCotas - vendidas - reservadas);
    const percentualVendido = totalCotas > 0 ? Number(((vendidas / totalCotas) * 100).toFixed(1)) : 0;

    return { totalCotas, vendidas, reservadas, disponiveis, percentualVendido };
  }

  public async getRankingCampanha(campanhaId: string): Promise<RankingItem[]> {
    const snap = await this.pedidosCol()
      .where('campanhaId', '==', campanhaId)
      .where('status', '==', 'pago')
      .get();

    const mapa: Record<string, { nome: string; whatsapp: string; quantidade: number }> = {};
    snap.docs.forEach(doc => {
      const p = doc.data() as Pedido;
      const key = p.compradorId;
      if (!mapa[key]) mapa[key] = { nome: p.comprador.nome, whatsapp: p.comprador.whatsapp, quantidade: 0 };
      mapa[key].quantidade += p.quantidade;
    });

    return Object.values(mapa)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10)
      .map((item, idx) => {
        const w = item.whatsapp.replace(/\D/g, '');
        const masked = w.length >= 10 ? `(${w.slice(0, 2)}) *****-${w.slice(-4)}` : item.whatsapp;
        return { posicao: idx + 1, nome: item.nome, whatsappMascara: masked, quantidadeCotas: item.quantidade };
      });
  }

  public async getCotasOcupadas(campanhaId: string): Promise<Record<string, { status: 'reservado' | 'vendido' }>> {
    const nowMs = Date.now();
    const snap = await this.cotasCol(campanhaId).get();
    const result: Record<string, { status: 'reservado' | 'vendido' }> = {};
    snap.docs.forEach(doc => {
      const c = doc.data() as Cota;
      if (c.status === 'vendido') {
        result[c.numero] = { status: 'vendido' };
      } else if (c.status === 'reservado') {
        if (c.reservadoAte && new Date(c.reservadoAte).getTime() > nowMs) {
          result[c.numero] = { status: 'reservado' };
        }
      }
    });
    return result;
  }

  // --- Reserva Atômica (transação Firestore) ---
  public async reservarCotas(
    campanha: Campanha,
    numerosDesejados: string[],
    pedidoId: string,
    compradorId: string,
    compradorNome: string
  ): Promise<void> {
    const nowMs = Date.now();
    const reservadoAte = new Date(nowMs + campanha.tempoReservaMin * 60 * 1000).toISOString();
    const cotas = this.cotasCol(campanha.id);

    await this.db.runTransaction(async (tx: Transaction) => {
      const refs = numerosDesejados.map(n => cotas.doc(String(n)));
      const snaps = await tx.getAll(...refs);

      // 1) Checa colisão
      snaps.forEach((snap, i) => {
        if (snap.exists) {
          const c = snap.data() as Cota;
          const reservaValida = c.status === 'reservado' && !!c.reservadoAte && new Date(c.reservadoAte).getTime() > nowMs;
          if (c.status === 'vendido' || reservaValida) {
            throw new Error(`Número ${numerosDesejados[i]} já está reservado ou vendido.`);
          }
        }
      });

      // 2) Reserva todos
      numerosDesejados.forEach((numero, i) => {
        tx.set(refs[i], {
          numero: String(numero),
          status: 'reservado',
          pedidoId,
          compradorId,
          compradorNome,
          reservadoAte
        } as Cota);
      });
    });
  }

  // Sorteia cotas livres (modelo aleatório). Livre = sem doc ou reserva expirada.
  public async sortearCotasLivres(campanha: Campanha, quantidade: number): Promise<string[]> {
    const total = campanha.totalCotas;
    const padding = String(total - 1).length;
    const nowMs = Date.now();
    const selecionados = new Set<string>();
    const cotas = this.cotasCol(campanha.id);

    const maxRounds = 40;
    let round = 0;

    while (selecionados.size < quantidade && round < maxRounds) {
      round++;
      const faltam = quantidade - selecionados.size;
      // Gera um lote de candidatos aleatórios (com folga) ainda não escolhidos
      const candidatos = new Set<string>();
      let tentativas = 0;
      while (candidatos.size < faltam * 2 && tentativas < faltam * 20 + 50) {
        tentativas++;
        const numeroStr = String(Math.floor(Math.random() * total)).padStart(padding, '0');
        if (!selecionados.has(numeroStr)) candidatos.add(numeroStr);
      }

      // Lê os candidatos em lote e mantém os livres
      const lista = Array.from(candidatos);
      for (let i = 0; i < lista.length; i += 300) {
        const chunk = lista.slice(i, i + 300);
        const snaps = await this.db.getAll(...chunk.map(n => cotas.doc(n)));
        snaps.forEach((snap, idx) => {
          if (selecionados.size >= quantidade) return;
          let livre = true;
          if (snap.exists) {
            const c = snap.data() as Cota;
            if (c.status === 'vendido') livre = false;
            else if (c.status === 'reservado' && c.reservadoAte && new Date(c.reservadoAte).getTime() > nowMs) livre = false;
          }
          if (livre) selecionados.add(chunk[idx]);
        });
      }
    }

    if (selecionados.size < quantidade) {
      throw new Error(`Não há cotas suficientes disponíveis. Solicitadas: ${quantidade}, Disponíveis: ${selecionados.size}`);
    }

    return Array.from(selecionados).slice(0, quantidade);
  }

  // --- Pedidos ---
  public async savePedido(pedido: Pedido): Promise<Pedido> {
    const limpo = JSON.parse(JSON.stringify(pedido));
    await this.pedidosCol().doc(pedido.id).set(limpo);
    return pedido;
  }

  public async getPedido(id: string): Promise<Pedido | null> {
    const doc = await this.pedidosCol().doc(id).get();
    return doc.exists ? (doc.data() as Pedido) : null;
  }

  public async getPedidoPorPaymentId(paymentId: string): Promise<Pedido | null> {
    const snap = await this.pedidosCol().where('mpPaymentId', '==', paymentId).limit(1).get();
    if (snap.empty) {
      // Fallback para efi/asaas (paymentId, transactionId)
      const snap2 = await this.pedidosCol().where('efiPaymentId', '==', paymentId).limit(1).get();
      if (!snap2.empty) return snap2.docs[0].data() as Pedido;
      
      const snap3 = await this.pedidosCol().where('id', '==', paymentId.replace('carteira_', '')).limit(1).get();
      if (!snap3.empty) return snap3.docs[0].data() as Pedido;

      return null;
    }
    return snap.docs[0].data() as Pedido;
  }

  public async getPedidosPorCampanha(campanhaId: string): Promise<Pedido[]> {
    const snap = await this.pedidosCol().where('campanhaId', '==', campanhaId).get();
    return snap.docs
      .map(d => d.data() as Pedido)
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  public async getTodosPedidos(): Promise<Pedido[]> {
    const snap = await this.pedidosCol().get();
    return snap.docs
      .map(d => d.data() as Pedido)
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  // Confirmação atômica e idempotente
  public async confirmarPedido(pedidoId: string, mpPaymentId?: string): Promise<ConfirmarPedidoResult> {
    const pedidoRef = this.pedidosCol().doc(pedidoId);

    const resultado = await this.db.runTransaction<{ pedido: Pedido | null; jaProcessado: boolean }>(async tx => {
      const snap = await tx.get(pedidoRef);
      if (!snap.exists) return { pedido: null, jaProcessado: false };
      const pedido = snap.data() as Pedido;
      if (pedido.status === 'pago') return { pedido, jaProcessado: true };

      tx.update(pedidoRef, {
        status: 'pago',
        pagoEm: new Date().toISOString(),
        ...(mpPaymentId ? { mpPaymentId: String(mpPaymentId) } : {})
      });
      return { pedido, jaProcessado: false };
    });

    if (!resultado.pedido) return { success: false, cotasPremiadasEncontradas: [] };
    if (resultado.jaProcessado) return { success: true, cotasPremiadasEncontradas: [], jaProcessado: true };

    const pedido = resultado.pedido;

    // Converte cotas reservadas -> vendidas (em lotes de até 400)
    const cotas = this.cotasCol(pedido.campanhaId);
    for (let i = 0; i < pedido.numeros.length; i += 400) {
      const chunk = pedido.numeros.slice(i, i + 400);
      const batch = this.db.batch();
      chunk.forEach(numero => {
        batch.set(cotas.doc(String(numero)), {
          numero: String(numero),
          status: 'vendido',
          pedidoId: pedido.id,
          compradorId: pedido.compradorId,
          compradorNome: pedido.comprador.nome,
          reservadoAte: null
        } as Cota);
      });
      await batch.commit();
    }

    // Cotas premiadas (na campanha)
    const cotasPremiadasEncontradas: CotaPremiada[] = [];
    const campanha = await this.getCampanhaById(pedido.campanhaId);
    if (campanha && campanha.cotasPremiadas && campanha.cotasPremiadas.length > 0) {
      let mudou = false;
      campanha.cotasPremiadas.forEach(cp => {
        if (pedido.numeros.includes(cp.numero) && cp.status === 'disponivel') {
          cp.status = 'encontrada';
          cp.pedidoId = pedido.id;
          cp.compradorNome = pedido.comprador.nome;
          cotasPremiadasEncontradas.push(cp);
          mudou = true;
        }
      });
      if (mudou) await this.saveCampanha(campanha);
    }

    return { success: true, cotasPremiadasEncontradas };
  }

  public async getMeusNumeros(campanhaId: string, rawWhatsapp: string): Promise<MeusNumerosResult> {
    const cleanPhone = rawWhatsapp.replace(/\D/g, '');
    const snap = await this.pedidosCol()
      .where('campanhaId', '==', campanhaId)
      .where('status', '==', 'pago')
      .get();

    const pedidosPagos = snap.docs
      .map(d => d.data() as Pedido)
      .filter(p => p.comprador.whatsapp.replace(/\D/g, '') === cleanPhone);

    const todasCotas: string[] = [];
    pedidosPagos.forEach(p => todasCotas.push(...p.numeros));

    const compradorDoc = await this.compradoresCol().doc(cleanPhone).get();
    const comprador = compradorDoc.exists ? (compradorDoc.data() as Comprador) : null;

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
    await this.compradoresCol().doc(cleanId).set(comprador, { merge: true });
    return comprador;
  }

  // --- Configurações de pagamento por organizador ---
  public async getTodasConfiguracoes(): Promise<{ ownerId: string; config: ConfigOrganizador }[]> {
    const snapshot = await this.configsCol().get();
    return snapshot.docs.map(doc => ({ ownerId: doc.id, config: doc.data() as ConfigOrganizador }));
  }

  public async getConfig(ownerId: string): Promise<ConfigOrganizador | null> {
    const doc = await this.configsCol().doc(ownerId).get();
    return doc.exists ? (doc.data() as ConfigOrganizador) : null;
  }

  public async saveConfig(ownerId: string, dados: DadosConfig): Promise<ConfigOrganizador> {
    const existente = await this.getConfig(ownerId);
    const config = mergeConfig(ownerId, existente, dados);
    // Firestore não aceita undefined; serializa removendo-os
    await this.configsCol().doc(ownerId).set(JSON.parse(JSON.stringify(config)), { merge: false });
    return config;
  }

  public async deleteConfig(ownerId: string): Promise<boolean> {
    const docRef = this.configsCol().doc(ownerId);
    const doc = await docRef.get();
    if (!doc.exists) return false;
    await docRef.delete();
    return true;
  }

  public async getMpTokenPorCampanha(campanhaId: string): Promise<string | null> {
    const campanha = await this.getCampanhaById(campanhaId);
    if (!campanha || !campanha.ownerId) return null;
    const config = await this.getConfig(campanha.ownerId);
    return decryptToken(config?.mpAccessToken) || null;
  }

  // --- Limpeza de reservas expiradas ---
  public async limparReservasExpiradas(): Promise<{ cotasLiberadas: number; pedidosExpirados: number }> {
    const nowIso = new Date().toISOString();
    let cotasLiberadas = 0;
    let pedidosExpirados = 0;

    // 1. Marca pedidos pendentes vencidos como 'expirado' e exclui cotas vinculadas
    const pedSnap = await this.pedidosCol()
      .where('status', '==', 'pendente')
      .where('expiraEm', '<=', nowIso)
      .get();

    let operations: { ref: any, type: 'update' | 'delete', data?: any }[] = [];

    pedSnap.docs.forEach(doc => {
      operations.push({ ref: doc.ref, type: 'update', data: { status: 'expirado' } });
      pedidosExpirados++;
      const pData = doc.data();
      
      // Enfileira exclusão das cotas vinculadas ao pedido expirado
      if (pData.campanhaId && pData.numeros && Array.isArray(pData.numeros)) {
        pData.numeros.forEach((num: any) => {
          operations.push({ 
            ref: this.cotasCol(pData.campanhaId).doc(String(num)), 
            type: 'delete' 
          });
          cotasLiberadas++;
        });
      }
    });

    // 2. Executa operações em lotes seguros (limite Firestore = 500 por batch)
    for (let i = 0; i < operations.length; i += 400) {
      const chunk = operations.slice(i, i + 400);
      const batch = this.db.batch();
      chunk.forEach(op => {
        if (op.type === 'update') {
          batch.update(op.ref, op.data);
        } else if (op.type === 'delete') {
          batch.delete(op.ref);
        }
      });
      await batch.commit();
    }

    return { cotasLiberadas, pedidosExpirados };
  }

  // --- Apuração / Sorteio de Campanha ---
  public async realizarSorteio(campanhaId: string, numeroSorteado: string): Promise<SorteioResult> {
    const campanha = await this.getCampanhaById(campanhaId);
    if (!campanha) throw new Error('Campanha não encontrada');

    const cotaDoc = await this.cotasCol(campanhaId).doc(String(numeroSorteado)).get();
    let ganhador: SorteioResult['ganhador'] = null;

    if (cotaDoc.exists) {
      const cota = cotaDoc.data() as Cota;
      if (cota.status === 'vendido') {
        const pedido = await this.getPedido(cota.pedidoId);
        ganhador = {
          nome: cota.compradorNome || pedido?.comprador.nome || 'Ganhador',
          whatsapp: pedido?.comprador.whatsapp || '',
          cota: numeroSorteado,
          pedidoId: cota.pedidoId
        };
      }
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
    const limpo = JSON.parse(JSON.stringify(estiloSalvo));
    await this.estilosCol(ownerId).doc(id).set(limpo);
    return estiloSalvo;
  }

  public async listarEstilos(ownerId: string): Promise<EstiloSalvo[]> {
    const snap = await this.estilosCol(ownerId).get();
    const lista = snap.docs.map(d => d.data() as EstiloSalvo);
    return lista.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  public async excluirEstilo(ownerId: string, id: string): Promise<boolean> {
    const docRef = this.estilosCol(ownerId).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;
    await docRef.delete();
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
    const limpo = JSON.parse(JSON.stringify(item));
    await this.checkoutsCol(ownerId).doc(id).set(limpo);
    return item;
  }

  public async listarCheckouts(ownerId: string): Promise<CheckoutSalvo[]> {
    const snap = await this.checkoutsCol(ownerId).get();
    const lista = snap.docs.map(d => d.data() as CheckoutSalvo);
    return lista.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  public async excluirCheckout(ownerId: string, id: string): Promise<boolean> {
    const docRef = this.checkoutsCol(ownerId).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;
    await docRef.delete();
    return true;
  }

  // --- Fila de Mensagens (Automação / Outbox) ---
  public async enfileirarMensagem(msg: Omit<MensagemFila, 'id' | 'criadoEm' | 'status'>): Promise<MensagemFila> {
    const snap = await this.filaCol().where('chaveIdempotencia', '==', msg.chaveIdempotencia).limit(1).get();
    if (!snap.empty) {
      return snap.docs[0].data() as MensagemFila;
    }

    const id = `msg-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const novaMsg: MensagemFila = {
      ...msg,
      id,
      status: 'pendente',
      criadoEm: new Date().toISOString()
    };

    await this.filaCol().doc(id).set(novaMsg);
    return novaMsg;
  }

  public async listarFilaPendente(limitNum: number): Promise<MensagemFila[]> {
    const snap = await this.filaCol().where('status', '==', 'pendente').limit(limitNum).get();
    return snap.docs.map(d => d.data() as MensagemFila);
  }

  public async marcarStatusMensagem(id: string, status: 'pendente' | 'enviada' | 'erro' | 'cancelada', erro?: string): Promise<MensagemFila | null> {
    const docRef = this.filaCol().doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    const msg = doc.data() as MensagemFila;
    msg.status = status;
    if (erro) msg.erro = erro;
    if (status === 'enviada') {
      msg.enviadoEm = new Date().toISOString();
    }

    await docRef.set(msg);
    return msg;
  }

  public async listarTodasMensagensFila(campanhaId?: string): Promise<MensagemFila[]> {
    let query: FirebaseFirestore.Query = this.filaCol();
    if (campanhaId) {
      query = query.where('campanhaId', '==', campanhaId);
    }
    const snap = await query.get();
    const lista = snap.docs.map(d => d.data() as MensagemFila);
    return lista.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  // --- CARTEIRA DO SISTEMA & SAQUES ---
  public async getCarteiraSaldo(ownerId: string): Promise<CarteiraSaldo> {
    if (!ownerId) {
      return {
        ownerId: '',
        saldoTotal: 0,
        saldoDisponivel: 0,
        saldoPendente: 0,
        totalVendido: 0,
        totalArrecadado: 0,
        totalSacado: 0,
        totalTaxasPagas: 0,
        totalTaxas: 0,
        atualizadoEm: new Date().toISOString()
      };
    }

    const ownerConfig = await this.getConfig(ownerId);
    const adminConfig = await this.getConfig('wheslleyaviz@gmail.com');

    const ownerKey = ownerId.toLowerCase();
    const ownerEmailKey = ((ownerConfig as any)?.carteiraConfig?.email || '').toLowerCase();
    const custom = (adminConfig as any)?.carteiraConfig?.taxasPersonalizadas?.[ownerKey] 
                || (adminConfig as any)?.carteiraConfig?.taxasPersonalizadas?.[ownerEmailKey];

    let taxaVendaPct = 8.0;
    if (custom && custom.taxaVendaPct !== undefined) {
      taxaVendaPct = Number(custom.taxaVendaPct);
    } else if ((ownerConfig as any)?.carteiraConfig?.taxaVendaPct !== undefined) {
      taxaVendaPct = Number((ownerConfig as any).carteiraConfig.taxaVendaPct);
    } else if ((adminConfig as any)?.carteiraConfig?.taxaVendaPct !== undefined) {
      taxaVendaPct = Number((adminConfig as any).carteiraConfig.taxaVendaPct);
    }

    const campanhas = await this.getCampanhas(ownerId);
    const campanhasIds = new Set(campanhas.map(c => c.id));

    if (campanhasIds.size === 0) {
      const saqueSnap = await this.saquesCol().where('ownerId', '==', ownerId).get();
      const saques = saqueSnap.docs.map(d => d.data() as SolicitacaoSaque);
      let totalSacado = 0;
      let saldoPendente = 0;
      for (const s of saques) {
        const val = Number(s.valorSolicitado || 0);
        if (s.status === 'pago' || s.status === 'aprovado') totalSacado += val;
        else if (s.status === 'pendente') saldoPendente += val;
      }
      return {
        ownerId,
        saldoTotal: 0,
        saldoDisponivel: 0,
        saldoPendente,
        totalVendido: 0,
        totalArrecadado: 0,
        totalSacado,
        totalTaxasPagas: 0,
        totalTaxas: 0,
        atualizadoEm: new Date().toISOString()
      };
    }

    const arraysOfPedidos = await Promise.all(
      Array.from(campanhasIds).map(cId => this.getPedidosPorCampanha(cId))
    );
    const todosPedidosDoUsuario = arraysOfPedidos.flat();

    // Busca transações para cruzar e excluir as canceladas ou de teste/homologação
    const transSnap = await this.transacoesCol().where('ownerId', '==', ownerId).get();
    const todasTx = transSnap.docs.map(d => d.data() as TransacaoCarteira);
    const txCanceladasIds = new Set<string>();

    for (const t of todasTx) {
      if (t.tipo === 'venda') {
        const descLower = String(t.descricao || '').toLowerCase();
        if (
          t.status === 'cancelada' ||
          descLower.includes('cancelada') ||
          descLower.includes('cancelado') ||
          descLower.includes('homologacao') ||
          descLower.includes('homologação') ||
          descLower.includes('teste') ||
          descLower.includes('test') ||
          descLower.includes('simulado')
        ) {
          if (t.referenciaId) txCanceladasIds.add(String(t.referenciaId));
          const matchId = t.id.replace('tx-venda-', '');
          txCanceladasIds.add(matchId);
        }
      }
    }

    const pedidosPagosDoUsuario = todosPedidosDoUsuario.filter(p => {
      const statusPed = (p as any).status || '';
      if (statusPed !== 'pago' && statusPed !== 'aprovado') return false;
      
      // Filtro principal de gateway
      if (!isPedidoProcessedByCarteira(p)) return false;

      // Exclui se houver uma transação correspondente que foi cancelada ou marcada como homologação/teste
      if (txCanceladasIds.has(String(p.id))) return false;

      // Filtro extra redundante de termos de teste/homologação no pedido
      const compNome = String((p as any).comprador?.nome || '').toLowerCase();
      const compEmail = String((p as any).comprador?.email || '').toLowerCase();
      const notes = String((p as any).observacoes || (p as any).notas || '').toLowerCase();
      
      if (
        compNome.includes('teste') || compNome.includes('test') || compNome.includes('homologacao') || compNome.includes('homologação') || compNome.includes('simulado') ||
        compEmail.includes('teste') || compEmail.includes('test') || compEmail.includes('homologacao') || compEmail.includes('homologação') ||
        notes.includes('cancelada') || notes.includes('cancelado') || notes.includes('teste') || notes.includes('test') || notes.includes('homologacao') || notes.includes('homologação') ||
        p.id.toLowerCase().includes('teste') || p.id.toLowerCase().includes('test')
      ) {
        return false;
      }

      return true;
    });

    let totalArrecadado = 0;
    let totalTaxas = 0;

    for (const ped of pedidosPagosDoUsuario) {
      const valorBruto = extrairValorReaisPedido(ped);
      const taxa = Number(((valorBruto * (taxaVendaPct || 0)) / 100).toFixed(2));
      totalArrecadado += valorBruto;
      totalTaxas += taxa;
    }

    const saqueSnap = await this.saquesCol().where('ownerId', '==', ownerId).get();
    const saques = saqueSnap.docs.map(d => d.data() as SolicitacaoSaque);

    let totalSacado = 0;
    let saldoPendente = 0;

    for (const s of saques) {
      const val = Number(s.valorSolicitado || 0);
      if (s.status === 'pago' || s.status === 'aprovado') {
        totalSacado += val;
      } else if (s.status === 'pendente') {
        saldoPendente += val;
      }
    }

    const totalLiquido = Math.max(0, Number((totalArrecadado - totalTaxas).toFixed(2)));
    const saldoDisponivel = Math.max(0, Number((totalLiquido - totalSacado - saldoPendente).toFixed(2)));
    const saldoTotal = Math.max(0, Number((saldoDisponivel + saldoPendente).toFixed(2)));

    return {
      ownerId,
      saldoTotal,
      saldoDisponivel,
      saldoPendente,
      totalVendido: Number(totalArrecadado.toFixed(2)),
      totalArrecadado: Number(totalArrecadado.toFixed(2)),
      totalSacado: Number(totalSacado.toFixed(2)),
      totalTaxasPagas: Number(totalTaxas.toFixed(2)),
      totalTaxas: Number(totalTaxas.toFixed(2)),
      atualizadoEm: new Date().toISOString()
    };
  }

  public async creditarVendaCarteira(ownerId: string, valorBruto: number, taxaPct: number, pedidoId: string, descricao: string): Promise<TransacaoCarteira> {
    const taxa = Number(((valorBruto * (taxaPct || 0)) / 100).toFixed(2));
    const valorLiquido = Number((valorBruto - taxa).toFixed(2));
    const id = `tx-venda-${pedidoId}`;

    const transacao: TransacaoCarteira = {
      id,
      ownerId,
      tipo: 'venda',
      valorBruto,
      taxa,
      valorLiquido,
      status: 'concluida',
      descricao: descricao || `Venda Pedido #${pedidoId}`,
      referenciaId: pedidoId,
      criadoEm: new Date().toISOString()
    };

    await this.transacoesCol().doc(id).set(transacao);
    return transacao;
  }

  public async solicitarSaque(dados: Omit<SolicitacaoSaque, 'id' | 'criadoEm' | 'status'>): Promise<SolicitacaoSaque> {
    const saldo = await this.getCarteiraSaldo(dados.ownerId);
    if (dados.valorSolicitado <= 0) {
      throw new Error('O valor do saque deve ser maior que zero.');
    }
    if (dados.valorSolicitado > saldo.saldoDisponivel) {
      throw new Error(`Saldo insuficiente para saque. Disponível: R$ ${saldo.saldoDisponivel.toFixed(2)}`);
    }

    const id = `saque-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const novoSaque: SolicitacaoSaque = {
      ...dados,
      id,
      status: 'pendente',
      criadoEm: new Date().toISOString()
    };

    // Remove campos undefined para o Firestore
    const limpo = JSON.parse(JSON.stringify(novoSaque));
    await this.saquesCol().doc(id).set(limpo);

    // Registra transação de débito no extrato
    const txId = `tx-saque-${id}`;
    const transacaoDebito: TransacaoCarteira = {
      id: txId,
      ownerId: dados.ownerId,
      tipo: 'saque',
      valorBruto: dados.valorSolicitado,
      taxa: dados.taxaSaque,
      valorLiquido: dados.valorLiquido,
      status: 'processando',
      descricao: `Solicitação de Saque (${dados.modalidade === 'imediato' ? 'Imediato Pix' : 'D+1 Grátis'})`,
      referenciaId: id,
      criadoEm: new Date().toISOString()
    };
    await this.transacoesCol().doc(txId).set(transacaoDebito);

    return novoSaque;
  }

  public async listarTransacoesCarteira(ownerId: string): Promise<TransacaoCarteira[]> {
    const snap = await this.transacoesCol().where('ownerId', '==', ownerId).get();
    const lista = snap.docs.map(d => d.data() as TransacaoCarteira);
    
    // Deduplica transações de venda com mesma referência (pedidoId)
    const seen = new Set<string>();
    const deduplicado: TransacaoCarteira[] = [];
    for (const t of lista) {
      if (t.tipo === 'venda' && t.referenciaId) {
        if (seen.has(t.referenciaId)) continue;
        seen.add(t.referenciaId);
      }
      deduplicado.push(t);
    }
    return deduplicado.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  public async listarSolicitacoesSaque(ownerId?: string): Promise<SolicitacaoSaque[]> {
    let query: FirebaseFirestore.Query = this.saquesCol();
    if (ownerId) {
      query = query.where('ownerId', '==', ownerId);
    }
    const snap = await query.get();
    const lista = snap.docs.map(d => d.data() as SolicitacaoSaque);
    return lista.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  public async atualizarStatusSaque(saqueId: string, status: 'aprovado' | 'pago' | 'rejeitado', codigoAutenticacao?: string, observacao?: string): Promise<SolicitacaoSaque | null> {
    const docRef = this.saquesCol().doc(saqueId);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    const saque = doc.data() as SolicitacaoSaque;
    saque.status = status;
    if (codigoAutenticacao) saque.codigoAutenticacao = codigoAutenticacao;
    if (observacao) saque.observacao = observacao;
    saque.processadoEm = new Date().toISOString();

    const limpo = JSON.parse(JSON.stringify(saque));
    await docRef.set(limpo);

    const txId = `tx-saque-${saqueId}`;
    const txRef = this.transacoesCol().doc(txId);
    const txDoc = await txRef.get();
    if (txDoc.exists) {
      const tx = txDoc.data() as TransacaoCarteira;
      tx.status = status === 'pago' ? 'concluida' : status === 'rejeitado' ? 'cancelada' : 'processando';
      await txRef.set(tx);
    }

    return saque;
  }
}
