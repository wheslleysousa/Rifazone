import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';

process.on('uncaughtException', (err: any) => {
  if (err && err.message && err.message.includes('RESOURCE_EXHAUSTED')) return;
  console.error('[UNCAUGHT EXCEPTION]', err);
});

process.on('unhandledRejection', (reason: any, promise) => {
  if (reason && reason.message && reason.message.includes('RESOURCE_EXHAUSTED')) return;
  console.error('[UNHANDLED REJECTION]', reason);
});

import { createServer as createViteServer } from 'vite';
import { db, usandoFirestore } from './server/db.js';
import { mpService } from './server/mercadopago.js';
import { geminiService } from './server/gemini.js';
import { verifyFirebaseToken } from './server/auth.js';
import { configParaPainel, configParaMarcaPublica } from './server/config-utils.js';
import { decryptToken } from './server/crypto-utils.js';
import {
  dispararMetaCapiPurchase,
  buscarInsightsMetaAds,
  buscarBusinessManagers,
  buscarAdAccounts,
  buscarInsightsDeVariasContas,
  buscarTodasAsContasDeAnunciosDoUsuario
} from './server/meta-service.js';
import { toCents, toReais } from './server/money-utils.js';
import { EmailNotificador } from './server/notifications.js';
import { gerarPixMultiGateway, consultarPagamentoAsaas, consultarPagamentoEfipay } from './server/gateways.js';
import { Campanha, TEMA_PADRAO, DEFAULT_CHECKOUT_CONFIG } from './src/types.js';

// Sanitiza e normaliza campos de Campanha de forma única para criação e edição (evita divergências)
export function sanitizarCampanha(
  data: Partial<Campanha>,
  base?: Campanha | null,
  ownerId?: string,
  ownerEmail?: string | null
): Campanha {
  const agora = new Date().toISOString();

  return {
    id: base?.id || data.id || `camp-${crypto.randomUUID().slice(0, 8)}`,
    ownerId: base?.ownerId || ownerId || data.ownerId || '',
    ownerEmail: base?.ownerEmail ?? (ownerEmail !== undefined ? ownerEmail : (data.ownerEmail ?? null)),
    codigo: (data.codigo || base?.codigo || '').toLowerCase().trim().replace(/[^a-z0-9-_]/g, ''),
    titulo: String(data.titulo ?? base?.titulo ?? '').trim(),
    subtitulo: data.subtitulo !== undefined ? (data.subtitulo ? String(data.subtitulo).trim() : null) : (base?.subtitulo ?? null),
    descricao: String(data.descricao ?? base?.descricao ?? '<p>Participe do nosso sorteio oficial!</p>'),
    bannerUrl: data.bannerUrl !== undefined ? (data.bannerUrl || null) : (base?.bannerUrl ?? null),
    fotosCarrossel: Array.isArray(data.fotosCarrossel) ? data.fotosCarrossel : (base?.fotosCarrossel || []),
    youtubeUrl: data.youtubeUrl !== undefined ? (data.youtubeUrl ? String(data.youtubeUrl).trim() : null) : (base?.youtubeUrl ?? null),
    modelo: (data.modelo === 'manual' ? 'manual' : 'aleatorio') as 'aleatorio' | 'manual',
    totalCotas: Number(data.totalCotas ?? base?.totalCotas ?? 10000),
    valorCota: data.valorCota !== undefined ? toCents(data.valorCota) : (base?.valorCota ?? 5000),
    minPorCompra: Number(data.minPorCompra ?? base?.minPorCompra ?? 1),
    maxPorCompra: Number(data.maxPorCompra ?? base?.maxPorCompra ?? 1000),
    localSorteio: String(data.localSorteio ?? base?.localSorteio ?? 'Loteria Federal'),
    dataSorteio: data.dataSorteio !== undefined ? (data.dataSorteio || null) : (base?.dataSorteio ?? null),
    agendamentoAtivo: data.agendamentoAtivo !== undefined ? Boolean(data.agendamentoAtivo) : (base?.agendamentoAtivo ?? false),
    metaPixelId: data.metaPixelId !== undefined ? (data.metaPixelId ? String(data.metaPixelId).trim() : null) : (base?.metaPixelId ?? null),
    metaCampaignId: data.metaCampaignId !== undefined ? (data.metaCampaignId ? String(data.metaCampaignId).trim() : null) : (base?.metaCampaignId ?? null),
    dataInicio: data.dataInicio !== undefined ? (data.dataInicio || null) : (base?.dataInicio ?? null),
    dataTermino: data.dataTermino !== undefined ? (data.dataTermino || null) : (base?.dataTermino ?? null),
    descontoPorValorTotal: Array.isArray(data.descontoPorValorTotal)
      ? data.descontoPorValorTotal.map(d => ({
          aPartirDeValor: toCents(d.aPartirDeValor),
          valorCotaComDesconto: toCents(d.valorCotaComDesconto)
        }))
      : (base?.descontoPorValorTotal || []),
    organizadorNome: data.organizadorNome !== undefined ? (data.organizadorNome || null) : (base?.organizadorNome ?? null),
    organizadorFoto: data.organizadorFoto !== undefined ? (data.organizadorFoto || null) : (base?.organizadorFoto ?? null),
    organizadorWhatsapp: data.organizadorWhatsapp !== undefined ? (data.organizadorWhatsapp || null) : (base?.organizadorWhatsapp ?? null),
    organizadorInstagram: data.organizadorInstagram !== undefined ? (data.organizadorInstagram || null) : (base?.organizadorInstagram ?? null),
    organizadorTiktok: data.organizadorTiktok !== undefined ? (data.organizadorTiktok || null) : (base?.organizadorTiktok ?? null),
    premios: Array.isArray(data.premios) ? data.premios : (base?.premios || [{ posicao: 1, descricao: data.titulo || '1º Prêmio' }]),
    cotasPremiadas: Array.isArray(data.cotasPremiadas) ? data.cotasPremiadas : (base?.cotasPremiadas || []),
    promocoes: Array.isArray(data.promocoes)
      ? data.promocoes.map(p => ({
          quantidade: Number(p.quantidade),
          valor: toCents(p.valor),
          destaque: Boolean(p.destaque)
        }))
      : (base?.promocoes || []),
    ofertasRelampago: Array.isArray(data.ofertasRelampago)
      ? data.ofertasRelampago.map(o => ({
          id: o.id || `oferta-${Math.random().toString(36).substring(2, 7)}`,
          titulo: String(o.titulo || ''),
          subtitulo: String(o.subtitulo || ''),
          cotasExtras: Number(o.cotasExtras || 0),
          preco: toCents(o.preco),
          selo: o.selo ? String(o.selo) : null
        }))
      : (base?.ofertasRelampago || []),
    selo: data.selo !== undefined ? (data.selo || null) : (base?.selo ?? null),
    tempoReservaMin: Number(data.tempoReservaMin ?? base?.tempoReservaMin ?? 10),
    filtroInicialCotas: (data.filtroInicialCotas || base?.filtroInicialCotas || 'todas') as any,
    ebookUrl: data.ebookUrl !== undefined ? (data.ebookUrl || null) : (base?.ebookUrl ?? null),
    ebookTitulo: data.ebookTitulo !== undefined ? (data.ebookTitulo || null) : (base?.ebookTitulo ?? null),
    roletaPremiada: data.roletaPremiada !== undefined ? data.roletaPremiada : (base?.roletaPremiada ?? null),
    trilhaPremios: Array.isArray(data.trilhaPremios) ? data.trilhaPremios : (base?.trilhaPremios || []),
    afiliadosAtivo: data.afiliadosAtivo !== undefined ? Boolean(data.afiliadosAtivo) : (base?.afiliadosAtivo ?? false),
    comissaoAfiliadoPct: Number(data.comissaoAfiliadoPct ?? base?.comissaoAfiliadoPct ?? 0),
    exibirRanking: data.exibirRanking !== undefined ? Boolean(data.exibirRanking) : (base?.exibirRanking ?? true),
    exibirBarraProgresso: data.exibirBarraProgresso !== undefined ? Boolean(data.exibirBarraProgresso) : (base?.exibirBarraProgresso ?? true),
    exibirPaginaGanhadores: data.exibirPaginaGanhadores !== undefined ? Boolean(data.exibirPaginaGanhadores) : (base?.exibirPaginaGanhadores ?? true),
    exibirQtdCotas: data.exibirQtdCotas !== undefined ? Boolean(data.exibirQtdCotas) : (base?.exibirQtdCotas ?? true),
    exibirCompradores: data.exibirCompradores !== undefined ? Boolean(data.exibirCompradores) : (base?.exibirCompradores ?? true),
    exibirSelo: data.exibirSelo !== undefined ? Boolean(data.exibirSelo) : (base?.exibirSelo ?? true),
    exibirPremios: data.exibirPremios !== undefined ? Boolean(data.exibirPremios) : (base?.exibirPremios ?? true),
    exibirCotasPremiadas: data.exibirCotasPremiadas !== undefined ? Boolean(data.exibirCotasPremiadas) : (base?.exibirCotasPremiadas ?? true),
    tempoAnimacaoSorteioSegundos: Number(data.tempoAnimacaoSorteioSegundos ?? base?.tempoAnimacaoSorteioSegundos ?? 3),
    exigirEmail: data.exigirEmail !== undefined ? Boolean(data.exigirEmail) : (base?.exigirEmail ?? false),
    exigirCpf: data.exigirCpf !== undefined ? Boolean(data.exigirCpf) : (base?.exigirCpf ?? false),
    tema: data.tema || base?.tema || TEMA_PADRAO,
    checkoutId: data.checkoutId !== undefined ? (data.checkoutId || undefined) : (base?.checkoutId ?? undefined),
    checkout: data.checkout || base?.checkout || DEFAULT_CHECKOUT_CONFIG,
    remarketing: data.remarketing !== undefined ? data.remarketing : (base?.remarketing ?? {
      ativo: false,
      canal: 'whatsapp',
      regrasNaoPagou: [
        { faltandoMin: 5, mensagem: "Olá {nome}! Sua reserva de cotas na rifa {campanha} está expirando em {minutos} minutos. Pague via Pix para garantir: {link}" },
        { aposExpirarMin: 30, cupom: "VOLTA10", descontoPct: 10, mensagem: "Oi {nome}! Vimos que seu pedido na {campanha} expirou. Ganhe 10% de desconto usando o cupom {cupom}: {link}" }
      ],
      regraPago: {
        ativo: false,
        enviarNumeros: true,
        mensagem: 'Olá {nome}! Seu pagamento para a campanha {campanha} foi confirmado com sucesso. Seus números: {numeros}. Boa sorte! 🍀'
      },
      somenteSeCampanhaAtiva: true
    }),
    cupons: Array.isArray(data.cupons) ? data.cupons : (base?.cupons || []),
    status: (data.status || base?.status || 'publicada') as any,
    numeroSorteado: base?.numeroSorteado ?? data.numeroSorteado ?? null,
    ganhador: base?.ganhador ?? data.ganhador ?? null,
    ganhadoresHistorico: base?.ganhadoresHistorico || data.ganhadoresHistorico || [],
    criadaEm: base?.criadaEm || agora,
    atualizadaEm: agora
  };
}

const app = express();
const PORT = 3000;

// Estado em memória do worker do WhatsApp Web
let globalWorkerStatus = {
  conectado: false,
  numero: undefined as string | undefined,
  atualizadoEm: undefined as string | undefined
};

// Body parsers
app.use(express.json({
  limit: '10mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

// --- Middleware de Autenticação via Firebase Authentication ---
// Valida o ID Token do Firebase e disponibiliza o organizador em req.userId/req.userEmail.
// Cada organizador só acessa e gerencia as próprias campanhas (multi-tenant).
async function firebaseAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado. Faça login com sua conta.' });
  }

  const token = authHeader.slice('Bearer '.length).trim();

  try {
    const user = await verifyFirebaseToken(token);
    (req as any).userId = user.uid;
    (req as any).userEmail = user.email;
    (req as any).userName = user.name || null;
    return next();
  } catch (err: any) {
    console.warn('Falha na verificação do token Firebase:', err?.message || err);
    return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
  }
}

/**
 * Converte todos os campos monetários de uma campanha de centavos (DB) para reais (API).
 */
export function formatarCampanhaParaEnvio(c: any): any {
  if (!c) return c;
  const valorCotaCents = Number(c.valorCota) || 0;
  return {
    ...c,
    valorCota: toReais(c.valorCota),
    promocoes: c.promocoes?.map((p: any) => {
      const pQtd = Number(p.quantidade) || 0;
      const regularCents = pQtd * valorCotaCents;
      const promoCents = Number(p.valor) || regularCents;
      // Garante que o valor do pacote promocional nunca seja maior que a compra regular
      const finalCents = (promoCents > 0 && promoCents <= regularCents) ? promoCents : regularCents;
      return {
        ...p,
        valor: toReais(finalCents)
      };
    }),
    ofertasRelampago: c.ofertasRelampago?.map((o: any) => ({ ...o, preco: toReais(o.preco) })),
    descontoPorValorTotal: c.descontoPorValorTotal?.map((d: any) => ({
      aPartirDeValor: toReais(d.aPartirDeValor),
      valorCotaComDesconto: toReais(d.valorCotaComDesconto)
    }))
  };
}

/**
 * Converte todos os campos monetários de um pedido de centavos (DB) para reais (API).
 */
export function formatarPedidoParaEnvio(p: any): any {
  if (!p) return p;
  return {
    ...p,
    valorTotal: toReais(p.valorTotal),
    cupomAplicado: p.cupomAplicado ? {
      ...p.cupomAplicado,
      valorDesconto: toReais(p.cupomAplicado.valorDesconto)
    } : p.cupomAplicado
  };
}

// ----------------------------------------------------
// 1. ENDPOINTS PÚBLICOS
// ----------------------------------------------------

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    mpConfigured: mpService.isConfigured(),
    iaConfigured: geminiService.isConfigured(),
    storage: usandoFirestore ? 'firestore' : 'file',
    timestamp: new Date().toISOString()
  });
});

