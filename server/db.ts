import { Storage } from './storage-interface.js';
import { FileStorage } from './storage.js';
import { FirestoreStorage, firebaseCredencialDisponivel } from './firestore-storage.js';

/**
 * Seleciona o backend de armazenamento:
 * - Se houver credenciais do Firebase Admin (FIREBASE_SERVICE_ACCOUNT ou
 *   GOOGLE_APPLICATION_CREDENTIALS), usa o FIRESTORE (dados reais e persistentes).
 * - Caso contrário, usa o armazenamento em ARQUIVO local (dev/preview).
 */
function criarStorage(): Storage {
  if (firebaseCredencialDisponivel()) {
    try {
      return new FirestoreStorage();
    } catch (err) {
      console.error('Falha ao inicializar o Firestore. Caindo para armazenamento em arquivo:', err);
    }
  } else {
    console.log('Firebase Admin não configurado (FIREBASE_SERVICE_ACCOUNT ausente). Usando armazenamento em ARQUIVO local.');
  }
  return new FileStorage();
}

export const db: Storage = criarStorage();

export const usandoFirestore = firebaseCredencialDisponivel();
