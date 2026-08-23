import { initializeApp, getApps, cert, applicationDefault, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore, type Transaction } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Campanha, Cota, Pedido, Comprador, RankingItem, CotaPremiada, ConfigOrganizador, EstiloSalvo, TemaCampanha } from '../src/types.js';
import { Storage, EstatisticasCampanha, MeusNumerosResult, ConfirmarPedidoResult, SorteioResult, DadosConfig } from './storage-interface.js';
import { mergeConfig } from './config-utils.js';
import { decryptToken } from './crypto-utils.js';

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
    await this.campanhasCol().doc(campanha.id).set(campanha, { merge: false });
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
    await this.pedidosCol().doc(pedido.id).set(pedido, { merge: false });
    return pedido;
  }

  public async getPedido(id: string): Promise<Pedido | null> {
    const doc = await this.pedidosCol().doc(id).get();
    return doc.exists ? (doc.data() as Pedido) : null;
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
    if (resultado.jaProcessado) return { success: true, cotasPremiadasEncontradas: [] };

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

    // 1. Marca pedidos pendentes vencidos como 'expirado'
    const pedSnap = await this.pedidosCol()
      .where('status', '==', 'pendente')
      .where('expiraEm', '<=', nowIso)
      .get();

    const expiredPedidoIds = new Set<string>();
    for (let i = 0; i < pedSnap.docs.length; i += 400) {
      const chunk = pedSnap.docs.slice(i, i + 400);
      const batch = this.db.batch();
      chunk.forEach(doc => {
        batch.update(doc.ref, { status: 'expirado' });
        pedidosExpirados++;
        expiredPedidoIds.add(doc.id);
      });
      await batch.commit();
    }

    // 2. Apaga cotas reservadas vencidas (reservadoAte <= nowIso ou vinculadas a pedidos expirados)
    const campSnap = await this.campanhasCol().get();
    for (const campDoc of campSnap.docs) {
      const cotasSnap = await this.cotasCol(campDoc.id)
        .where('status', '==', 'reservado')
        .get();

      const cotasParaDeletar = cotasSnap.docs.filter(doc => {
        const data = doc.data();
        const vencidoPorData = Boolean(data.reservadoAte && data.reservadoAte <= nowIso);
        const vencidoPorPedido = Boolean(data.pedidoId && expiredPedidoIds.has(data.pedidoId));
        return vencidoPorData || vencidoPorPedido;
      });

      for (let i = 0; i < cotasParaDeletar.length; i += 400) {
        const chunk = cotasParaDeletar.slice(i, i + 400);
        const batch = this.db.batch();
        chunk.forEach(doc => {
          batch.delete(doc.ref);
          cotasLiberadas++;
        });
        await batch.commit();
      }
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
    await this.estilosCol(ownerId).doc(id).set(estiloSalvo);
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
}