// GET /api/campanhas/:codigo -> Dados da campanha para página pública + estatísticas + ranking
app.get('/api/campanhas/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const campanha = await db.getCampanhaByCodigo(codigo);

    if (!campanha) {
      return res.status(404).json({ error: 'Campanha não encontrada.' });
    }

    const estatisticas = await db.getEstatisticasCampanha(campanha.id, campanha.totalCotas);
    const ranking = campanha.exibirRanking ? await db.getRankingCampanha(campanha.id) : [];

    // Cotas ocupadas caso seja modelo manual
    let cotasOcupadas: Record<string, { status: 'reservado' | 'vendido' }> = {};
    if (campanha.modelo === 'manual') {
      cotasOcupadas = await db.getCotasOcupadas(campanha.id);
    }

    // Não expor dados do organizador (uid/email) na resposta pública
    const { ownerId, ownerEmail, ...campanhaPublica } = campanha;

    // Marca pública do organizador (cores, logo, redes, pixel) — sem segredos
    const configDono = ownerId ? await db.getConfig(ownerId) : null;
    const marca = configParaMarcaPublica(configDono);

    return res.json({
      campanha: formatarCampanhaParaEnvio({
        ...campanhaPublica,
        tema: campanhaPublica.tema || TEMA_PADRAO,
        checkout: campanhaPublica.checkout || DEFAULT_CHECKOUT_CONFIG
      }),
      marca,
      estatisticas: {
        ...estatisticas,
        arrecadado: toReais(estatisticas.vendidas * (campanha.valorCota || 0))
      },
      ranking,
      cotasOcupadas
    });
  } catch (err: any) {
    console.error('Erro ao buscar campanha:', err);
    return res.status(500).json({ error: 'Erro ao carregar dados da campanha.' });
  }
});

// POST /api/pedidos -> Cria pedido, reserva as cotas atomicamente e prepara o método de pagamento
app.post('/api/pedidos', async (req, res) => {
  try {
    const {
      campanhaId,
      quantidade,
      numeros,
      comprador,
      ofertaRelampagoId,
      metodoPagamento = 'pix',
      cupom
    } = req.body;

    if (!campanhaId || !quantidade || !comprador || !comprador.nome || !comprador.whatsapp) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios (nome, whatsapp, quantidade).' });
    }

    const campanha = await db.getCampanhaById(campanhaId);
    if (!campanha) {
      return res.status(404).json({ error: 'Campanha não encontrada.' });
    }

    if (campanha.status !== 'publicada') {
      return res.status(400).json({ error: 'Esta campanha não está aberta para compras no momento.' });
    }

    if (campanha.exigirEmail && !comprador.email) {
      return res.status(400).json({ error: 'O e-mail é obrigatório para esta campanha.' });
    }

    if (campanha.exigirCpf && !comprador.cpf) {
      return res.status(400).json({ error: 'O CPF é obrigatório para esta campanha.' });
    }

    // Salva ou atualiza comprador
    const compradorSalvo = await db.saveComprador({
      id: comprador.whatsapp.replace(/\D/g, ''),
      nome: comprador.nome.trim(),
      whatsapp: comprador.whatsapp.trim(),
      cpf: comprador.cpf ? comprador.cpf.trim() : null,
      email: comprador.email ? comprador.email.trim() : null,
      criadoEm: new Date().toISOString()
    });

    // Calcular cotas totais e valor total em CENTAVOS INTEIROS (sem soma de floats)
    let totalQtd = Number(quantidade);
    const valorUnitarioCents = campanha.valorCota;
    let valorTotalCents = totalQtd * valorUnitarioCents;

    // Verificar se se encaixa em alguma promoção de pacote
    if (campanha.promocoes && campanha.promocoes.length > 0) {
      const promoExata = campanha.promocoes.find(p => Number(p.quantidade) === totalQtd);
      if (promoExata && Number(promoExata.valor) > 0) {
        if (Number(promoExata.valor) <= valorTotalCents) {
          valorTotalCents = Number(promoExata.valor);
        }
      }
    }

    // Desconto progressivo por valor total (se configurado)
    if (campanha.descontoPorValorTotal && campanha.descontoPorValorTotal.length > 0) {
      const regras = [...campanha.descontoPorValorTotal].sort((a, b) => b.aPartirDeValor - a.aPartirDeValor);
      for (const regra of regras) {
        const aPartirDe = regra.aPartirDeValor;
        if (valorTotalCents >= aPartirDe) {
          const valorComDesc = regra.valorCotaComDesconto;
          if (valorComDesc > 0) {
            valorTotalCents = totalQtd * valorComDesc;
          }
          break;
        }
      }
    }

    // Oferta Relâmpago / Upsell adicional
    if (ofertaRelampagoId && campanha.ofertasRelampago) {
      const oferta = campanha.ofertasRelampago.find(o => o.id === ofertaRelampagoId || !o.id);
      if (oferta) {
        totalQtd += Number(oferta.cotasExtras || 0);
        valorTotalCents += oferta.preco;
      }
    }

    // Cupom de Desconto (se informado)
    let cupomAplicado: { codigo: string; descontoPct: number; valorDesconto: number } | null = null;
    if (cupom && typeof cupom === 'string' && cupom.trim()) {
      const cupomUpper = cupom.trim().toUpperCase();
      let descPct = 0;

      if (Array.isArray(campanha.cupons)) {
        const cMatch = campanha.cupons.find(c => c.codigo.toUpperCase() === cupomUpper && c.ativo !== false);
        if (cMatch) descPct = cMatch.descontoPct;
      }

      if (!descPct && campanha.remarketing?.expirado) {
        const rMatch = campanha.remarketing.expirado.find(r => r.cupom && r.cupom.toUpperCase() === cupomUpper);
        if (rMatch && rMatch.descontoPct) descPct = rMatch.descontoPct;
      }

      if (descPct > 0) {
        const valDescCents = Math.round((valorTotalCents * descPct) / 100);
        valorTotalCents = Math.max(0, valorTotalCents - valDescCents);
        cupomAplicado = {
          codigo: cupomUpper,
          descontoPct: descPct,
          valorDesconto: valDescCents / 100
        };
      }
    }

    // Determinar quais números reservar
    let cotasAReservar: string[] = [];

    if (campanha.modelo === 'manual' && Array.isArray(numeros) && numeros.length > 0) {
      if (numeros.length !== totalQtd) {
        return res.status(400).json({ error: `Você selecionou ${numeros.length} cotas, mas a quantidade calculada é ${totalQtd}.` });
      }
      cotasAReservar = numeros;
    } else {
      // Modelo aleatório (sorteia cotas livres)
      try {
        cotasAReservar = await db.sortearCotasLivres(campanha, totalQtd);
      } catch (err: any) {
        return res.status(400).json({ error: err.message || 'Não há cotas suficientes disponíveis para reserva.' });
      }
    }

    const pedidoId = 'ped_' + crypto.randomUUID().slice(0, 10);
    const agora = new Date();
    const expiraEm = new Date(agora.getTime() + (campanha.tempoReservaMin || 10) * 60 * 1000);

    // 1) Reserva atômica das cotas no banco
    try {
      await db.reservarCotas(campanha, cotasAReservar, pedidoId, compradorSalvo.id, compradorSalvo.nome);
    } catch (err: any) {
      return res.status(409).json({ error: err.message || 'Um ou mais números escolhidos acabaram de ser reservados por outro comprador. Tente novamente.' });
    }

    // 1.5) Tratar Modalidade Sorteio Gratuito (0 Reais)
    if (campanha.modalidade === 'gratis' || valorTotalCents === 0) {
      const pedidosExistentes = await db.getPedidosPorCampanha(campanha.id);
      const cpfDigits = compradorSalvo.cpf ? compradorSalvo.cpf.replace(/\D/g, '') : null;
      const phoneDigits = compradorSalvo.whatsapp.replace(/\D/g, '');

      const jaInscrito = pedidosExistentes.some(p => {
        if (!p || p.status === 'cancelado') return false;
        const pCpf = p.comprador?.cpf ? p.comprador.cpf.replace(/\D/g, '') : '';
        const pPhone = p.comprador?.whatsapp ? p.comprador.whatsapp.replace(/\D/g, '') : '';
        return (cpfDigits && pCpf === cpfDigits) || (phoneDigits && pPhone === phoneDigits);
      });

      if (jaInscrito) {
        return res.status(400).json({
          error: 'Você já possui uma cota cadastrada neste sorteio gratuito com este CPF ou WhatsApp.'
        });
      }

      totalQtd = 1;
      if (cotasAReservar.length > 1) {
        cotasAReservar = cotasAReservar.slice(0, 1);
      }

      const novoPedido = await db.savePedido({
        id: pedidoId,
        campanhaId: campanha.id,
        compradorId: compradorSalvo.id,
        comprador: {
          nome: compradorSalvo.nome,
          whatsapp: compradorSalvo.whatsapp,
          cpf: compradorSalvo.cpf,
          email: compradorSalvo.email
        },
        numeros: cotasAReservar,
        quantidade: 1,
        valorTotal: 0,
        status: 'pago',
        metodoPagamento: 'gratis',
        mpPaymentId: 'gratis_' + pedidoId,
        pixCopiaCola: null,
        pixQrCodeBase64: null,
        cupomAplicado: null,
        expiraEm: expiraEm.toISOString(),
        criadoEm: agora.toISOString(),
        pagoEm: agora.toISOString()
      });

      await processarConfirmacaoPedido(novoPedido.id, 'gratis_' + pedidoId, req);

      return res.status(201).json({
        pedidoId: novoPedido.id,
        metodoPagamento: 'gratis',
        valorTotal: 0,
        quantidade: 1,
        numeros: novoPedido.numeros,
        status: 'pago',
        mensagem: 'Inscrição no Sorteio Gratuito confirmada com sucesso!'
      });
    }

    const mpToken = await db.getMpTokenPorCampanha(campanha.id);

    // 2) Tratar o método de pagamento selecionado
    if (metodoPagamento === 'boleto') {
      const boletoResult = await mpService.criarBoleto({
        pedidoId,
        valorTotal: valorTotalCents,
        tituloCampanha: campanha.titulo,
        comprador: compradorSalvo,
        expiraEm
      }, mpToken);

      const novoPedido = await db.savePedido({
        id: pedidoId,
        campanhaId: campanha.id,
        compradorId: compradorSalvo.id,
        comprador: {
          nome: compradorSalvo.nome,
          whatsapp: compradorSalvo.whatsapp,
          cpf: compradorSalvo.cpf,
          email: compradorSalvo.email
        },
        numeros: cotasAReservar,
        quantidade: totalQtd,
        valorTotal: valorTotalCents,
        status: 'pendente',
        metodoPagamento: 'boleto',
        mpPaymentId: boletoResult.paymentId,
        pixCopiaCola: null,
        pixQrCodeBase64: null,
        boletoUrl: boletoResult.boletoUrl,
        boletoLinhaDigitavel: boletoResult.boletoLinhaDigitavel,
        boletoCodigoBarras: boletoResult.boletoCodigoBarras,
        cupomAplicado,
        expiraEm: expiraEm.toISOString(),
        criadoEm: agora.toISOString(),
        pagoEm: null
      });

      return res.status(201).json({
        pedidoId: novoPedido.id,
        metodoPagamento: 'boleto',
        valorTotal: toReais(novoPedido.valorTotal),
        quantidade: novoPedido.quantidade,
        numeros: novoPedido.numeros,
        boletoUrl: novoPedido.boletoUrl,
        boletoLinhaDigitavel: novoPedido.boletoLinhaDigitavel,
        boletoCodigoBarras: novoPedido.boletoCodigoBarras,
        expiraEm: novoPedido.expiraEm,
        tempoReservaMin: campanha.tempoReservaMin,
        isMock: boletoResult.isMock
      });
    }

    if (metodoPagamento === 'cartao') {
      // Para cartão de crédito: reserva as cotas e cria o pedido com status pendente.
      // O token seguro do cartão será gerado no cliente via SDK MercadoPago.js e enviado para /api/pedidos/:id/pagar-cartao
      const novoPedido = await db.savePedido({
        id: pedidoId,
        campanhaId: campanha.id,
        compradorId: compradorSalvo.id,
        comprador: {
          nome: compradorSalvo.nome,
          whatsapp: compradorSalvo.whatsapp,
          cpf: compradorSalvo.cpf,
          email: compradorSalvo.email
        },
        numeros: cotasAReservar,
        quantidade: totalQtd,
        valorTotal: valorTotalCents,
        status: 'pendente',
        metodoPagamento: 'cartao',
        mpPaymentId: null,
        pixCopiaCola: null,
        pixQrCodeBase64: null,
        cupomAplicado,
        expiraEm: expiraEm.toISOString(),
        criadoEm: agora.toISOString(),
        pagoEm: null
      });

      return res.status(201).json({
        pedidoId: novoPedido.id,
        metodoPagamento: 'cartao',
        valorTotal: toReais(novoPedido.valorTotal),
        quantidade: novoPedido.quantidade,
        numeros: novoPedido.numeros,
        expiraEm: novoPedido.expiraEm,
        tempoReservaMin: campanha.tempoReservaMin
      });
    }

    // Default: Pix (Multi-Gateway: Mercado Pago, Asaas, PushinPay, Efí, Carteira do Sistema)
    const ownerConfig = await db.getConfig(campanha.ownerId || '');
    const metodoAtivo = ownerConfig?.metodoAtivo || (mpToken ? 'mercadopago' : 'carteira');

    let pixResult: { paymentId: string; pixCopiaCola: string; pixQrCodeBase64: string; isMock?: boolean };

    if (metodoAtivo === 'mercadopago' || (mpToken && metodoAtivo !== 'carteira' && metodoAtivo !== 'asaas' && metodoAtivo !== 'pushinpay' && metodoAtivo !== 'efipay')) {
      pixResult = await mpService.criarPix({
        pedidoId,
        valorTotal: valorTotalCents,
        tituloCampanha: campanha.titulo,
        comprador: compradorSalvo,
        expiraEm
      }, mpToken);
    } else {
      pixResult = await gerarPixMultiGateway({
        pedidoId,
        valorTotal: valorTotalCents,
        tituloCampanha: campanha.titulo,
        comprador: compradorSalvo,
        expiraEm,
        config: ownerConfig
      });
    }

    const novoPedido = await db.savePedido({
      id: pedidoId,
      campanhaId: campanha.id,
      compradorId: compradorSalvo.id,
      comprador: {
        nome: compradorSalvo.nome,
        whatsapp: compradorSalvo.whatsapp,
        cpf: compradorSalvo.cpf,
        email: compradorSalvo.email
      },
      numeros: cotasAReservar,
      quantidade: totalQtd,
      valorTotal: valorTotalCents,
      status: 'pendente',
      metodoPagamento: 'pix',
      mpPaymentId: pixResult.paymentId,
      pixCopiaCola: pixResult.pixCopiaCola,
      pixQrCodeBase64: pixResult.pixQrCodeBase64,
      cupomAplicado,
      expiraEm: expiraEm.toISOString(),
      criadoEm: agora.toISOString(),
      pagoEm: null
    });

    return res.status(201).json({
      pedidoId: novoPedido.id,
      metodoPagamento: 'pix',
      valorTotal: toReais(novoPedido.valorTotal),
      quantidade: novoPedido.quantidade,
      numeros: novoPedido.numeros,
      pixCopiaCola: novoPedido.pixCopiaCola,
      pixQrCodeBase64: novoPedido.pixQrCodeBase64,
      expiraEm: novoPedido.expiraEm,
      tempoReservaMin: campanha.tempoReservaMin,
      isMock: pixResult.isMock
    });
  } catch (err: any) {
    console.error('Erro ao criar pedido:', err);
    return res.status(400).json({
      error: err.message || 'Erro ao processar pedido.',
      detalhes: err.details || err.cause || err.stack || null,
      isMpError: !!err.mpError,
      isTestToken: !!err.isTestToken
    });
  }
});

