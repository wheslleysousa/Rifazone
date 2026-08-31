import nodemailer from 'nodemailer';

export interface NotificacaoPayload {
  destinatarioEmail?: string | null;
  destinatarioTelefone?: string;
  nomeComprador: string;
  tituloCampanha: string;
  mensagemTexto: string;
  linkCheckout?: string;
  cupom?: string;
  pedidoId?: string;
  numeros?: string[];
  valorTotalFormatado?: string;
  tipo?: 'pago' | 'sorteio' | 'lembrete' | 'expirado' | 'cota_premiada';
}

export interface NotificadorResult {
  sucesso: boolean;
  id?: string;
  provedor?: 'twilio' | 'whatsapp_cloud_api' | 'notificame' | 'smtp' | 'resend' | 'sendgrid' | 'nenhum';
  erro?: string;
}

export interface Notificador {
  enviarEmail?(payload: NotificacaoPayload): Promise<NotificadorResult>;
  enviarWhatsApp?(payload: NotificacaoPayload): Promise<NotificadorResult>;
  enviarWhatsAppCloudApi?(payload: NotificacaoPayload): Promise<NotificadorResult>;
}

export class EmailNotificador implements Notificador {
  private resendApiKey?: string;
  private sendGridApiKey?: string;
  private emailFrom: string;
  private smtpHost: string;
  private smtpPort: number;
  private smtpUser?: string;
  private smtpPass?: string;

  constructor() {
    this.resendApiKey = process.env.RESEND_API_KEY?.trim();
    this.sendGridApiKey = process.env.SENDGRID_API_KEY?.trim();
    this.emailFrom = process.env.EMAIL_FROM?.trim() || 'rifazone@notificacoes.com';
    this.smtpHost = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
    this.smtpPort = Number(process.env.SMTP_PORT) || 465;
    this.smtpUser = process.env.SMTP_USER?.trim();
    this.smtpPass = process.env.SMTP_PASS?.trim();
  }

