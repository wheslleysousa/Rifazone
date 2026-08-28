import https from 'https';
import { ConfigOrganizador } from '../src/types.js';
import { decryptToken } from './crypto-utils.js';

export interface PixGenerationResult {
  paymentId: string;
  pixCopiaCola: string;
  pixQrCodeBase64: string;
  gateway: string;
  isMock?: boolean;
}

export interface GatewayPixInput {
  pedidoId: string;
  valorTotal: number; // em centavos
  tituloCampanha: string;
  comprador: {
    nome: string;
    whatsapp: string;
    cpf?: string;
    email?: string;
  };
  expiraEm: Date;
  config?: ConfigOrganizador | null;
}

/**
 * Cria cobrança PIX no gateway ativo do organizador
 */
export async function gerarPixMultiGateway(input: GatewayPixInput): Promise<PixGenerationResult> {
  const { config, pedidoId, valorTotal, comprador, expiraEm } = input;
  const valorReais = Number((valorTotal / 100).toFixed(2));
  const metodoAtivo = config?.metodoAtivo || (config?.mpAccessToken ? 'mercadopago' : 'carteira');

  // 1. ASAAS
  if (metodoAtivo === 'asaas' && config?.asaasConfig?.apiKey) {
    const rawApiKey = decryptToken(config.asaasConfig.apiKey);
    const isProd = config.asaasConfig.ambiente === 'producao';
    const baseUrl = isProd ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3';
    const fallbackBaseUrl = isProd ? 'https://www.asaas.com/api/v3' : 'https://sandbox.asaas.com/api/v3';

    try {
      // 1.1 Criar ou buscar cliente
      let customerId = '';
      const cleanCpf = (comprador.cpf || '').replace(/\D/g, '');
      const cleanPhone = (comprador.whatsapp || '').replace(/\D/g, '');

      // Tenta criar o cliente
      const custRes = await fetch(`${baseUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': rawApiKey,
          'User-Agent': 'RifaZone/1.0'
        },
        body: JSON.stringify({
          name: comprador.nome || 'Cliente Rifa',
          cpfCnpj: (cleanCpf.length === 11 || cleanCpf.length === 14) ? cleanCpf : undefined,
          mobilePhone: cleanPhone || undefined,
          email: comprador.email || undefined,
          externalReference: cleanPhone || undefined
        })
      });

      const custText = await custRes.text();
      let custData: any = null;
      try {
        custData = JSON.parse(custText);
      } catch (e) {
        console.error('[Gateway Asaas] Resposta não-JSON ao criar cliente (status', custRes.status, '):', custText.slice(0, 200));
      }

      if (custData && custData.id) {
        customerId = custData.id;
      }

      // Se não obteve customerId (por exemplo, cliente já cadastrado), busca por CPF ou telefone
      if (!customerId && (cleanCpf || cleanPhone)) {
        const query = (cleanCpf.length === 11 || cleanCpf.length === 14)
          ? `cpfCnpj=${cleanCpf}`
          : `mobilePhone=${cleanPhone}`;
        const searchRes = await fetch(`${baseUrl}/customers?${query}`, {
          headers: {
            'access_token': rawApiKey,
            'User-Agent': 'RifaZone/1.0'
          }
        });
        const searchText = await searchRes.text();
        try {
          const searchData = JSON.parse(searchText);
          if (searchData?.data?.[0]?.id) {
            customerId = searchData.data[0].id;
          }
        } catch (e) {
          console.warn('[Gateway Asaas] Falha ao buscar cliente existente:', searchText.slice(0, 200));
        }
      }

      // 1.2 Criar cobrança PIX
      if (customerId) {
        const payRes = await fetch(`${baseUrl}/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': rawApiKey,
            'User-Agent': 'RifaZone/1.0'
          },
          body: JSON.stringify({
            customer: customerId,
            billingType: 'PIX',
            value: valorReais,
            dueDate: expiraEm.toISOString().split('T')[0],
            description: `Pedido #${pedidoId} - ${(input.tituloCampanha || 'Campanha').slice(0, 50)}`,
            externalReference: pedidoId,
            postalService: false
          })
        });

        const payText = await payRes.text();
        let payData: any = null;
        try {
          payData = JSON.parse(payText);
        } catch (e) {
          console.error('[Gateway Asaas] Resposta não-JSON ao criar cobrança (status', payRes.status, '):', payText.slice(0, 200));
        }

        if (payData && payData.id) {
          // 1.3 Obter QR Code PIX
          const qrRes = await fetch(`${baseUrl}/payments/${payData.id}/pixQrCode`, {
            headers: {
              'access_token': rawApiKey,
              'User-Agent': 'RifaZone/1.0'
            }
          });
          const qrText = await qrRes.text();
          let qrData: any = null;
          try {
            qrData = JSON.parse(qrText);
          } catch (e) {
            console.error('[Gateway Asaas] Resposta não-JSON ao buscar QR Code (status', qrRes.status, '):', qrText.slice(0, 200));
          }

          if (qrData && (qrData.payload || qrData.encodedImage)) {
            const rawQrImage = qrData.encodedImage || '';
            const qrImageBase64 = rawQrImage ? (rawQrImage.startsWith('data:') ? rawQrImage : `data:image/png;base64,${rawQrImage}`) : '';

            return {
              paymentId: `asaas_${payData.id}`,
              pixCopiaCola: qrData.payload || '',
              pixQrCodeBase64: qrImageBase64,
              gateway: 'asaas'
            };
          }
        } else if (payData && payData.errors) {
          console.warn('[Gateway Asaas] Erros retornados pelo Asaas ao criar cobrança:', payData.errors);
        }
      } else {
        console.warn('[Gateway Asaas] Não foi possível obter ou criar customerId no Asaas.');
      }
    } catch (err) {
      console.warn('[Gateway Asaas] Falha na chamada de API:', err);
    }
  }

  // 2. PUSHINPAY
  if (metodoAtivo === 'pushinpay' && config?.pushinpayConfig?.token) {
    const rawToken = decryptToken(config.pushinpayConfig.token);
    try {
      const res = await fetch('https://api.pushinpay.com.br/api/pix/cashIn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${rawToken}`
        },
        body: JSON.stringify({
          value: valorTotal, // centavos
          webhook_url: `${process.env.BASE_URL || ''}/api/webhooks/pushinpay`,
          external_reference: pedidoId
        })
      });
      const data = await res.json();
      if (data && (data.qr_code || data.qr_code_base64)) {
        return {
          paymentId: `pushin_${data.id || pedidoId}`,
          pixCopiaCola: data.qr_code || '',
          pixQrCodeBase64: data.qr_code_base64 ? `data:image/png;base64,${data.qr_code_base64}` : '',
          gateway: 'pushinpay'
        };
      }
    } catch (err) {
      console.warn('[Gateway PushinPay] Falha na chamada:', err);
    }
  }

  // 3. EFIPAY (Gerencianet)
  if (metodoAtivo === 'efipay') {
    const efiCreds = resolveEfipayCredentials(config);

    if (efiCreds && efiCreds.clientId && efiCreds.clientSecret) {
      const efiResult = await gerarPixEfipay(input, efiCreds);
      if (efiResult) return efiResult;
    }

    // Sem credenciais válidas OU a API da Efí falhou. NUNCA devolver um Pix
    // "placeholder" (não pagável) em produção — melhor um erro claro do que um
    // copia-e-cola que o comprador tenta pagar e falha.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Pagamento via Pix indisponível no momento (Efí Pay não configurada corretamente). Tente novamente em instantes ou contate o organizador.');
    }
    // Fora de produção, mantém um mock para permitir testes locais.
    const payId = `efi_${Date.now()}_${pedidoId}`;
    const payloadPix = `00020126580014BR.GOV.BCB.PIX0136${config?.efipayConfig?.chavePix || process.env.EFI_CHAVE_PIX || 'chave-pix-efipay'}520400005303986540${valorReais.toFixed(2)}5802BR5913${comprador.nome.slice(0, 13)}6009SAO PAULO62070503***6304`;
    return {
      paymentId: payId,
      pixCopiaCola: payloadPix,
      pixQrCodeBase64: '',
      gateway: 'efipay',
      isMock: true
    };
  }

  // 4. CARTEIRA DO SISTEMA (Default)
  // Tenta processar via Efí Pay do Sistema se houver credenciais globais ou do organizador
  const globalEfiCreds = resolveEfipayCredentials(config);

  if (globalEfiCreds && globalEfiCreds.clientId && globalEfiCreds.clientSecret) {
    const efiResult = await gerarPixEfipay(input, globalEfiCreds);
    if (efiResult) {
      return {
        ...efiResult,
        gateway: 'carteira'
      };
    }
  }

  // Sem Efí Pay do sistema configurada. Em produção NÃO devolvemos um Pix
  // "mock" (com CRC inválido) que o comprador não consegue pagar — retornamos
  // erro claro para o painel exibir. O mock fica restrito a ambiente de teste.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Pagamento via Pix indisponível no momento (carteira do sistema sem gateway configurado). Tente novamente em instantes ou contate o organizador.');
  }

  const chavePixSistema = process.env.PIX_SISTEMA_CHAVE || 'carteira@rifazone.com.br';
  const mockPixPayload = `00020101021226580014br.gov.bcb.pix0136${chavePixSistema}520400005303986540${valorReais.toFixed(2)}5802BR5920CARTEIRA SISTEMA6009SAO PAULO62070503${pedidoId.slice(0, 7)}6304BEEF`;

  return {
    paymentId: `carteira_${pedidoId}`,
    pixCopiaCola: mockPixPayload,
    pixQrCodeBase64: '',
    gateway: 'carteira',
    isMock: true
  };
}