// POST /api/pedidos/:id/pagar-cartao -> Processa cartão de crédito transparente via token gerado no cliente
app.post('/api/pedidos/:id/pagar-cartao', async (req, res) => {
  try {
    const { id } = req.params;
    const { token, installments, payment_method_id, issuer_id, email, cpf } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token do cartão não fornecido. O cartão deve ser tokenizado no navegador.' });
    }

    const pedido = await db.getPedido(id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    if (pedido.status === 'pago') {
      return res.json({ status: 'approved', pago: true, pedidoId: pedido.id, message: 'Pedido já se encontra pago!' });
    }

    if (pedido.status === 'expirado' || pedido.status === 'cancelado') {
      return res.status(400).json({ error: 'Este pedido foi expirado ou cancelado. Por favor, reserve suas cotas novamente.' });
    }

    const campanha = await db.getCampanhaById(pedido.campanhaId);
    if (!campanha) {
      return res.status(404).json({ error: 'Campanha não encontrada.' });
    }

    const mpToken = await db.getMpTokenPorCampanha(campanha.id);

    const result = await mpService.processarCartao({
      pedidoId: pedido.id,
      valorTotal: pedido.valorTotal,
      tituloCampanha: campanha.titulo,
      token,
      installments: Number(installments) || 1,
      paymentMethodId: payment_method_id || 'visa',
      issuerId: issuer_id,
      comprador: {
        nome: pedido.comprador.nome,
        whatsapp: pedido.comprador.whatsapp,
        cpf: cpf || pedido.comprador.cpf,
        email: email || pedido.comprador.email
      }
    }, mpToken);

    pedido.mpPaymentId = result.paymentId;
    pedido.cartaoInfo = result.cardInfo || null;

    if (result.approved) {
      const confirmacao = await processarConfirmacaoPedido(pedido.id, result.paymentId, req);
      const pedidoAtualizado = (await db.getPedido(pedido.id)) || pedido;
      return res.json({
        status: 'approved',
        pago: true,
        pedidoId: pedido.id,
        mpPaymentId: result.paymentId,
        numeros: pedidoAtualizado.numeros || pedido.numeros,
        quantidade: pedidoAtualizado.quantidade,
        cardInfo: result.cardInfo,
        cotasPremiadas: confirmacao.cotasPremiadasEncontradas || []
      });
    }

    if (result.status === 'in_process') {
      await db.savePedido(pedido);
      return res.json({
        status: 'in_process',
        pago: false,
        pedidoId: pedido.id,
        mpPaymentId: result.paymentId,
        message: 'Pagamento em análise pelo Mercado Pago. Seus números continuam reservados.'
      });
    }

    // Caso recusado
    await db.savePedido(pedido);
    return res.status(400).json({
      error: 'Pagamento recusado pela operadora do cartão. Verifique os dados ou utilize outro cartão/método.',
      statusDetail: result.statusDetail,
      status: result.status,
      pedidoId: pedido.id
    });
  } catch (err: any) {
    console.error('Erro ao processar cartão para o pedido:', err);
    return res.status(400).json({
      error: err.message || 'Erro ao processar pagamento com cartão.',
      detalhes: err.details || err.cause || null,
      isMpError: !!err.mpError,
      isTestToken: !!err.isTestToken
    });
  }
});

// Processa confirmação de pedido e dispara evento de Purchase no Meta Conversions API (Server-Side CAPI)
async function processarConfirmacaoPedido(pedidoId: string, paymentId?: string, req?: Request) {
  const confirmacao = await db.confirmarPedido(pedidoId, paymentId);
  try {
    const pedidoAtualizado = await db.getPedido(pedidoId);
    if (pedidoAtualizado) {
      const campanha = await db.getCampanhaById(pedidoAtualizado.campanhaId);
      if (campanha) {
        // Enfileirar remarketing pago se configurado e ativo
        if (campanha.remarketing && campanha.remarketing.ativo && campanha.remarketing.regraPago && campanha.remarketing.regraPago.ativo) {
          try {
            const rule = campanha.remarketing.regraPago;
            const numerosTexto = rule.enviarNumeros ? pedidoAtualizado.numeros.join(', ') : '';
            const msgTexto = (rule.mensagem || '')
              .replace(/\{nome\}/g, pedidoAtualizado.comprador.nome || 'Cliente')
              .replace(/\{campanha\}/g, campanha.titulo)
              .replace(/\{qtd\}/g, String(pedidoAtualizado.quantidade))
              .replace(/\{numeros\}/g, numerosTexto);

            const paraClean = pedidoAtualizado.comprador.whatsapp.replace(/\D/g, '');
            const ddiPara = paraClean.startsWith('55') ? paraClean : `55${paraClean}`;

            await db.enfileirarMensagem({
              ownerId: campanha.ownerId || '',
              campanhaId: campanha.id,
              pedidoId: pedidoAtualizado.id,
              para: ddiPara,
              canal: campanha.remarketing.canal || 'whatsapp',
              texto: msgTexto,
              tipo: 'pago',
              chaveIdempotencia: `${pedidoAtualizado.id}:pago`
            });
          } catch (err) {
            console.error('[Remarketing Pago] Erro ao enfileirar:', err);
          }
        }

        const ownerConfig = await db.getConfig(campanha.ownerId || '');
        const adminConfig = await db.getConfig('wheslleyaviz@gmail.com');
        
        // Se o organizador utiliza a Carteira do Sistema, credita o valor líquido com desconto automático da taxa percentual
        const metodoAtivo = ownerConfig?.metodoAtivo || (ownerConfig?.mpAccessToken ? 'mercadopago' : 'carteira');
        if (metodoAtivo === 'carteira' || ownerConfig?.carteiraConfig?.ativo) {
          let taxaPct = 5.0;

          if (adminConfig?.carteiraConfig?.taxasPersonalizadas) {
            const ownerKey = (campanha.ownerId || '').toLowerCase();
            const ownerEmailKey = (ownerConfig?.carteiraConfig?.email || '').toLowerCase();
            const custom = adminConfig.carteiraConfig.taxasPersonalizadas[ownerKey] 
                        || adminConfig.carteiraConfig.taxasPersonalizadas[ownerEmailKey];
            if (custom && custom.taxaVendaPct !== undefined) {
              taxaPct = Number(custom.taxaVendaPct);
            } else if (ownerConfig?.carteiraConfig?.taxaVendaPct !== undefined) {
              taxaPct = Number(ownerConfig.carteiraConfig.taxaVendaPct);
            } else if (adminConfig?.carteiraConfig?.taxaVendaPct !== undefined) {
              taxaPct = Number(adminConfig.carteiraConfig.taxaVendaPct);
            }
          } else if (ownerConfig?.carteiraConfig?.taxaVendaPct !== undefined) {
            taxaPct = Number(ownerConfig.carteiraConfig.taxaVendaPct);
          } else if (adminConfig?.carteiraConfig?.taxaVendaPct !== undefined) {
            taxaPct = Number(adminConfig.carteiraConfig.taxaVendaPct);
          }

          try {
            await db.creditarVendaCarteira(
              campanha.ownerId || '',
              toReais(pedidoAtualizado.valorTotal),
              taxaPct,
              pedidoAtualizado.id,
              `Venda ${pedidoAtualizado.quantidade} cotas - ${campanha.titulo}`
            );
            console.log(`[Carteira] Saldo creditado com sucesso para ${campanha.ownerId}. Pedido: ${pedidoAtualizado.id}, Taxa Aplicada: ${taxaPct}%`);
          } catch (carteiraErr) {
            console.error('[Carteira] Erro ao creditar venda:', carteiraErr);
          }
        }

        const host = req ? `${req.protocol}://${req.get('host')}` : '';
        const baseUrl = (process.env.BASE_URL || process.env.APP_URL || host).replace(/\/$/, '');
        dispararMetaCapiPurchase({
          pedido: pedidoAtualizado,
          campanha,
          config: ownerConfig,
          baseUrl
        }).catch(err => console.error('[Meta CAPI] Erro no disparo em background:', err));
      }
    }
  } catch (err) {
    console.error('[Meta CAPI] Exceção ao preparar disparo CAPI:', err);
  }
  return confirmacao;
}

// GET /api/pedidos/:id/status -> Polling de status do pedido com reconciliação no MP
app.get('/api/pedidos/:id/status', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    const { id } = req.params;
    const pedido = await db.getPedido(id);

    if (!pedido) {
      return res.status(404).json({ status: 'nao_encontrado' });
    }

    // Reconciliação se estiver pendente e tiver mpPaymentId
    if (pedido.status === 'pendente' && pedido.mpPaymentId) {
      let aprovado = false;

      if (pedido.mpPaymentId.startsWith('asaas_')) {
        const campanha = await db.getCampanhaById(pedido.campanhaId);
        const ownerConfig = campanha ? await db.getConfig(campanha.ownerId || '') : null;
        aprovado = await consultarPagamentoAsaas(pedido.mpPaymentId, ownerConfig);
      } else if (pedido.mpPaymentId.startsWith('efi_')) {
        const campanha = await db.getCampanhaById(pedido.campanhaId);
        const ownerConfig = campanha ? await db.getConfig(campanha.ownerId || '') : null;
        aprovado = await consultarPagamentoEfipay(pedido.mpPaymentId, ownerConfig);
      } else if (!pedido.mpPaymentId.startsWith('carteira_') && !pedido.mpPaymentId.startsWith('pushin_')) {
        const mpToken = await db.getMpTokenPorCampanha(pedido.campanhaId);
        const consulta = await mpService.consultarPagamento(pedido.mpPaymentId, mpToken);
        aprovado = Boolean(consulta && consulta.approved);
      }

      if (aprovado) {
        await processarConfirmacaoPedido(pedido.id, pedido.mpPaymentId, req);
        const pedidoAtualizado = (await db.getPedido(pedido.id)) || pedido;
        return res.json({
          status: 'pago',
          pagoEm: pedidoAtualizado.pagoEm || new Date().toISOString(),
          numeros: pedidoAtualizado.numeros || pedido.numeros || [],
          quantidade: pedidoAtualizado.quantidade,
          comprador: pedidoAtualizado.comprador
        });
      }
    }

    // Checar se já expirou
    if (pedido.status === 'pendente' && pedido.expiraEm && new Date(pedido.expiraEm).getTime() <= Date.now()) {
      pedido.status = 'expirado';
      await db.savePedido(pedido);
      // Libera reservas associadas a este pedido
      await db.limparReservasExpiradas();
    }

    return res.json({
      status: pedido.status,
      pagoEm: pedido.pagoEm,
      numeros: pedido.status === 'pago' ? (pedido.numeros || []) : [],
      quantidade: pedido.quantidade,
      comprador: pedido.comprador
    });
  } catch (err: any) {
    console.error('Erro ao verificar status do pedido:', err);
    return res.status(500).json({ error: 'Erro ao consultar status.' });
  }
});

