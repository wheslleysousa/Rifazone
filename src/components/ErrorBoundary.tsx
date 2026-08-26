import React, { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: any;
  // Rótulo curto do que estava sendo renderizado (ex: "Prévia do Tema")
  titulo?: string;
  // Fallback customizado; se ausente, usa o card padrão abaixo
  fallback?: any;
  // Chave que, ao mudar, reseta o boundary (ex: reabrir a aba, trocar de tema)
  resetKey?: unknown;
}

interface State {
  erro: Error | null;
}

/**
 * Barreira de erro de render. Sem isto, qualquer exceção durante o render de um
 * componente (ex: a prévia ao vivo do tema) desmonta a árvore inteira e o usuário
 * vê uma TELA BRANCA. Com o boundary, o erro fica contido e mostramos a mensagem.
 *
 * Obs: o projeto não usa @types/react, então tipamos o componente de forma leve
 * (as any) para não depender das tipagens de classe do React.
 */
export class ErrorBoundary extends (Component as any) {
  state: State = { erro: null };

  static getDerivedStateFromError(erro: Error): State {
    return { erro };
  }

  componentDidCatch(erro: Error, info: any) {
    console.error('[ErrorBoundary] Erro contido:', erro, info?.componentStack);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.erro && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ erro: null });
    }
  }

  resetar = () => this.setState({ erro: null });

  render() {
    const props: Props = this.props;
    if (this.state.erro) {
      if (props.fallback) return props.fallback;
      return (
        <div className="p-5 bg-slate-900 border border-rose-500/40 rounded-2xl text-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/25 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-rose-300">
                {props.titulo || 'Algo quebrou aqui'}
              </h4>
              <p className="text-[11px] text-slate-400">O restante do painel continua funcionando.</p>
            </div>
          </div>
          <p className="text-white font-semibold bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/50 mb-3 break-words">
            {this.state.erro.message || 'Erro inesperado durante a renderização.'}
          </p>
          {this.state.erro.stack && (
            <pre className="text-[9px] bg-slate-950 p-2.5 rounded-xl text-slate-400 font-mono overflow-x-auto max-h-40 leading-tight whitespace-pre-wrap border border-slate-800/50 mb-3 select-text">
              {this.state.erro.stack}
            </pre>
          )}
          <button
            onClick={this.resetar}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tentar novamente
          </button>
        </div>
      );
    }
    return props.children;
  }
}