export interface EfipayCredentials {
  clientId: string;
  clientSecret: string;
  chavePix: string;
  ambiente?: 'producao' | 'homologacao';
  certificadoBase64?: string;
}

export function resolveEfipayCredentials(config?: ConfigOrganizador | null): EfipayCredentials | null {
  const dbAmbiente = config?.efipayConfig?.ambiente || 'producao';
  
  // Buscar todas as variações possíveis do certificado nas variáveis de ambiente
  const envCert = (
    process.env.EFI_CERTIFICADO_BASE64
    || process.env.EFIPAY_CERTIFICADO_BASE64
    || process.env.EFI_CERT_BASE64
    || process.env.EFIPAY_CERT_BASE64
    || process.env.EFI_CERTIFICADO
    || process.env.EFIPAY_CERTIFICADO
    || process.env.EFI_CERT
    || process.env.EFIPAY_CERT
    || process.env.EFI_CERTIFICADO_BASE64_HOMOLOGACAO
    || process.env.EFI_CERT_HOMOLOGACAO
    || ''
  ).trim();

  // Buscar variações da Chave Pix nas variáveis de ambiente
  const envChavePix = (
    process.env.EFI_CHAVE_PIX
    || process.env.EFIPAY_CHAVE_PIX
    || process.env.EFIPAY_PIX_KEY
    || process.env.EFI_PIX_KEY
    || process.env.EFI_CHAVE_PIX_HOMOLOGACAO
    || ''
  ).trim();

  // 1. PRIORIDADE MÁXIMA: Variáveis de Ambiente (Render, AI Studio, etc)
  const rawEnvAmbiente = (process.env.EFI_AMBIENTE || process.env.EFIPAY_AMBIENTE || process.env.EFI_ENV || 'producao').toLowerCase().trim();
  const isHomologacao = rawEnvAmbiente === 'homologacao' || rawEnvAmbiente === 'sandbox';
  const ambiente: 'producao' | 'homologacao' = isHomologacao ? 'homologacao' : 'producao';

  if (ambiente === 'homologacao') {
    const envClientIdHomol = process.env.EFI_CLIENT_ID_HOMOLOGACAO || process.env.EFIPAY_CLIENT_ID_HOMOLOGACAO || process.env.EFI_CLIENT_ID || process.env.EFIPAY_CLIENT_ID;
    const envClientSecretHomol = process.env.EFI_CLIENT_SECRET_HOMOLOGACAO || process.env.EFIPAY_CLIENT_SECRET_HOMOLOGACAO || process.env.EFI_CLIENT_SECRET || process.env.EFIPAY_CLIENT_SECRET;
    if (envClientIdHomol && envClientSecretHomol) {
      return {
        clientId: envClientIdHomol.trim(),
        clientSecret: envClientSecretHomol.trim(),
        chavePix: (process.env.EFI_CHAVE_PIX_HOMOLOGACAO || envChavePix || '').trim(),
        ambiente: 'homologacao',
        certificadoBase64: envCert
      };
    }
  } else {
    // Ambiente: Produção
    const envClientId = (
      process.env.EFI_CLIENT_ID_PRODUCAO
      || process.env.EFIPAY_CLIENT_ID_PRODUCAO
      || process.env.EFI_CLIENT_ID 
      || process.env.EFIPAY_CLIENT_ID
    );
    const envClientSecret = (
      process.env.EFI_CLIENT_SECRET_PRODUCAO
      || process.env.EFIPAY_CLIENT_SECRET_PRODUCAO
      || process.env.EFI_CLIENT_SECRET 
      || process.env.EFIPAY_CLIENT_SECRET
    );
    if (envClientId && envClientSecret) {
      return {
        clientId: envClientId.trim(),
        clientSecret: envClientSecret.trim(),
        chavePix: envChavePix,
        ambiente: 'producao',
        certificadoBase64: envCert
      };
    }
  }

  // 2. Fallback: Banco de Dados (Painel Admin)
  if (config?.efipayConfig) {
    if (dbAmbiente === 'homologacao' && config.efipayConfig.clientIdHomologacao && config.efipayConfig.clientSecretHomologacao) {
      return {
        clientId: config.efipayConfig.clientIdHomologacao.trim(),
        clientSecret: (decryptToken(config.efipayConfig.clientSecretHomologacao) || config.efipayConfig.clientSecretHomologacao).trim(),
        chavePix: (config.efipayConfig.chavePixHomologacao || config.efipayConfig.chavePix || envChavePix || '').trim(),
        ambiente: 'homologacao',
        certificadoBase64: (config.efipayConfig.certificadoBase64 || envCert).trim()
      };
    } else if (dbAmbiente === 'producao' && config.efipayConfig.clientId && config.efipayConfig.clientSecret) {
      return {
        clientId: config.efipayConfig.clientId.trim(),
        clientSecret: (decryptToken(config.efipayConfig.clientSecret) || config.efipayConfig.clientSecret).trim(),
        chavePix: (config.efipayConfig.chavePix || envChavePix || '').trim(),
        ambiente: 'producao',
        certificadoBase64: (config.efipayConfig.certificadoBase64 || envCert).trim()
      };
    }
  }

  return null;
}

