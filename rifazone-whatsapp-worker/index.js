import express from 'express';
import qrcodeLib from 'qrcode';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

const app = express();
app.use(express.json());

// ----------------------------------------------------------------------------
// 1. CONFIGURAÇÕES & ENV
// ----------------------------------------------------------------------------
const PORT = Number(process.env.PORT) || 3001;
const RIFAZONE_URL = (process.env.RIFAZONE_URL || 'http://localhost:3000').replace(/\/$/, '');
const CRON_SECRET = process.env.CRON_SECRET;
const WORKER_SECRET = process.env.WORKER_SECRET;
const DATA_PATH = process.env.DATA_PATH || '/data';

if (!CRON_SECRET || !CRON_SECRET.trim()) {
  console.error('\x1b[31m%s\x1b[0m', '❌ [ERRO CRÍTICO NO WORKER] A variável de ambiente CRON_SECRET não está configurada!');
  process.exit(1);
}
if (!WORKER_SECRET || !WORKER_SECRET.trim()) {
  console.error('\x1b[31m%s\x1b[0m', '❌ [ERRO CRÍTICO NO WORKER] A variável de ambiente WORKER_SECRET não está configurada!');
  process.exit(1);
}

// Estados do Worker
let qrCodeRaw = '';
let qrCodeDataURL = '';
let isConnected = false;
let connectedNumber = '';
let connectionStatusMessage = 'Iniciando WhatsApp...';
let isProcessingQueue = false;

console.log('--------------------------------------------------');
console.log('🤖 INICIANDO TRABALHADOR DE WHATSAPP (WORKER)');
console.log(`🔗 URL RifaZone: ${RIFAZONE_URL}`);
console.log(`📁 Diretório de Sessão: ${DATA_PATH}`);
console.log(`🔌 Porta do Servidor QR/Status: ${PORT}`);
console.log('--------------------------------------------------');

// ----------------------------------------------------------------------------
// 2. MIDDLEWARE DE AUTENTICAÇÃO DO WORKER
// ----------------------------------------------------------------------------
function authMiddleware(req, res, next) {
  const secretRecebido = req.headers['x-worker-secret'] || req.query.secret;
  if (!secretRecebido || secretRecebido !== WORKER_SECRET) {
    return res.status(401).json({ error: 'Não autorizado. Header x-worker-secret ou secret inválido.' });
  }
  next();
}

// ----------------------------------------------------------------------------
// 3. ENDPOINTS EXPOSTOS DO WORKER
// ----------------------------------------------------------------------------

