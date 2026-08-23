import { ConfigOrganizador } from '../src/types.js';
import { DadosConfig } from './storage-interface.js';
import { encryptToken, decryptToken } from './crypto-utils.js';

// Mescla os dados recebidos numa ConfigOrganizador existente (ou cria uma nova),
// preservando campos não enviados. Tokens só são sobrescritos com valor não-vazio
// e são armazenados criptografados com AES-256-GCM.
export function mergeConfig(ownerId: string, existente: ConfigOrganizador | null, dados: DadosConfig): ConfigOrganizador {
  const soSeInformado = (novo: string | null | undefined, atual: string | null | undefined) =>
    novo !== undefined && novo !== '' ? (novo ? String(novo).trim() : null) : (atual ?? null);

  // Token do Mercado Pago: '' ou null explicito = desconectar; undefined = manter
  let mpAccessToken: string | null = existente?.mpAccessToken ?? null;
  if (dados.mpAccessToken !== undefined) {
    const raw = dados.mpAccessToken && String(dados.mpAccessToken).trim() ? String(dados.mpAccessToken).trim() : null;
    mpAccessToken = raw ? encryptToken(raw) : null;
  }
  // Ao conectar manualmente um token novo, marca tipo/data se não vierem explícitos
  const conectouAgora = !!mpAccessToken && mpAccessToken !== (existente?.mpAccessToken ?? null);

  let metaAccessToken: string | null = existente?.metaAccessToken ?? null;
  if (dados.metaAccessToken !== undefined) {
    const raw = dados.metaAccessToken && String(dados.metaAccessToken).trim() ? String(dados.metaAccessToken).trim() : null;
    metaAccessToken = raw ? encryptToken(raw) : null;
  }

  let metaCapiToken: string | null = existente?.metaCapiToken ?? null;
  if (dados.metaCapiToken !== undefined) {
    const raw = dados.metaCapiToken && String(dados.metaCapiToken).trim() ? String(dados.metaCapiToken).trim() : null;
    metaCapiToken = raw ? encryptToken(raw) : null;
  }

  let notificameToken: string | null = existente?.notificameToken ?? null;
  if (dados.notificameToken !== undefined) {
    const raw = dados.notificameToken && String(dados.notificameToken).trim() ? String(dados.notificameToken).trim() : null;
    notificameToken = raw ? encryptToken(raw) : null;
  }

  return {
    ownerId,
    mpAccessToken,
    mpPublicKey: dados.mpPublicKey !== undefined
      ? (dados.mpPublicKey ? String(dados.mpPublicKey).trim() : null)
      : (existente?.mpPublicKey ?? null),
    mpUserId: dados.mpUserId !== undefined ? (dados.mpUserId ?? null) : (existente?.mpUserId ?? null),
    mpConexaoTipo: dados.mpConexaoTipo !== undefined
      ? dados.mpConexaoTipo
      : (existente?.mpConexaoTipo ?? (conectouAgora ? 'manual' : null)),
    mpConectadoEm: dados.mpConectadoEm !== undefined
      ? dados.mpConectadoEm
      : (conectouAgora && !existente?.mpConectadoEm ? new Date().toISOString() : (existente?.mpConectadoEm ?? null)),
    metaAccessToken,
    metaCapiToken,
    notificameToken,
    metaAdAccountId: dados.metaAdAccountId !== undefined
      ? (dados.metaAdAccountId ? String(dados.metaAdAccountId).trim() : null)
      : (existente?.metaAdAccountId ?? null),
    metaPixelId: dados.metaPixelId !== undefined
      ? (dados.metaPixelId ? String(dados.metaPixelId).trim() : null)
      : (existente?.metaPixelId ?? null),
    marca: dados.marca !== undefined ? { ...existente?.marca, ...dados.marca } : existente?.marca,
    redes: dados.redes !== undefined ? { ...existente?.redes, ...dados.redes } : existente?.redes,
    atualizadaEm: new Date().toISOString()
  };
}

function mascarar(token: string | null | undefined): string | null {
  const t = token || '';
  return t ? `${t.slice(0, 8)}••••••${t.slice(-4)}` : null;
}

// Vista das configurações para o PAINEL do organizador (segredos mascarados).
// Descriptografa internamente apenas para extrair a máscara e NUNCA retorna o token puro.
export function configParaPainel(config: ConfigOrganizador | null) {
  const plainMp = decryptToken(config?.mpAccessToken);
  const plainMeta = decryptToken(config?.metaAccessToken);
  const plainCapi = decryptToken(config?.metaCapiToken);
  const plainNotificame = decryptToken(config?.notificameToken);

  return {
    mpConfigurado: !!plainMp,
    mpTokenMascara: mascarar(plainMp),
    mpPublicKey: config?.mpPublicKey || null,
    mpConexaoTipo: config?.mpConexaoTipo || null,
    mpUserId: config?.mpUserId ?? null,
    mpConectadoEm: config?.mpConectadoEm || null,
    metaConfigurado: !!plainMeta,
    metaTokenMascara: mascarar(plainMeta),
    metaCapiConfigurado: !!plainCapi,
    metaCapiTokenMascara: mascarar(plainCapi),
    notificameConfigurado: !!plainNotificame,
    notificameTokenMascara: mascarar(plainNotificame),
    metaAdAccountId: config?.metaAdAccountId || null,
    metaPixelId: config?.metaPixelId || null,
    marca: {
      nomeMarca: config?.marca?.nomeMarca || null,
      logoUrl: config?.marca?.logoUrl || null,
      corPrincipal: config?.marca?.corPrincipal || null,
      corDestaque: config?.marca?.corDestaque || null
    },
    redes: config?.redes || {},
    atualizadaEm: config?.atualizadaEm || null
  };
}

// Monta a "vista pública" das configurações do organizador (sem segredos),
// usada tanto na resposta pública da campanha quanto no painel.
export function configParaMarcaPublica(config: ConfigOrganizador | null) {
  return {
    nomeMarca: config?.marca?.nomeMarca || null,
    logoUrl: config?.marca?.logoUrl || null,
    corPrincipal: config?.marca?.corPrincipal || null,
    corDestaque: config?.marca?.corDestaque || null,
    redes: config?.redes || {},
    metaPixelId: config?.metaPixelId || null,
    mpPublicKey: config?.mpPublicKey || process.env.MP_PUBLIC_KEY || null
  };
}
