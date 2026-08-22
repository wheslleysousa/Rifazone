import { ConfigOrganizador } from '../src/types.js';
import { DadosConfig } from './storage-interface.js';

// Mescla os dados recebidos numa ConfigOrganizador existente (ou cria uma nova),
// preservando campos não enviados. Tokens só são sobrescritos com valor não-vazio.
export function mergeConfig(ownerId: string, existente: ConfigOrganizador | null, dados: DadosConfig): ConfigOrganizador {
  const soSeInformado = (novo: string | null | undefined, atual: string | null | undefined) =>
    novo !== undefined && novo !== '' ? (novo ? String(novo).trim() : null) : (atual ?? null);

  return {
    ownerId,
    mpAccessToken: soSeInformado(dados.mpAccessToken, existente?.mpAccessToken),
    mpPublicKey: dados.mpPublicKey !== undefined
      ? (dados.mpPublicKey ? String(dados.mpPublicKey).trim() : null)
      : (existente?.mpPublicKey ?? null),
    metaAccessToken: soSeInformado(dados.metaAccessToken, existente?.metaAccessToken),
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
export function configParaPainel(config: ConfigOrganizador | null) {
  return {
    mpConfigurado: !!config?.mpAccessToken,
    mpTokenMascara: mascarar(config?.mpAccessToken),
    mpPublicKey: config?.mpPublicKey || null,
    metaConfigurado: !!config?.metaAccessToken,
    metaTokenMascara: mascarar(config?.metaAccessToken),
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
    metaPixelId: config?.metaPixelId || null
  };
}
