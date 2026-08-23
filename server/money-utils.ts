/**
 * Utilitários de manipulação de moeda (centavos inteiros) no backend.
 *
 * Prevenção de erros de precisão float:
 * Todos os valores monetários internos da aplicação (valorCota, promocoes.valor, ofertas.preco,
 * pedido.valorTotal, descontoPorValorTotal) são manipulados e persistidos como números inteiros de centavos.
 * Exemplo: R$ 0,35 = 35 centavos; R$ 1,50 = 150 centavos; R$ 15,00 = 1500 centavos.
 *
 * SUPOSIÇÃO DE MIGRAÇÃO DE DADOS LEGADOS:
 * - Se o valor tiver fração decimal (ex: 0.35, 1.5, 4.9), trata-se de valor legado em Reais
 *   e é convertido para centavos via Math.round(valor * 100).
 * - Se o valor for um número inteiro:
 *   - Em campanhas e pedidos recentes, já representa centavos inteiros.
 */

export function toCents(value: number | string | undefined | null): number {
  if (value === undefined || value === null || value === '') return 0;
  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value);
  if (isNaN(num) || num <= 0) return 0;

  // Se tem fração decimal (ex: 0.35, 4.90, 12.5), é valor legado em Reais
  if (num % 1 !== 0) {
    return Math.round(num * 100);
  }

  return Math.round(num);
}

export function toReais(cents: number | string | undefined | null): number {
  const c = toCents(cents);
  return Number((c / 100).toFixed(2));
}

export function formatarMoeda(value: number | string | undefined | null): string {
  const cents = toCents(value);
  const reais = cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(reais);
}