// POST /api/pedidos/:id/simular-pagamento -> Facilidade para testes em ambiente de desenvolvimento/preview
// Em produção ou para pagamentos reais integrados, este endpoint é desativado por segurança.
app.post('/api/pedidos/:id/simular-pagamento', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Endpoint não disponível.' });
  }

  try {
    const { id } = req.params;
    const pedido = await db.getPedido(id);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const isMock = !pedido.mpPaymentId || pedido.mpPaymentId.startsWith('mock_') || pedido.mpPaymentId.startsWith('simulado_');
    if (!isMock) {
      return res.status(403).json({ error: 'Simulação manual permitida apenas para transações de teste/mock.' });
    }

    const { cotasPremiadasEncontradas } = await processarConfirmacaoPedido(pedido.id, 'simulado_' + Date.now(), req);
    return res.json({
      success: true,
      status: 'pago',
      cotasPremiadasEncontradas,
      numeros: pedido.numeros
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao simular aprovação.' });
  }
});

// GET /api/campanhas/:codigo/meus-numeros?whatsapp=... -> Cotas pagas por WhatsApp
app.get('/api/campanhas/:codigo/meus-numeros', async (req, res) => {
  try {
    const { codigo } = req.params;
    const whatsapp = String(req.query.whatsapp || '').trim();

    if (!whatsapp) {
      return res.status(400).json({ error: 'Informe o número do WhatsApp com DDD.' });
    }

    const campanha = await db.getCampanhaByCodigo(codigo);
    if (!campanha) {
      return res.status(404).json({ error: 'Campanha não encontrada.' });
    }

    const resultado = await db.getMeusNumeros(campanha.id, whatsapp);
    return res.json({
      campanha: {
        id: campanha.id,
        titulo: campanha.titulo,
        codigo: campanha.codigo
      },
      ...resultado
    });
  } catch (err: any) {
    console.error('Erro ao buscar meus números:', err);
    return res.status(500).json({ error: 'Erro ao carregar seus números.' });
  }
});

// POST /api/webhooks/mercadopago -> Webhook oficial com validação HMAC do Mercado Pago
app.post('/api/webhooks/mercadopago', async (req, res) => {
  try {
    console.log('Webhook Mercado Pago recebido:', JSON.stringify(req.body));

    const webhookSecret = process.env.MP_WEBHOOK_SECRET;

    // 1) Validação HMAC se o segredo estiver configurado
    if (webhookSecret) {
      const xSignature = (req.headers['x-signature'] as string) || '';
      const xRequestId = (req.headers['x-request-id'] as string) || '';
      const dataId = (req.query['data.id'] || req.body?.data?.id || '').toString().toLowerCase();

      let ts = '';
      let v1 = '';
      xSignature.split(',').forEach(part => {
        const [k, val] = part.split('=');
        if (k?.trim() === 'ts') ts = val?.trim();
        if (k?.trim() === 'v1') v1 = val?.trim();
      });

      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
      const hmac = crypto
        .createHmac('sha256', webhookSecret)
        .update(manifest)
        .digest('hex');

      if (hmac !== v1) {
        console.warn('Assinatura HMAC do webhook inválida.');
        return res.status(401).send('Assinatura inválida');
      }
    }

    // 2) Trata apenas eventos de pagamento
    const body = req.body;
    const type = body?.type || body?.topic;

    if (type !== 'payment') {
      return res.sendStatus(200);
    }

    const paymentId = body?.data?.id || body?.id;
    if (!paymentId) {
      return res.sendStatus(200);
    }

    // 3) Localiza o pedido para descobrir o organizador (e o token MP dele)
    const todosPedidos = await db.getTodosPedidos();
    let pedidoEncontrado = todosPedidos.find(p => p.mpPaymentId === String(paymentId));
    let mpToken = pedidoEncontrado ? await db.getMpTokenPorCampanha(pedidoEncontrado.campanhaId) : null;

    // 4) Busca o pagamento REAL na API do Mercado Pago (Fonte da Verdade)
    const pagamento = await mpService.consultarPagamento(String(paymentId), mpToken);
    if (!pedidoEncontrado && pagamento?.external_reference) {
      pedidoEncontrado = todosPedidos.find(p => p.id === pagamento.external_reference);
    }

    if (pagamento && pagamento.approved && pedidoEncontrado) {
      await processarConfirmacaoPedido(pedidoEncontrado.id, String(paymentId), req);
      console.log(`Pedido ${pedidoEncontrado.id} confirmado via Webhook MP!`);
    }

    return res.sendStatus(200); // Sempre 200 para evitar loops do MP
  } catch (err: any) {
    console.error('Erro no processamento do webhook MP:', err);
    return res.sendStatus(200);
  }
});

// POST /api/webhooks/asaas -> Webhook para confirmação de pagamentos Asaas
app.post('/api/webhooks/asaas', async (req, res) => {
  try {
    const body = req.body;
    const asaasTokenHeader = (req.headers['asaas-access-token'] || req.headers['access_token'] || '') as string;
    console.log('[Webhook Asaas] Recebido evento:', body?.event, 'Payment ID:', body?.payment?.id);
    const event = body?.event;
    const payment = body?.payment;
    
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const externalReference = payment?.externalReference;
      const paymentId = payment?.id;
      
      const todosPedidos = await db.getTodosPedidos();
      let pedidoEncontrado = todosPedidos.find(p => p.id === externalReference || p.mpPaymentId === `asaas_${paymentId}`);
      
      if (!pedidoEncontrado && externalReference) {
        pedidoEncontrado = (await db.getPedido(externalReference)) || undefined;
      }

      if (pedidoEncontrado) {
        // Validação de token se o organizador configurou token de webhook
        const campanha = await db.getCampanhaById(pedidoEncontrado.campanhaId);
        if (campanha && campanha.ownerId) {
          const config = await db.getConfig(campanha.ownerId);
          if (config?.asaasConfig?.webhookToken) {
            const rawWebhookToken = decryptToken(config.asaasConfig.webhookToken);
            if (rawWebhookToken && asaasTokenHeader && asaasTokenHeader !== rawWebhookToken) {
              console.warn('[Webhook Asaas] Token de autenticação do webhook inválido:', asaasTokenHeader);
              return res.status(401).json({ error: 'Token de webhook inválido.' });
            }
          }
        }

        await processarConfirmacaoPedido(pedidoEncontrado.id, `asaas_${paymentId}`, req);
        console.log(`[Webhook Asaas] Pedido ${pedidoEncontrado.id} confirmado com sucesso!`);
      }
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Webhook Asaas] Erro no processamento:', err);
    return res.status(200).json({ received: true });
  }
});

// POST /api/webhooks/pushinpay -> Webhook para confirmação de pagamentos PushinPay
app.post('/api/webhooks/pushinpay', async (req, res) => {
  try {
    const body = req.body;
    const status = body?.status;
    const externalReference = body?.external_reference;
    const id = body?.id;

    if (status === 'paid' && externalReference) {
      const pedido = await db.getPedido(externalReference);
      if (pedido) {
        await processarConfirmacaoPedido(pedido.id, `pushin_${id}`, req);
        console.log(`[Webhook PushinPay] Pedido ${pedido.id} confirmado com sucesso!`);
      }
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Webhook PushinPay] Erro no processamento:', err);
    return res.status(200).json({ received: true });
  }
});

