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
  return extrairValorReaisPedido(value);
}

export function extrairValorReaisPedido(p: any): number {
  if (!p) return 0;
  const raw = p.valorTotal !== undefined ? p.valorTotal : (p.valorTotalReais !== undefined ? p.valorTotalReais : p);
  if (raw === undefined || raw === null || raw === '') return 0;
  const num = typeof raw === 'string' ? parseFloat(raw.replace(',', '.')) : Number(raw);
  if (isNaN(num) || num <= 0) return 0;
  
  // No banco do RifaZone, pedidos pagos salvam o valor total em centavos (ex: 5205 = R$ 52,05).
  // Se o número for inteiro (centavos), divide por 100:
  if (Number.isInteger(num)) {
    return Number((num / 100).toFixed(2));
  }
  // Se já tiver fração decimal (ex: 52.05):
  return Number(num.toFixed(2));
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

/**
 * Identifica se um pedido foi processado via Carteira do Sistema / Efí Pay Central
 * ou se foi feito por gateway externo direto do organizador (ex: Mercado Pago, Asaas, PushinPay).
 */
export function isPedidoProcessedByCarteira(pedido: any): boolean {
  if (!pedido) return false;
  const d = pedido.dados || pedido || {};
  
  // 0. Exclui pagamentos simulados/mock de testes ou homologações
  const paymentId = String(d.mpPaymentId || d.paymentId || (pedido as any).mp_payment_id || (pedido as any).mpPaymentId || '').toLowerCase();
  if (
    paymentId.startsWith('simulado_') || 
    paymentId.startsWith('mock_') || 
    paymentId.startsWith('teste_') ||
    paymentId.includes('teste') ||
    paymentId.includes('test') ||
    paymentId.includes('simulado') ||
    paymentId.includes('homologacao') ||
    paymentId.includes('homologação')
  ) {
    return false;
  }

  const compNome = String((pedido as any).comprador?.nome || d.comprador?.nome || '').toLowerCase();
  const compEmail = String((pedido as any).comprador?.email || d.comprador?.email || '').toLowerCase();
  const observacoes = String((pedido as any).observacoes || (pedido as any).notas || d.observacoes || d.notas || '').toLowerCase();

  if (
    compNome.includes('teste') || compNome.includes('test') || compNome.includes('simulado') || compNome.includes('homologacao') || compNome.includes('homologação') ||
    compEmail.includes('teste') || compEmail.includes('test') || compEmail.includes('simulado') || compEmail.includes('homologacao') || compEmail.includes('homologação') ||
    observacoes.includes('cancelada') || observacoes.includes('cancelado') || observacoes.includes('teste') || observacoes.includes('test') || observacoes.includes('homologacao') || observacoes.includes('homologação')
  ) {
    return false;
  }
  
  // 1. Gateway explicitamente salvo
  const gateway = String(d.gateway || d.gatewayId || (pedido as any).gateway || '').toLowerCase();
  
  if (['mercadopago', 'asaas', 'pushinpay', 'pay2m', 'paggue', 'mp', 'efipay_direto'].includes(gateway)) {
    return false;
  }
  if (['carteira', 'efipay', 'system', 'sistema'].includes(gateway)) {
    return true;
  }

  // 2. Flags/Tokens de gateways externos do organizador
  if (d.mpToken || d.usedExternalMp || d.externalGateway || d.metodoAtivo === 'mercadopago') {
    return false;
  }

  // 3. Prefixo do ID de pagamento no Pix
  const mpPaymentId = String((pedido as any).mp_payment_id || (pedido as any).mpPaymentId || d.mpPaymentId || d.paymentId || '');
  if (mpPaymentId.startsWith('carteira_') || mpPaymentId.startsWith('efi_')) {
    return true;
  }

  // IDs puramente numéricos longos (ex: 987654321) pertencem ao Mercado Pago direto do organizador
  if (/^\d{5,}$/.test(mpPaymentId)) {
    return false;
  }

  // Se não tem prefixo de carteira do sistema e não tem indicador de carteira, não pertence à carteira do sistema
  return false;
}
