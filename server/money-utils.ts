/**
 * Utilitários de manipulação de moeda no backend.
 */

export function toCents(value: number | string | undefined | null): number {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return Math.round(value * 100);
  const num = parseFloat(String(value).replace(',', '.'));
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

export function toReais(value: number | string | undefined | null): number {
  if (value === undefined || value === null || value === '') return 0;
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  if (isNaN(num)) return 0;
  
  // Se o valor vier do Firestore como centavos (inteiro), dividimos por 100
  // Note: Esta função é usada principalmente para converter o que vem do banco (centavos) para exibição (reais)
  return Number((num / 100).toFixed(2));
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