// POST /api/webhooks/efipay -> Webhook Pix Efí Pay (Gerencianet)
app.post('/api/webhooks/efipay', async (req, res) => {
  try {
    const body = req.body;
    console.log('[Webhook Efí Pay] Notificação recebida:', JSON.stringify(body).slice(0, 300));

    // Validação inicial do webhook pela Efí Pay (manda objeto simples no cadastro)
    if (req.headers['x-dns-prefetch-control'] || (body && body.chave && !body.pix)) {
      return res.status(200).send('OK');
    }

    const pixList = body?.pix;
    if (Array.isArray(pixList) && pixList.length > 0) {
      for (const pixItem of pixList) {
        const txid = pixItem.txid;
        if (!txid) continue;

        const todosPedidos = await db.getTodosPedidos();
        const pedidoEncontrado = todosPedidos.find(p => p.mpPaymentId === `efi_${txid}` || p.id === txid);

        if (pedidoEncontrado) {
          await processarConfirmacaoPedido(pedidoEncontrado.id, `efi_${txid}`, req);
          console.log(`[Webhook Efí Pay] Pedido ${pedidoEncontrado.id} confirmado com sucesso via Webhook!`);
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Webhook Efí Pay] Erro no processamento:', err);
    return res.status(200).json({ received: true });
  }
});

// ----------------------------------------------------
// 2. ENDPOINTS DO PAINEL ADMINISTRATIVO (PROTEGIDOS)
// ----------------------------------------------------

// GET /api/admin/me -> Valida o token do organizador logado e retorna seus dados
app.get('/api/admin/me', firebaseAuthMiddleware, (req, res) => {
  return res.json({
    uid: (req as any).userId,
    email: (req as any).userEmail,
    name: (req as any).userName
  });
});

// GET /api/admin/configuracoes -> Configurações do organizador (segredos mascarados)
app.post('/api/admin/configuracoes/status-carteira', firebaseAuthMiddleware, async (req, res) => {
  const userEmail = (req as any).userEmail || '';
  if (userEmail.toLowerCase() !== 'wheslleyaviz@gmail.com') return res.status(403).json({ error: 'Acesso negado' });
  const { userId, status } = req.body;
  const config = await db.getConfig(userId);
  if (config) {
    const dados = {
      carteiraConfig: {
        ...config.carteiraConfig,
        status
      }
    };
    await db.saveConfig(userId, dados);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Usuário não encontrado' });
  }
});

app.get('/api/admin/configuracoes/todas', firebaseAuthMiddleware, async (req, res) => {
  const userEmail = (req as any).userEmail || '';
  if (userEmail.toLowerCase() !== 'wheslleyaviz@gmail.com') return res.status(403).json({ error: 'Acesso negado' });
  const todas = await db.getTodasConfiguracoes();
  const usuarios = todas.filter(t => t.config?.carteiraConfig?.nome || t.config?.carteiraConfig?.chavePix || t.config?.carteiraConfig?.status).map(t => ({
    ownerId: t.ownerId,
    carteiraConfig: t.config.carteiraConfig
  }));
  res.json({ usuarios });
});

app.get('/api/admin/configuracoes', firebaseAuthMiddleware, async (req, res) => {
  const userId = (req as any).userId;
  const userEmail = (req as any).userEmail || '';
  const isAdmin = userEmail.toLowerCase() === 'wheslleyaviz@gmail.com';

  const config = await db.getConfig(userId);
  const adminConfig = isAdmin ? config : await db.getConfig('wheslleyaviz@gmail.com');

  const baseUrl = (process.env.BASE_URL || process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const redirectUri = `${baseUrl}/api/auth/mercadopago/callback`;

  // Calcula taxas de venda e saque aplicáveis ao perfil deste organizador
  let taxaVendaAplicada = 5.0;
  let taxaSaqueAplicada = 4.50;

  if (adminConfig?.carteiraConfig?.taxasPersonalizadas) {
    const ownerKey = userId.toLowerCase();
    const ownerEmailKey = userEmail.toLowerCase();
    const custom = adminConfig.carteiraConfig.taxasPersonalizadas[ownerKey] 
                || adminConfig.carteiraConfig.taxasPersonalizadas[ownerEmailKey];
    if (custom) {
      if (custom.taxaVendaPct !== undefined) taxaVendaAplicada = Number(custom.taxaVendaPct);
      if (custom.taxaSaqueImediato !== undefined) taxaSaqueAplicada = Number(custom.taxaSaqueImediato);
    } else if (config?.carteiraConfig?.taxaVendaPct !== undefined) {
      taxaVendaAplicada = Number(config.carteiraConfig.taxaVendaPct);
    } else if (adminConfig?.carteiraConfig?.taxaVendaPct !== undefined) {
      taxaVendaAplicada = Number(adminConfig.carteiraConfig.taxaVendaPct);
    }
  } else if (config?.carteiraConfig?.taxaVendaPct !== undefined) {
    taxaVendaAplicada = Number(config.carteiraConfig.taxaVendaPct);
  } else if (adminConfig?.carteiraConfig?.taxaVendaPct !== undefined) {
    taxaVendaAplicada = Number(adminConfig.carteiraConfig.taxaVendaPct);
  }

  const painelConfig = configParaPainel(config);

  return res.json({
    ...painelConfig,
    carteiraConfig: {
      ...painelConfig.carteiraConfig,
      taxaVendaPct: taxaVendaAplicada,
      taxaSaqueImediato: taxaSaqueAplicada,
      taxasPersonalizadas: isAdmin ? adminConfig?.carteiraConfig?.taxasPersonalizadas || {} : undefined
    },
    isAdmin,
    userEmail,
    efipayConfig: isAdmin ? painelConfig.efipayConfig : undefined,
    oauthConfiguradoNoServidor: Boolean(process.env.MP_CLIENT_ID && process.env.MP_CLIENT_SECRET),
    oauthRedirectUri: redirectUri,
    mpClientIdConfigurado: Boolean(process.env.MP_CLIENT_ID)
  });
});

// POST /api/admin/usuarios/taxa -> Super Admin define taxa personalizada para um usuário específico
app.post('/api/admin/usuarios/taxa', firebaseAuthMiddleware, async (req, res) => {
  const userEmail = (req as any).userEmail || '';
  if (userEmail.toLowerCase() !== 'wheslleyaviz@gmail.com') {
    return res.status(403).json({ error: 'Apenas o Super Admin (wheslleyaviz@gmail.com) pode alterar taxas de usuários.' });
  }

  const { targetUser, taxaVendaPct, taxaSaqueImediato, observacao, remover } = req.body;
  if (!targetUser || typeof targetUser !== 'string') {
    return res.status(400).json({ error: 'Informe o e-mail ou ID do usuário.' });
  }

  const adminId = (req as any).userId;
  const adminConfig = await db.getConfig(adminId);
  const currentMap = { ...(adminConfig?.carteiraConfig?.taxasPersonalizadas || {}) };

  const targetKey = targetUser.trim().toLowerCase();

  if (remover) {
    delete currentMap[targetKey];
  } else {
    currentMap[targetKey] = {
      taxaVendaPct: taxaVendaPct !== undefined ? Number(taxaVendaPct) : 5.0,
      taxaSaqueImediato: taxaSaqueImediato !== undefined ? Number(taxaSaqueImediato) : 4.50,
      observacao: observacao || '',
      atualizadoEm: new Date().toISOString()
    };
  }

  await db.saveConfig(adminId, {
    carteiraConfig: {
      ...adminConfig?.carteiraConfig,
      taxasPersonalizadas: currentMap
    }
  });

  return res.json({ success: true, taxasPersonalizadas: currentMap });
});

// GET /api/auth/mercadopago/url -> Gera o link oficial para conexão OAuth do Mercado Pago
app.get('/api/auth/mercadopago/url', firebaseAuthMiddleware, async (req, res) => {
  const clientId = (process.env.MP_CLIENT_ID || '').trim();
  const clientSecret = (process.env.MP_CLIENT_SECRET || '').trim();
  const baseUrl = (process.env.BASE_URL || process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const redirectUri = `${baseUrl}/api/auth/mercadopago/callback`;

  if (!clientId || !clientSecret) {
    return res.status(400).json({
      configured: false,
      error: 'MP_CLIENT_ID ou MP_CLIENT_SECRET não configurados nas variáveis de ambiente do servidor.',
      redirectUri
    });
  }

  // Gera o state seguro codificando o userId do organizador
  const statePayload = {
    uid: (req as any).userId,
    email: (req as any).userEmail,
    ts: Date.now()
  };
  const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

  const authUrl = `https://auth.mercadopago.com.br/authorization?client_id=${encodeURIComponent(clientId)}&response_type=code&platform_id=mp&state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return res.json({
    configured: true,
    url: authUrl,
    redirectUri
  });
});

// GET /api/auth/mercadopago/callback -> Recebe a autorização do Mercado Pago após o organizador aprovar
app.get('/api/auth/mercadopago/callback', async (req, res) => {
  const { code, state, error: mpError, error_description } = req.query;

  if (mpError) {
    console.error('Erro retornado pelo Mercado Pago OAuth:', mpError, error_description);
    return res.redirect(`/?mp_oauth=erro&msg=${encodeURIComponent(String(error_description || mpError))}`);
  }

  if (!code || !state) {
    return res.redirect('/?mp_oauth=erro&msg=Codigo+ou+state+ausente');
  }

  try {
    // Decodifica o state para identificar o organizador
    const decoded = JSON.parse(Buffer.from(String(state), 'base64url').toString('utf-8'));
    const userId = decoded.uid;

    if (!userId) {
      throw new Error('Identificação do usuário organizador não encontrada no state.');
    }

    const clientId = (process.env.MP_CLIENT_ID || '').trim();
    const clientSecret = (process.env.MP_CLIENT_SECRET || '').trim();
    const baseUrl = (process.env.BASE_URL || process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/auth/mercadopago/callback`;

    // Troca o authorization code pelo access token permanente
    const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_secret: clientSecret,
        client_id: clientId,
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Erro na resposta do token OAuth Mercado Pago:', tokenData);
      const errMsg = tokenData.message || tokenData.error || 'Falha ao trocar código pelo token do Mercado Pago';
      return res.redirect(`/?mp_oauth=erro&msg=${encodeURIComponent(errMsg)}`);
    }

    // Salva as credenciais do organizador
    await db.saveConfig(userId, {
      mpAccessToken: tokenData.access_token,
      mpPublicKey: tokenData.public_key || null,
      mpUserId: tokenData.user_id || null,
      mpConexaoTipo: 'oauth',
      mpConectadoEm: new Date().toISOString()
    });

    console.log(`Organizador ${userId} conectou Mercado Pago com sucesso via OAuth! MP User ID: ${tokenData.user_id}`);
    return res.redirect('/?mp_oauth=sucesso');
  } catch (err: any) {
    console.error('Erro no callback OAuth Mercado Pago:', err);
    return res.redirect(`/?mp_oauth=erro&msg=${encodeURIComponent(err.message || 'Erro inesperado')}`);
  }
});

// POST /api/admin/configuracoes/desconectar -> Desconecta a conta do Mercado Pago
app.post('/api/admin/configuracoes/desconectar', firebaseAuthMiddleware, async (req, res) => {
  try {
    await db.saveConfig((req as any).userId, {
      mpAccessToken: '',
      mpPublicKey: '',
      mpUserId: null,
      mpConexaoTipo: null,
      mpConectadoEm: null
    });

    return res.json({ success: true, mpConfigurado: false });
  } catch (err: any) {
    console.error('Erro ao desconectar Mercado Pago:', err);
    return res.status(500).json({ error: 'Erro ao desconectar conta do Mercado Pago.' });
  }
});

// GET /api/auth/facebook/url -> Gera o link oficial para conexão OAuth do Facebook Ads / Login
app.get('/api/auth/facebook/url', firebaseAuthMiddleware, async (req, res) => {
  const appId = (process.env.VITE_FACEBOOK_APP_ID || process.env.FACEBOOK_APP_ID || '').trim();
  const appSecret = (process.env.FACEBOOK_APP_SECRET || '').trim();
  const baseUrl = (process.env.BASE_URL || process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const redirectUri = `${baseUrl}/api/auth/facebook/callback`;

  if (!appId || !appSecret) {
    return res.status(400).json({
      configured: false,
      error: 'VITE_FACEBOOK_APP_ID ou FACEBOOK_APP_SECRET não configurados nas variáveis de ambiente do servidor.',
      redirectUri
    });
  }

  const statePayload = {
    uid: (req as any).userId,
    email: (req as any).userEmail,
    ts: Date.now()
  };
  const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=ads_read,ads_management,business_management`;

  return res.json({
    configured: true,
    url: authUrl,
    redirectUri
  });
});

// GET /api/auth/facebook/callback -> Recebe a autorização do Facebook OAuth
app.get('/api/auth/facebook/callback', async (req, res) => {
  const { code, state, error: fbError, error_description } = req.query;

  if (fbError) {
    console.error('Erro retornado pelo Facebook OAuth:', fbError, error_description);
    return res.redirect(`/?fb_oauth=erro&msg=${encodeURIComponent(String(error_description || fbError))}`);
  }

  if (!code || !state) {
    return res.redirect('/?fb_oauth=erro&msg=Codigo+ou+state+ausente');
  }

  try {
    const decoded = JSON.parse(Buffer.from(String(state), 'base64url').toString('utf-8'));
    const userId = decoded.uid;

    if (!userId) {
      throw new Error('Identificação do usuário organizador não encontrada no state.');
    }

    const appId = (process.env.VITE_FACEBOOK_APP_ID || process.env.FACEBOOK_APP_ID || '').trim();
    const clientSecret = (process.env.FACEBOOK_APP_SECRET || '').trim();
    const baseUrl = (process.env.BASE_URL || process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/auth/facebook/callback`;

    const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${encodeURIComponent(clientSecret)}&code=${encodeURIComponent(String(code))}`);
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Erro na resposta do token OAuth Facebook:', tokenData);
      const errMsg = tokenData.error?.message || 'Falha ao trocar código pelo token do Facebook';
      return res.redirect(`/?fb_oauth=erro&msg=${encodeURIComponent(errMsg)}`);
    }

    const accessToken = tokenData.access_token;

    let adAccountId: string | null = null;
    try {
      const accountsRes = await fetch(`https://graph.facebook.com/v18.0/me/adaccounts?fields=account_id,name&access_token=${encodeURIComponent(accessToken)}`);
      const accountsData = await accountsRes.json();
      if (accountsData && Array.isArray(accountsData.data) && accountsData.data.length > 0) {
        const acc = accountsData.data[0];
        const rawId = acc.account_id || acc.id;
        adAccountId = rawId.startsWith('act_') ? rawId : `act_${rawId}`;
      }
    } catch (accErr) {
      console.warn('Não foi possível buscar contas de anúncios automaticamente no callback FB:', accErr);
    }

    await db.saveConfig(userId, {
      metaAccessToken: accessToken,
      metaAdAccountId: adAccountId || undefined,
      metaConexaoTipo: 'oauth',
      metaConectadoEm: new Date().toISOString()
    });

    console.log(`Organizador ${userId} conectou Facebook com sucesso via OAuth! Ad Account: ${adAccountId || 'Não detectada'}`);
    return res.redirect('/?fb_oauth=sucesso');
  } catch (err: any) {
    console.error('Erro no callback OAuth Facebook:', err);
    return res.redirect(`/?fb_oauth=erro&msg=${encodeURIComponent(err.message || 'Erro inesperado')}`);
  }
});

// POST /api/admin/configuracoes/desconectar-facebook -> Desconecta a conta do Facebook
app.post('/api/admin/configuracoes/desconectar-facebook', firebaseAuthMiddleware, async (req, res) => {
  try {
    await db.saveConfig((req as any).userId, {
      metaAccessToken: '',
      metaAdAccountId: '',
      metaConexaoTipo: null,
      metaConectadoEm: null
    });

    return res.json({ success: true, facebookConfigurado: false });
  } catch (err: any) {
    console.error('Erro ao desconectar Facebook:', err);
    return res.status(500).json({ error: 'Erro ao desconectar conta do Facebook.' });
  }
});

// PUT /api/admin/configuracoes -> Salva configurações (pagamento multi-gateway, marca, redes, pixel, Meta Ads)
app.put('/api/admin/configuracoes', firebaseAuthMiddleware, async (req, res) => {
  try {
    const b = req.body || {};

    // Validação do Access Token do Mercado Pago se fornecido
    if (b.mpAccessToken && !/^(APP_USR-|TEST-)/.test(String(b.mpAccessToken).trim())) {
      return res.status(400).json({
        error: 'Access Token do Mercado Pago inválido (deve começar com "APP_USR-" ou "TEST-").'
      });
    }

    const config = await db.saveConfig((req as any).userId, {
      metodoAtivo: b.metodoAtivo !== undefined ? b.metodoAtivo : undefined,
      mpAccessToken: b.mpAccessToken !== undefined ? String(b.mpAccessToken || '') : undefined,
      mpPublicKey: b.mpPublicKey !== undefined ? String(b.mpPublicKey || '') : undefined,
      mpConexaoTipo: b.mpAccessToken ? 'manual' : undefined,
      asaasConfig: b.asaasConfig !== undefined ? b.asaasConfig : undefined,
      efipayConfig: b.efipayConfig !== undefined ? b.efipayConfig : undefined,
      paggueConfig: b.paggueConfig !== undefined ? b.paggueConfig : undefined,
      pushinpayConfig: b.pushinpayConfig !== undefined ? b.pushinpayConfig : undefined,
      pay2mConfig: b.pay2mConfig !== undefined ? b.pay2mConfig : undefined,
      zettpayConfig: b.zettpayConfig !== undefined ? b.zettpayConfig : undefined,
      paggo365Config: b.paggo365Config !== undefined ? b.paggo365Config : undefined,
      cryptoConfig: b.cryptoConfig !== undefined ? b.cryptoConfig : undefined,
      carteiraConfig: b.carteiraConfig !== undefined ? b.carteiraConfig : undefined,
      metaAccessToken: b.metaAccessToken !== undefined ? String(b.metaAccessToken || '') : undefined,
      metaCapiToken: b.metaCapiToken !== undefined ? String(b.metaCapiToken || '') : undefined,
      metaAdAccountId: b.metaAdAccountId !== undefined ? String(b.metaAdAccountId || '') : undefined,
      metaPixelId: b.metaPixelId !== undefined ? String(b.metaPixelId || '') : undefined,
      notificameToken: b.notificameToken !== undefined ? String(b.notificameToken || '') : undefined,
      marca: b.marca !== undefined ? b.marca : undefined,
      redes: b.redes !== undefined ? b.redes : undefined
    });

    return res.json({ success: true, ...configParaPainel(config) });
  } catch (err: any) {
    console.error('Erro ao salvar configurações:', err);
    return res.status(500).json({ error: 'Erro ao salvar configurações.' });
  }
});

// GET /api/admin/carteira/saldo -> Saldo detalhado da Carteira do Sistema
app.get('/api/admin/carteira/saldo', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const saldo = await db.getCarteiraSaldo(userId);
    return res.json(saldo);
  } catch (err: any) {
    console.error('Erro ao consultar saldo da carteira:', err);
    return res.status(500).json({ error: 'Erro ao consultar saldo.' });
  }
});

// GET /api/admin/carteira/transacoes -> Extrato de transações da carteira
app.get('/api/admin/carteira/transacoes', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const transacoes = await db.listarTransacoesCarteira(userId);
    return res.json(transacoes);
  } catch (err: any) {
    console.error('Erro ao listar transações da carteira:', err);
    return res.status(500).json({ error: 'Erro ao carregar extrato.' });
  }
});

// GET /api/admin/carteira/saques -> Histórico de solicitações de saque
app.get('/api/admin/carteira/saques', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const saques = await db.listarSolicitacoesSaque(userId);
    return res.json(saques);
  } catch (err: any) {
    console.error('Erro ao listar solicitações de saque:', err);
    return res.status(500).json({ error: 'Erro ao carregar saques.' });
  }
});

