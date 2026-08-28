// Confirmação estilizada baseada em Promise — substitui window.confirm().
// Uso:  if (!(await confirmar({ mensagem: 'Tem certeza?' }))) return;

export interface ConfirmOpts {
  titulo?: string;
  mensagem: string;
  confirmarLabel?: string;
  cancelarLabel?: string;
  perigo?: boolean;
}

export function confirmar(opts: ConfirmOpts): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  return new Promise<boolean>(resolve => {
    window.dispatchEvent(new CustomEvent('rz-confirm', { detail: { ...opts, resolve } }));
  });
}
