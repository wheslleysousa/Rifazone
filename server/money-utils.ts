/**
 * Utilitários de manipulação de moeda no backend.
 */

export function toCents(value: number | string | undefined | null): number {
  if (value === undefined || value === null || value === '') return 0;
  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value);
  if (isNaN(num) || num <= 0) return 0;
  return Math.round(num * 100);
}

export function toReais(value: number | string | undefined | null): number {
  if (value === undefined || value === null || value === '') return 0;
  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value);
  if (isNaN(num)) return 0;
  if (num === 0) return 0;
  // Se for decimal como 0.50 ou 12.50, já é em Reais
  if (num % 1 !== 0) return num;
  // Se for inteiro em centavos passados das funções de pagamento (ex: 2500 centavos -> 25.00, 50 centavos -> 0.50)
  if (num >= 100) return Number((num / 100).toFixed(2));
  return num;
}

export function formatarMoeda(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return 'R$ 0,00';
  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value);
  if (isNaN(num)) return 'R$ 0,00';
  if (num === 0) return 'R$ 0,00 (Grátis)';

  const absNum = Math.abs(num);
  let decimals = 2;
  if (absNum > 0 && absNum < 0.01) {
    const str = num.toString();
    if (str.includes('.')) {
      decimals = Math.min(10, str.split('.')[1].length);
    } else {
      decimals = 4;
    }
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}