// POST /api/admin/carteira/solicitar-saque -> Solicita saque de saldo disponível
app.post('/api/admin/carteira/solicitar-saque', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { valorSolicitado, modalidade, tipoChavePix, chavePix, bancoInfo } = req.body;

    const valor = Number(valorSolicitado);
    if (!valor || valor <= 0) {
      return res.status(400).json({ error: 'Informe um valor de saque válido maior que zero.' });
    }

    const config = await db.getConfig(userId);
    const adminConfig = await db.getConfig('wheslleyaviz@gmail.com');
    const userEmail = (req as any).userEmail || '';
    
    let taxaImediato = 4.50;
    if (adminConfig?.carteiraConfig?.taxasPersonalizadas) {
      const ownerKey = userId.toLowerCase();
      const ownerEmailKey = userEmail.toLowerCase();
      const custom = adminConfig.carteiraConfig.taxasPersonalizadas[ownerKey] 
                  || adminConfig.carteiraConfig.taxasPersonalizadas[ownerEmailKey];
      if (custom && custom.taxaSaqueImediato !== undefined) {
        taxaImediato = Number(custom.taxaSaqueImediato);
      } else if (config?.carteiraConfig?.taxaSaqueImediato !== undefined) {
        taxaImediato = Number(config.carteiraConfig.taxaSaqueImediato);
      } else if (adminConfig?.carteiraConfig?.taxaSaqueImediato !== undefined) {
        taxaImediato = Number(adminConfig.carteiraConfig.taxaSaqueImediato);
      }
    } else if (config?.carteiraConfig?.taxaSaqueImediato !== undefined) {
      taxaImediato = Number(config.carteiraConfig.taxaSaqueImediato);
    } else if (adminConfig?.carteiraConfig?.taxaSaqueImediato !== undefined) {
      taxaImediato = Number(adminConfig.carteiraConfig.taxaSaqueImediato);
    }

    const isImediato = modalidade === 'imediato';
    const taxaSaque = isImediato ? taxaImediato : 0;

    if (valor <= taxaSaque && isImediato) {
      return res.status(400).json({ error: `O valor do saque imediato deve ser superior à taxa de transferência (R$ ${taxaSaque.toFixed(2)}).` });
    }

    const valorLiquido = Number((valor - taxaSaque).toFixed(2));

    const saque = await db.solicitarSaque({
      ownerId: userId,
      valorSolicitado: valor,
      taxaSaque,
      valorLiquido,
      modalidade: isImediato ? 'imediato' : 'd_mais_um',
      tipoChavePix: tipoChavePix || 'cpf',
      chavePix: chavePix || '',
      bancoInfo: bancoInfo || undefined
    });

    return res.status(201).json({ success: true, saque });
  } catch (err: any) {
    console.error('Erro ao solicitar saque:', err);
    return res.status(400).json({ error: err.message || 'Erro ao processar solicitação de saque.' });
  }
});

// GET /api/admin/meta/insights -> Consulta Marketing API da Meta e calcula o ROAS/CPA do RifaZone
app.get('/api/admin/meta/insights', firebaseAuthMiddleware, async (req, res) => {
  try {
    const ownerId = (req as any).userId;
    const { campanhaId, adAccountId: queryAdAccountId, bmId: queryBmId } = req.query;

    const config = await db.getConfig(ownerId);
    const plainToken = decryptToken(config?.metaAccessToken) || decryptToken(config?.metaCapiToken);
    
    // Se não informou na query e não tem na config, adAccountId vira undefined
    const adAccountId = (queryAdAccountId as string) || config?.metaAdAccountId;

    if (!plainToken) {
      return res.status(400).json({
        conectado: false,
        error: 'Token da Marketing API do Meta Ads não configurado.'
      });
    }

    let metaInsights;
    try {
      if (adAccountId === 'todas') {
        let accountsToFetch = [];
        if (queryBmId && queryBmId !== 'todas') {
          // Todas as contas de UMA BM específica
          accountsToFetch = await buscarAdAccounts(plainToken, queryBmId as string);
        } else {
          // Todas as contas de TODAS as BMs
          accountsToFetch = await buscarTodasAsContasDeAnunciosDoUsuario(plainToken);
        }
        
        const ids = accountsToFetch.map((a: any) => a.id);
        if (ids.length === 0) {
          throw new Error('Nenhuma conta de anúncios encontrada para os filtros selecionados.');
        }
        metaInsights = await buscarInsightsDeVariasContas({
          metaAccessToken: plainToken,
          adAccountIds: ids
        });
      } else if (adAccountId) {
        metaInsights = await buscarInsightsMetaAds({
          metaAccessToken: plainToken,
          metaAdAccountId: adAccountId
        });
      } else {
        return res.json({
          conectado: true,
          adAccountId: null,
          error: 'Selecione uma conta de anúncios para ver os dados.'
        });
      }
    } catch (metaErr: any) {
      return res.status(500).json({ error: metaErr.message });
    }

    let pedidos: any[] = [];
    if (campanhaId && campanhaId !== 'todas') {
      pedidos = await db.getPedidosPorCampanha(String(campanhaId));
    } else {
      const campanhas = await db.getCampanhas(ownerId);
      const campanhaIds = new Set(campanhas.map(c => c.id));
      const todos = await db.getTodosPedidos();
      pedidos = todos.filter(p => campanhaIds.has(p.campanhaId));
    }

    const pedidosPagos = pedidos.filter(p => p.status === 'pago');
    const faturamento = pedidosPagos.reduce((acc, p) => acc + (p.valorTotal || 0), 0);
    const cotasVendidas = pedidosPagos.reduce((acc, p) => acc + (p.quantidade || 0), 0);

    const spend = metaInsights.spend || 0;
    const roas = spend > 0 ? (faturamento / spend) : 0;
    const cpa = pedidosPagos.length > 0 ? (spend / pedidosPagos.length) : 0;
    const lucroLiquido = faturamento - spend;
    const margemPct = faturamento > 0 ? ((lucroLiquido / faturamento) * 100) : 0;

    return res.json({
      conectado: true,
      adAccountId,
      meta: metaInsights,
      rifazone: {
        faturamento,
        pedidosPagos: pedidosPagos.length,
        cotasVendidas,
        totalPedidos: pedidos.length
      },
      indicadores: {
        roas: Number(roas.toFixed(2)),
        cpa: Number(cpa.toFixed(2)),
        lucroLiquido: Number(lucroLiquido.toFixed(2)),
        margemPct: Number(margemPct.toFixed(1))
      }
    });
  } catch (err: any) {
    console.error('Erro ao consultar Marketing API do Meta:', err);
    return res.status(500).json({
      conectado: false,
      error: err.message || 'Erro ao comunicar com a Marketing API da Meta.'
    });
  }
});

// GET /api/admin/meta/bms -> Lista Business Managers do usuário
app.get('/api/admin/meta/bms', firebaseAuthMiddleware, async (req, res) => {
  try {
    const ownerId = (req as any).userId;
    const config = await db.getConfig(ownerId);
    const plainToken = decryptToken(config?.metaAccessToken) || decryptToken(config?.metaCapiToken);

    if (!plainToken) {
      return res.status(400).json({ error: 'Token do Facebook não configurado.' });
    }

    const bms = await buscarBusinessManagers(plainToken);
    return res.json(bms);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/meta/adaccounts -> Lista Contas de Anúncios (pode filtrar por businessId)
app.get('/api/admin/meta/adaccounts', firebaseAuthMiddleware, async (req, res) => {
  try {
    const ownerId = (req as any).userId;
    const { businessId } = req.query;
    const config = await db.getConfig(ownerId);
    const plainToken = decryptToken(config?.metaAccessToken) || decryptToken(config?.metaCapiToken);

    if (!plainToken) {
      return res.status(400).json({ error: 'Token do Facebook não configurado.' });
    }

    const accounts = await buscarAdAccounts(plainToken, businessId as string);
    return res.json(accounts);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/meta/selecionar-conta -> Salva a conta de anúncios selecionada nas configurações
app.post('/api/admin/meta/selecionar-conta', firebaseAuthMiddleware, async (req, res) => {
  try {
    const ownerId = (req as any).userId;
    const { adAccountId } = req.body;

    if (!adAccountId) {
      return res.status(400).json({ error: 'ID da conta não fornecido.' });
    }

    await db.saveConfig(ownerId, {
      metaAdAccountId: adAccountId
    });

    return res.json({ success: true, adAccountId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/ia/gerar-campanha -> Gera conteúdo de campanha com IA (Gemini)
app.post('/api/admin/ia/gerar-campanha', firebaseAuthMiddleware, async (req, res) => {
  try {
    const { premio, valorCota, totalCotas, publico, tom } = req.body || {};

    if (!premio || !String(premio).trim()) {
      return res.status(400).json({ error: 'Descreva o prêmio principal para a IA gerar a campanha.' });
    }

    const resultado = await geminiService.gerarCampanha({
      premio: String(premio).trim(),
      valorCota: valorCota !== undefined ? Number(valorCota) : undefined,
      totalCotas: totalCotas !== undefined ? Number(totalCotas) : undefined,
      publico: publico ? String(publico).trim() : undefined,
      tom: tom ? String(tom).trim() : undefined
    });

    return res.json(resultado);
  } catch (err: any) {
    console.error('Erro ao gerar campanha com IA:', err);
    return res.status(500).json({ error: err.message || 'Erro ao gerar campanha com IA.' });
  }
});

// GET /api/admin/campanhas -> Apenas as campanhas do organizador logado
app.get('/api/admin/campanhas', firebaseAuthMiddleware, async (req, res) => {
  const campanhas = await db.getCampanhas((req as any).userId);
  const comEstatisticas = await Promise.all(campanhas.map(async c => {
    const stats = await db.getEstatisticasCampanha(c.id, c.totalCotas);
    return {
      ...formatarCampanhaParaEnvio(c),
      estatisticas: {
        ...stats,
        arrecadado: toReais(stats.vendidas * c.valorCota)
      }
    };
  }));
  return res.json(comEstatisticas);
});

// POST /api/admin/campanhas -> Criar campanha (vinculada ao organizador logado)
app.post('/api/admin/campanhas', firebaseAuthMiddleware, async (req, res) => {
  try {
    const data: Partial<Campanha> = req.body;

    if (!data.titulo || !data.totalCotas || data.valorCota === undefined) {
      return res.status(400).json({ error: 'Título, total de cotas e valor da cota são obrigatórios.' });
    }

    // Gera código único se não informado
    let codigo = (data.codigo || '').toLowerCase().trim().replace(/[^a-z0-9-_]/g, '');
    if (!codigo) {
      codigo = data.titulo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 30);
    }

    // Garantir código único
    let finalCodigo = codigo;
    let contador = 1;
    while (await db.getCampanhaByCodigo(finalCodigo)) {
      finalCodigo = `${codigo}-${contador++}`;
    }

    const novaCampanha = sanitizarCampanha(
      { ...data, codigo: finalCodigo },
      null,
      (req as any).userId,
      (req as any).userEmail || null
    );

    const salva = await db.saveCampanha(novaCampanha);
    return res.status(201).json(formatarCampanhaParaEnvio(salva));
  } catch (err: any) {
    console.error('Erro ao criar campanha:', err);
    return res.status(500).json({ error: 'Erro ao salvar nova campanha.' });
  }
});

// PUT /api/admin/campanhas/:id -> Editar campanha (somente o dono, preservando e sanitizando todos os campos)
app.put('/api/admin/campanhas/:id', firebaseAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const existente = await db.getCampanhaById(id);

    if (!existente) {
      return res.status(404).json({ error: 'Campanha não encontrada.' });
    }

    const userId = (req as any).userId;
    if (existente.ownerId && existente.ownerId !== userId) {
      return res.status(403).json({ error: 'Você não tem permissão para editar esta campanha.' });
    }

    const data = req.body;
    const atualizada = sanitizarCampanha(
      data,
      existente,
      existente.ownerId || userId,
      existente.ownerEmail || (req as any).userEmail || null
    );

    const salva = await db.saveCampanha(atualizada);
    return res.json(formatarCampanhaParaEnvio(salva));
  } catch (err: any) {
    console.error('Erro ao atualizar campanha:', err);
    return res.status(500).json({ 
      error: err?.message || 'Erro ao atualizar campanha.',
      detalhes: err?.stack || String(err)
    });
  }
});

// PUT /api/admin/campanhas/:id/meta-link -> Associa uma campanha do RifaZone a uma Campanha do Meta Ads
app.put('/api/admin/campanhas/:id/meta-link', firebaseAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { metaCampaignId } = req.body;
    
    const existente = await db.getCampanhaById(id);
    if (!existente) {
      return res.status(404).json({ error: 'Campanha não encontrada.' });
    }
    if (existente.ownerId !== (req as any).userId) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    existente.metaCampaignId = metaCampaignId || null;
    existente.atualizadaEm = new Date().toISOString();
    
    await db.saveCampanha(existente);
    return res.json({ success: true, metaCampaignId: existente.metaCampaignId });
  } catch (err) {
    console.error('Erro ao vincular Meta Campaign:', err);
    return res.status(500).json({ error: 'Erro ao vincular campanha do Meta.' });
  }
});

// DELETE /api/admin/campanhas/:id (somente o dono)
app.delete('/api/admin/campanhas/:id', firebaseAuthMiddleware, async (req, res) => {
  const { id } = req.params;
  const existente = await db.getCampanhaById(id);
  if (!existente) {
    return res.status(404).json({ error: 'Campanha não encontrada.' });
  }
  if (existente.ownerId !== (req as any).userId) {
    return res.status(403).json({ error: 'Você não tem permissão para excluir esta campanha.' });
  }
  const deleted = await db.deleteCampanha(id);
  return res.json({ success: deleted });
});

// GET /api/admin/estilos -> Lista estilos de tema salvos pelo organizador
app.get('/api/admin/estilos', firebaseAuthMiddleware, async (req, res) => {
  try {
    const estilos = await db.listarEstilos((req as any).userId);
    return res.json(estilos);
  } catch (err: any) {
    console.error('Erro ao listar estilos:', err);
    return res.status(500).json({ error: 'Erro ao listar estilos salvos.' });
  }
});

// POST /api/admin/estilos -> Salva um novo estilo de tema para o organizador
app.post('/api/admin/estilos', firebaseAuthMiddleware, async (req, res) => {
  try {
    const { nome, tema } = req.body || {};
    if (!nome || !String(nome).trim()) {
      return res.status(400).json({ error: 'Nome do estilo é obrigatório.' });
    }
    if (!tema || !tema.cores || !tema.botao || !tema.tipografia || !tema.layout) {
      return res.status(400).json({ error: 'Configurações do tema inválidas.' });
    }

    const estiloSalvo = await db.salvarEstilo((req as any).userId, {
      nome: String(nome).trim(),
      tema
    });
    return res.status(201).json(estiloSalvo);
  } catch (err: any) {
    console.error('Erro ao salvar estilo:', err);
    return res.status(500).json({ error: 'Erro ao salvar estilo.' });
  }
});

// DELETE /api/admin/estilos/:id -> Exclui um estilo de tema salvo
app.delete('/api/admin/estilos/:id', firebaseAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.excluirEstilo((req as any).userId, id);
    if (!deleted) {
      return res.status(404).json({ error: 'Estilo não encontrado ou não autorizado.' });
    }
    return res.json({ success: true });
  } catch (err: any) {
    console.error('Erro ao excluir estilo:', err);
    return res.status(500).json({ error: 'Erro ao excluir estilo.' });
  }
});

// GET /api/admin/checkouts -> Lista modelos de checkout salvos pelo organizador
app.get('/api/admin/checkouts', firebaseAuthMiddleware, async (req, res) => {
  try {
    const checkouts = await db.listarCheckouts((req as any).userId);
    return res.json(checkouts);
  } catch (err: any) {
    console.error('Erro ao listar checkouts:', err);
    return res.status(500).json({ error: 'Erro ao listar checkouts salvos.' });
  }
});

// POST /api/admin/checkouts -> Salva um modelo de checkout para o organizador
app.post('/api/admin/checkouts', firebaseAuthMiddleware, async (req, res) => {
  try {
    const { id, nome, checkout } = req.body || {};
    if (!nome || !String(nome).trim()) {
      return res.status(400).json({ error: 'Nome do checkout é obrigatório.' });
    }
    if (!checkout || !checkout.metodos) {
      return res.status(400).json({ error: 'Configurações do checkout inválidas.' });
    }

    const itemSalvo = await db.salvarCheckout((req as any).userId, {
      id: id ? String(id) : undefined,
      nome: String(nome).trim(),
      checkout
    });
    return res.status(201).json(itemSalvo);
  } catch (err: any) {
    console.error('Erro ao salvar checkout:', err);
    return res.status(500).json({ error: 'Erro ao salvar checkout.' });
  }
});

// DELETE /api/admin/checkouts/:id -> Exclui um modelo de checkout salvo
app.delete('/api/admin/checkouts/:id', firebaseAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.excluirCheckout((req as any).userId, id);
    if (!deleted) {
      return res.status(404).json({ error: 'Checkout não encontrado ou não autorizado.' });
    }
    return res.json({ success: true });
  } catch (err: any) {
    console.error('Erro ao excluir checkout:', err);
    return res.status(500).json({ error: 'Erro ao excluir checkout.' });
  }
});

// GET /api/admin/pedidos -> Lista todos os pedidos das campanhas do organizador
app.get('/api/admin/pedidos', firebaseAuthMiddleware, async (req, res) => {
  try {
    const campanhas = await db.getCampanhas((req as any).userId);
    const campanhaIds = new Set(campanhas.map(c => c.id));
    const todosPedidos = await db.getTodosPedidos();
    const meusPedidos = todosPedidos.filter(p => campanhaIds.has(p.campanhaId));
    return res.json(meusPedidos.map(formatarPedidoParaEnvio));
  } catch (err: any) {
    console.error('Erro ao buscar pedidos do organizador:', err);
    return res.status(500).json({ error: 'Erro ao buscar pedidos.' });
  }
});

// GET /api/admin/fila-mensagens -> Retorna todas as mensagens da fila para o painel admin (filtrado por organizador)
app.get('/api/admin/fila-mensagens', firebaseAuthMiddleware, async (req, res) => {
  try {
    const campanhas = await db.getCampanhas((req as any).userId);
    const campanhaIds = new Set(campanhas.map(c => c.id));
    
    const todas = await db.listarTodasMensagensFila();
    const minhasMensagens = todas.filter(m => campanhaIds.has(m.campanhaId));
    
    return res.json(minhasMensagens);
  } catch (err: any) {
    console.error('Erro ao listar fila de mensagens para admin:', err);
    return res.status(500).json({ error: 'Erro ao buscar fila de mensagens.' });
  }
});

// POST /api/admin/fila-mensagens/limpar -> Cancela todas as mensagens pendentes da fila do organizador
app.post('/api/admin/fila-mensagens/limpar', firebaseAuthMiddleware, async (req, res) => {
  try {
    const campanhas = await db.getCampanhas((req as any).userId);
    const campanhaIds = new Set(campanhas.map(c => c.id));
    
    const todas = await db.listarTodasMensagensFila();
    const minhasMensagens = todas.filter(m => campanhaIds.has(m.campanhaId));
    
    let canceladas = 0;
    for (const msg of minhasMensagens) {
      if (msg.status === 'pendente' || msg.status === 'erro') {
        await db.marcarStatusMensagem(msg.id, 'cancelada', 'Cancelada pelo administrador');
        canceladas++;
      }
    }
    
    return res.json({ success: true, count: canceladas });
  } catch (err: any) {
    console.error('Erro ao limpar fila de mensagens para admin:', err);
    return res.status(500).json({ error: 'Erro ao limpar fila.' });
  }
});

// ============================================================================
// --- Endpoints de Integração com o WhatsApp Worker Externo ---
// ============================================================================

// Middleware para verificar CRON_SECRET nos endpoints do cron/tarefas
function verificarCronSecret(req: Request, res: Response, next: NextFunction) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !cronSecret.trim()) {
    return res.status(503).json({ error: 'CRON_SECRET não configurado' });
  }

  const cronSecretVal = cronSecret.trim();
  const secretRecebido = (
    (req.headers['x-cron-secret'] as string) ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null) ||
    (req.query.secret as string) ||
    ''
  ).trim();

  if (!secretRecebido || secretRecebido !== cronSecretVal) {
    return res.status(401).json({ error: 'Não autorizado. Chave secreta inválida.' });
  }
  next();
}

