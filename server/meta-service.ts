import crypto from 'crypto';
import { Pedido, Campanha, ConfigOrganizador } from '../src/types.js';
import { decryptToken } from './crypto-utils.js';

function sha256(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Normaliza e formata telefone para SHA-256 no padrão Meta CAPI
 * ex: (11) 99999-8888 -> 5511999998888 -> sha256
 */
function normalizePhone(rawPhone?: string | null): string | null {
  if (!rawPhone) return null;
  let digits = rawPhone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10 || digits.length === 11) {
    digits = '55' + digits;
  }
  return sha256(digits);
}

function normalizeEmail(rawEmail?: string | null): string | null {
  if (!rawEmail) return null;
  const clean = rawEmail.trim().toLowerCase();
  if (!clean || !clean.includes('@')) return null;
  return sha256(clean);
}

function normalizeFirstName(rawName?: string | null): string | null {
  if (!rawName) return null;
  const firstName = rawName.trim().toLowerCase().split(' ')[0];
  if (!firstName) return null;
  return sha256(firstName);
}

export interface DispararCapiOptions {
  pedido: Pedido;
  campanha: Campanha;
  config: ConfigOrganizador | null;
  baseUrl?: string;
}

/**
 * Dispara evento Purchase via Meta Conversions API (Server-Side)
 */
export async function dispararMetaCapiPurchase({ pedido, campanha, config, baseUrl }: DispararCapiOptions): Promise<boolean> {
  try {
    const pixelId = config?.metaPixelId || process.env.META_PIXEL_ID;
    if (!pixelId) {
      console.log(`[Meta CAPI] Pixel ID não configurado para campanha ${campanha.id}. Disparo cancelado.`);
      return false;
    }

    const rawCapiToken = decryptToken(config?.metaCapiToken) || decryptToken(config?.metaAccessToken) || process.env.META_CAPI_TOKEN || process.env.META_ACCESS_TOKEN;
    if (!rawCapiToken) {
      console.log(`[Meta CAPI] Token de Acesso CAPI não configurado para campanha ${campanha.id}. Disparo cancelado.`);
      return false;
    }

    const emailHash = normalizeEmail(pedido.comprador?.email);
    const phoneHash = normalizePhone(pedido.comprador?.whatsapp);
    const firstNameHash = normalizeFirstName(pedido.comprador?.nome);

    const userData: Record<string, any> = {};
    if (emailHash) userData.em = [emailHash];
    if (phoneHash) userData.ph = [phoneHash];
    if (firstNameHash) userData.fn = [firstNameHash];

    const sourceUrl = baseUrl ? `${baseUrl}/c/${campanha.codigo}` : `https://rifazone.app/c/${campanha.codigo}`;

    const payload = {
      data: [
        {
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: pedido.id, // DEDUPLICAÇÃO com o Pixel do navegador
          event_source_url: sourceUrl,
          action_source: 'website',
          user_data: userData,
          custom_data: {
            currency: 'BRL',
            value: Number(pedido.valorTotal) || 0,
            content_type: 'product',
            content_name: campanha.titulo,
            content_ids: [campanha.id],
            num_items: pedido.quantidade || 1
          }
        }
      ]
    };

    console.log(`[Meta CAPI] Enviando Purchase para Pixel ${pixelId} (Event ID: ${pedido.id}, Valor: R$ ${pedido.valorTotal})...`);

    const url = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${encodeURIComponent(rawCapiToken)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('[Meta CAPI] Erro retornado pela Meta Graph API:', JSON.stringify(json));
      return false;
    }

    console.log(`[Meta CAPI] Disparo concluído com sucesso! Events Received: ${json.events_received || 1}`);
    return true;
  } catch (err: any) {
    console.error('[Meta CAPI] Exceção ao disparar evento de conversão:', err?.message || err);
    return false;
  }
}

export interface MetaInsightsResult {
  spend: number;
  reach: number;
  clicks: number;
  cpc: number;
  impressions: number;
  comprasMeta: number;
}

/**
 * Consulta a Marketing API da Meta (/{act_id}/insights)
 */
export async function buscarInsightsMetaAds({
  metaAccessToken,
  metaAdAccountId
}: {
  metaAccessToken: string;
  metaAdAccountId: string;
}): Promise<MetaInsightsResult> {
  let actId = metaAdAccountId.trim();
  if (!actId.startsWith('act_')) {
    actId = `act_${actId}`;
  }

  const fields = 'spend,reach,clicks,cpc,impressions,actions';
  const url = `https://graph.facebook.com/v18.0/${actId}/insights?fields=${fields}&date_preset=maximum&access_token=${encodeURIComponent(metaAccessToken)}`;

  const res = await fetch(url);
  const json = await res.json();

  if (!res.ok || json.error) {
    const err = json.error || {};
    throw new Error(err.message || 'Erro ao comunicar com a Meta Marketing API.');
  }

  const item = (json.data && json.data[0]) || {};

  const spend = parseFloat(item.spend || '0');
  const reach = parseInt(item.reach || '0', 10);
  const clicks = parseInt(item.clicks || '0', 10);
  const cpc = parseFloat(item.cpc || '0');
  const impressions = parseInt(item.impressions || '0', 10);

  let comprasMeta = 0;
  if (Array.isArray(item.actions)) {
    const purchaseAction = item.actions.find((a: any) =>
      a.action_type === 'purchase' ||
      a.action_type === 'offsite_conversion.fb_pixel_purchase' ||
      a.action_type === 'omni_purchase'
    );
    if (purchaseAction) {
      comprasMeta = parseInt(purchaseAction.value || '0', 10);
    }
  }

  return {
    spend,
    reach,
    clicks,
    cpc,
    impressions,
    comprasMeta
  };
}
