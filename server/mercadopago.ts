import { MercadoPagoConfig, Payment } from 'mercadopago';

interface CreatePixParams {
  pedidoId: string;
  valorTotal: number;
  tituloCampanha: string;
  comprador: {
    nome: string;
    whatsapp: string;
    cpf?: string | null;
    email?: string | null;
  };
  expiraEm: Date;
}

export interface PixResult {
  paymentId: string;
  pixCopiaCola: string;
  pixQrCodeBase64: string;
  isMock: boolean;
}

export class MercadoPagoService {
  constructor() {
    if (process.env.MP_ACCESS_TOKEN?.trim()) {
      console.log('Mercado Pago: token global (env) disponível como fallback.');
    } else {
      console.log('MP_ACCESS_TOKEN global não definido. Cada organizador usa o próprio token; sem token = Modo Simulação.');
    }
  }

  // Constrói uma instância da API de pagamento para um token específico do organizador.
  private buildApi(accessToken?: string | null): Payment | null {
    const token = (accessToken || process.env.MP_ACCESS_TOKEN || '').trim();
    if (!token) return null;
    try {
      const client = new MercadoPagoConfig({ accessToken: token, options: { timeout: 10000 } });
      return new Payment(client);
    } catch (err) {
      console.error('Erro ao inicializar SDK Mercado Pago:', err);
      return null;
    }
  }

  // Indica se há ao menos um token global configurado (fallback).
  public isConfigured(): boolean {
    return !!process.env.MP_ACCESS_TOKEN?.trim();
  }

  // Cria o Pix. Se accessToken (do organizador dono da campanha) for informado,
  // o pagamento cai na conta Mercado Pago DELE. Sem token válido -> modo simulação.
  public async criarPix(params: CreatePixParams, accessToken?: string | null): Promise<PixResult> {
    const { pedidoId, valorTotal, tituloCampanha, comprador, expiraEm } = params;

    const token = (accessToken || process.env.MP_ACCESS_TOKEN || '').trim();
    const paymentApi = this.buildApi(token);

    // Se temos um token configurado pelo organizador ou no ambiente
    if (token && paymentApi) {
      const isTestToken = token.startsWith('TEST-');

      try {
        const baseUrl = process.env.BASE_URL || process.env.APP_URL || '';
        const notificationUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/webhooks/mercadopago` : undefined;

        const cleanCpf = comprador.cpf ? comprador.cpf.replace(/\D/g, '') : '';
        const nameParts = comprador.nome.trim().split(' ');
        const firstName = nameParts[0] || 'Comprador';
        const lastName = nameParts.slice(1).join(' ') || 'Cliente';

        // E-mail válido
        let email = comprador.email?.trim();
        if (!email || !email.includes('@')) {
          email = `cliente_${comprador.whatsapp.replace(/\D/g, '') || Date.now()}@rifazone.app`;
        }

        const body: any = {
          transaction_amount: Number(valorTotal.toFixed(2)),
          description: `Pedido ${pedidoId} - ${tituloCampanha.slice(0, 50)}`,
          payment_method_id: 'pix',
          payer: {
            email,
            first_name: firstName,
            last_name: lastName,
            ...(cleanCpf.length === 11 ? { identification: { type: 'CPF', number: cleanCpf } } : {})
          },
          date_of_expiration: expiraEm.toISOString(),
          external_reference: pedidoId,
          ...(notificationUrl ? { notification_url: notificationUrl } : {})
        };

        const response = await paymentApi.create({
          body,
          requestOptions: {
            idempotencyKey: pedidoId
          }
        });

        const td = (response as any).point_of_interaction?.transaction_data;
        const qrCode = td?.qr_code || '';
        const qrCodeBase64 = td?.qr_code_base64 || '';

        if (!qrCode) {
          throw new Error('Mercado Pago criou a transação mas não retornou o código Pix Copia e Cola.');
        }

        return {
          paymentId: String(response.id),
          pixCopiaCola: qrCode,
          pixQrCodeBase64: qrCodeBase64,
          isMock: false
        };
      } catch (error: any) {
        console.error('Erro na chamada Mercado Pago API:', error);
        
        let errorMsg = error?.message || 'Falha ao comunicar com o Mercado Pago.';
        if (error?.cause) {
          try {
            errorMsg += ` Detalhes: ${JSON.stringify(error.cause)}`;
          } catch (e) {
            // ignore json parse
          }
        }

        if (isTestToken) {
          errorMsg += ' [AVISO: Você está usando um Access Token de TESTE (TEST-...). Para gerar Pix que bancos reais aceitam pagar, use o Access Token de PRODUÇÃO (APP_USR-...).]';
        }

        const customErr: any = new Error(errorMsg);
        customErr.mpError = true;
        customErr.isTestToken = isTestToken;
        customErr.details = error?.cause || error?.message || error;
        throw customErr;
      }
    }

    // Caso NÃO haja NENHUM token configurado: gera simulação para teste local da UI
    const mockPaymentId = `mock_mp_${Date.now()}`;
    const mockPixCopiaCola = `00020126580014br.gov.bcb.pix0136${pedidoId}520400005303986540${valorTotal.toFixed(2).length}${valorTotal.toFixed(2)}5802BR5915RIFAZONE OFICIAL6009SAO PAULO62070503***6304E8A2`;
    
    // Gerar um SVG QR Code válido codificado em Base64
    const qrSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="#ffffff"/><path d="M20,20 h60 v60 h-60 z M30,30 v40 h40 v-40 z M40,40 h20 v20 h-20 z" fill="#0f172a"/><path d="M120,20 h60 v60 h-60 z M130,30 v40 h40 v-40 z M140,40 h20 v20 h-20 z" fill="#0f172a"/><path d="M20,120 h60 v60 h-60 z M30,130 v40 h40 v-40 z M40,140 h20 v20 h-20 z" fill="#0f172a"/><rect x="90" y="20" width="20" height="40" fill="#00a650"/><rect x="90" y="70" width="40" height="20" fill="#0f172a"/><rect x="140" y="90" width="40" height="20" fill="#00a650"/><rect x="90" y="120" width="20" height="60" fill="#0f172a"/><rect x="120" y="120" width="60" height="20" fill="#0f172a"/><rect x="120" y="150" width="30" height="30" fill="#00a650"/><text x="100" y="105" font-family="sans-serif" font-size="12" font-weight="bold" fill="#00a650" text-anchor="middle">PIX</text></svg>`;
    const mockQrCodeBase64 = Buffer.from(qrSvg).toString('base64');

    return {
      paymentId: mockPaymentId,
      pixCopiaCola: mockPixCopiaCola,
      pixQrCodeBase64: mockQrCodeBase64,
      isMock: true
    };
  }

  // Consulta um pagamento usando o token do organizador dono da campanha (ou o global).
  public async consultarPagamento(
    paymentId: string,
    accessToken?: string | null
  ): Promise<{ status: string; approved: boolean; external_reference?: string } | null> {
    if (!paymentId || paymentId.startsWith('mock_') || paymentId.startsWith('simulado_')) {
      return null;
    }

    const paymentApi = this.buildApi(accessToken);
    if (paymentApi) {
      try {
        const response = await paymentApi.get({ id: paymentId });
        return {
          status: response.status || 'unknown',
          approved: response.status === 'approved',
          external_reference: (response as any).external_reference
        };
      } catch (err: any) {
        console.error('Erro ao consultar pagamento no Mercado Pago:', err?.message || err);
      }
    }
    return null;
  }
}

export const mpService = new MercadoPagoService();