// Middleware para verificar WORKER_SECRET nos endpoints do worker de WhatsApp
function verificarWorkerSecret(req: Request, res: Response, next: NextFunction) {
  const workerSecret = process.env.WORKER_SECRET;
  if (!workerSecret || !workerSecret.trim()) {
    return res.status(503).json({ error: 'WORKER_SECRET não configurado' });
  }

  const workerSecretVal = workerSecret.trim();
  const secretRecebido = (
    (req.headers['x-worker-secret'] as string) ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null) ||
    (req.query.secret as string) ||
    ''
  ).trim();

  if (!secretRecebido || secretRecebido !== workerSecretVal) {
    return res.status(401).json({ error: 'Não autorizado. Chave secreta de worker inválida.' });
  }
  next();
}

// GET /api/worker/fila?limit=10 -> Busca mensagens pendentes de WhatsApp para o worker
app.get('/api/worker/fila', verificarWorkerSecret, async (req, res) => {
  try {
    const limitNum = Number(req.query.limit) || 10;
    const pendentes = await db.listarFilaPendente(limitNum);
    
    // Retorna apenas mensagens destinadas ao WhatsApp (canal 'whatsapp' ou 'ambos')
    const whatsPendentes = pendentes.filter(m => m.canal === 'whatsapp' || m.canal === 'ambos');
    
    return res.json(whatsPendentes);
  } catch (err: any) {
    console.error('Erro ao buscar fila para o worker:', err);
    return res.status(500).json({ error: 'Erro ao buscar mensagens.' });
  }
});

// POST /api/worker/fila/:id/status -> Atualiza o status da mensagem após envio
app.post('/api/worker/fila/:id/status', verificarWorkerSecret, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, erro } = req.body;
    
    if (!['enviada', 'erro'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido para atualização pelo worker.' });
    }
    
    const atualizada = await db.marcarStatusMensagem(id, status, erro);
    return res.json({ success: true, mensagem: atualizada });
  } catch (err: any) {
    console.error('Erro ao atualizar status da mensagem do worker:', err);
    return res.status(500).json({ error: 'Erro ao atualizar status.' });
  }
});

// POST /api/worker/status -> Permite ao worker notificar o status do WhatsApp Web
app.post('/api/worker/status', verificarWorkerSecret, async (req, res) => {
  try {
    const { conectado, numero } = req.body;
    globalWorkerStatus = {
      conectado: Boolean(conectado),
      numero: numero || undefined,
      atualizadoEm: new Date().toISOString()
    };
    return res.json({ success: true, status: globalWorkerStatus });
  } catch (err: any) {
    console.error('Erro ao registrar status do worker:', err);
    return res.status(500).json({ error: 'Erro ao registrar status.' });
  }
});

// GET /api/admin/worker/status -> Retorna o status atual do worker para o admin
app.get('/api/admin/worker/status', firebaseAuthMiddleware, async (req, res) => {
  return res.json(globalWorkerStatus);
});

// GET /api/admin/campanhas/:id/pedidos -> Lista pedidos e compradores (somente o dono)
app.get('/api/admin/campanhas/:id/pedidos', firebaseAuthMiddleware, async (req, res) => {
  const { id } = req.params;
  const existente = await db.getCampanhaById(id);
  if (!existente) {
    return res.status(404).json({ error: 'Campanha não encontrada.' });
  }
  if (existente.ownerId !== (req as any).userId) {
    return res.status(403).json({ error: 'Você não tem permissão para ver os pedidos desta campanha.' });
  }
  const pedidos = await db.getPedidosPorCampanha(id);
  return res.json(pedidos);
});

// POST /api/admin/campanhas/:id/sortear -> Apuração e definição do ganhador (somente o dono)
app.post('/api/admin/campanhas/:id/sortear', firebaseAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { numeroSorteado } = req.body;

    if (!numeroSorteado) {
      return res.status(400).json({ error: 'Informe o número sorteado.' });
    }

    const existente = await db.getCampanhaById(id);
    if (!existente) {
      return res.status(404).json({ error: 'Campanha não encontrada.' });
    }
    if (existente.ownerId !== (req as any).userId) {
      return res.status(403).json({ error: 'Você não tem permissão para apurar esta campanha.' });
    }

    const resultado = await db.realizarSorteio(id, String(numeroSorteado).trim());
    return res.json(resultado);
  } catch (err: any) {
    console.error('Erro ao realizar apuração:', err);
    return res.status(500).json({ error: err.message || 'Erro ao realizar apuração.' });
  }
});

// POST /api/admin/limpar-reservas -> Limpa reservas vencidas manualmente pelo painel
app.post('/api/admin/limpar-reservas', firebaseAuthMiddleware, async (_req, res) => {
  const resultado = await db.limparReservasExpiradas();
  const cotasLiberadas = typeof resultado === 'number' ? resultado : resultado.cotasLiberadas;
  const pedidosExpirados = typeof resultado === 'number' ? 0 : resultado.pedidosExpirados;
  return res.json({ success: true, cotasLiberadas, pedidosExpirados });
});

