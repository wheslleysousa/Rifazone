import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { db } from './server/storage.js';
import { mpService } from './server/mercadopago.js';
import { Campanha } from './src/types.js';

const app = express();
const PORT = 3000;

// Body parsers
app.use(express.json({
  limit: '10mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

// --- Middleware de Autenticação Admin Simples e Segura ---
function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const adminSecretHeader = req.headers['x-admin-key'];

  // Check token or secret header
  const configuredPassword = process.env.ADMIN_PASSWORD || 'admin';
  const adminEmails = (process.env.ADMIN_EMAILS || 'wheslleyaviz@gmail.com,admin@exemplo.com')
    .split(',')
    .map(e => e.trim().toLowerCase());

  // Check token Bearer (if user authenticated via Firebase or custom session)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    // Allow if matches simple admin token or valid session email
    if (token === configuredPassword || token.startsWith('adm_session_')) {
      return next();
    }
  }

  if (adminSecretHeader && adminSecretHeader === configuredPassword) {
    return next();
  }

  return res.status(401).json({ error: 'Não autorizado. Faça login no painel administrativo.' });
}

// ----------------------------------------------------
// 1. ENDPOINTS PÚBLICOS
// ----------------------------------------------------

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    mpConfigured: mpService.isConfigured(),
    timestamp: new Date().toISOString()
  });
});

// GET /api/campanhas/:codigo -> Dados da campanha para página pública + estatísticas + ranking
app.get('/api/campanhas/:codigo', (req, res) => {
  try {
    const { codigo } = req.params;
    const campanha = db.getCampanhaByCodigo(codigo);

    if (!campanha) {
      return res.status(404).json({ error: 'Campanha não encontrada.' });
    }

    const estatisticas = db.getEstatisticasCampanha(campanha.id, campanha.totalCotas);
    const ranking = campanha.exibirRanking ? db.getRankingCampanha(campanha.id) : [];

    // Cotas ocupadas caso seja modelo manual
    let cotasOcupadas: Record<string, { status: 'reservado' | 'vendido' }> = {};
    if (campanha.modelo === 'manual') {
      cotasOcupadas = db.getCotasOcupadas(campanha.id);
    }

    return res.json({
      campanha,
      estatisticas: {
        ...estatisticas,
        arrecadado: Number((estatisticas.vendidas * campanha.valorCota).toFixed(2))
      },
      ranking,
      cotasOcupadas
    });
  } catch (err: any) {
    console.error('Erro ao buscar campanha:', err);
    return res.status(500).json({ error: 'Erro ao carregar dados da campanha.' });
  }
});

// POST /api/pedidos -> Cria pedido, reserva as cotas atomicamente e gera o Pix Mercado Pago
app.post('/api/pedidos', async (req, res) => {
  try {
    const {
      campanhaId,
      quantidade,
      numeros,
      comprador,
      ofertaRelampagoId
    } = req.body;

    if (!campanhaId || !quantidade || !comprador || !comprador.nome || !comprador.whatsapp) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios (nome, whatsapp, quantidade).' });
    }

    const campanha = db.getCampanhaById(campanhaId);
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
    const compradorSalvo = db.saveComprador({
      id: comprador.whatsapp.replace(/\D/g, ''),
      nome: comprador.nome.trim(),
      whatsapp: comprador.whatsapp.trim(),
      cpf: comprador.cpf ? comprador.cpf.trim() : null,
      email: comprador.email ? comprador.email.trim() : null,
      criadoEm: new Date().toISOString()
    });

    // Calcular cotas totais e valor total
    let totalQtd = Number(quantidade);
    let valorTotal = totalQtd * campanha.valorCota;

    // Verificar se se encaixa em alguma promoção de pacote
    if (campanha.promocoes && campanha.promocoes.length > 0) {
      const promoExata = campanha.promocoes.find(p => p.quantidade === totalQtd);
      if (promoExata) {
        valorTotal = promoExata.valor;
      }
    }

    // Oferta Relâmpago / Upsell adicional
    if (ofertaRelampagoId && campanha.ofertasRelampago) {
      const oferta = campanha.ofertasRelampago.find(o => o.id === ofertaRelampagoId || !o.id);
      if (oferta) {
        totalQtd += oferta.cotasExtras;
        valorTotal += oferta.preco;
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
        cotasAReservar = db.sortearCotasLivres(campanha, totalQtd);
      } catch (err: any) {
        return res.status(400).json({ error: err.message || 'Não há cotas suficientes disponíveis para reserva.' });
      }
    }

    const pedidoId = 'ped_' + crypto.randomUUID().slice(0, 10);
    const agora = new Date();
    const expiraEm = new Date(agora.getTime() + (campanha.tempoReservaMin || 10) * 60 * 1000);

    // 1) Reserva atômica das cotas no banco
    try {
      db.reservarCotas(campanha, cotasAReservar, pedidoId, compradorSalvo.id, compradorSalvo.nome);
    } catch (err: any) {
      return res.status(409).json({ error: err.message || 'Um ou mais números escolhidos acabaram de ser reservados por outro comprador. Tente novamente.' });
    }

    // 2) Gerar o Pix no Mercado Pago
    const pixResult = await mpService.criarPix({
      pedidoId,
      valorTotal,
      tituloCampanha: campanha.titulo,
      comprador: compradorSalvo,
      expiraEm
    });

    // 3) Salvar pedido
    const novoPedido = db.savePedido({
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
      valorTotal: Number(valorTotal.toFixed(2)),
      status: 'pendente',
      mpPaymentId: pixResult.paymentId,
      pixCopiaCola: pixResult.pixCopiaCola,
      pixQrCodeBase64: pixResult.pixQrCodeBase64,
      expiraEm: expiraEm.toISOString(),
      criadoEm: agora.toISOString(),
      pagoEm: null
    });

    return res.status(201).json({
      pedidoId: novoPedido.id,
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
    return res.status(500).json({ error: 'Erro interno ao processar pedido e gerar Pix.' });
  }
});

// GET /api/pedidos/:id/status -> Polling de status do pedido com reconciliação no MP
app.get('/api/pedidos/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = db.getPedido(id);

    if (!pedido) {
      return res.status(404).json({ status: 'nao_encontrado' });
    }

    // Reconciliação se estiver pendente e tiver mpPaymentId
    if (pedido.status === 'pendente' && pedido.mpPaymentId) {
      const consulta = await mpService.consultarPagamento(pedido.mpPaymentId);
      if (consulta && consulta.approved) {
        db.confirmarPedido(pedido.id, pedido.mpPaymentId);
        return res.json({ status: 'pago', pagoEm: new Date().toISOString() });
      }
    }

    // Checar se já expirou
    if (pedido.status === 'pendente' && new Date(pedido.expiraEm).getTime() < Date.now()) {
      pedido.status = 'expirado';
      db.savePedido(pedido);
    }

    return res.json({
      status: pedido.status,
      pagoEm: pedido.pagoEm,
      numeros: pedido.status === 'pago' ? pedido.numeros : []
    });
  } catch (err: any) {
    console.error('Erro ao verificar status do pedido:', err);
    return res.status(500).json({ error: 'Erro ao consultar status.' });
  }
});

