import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { db, usandoFirestore } from './server/db.js';
import { mpService } from './server/mercadopago.js';
import { geminiService } from './server/gemini.js';
import { verifyFirebaseToken } from './server/auth.js';
import { configParaPainel, configParaMarcaPublica } from './server/config-utils.js';
import { decryptToken } from './server/crypto-utils.js';
import { dispararMetaCapiPurchase, buscarInsightsMetaAds } from './server/meta-service.js';
import { toCents } from './server/money-utils.js';
import { EmailNotificador } from './server/notifications.js';
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
    valorCota: toCents(data.valorCota ?? base?.valorCota ?? 50),
    minPorCompra: Number(data.minPorCompra ?? base?.minPorCompra ?? 1),
    maxPorCompra: Number(data.maxPorCompra ?? base?.maxPorCompra ?? 1000),
    localSorteio: String(data.localSorteio ?? base?.localSorteio ?? 'Loteria Federal'),
    dataSorteio: data.dataSorteio !== undefined ? (data.dataSorteio || null) : (base?.dataSorteio ?? null),
    agendamentoAtivo: data.agendamentoAtivo !== undefined ? Boolean(data.agendamentoAtivo) : (base?.agendamentoAtivo ?? false),
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
          selo: o.selo ? String(o.selo) : undefined
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
    checkout: data.checkout || base?.checkout || DEFAULT_CHECKOUT_CONFIG,
    remarketing: data.remarketing !== undefined ? data.remarketing : (base?.remarketing ?? {
      ativo: false,
      aguardando: [{ faltaMin: 5, mensagem: "Olá {nome}! Sua reserva de cotas na rifa {campanha} está expirando em {minutos} minutos. Pague via Pix para garantir: {link}" }],
      expirado: [{ aposMin: 30, cupom: "VOLTA10", descontoPct: 10, mensagem: "Oi {nome}! Vimos que seu pedido na {campanha} expirou. Ganhe 10% de desconto usando o cupom {cupom}: {link}" }]
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
// Render/Cloud Run injetam a porta via variável PORT.
const PORT = Number(process.env.PORT) || 3000;

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
      campanha: {
        ...campanhaPublica,
        tema: campanhaPublica.tema || TEMA_PADRAO,
        checkout: campanhaPublica.checkout || DEFAULT_CHECKOUT_CONFIG
      },
      marca,
      estatisticas: {
        ...estatisticas,
        arrecadado: Math.round(estatisticas.vendidas * toCents(campanha.valorCota))
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
    const valorUnitarioCents = toCents(campanha.valorCota);
    let valorTotalCents = totalQtd * valorUnitarioCents;

    // Verificar se se encaixa em alguma promoção de pacote
    if (campanha.promocoes && campanha.promocoes.length > 0) {
      const promoExata = campanha.promocoes.find(p => Number(p.quantidade) === totalQtd);
      if (promoExata) {
        valorTotalCents = toCents(promoExata.valor);
      }
    }

    // Desconto progressivo por valor total (se configurado)
    if (campanha.descontoPorValorTotal && campanha.descontoPorValorTotal.length > 0) {
      const regras = [...campanha.descontoPorValorTotal].sort((a, b) => toCents(b.aPartirDeValor) - toCents(a.aPartirDeValor));
      for (const regra of regras) {
        const aPartirDe = toCents(regra.aPartirDeValor);
        if (valorTotalCents >= aPartirDe) {
          const valorComDesc = toCents(regra.valorCotaComDesconto);
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
        valorTotalCents += toCents(oferta.preco);
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
        valorTotal: novoPedido.valorTotal,
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
        valorTotal: novoPedido.valorTotal,
        quantidade: novoPedido.quantidade,
        numeros: novoPedido.numeros,
        expiraEm: novoPedido.expiraEm,
        tempoReservaMin: campanha.tempoReservaMin
      });
    }

    // Default: Pix
    const pixResult = await mpService.criarPix({
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
      valorTotal: novoPedido.valorTotal,
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
        const ownerConfig = await db.getConfig(campanha.ownerId || '');
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
  try {
    const { id } = req.params;
    const pedido = await db.getPedido(id);

    if (!pedido) {
      return res.status(404).json({ status: 'nao_encontrado' });
    }

    // Reconciliação se estiver pendente e tiver mpPaymentId
    if (pedido.status === 'pendente' && pedido.mpPaymentId) {
      const mpToken = await db.getMpTokenPorCampanha(pedido.campanhaId);
      const consulta = await mpService.consultarPagamento(pedido.mpPaymentId, mpToken);
      if (consulta && consulta.approved) {
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
    if (pedido.status === 'pendente' && new Date(pedido.expiraEm).getTime() < Date.now()) {
      pedido.status = 'expirado';
      await db.savePedido(pedido);
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
app.get('/api/admin/configuracoes', firebaseAuthMiddleware, async (req, res) => {
  const config = await db.getConfig((req as any).userId);
  const baseUrl = (process.env.BASE_URL || process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const redirectUri = `${baseUrl}/api/auth/mercadopago/callback`;

  return res.json({
    ...configParaPainel(config),
    oauthConfiguradoNoServidor: Boolean(process.env.MP_CLIENT_ID && process.env.MP_CLIENT_SECRET),
    oauthRedirectUri: redirectUri,
    mpClientIdConfigurado: Boolean(process.env.MP_CLIENT_ID)
  });
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

// PUT /api/admin/configuracoes -> Salva configurações (pagamento manual, marca, redes, pixel, Meta Ads)
app.put('/api/admin/configuracoes', firebaseAuthMiddleware, async (req, res) => {
  try {
    const b = req.body || {};

    // Validação do Access Token do Mercado Pago
    if (b.mpAccessToken && !/^(APP_USR-|TEST-)/.test(String(b.mpAccessToken).trim())) {
      return res.status(400).json({
        error: 'Access Token do Mercado Pago inválido (deve começar com "APP_USR-" ou "TEST-").'
      });
    }

    const config = await db.saveConfig((req as any).userId, {
      mpAccessToken: b.mpAccessToken !== undefined ? String(b.mpAccessToken || '') : undefined,
      mpPublicKey: b.mpPublicKey !== undefined ? String(b.mpPublicKey || '') : undefined,
      // token manual informado aqui marca a conexão como 'manual'
      mpConexaoTipo: b.mpAccessToken ? 'manual' : undefined,
      metaAccessToken: b.metaAccessToken !== undefined ? String(b.metaAccessToken || '') : undefined,
      metaCapiToken: b.metaCapiToken !== undefined ? String(b.metaCapiToken || '') : undefined,
      metaAdAccountId: b.metaAdAccountId !== undefined ? String(b.metaAdAccountId || '') : undefined,
      metaPixelId: b.metaPixelId !== undefined ? String(b.metaPixelId || '') : undefined,
      marca: b.marca !== undefined ? b.marca : undefined,
      redes: b.redes !== undefined ? b.redes : undefined
    });

    return res.json({ success: true, ...configParaPainel(config) });
  } catch (err: any) {
    console.error('Erro ao salvar configurações:', err);
    return res.status(500).json({ error: 'Erro ao salvar configurações.' });
  }
});

// GET /api/admin/meta/insights -> Consulta Marketing API da Meta e calcula o ROAS/CPA do RifaZone
app.get('/api/admin/meta/insights', firebaseAuthMiddleware, async (req, res) => {
  try {
    const ownerId = (req as any).userId;
    const { campanhaId } = req.query;

    const config = await db.getConfig(ownerId);
    const plainToken = decryptToken(config?.metaAccessToken) || decryptToken(config?.metaCapiToken);
    const adAccountId = config?.metaAdAccountId;

    if (!plainToken || !adAccountId) {
      return res.status(400).json({
        conectado: false,
        error: 'Token da Marketing API e/ou ID da Conta de Anúncios (act_...) do Meta Ads não configurados.'
      });
    }

    const metaInsights = await buscarInsightsMetaAds({
      metaAccessToken: plainToken,
      metaAdAccountId: adAccountId
    });

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
      ...c,
      estatisticas: {
        ...stats,
        arrecadado: Math.round(stats.vendidas * toCents(c.valorCota))
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
    return res.status(201).json(salva);
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

    if (existente.ownerId !== (req as any).userId) {
      return res.status(403).json({ error: 'Você não tem permissão para editar esta campanha.' });
    }

    const data = req.body;
    const atualizada = sanitizarCampanha(
      data,
      existente,
      existente.ownerId,
      existente.ownerEmail
    );

    const salva = await db.saveCampanha(atualizada);
    return res.json(salva);
  } catch (err: any) {
    console.error('Erro ao atualizar campanha:', err);
    return res.status(500).json({ error: 'Erro ao atualizar campanha.' });
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

// GET /api/admin/pedidos -> Lista todos os pedidos das campanhas do organizador
app.get('/api/admin/pedidos', firebaseAuthMiddleware, async (req, res) => {
  try {
    const campanhas = await db.getCampanhas((req as any).userId);
    const campanhaIds = new Set(campanhas.map(c => c.id));
    const todosPedidos = await db.getTodosPedidos();
    const meusPedidos = todosPedidos.filter(p => campanhaIds.has(p.campanhaId));
    return res.json(meusPedidos);
  } catch (err: any) {
    console.error('Erro ao buscar pedidos do organizador:', err);
    return res.status(500).json({ error: 'Erro ao buscar pedidos.' });
  }
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
app.post('/api/tarefas/expirar-pedidos', async (req, res) => {
  try {
    const cronSecretVal = (process.env.CRON_SECRET || 'rifazone_cron_secret_default').trim();
    const secretRecebido = (
      (req.headers['x-cron-secret'] as string) ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null) ||
      (req.query.secret as string) ||
      ''
    ).trim();

    if (!secretRecebido || secretRecebido !== cronSecretVal) {
      return res.status(401).json({
        error: 'Não autorizado. Header X-Cron-Secret ou token Bearer inválido.'
      });
    }

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

// POST /api/tarefas/remarketing -> Motor de envio de notificações de remarketing
app.post('/api/tarefas/remarketing', async (req, res) => {
  try {
    const cronSecretVal = (process.env.CRON_SECRET || 'rifazone_cron_secret_default').trim();
    const secretRecebido = (
      (req.headers['x-cron-secret'] as string) ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null) ||
      (req.query.secret as string) ||
      ''
    ).trim();

    if (!secretRecebido || secretRecebido !== cronSecretVal) {
      return res.status(401).json({
        error: 'Não autorizado. Header X-Cron-Secret ou token Bearer inválido.'
      });
    }

    const emailNotificador = new EmailNotificador();
    const campanhas = await db.getCampanhas();
    const campanhasAtivas = campanhas.filter(c => c.remarketing && c.remarketing.ativo);

    if (campanhasAtivas.length === 0) {
      return res.json({
        success: true,
        disparados: 0,
        mensagem: 'Nenhuma campanha com remarketing ativo no momento.',
        timestamp: new Date().toISOString()
      });
    }

    const todosPedidos = await db.getTodosPedidos();
    const agoraMs = Date.now();
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;

    let totalDisparados = 0;
    const detalhes: any[] = [];

    for (const campanha of campanhasAtivas) {
      const configRem = campanha.remarketing!;
      const pedidosCampanha = todosPedidos.filter(p => p.campanhaId === campanha.id);

      for (const p of pedidosCampanha) {
        if (!p.comprador) continue;
        const jaEnviados = new Set(p.remarketingEnviado || []);
        let mudouPedido = false;

        // 1. Regras de "Aguardando" (pedidos pendentes)
        if (p.status === 'pendente' && configRem.aguardando && configRem.aguardando.length > 0) {
          const expiraMs = new Date(p.expiraEm).getTime();
          const faltaMinutos = Math.max(0, Math.ceil((expiraMs - agoraMs) / (60 * 1000)));

          for (const regra of configRem.aguardando) {
            const ruleKey = regra.id || `aguardando_${regra.faltaMin}`;
            if (jaEnviados.has(ruleKey)) continue;

            // Dispara quando FALTA X min p/ expirar
            if (faltaMinutos <= regra.faltaMin && faltaMinutos > 0) {
              const link = `${baseUrl}/c/${campanha.codigo}?pedido=${p.id}`;
              const msgTexto = (regra.mensagem || '')
                .replace(/\{nome\}/g, p.comprador.nome || 'Cliente')
                .replace(/\{campanha\}/g, campanha.titulo)
                .replace(/\{link\}/g, link)
                .replace(/\{cupom\}/g, '')
                .replace(/\{minutos\}/g, String(faltaMinutos));

              if (p.comprador.email) {
                await emailNotificador.enviarEmail({
                  destinatarioEmail: p.comprador.email,
                  destinatarioTelefone: p.comprador.whatsapp,
                  nomeComprador: p.comprador.nome,
                  tituloCampanha: campanha.titulo,
                  mensagemTexto: msgTexto,
                  linkCheckout: link
                });
              }

              jaEnviados.add(ruleKey);
              p.remarketingEnviado = Array.from(jaEnviados);
              mudouPedido = true;
              totalDisparados++;

              detalhes.push({
                pedidoId: p.id,
                comprador: p.comprador.nome,
                tipo: 'aguardando',
                regra: ruleKey,
                faltaMinutos
              });
            }
          }
        }

        // 2. Regras de "Expirado" (pedidos expirados)
        if (p.status === 'expirado' && configRem.expirado && configRem.expirado.length > 0) {
          const expiraMs = new Date(p.expiraEm).getTime();
          const aposMinutos = Math.max(0, Math.floor((agoraMs - expiraMs) / (60 * 1000)));

          for (const regra of configRem.expirado) {
            const ruleKey = regra.id || `expirado_${regra.aposMin}`;
            if (jaEnviados.has(ruleKey)) continue;

            // Dispara X min APÓS expirar
            if (aposMinutos >= regra.aposMin) {
              const cupomParam = regra.cupom ? `&cupom=${encodeURIComponent(regra.cupom)}` : '';
              const link = `${baseUrl}/c/${campanha.codigo}?pedido=${p.id}${cupomParam}`;
              const msgTexto = (regra.mensagem || '')
                .replace(/\{nome\}/g, p.comprador.nome || 'Cliente')
                .replace(/\{campanha\}/g, campanha.titulo)
                .replace(/\{link\}/g, link)
                .replace(/\{cupom\}/g, regra.cupom || '')
                .replace(/\{minutos\}/g, String(aposMinutos));

              if (p.comprador.email) {
                await emailNotificador.enviarEmail({
                  destinatarioEmail: p.comprador.email,
                  destinatarioTelefone: p.comprador.whatsapp,
                  nomeComprador: p.comprador.nome,
                  tituloCampanha: campanha.titulo,
                  mensagemTexto: msgTexto,
                  linkCheckout: link,
                  cupom: regra.cupom
                });
              }

              jaEnviados.add(ruleKey);
              p.remarketingEnviado = Array.from(jaEnviados);
              mudouPedido = true;
              totalDisparados++;

              detalhes.push({
                pedidoId: p.id,
                comprador: p.comprador.nome,
                tipo: 'expirado',
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
      disparados: totalDisparados,
      detalhes,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Erro no motor de remarketing:', err);
    return res.status(500).json({ error: 'Erro ao processar fila de remarketing.' });
  }
});

// ----------------------------------------------------
// 3. VITE MIDDLEWARE & BOOTSTRAP
// ----------------------------------------------------
async function startServer() {
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Servidor RifaZone rodando com sucesso em http://0.0.0.0:${PORT}`);
    console.log(`🗄️  Armazenamento: ${usandoFirestore ? 'FIRESTORE (dados reais)' : 'ARQUIVO local (fallback dev)'}`);
    console.log(`💳 Mercado Pago API global: ${mpService.isConfigured() ? 'token env presente' : 'sem token global (cada organizador usa o próprio)'}\n`);
  });
}

startServer();