// POST /api/tarefas/expirar-pedidos -> Expiração ativa de pedidos e liberação de cotas (CRON / Cloud Scheduler)
app.post('/api/tarefas/expirar-pedidos', verificarCronSecret, async (req, res) => {
  try {
    const resultado = await db.limparReservasExpiradas();
    const cotasLiberadas = typeof resultado === 'number' ? resultado : resultado.cotasLiberadas;
    const pedidosExpirados = typeof resultado === 'number' ? 0 : resultado.pedidosExpirados;

    return res.json({
      success: true,
      pedidosExpirados,
      cotasLiberadas,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Erro no endpoint de expiração ativa de pedidos:', err);
    return res.status(500).json({ error: 'Erro ao processar expiração de pedidos.' });
  }
});

// POST /api/pedidos/validar-cupom -> Valida um código de cupom de desconto para uma campanha
app.post('/api/pedidos/validar-cupom', async (req, res) => {
  try {
    const { campanhaId, cupom } = req.body;
    if (!campanhaId || !cupom) {
      return res.status(400).json({ valido: false, error: 'Informe a campanha e o código do cupom.' });
    }

    const campanha = await db.getCampanhaById(campanhaId);
    if (!campanha) {
      return res.status(404).json({ valido: false, error: 'Campanha não encontrada.' });
    }

    const cupomUpper = String(cupom).trim().toUpperCase();
    let descontoPct = 0;

    if (Array.isArray(campanha.cupons)) {
      const cMatch = campanha.cupons.find(c => c.codigo.toUpperCase() === cupomUpper && c.ativo !== false);
      if (cMatch) descontoPct = cMatch.descontoPct;
    }

    if (!descontoPct && campanha.remarketing?.expirado) {
      const rMatch = campanha.remarketing.expirado.find(r => r.cupom && r.cupom.toUpperCase() === cupomUpper);
      if (rMatch && rMatch.descontoPct) descontoPct = rMatch.descontoPct;
    }

    if (descontoPct > 0) {
      return res.json({
        valido: true,
        codigo: cupomUpper,
        descontoPct,
        mensagem: `Cupom ${cupomUpper} ativado! ${descontoPct}% de desconto aplicado.`
      });
    }

    return res.status(400).json({ valido: false, error: 'Cupom de desconto inválido ou não ativo.' });
  } catch (err: any) {
    return res.status(500).json({ valido: false, error: 'Erro ao validar cupom.' });
  }
});

// POST /api/tarefas/remarketing -> Motor de enfileiramento de remarketing (padrão outbox)
app.post('/api/tarefas/remarketing', verificarCronSecret, async (req, res) => {
  try {
    const campanhas = await db.getCampanhas();
    const campanhasAtivas = campanhas.filter(c => c.remarketing && c.remarketing.ativo);

    if (campanhasAtivas.length === 0) {
      return res.json({
        success: true,
        enfileirados: 0,
        mensagem: 'Nenhuma campanha com remarketing ativo no momento.',
        timestamp: new Date().toISOString()
      });
    }

    const todosPedidos = await db.getTodosPedidos();
    const agoraMs = Date.now();
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;

    let totalEnfileirados = 0;
    const detalhes: any[] = [];

    for (const campanha of campanhasAtivas) {
      const configRem = campanha.remarketing!;
      
      // Se "somente se campanha ativa" for verdadeiro, ignoramos se a campanha não estiver publicada
      if (configRem.somenteSeCampanhaAtiva && campanha.status !== 'publicada') {
        continue;
      }

      const regrasNaoPagou = configRem.regrasNaoPagou || [];
      if (regrasNaoPagou.length === 0) continue;

      const pedidosCampanha = todosPedidos.filter(p => p.campanhaId === campanha.id);

      for (const p of pedidosCampanha) {
        if (!p.comprador) continue;
        const jaEnviados = new Set(p.remarketingEnviado || []);
        let mudouPedido = false;

        const expiraMs = new Date(p.expiraEm).getTime();

        // 1. Regras para pedidos pendentes (faltandoMin)
        if (p.status === 'pendente') {
          const faltaMinutos = Math.max(0, Math.ceil((expiraMs - agoraMs) / (60 * 1000)));

          for (const regra of regrasNaoPagou) {
            if (regra.faltandoMin === undefined) continue;

            const ruleKey = `faltando_${regra.faltandoMin}`;
            if (jaEnviados.has(ruleKey)) continue;

            // Dispara quando falta X minutos ou menos para expirar
            if (faltaMinutos <= regra.faltandoMin && faltaMinutos > 0) {
              const cupomParam = regra.cupom ? `&cupom=${encodeURIComponent(regra.cupom)}` : '';
              const link = `${baseUrl}/c/${campanha.codigo}?pedido=${p.id}${cupomParam}`;
              const msgTexto = (regra.mensagem || '')
                .replace(/\{nome\}/g, p.comprador.nome || 'Cliente')
                .replace(/\{campanha\}/g, campanha.titulo)
                .replace(/\{link\}/g, link)
                .replace(/\{cupom\}/g, regra.cupom || '')
                .replace(/\{minutos\}/g, String(faltaMinutos))
                .replace(/\{numeros\}/g, p.numeros.join(', '));

              const paraClean = p.comprador.whatsapp.replace(/\D/g, '');
              const ddiPara = paraClean.startsWith('55') ? paraClean : `55${paraClean}`;

              await db.enfileirarMensagem({
                ownerId: campanha.ownerId || '',
                campanhaId: campanha.id,
                pedidoId: p.id,
                para: ddiPara,
                canal: configRem.canal || 'whatsapp',
                texto: msgTexto,
                tipo: 'nao_pagou',
                chaveIdempotencia: `${p.id}:${ruleKey}`
              }).catch(err => console.error('[Fila Remarketing] Erro ao enfileirar:', err));

              jaEnviados.add(ruleKey);
              p.remarketingEnviado = Array.from(jaEnviados);
              mudouPedido = true;
              totalEnfileirados++;

              detalhes.push({
                pedidoId: p.id,
                comprador: p.comprador.nome,
                tipo: 'faltandoMin',
                regra: ruleKey,
                faltaMinutos
              });
            }
          }
        }

        // 2. Regras para pedidos expirados (aposExpirarMin)
        if (p.status === 'expirado') {
          const aposMinutos = Math.max(0, Math.floor((agoraMs - expiraMs) / (60 * 1000)));

          for (const regra of regrasNaoPagou) {
            if (regra.aposExpirarMin === undefined) continue;

            const ruleKey = `apos_${regra.aposExpirarMin}`;
            if (jaEnviados.has(ruleKey)) continue;

            // Dispara X minutos ou mais após expirar
            if (aposMinutos >= regra.aposExpirarMin) {
              const cupomParam = regra.cupom ? `&cupom=${encodeURIComponent(regra.cupom)}` : '';
              const link = `${baseUrl}/c/${campanha.codigo}?pedido=${p.id}${cupomParam}`;
              const msgTexto = (regra.mensagem || '')
                .replace(/\{nome\}/g, p.comprador.nome || 'Cliente')
                .replace(/\{campanha\}/g, campanha.titulo)
                .replace(/\{link\}/g, link)
                .replace(/\{cupom\}/g, regra.cupom || '')
                .replace(/\{minutos\}/g, String(aposMinutos))
                .replace(/\{numeros\}/g, p.numeros.join(', '));

              const paraClean = p.comprador.whatsapp.replace(/\D/g, '');
              const ddiPara = paraClean.startsWith('55') ? paraClean : `55${paraClean}`;

              await db.enfileirarMensagem({
                ownerId: campanha.ownerId || '',
                campanhaId: campanha.id,
                pedidoId: p.id,
                para: ddiPara,
                canal: configRem.canal || 'whatsapp',
                texto: msgTexto,
                tipo: 'nao_pagou',
                chaveIdempotencia: `${p.id}:${ruleKey}`
              }).catch(err => console.error('[Fila Remarketing] Erro ao enfileirar:', err));

              jaEnviados.add(ruleKey);
              p.remarketingEnviado = Array.from(jaEnviados);
              mudouPedido = true;
              totalEnfileirados++;

              detalhes.push({
                pedidoId: p.id,
                comprador: p.comprador.nome,
                tipo: 'aposExpirarMin',
                regra: ruleKey,
                aposMinutos
              });
            }
          }
        }

        if (mudouPedido) {
          await db.savePedido(p);
        }
      }
    }

    return res.json({
      success: true,
      enfileirados: totalEnfileirados,
      detalhes,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Erro no motor de enfileiramento de remarketing:', err);
    return res.status(500).json({ error: 'Erro ao processar fila de remarketing.' });
  }
});

// POST /api/tarefas/processar-fila -> Envia as mensagens pendentes da fila (outbox)
app.post('/api/tarefas/processar-fila', verificarCronSecret, async (req, res) => {
  try {
    const pendentes = await db.listarFilaPendente(20);
    if (pendentes.length === 0) {
      return res.json({
        success: true,
        processados: 0,
        mensagem: 'Nenhuma mensagem pendente na fila.',
        timestamp: new Date().toISOString()
      });
    }

    let totalSucesso = 0;
    let totalErro = 0;
    const detalhes: any[] = [];

    for (const msg of pendentes) {
      if (msg.status !== 'pendente') continue;

      const config = await db.getConfig(msg.ownerId);
      const rawToken = config?.notificameToken || process.env.NOTIFICAME_API_TOKEN;
      const token = rawToken ? decryptToken(rawToken) : null;

      const canal = msg.canal || 'whatsapp';

      // Simula envio em desenvolvimento/preview se não houver credencial configurada
      if (!token && process.env.NODE_ENV !== 'production') {
        await db.marcarStatusMensagem(msg.id, 'enviada');
        totalSucesso++;
        detalhes.push({ id: msg.id, para: msg.para, status: 'simulado' });
        continue;
      }

      if (!token) {
        await db.marcarStatusMensagem(msg.id, 'erro', 'Token do Notificame não configurado nas configurações do organizador.');
        totalErro++;
        detalhes.push({ id: msg.id, para: msg.para, status: 'erro', erro: 'Token não configurado' });
        continue;
      }

      let sucessoWhatsapp = true;
      let erroWhatsapp = '';
      let sucessoEmail = true;
      let erroEmail = '';

      if (canal === 'whatsapp' || canal === 'ambos') {
        try {
          const response = await fetch('https://api.notificame.com.br/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': token,
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              to: msg.para,
              number: msg.para,
              message: msg.texto,
              body: msg.texto,
              type: 'text'
            })
          });

          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            sucessoWhatsapp = false;
            const msgErro = data.message || data.error || `HTTP ${response.status}`;
            if (response.status === 402 || String(msgErro).toLowerCase().includes('saldo') || String(msgErro).toLowerCase().includes('balance') || String(msgErro).toLowerCase().includes('credit')) {
              erroWhatsapp = `Falta de Saldo: ${msgErro}`;
            } else {
              erroWhatsapp = `Erro API Notificame: ${msgErro}`;
            }
          }
        } catch (err: any) {
          sucessoWhatsapp = false;
          erroWhatsapp = `Conexão falhou: ${err.message || err}`;
        }
      }

      if (canal === 'email' || canal === 'ambos') {
        try {
          const pedido = await db.getPedido(msg.pedidoId);
          if (pedido && pedido.comprador && pedido.comprador.email) {
            const emailNotificador = new EmailNotificador();
            const resEmail = await emailNotificador.enviarEmail({
              destinatarioEmail: pedido.comprador.email,
              destinatarioTelefone: pedido.comprador.whatsapp,
              nomeComprador: pedido.comprador.nome,
              tituloCampanha: 'RifaZone',
              mensagemTexto: msg.texto
            });
            if (!resEmail.sucesso) {
              sucessoEmail = false;
              erroEmail = resEmail.erro || 'Falha no envio do e-mail';
            }
          } else {
            sucessoEmail = false;
            erroEmail = 'Comprador sem e-mail válido';
          }
        } catch (err: any) {
          sucessoEmail = false;
          erroEmail = `Erro e-mail: ${err.message || err}`;
        }
      }

      if (canal === 'ambos') {
        if (sucessoWhatsapp && sucessoEmail) {
          await db.marcarStatusMensagem(msg.id, 'enviada');
          totalSucesso++;
          detalhes.push({ id: msg.id, para: msg.para, status: 'enviada' });
        } else {
          const errCombined = `WhatsApp: ${sucessoWhatsapp ? 'OK' : erroWhatsapp} | E-mail: ${sucessoEmail ? 'OK' : erroEmail}`;
          await db.marcarStatusMensagem(msg.id, 'erro', errCombined);
          totalErro++;
          detalhes.push({ id: msg.id, para: msg.para, status: 'erro', erro: errCombined });
        }
      } else if (canal === 'whatsapp') {
        if (sucessoWhatsapp) {
          await db.marcarStatusMensagem(msg.id, 'enviada');
          totalSucesso++;
          detalhes.push({ id: msg.id, para: msg.para, status: 'enviada' });
        } else {
          await db.marcarStatusMensagem(msg.id, 'erro', erroWhatsapp);
          totalErro++;
          detalhes.push({ id: msg.id, para: msg.para, status: 'erro', erro: erroWhatsapp });
        }
      } else {
        if (sucessoEmail) {
          await db.marcarStatusMensagem(msg.id, 'enviada');
          totalSucesso++;
          detalhes.push({ id: msg.id, para: msg.para, status: 'enviada' });
        } else {
          await db.marcarStatusMensagem(msg.id, 'erro', erroEmail);
          totalErro++;
          detalhes.push({ id: msg.id, para: msg.para, status: 'erro', erro: erroEmail });
        }
      }
    }

    return res.json({
      success: true,
      processados: pendentes.length,
      sucesso: totalSucesso,
      erro: totalErro,
      detalhes,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Erro ao processar fila de outbox:', err);
    return res.status(500).json({ error: 'Erro ao processar fila de outbox.' });
  }
});

// ----------------------------------------------------
// 3. VITE MIDDLEWARE & BOOTSTRAP
// ----------------------------------------------------
async function startServer() {
  // Verificações de segurança no Boot
  if (!process.env.CRON_SECRET || !process.env.CRON_SECRET.trim()) {
    console.error('\x1b[31m%s\x1b[0m', '[ERRO CRÍTICO NO BOOT] CRON_SECRET não configurado!');
    console.error('As rotas /api/tarefas/* retornarão status 503 até que o CRON_SECRET seja definido no ambiente.');
  }
  if (!process.env.WORKER_SECRET || !process.env.WORKER_SECRET.trim()) {
    console.error('\x1b[31m%s\x1b[0m', '[ERRO CRÍTICO NO BOOT] WORKER_SECRET não configurado!');
    console.error('As rotas /api/worker/* retornarão status 503 até que o WORKER_SECRET seja definido no ambiente.');
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Limpeza automática e periódica de pedidos e reservas expiradas (a cada 30s)
  setInterval(async () => {
    try {
      const res = await db.limparReservasExpiradas();
      const cotas = typeof res === 'object' && res !== null ? res.cotasLiberadas : 0;
      const pedidos = typeof res === 'object' && res !== null ? res.pedidosExpirados : (typeof res === 'number' ? res : 0);
      if (cotas > 0 || pedidos > 0) {
        console.log(`[EXPIRAÇÃO AUTOMÁTICA] Limpeza executada: ${pedidos} pedidos expirados, ${cotas} cotas liberadas.`);
      }
    } catch (e) {
      // silencioso
    }
  }, 30 * 1000);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Servidor RifaZone rodando com sucesso em http://0.0.0.0:${PORT}`);
    console.log(`🗄️  Armazenamento: ${usandoFirestore ? 'FIRESTORE (dados reais)' : 'ARQUIVO local (fallback dev)'}`);
    console.log(`💳 Mercado Pago API global: ${mpService.isConfigured() ? 'token env presente' : 'sem token global (cada organizador usa o próprio)'}\n`);
  });
}

startServer();
