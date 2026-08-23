/**
 * Helper de Tokenização Client-Side do Mercado Pago
 * Mantenha PCI leve: o número do cartão NUNCA toca o backend da aplicação.
 */

export interface DadosCartaoInput {
  numero: string;
  nomeTitular: string;
  cpfTitular: string;
  mesExpiracao: string;
  anoExpiracao: string;
  cvv: string;
}

export interface TokenCartaoResultado {
  token: string;
  paymentMethodId: string;
  issuerId?: string;
  ultimosDigitos: string;
  bandeira: string;
}

/**
 * Identifica a bandeira provável do cartão pelo BIN
 */
export function detectarBandeiraCartao(numeroLimpo: string): { id: string; nome: string } {
  const num = numeroLimpo.replace(/\D/g, '');
  
  if (/^4/.test(num)) {
    return { id: 'visa', nome: 'Visa' };
  }
  if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(num)) {
    return { id: 'master', nome: 'Mastercard' };
  }
  if (/^(4011|438935|451416|4576|504175|506699|5067|509|627780|636297|636368|650|6516|6550)/.test(num)) {
    return { id: 'elo', nome: 'Elo' };
  }
  if (/^(606282|3841)/.test(num)) {
    return { id: 'hipercard', nome: 'Hipercard' };
  }
  if (/^3[47]/.test(num)) {
    return { id: 'amex', nome: 'American Express' };
  }
  if (/^(6011|65|64[4-9]|622)/.test(num)) {
    return { id: 'discover', nome: 'Discover' };
  }
  
  return { id: 'credit_card', nome: 'Cartão de Crédito' };
}

/**
 * Formata o número do cartão com espaços a cada 4 dígitos
 */
export function formatarNumeroCartao(valor: string): string {
  const v = valor.replace(/\D/g, '').substring(0, 16);
  return v.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * Formata a data de validade (MM/AA)
 */
export function formatarValidade(valor: string): string {
  const v = valor.replace(/\D/g, '').substring(0, 4);
  if (v.length >= 3) {
    return `${v.substring(0, 2)}/${v.substring(2)}`;
  }
  return v;
}

/**
 * Cria o Card Token no Mercado Pago de forma 100% Client-Side.
 */
export async function criarCardTokenMercadoPago(
  input: DadosCartaoInput,
  publicKey?: string
): Promise<TokenCartaoResultado> {
  const numeroLimpo = input.numero.replace(/\D/g, '');
  const cpfLimpo = input.cpfTitular.replace(/\D/g, '');
  const bandeira = detectarBandeiraCartao(numeroLimpo);
  const ultimosDigitos = numeroLimpo.slice(-4) || '0000';

  // Se não houver Public Key configurada ou for ambiente mock/teste
  if (!publicKey || publicKey.startsWith('TEST-0000') || publicKey.includes('mock')) {
    // Simula tokenização no cliente para testes locais
    await new Promise(r => setTimeout(r, 600));
    return {
      token: `mock_card_token_${Date.now()}_${ultimosDigitos}`,
      paymentMethodId: bandeira.id,
      issuerId: 'mock_issuer',
      ultimosDigitos,
      bandeira: bandeira.nome
    };
  }

  // Prepara ano em 4 dígitos
  let ano = input.anoExpiracao.trim();
  if (ano.length === 2) {
    ano = `20${ano}`;
  }

  const payload = {
    card_number: numeroLimpo,
    cardholder: {
      name: input.nomeTitular.trim(),
      identification: {
        type: 'CPF',
        number: cpfLimpo
      }
    },
    expiration_month: parseInt(input.mesExpiracao, 10),
    expiration_year: parseInt(ano, 10),
    security_code: input.cvv.trim()
  };

  try {
    const res = await fetch(`https://api.mercadopago.com/v1/card_tokens?public_key=${encodeURIComponent(publicKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok || !data.id) {
      const msgErro = data.message || (data.cause && data.cause[0] && data.cause[0].description) || 'Falha ao validar os dados do cartão no Mercado Pago.';
      throw new Error(msgErro);
    }

    return {
      token: data.id,
      paymentMethodId: bandeira.id,
      issuerId: data.card_number_length ? String(data.card_number_length) : undefined,
      ultimosDigitos,
      bandeira: bandeira.nome
    };
  } catch (err: any) {
    // Em caso de falha de rede ou CORS com chave inválida em sandbox, reporta erro legível
    throw new Error(err.message || 'Não foi possível validar o cartão. Verifique o número, validade e CVV.');
  }
}
