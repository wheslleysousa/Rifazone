import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  updateEmail,
  updatePassword,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  type User
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = firebaseConfig.storageBucket ? getStorage(app, `gs://${firebaseConfig.storageBucket}`) : getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// --- Helpers de autenticação do organizador (RifaZone) ---

export type { User };

export function observarAuth(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

export async function cadastrarComEmail(nome: string, email: string, senha: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, senha);
  if (nome && cred.user) {
    try {
      await updateProfile(cred.user, { displayName: nome });
    } catch {
      // não crítico
    }
  }
  return cred.user;
}

export async function entrarComEmail(email: string, senha: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, senha);
  return cred.user;
}

export async function entrarComGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function sair(): Promise<void> {
  await signOut(auth);
}

export async function atualizarPerfilUsuario(nome: string, fotoUrl?: string): Promise<void> {
  if (!auth.currentUser) throw new Error('Usuário não autenticado');
  await updateProfile(auth.currentUser, {
    displayName: nome,
    photoURL: fotoUrl || ''
  });
}

export async function atualizarEmailUsuario(novoEmail: string): Promise<void> {
  if (!auth.currentUser) throw new Error('Usuário não autenticado');
  await updateEmail(auth.currentUser, novoEmail);
}

export async function atualizarSenhaUsuario(novaSenha: string): Promise<void> {
  if (!auth.currentUser) throw new Error('Usuário não autenticado');
  await updatePassword(auth.currentUser, novaSenha);
}

export async function reautenticarEAlterarSenha(senhaAtual: string, novaSenha: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');
  if (!user.email) throw new Error('E-mail do usuário não identificado');
  const credential = EmailAuthProvider.credential(user.email, senhaAtual);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, novaSenha);
}

// Traduz códigos de erro do Firebase Auth para mensagens amigáveis em pt-BR.
export function traduzErroAuth(code: string): string {
  const mapa: Record<string, string> = {
    'auth/email-already-in-use': 'Este e-mail já está cadastrado. Faça login.',
    'auth/invalid-email': 'E-mail inválido.',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/user-not-found': 'Conta não encontrada. Cadastre-se primeiro.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente em instantes.',
    'auth/popup-closed-by-user': 'Login com Google cancelado.',
    'auth/operation-not-allowed': 'Método de login não habilitado no Firebase.'
  };
  return mapa[code] || 'Não foi possível autenticar. Tente novamente.';
}

// Test connection on boot as specified in the Firebase Skill guidelines
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection tested successfully.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or not reachable.');
    }
  }
}

testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
