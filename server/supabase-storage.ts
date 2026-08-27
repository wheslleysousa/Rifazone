import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { Storage, EstatisticasCampanha, MeusNumerosResult, ConfirmarPedidoResult, SorteioResult, DadosConfig } from './storage-interface.js';
import { Campanha, Pedido, Comprador, RankingItem, CotaPremiada, ConfigOrganizador, EstiloSalvo, TemaCampanha, CheckoutSalvo, CheckoutConfig, MensagemFila, CarteiraSaldo, TransacaoCarteira, SolicitacaoSaque, Cota } from '../src/types.js';
import { mergeConfig } from './config-utils.js';
import { decryptToken } from './crypto-utils.js';
import { extrairValorReaisPedido, isPedidoProcessedByCarteira } from './money-utils.js';

export function getSupabaseUrl(): string | undefined {
  return (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim() || undefined;
}

export function getSupabaseKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_KEY ||
    ''
  ).trim() || undefined;
}

export function supabaseDisponivel(): boolean {
  return !!(getSupabaseUrl() && getSupabaseKey());
}

export class SupabaseStorage implements Storage {
  private client: SupabaseClient;

  constructor() {
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabaseKey();
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Credenciais do Supabase (SUPABASE_URL e SUPABASE_KEY/SUPABASE_ANON_KEY) não configuradas.');
    }
    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    console.log(`Supabase conectado com sucesso em: ${supabaseUrl}`);
  }

  // --- Campanhas ---
  async getCampanhas(ownerId?: string): Promise<Campanha[]> {
    let query = this.client.from('campanhas').select('dados');
    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Erro ao buscar campanhas no Supabase:', error);
      return [];
    }
    const lista = (data || []).map(row => row.dados as Campanha);
    return lista.sort((a, b) => new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime());
  }

  async getCampanhaById(id: string): Promise<Campanha | null> {
    const { data, error } = await this.client
      .from('campanhas')
      .select('dados')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar campanha por id no Supabase:', error);
      return null;
    }
    return data?.dados ? (data.dados as Campanha) : null;
  }

  async getCampanhaByCodigo(codigo: string): Promise<Campanha | null> {
    const normalized = codigo.toLowerCase().trim();
    const { data, error } = await this.client
      .from('campanhas')
      .select('dados')
      .eq('codigo', normalized)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar campanha por código no Supabase:', error);
      return null;
    }
    return data?.dados ? (data.dados as Campanha) : null;
  }

  async saveCampanha(campanha: Campanha): Promise<Campanha> {
    if (!campanha.id) campanha.id = 'camp-' + crypto.randomUUID().slice(0, 8);
    if (!campanha.criadaEm) campanha.criadaEm = new Date().toISOString();
    campanha.atualizadaEm = new Date().toISOString();

    const { error } = await this.client.from('campanhas').upsert({
      id: campanha.id,
      owner_id: campanha.ownerId || '',
      codigo: (campanha.codigo || '').toLowerCase().trim(),
      dados: campanha
    });

    if (error) {
      console.error('Erro ao salvar campanha no Supabase:', error);
      throw error;
    }
    return campanha;
  }

  async deleteCampanha(id: string): Promise<boolean> {
    // Exclusão LÓGICA (soft-delete): preserva cotas, pedidos e o registro da
    // campanha para que o faturamento/saldo do organizador não desapareça.
    const { data, error: errGet } = await this.client
      .from('campanhas')
      .select('dados')
      .eq('id', id)
      .maybeSingle();
    if (errGet || !data?.dados) {
      if (errGet) console.error('Erro ao buscar campanha para exclusão no Supabase:', errGet);
      return false;
    }
    const campanha = data.dados as Campanha;
    campanha.excluidaEm = new Date().toISOString();
    const { error } = await this.client
      .from('campanhas')
      .update({ dados: campanha })
      .eq('id', id);
    if (error) {
      console.error('Erro ao excluir (soft) campanha no Supabase:', error);
      return false;
    }
    return true;
  }

  // --- Cotas & Estatísticas ---
  async getEstatisticasCampanha(campanhaId: string, totalCotas: number): Promise<EstatisticasCampanha> {
    const nowIso = new Date().toISOString();

    // 1. Contagem de vendidas
    const { count: vendidasCount, error: errVendidas } = await this.client
      .from('cotas')
      .select('*', { count: 'exact', head: true })
      .eq('campanha_id', campanhaId)
      .eq('status', 'vendido');

    if (errVendidas) {
      console.error('Erro ao contar cotas vendidas no Supabase:', errVendidas);
    }

    // 2. Contagem de reservadas válidas
    const { count: reservadasCount, error: errReservadas } = await this.client
      .from('cotas')
      .select('*', { count: 'exact', head: true })
      .eq('campanha_id', campanhaId)
      .eq('status', 'reservado')
      .gt('reservado_ate', nowIso);

    if (errReservadas) {
      console.error('Erro ao contar cotas reservadas no Supabase:', errReservadas);
    }

    const vendidas = vendidasCount || 0;
    const reservadas = reservadasCount || 0;
    const disponiveis = Math.max(0, totalCotas - vendidas - reservadas);
    const percentualVendido = totalCotas > 0 ? Number(((vendidas / totalCotas) * 100).toFixed(1)) : 0;

    return { totalCotas, vendidas, reservadas, disponiveis, percentualVendido };
  }

  async getRankingCampanha(campanhaId: string): Promise<RankingItem[]> {
    const { data, error } = await this.client
      .from('pedidos')
      .select('dados')
      .eq('campanha_id', campanhaId)
      .eq('status', 'pago');

    if (error) {
      console.error('Erro ao buscar ranking no Supabase:', error);
      return [];
    }

    const mapa: Record<string, { nome: string; whatsapp: string; quantidade: number }> = {};
    (data || []).forEach(row => {
      const p = row.dados as Pedido;
      if (!p || !p.comprador) return;
      const key = p.compradorId || p.comprador.whatsapp.replace(/\D/g, '');
      if (!mapa[key]) {
        mapa[key] = { nome: p.comprador.nome, whatsapp: p.comprador.whatsapp, quantidade: 0 };
      }
      mapa[key].quantidade += p.quantidade || 0;
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

  async getCotasOcupadas(campanhaId: string): Promise<Record<string, { status: 'reservado' | 'vendido' }>> {
    const nowMs = Date.now();
    const { data, error } = await this.client
      .from('cotas')
      .select('numero, status, reservado_ate')
      .eq('campanha_id', campanhaId)
      .in('status', ['vendido', 'reservado']);

    if (error) {
      console.error('Erro ao buscar cotas ocupadas no Supabase:', error);
      return {};
    }

    const result: Record<string, { status: 'reservado' | 'vendido' }> = {};
    (data || []).forEach(c => {
      if (c.status === 'vendido') {
        result[c.numero] = { status: 'vendido' };
      } else if (c.status === 'reservado') {
        if (c.reservado_ate && new Date(c.reservado_ate).getTime() > nowMs) {
          result[c.numero] = { status: 'reservado' };
        }
      }
    });
    return result;
  }

  async reservarCotas(
    campanha: Campanha,
    numerosDesejados: string[],
    pedidoId: string,
    compradorId: string,
    compradorNome: string
  ): Promise<void> {
    const nowMs = Date.now();
    const reservadoAte = new Date(nowMs + (campanha.tempoReservaMin || 10) * 60 * 1000).toISOString();

    // 1. Checa se algum número já está ocupado ou reservado no momento
    const { data: ocupadas, error: checkErr } = await this.client
      .from('cotas')
      .select('numero, status, reservado_ate')
      .eq('campanha_id', campanha.id)
      .in('numero', numerosDesejados);

    if (checkErr) {
      throw checkErr;
    }

    if (ocupadas && ocupadas.length > 0) {
      for (const c of ocupadas) {
        const reservaValida = c.status === 'reservado' && !!c.reservado_ate && new Date(c.reservado_ate).getTime() > nowMs;
        if (c.status === 'vendido' || reservaValida) {
          throw new Error(`Número ${c.numero} já está reservado ou vendido.`);
        }
      }
    }

    // 2. Prepara os registros para upsert
    const rows = numerosDesejados.map(num => ({
      campanha_id: campanha.id,
      numero: String(num),
      status: 'reservado',
      pedido_id: pedidoId,
      comprador_id: compradorId,
      comprador_nome: compradorNome,
      reservado_ate: reservadoAte
    }));

    const { error: insertErr } = await this.client
      .from('cotas')
      .upsert(rows, { onConflict: 'campanha_id,numero' });

    if (insertErr) {
      console.error('Erro ao registrar reserva de cotas no Supabase:', insertErr);
      throw insertErr;
    }
  }

  async sortearCotasLivres(campanha: Campanha, quantidade: number): Promise<string[]> {
    const total = campanha.totalCotas;
    const padding = String(total - 1).length;
    const nowMs = Date.now();
    const selecionados = new Set<string>();

    const maxRounds = 40;
    let round = 0;

    while (selecionados.size < quantidade && round < maxRounds) {
      round++;
      const faltam = quantidade - selecionados.size;
      const candidatos = new Set<string>();
      let tentativas = 0;
      while (candidatos.size < faltam * 2 && tentativas < faltam * 20 + 50) {
        tentativas++;
        const numeroStr = String(Math.floor(Math.random() * total)).padStart(padding, '0');
        if (!selecionados.has(numeroStr)) candidatos.add(numeroStr);
      }

      const lista = Array.from(candidatos);
      for (let i = 0; i < lista.length; i += 300) {
        const chunk = lista.slice(i, i + 300);
        const { data: ocupadas } = await this.client
          .from('cotas')
          .select('numero, status, reservado_ate')
          .eq('campanha_id', campanha.id)
          .in('numero', chunk);

        const mapaOcupadas = new Map<string, { status: string; reservado_ate?: string | null }>();
        (ocupadas || []).forEach(o => mapaOcupadas.set(o.numero, o));

        for (const num of chunk) {
          if (selecionados.size >= quantidade) break;
          const reg = mapaOcupadas.get(num);
          let livre = true;
          if (reg) {
            if (reg.status === 'vendido') livre = false;
            else if (reg.status === 'reservado' && reg.reservado_ate && new Date(reg.reservado_ate).getTime() > nowMs) {
              livre = false;
            }
          }
          if (livre) selecionados.add(num);
        }
      }
    }

    if (selecionados.size < quantidade) {
      throw new Error(`Não há cotas suficientes disponíveis. Solicitadas: ${quantidade}, Disponíveis: ${selecionados.size}`);
    }

    return Array.from(selecionados).slice(0, quantidade);
  }

  // --- Pedidos ---
  async savePedido(pedido: Pedido): Promise<Pedido> {
    const { error } = await this.client.from('pedidos').upsert({
      id: pedido.id,
      owner_id: pedido.ownerId || '',
      campanha_id: pedido.campanhaId,
      mp_payment_id: pedido.mpPaymentId ? String(pedido.mpPaymentId) : null,
      efi_payment_id: (pedido as any).efiPaymentId ? String((pedido as any).efiPaymentId) : null,
      status: pedido.status,
      dados: pedido
    });

    if (error) {
      console.error('Erro ao salvar pedido no Supabase:', error);
      throw error;
    }
    return pedido;
  }

  async getPedido(id: string): Promise<Pedido | null> {
    const { data, error } = await this.client
      .from('pedidos')
      .select('dados')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar pedido por id no Supabase:', error);
      return null;
    }
    return data?.dados ? (data.dados as Pedido) : null;
  }

  async getPedidoPorPaymentId(paymentId: string): Promise<Pedido | null> {
    const cleanId = String(paymentId).trim();
    // 1. Busca por mp_payment_id
    let { data } = await this.client
      .from('pedidos')
      .select('dados')
      .eq('mp_payment_id', cleanId)
      .maybeSingle();

    if (data?.dados) return data.dados as Pedido;

    // 2. Busca por efi_payment_id
    ({ data } = await this.client
      .from('pedidos')
      .select('dados')
      .eq('efi_payment_id', cleanId)
      .maybeSingle());

    if (data?.dados) return data.dados as Pedido;

    // 3. Busca por id do pedido direto
    ({ data } = await this.client
      .from('pedidos')
      .select('dados')
      .eq('id', cleanId.replace('carteira_', ''))
      .maybeSingle());

    return data?.dados ? (data.dados as Pedido) : null;
  }

  async getPedidosPorCampanha(campanhaId: string): Promise<Pedido[]> {
    const { data, error } = await this.client
      .from('pedidos')
      .select('dados')
      .eq('campanha_id', campanhaId);

    if (error) {
      console.error('Erro ao buscar pedidos por campanha no Supabase:', error);
      return [];
    }

    const lista = (data || []).map(row => row.dados as Pedido);
    return lista.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  async getTodosPedidos(): Promise<Pedido[]> {
    const { data, error } = await this.client
      .from('pedidos')
      .select('dados');

    if (error) {
      console.error('Erro ao buscar todos os pedidos no Supabase:', error);
      return [];
    }

    const lista = (data || []).map(row => row.dados as Pedido);
    return lista.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  async confirmarPedido(pedidoId: string, mpPaymentId?: string): Promise<ConfirmarPedidoResult> {
    const pedido = await this.getPedido(pedidoId);
    if (!pedido) {
      return { success: false, cotasPremiadasEncontradas: [] };
    }

    if (pedido.status === 'pago') {
      return { success: true, cotasPremiadasEncontradas: [], jaProcessado: true };
    }

    // 1. Atualiza pedido para pago
    pedido.status = 'pago';
    pedido.pagoEm = new Date().toISOString();
    if (mpPaymentId) {
      pedido.mpPaymentId = String(mpPaymentId);
    }
    await this.savePedido(pedido);

    // 2. Converte cotas reservadas -> vendidas no Supabase
    if (pedido.numeros && pedido.numeros.length > 0) {
      const rows = pedido.numeros.map(num => ({
        campanha_id: pedido.campanhaId,
        numero: String(num),
        status: 'vendido',
        pedido_id: pedido.id,
        comprador_id: pedido.compradorId,
        comprador_nome: pedido.comprador?.nome || '',
        reservado_ate: null
      }));

      const { error: cotaErr } = await this.client
        .from('cotas')
        .upsert(rows, { onConflict: 'campanha_id,numero' });

      if (cotaErr) {
        console.error('Erro ao atualizar cotas vendidas no Supabase:', cotaErr);
      }
    }

    // 3. Cotas premiadas (se configurado na campanha)
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
      if (mudou) {
        await this.saveCampanha(campanha);
      }
    }

    return { success: true, cotasPremiadasEncontradas };
  }

  async getMeusNumeros(campanhaId: string, rawWhatsapp: string): Promise<MeusNumerosResult> {
    const cleanPhone = rawWhatsapp.replace(/\D/g, '');
    const { data: pedidosRows, error } = await this.client
      .from('pedidos')
      .select('dados')
      .eq('campanha_id', campanhaId)
      .eq('status', 'pago');

    if (error) {
      console.error('Erro ao buscar pedidos para Meus Números no Supabase:', error);
      return { comprador: null, cotas: [], pedidos: [] };
    }

    const pedidosPagos = (pedidosRows || [])
      .map(r => r.dados as Pedido)
      .filter(p => p.comprador && p.comprador.whatsapp && p.comprador.whatsapp.replace(/\D/g, '') === cleanPhone);

    const todasCotas: string[] = [];
    pedidosPagos.forEach(p => todasCotas.push(...(p.numeros || [])));

    // Busca comprador
    const { data: compRow } = await this.client
      .from('compradores')
      .select('dados')
      .eq('whatsapp', cleanPhone)
      .maybeSingle();

    const comprador = compRow?.dados ? (compRow.dados as Comprador) : null;

    return {
      comprador,
      cotas: Array.from(new Set(todasCotas)).sort((a, b) => a.localeCompare(b)),
      pedidos: pedidosPagos
    };
  }

  // --- Comprador ---
  async saveComprador(comprador: Comprador): Promise<Comprador> {
    const cleanId = comprador.whatsapp.replace(/\D/g, '');
    comprador.id = cleanId;

    const { error } = await this.client.from('compradores').upsert({
      whatsapp: cleanId,
      nome: comprador.nome || null
    });

    if (error) {
      console.error('Erro ao salvar comprador no Supabase:', error);
    }
    return comprador;
  }

  // --- Configurações do Organizador ---
  async getTodasConfiguracoes(): Promise<{ ownerId: string; config: ConfigOrganizador }[]> {
    const { data, error } = await this.client.from('configs').select('owner_id, dados');
    if (error) {
      console.error('Erro ao listar todas as configurações no Supabase:', error);
      return [];
    }
    return (data || []).map(r => ({ ownerId: r.owner_id, config: r.dados as ConfigOrganizador }));
  }

  async getConfig(ownerId: string): Promise<ConfigOrganizador | null> {
    const { data, error } = await this.client
      .from('configs')
      .select('dados')
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar config no Supabase:', error);
      return null;
    }
    return data?.dados ? (data.dados as ConfigOrganizador) : null;
  }

  async saveConfig(ownerId: string, dados: DadosConfig): Promise<ConfigOrganizador> {
    const existente = await this.getConfig(ownerId);
    const config = mergeConfig(ownerId, existente, dados);

    const { error } = await this.client.from('configs').upsert({
      owner_id: ownerId,
      dados: config
    });

    if (error) {
      console.error('Erro ao salvar config no Supabase:', error);
      throw error;
    }
    return config;
  }

  async deleteConfig(ownerId: string): Promise<boolean> {
    const { error } = await this.client.from('configs').delete().eq('owner_id', ownerId);
    if (error) {
      console.error('Erro ao excluir config no Supabase:', error);
      return false;
    }
    return true;
  }

  async getMpTokenPorCampanha(campanhaId: string): Promise<string | null> {
    const campanha = await this.getCampanhaById(campanhaId);
    if (!campanha || !campanha.ownerId) return null;
    const config = await this.getConfig(campanha.ownerId);
    return decryptToken(config?.mpAccessToken) || null;
  }

  // --- Limpeza de reservas expiradas ---
  async limparReservasExpiradas(): Promise<{ cotasLiberadas: number; pedidosExpirados: number }> {
    const nowIso = new Date().toISOString();
    let cotasLiberadas = 0;
    let pedidosExpirados = 0;

    // 1. Busca pedidos pendentes vencidos
    const { data: pedidosVencidos, error: pedErr } = await this.client
      .from('pedidos')
      .select('id, campanha_id, dados')
      .eq('status', 'pendente');

    if (!pedErr && pedidosVencidos) {
      for (const p of pedidosVencidos) {
        const pedData = p.dados as Pedido;
        if (pedData.expiraEm && pedData.expiraEm <= nowIso) {
          pedData.status = 'expirado';
          await this.savePedido(pedData);
          pedidosExpirados++;

          // Libera as cotas vinculadas
          if (pedData.numeros && pedData.numeros.length > 0) {
            const { error: delErr } = await this.client
              .from('cotas')
              .delete()
              .eq('campanha_id', pedData.campanhaId)
              .in('numero', pedData.numeros)
              .eq('status', 'reservado');

            if (!delErr) {
              cotasLiberadas += pedData.numeros.length;
            }
          }
        }
      }
    }

    // 2. Remove cotas reservadas com prazo de expiração ultrapassado
    const { error: delExpErr } = await this.client
      .from('cotas')
      .delete()
      .eq('status', 'reservado')
      .lte('reservado_ate', nowIso);

    if (delExpErr) {
      console.error('Erro ao expirar cotas no Supabase:', delExpErr);
    }

    return { cotasLiberadas, pedidosExpirados };
  }

  // --- Sorteio de Campanha ---
  async realizarSorteio(campanhaId: string, numeroSorteado: string): Promise<SorteioResult> {
    const campanha = await this.getCampanhaById(campanhaId);
    if (!campanha) throw new Error('Campanha não encontrada');

    const { data: cotaData } = await this.client
      .from('cotas')
      .select('*')
      .eq('campanha_id', campanhaId)
      .eq('numero', String(numeroSorteado))
      .maybeSingle();

    let ganhador: SorteioResult['ganhador'] = null;

    if (cotaData && cotaData.status === 'vendido') {
      const pedido = await this.getPedido(cotaData.pedido_id);
      ganhador = {
        nome: cotaData.comprador_nome || pedido?.comprador.nome || 'Ganhador',
        whatsapp: pedido?.comprador.whatsapp || '',
        cota: numeroSorteado,
        pedidoId: cotaData.pedido_id
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
  async salvarEstilo(ownerId: string, estilo: { id?: string; nome: string; tema: TemaCampanha }): Promise<EstiloSalvo> {
    const id = estilo.id || `estilo-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const estiloSalvo: EstiloSalvo = {
      id,
      ownerId,
      nome: estilo.nome.trim() || 'Estilo Sem Nome',
      tema: estilo.tema,
      criadoEm: new Date().toISOString()
    };

    const { error } = await this.client.from('estilos').upsert({
      id,
      owner_id: ownerId,
      dados: estiloSalvo
    });

    if (error) {
      console.error('Erro ao salvar estilo no Supabase:', error);
      throw error;
    }
    return estiloSalvo;
  }

  async listarEstilos(ownerId: string): Promise<EstiloSalvo[]> {
    const { data, error } = await this.client.from('estilos').select('dados').eq('owner_id', ownerId);
    if (error) {
      console.error('Erro ao listar estilos no Supabase:', error);
      return [];
    }
    const lista = (data || []).map(r => r.dados as EstiloSalvo);
    return lista.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  async excluirEstilo(ownerId: string, id: string): Promise<boolean> {
    const { error } = await this.client.from('estilos').delete().eq('id', id).eq('owner_id', ownerId);
    return !error;
  }

  // --- Checkouts Salvos ---
  async salvarCheckout(ownerId: string, checkoutData: { id?: string; nome: string; checkout: CheckoutConfig }): Promise<CheckoutSalvo> {
    const id = checkoutData.id || `chk-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const item: CheckoutSalvo = {
      id,
      ownerId,
      nome: checkoutData.nome.trim() || 'Checkout Sem Nome',
      checkout: checkoutData.checkout,
      criadoEm: new Date().toISOString()
    };

    const { error } = await this.client.from('checkouts').upsert({
      id,
      owner_id: ownerId,
      dados: item
    });

    if (error) {
      console.error('Erro ao salvar checkout no Supabase:', error);
      throw error;
    }
    return item;
  }

  async listarCheckouts(ownerId: string): Promise<CheckoutSalvo[]> {
    const { data, error } = await this.client.from('checkouts').select('dados').eq('owner_id', ownerId);
    if (error) {
      console.error('Erro ao listar checkouts no Supabase:', error);
      return [];
    }
    const lista = (data || []).map(r => r.dados as CheckoutSalvo);
    return lista.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  async excluirCheckout(ownerId: string, id: string): Promise<boolean> {
    const { error } = await this.client.from('checkouts').delete().eq('id', id).eq('owner_id', ownerId);
    return !error;
  }

  // --- Fila de Mensagens (Automação / Outbox) ---
  async enfileirarMensagem(msg: Omit<MensagemFila, 'id' | 'criadoEm' | 'status'>): Promise<MensagemFila> {
    // 1. Checa idempotência
    if (msg.chaveIdempotencia) {
      const { data: existente } = await this.client
        .from('fila')
        .select('dados')
        .eq('chave_idempotencia', msg.chaveIdempotencia)
        .maybeSingle();

      if (existente?.dados) {
        return existente.dados as MensagemFila;
      }
    }

    const id = `msg-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const novaMsg: MensagemFila = {
      ...msg,
      id,
      status: 'pendente',
      criadoEm: new Date().toISOString()
    };

    const { error } = await this.client.from('fila').upsert({
      id,
      chave_idempotencia: msg.chaveIdempotencia || id,
      campanha_id: msg.campanhaId || null,
      status: 'pendente',
      dados: novaMsg
    });

    if (error) {
      console.error('Erro ao enfileirar mensagem no Supabase:', error);
    }
    return novaMsg;
  }

  async listarFilaPendente(limitNum: number): Promise<MensagemFila[]> {
    const { data, error } = await this.client
      .from('fila')
      .select('dados')
      .eq('status', 'pendente')
      .limit(limitNum);

    if (error) {
      console.error('Erro ao listar fila pendente no Supabase:', error);
      return [];
    }
    return (data || []).map(r => r.dados as MensagemFila);
  }

  async marcarStatusMensagem(id: string, status: 'pendente' | 'enviada' | 'erro' | 'cancelada', erro?: string): Promise<MensagemFila | null> {
    const { data: row } = await this.client.from('fila').select('dados').eq('id', id).maybeSingle();
    if (!row?.dados) return null;

    const msg = row.dados as MensagemFila;
    msg.status = status;
    if (erro) msg.erro = erro;
    if (status === 'enviada') {
      msg.enviadoEm = new Date().toISOString();
    }

    await this.client.from('fila').update({
      status,
      dados: msg
    }).eq('id', id);

    return msg;
  }

  async listarTodasMensagensFila(campanhaId?: string): Promise<MensagemFila[]> {
    let query = this.client.from('fila').select('dados');
    if (campanhaId) {
      query = query.eq('campanha_id', campanhaId);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Erro ao listar mensagens da fila no Supabase:', error);
      return [];
    }
    const lista = (data || []).map(r => r.dados as MensagemFila);
    return lista.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  // --- CARTEIRA DO SISTEMA & SAQUES COM CHECKPOINT INCREMENTAL ---

  // Resolve todos os IDs/Emails associados ao mesmo usuário para conciliação global
  private async resolverOwnerIds(ownerId: string): Promise<string[]> {
    const ids = new Set<string>();
    if (ownerId) ids.add(ownerId);

    try {
      // 1. Busca configurações para achar email ou uid associado
      const { data: configs } = await this.client.from('configs').select('owner_id, dados');
      for (const c of configs || []) {
        if (c.owner_id === ownerId || c.dados?.userEmail === ownerId || c.dados?.userId === ownerId) {
          if (c.owner_id) ids.add(c.owner_id);
          if (c.dados?.userEmail) ids.add(c.dados.userEmail);
          if (c.dados?.userId) ids.add(c.dados.userId);
        }
      }

      // 2. Busca campanhas associadas para descobrir IDs
      const { data: camps } = await this.client.from('campanhas').select('owner_id, dados');
      for (const camp of camps || []) {
        if (camp.owner_id === ownerId || camp.dados?.ownerEmail === ownerId || camp.dados?.ownerId === ownerId) {
          if (camp.owner_id) ids.add(camp.owner_id);
          if (camp.dados?.ownerId) ids.add(camp.dados.ownerId);
          if (camp.dados?.ownerEmail) ids.add(camp.dados.ownerEmail);
        }
      }
    } catch (err) {
      console.warn('Aviso ao resolver ownerIds múltiplos:', err);
    }

    return Array.from(ids);
  }

  async getCarteiraSaldo(ownerId: string, _forcarRecalculo: boolean = false): Promise<CarteiraSaldo> {
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

    const allOwnerIds = await this.resolverOwnerIds(ownerId);
    
    let configGeral: any = null;
    for (const id of allOwnerIds) {
      const { data: cfgRow } = await this.client.from('configs').select('dados').eq('owner_id', id).maybeSingle();
      if (cfgRow?.dados) {
        configGeral = cfgRow.dados;
        break;
      }
    }

    const ownerConfig = configGeral;
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
      const { data: todosSaques } = await this.client.from('saques').select('id, owner_id, dados');
      const saquesDoUsuario = (todosSaques || [])
        .filter(s => allOwnerIds.includes(s.owner_id || s.dados?.ownerId || ''))
        .map(s => s.dados as SolicitacaoSaque);

      let totalSacado = 0;
      let saldoPendente = 0;
      for (const s of saquesDoUsuario) {
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
    const { data: txRows } = await this.client.from('transacoes').select('dados');
    const todasTx = (txRows || [])
      .map(r => r.dados as TransacaoCarteira)
      .filter(t => allOwnerIds.includes(t.ownerId || ''));
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

    const { data: todosSaques } = await this.client.from('saques').select('id, owner_id, dados');
    const saquesDoUsuario = (todosSaques || [])
      .filter(s => allOwnerIds.includes(s.owner_id || s.dados?.ownerId || ''))
      .map(s => s.dados as SolicitacaoSaque);

    let totalSacado = 0;
    let saldoPendente = 0;

    for (const s of saquesDoUsuario) {
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

  async creditarVendaCarteira(ownerId: string, valorBruto: number, taxaPct: number, pedidoId: string, descricao: string): Promise<TransacaoCarteira> {
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

    await this.client.from('transacoes').upsert({
      id,
      owner_id: ownerId,
      dados: transacao
    });

    // Invalida checkpoint para forçar atualização no próximo acesso
    await this.getCarteiraSaldo(ownerId, true).catch(() => {});

    return transacao;
  }

  async solicitarSaque(dados: Omit<SolicitacaoSaque, 'id' | 'criadoEm' | 'status'>): Promise<SolicitacaoSaque> {
    const saldo = await this.getCarteiraSaldo(dados.ownerId, true);
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

    await this.client.from('saques').upsert({
      id,
      owner_id: dados.ownerId,
      dados: novoSaque
    });

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

    await this.client.from('transacoes').upsert({
      id: txId,
      owner_id: dados.ownerId,
      dados: transacaoDebito
    });

    // Atualiza o checkpoint
    await this.getCarteiraSaldo(dados.ownerId, true).catch(() => {});

    return novoSaque;
  }

  async listarTransacoesCarteira(ownerId: string): Promise<TransacaoCarteira[]> {
    const allOwnerIds = await this.resolverOwnerIds(ownerId);
    
    // Garante sincronização de saldo e transações
    await this.getCarteiraSaldo(ownerId, false).catch(() => {});

    const { data, error } = await this.client.from('transacoes').select('dados');
    if (error) {
      console.error('Erro ao listar transações no Supabase:', error);
      return [];
    }

    const todas = (data || [])
      .map(r => r.dados as TransacaoCarteira)
      .filter(t => allOwnerIds.includes(t.ownerId || ''));

    const seen = new Set<string>();
    const deduplicado: TransacaoCarteira[] = [];
    for (const t of todas) {
      const key = t.referenciaId ? `${t.tipo}-${t.referenciaId}` : t.id;
      if (seen.has(key)) continue;
      seen.add(key);
      deduplicado.push(t);
    }
    return deduplicado.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  async listarSolicitacoesSaque(ownerId?: string): Promise<SolicitacaoSaque[]> {
    const { data, error } = await this.client.from('saques').select('dados');
    if (error) {
      console.error('Erro ao listar saques no Supabase:', error);
      return [];
    }
    
    let lista = (data || []).map(r => r.dados as SolicitacaoSaque);
    if (ownerId) {
      const allOwnerIds = await this.resolverOwnerIds(ownerId);
      lista = lista.filter(s => allOwnerIds.includes(s.ownerId || ''));
    }

    return lista.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  async atualizarStatusSaque(saqueId: string, status: 'aprovado' | 'pago' | 'rejeitado', codigoAutenticacao?: string, observacao?: string): Promise<SolicitacaoSaque | null> {
    const { data: row } = await this.client.from('saques').select('dados').eq('id', saqueId).maybeSingle();
    if (!row?.dados) return null;

    const saque = row.dados as SolicitacaoSaque;
    saque.status = status;
    if (codigoAutenticacao) saque.codigoAutenticacao = codigoAutenticacao;
    if (observacao) saque.observacao = observacao;
    saque.processadoEm = new Date().toISOString();

    await this.client.from('saques').update({ dados: saque }).eq('id', saqueId);

    const txId = `tx-saque-${saqueId}`;
    const { data: txRow } = await this.client.from('transacoes').select('dados').eq('id', txId).maybeSingle();
    if (txRow?.dados) {
      const tx = txRow.dados as TransacaoCarteira;
      tx.status = status === 'pago' ? 'concluida' : status === 'rejeitado' ? 'cancelada' : 'processando';
      await this.client.from('transacoes').update({ dados: tx }).eq('id', txId);
    }

    // Invalida o checkpoint para recalcular imediatamente
    if (saque.ownerId) {
      await this.getCarteiraSaldo(saque.ownerId, true).catch(() => {});
    }

    return saque;
  }
}

