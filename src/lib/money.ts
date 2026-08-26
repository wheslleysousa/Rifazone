/**
 * Utilitários de manipulação e formatação de valores monetários.
 * Todos os valores de cota/total na aplicação são tratados em Reais (BRL).
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
  // Converte centavos para Reais
  return num / 100;
}

export function formatarMoeda(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return 'R$ 0,00';
  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value);
  if (isNaN(num)) return 'R$ 0,00';
  if (num === 0) return 'R$ 0,00';

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

export function formatarMoedaSemSimbolo(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return '0,00';
  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value);
  if (isNaN(num)) return '0,00';

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
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}
