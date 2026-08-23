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

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  spend: number;
  reach: number;
  clicks: number;
  cpc: number;
  cpm: number;
  ctr: number;
  impressions: number;
  comprasMeta: number;
  viewContent: number;
  initiateCheckout: number;
}

export interface MetaInsightsResult {
  spend: number;
  reach: number;
  clicks: number;
  cpc: number;
  cpm: number;
  ctr: number;
  impressions: number;
  comprasMeta: number;
  viewContent: number;
  initiateCheckout: number;
  campaigns: MetaCampaign[];
}

/**
 * Consulta a Marketing API da Meta (/{act_id}/insights) e lista campanhas
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

  // Busca totais da conta
  const fields = 'spend,reach,clicks,cpc,cpm,ctr,impressions,actions';
  const urlTotal = `https://graph.facebook.com/v18.0/${actId}/insights?fields=${fields}&date_preset=maximum&access_token=${encodeURIComponent(metaAccessToken)}`;
  
  // Busca lista de campanhas e seus insights
  const urlCampaigns = `https://graph.facebook.com/v18.0/${actId}/campaigns?fields=id,name,status,insights.date_preset(maximum){${fields}}&limit=50&access_token=${encodeURIComponent(metaAccessToken)}`;

  const [resTotal, resCamp] = await Promise.all([
    fetch(urlTotal),
    fetch(urlCampaigns)
  ]);

  const jsonTotal = await resTotal.json();
  const jsonCamp = await resCamp.json();

  if (!resTotal.ok || jsonTotal.error) {
    const err = jsonTotal.error || {};
    throw new Error(err.message || 'Erro ao comunicar com a Meta Marketing API (Insights Totais).');
  }

  const item = (jsonTotal.data && jsonTotal.data[0]) || {};
  const spend = parseFloat(item.spend || '0');
  const reach = parseInt(item.reach || '0', 10);
  const clicks = parseInt(item.clicks || '0', 10);
  const cpc = parseFloat(item.cpc || '0');
  const cpm = parseFloat(item.cpm || '0');
  const ctr = parseFloat(item.ctr || '0');
  const impressions = parseInt(item.impressions || '0', 10);
  
  let comprasMeta = 0;
  let viewContent = 0;
  let initiateCheckout = 0;

  if (Array.isArray(item.actions)) {
    for (const a of item.actions) {
      const type = a.action_type;
      const val = parseInt(a.value || '0', 10);
      
      if (type === 'purchase' || type === 'offsite_conversion.fb_pixel_purchase' || type === 'omni_purchase') {
        comprasMeta += val;
      } else if (type === 'view_content' || type === 'offsite_conversion.fb_pixel_view_content') {
        viewContent += val;
      } else if (type === 'initiate_checkout' || type === 'offsite_conversion.fb_pixel_initiate_checkout') {
        initiateCheckout += val;
      }
    }
  }

  const campaigns: MetaCampaign[] = [];
  if (jsonCamp.data && Array.isArray(jsonCamp.data)) {
    for (const c of jsonCamp.data) {
      const cInsights = (c.insights && c.insights.data && c.insights.data[0]) || {};
      
      let cCompras = 0;
      let cViewContent = 0;
      let cInitiateCheckout = 0;

      if (Array.isArray(cInsights.actions)) {
        for (const a of cInsights.actions) {
          const type = a.action_type;
          const val = parseInt(a.value || '0', 10);
          
          if (type === 'purchase' || type === 'offsite_conversion.fb_pixel_purchase' || type === 'omni_purchase') {
            cCompras += val;
          } else if (type === 'view_content' || type === 'offsite_conversion.fb_pixel_view_content') {
            cViewContent += val;
          } else if (type === 'initiate_checkout' || type === 'offsite_conversion.fb_pixel_initiate_checkout') {
            cInitiateCheckout += val;
          }
        }
      }

      campaigns.push({
        id: c.id,
        name: c.name || 'Campanha Desconhecida',
        status: c.status || 'UNKNOWN',
        spend: parseFloat(cInsights.spend || '0'),
        reach: parseInt(cInsights.reach || '0', 10),
        clicks: parseInt(cInsights.clicks || '0', 10),
        cpc: parseFloat(cInsights.cpc || '0'),
        cpm: parseFloat(cInsights.cpm || '0'),
        ctr: parseFloat(cInsights.ctr || '0'),
        impressions: parseInt(cInsights.impressions || '0', 10),
        comprasMeta: cCompras,
        viewContent: cViewContent,
        initiateCheckout: cInitiateCheckout
      });
    }
  }

  // Ordenar campanhas por gasto
  campaigns.sort((a, b) => b.spend - a.spend);

  return {
    spend,
    reach,
    clicks,
    cpc,
    cpm,
    ctr,
    impressions,
    comprasMeta,
    viewContent,
    initiateCheckout,
    campaigns
  };
}

/**
 * Busca insights de múltiplas contas e consolida os resultados
 */