// GET /qr -> Exibe uma página HTML estilizada com o QR Code atual e auto-update
app.get('/qr', async (req, res) => {
  if (isConnected) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>RifaZone Worker - Status</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding: 3rem; }
            .card { background: #1e293b; max-width: 400px; margin: auto; padding: 2rem; border-radius: 1rem; border: 1px solid #334155; }
            .badge { background: #10b981; color: #000; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: bold; font-size: 0.85rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>WhatsApp Conectado! 🎉</h2>
            <p>Número: <span class="badge">${connectedNumber}</span></p>
            <p style="color: #94a3b8; font-size: 0.85rem;">Pronto para disparar mensagens do RifaZone.</p>
          </div>
        </body>
      </html>
    `);
  }

  if (!qrCodeDataURL) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>RifaZone Worker - QR Code</title>
          <meta http-equiv="refresh" content="3">
          <style>
            body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding: 3rem; }
            .card { background: #1e293b; max-width: 400px; margin: auto; padding: 2rem; border-radius: 1rem; border: 1px solid #334155; }
            .spinner { border: 4px solid #334155; border-top: 4px solid #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 2rem auto; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Aguardando QR Code...</h2>
            <div class="spinner"></div>
            <p style="color: #94a3b8; font-size: 0.85rem;">${connectionStatusMessage}</p>
            <p style="color: #64748b; font-size: 0.75rem;">Esta página recarrega automaticamente a cada 3s.</p>
          </div>
        </body>
      </html>
    `);
  }

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>RifaZone Worker - Escanear QR</title>
        <meta http-equiv="refresh" content="10">
        <style>
          body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding: 2rem; }
          .card { background: #1e293b; max-width: 420px; margin: auto; padding: 2rem; border-radius: 1rem; border: 1px solid #334155; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3); }
          img { background: white; padding: 1rem; border-radius: 0.5rem; margin: 1.5rem 0; width: 250px; height: 250px; }
          .instrucoes { text-align: left; font-size: 0.85rem; color: #94a3b8; background: #0f172a; padding: 1rem; border-radius: 0.5rem; border: 1px solid #1e293b; }
          ol { margin: 0; padding-left: 1.2rem; }
          li { margin-bottom: 0.25rem; }
        </head>
        <body>
          <div class="card">
            <h2 style="margin-top: 0; color: #10b981;">Conectar WhatsApp</h2>
            <p style="font-size: 0.9rem; color: #cbd5e1;">Escaneie o código QR abaixo com o seu celular:</p>
            
            <img src="${qrCodeDataURL}" alt="Scan QR Code" />

            <div class="instrucoes">
              <ol>
                <li>Abra o WhatsApp no seu celular</li>
                <li>Toque em <b>Mais Opções</b> (Android) ou <b>Configurações</b> (iOS)</li>
                <li>Selecione <b>Aparelhos Conectados</b></li>
                <li>Toque em <b>Conectar um aparelho</b> e aponte para a tela</li>
              </ol>
            </div>
            <p style="color: #64748b; font-size: 0.7rem; margin-top: 1.5rem;">Página recarrega automaticamente a cada 10s para manter o QR atualizado.</p>
          </div>
        </body>
      </html>
  `);
});

// GET /status -> Retorna status JSON do worker protegido por WORKER_SECRET
app.get('/status', authMiddleware, (req, res) => {
  res.json({
    conectado: isConnected,
    numero: connectedNumber || null,
    mensagemStatus: connectionStatusMessage,
    timestamp: new Date().toISOString()
  });
});

// ----------------------------------------------------------------------------
// 4. INSTANCIAÇÃO DO CLIENTE WHATSAPP WEB
// ----------------------------------------------------------------------------
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: DATA_PATH
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  }
});

// Evento de geração do QR Code
client.on('qr', async (qr) => {
  qrCodeRaw = qr;
  connectionStatusMessage = 'QR Code gerado. Aguardando escaneamento...';
  try {
    qrCodeDataURL = await qrcodeLib.toDataURL(qr);
    console.log('[WORKER] 📱 Novo QR Code gerado! Acesse http://localhost:' + PORT + '/qr para escanear.');
  } catch (err) {
    console.error('[WORKER] Erro ao converter QR para dataURL:', err);
  }
});

// Evento de autenticação bem-sucedida
client.on('authenticated', () => {
  console.log('[WORKER] ✅ Autenticado com sucesso no WhatsApp!');
  connectionStatusMessage = 'Autenticado com sucesso!';
  qrCodeRaw = '';
  qrCodeDataURL = '';
});

// Evento de falha na autenticação
client.on('auth_failure', (msg) => {
  console.error('[WORKER] ❌ Falha na autenticação:', msg);
  connectionStatusMessage = `Falha na autenticação: ${msg}`;
  isConnected = false;
  syncStatusWithApp();
});

// Evento de conexão pronta
client.on('ready', () => {
  isConnected = true;
  connectedNumber = client.info?.wid?.user || 'Desconhecido';
  connectionStatusMessage = 'Pronto para uso';
  console.log(`[WORKER] 🚀 WhatsApp pronto e ativo! Número: ${connectedNumber}`);
  syncStatusWithApp();
});

// Evento de desconexão
client.on('disconnected', (reason) => {
  console.log(`[WORKER] 🔌 WhatsApp desconectado: ${reason}`);
  isConnected = false;
  connectedNumber = '';
  connectionStatusMessage = `Desconectado: ${reason}`;
  syncStatusWithApp();
  
  // Tenta reinicializar o cliente
  console.log('[WORKER] Reiniciando cliente...');
  client.initialize().catch(err => console.error('[WORKER] Erro ao reiniciar:', err));
});

// Inicialização
client.initialize().catch(err => {
  console.error('[WORKER] Erro crítico ao inicializar whatsapp-web.js:', err);
});

// ----------------------------------------------------------------------------
// 5. SINCRONIZAÇÃO DE STATUS COM O APP RIFAZONE
// ----------------------------------------------------------------------------
async function syncStatusWithApp() {
  try {
    const response = await fetch(`${RIFAZONE_URL}/api/worker/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-worker-secret': WORKER_SECRET
      },
      body: JSON.stringify({
        conectado: isConnected,
        numero: connectedNumber || null
      })
    });
    
    if (response.ok) {
      console.log(`[WORKER] Status sincronizado com RifaZone: Conectado = ${isConnected}`);
    } else {
      console.warn(`[WORKER] Falha ao sincronizar status. HTTP ${response.status}`);
    }
  } catch (err) {
    console.error('[WORKER] Falha de conexão ao sincronizar status com RifaZone:', err.message || err);
  }
}