function createEfipayHttpsAgent(certificadoBase64?: string): https.Agent {
  if (!certificadoBase64 || !certificadoBase64.trim()) {
    console.warn('[Efí Pay mTLS] Nenhum certificado informado. Criando agente HTTPS sem certificado.');
    return new https.Agent({ rejectUnauthorized: false });
  }

  try {
    const rawContent = certificadoBase64.trim();

    // Se a string já é um certificado PEM direto em texto plano (não base64)
    if (rawContent.includes('-----BEGIN CERTIFICATE-----') || rawContent.includes('-----BEGIN PRIVATE KEY-----') || rawContent.includes('-----BEGIN RSA PRIVATE KEY-----')) {
      return new https.Agent({
        cert: rawContent,
        key: rawContent,
        rejectUnauthorized: false
      });
    }

    // Se é base64, decodifica a string
    const cleanBase64 = rawContent.replace(/^data:.*?;base64,/, '').replace(/\s+/g, '');
    const certBuffer = Buffer.from(cleanBase64, 'base64');
    const certAscii = certBuffer.toString('ascii');

    if (certAscii.includes('-----BEGIN CERTIFICATE-----') || certAscii.includes('-----BEGIN PRIVATE KEY-----') || certAscii.includes('-----BEGIN RSA PRIVATE KEY-----')) {
      return new https.Agent({
        cert: certBuffer,
        key: certBuffer,
        rejectUnauthorized: false
      });
    } else {
      // Suporta formato PKCS#12 (.p12 / .pfx)
      return new https.Agent({
        pfx: certBuffer,
        passphrase: '',
        rejectUnauthorized: false
      });
    }
  } catch (err: any) {
    console.error('[Efí Pay mTLS] Erro ao instanciar certificado de segurança:', err?.message || err);
    return new https.Agent({ rejectUnauthorized: false });
  }
}