export async function buscarInsightsDeVariasContas({
  metaAccessToken,
  adAccountIds
}: {
  metaAccessToken: string;
  adAccountIds: string[];
}): Promise<MetaInsightsResult> {
  const results = await Promise.all(adAccountIds.map(id => 
    buscarInsightsMetaAds({ metaAccessToken, metaAdAccountId: id }).catch(err => {
      console.error(`Erro ao buscar insights da conta ${id}:`, err.message);
      return null;
    })
  ));

  const validResults = results.filter((r): r is MetaInsightsResult => r !== null);
  
  const aggregate: MetaInsightsResult = {
    spend: 0,
    reach: 0,
    clicks: 0,
    cpc: 0,
    cpm: 0,
    ctr: 0,
    impressions: 0,
    comprasMeta: 0,
    viewContent: 0,
    initiateCheckout: 0,
    campaigns: []
  };

  for (const r of validResults) {
    aggregate.spend += r.spend;
    aggregate.reach += r.reach;
    aggregate.clicks += r.clicks;
    aggregate.impressions += r.impressions;
    aggregate.comprasMeta += r.comprasMeta;
    aggregate.viewContent += r.viewContent;
    aggregate.initiateCheckout += r.initiateCheckout;
    aggregate.campaigns.push(...r.campaigns);
  }

  aggregate.cpc = aggregate.clicks > 0 ? (aggregate.spend / aggregate.clicks) : 0;
  aggregate.cpm = aggregate.impressions > 0 ? (aggregate.spend / (aggregate.impressions / 1000)) : 0;
  aggregate.ctr = aggregate.impressions > 0 ? (aggregate.clicks / aggregate.impressions) * 100 : 0;
  
  aggregate.campaigns.sort((a, b) => b.spend - a.spend);

  return aggregate;
}

/**
 * Lista as Business Managers (empresas) do usuário
 */
export async function buscarBusinessManagers(metaAccessToken: string) {
  const url = `https://graph.facebook.com/v18.0/me/businesses?fields=id,name,vertical,primary_page&access_token=${encodeURIComponent(metaAccessToken)}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Erro ao buscar Business Managers.');
  }
  return json.data || [];
}

/**
 * Lista as Contas de Anúncios do usuário ou de uma BM específica
 */
export async function buscarAdAccounts(metaAccessToken: string, businessId?: string) {
  // Se tiver businessId, busca as contas daquela BM, senão busca as contas "pessoais" ou acessíveis pelo token
  const endpoint = businessId ? `${businessId}/client_ad_accounts` : `me/adaccounts`;
  const url = `https://graph.facebook.com/v18.0/${endpoint}?fields=id,name,account_id,account_status,currency,timezone_name,business&limit=100&access_token=${encodeURIComponent(metaAccessToken)}`;
  
  const res = await fetch(url);
  const json = await res.json();
  
  if (!res.ok) {
    // Tenta o endpoint alternativo se o primeiro falhar (alguns tokens tem permissão diferente)
    if (businessId) {
       const urlAlt = `https://graph.facebook.com/v18.0/${businessId}/owned_ad_accounts?fields=id,name,account_id,account_status,currency,timezone_name,business&limit=100&access_token=${encodeURIComponent(metaAccessToken)}`;
       const resAlt = await fetch(urlAlt);
       const jsonAlt = await resAlt.json();
       if (resAlt.ok) return jsonAlt.data || [];
    }
    throw new Error(json.error?.message || 'Erro ao buscar Contas de Anúncios.');
  }
  
  return json.data || [];
}

/**
 * Lista TODAS as contas de anúncios acessíveis pelo token, 
 * incluindo as de todas as BMs e contas pessoais.
 */
export async function buscarTodasAsContasDeAnunciosDoUsuario(metaAccessToken: string) {
  try {
    // 1. Busca BMs
    const bms = await buscarBusinessManagers(metaAccessToken);
    
    // 2. Busca contas de cada BM
    const accountPromises = bms.map((bm: any) => 
      buscarAdAccounts(metaAccessToken, bm.id).catch(() => [])
    );
    
    // 3. Busca contas pessoais (me/adaccounts)
    accountPromises.push(buscarAdAccounts(metaAccessToken).catch(() => []));
    
    const results = await Promise.all(accountPromises);
    
    // 4. Achata e remove duplicatas (pelo ID)
    const allAccountsMap = new Map<string, any>();
    for (const batch of results) {
      if (Array.isArray(batch)) {
        for (const acc of batch) {
          allAccountsMap.set(acc.id, acc);
        }
      }
    }
    
    return Array.from(allAccountsMap.values());
  } catch (err) {
    console.error('Erro ao buscar todas as contas do usuário:', err);
    return [];
  }
}
