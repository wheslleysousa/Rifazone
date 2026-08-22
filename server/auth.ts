import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Verificação de ID Tokens do Firebase Authentication SEM o Admin SDK.
 *
 * Os ID Tokens do Firebase são JWTs assinados (RS256) com as chaves públicas
 * rotativas do Google. Validamos assinatura + audience (projectId) + issuer +
 * expiração usando os certificados x509 públicos do Google — assim não é
 * necessário configurar uma service account no servidor.
 *
 * Dev bypass: se AUTH_DEV_BYPASS=true, o token é apenas decodificado (sem
 * validar a assinatura) para permitir testes locais quando o backend não
 * consegue alcançar os servidores do Google. NUNCA use isso em produção.
 */

const CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

// projectId lido do firebase-applet-config.json (audience esperado do token)
function getProjectId(): string {
  if (process.env.FIREBASE_PROJECT_ID) return process.env.FIREBASE_PROJECT_ID.trim();
  try {
    const cfgPath = path.join(process.cwd(), 'firebase-applet-config.json');
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
    return cfg.projectId || '';
  } catch {
    return '';
  }
}

const PROJECT_ID = getProjectId();

export interface DecodedToken {
  uid: string;
  email: string | null;
  name?: string | null;
  emailVerified?: boolean;
}

let certsCache: { certs: Record<string, string>; expiresAt: number } | null = null;

async function fetchGoogleCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (certsCache && certsCache.expiresAt > now) {
    return certsCache.certs;
  }

  const res = await fetch(CERTS_URL);
  if (!res.ok) {
    throw new Error(`Falha ao buscar certificados do Google (${res.status})`);
  }
  const certs = (await res.json()) as Record<string, string>;

  // Respeita o max-age do Cache-Control
  let maxAge = 3600;
  const cacheControl = res.headers.get('cache-control') || '';
  const m = cacheControl.match(/max-age=(\d+)/);
  if (m) maxAge = Number(m[1]);

  certsCache = { certs, expiresAt: now + maxAge * 1000 };
  return certs;
}

function base64UrlDecode(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function decodePayload(token: string): any {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Token malformado');
  return JSON.parse(base64UrlDecode(parts[1]).toString('utf-8'));
}

/**
 * Verifica um ID Token do Firebase e retorna os dados do usuário.
 * Lança erro se o token for inválido/expirado.
 */
export async function verifyFirebaseToken(token: string): Promise<DecodedToken> {
  if (!token) throw new Error('Token ausente');

  // --- Dev bypass (inseguro, apenas para testes locais) ---
  if (process.env.AUTH_DEV_BYPASS === 'true') {
    const payload = decodePayload(token);
    if (!payload.sub && !payload.user_id) throw new Error('Token sem identificador');
    return {
      uid: String(payload.sub || payload.user_id),
      email: payload.email || null,
      name: payload.name || null,
      emailVerified: !!payload.email_verified,
    };
  }

  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Token malformado');

  const header = JSON.parse(base64UrlDecode(parts[0]).toString('utf-8'));
  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Algoritmo/kid inválido');
  }

  const certs = await fetchGoogleCerts();
  const certPem = certs[header.kid];
  if (!certPem) throw new Error('Chave de assinatura não encontrada');

  // Verifica a assinatura
  const signingInput = `${parts[0]}.${parts[1]}`;
  const signature = base64UrlDecode(parts[2]);
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(signingInput);
  verifier.end();
  const publicKey = crypto.createPublicKey(certPem);
  const valid = verifier.verify(publicKey, signature);
  if (!valid) throw new Error('Assinatura inválida');

  // Verifica claims
  const payload = JSON.parse(base64UrlDecode(parts[1]).toString('utf-8'));
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && payload.exp < now) throw new Error('Token expirado');
  if (payload.iat && payload.iat > now + 300) throw new Error('Token emitido no futuro');
  if (PROJECT_ID) {
    if (payload.aud !== PROJECT_ID) throw new Error('Audience inválido');
    if (payload.iss !== `https://securetoken.google.com/${PROJECT_ID}`) {
      throw new Error('Issuer inválido');
    }
  }
  const uid = payload.sub || payload.user_id;
  if (!uid) throw new Error('Token sem identificador de usuário');

  return {
    uid: String(uid),
    email: payload.email || null,
    name: payload.name || null,
    emailVerified: !!payload.email_verified,
  };
}
