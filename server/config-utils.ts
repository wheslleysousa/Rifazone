import { ConfigOrganizador } from '../src/types.js';
import { DadosConfig } from './storage-interface.js';
import { encryptToken, decryptToken } from './crypto-utils.js';

// Mescla os dados recebidos numa ConfigOrganizador existente (ou cria uma nova),
// preservando campos não enviados. Tokens só são sobrescritos com valor não-vazio
// e são armazenados criptografados com AES-256-GCM.
export function mergeConfig(ownerId: string, existente: ConfigOrganizador | null, dados: DadosConfig): ConfigOrganizador {
  // Token do Mercado Pago: '' ou null explicito = desconectar; undefined = manter
  let mpAccessToken: string | null = existente?.mpAccessToken ?? null;
  if (dados.mpAccessToken !== undefined) {
    const raw = dados.mpAccessToken && String(dados.mpAccessToken).trim() ? String(dados.mpAccessToken).trim() : null;
    mpAccessToken = raw ? encryptToken(raw) : null;
  }
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

  // Gateways Específicos
  let asaasApiKey: string | null = existente?.asaasConfig?.apiKey ?? null;
  if (dados.asaasConfig?.apiKey !== undefined) {
    const raw = dados.asaasConfig?.apiKey && String(dados.asaasConfig.apiKey).trim() ? String(dados.asaasConfig.apiKey).trim() : null;
    asaasApiKey = raw ? encryptToken(raw) : null;
  }

  let asaasWebhookToken: string | null = existente?.asaasConfig?.webhookToken ?? null;
  if (dados.asaasConfig?.webhookToken !== undefined) {
    const raw = dados.asaasConfig?.webhookToken && String(dados.asaasConfig.webhookToken).trim() ? String(dados.asaasConfig.webhookToken).trim() : null;
    asaasWebhookToken = raw ? encryptToken(raw) : null;
  }

  let efipayClientSecret: string | null = existente?.efipayConfig?.clientSecret ?? null;
  if (dados.efipayConfig?.clientSecret !== undefined) {
    const raw = dados.efipayConfig?.clientSecret && String(dados.efipayConfig.clientSecret).trim() ? String(dados.efipayConfig.clientSecret).trim() : null;
    efipayClientSecret = raw ? encryptToken(raw) : null;
  }

  let efipayClientSecretHomologacao: string | null = existente?.efipayConfig?.clientSecretHomologacao ?? null;
  if (dados.efipayConfig?.clientSecretHomologacao !== undefined) {
    const raw = dados.efipayConfig?.clientSecretHomologacao && String(dados.efipayConfig.clientSecretHomologacao).trim() ? String(dados.efipayConfig.clientSecretHomologacao).trim() : null;
    efipayClientSecretHomologacao = raw ? encryptToken(raw) : null;
  }

  let pay2mClientSecret: string | null = existente?.pay2mConfig?.clientSecret ?? null;
  if (dados.pay2mConfig?.clientSecret !== undefined) {
    const raw = dados.pay2mConfig?.clientSecret && String(dados.pay2mConfig.clientSecret).trim() ? String(dados.pay2mConfig.clientSecret).trim() : null;
    pay2mClientSecret = raw ? encryptToken(raw) : null;
  }

  let paggueClientSecret: string | null = existente?.paggueConfig?.clientSecret ?? null;
  if (dados.paggueConfig?.clientSecret !== undefined) {
    const raw = dados.paggueConfig?.clientSecret && String(dados.paggueConfig.clientSecret).trim() ? String(dados.paggueConfig.clientSecret).trim() : null;
    paggueClientSecret = raw ? encryptToken(raw) : null;
  }

  let pushinpayToken: string | null = existente?.pushinpayConfig?.token ?? null;
  if (dados.pushinpayConfig?.token !== undefined) {
    const raw = dados.pushinpayConfig?.token && String(dados.pushinpayConfig.token).trim() ? String(dados.pushinpayConfig.token).trim() : null;
    pushinpayToken = raw ? encryptToken(raw) : null;
  }

  let zettpayClientSecret: string | null = existente?.zettpayConfig?.clientSecret ?? null;
  if (dados.zettpayConfig?.clientSecret !== undefined) {
    const raw = dados.zettpayConfig?.clientSecret && String(dados.zettpayConfig.clientSecret).trim() ? String(dados.zettpayConfig.clientSecret).trim() : null;
    zettpayClientSecret = raw ? encryptToken(raw) : null;
  }

  let paggo365SecretKey: string | null = existente?.paggo365Config?.secretKey ?? null;
  if (dados.paggo365Config?.secretKey !== undefined) {
    const raw = dados.paggo365Config?.secretKey && String(dados.paggo365Config.secretKey).trim() ? String(dados.paggo365Config.secretKey).trim() : null;
    paggo365SecretKey = raw ? encryptToken(raw) : null;
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
    
    // Gateways & Carteira
    metodoAtivo: (dados.metodoAtivo !== undefined ? dados.metodoAtivo : (existente?.metodoAtivo || 'carteira')) as any,
    carteiraConfig: dados.carteiraConfig !== undefined 
      ? { 
          ...existente?.carteiraConfig, 
          ...dados.carteiraConfig,
          taxasPersonalizadas: dados.carteiraConfig.taxasPersonalizadas !== undefined
            ? dados.carteiraConfig.taxasPersonalizadas
            : existente?.carteiraConfig?.taxasPersonalizadas
        } 
      : (existente?.carteiraConfig || { ativo: true, taxaVendaPct: 8.0, taxaSaqueImediato: 4.50 }),
    efipayConfig: {
      ...existente?.efipayConfig,
      ...dados.efipayConfig,
      clientSecret: efipayClientSecret,
      clientSecretHomologacao: efipayClientSecretHomologacao,
      ativo: dados.efipayConfig?.ativo ?? existente?.efipayConfig?.ativo ?? false
    },
    pay2mConfig: {
      ...existente?.pay2mConfig,
      ...dados.pay2mConfig,
      clientSecret: pay2mClientSecret,
      ativo: dados.pay2mConfig?.ativo ?? existente?.pay2mConfig?.ativo ?? false
    },
    paggueConfig: {
      ...existente?.paggueConfig,
      ...dados.paggueConfig,
      clientSecret: paggueClientSecret,
      ativo: dados.paggueConfig?.ativo ?? existente?.paggueConfig?.ativo ?? false
    },
    pushinpayConfig: {
      ...existente?.pushinpayConfig,
      ...dados.pushinpayConfig,
      token: pushinpayToken,
      ativo: dados.pushinpayConfig?.ativo ?? existente?.pushinpayConfig?.ativo ?? false
    },
    zettpayConfig: {
      ...existente?.zettpayConfig,
      ...dados.zettpayConfig,
      clientSecret: zettpayClientSecret,
      ativo: dados.zettpayConfig?.ativo ?? existente?.zettpayConfig?.ativo ?? false
    },
    paggo365Config: {
      ...existente?.paggo365Config,
      ...dados.paggo365Config,
      secretKey: paggo365SecretKey,
      ativo: dados.paggo365Config?.ativo ?? existente?.paggo365Config?.ativo ?? false
    },
    pixManualConfig: dados.pixManualConfig !== undefined ? { ...existente?.pixManualConfig, ...dados.pixManualConfig } : existente?.pixManualConfig,
    cryptoConfig: dados.cryptoConfig !== undefined ? { ...existente?.cryptoConfig, ...dados.cryptoConfig } : existente?.cryptoConfig,

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
  const plainAsaas = decryptToken(config?.asaasConfig?.apiKey);
  const plainEfipaySecret = decryptToken(config?.efipayConfig?.clientSecret);
  const plainEfipaySecretHomologacao = decryptToken(config?.efipayConfig?.clientSecretHomologacao);
  const plainPay2mSecret = decryptToken(config?.pay2mConfig?.clientSecret);
  const plainPaggueSecret = decryptToken(config?.paggueConfig?.clientSecret);
  const plainPushinpayToken = decryptToken(config?.pushinpayConfig?.token);
  const plainZettpaySecret = decryptToken(config?.zettpayConfig?.clientSecret);
  const plainPaggo365Secret = decryptToken(config?.paggo365Config?.secretKey);

  return {
    metodoAtivo: config?.metodoAtivo || 'carteira',
    
    // Mercado Pago
    mpConfigurado: !!plainMp,
    mpTokenMascara: mascarar(plainMp),
    mpPublicKey: config?.mpPublicKey || null,
    mpConexaoTipo: config?.mpConexaoTipo || null,
    mpUserId: config?.mpUserId ?? null,
    mpConectadoEm: config?.mpConectadoEm || null,

    // Carteira
    carteiraConfig: config?.carteiraConfig || { ativo: true, taxaVendaPct: 8.0, taxaSaqueImediato: 4.50 },

    // Asaas
    asaasConfig: {
      ativo: config?.asaasConfig?.ativo ?? false,
      configurado: !!plainAsaas,
      apiKeyMascara: mascarar(plainAsaas)
    },

    // EFIPAY
    efipayConfig: {
      ativo: config?.efipayConfig?.ativo ?? (!!process.env.EFI_CLIENT_ID || !!process.env.EFI_CLIENT_ID_HOMOLOGACAO),
      clientId: config?.efipayConfig?.clientId || process.env.EFI_CLIENT_ID || null,
      chavePix: config?.efipayConfig?.chavePix || process.env.EFI_CHAVE_PIX || null,
      clientIdHomologacao: config?.efipayConfig?.clientIdHomologacao || process.env.EFI_CLIENT_ID_HOMOLOGACAO || null,
      chavePixHomologacao: config?.efipayConfig?.chavePixHomologacao || process.env.EFI_CHAVE_PIX_HOMOLOGACAO || null,
      ambiente: config?.efipayConfig?.ambiente || (process.env.EFI_AMBIENTE as any) || 'producao',
      certificadoNome: config?.efipayConfig?.certificadoNome || (process.env.EFI_CERTIFICADO_BASE64 ? 'certificado-env-render.pem' : null),
      certificadoConfigurado: !!config?.efipayConfig?.certificadoBase64 || !!process.env.EFI_CERTIFICADO_BASE64,
      repassarTaxa: config?.efipayConfig?.repassarTaxa ?? false,
      configurado: (!!plainEfipaySecret && !!config?.efipayConfig?.clientId) || (!!process.env.EFI_CLIENT_ID && !!process.env.EFI_CLIENT_SECRET) || (!!process.env.EFI_CLIENT_ID_HOMOLOGACAO && !!process.env.EFI_CLIENT_SECRET_HOMOLOGACAO),
      clientSecretMascara: mascarar(plainEfipaySecret || process.env.EFI_CLIENT_SECRET),
      clientSecretHomologacaoMascara: mascarar(plainEfipaySecretHomologacao || process.env.EFI_CLIENT_SECRET_HOMOLOGACAO)
    },

    // Pay2M
    pay2mConfig: {
      ativo: config?.pay2mConfig?.ativo ?? false,
      clientId: config?.pay2mConfig?.clientId || null,
      repassarTaxa: config?.pay2mConfig?.repassarTaxa ?? false,
      configurado: !!plainPay2mSecret && !!config?.pay2mConfig?.clientId,
      clientSecretMascara: mascarar(plainPay2mSecret)
    },

    // Paggue
    paggueConfig: {
      ativo: config?.paggueConfig?.ativo ?? false,
      clientKey: config?.paggueConfig?.clientKey || null,
      repassarTaxa: config?.paggueConfig?.repassarTaxa ?? false,
      configurado: !!plainPaggueSecret && !!config?.paggueConfig?.clientKey,
      clientSecretMascara: mascarar(plainPaggueSecret)
    },

    // PushinPay
    pushinpayConfig: {
      ativo: config?.pushinpayConfig?.ativo ?? false,
      repassarTaxa: config?.pushinpayConfig?.repassarTaxa ?? false,
      configurado: !!plainPushinpayToken,
      tokenMascara: mascarar(plainPushinpayToken)
    },

    // ZettPay
    zettpayConfig: {
      ativo: config?.zettpayConfig?.ativo ?? false,
      clientId: config?.zettpayConfig?.clientId || null,
      repassarTaxa: config?.zettpayConfig?.repassarTaxa ?? false,
      configurado: !!plainZettpaySecret && !!config?.zettpayConfig?.clientId,
      clientSecretMascara: mascarar(plainZettpaySecret)
    },

    // Paggo365
    paggo365Config: {
      ativo: config?.paggo365Config?.ativo ?? false,
      publicKey: config?.paggo365Config?.publicKey || null,
      valorMinimo: config?.paggo365Config?.valorMinimo ?? 5.00,
      configurado: !!plainPaggo365Secret && !!config?.paggo365Config?.publicKey,
      secretKeyMascara: mascarar(plainPaggo365Secret)
    },

    // Pix Manual
    pixManualConfig: config?.pixManualConfig || null,

    // Crypto
    cryptoConfig: config?.cryptoConfig || null,

    // Meta & Outros
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
      capaUrl: config?.marca?.capaUrl || null,
      fotoPerfilUrl: config?.marca?.fotoPerfilUrl || null,
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
    capaUrl: config?.marca?.capaUrl || null,
    fotoPerfilUrl: config?.marca?.fotoPerfilUrl || null,
    corPrincipal: config?.marca?.corPrincipal || null,
    corDestaque: config?.marca?.corDestaque || null,
    redes: config?.redes || {},
    metaPixelId: config?.metaPixelId || null,
    mpPublicKey: config?.mpPublicKey || process.env.MP_PUBLIC_KEY || null,
    metodoAtivo: config?.metodoAtivo || 'carteira',
    pixManual: config?.pixManualConfig?.ativo ? {
      tipoChave: config.pixManualConfig.tipoChave,
      chavePix: config.pixManualConfig.chavePix,
      nomeBeneficiario: config.pixManualConfig.nomeBeneficiario,
      instrucoes: config.pixManualConfig.instrucoes
    } : null,
    crypto: config?.cryptoConfig?.ativo ? {
      moeda: config.cryptoConfig.moeda,
      rede: config.cryptoConfig.rede,
      enderecoCarteira: config.cryptoConfig.enderecoCarteira,
      nomeIdentificacao: config.cryptoConfig.nomeIdentificacao
    } : null
  };
}