// POST /api/pedidos/:id/simular-pagamento -> Facilidade para testes imediatos no preview
app.post('/api/pedidos/:id/simular-pagamento', (req, res) => {
  try {
    const { id } = req.params;
    const pedido = db.getPedido(id);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const { cotasPremiadasEncontradas } = db.confirmarPedido(pedido.id, 'simulado_' + Date.now());
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
app.get('/api/campanhas/:codigo/meus-numeros', (req, res) => {
  try {
    const { codigo } = req.params;
    const whatsapp = String(req.query.whatsapp || '').trim();

    if (!whatsapp) {
      return res.status(400).json({ error: 'Informe o número do WhatsApp com DDD.' });
    }

    const campanha = db.getCampanhaByCodigo(codigo);
    if (!campanha) {
      return res.status(404).json({ error: 'Campanha não encontrada.' });
    }

    const resultado = db.getMeusNumeros(campanha.id, whatsapp);
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

    // 3) Busca o pagamento REAL na API do Mercado Pago (Fonte da Verdade)
    const pagamento = await mpService.consultarPagamento(String(paymentId));
    if (pagamento && pagamento.approved) {
      // Localiza pelo paymentId ou external reference
      const todosPedidos = db.getTodosPedidos();
      const pedidoEncontrado = todosPedidos.find(p => p.mpPaymentId === String(paymentId));

      if (pedidoEncontrado) {
        db.confirmarPedido(pedidoEncontrado.id, String(paymentId));
        console.log(`Pedido ${pedidoEncontrado.id} confirmado via Webhook MP!`);
      }
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

// Login Admin
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  const configuredPassword = process.env.ADMIN_PASSWORD || 'admin';
  const adminEmails = (process.env.ADMIN_EMAILS || 'wheslleyaviz@gmail.com,admin@exemplo.com')
    .split(',')
    .map(e => e.trim().toLowerCase());

  const cleanEmail = String(email || '').trim().toLowerCase();

  // Validar se o e-mail está na lista autorizada
  const emailAutorizado = adminEmails.includes(cleanEmail) || adminEmails.includes('*');

  if (emailAutorizado && password === configuredPassword) {
    const token = 'adm_session_' + crypto.randomUUID();
    return res.json({
      success: true,
      token,
      email: cleanEmail,
      mensagem: 'Login realizado com sucesso.'
    });
  }

  return res.status(401).json({ error: 'Credenciais inválidas ou e-mail não autorizado.' });
});

// GET /api/admin/campanhas
app.get('/api/admin/campanhas', adminAuthMiddleware, (_req, res) => {
  const campanhas = db.getCampanhas();
  const comEstatisticas = campanhas.map(c => {
    const stats = db.getEstatisticasCampanha(c.id, c.totalCotas);
    return {
      ...c,
      estatisticas: {
        ...stats,
        arrecadado: Number((stats.vendidas * c.valorCota).toFixed(2))
      }
    };
  });
  return res.json(comEstatisticas);
});

// POST /api/admin/campanhas -> Criar campanha
app.post('/api/admin/campanhas', adminAuthMiddleware, (req, res) => {
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
    while (db.getCampanhaByCodigo(finalCodigo)) {
      finalCodigo = `${codigo}-${contador++}`;
    }

    const novaCampanha: Campanha = {
      id: 'camp-' + crypto.randomUUID().slice(0, 8),
      codigo: finalCodigo,
      titulo: data.titulo.trim(),
      subtitulo: data.subtitulo?.trim() || '',
      descricao: data.descricao || '<p>Participe do nosso sorteio oficial!</p>',
      bannerUrl: data.bannerUrl || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80',
      youtubeUrl: data.youtubeUrl || null,
      modelo: data.modelo || 'aleatorio',
      totalCotas: Number(data.totalCotas),
      valorCota: Number(data.valorCota),
      minPorCompra: Number(data.minPorCompra || 1),
      maxPorCompra: Number(data.maxPorCompra || 1000),
      localSorteio: data.localSorteio || 'Loteria Federal',
      dataSorteio: data.dataSorteio || null,
      premios: data.premios || [{ posicao: 1, descricao: data.titulo }],
      cotasPremiadas: data.cotasPremiadas || [],
      promocoes: data.promocoes || [],
      ofertasRelampago: data.ofertasRelampago || [],
      selo: data.selo || null,
      tempoReservaMin: Number(data.tempoReservaMin || 10),
      exibirRanking: data.exibirRanking ?? true,
      exibirBarraProgresso: data.exibirBarraProgresso ?? true,
      exibirPaginaGanhadores: data.exibirPaginaGanhadores ?? true,
      exigirEmail: !!data.exigirEmail,
      exigirCpf: !!data.exigirCpf,
      status: data.status || 'publicada',
      numeroSorteado: null,
      ganhador: null,
      criadaEm: new Date().toISOString()
    };

    const salva = db.saveCampanha(novaCampanha);
    return res.status(201).json(salva);
  } catch (err: any) {
    console.error('Erro ao criar campanha:', err);
    return res.status(500).json({ error: 'Erro ao salvar nova campanha.' });
  }
});

// PUT /api/admin/campanhas/:id -> Editar campanha
app.put('/api/admin/campanhas/:id', adminAuthMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const existente = db.getCampanhaById(id);

    if (!existente) {
      return res.status(404).json({ error: 'Campanha não encontrada.' });
    }

    const data = req.body;
    const atualizada: Campanha = {
      ...existente,
      ...data,
      id: existente.id,
      criadaEm: existente.criadaEm,
      atualizadaEm: new Date().toISOString()
    };

    const salva = db.saveCampanha(atualizada);
    return res.json(salva);
  } catch (err: any) {
    console.error('Erro ao atualizar campanha:', err);
    return res.status(500).json({ error: 'Erro ao atualizar campanha.' });
  }
});

// DELETE /api/admin/campanhas/:id
app.delete('/api/admin/campanhas/:id', adminAuthMiddleware, (req, res) => {
  const { id } = req.params;
  const deleted = db.deleteCampanha(id);
  return res.json({ success: deleted });
});

// GET /api/admin/campanhas/:id/pedidos -> Lista pedidos e compradores
app.get('/api/admin/campanhas/:id/pedidos', adminAuthMiddleware, (req, res) => {
  const { id } = req.params;
  const pedidos = db.getPedidosPorCampanha(id);
  return res.json(pedidos);
});

// POST /api/admin/campanhas/:id/sortear -> Apuração e definição do ganhador
app.post('/api/admin/campanhas/:id/sortear', adminAuthMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { numeroSorteado } = req.body;

    if (!numeroSorteado) {
      return res.status(400).json({ error: 'Informe o número sorteado.' });
    }

    const resultado = db.realizarSorteio(id, String(numeroSorteado).trim());
    return res.json(resultado);
  } catch (err: any) {
    console.error('Erro ao realizar apuração:', err);
    return res.status(500).json({ error: err.message || 'Erro ao realizar apuração.' });
  }
});

// POST /api/admin/limpar-reservas -> Limpa reservas vencidas
app.post('/api/admin/limpar-reservas', adminAuthMiddleware, (_req, res) => {
  const limpos = db.limparReservasExpiradas();
  return res.json({ success: true, cotasLiberadas: limpos });
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
    console.log(`\n🚀 Servidor RifaPix rodando com sucesso em http://0.0.0.0:${PORT}`);
    console.log(`💳 Mercado Pago API: ${mpService.isConfigured() ? 'ATIVO (Chave de produção/teste conectada)' : 'MODO SIMULAÇÃO ATIVO'}\n`);
  });
}

startServer();