// ----------------------------------------------------------------------------
// 6. PIPELINE DE ENVIO COM RANDOM DELAY (FRENTE CONTRA BANIMENTOS)
// ----------------------------------------------------------------------------
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function processQueue() {
  if (isProcessingQueue) return;
  if (!isConnected) {
    console.log('[WORKER] Aguardando conexão do WhatsApp para processar fila...');
    return;
  }

  isProcessingQueue = true;
  try {
    console.log('[WORKER] Buscando fila de pendentes no RifaZone...');
    const res = await fetch(`${RIFAZONE_URL}/api/worker/fila?limit=10`, {
      headers: { 'x-worker-secret': WORKER_SECRET }
    });

    if (!res.ok) {
      console.error(`[WORKER] Erro ao buscar fila do RifaZone. HTTP ${res.status}`);
      isProcessingQueue = false;
      return;
    }

    const mensagens = await res.json();
    if (!Array.isArray(mensagens) || mensagens.length === 0) {
      console.log('[WORKER] Nenhuma mensagem na fila para enviar.');
      isProcessingQueue = false;
      return;
    }

    console.log(`[WORKER] Fila carregada: ${mensagens.length} mensagem(ns) pendente(s). Iniciando disparos...`);

    for (const msg of mensagens) {
      // Dupla checagem de conexão antes de cada envio
      if (!isConnected) {
        console.warn('[WORKER] Conexão perdida no meio do envio do lote. Abortando lote.');
        break;
      }

      console.log(`[WORKER] Enviando para: ${msg.para}...`);
      
      let statusEnvio = 'enviada';
      let erroEnvio = null;

      try {
        const chatId = `${msg.para.replace(/\D/g, '')}@c.us`;
        await client.sendMessage(chatId, msg.texto);
        console.log(`[WORKER] ✅ Mensagem ${msg.id} enviada com sucesso para ${msg.para}!`);
      } catch (err) {
        statusEnvio = 'erro';
        erroEnvio = err.message || String(err);
        console.error(`[WORKER] ❌ Falha ao enviar mensagem ${msg.id} para ${msg.para}:`, erroEnvio);
      }

      // Notifica o app RifaZone sobre o status do envio
      try {
        const updateRes = await fetch(`${RIFAZONE_URL}/api/worker/fila/${msg.id}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-worker-secret': WORKER_SECRET
          },
          body: JSON.stringify({
            status: statusEnvio,
            erro: erroEnvio
          })
        });

        if (updateRes.ok) {
          console.log(`[WORKER] Status da mensagem ${msg.id} atualizado para '${statusEnvio}' no RifaZone.`);
        } else {
          console.error(`[WORKER] Erro ao atualizar status da mensagem ${msg.id} no RifaZone. HTTP ${updateRes.status}`);
        }
      } catch (updateErr) {
        console.error(`[WORKER] Falha de conexão ao notificar status de ${msg.id}:`, updateErr.message);
      }

      // Delay aleatório inteligente entre envios (evita detecção de robô pelo WhatsApp)
      // Intervalo entre 8 e 20 segundos
      const delayMs = Math.floor(Math.random() * (20000 - 8000 + 1)) + 8000;
      console.log(`[WORKER] ⏳ Aguardando ${(delayMs / 1000).toFixed(1)} segundos antes do próximo envio para proteção de banimento...`);
      await sleep(delayMs);
    }

  } catch (err) {
    console.error('[WORKER] Erro inesperado no processamento da fila:', err);
  } finally {
    isProcessingQueue = false;
  }
}

// ----------------------------------------------------------------------------
// 7. LOOPS TEMPORIZADOS (CRONS)
// ----------------------------------------------------------------------------

// Loop de fila a cada 15s
setInterval(processQueue, 15000);

// Sincroniza status a cada 60s como liveness check
setInterval(() => {
  if (isConnected) {
    syncStatusWithApp();
  }
}, 60000);

// ----------------------------------------------------------------------------
// 8. ESCUTA DO EXPRESS
// ----------------------------------------------------------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n💚 Servidor QR e Status rodando em http://0.0.0.0:${PORT}`);
  console.log(`📱 QR Code disponível em: http://localhost:${PORT}/qr`);
  console.log(`ℹ️  Endpoint JSON de Status: http://localhost:${PORT}/status\n`);
});