  async enviarEmail(payload: NotificacaoPayload): Promise<NotificadorResult> {
    if (!payload.destinatarioEmail) {
      return { sucesso: false, erro: 'Destinatário sem e-mail cadastrado', provedor: 'nenhum' };
    }

    const assunto = `RifaZone: ${payload.tipo === 'sorteio' ? '🎉 Resultado do Sorteio' : '✅ Pagamento Confirmado'} - ${payload.tituloCampanha}`;
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #059669; margin: 0; font-size: 22px; font-weight: 800;">${payload.tituloCampanha}</h2>
          <span style="font-size: 12px; font-weight: 700; color: #10b981; background: #ecfdf5; padding: 4px 12px; border-radius: 9999px; display: inline-block; margin-top: 6px;">Comprovante & Notificação Oficial</span>
        </div>
        <p style="font-size: 15px; color: #334155; line-height: 1.5;">Olá, <strong>${payload.nomeComprador}</strong>!</p>
        <div style="font-size: 14px; color: #475569; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9; line-height: 1.6; white-space: pre-line;">${payload.mensagemTexto}</div>
        
        ${payload.linkCheckout ? `
          <div style="margin-top: 24px; text-align: center;">
            <a href="${payload.linkCheckout}" style="background-color: #10b981; color: #022c22; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 10px; display: inline-block; font-size: 15px;">
              Acessar Minhas Cotas no Site
            </a>
          </div>
        ` : ''}
        
        ${payload.cupom ? `
          <p style="margin-top: 16px; font-size: 13px; color: #64748b; text-align: center;">
            Cupom de Desconto Especial: <strong style="color: #0f172a; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${payload.cupom}</strong>
          </p>
        ` : ''}

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center;">
          Esta mensagem foi gerada automaticamente pela plataforma RifaZone. Guarde este e-mail para seu controle.
        </div>
      </div>
    `;

    // 1. SMTP (Gmail ou Servidor Próprio)
    if (this.smtpUser && this.smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: this.smtpHost,
          port: this.smtpPort,
          secure: this.smtpPort === 465,
          auth: {
            user: this.smtpUser,
            pass: this.smtpPass,
          },
        });

        const remetente = this.smtpUser;
        const info = await transporter.sendMail({
          from: remetente,
          to: payload.destinatarioEmail,
          subject: assunto,
          html: htmlBody,
        });

        console.log(`[EmailNotificador - SMTP] E-mail enviado com sucesso para ${payload.destinatarioEmail}. MessageId: ${info.messageId}`);
        return { sucesso: true, id: info.messageId, provedor: 'smtp' };
      } catch (err: any) {
        console.error('[EmailNotificador - SMTP] Erro ao enviar por SMTP:', err);
        return { sucesso: false, erro: err.message || String(err), provedor: 'smtp' };
      }
    }

    // 2. Resend API
    if (this.resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: this.emailFrom,
            to: [payload.destinatarioEmail],
            subject: assunto,
            html: htmlBody
          })
        });

        const data = await response.json();
        if (response.ok) {
          console.log(`[EmailNotificador - Resend] E-mail enviado com sucesso para ${payload.destinatarioEmail}`);
          return { sucesso: true, id: data.id || 'resend_' + Date.now(), provedor: 'resend' };
        } else {
          console.error('[EmailNotificador - Resend] Erro ao enviar:', data);
        }
      } catch (err: any) {
        console.error('[EmailNotificador - Resend] Exceção:', err);
      }
    }

    // 3. SendGrid API
    if (this.sendGridApiKey) {
      try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.sendGridApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: payload.destinatarioEmail }] }],
            from: { email: this.emailFrom },
            subject: assunto,
            content: [{ type: 'text/html', value: htmlBody }]
          })
        });

        if (response.ok) {
          console.log(`[EmailNotificador - SendGrid] E-mail enviado para ${payload.destinatarioEmail}`);
          return { sucesso: true, id: 'sendgrid_' + Date.now(), provedor: 'sendgrid' };
        }
      } catch (err: any) {
        console.error('[EmailNotificador - SendGrid] Exceção:', err);
      }
    }

    return {
      sucesso: false,
      erro: 'Nenhum canal de e-mail (SMTP, Resend ou SendGrid) configurado no servidor',
      provedor: 'nenhum'
    };
  }
}

/**
 * Notificador WhatsApp via Twilio Messaging API Oficial
 * Requer TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_WHATSAPP_NUMBER
 */
export class TwilioWhatsAppNotificador implements Notificador {
  private accountSid?: string;
  private authToken?: string;
  private fromNumber?: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    this.authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER?.trim() || process.env.TWILIO_PHONE_NUMBER?.trim();
  }

  isConfigured(): boolean {
    return Boolean(this.accountSid && this.authToken && this.fromNumber);
  }

  async enviarWhatsApp(payload: NotificacaoPayload): Promise<NotificadorResult> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      return {
        sucesso: false,
        erro: 'Twilio WhatsApp não configurado (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN ou TWILIO_WHATSAPP_NUMBER ausentes)',
        provedor: 'twilio'
      };
    }

    if (!payload.destinatarioTelefone) {
      return { sucesso: false, erro: 'Destinatário sem telefone informado', provedor: 'twilio' };
    }

    try {
      const telClean = payload.destinatarioTelefone.replace(/\D/g, '');
      const toPhone = telClean.startsWith('55') ? `+${telClean}` : `+55${telClean}`;
      const fromFormatted = this.fromNumber.startsWith('whatsapp:')
        ? this.fromNumber
        : `whatsapp:${this.fromNumber.startsWith('+') ? this.fromNumber : `+${this.fromNumber}`}`;
      const toFormatted = `whatsapp:${toPhone}`;

      const basicAuth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', toFormatted);
      params.append('From', fromFormatted);
      params.append('Body', payload.mensagemTexto);

      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[TwilioWhatsApp] Erro no envio:', data);
        return {
          sucesso: false,
          erro: data?.message || data?.error_message || `HTTP ${response.status}`,
          provedor: 'twilio'
        };
      }

      console.log(`[TwilioWhatsApp] Mensagem WhatsApp enviada com sucesso para ${toFormatted}. SID: ${data.sid}`);
      return {
        sucesso: true,
        id: data.sid,
        provedor: 'twilio'
      };
    } catch (err: any) {
      console.error('[TwilioWhatsApp] Exceção no envio:', err);
      return {
        sucesso: false,
        erro: err.message || String(err),
        provedor: 'twilio'
      };
    }
  }
}

/**
 * Notificador WhatsApp via Meta WhatsApp Cloud API Oficial
 * Requer WHATSAPP_CLOUD_API_TOKEN e WHATSAPP_CLOUD_PHONE_ID
 */
export class WhatsAppCloudApiNotificador implements Notificador {
  private apiToken?: string;
  private phoneAccountId?: string;

  constructor() {
    this.apiToken = process.env.WHATSAPP_CLOUD_API_TOKEN?.trim();
    this.phoneAccountId = process.env.WHATSAPP_CLOUD_PHONE_ID?.trim();
  }

  isConfigured(): boolean {
    return Boolean(this.apiToken && this.phoneAccountId);
  }

  async enviarWhatsApp(payload: NotificacaoPayload): Promise<NotificadorResult> {
    return this.enviarWhatsAppCloudApi(payload);
  }

  async enviarWhatsAppCloudApi(payload: NotificacaoPayload): Promise<NotificadorResult> {
    if (!this.apiToken || !this.phoneAccountId) {
      return {
        sucesso: false,
        erro: 'WhatsApp Cloud API não configurada (WHATSAPP_CLOUD_API_TOKEN ou WHATSAPP_CLOUD_PHONE_ID ausentes)',
        provedor: 'whatsapp_cloud_api'
      };
    }

    if (!payload.destinatarioTelefone) {
      return { sucesso: false, erro: 'Destinatário sem telefone informado', provedor: 'whatsapp_cloud_api' };
    }

    try {
      const telClean = payload.destinatarioTelefone.replace(/\D/g, '');
      const to = telClean.startsWith('55') ? telClean : `55${telClean}`;

      const response = await fetch(`https://graph.facebook.com/v18.0/${this.phoneAccountId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: {
            preview_url: true,
            body: payload.mensagemTexto
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[WhatsAppCloudApi] Erro no envio:', data);
        return {
          sucesso: false,
          erro: data?.error?.message || 'Falha ao enviar mensagem via WhatsApp Cloud API',
          provedor: 'whatsapp_cloud_api'
        };
      }

