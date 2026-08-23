import nodemailer from 'nodemailer';

export interface NotificacaoPayload {
  destinatarioEmail?: string | null;
  destinatarioTelefone?: string;
  nomeComprador: string;
  tituloCampanha: string;
  mensagemTexto: string;
  linkCheckout?: string;
  cupom?: string;
}

export interface NotificadorResult {
  sucesso: boolean;
  id?: string;
  erro?: string;
}

export interface Notificador {
  enviarEmail(payload: NotificacaoPayload): Promise<NotificadorResult>;
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
      return { sucesso: false, erro: 'Destinatário sem e-mail cadastrado' };
    }

    const assunto = `RifaZone: Notificação de ${payload.tituloCampanha}`;
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #059669; margin-top: 0;">${payload.tituloCampanha}</h2>
        <p style="font-size: 15px; color: #334155;">Olá, <strong>${payload.nomeComprador}</strong>!</p>
        <p style="font-size: 14px; color: #475569; white-space: pre-line;">${payload.mensagemTexto}</p>
        ${payload.linkCheckout ? `
          <div style="margin-top: 20px; text-align: center;">
            <a href="${payload.linkCheckout}" style="background-color: #10b981; color: #022c22; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">
              Garantir Meus Números Agora
            </a>
          </div>
        ` : ''}
        ${payload.cupom ? `
          <p style="margin-top: 15px; font-size: 13px; color: #64748b; text-align: center;">
            Cupom de Desconto: <strong>${payload.cupom}</strong>
          </p>
        ` : ''}
      </div>
    `;

    // 1. Tenta envio por SMTP se SMTP_USER e SMTP_PASS existirem
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

        // O remetente do e-mail deve ser SMTP_USER quando usar Gmail.
        const remetente = this.smtpUser;

        const info = await transporter.sendMail({
          from: remetente,
          to: payload.destinatarioEmail,
          subject: assunto,
          html: htmlBody,
        });

        console.log(`[EmailNotificador - SMTP] E-mail enviado com sucesso para ${payload.destinatarioEmail}. MessageId: ${info.messageId}`);
        return { sucesso: true, id: info.messageId };
      } catch (err: any) {
        console.error('[EmailNotificador - SMTP] Erro ao enviar por SMTP:', err);
        return { sucesso: false, erro: err.message || String(err) };
      }
    }

    // 2. Tenta envio via Resend se RESEND_API_KEY estiver configurada
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
          return { sucesso: true, id: data.id || 'resend_' + Date.now() };
        } else {
          console.error('[EmailNotificador - Resend] Erro ao enviar:', data);
        }
      } catch (err: any) {
        console.error('[EmailNotificador - Resend] Exceção:', err);
      }
    }

    // 3. Fallback SendGrid (se existir apiKey mas outros falharam)
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
          return { sucesso: true, id: 'sendgrid_' + Date.now() };
        }
      } catch (err: any) {
        console.error('[EmailNotificador - SendGrid] Exceção:', err);
      }
    }

    // 4. Sem canal configurado
    console.error(`[EmailNotificador] Erro: Não há canal de e-mail configurado (SMTP ou Resend). Não foi possível enviar para ${payload.destinatarioEmail}.`);
    return {
      sucesso: false,
      erro: 'Nenhum canal de e-mail (SMTP ou Resend) configurado no servidor'
    };
  }
}

/**
 * Classe stub para futura integração com a Meta WhatsApp Cloud API Oficial.
 * TODO: Implementar autenticação via Bearer Token Meta e payload JSON oficial de mensagens / templates.
 */
export class WhatsAppCloudApiNotificador implements Notificador {
  private apiToken?: string;
  private phoneAccountId?: string;

  constructor() {
    this.apiToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
    this.phoneAccountId = process.env.WHATSAPP_CLOUD_PHONE_ID;
  }

  async enviarEmail(payload: NotificacaoPayload): Promise<NotificadorResult> {
    return { sucesso: false, erro: 'WhatsAppCloudApiNotificador não envia e-mail' };
  }

  async enviarWhatsAppCloudApi(payload: NotificacaoPayload): Promise<NotificadorResult> {
    if (!this.apiToken || !this.phoneAccountId) {
      console.log(`[WhatsAppCloudApi - TODO] Token Meta/ID do número não configurado. Mensagem preparada para ${payload.destinatarioTelefone}: ${payload.mensagemTexto}`);
      return {
        sucesso: false,
        erro: 'WhatsApp Cloud API não configurada em variáveis de ambiente. Utilize o canal semi-automático no painel.'
      };
    }

    // TODO: Chamada para https://graph.facebook.com/v18.0/${this.phoneAccountId}/messages
    return {
      sucesso: true,
      id: `wa_cloud_${Date.now()}`
    };
  }
}
