// Sistema de toast leve baseado em eventos — substitui os alert() nativos.
// Uso: import { toast } from '../lib/toast';  toast('Mensagem', 'sucesso')
// O <ToastHost/> (montado uma vez no App) escuta e renderiza a pilha.

export type ToastTipo = 'sucesso' | 'erro' | 'info';

function inferirTipo(msg: string): ToastTipo {
  const low = (msg || '').toLowerCase();
  if (/erro|falha|não foi poss|nao foi poss|inválid|invalid|não pod|nao pod|obrigatóri|obrigatori|preencha|informe|selecione|expirad/.test(low)) {
    return 'erro';
  }
  if (/sucesso|copiad|conclu[íi]|salvo|salva|enviad|conectad|atualizad|removid|✅|🎉|🎯/.test(low)) {
    return 'sucesso';
  }
  return 'info';
}

export function toast(mensagem: string, tipo?: ToastTipo) {
  if (typeof window === 'undefined' || !mensagem) return;
  const detail = { mensagem: String(mensagem), tipo: tipo || inferirTipo(String(mensagem)), id: Date.now() + Math.random() };
  window.dispatchEvent(new CustomEvent('rz-toast', { detail }));
}