      console.log(`[WhatsAppCloudApi] Mensagem enviada com sucesso para ${to}. MessageId: ${data?.messages?.[0]?.id}`);
      return {
        sucesso: true,
        id: data?.messages?.[0]?.id || `wa_${Date.now()}`,
        provedor: 'whatsapp_cloud_api'
      };
    } catch (err: any) {
      console.error('[WhatsAppCloudApi] Exceção no envio:', err);
      return {
        sucesso: false,
        erro: err.message || String(err),
        provedor: 'whatsapp_cloud_api'
      };
    }
  }
}

/**
 * Notificador Central Unificado para WhatsApp
 * Orquestra Twilio, Meta WhatsApp Cloud API e Notificame
 */
export class WhatsAppNotificadorCentral implements Notificador {
  private twilio: TwilioWhatsAppNotificador;
  private cloudApi: WhatsAppCloudApiNotificador;
  private notificameToken?: string;
  private notificameUrl: string;

  constructor() {
    this.twilio = new TwilioWhatsAppNotificador();
    this.cloudApi = new WhatsAppCloudApiNotificador();
    this.notificameToken = process.env.NOTIFICAME_API_TOKEN?.trim();
    this.notificameUrl = process.env.NOTIFICAME_API_URL?.trim() || 'https://api.notificame.com.br/v1/send';
  }

  async enviarWhatsApp(payload: NotificacaoPayload): Promise<NotificadorResult> {
    // 1. Tenta Twilio se configurado
    if (this.twilio.isConfigured()) {
      const resTwilio = await this.twilio.enviarWhatsApp(payload);
      if (resTwilio.sucesso) return resTwilio;
      console.warn('[WhatsAppCentral] Twilio falhou, tentando fallback...');
    }

    // 2. Tenta Meta WhatsApp Cloud API se configurada
    if (this.cloudApi.isConfigured()) {
      const resCloud = await this.cloudApi.enviarWhatsAppCloudApi(payload);
      if (resCloud.sucesso) return resCloud;
      console.warn('[WhatsAppCentral] WhatsApp Cloud API falhou, tentando fallback...');
    }

    // 3. Tenta Notificame / Gateway API se configurado
    if (this.notificameToken && payload.destinatarioTelefone) {
      try {
        const telClean = payload.destinatarioTelefone.replace(/\D/g, '');
        const to = telClean.startsWith('55') ? telClean : `55${telClean}`;
        const response = await fetch(this.notificameUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': this.notificameToken,
            'Authorization': `Bearer ${this.notificameToken}`
          },
          body: JSON.stringify({
            to,
            number: to,
            message: payload.mensagemTexto,
            body: payload.mensagemTexto,
            type: 'text'
          })
        });

        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          console.log(`[WhatsAppCentral - Notificame] Mensagem enviada para ${to}`);
          return { sucesso: true, id: data.id || `notificame_${Date.now()}`, provedor: 'notificame' };
        }
      } catch (err: any) {
        console.error('[WhatsAppCentral - Notificame] Exceção:', err);
      }
    }

    // Se nenhum canal configurado ou todos falharam
    return {
      sucesso: false,
      erro: 'Nenhum provedor WhatsApp ativo (configure TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN ou WHATSAPP_CLOUD_API_TOKEN ou NOTIFICAME_API_TOKEN)',
      provedor: 'nenhum'
    };
  }
}

/**
 * Função utilitária para disparo direto e unificado de WhatsApp
 */
export async function enviarNotificacaoWhatsApp(payload: NotificacaoPayload): Promise<NotificadorResult> {
  const central = new WhatsAppNotificadorCentral();
  return central.enviarWhatsApp(payload);
}
