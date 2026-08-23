/**
 * Utilitários de manipulação e formatação de valores monetários (centavos inteiros) no frontend.
 * Formatação padronizada com Intl.NumberFormat pt-BR.
 */

export function toCents(value: number | string | undefined | null): number {
  if (value === undefined || value === null || value === '') return 0;
  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value);
  if (isNaN(num) || num <= 0) return 0;

  // Se tiver fração decimal (ex: 0.35, 4.90, 12.5), converte Reais -> Centavos
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

export function formatarMoedaSemSimbolo(value: number | string | undefined | null): string {
  const cents = toCents(value);
  const reais = cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(reais);
}
