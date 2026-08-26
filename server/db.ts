import { Storage } from './storage-interface.js';
import { FileStorage } from './storage.js';
import { FirestoreStorage, firebaseCredencialDisponivel } from './firestore-storage.js';
import { SupabaseStorage, supabaseDisponivel } from './supabase-storage.js';

/**
 * Seleciona o backend de armazenamento:
 * - 1º Supabase (se configurado)
 * - 2º Firestore (se configurado)
 * - 3º Arquivo local
 */
function criarStorage(): Storage {
  if (supabaseDisponivel()) {
    try {
      console.log('🚀 Inicializando backend com SUPABASE...');
      return new SupabaseStorage();
    } catch (err) {
      console.error('Falha ao inicializar o Supabase:', err);
    }
  }

  if (firebaseCredencialDisponivel()) {
    try {
      console.log('🔥 Inicializando backend com FIRESTORE...');
      return new FirestoreStorage();
    } catch (err) {
      console.error('Falha ao inicializar o Firestore:', err);
    }
  }

  console.log('📁 Inicializando backend com ARQUIVO LOCAL...');
  return new FileStorage();
}

export const db: Storage = criarStorage();
export const usandoSupabase = supabaseDisponivel();
export const usandoFirestore = !usandoSupabase && firebaseCredencialDisponivel();
