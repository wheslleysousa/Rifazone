import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recomendado para AES-GCM
const PREFIX = 'enc:v1:';

function getEncryptionKey(): Buffer | null {
  const keyEnv = process.env.ENCRYPTION_KEY?.trim();
  if (!keyEnv) {
    return null;
  }
  try {
    // 1) Se for chave Base64 de 32 bytes (44 caracteres base64)
    const b64Buf = Buffer.from(keyEnv, 'base64');
    if (b64Buf.length === 32) {
      return b64Buf;
    }
    // 2) Se for string UTF-8 de exatamente 32 bytes
    const utf8Buf = Buffer.from(keyEnv, 'utf-8');
    if (utf8Buf.length === 32) {
      return utf8Buf;
    }
    // 3) Caso seja outra string (passphrase), deriva 32 bytes via SHA-256
    return crypto.createHash('sha256').update(keyEnv).digest();
  } catch (err) {
    console.error('Erro ao processar ENCRYPTION_KEY:', err);
    return null;
  }
}

let warnedMissingKey = false;

/**
 * Criptografa um token sensível usando AES-256-GCM.
 * Se ENCRYPTION_KEY não estiver definida no ambiente, mantém o texto puro (para dev) e avisa no console.
 */
export function encryptToken(plainText: string | null | undefined): string | null {
  if (!plainText || typeof plainText !== 'string') return null;
  const trimmed = plainText.trim();
  if (!trimmed) return null;

  // Se já estiver criptografado, não recriptografa
  if (trimmed.startsWith(PREFIX)) return trimmed;

  const key = getEncryptionKey();
  if (!key) {
    if (!warnedMissingKey) {
      console.warn('⚠️ [Crypto] ENCRYPTION_KEY não configurada. Mantendo token em texto puro (modo dev).');
      warnedMissingKey = true;
    }
    return trimmed;
  }

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(trimmed, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Formato: enc:v1:<iv_base64>:<authTag_base64>:<ciphertext_base64>
    return `${PREFIX}${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
  } catch (err) {
    console.error('Erro ao criptografar token:', err);
    return trimmed;
  }
}

/**
 * Descriptografa um token AES-256-GCM.
 * Se o valor não possuir o prefixo de criptografia, assume que é texto puro legado e retorna como está.
 */
export function decryptToken(cipherOrPlain: string | null | undefined): string | null {
  if (!cipherOrPlain || typeof cipherOrPlain !== 'string') return null;
  const trimmed = cipherOrPlain.trim();
  if (!trimmed) return null;

  // Se não estiver criptografado, retorna o texto puro diretamente (dados legados / dev)
  if (!trimmed.startsWith(PREFIX)) {
    return trimmed;
  }

  const key = getEncryptionKey();
  if (!key) {
    console.warn('⚠️ [Crypto] ENCRYPTION_KEY ausente para descriptografar token.');
    return null;
  }

  try {
    const payload = trimmed.slice(PREFIX.length);
    const parts = payload.split(':');
    if (parts.length !== 3) {
      throw new Error('Formato do token criptografado inválido.');
    }
    const [ivB64, tagB64, dataB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(tagB64, 'base64');
    const ciphertext = Buffer.from(dataB64, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('Erro ao descriptografar token:', err);
    return null;
  }
}
