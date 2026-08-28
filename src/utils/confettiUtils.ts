import confetti from 'canvas-confetti';

export function limparConfetes() {
  try {
    confetti.reset();
  } catch (e) {}
}

/**
 * Dispara uma animação de explosão de confetes a partir de dois canhões laterais
 * (um na esquerda e um na direita do fundo da tela, espalhando confetes por todo canto).
 */
export function dispararExplosaoConfetes() {
  try {
    confetti.reset();
  } catch (e) {
    // Ignora erro se indisponível
  }

  const colors = [
    '#f59e0b', '#10b981', '#6366f1', '#ec4899', 
    '#3b82f6', '#eab308', '#ef4444', '#8b5cf6', 
    '#14b8a6', '#f97316', '#ffffff'
  ];

  // Apenas dois canhões laterais (tiro simultâneo da esquerda e da direita)
  // Canhão Esquerdo
  confetti({
    particleCount: 90,
    angle: 60,
    spread: 80,
    startVelocity: 65,
    origin: { x: 0.05, y: 0.85 },
    colors,
    shapes: ['circle'],
    zIndex: 99999,
    disableForReducedMotion: true
  });

  // Canhão Direito
  confetti({
    particleCount: 90,
    angle: 120,
    spread: 80,
    startVelocity: 65,
    origin: { x: 0.95, y: 0.85 },
    colors,
    shapes: ['circle'],
    zIndex: 99999,
    disableForReducedMotion: true
  });
}

/**
 * Dispara a animação escolhida na configuração
 */
export function dispararAnimacaoSucesso(tipo?: string) {
  if (tipo === 'nenhuma') return;
  dispararExplosaoConfetes();
}