interface EfipayRequestOptions {
  method: 'GET' | 'POST' | 'PUT';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  certificadoBase64?: string;
}

async function efipayFetch(options: EfipayRequestOptions): Promise<{ status: number; data: any }> {
  const parsedUrl = new URL(options.url);
  const agent = createEfipayHttpsAgent(options.certificadoBase64);

  const postData = options.body ? JSON.stringify(options.body) : '';

  const reqHeaders: Record<string, string> = {
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 RifaZone/1.0',
    ...options.headers
  };

  if (postData) {
    reqHeaders['Content-Type'] = 'application/json';
    reqHeaders['Content-Length'] = String(Buffer.byteLength(postData));
  }

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method,
      headers: reqHeaders,
      agent,
      rejectUnauthorized: false
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        let parsedData: any = null;
        try {
          parsedData = JSON.parse(responseBody);
        } catch {
          if (typeof responseBody === 'string' && (responseBody.trim().startsWith('<') || responseBody.includes('cf-error-details') || responseBody.includes('Cloudflare'))) {
            parsedData = {
              isHtmlError: true,
              status: res.statusCode,
              message: `[Cloudflare/WAF Status ${res.statusCode}] Servidor remoto retornou página HTML de erro/proteção.`
            };
          } else {
            parsedData = responseBody;
          }
        }
        resolve({ status: res.statusCode || 500, data: parsedData });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function formatErrorDetail(data: any): any {
  if (!data) return 'Sem detalhes';
  if (data.isHtmlError) return data.message;
  if (typeof data === 'string') {
    if (data.includes('<html') || data.includes('cf-error')) {
      return '[Erro HTML/Cloudflare detectado]';
    }
    return data.slice(0, 200);
  }
  return data;
}

async function getEfipayAccessToken(creds: EfipayCredentials): Promise<string | null> {
  const isProd = creds.ambiente !== 'homologacao';
  const baseUrls = isProd
    ? ['https://pix.api.efipay.com.br', 'https://api-pix.gerencianet.com.br', 'https://pix.gerencianet.com.br']
    : ['https://pix-h.api.efipay.com.br', 'https://api-pix-h.gerencianet.com.br'];

  const authHeader = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64');

  if (!creds.certificadoBase64) {
    console.warn('[Efí Pay OAuth] AVISO: Nenhum certificado mTLS (EFI_CERTIFICADO_BASE64) configurado. A Efí Pay exige certificado mTLS para autenticação Pix.');
  }

  for (const baseUrl of baseUrls) {
    const oauthEndpoints = [`${baseUrl}/v2/oauth/token`, `${baseUrl}/oauth/token`];
    for (const tokenUrl of oauthEndpoints) {
      try {
        const res = await efipayFetch({
          method: 'POST',
          url: tokenUrl,
          headers: {
            'Authorization': `Basic ${authHeader}`
          },
          body: { grant_type: 'client_credentials' },
          certificadoBase64: creds.certificadoBase64
        });

        if (res.data && res.data.access_token) {
          return res.data.access_token;
        }
        console.warn(`[Efí Pay OAuth] Resposta sem access_token em ${tokenUrl}:`, res.status, formatErrorDetail(res.data));
      } catch (err: any) {
        console.error(`[Efí Pay OAuth] Erro ao obter token em ${tokenUrl}:`, err.message || err);
      }
    }
  }

  return null;
}

export async function gerarPixEfipay(
  input: GatewayPixInput,
  creds: EfipayCredentials
): Promise<PixGenerationResult | null> {
  const token = await getEfipayAccessToken(creds);
  if (!token) return null;

  const isProd = creds.ambiente !== 'homologacao';
  const baseUrls = isProd
    ? ['https://pix.api.efipay.com.br', 'https://api-pix.gerencianet.com.br', 'https://pix.gerencianet.com.br']
    : ['https://pix-h.api.efipay.com.br', 'https://api-pix-h.gerencianet.com.br'];

  const valorReais = Number((input.valorTotal / 100).toFixed(2));

  const bodyCob: any = {
    calendario: { expiracao: 3600 },
    valor: { original: valorReais.toFixed(2) },
    chave: creds.chavePix,
    solicitacaoPagador: `Pedido #${input.pedidoId}`.slice(0, 140)
  };

  if (input.comprador.cpf && input.comprador.cpf.replace(/\D/g, '').length === 11) {
    bodyCob.devedor = {
      cpf: input.comprador.cpf.replace(/\D/g, ''),
      nome: input.comprador.nome || 'Cliente Rifa'
    };
  }

  for (const baseUrl of baseUrls) {
    try {
      const resCob = await efipayFetch({
        method: 'POST',
        url: `${baseUrl}/v2/cob`,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: bodyCob,
        certificadoBase64: creds.certificadoBase64
      });

      const dataCob = resCob.data;
      if (!dataCob || !dataCob.txid) {
        console.warn(`[Efí Pay Pix] Falha ao criar cobrança em ${baseUrl}:`, resCob.status, formatErrorDetail(dataCob));
        continue;
      }

      const txid = dataCob.txid;
      let pixCopiaCola = dataCob.pixCopiaCola || '';
      let pixQrCodeBase64 = '';

      if (dataCob.loc && dataCob.loc.id) {
        try {
          const resQr = await efipayFetch({
            method: 'GET',
            url: `${baseUrl}/v2/loc/${dataCob.loc.id}/qrcode`,
            headers: { 'Authorization': `Bearer ${token}` },
            certificadoBase64: creds.certificadoBase64
          });
          const dataQr = resQr.data;
          if (dataQr) {
            pixCopiaCola = dataQr.qrcode || pixCopiaCola;
            if (dataQr.imagemQrcode) {
              pixQrCodeBase64 = dataQr.imagemQrcode.startsWith('data:')
                ? dataQr.imagemQrcode
                : `data:image/png;base64,${dataQr.imagemQrcode}`;
            }
          }
        } catch (e) {
          console.warn('[Efí Pay Pix] Erro ao obter QR Code:', e);
        }
      }

      return {
        paymentId: `efi_${txid}`,
        pixCopiaCola,
        pixQrCodeBase64,
        gateway: 'efipay'
      };
    } catch (err) {
      console.error(`[Efí Pay Pix] Erro na requisição em ${baseUrl}:`, err);
    }
  }

  return null;
}

export async function consultarPagamentoEfipay(paymentId: string, config?: ConfigOrganizador | null): Promise<boolean> {
  const cleanTxid = paymentId.replace(/^efi_/, '');

  const creds = resolveEfipayCredentials(config);

  if (!creds || !creds.clientId || !creds.clientSecret) {
    return false;
  }

  const token = await getEfipayAccessToken(creds);
  if (!token) return false;

  const isProd = creds.ambiente !== 'homologacao';
  const baseUrls = isProd
    ? ['https://pix.api.efipay.com.br', 'https://api-pix.gerencianet.com.br', 'https://pix.gerencianet.com.br']
    : ['https://pix-h.api.efipay.com.br', 'https://api-pix-h.gerencianet.com.br'];

  for (const baseUrl of baseUrls) {
    try {
      const res = await efipayFetch({
        method: 'GET',
        url: `${baseUrl}/v2/cob/${cleanTxid}`,
        headers: { 'Authorization': `Bearer ${token}` },
        certificadoBase64: creds.certificadoBase64
      });
      const data = res.data;
      if (data && data.status) {
        const statusUpper = String(data.status).toUpperCase();
        console.log(`[Consulta Efí Pay] Status de ${cleanTxid}:`, statusUpper);
        if (statusUpper === 'CONCLUIDA') {
          return true;
        }
        return false;
      }
    } catch (err) {
      console.error(`[Consulta Efí Pay] Erro em ${baseUrl}:`, err);
    }
  }

  return false;
}

/**
 * Consulta status de pagamento no Asaas diretamente na API
 */
export async function consultarPagamentoAsaas(paymentId: string, config?: ConfigOrganizador | null): Promise<boolean> {
  if (!config?.asaasConfig?.apiKey) {
    console.warn('[Consulta Asaas] Sem apiKey configurada no asaasConfig.');
    return false;
  }

  const rawApiKey = decryptToken(config.asaasConfig.apiKey);
  const isProd = config.asaasConfig.ambiente === 'producao';
  const cleanId = paymentId.replace(/^asaas_/, '');

  const urlsToTry = isProd
    ? ['https://api.asaas.com/v3', 'https://www.asaas.com/api/v3']
    : ['https://api-sandbox.asaas.com/v3', 'https://sandbox.asaas.com/api/v3'];

  for (const baseUrl of urlsToTry) {
    try {
      const res = await fetch(`${baseUrl}/payments/${cleanId}`, {
        headers: {
          'access_token': rawApiKey,
          'User-Agent': 'RifaZone/1.0'
        }
      });
      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch (e) {
        // Ignora HTML ou não-json
      }

      if (data && data.status) {
        console.log(`[Consulta Asaas] Status do pagamento ${cleanId}:`, data.status);
        const statusVal = String(data.status).toUpperCase();
        if (['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'DUNNING_RECEIVED'].includes(statusVal)) {
          return true;
        }
        return false;
      }
    } catch (err) {
      console.warn(`[Consulta Asaas] Erro ao consultar na URL ${baseUrl}:`, err);
    }
  }

  return false;
}

export async function testEfipayConnection(config?: ConfigOrganizador | null): Promise<{
  success: boolean;
  source: 'env' | 'database' | 'none';
  ambiente: 'producao' | 'homologacao';
  hasClientId: boolean;
  hasClientSecret: boolean;
  hasCertificado: boolean;
  hasChavePix: boolean;
  details: string;
  statusCode?: number;
  saldoReal?: number;
}> {
  const creds = resolveEfipayCredentials(config);

  if (!creds || !creds.clientId || !creds.clientSecret) {
    return {
      success: false,
      source: 'none',
      ambiente: creds?.ambiente || 'producao',
      hasClientId: !!creds?.clientId,
      hasClientSecret: !!creds?.clientSecret,
      hasCertificado: !!creds?.certificadoBase64,
      hasChavePix: !!creds?.chavePix,
      details: 'Nenhuma credencial (Client ID / Client Secret) foi encontrada nem no banco de dados nem nas Variáveis de Ambiente (process.env).'
    };
  }

  const isFromEnv = !!(process.env.EFI_CLIENT_ID || process.env.EFI_CLIENT_ID_HOMOLOGACAO);

  try {
    const isProd = creds.ambiente !== 'homologacao';
    const baseUrls = isProd
      ? ['https://pix.api.efipay.com.br', 'https://api-pix.gerencianet.com.br']
      : ['https://pix-h.api.efipay.com.br', 'https://api-pix-h.gerencianet.com.br'];

    const authHeader = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64');

    if (!creds.certificadoBase64) {
      return {
        success: false,
        source: isFromEnv ? 'env' : 'database',
        ambiente: creds.ambiente || 'producao',
        hasClientId: true,
        hasClientSecret: true,
        hasCertificado: false,
        hasChavePix: !!creds.chavePix,
        details: 'Client ID e Client Secret encontrados, porém NENHUM CERTIFICADO mTLS (EFI_CERTIFICADO_BASE64) foi configurado nas envs. A Efí Pay exige certificado mTLS para chamadas Pix.'
      };
    }

    for (const baseUrl of baseUrls) {
      const endpoints = [`${baseUrl}/oauth/token`, `${baseUrl}/v2/oauth/token`];
      for (const tokenUrl of endpoints) {
        const res = await efipayFetch({
          method: 'POST',
          url: tokenUrl,
          headers: { 'Authorization': `Basic ${authHeader}` },
          body: { grant_type: 'client_credentials' },
          certificadoBase64: creds.certificadoBase64
        });

        if (res.data && res.data.access_token) {
          let saldoReal: number | undefined = undefined;
          try {
            const resSaldo = await consultarSaldoEfipay(config);
            if (resSaldo.success) {
              saldoReal = resSaldo.saldoReal;
            }
          } catch (e) {}

          return {
            success: true,
            source: isFromEnv ? 'env' : 'database',
            ambiente: creds.ambiente || 'producao',
            hasClientId: true,
            hasClientSecret: true,
            hasCertificado: true,
            hasChavePix: !!creds.chavePix,
            statusCode: res.status,
            saldoReal,
            details: `Conexão efetuada com SUCESSO! Token OAuth obtido da API Efí Pay (${creds.ambiente.toUpperCase()}) na URL (${tokenUrl}).`
          };
        } else if (tokenUrl === endpoints[endpoints.length - 1]) {
          const errorMsg = formatErrorDetail(res.data);
          return {
            success: false,
            source: isFromEnv ? 'env' : 'database',
            ambiente: creds.ambiente || 'producao',
            hasClientId: true,
            hasClientSecret: true,
            hasCertificado: true,
            hasChavePix: !!creds.chavePix,
            statusCode: res.status,
            details: `Falha na requisição OAuth Efí Pay (Status ${res.status}): ${typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg}`
          };
        }
      }
    }

    return {
      success: false,
      source: isFromEnv ? 'env' : 'database',
      ambiente: creds.ambiente || 'producao',
      hasClientId: true,
      hasClientSecret: true,
      hasCertificado: true,
      hasChavePix: !!creds.chavePix,
      details: 'Não foi possível conectar com as URLs da Efí Pay.'
    };
  } catch (err: any) {
    return {
      success: false,
      source: isFromEnv ? 'env' : 'database',
      ambiente: creds.ambiente || 'producao',
      hasClientId: true,
      hasClientSecret: true,
      hasCertificado: !!creds.certificadoBase64,
      hasChavePix: !!creds.chavePix,
      details: `Erro ao conectar com a Efí Pay: ${err.message || err}`
    };
  }
}

/**
 * Consulta o Saldo Real da Conta Bancária Efí Pay diretamente via API
 */
export async function consultarSaldoEfipay(config?: ConfigOrganizador | null): Promise<{
  success: boolean;
  saldoReal?: number;
  detalhes?: string;
}> {
  const creds = resolveEfipayCredentials(config);
  if (!creds || !creds.clientId || !creds.clientSecret) {
    return { success: false, detalhes: 'Credenciais Efí Pay não configuradas.' };
  }

  const token = await getEfipayAccessToken(creds);
  if (!token) {
    return { success: false, detalhes: 'Não foi possível obter token OAuth da Efí Pay.' };
  }

  const isProd = creds.ambiente !== 'homologacao';
  const baseUrls = isProd
    ? ['https://pix.api.efipay.com.br', 'https://api-pix.gerencianet.com.br']
    : ['https://pix-h.api.efipay.com.br', 'https://api-pix-h.gerencianet.com.br'];

  for (const baseUrl of baseUrls) {
    const endpoints = [`${baseUrl}/v2/gn/saldo`, `${baseUrl}/v2/saldo`, `${baseUrl}/v2/gn/saldo/`];
    for (const url of endpoints) {
      try {
        const res = await efipayFetch({
          method: 'GET',
          url,
          headers: { 'Authorization': `Bearer ${token}` },
          certificadoBase64: creds.certificadoBase64
        });

        if (res.data && (res.data.saldo !== undefined || res.data.saldoDisponivel !== undefined)) {
          const rawSaldo = res.data.saldo !== undefined ? res.data.saldo : res.data.saldoDisponivel;
          const saldoNum = Number(rawSaldo);
          if (!isNaN(saldoNum)) {
            return {
              success: true,
              saldoReal: saldoNum,
              detalhes: 'Saldo obtido diretamente da API Efí Pay.'
            };
          }
        }
      } catch (err: any) {
        console.warn(`[Efí Pay Saldo] Erro na URL ${url}:`, err?.message || err);
      }
    }
  }

  return { success: false, detalhes: 'Endpoint de saldo não respondeu.' };
}

/**
 * Envia um Pix diretamente para a chave do destinatário via API da Efí Pay
 */
export async function enviarPixEfipay(params: {
  valor: number;
  chavePixDestino: string;
  descricao?: string;
  idEnvio?: string;
  config?: ConfigOrganizador | null;
}): Promise<{
  success: boolean;
  statusPix?: string;
  e2eId?: string;
  detalhes?: string;
}> {
  const creds = resolveEfipayCredentials(params.config);
  if (!creds || !creds.clientId || !creds.clientSecret) {
    return { success: false, detalhes: 'Credenciais Efí Pay não configuradas.' };
  }

  const token = await getEfipayAccessToken(creds);
  if (!token) {
    return { success: false, detalhes: 'Não foi possível obter autenticação com a Efí Pay para envio de Pix.' };
  }

  const isProd = creds.ambiente !== 'homologacao';
  const baseUrls = isProd
    ? ['https://pix.api.efipay.com.br', 'https://api-pix.gerencianet.com.br']
    : ['https://pix-h.api.efipay.com.br', 'https://api-pix-h.gerencianet.com.br'];

  let idEnvioClean = (params.idEnvio || `envio${Date.now()}`).replace(/[^a-zA-Z0-9]/g, '');
  if (idEnvioClean.length < 26) {
    idEnvioClean = idEnvioClean.padEnd(26, '0');
  } else if (idEnvioClean.length > 35) {
    idEnvioClean = idEnvioClean.slice(0, 35);
  }

  const chaveOrigem = creds.chavePix || process.env.EFI_CHAVE_PIX || '';

  const bodyEnvio: any = {
    valor: params.valor.toFixed(2),
    pagador: {
      chave: chaveOrigem.trim()
    },
    favorecido: {
      chave: params.chavePixDestino.trim()
    }
  };

  for (const baseUrl of baseUrls) {
    const url = `${baseUrl}/v2/gn/pix/${idEnvioClean}`;
    try {
      const res = await efipayFetch({
        method: 'PUT',
        url,
        headers: { 'Authorization': `Bearer ${token}` },
        body: bodyEnvio,
        certificadoBase64: creds.certificadoBase64
      });

      const data = res.data;
      const isStatusOk = res.status === 200 || res.status === 201;
      const hasErrorPayload = !!(data && (data.error || data.erro || data.codigo || data.mensagem || data.nome));
      const isTransferSuccess = !!(data && (data.status === 'EM_PROCESSAMENTO' || data.status === 'REALIZADO' || data.e2eId));

      if (isStatusOk && !hasErrorPayload && isTransferSuccess) {
        return {
          success: true,
          statusPix: data?.status || (data?.e2eId ? 'REALIZADO' : 'EM_PROCESSAMENTO'),
          e2eId: data?.e2eId || data?.idEnvio || idEnvioClean,
          detalhes: 'Pix enviado com sucesso via Efí Pay!'
        };
      } else {
        const errDetail = formatErrorDetail(data);
        console.warn(`[Efí Envio Pix] Falha no envio (${res.status}):`, errDetail);
        return {
          success: false,
          detalhes: typeof errDetail === 'object' ? JSON.stringify(errDetail) : String(errDetail)
        };
      }
    } catch (err: any) {
      console.error(`[Efí Envio Pix] Exceção ao enviar Pix via ${baseUrl}:`, err);
    }
  }

  return { success: false, detalhes: 'Não foi possível realizar o envio do Pix pela Efí Pay.' };
}

/**
 * Consulta o status de um envio Pix realizado via Efí Pay para saber se o dinheiro realmente saiu da conta
 */
export async function consultarEnvioPixEfipay(params: {
  idEnvio?: string;
  e2eId?: string;
  config?: ConfigOrganizador | null;
}): Promise<{
  success: boolean;
  statusPix: 'REALIZADO' | 'EM_PROCESSAMENTO' | 'NAO_REALIZADO' | 'DEVOLVIDO' | 'NAO_ENCONTRADO';
  e2eId?: string;
  valor?: number;
  horario?: string;
  detalhes: string;
}> {
  const creds = resolveEfipayCredentials(params.config);
  if (!creds || !creds.clientId || !creds.clientSecret) {
    return { success: false, statusPix: 'NAO_ENCONTRADO', detalhes: 'Credenciais Efí Pay não configuradas.' };
  }

  const token = await getEfipayAccessToken(creds);
  if (!token) {
    return { success: false, statusPix: 'NAO_ENCONTRADO', detalhes: 'Não foi possível obter token OAuth da Efí Pay.' };
  }

  const isProd = creds.ambiente !== 'homologacao';
  const baseUrls = isProd
    ? ['https://pix.api.efipay.com.br', 'https://api-pix.gerencianet.com.br']
    : ['https://pix-h.api.efipay.com.br', 'https://api-pix-h.gerencianet.com.br'];

  // 1. Consulta pelo idEnvio (GET /v2/gn/pix/{idEnvio})
  if (params.idEnvio) {
    let idClean = params.idEnvio.replace(/[^a-zA-Z0-9]/g, '');
    if (idClean.length < 26) {
      idClean = idClean.padEnd(26, '0');
    } else if (idClean.length > 35) {
      idClean = idClean.slice(0, 35);
    }

    for (const baseUrl of baseUrls) {
      const url = `${baseUrl}/v2/gn/pix/${idClean}`;
      try {
        const res = await efipayFetch({
          method: 'GET',
          url,
          headers: { 'Authorization': `Bearer ${token}` },
          certificadoBase64: creds.certificadoBase64
        });

        if (res.status === 200 && res.data) {
          const data = res.data;
          const statusUpper = String(data.status || '').toUpperCase();
          if (statusUpper === 'REALIZADO' || statusUpper === 'CONCLUIDA' || statusUpper === 'PAGO' || statusUpper === 'LIQUIDADO') {
            return {
              success: true,
              statusPix: 'REALIZADO',
              e2eId: data.e2eId || idClean,
              valor: Number(data.valor) || undefined,
              horario: data.horario || data.criacao,
              detalhes: 'Pix confirmado e liquidado com sucesso pela instituição financeira na Efí Pay.'
            };
          } else if (statusUpper === 'EM_PROCESSAMENTO' || statusUpper === 'PROCESSANDO') {
            return {
              success: true,
              statusPix: 'EM_PROCESSAMENTO',
              detalhes: 'Pix ainda consta em processamento no Banco Central / Efí Pay.'
            };
          } else if (statusUpper === 'NAO_REALIZADO' || statusUpper === 'DEVOLVIDO' || statusUpper === 'CANCELADO' || statusUpper === 'REJEITADO' || statusUpper === 'ERRO') {
            return {
              success: true,
              statusPix: 'NAO_REALIZADO',
              detalhes: `Pix não foi realizado pela instituição financeira (Status: ${statusUpper}).`
            };
          }
        }
      } catch (err: any) {
        console.warn(`[Efí Consulta Envio Pix] Erro ao consultar ${url}:`, err?.message || err);
      }
    }
  }

  // 2. Consulta pelo EndToEndId (GET /v2/pix/{e2eId})
  if (params.e2eId && params.e2eId.startsWith('E')) {
    for (const baseUrl of baseUrls) {
      const url = `${baseUrl}/v2/pix/${params.e2eId}`;
      try {
        const res = await efipayFetch({
          method: 'GET',
          url,
          headers: { 'Authorization': `Bearer ${token}` },
          certificadoBase64: creds.certificadoBase64
        });

        if (res.status === 200 && res.data) {
          const data = res.data;
          return {
            success: true,
            statusPix: 'REALIZADO',
            e2eId: data.endToEndId || params.e2eId,
            valor: Number(data.valor) || undefined,
            horario: data.horario,
            detalhes: 'Pix confirmado com sucesso na Efí Pay pelo EndToEndId.'
          };
        }
      } catch (err: any) {}
    }
  }

  return {
    success: false,
    statusPix: 'NAO_ENCONTRADO',
    detalhes: 'Nenhuma liquidação de saída Pix encontrada para esta solicitação na Efí Pay.'
  };
}

/**
 * Registra o webhook para uma chave Pix específica na Efí Pay
 */
export async function registrarWebhookEfipay(params: {
  chavePix: string;
  webhookUrl: string;
  config?: ConfigOrganizador | null;
}): Promise<{
  success: boolean;
  detalhes: string;
}> {
  const creds = resolveEfipayCredentials(params.config);
  if (!creds || !creds.clientId || !creds.clientSecret) {
    return { success: false, detalhes: 'Credenciais Efí Pay não configuradas.' };
  }

  const token = await getEfipayAccessToken(creds);
  if (!token) {
    return { success: false, detalhes: 'Não foi possível obter token OAuth da Efí Pay.' };
  }

  const isProd = creds.ambiente !== 'homologacao';
  const baseUrls = isProd
    ? ['https://pix.api.efipay.com.br', 'https://api-pix.gerencianet.com.br']
    : ['https://pix-h.api.efipay.com.br', 'https://api-pix-h.gerencianet.com.br'];

  const chaveClean = params.chavePix.trim();
  const webhookUrlClean = params.webhookUrl.trim();

  for (const baseUrl of baseUrls) {
    const url = `${baseUrl}/v2/webhook/${chaveClean}`;
    try {
      console.log(`[Efí Webhook] Tentando registrar webhook para ${chaveClean} em ${url}`);
      const res = await efipayFetch({
        method: 'PUT',
        url,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-skip-mtls-checking': 'true'
        },
        body: {
          webhookUrl: webhookUrlClean
        },
        certificadoBase64: creds.certificadoBase64
      });

      if (res.status === 200 || res.status === 201 || (res.data && res.data.webhookUrl)) {
        return {
          success: true,
          detalhes: `Webhook registrado com sucesso para a chave ${chaveClean} na Efí Pay!`
        };
      } else {
        const errDetail = formatErrorDetail(res.data);
        console.warn(`[Efí Webhook] Falha ao registrar webhook (${res.status}):`, errDetail);
        return {
          success: false,
          detalhes: typeof errDetail === 'object' ? JSON.stringify(errDetail) : String(errDetail)
        };
      }
    } catch (err: any) {
      console.error(`[Efí Webhook] Exceção ao registrar webhook via ${baseUrl}:`, err);
    }
  }

  return { success: false, detalhes: 'Não foi possível registrar o webhook na Efí Pay.' };
}


