const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const regexConfig = /export interface CheckoutConfig \{[\s\S]*?\}\n\nexport const DEFAULT_CHECKOUT_CONFIG: CheckoutConfig = \{[\s\S]*?\};\n/m;

const newConfig = `export interface CheckoutConfig {
  layout?: 'padrao' | 'limpo' | 'passos' | 'rapido';
  metodoPrimario?: 'pix' | 'cartao' | 'boleto';
  metodos: {
    pix: boolean;
    cartao: boolean;
    boleto: boolean;
  };
  pixConfig?: {
    descontoPct?: number;
    descontoFixo?: number;
    permitirComprovante?: boolean;
    cascata?: string[];
  };
  cartaoConfig?: {
    exibirValorParcelado?: boolean;
  };
  coletaDados?: {
    exigirEmail?: boolean;
    confirmarEmail?: boolean;
    exigirCpf?: boolean;
    exigirTelefone?: boolean;
    confirmarTelefone?: boolean;
    telefoneUnico?: boolean;
  };
  timerUrgencia?: {
    ativo?: boolean;
    minutos?: number;
    sticky?: boolean;
  };
  notificacoesSociais?: {
    ativo?: boolean;
    posicao?: 'topo-esq' | 'topo-dir' | 'base-esq' | 'base-dir';
    intervalo?: number;
    mensagens?: string[];
  };
  exitPopup?: {
    ativo?: boolean;
    gatilho?: 'saida' | 'voltar' | 'aba' | 'tempo';
    tempoSegundos?: number;
  };
  pixels?: {
    metaPixelId?: string;
    ga4Id?: string;
    tiktokPixelId?: string;
    utmifyId?: string;
  };
  pagamentosInternacionais?: boolean;
  redirectPosCompra?: string;
  orderBumps?: {
    id: string;
    titulo: string;
    descricao: string;
    preco: number;
    imagemUrl?: string;
  }[];
  // Campos originais:
  parcelasMax: number;
  taxaParcelamento: 'comprador' | 'organizador';
  mensagens: {
    topo?: string;
    pix?: string;
    cartao?: string;
    sucesso?: string;
    urgencia?: string;
  };
  selosSeguranca: boolean;
  confirmacao?: ConfirmacaoCompraConfig;
  corPrimaria?: string;
  corFundo?: string;
  fonteFamilia?: string;
  textoBotao?: string;
  textoRodape?: string;
  bannerUrl?: string;
  temporizadorAtivo?: boolean;
  temporizadorMinutos?: number;
  mensagemEscassez?: string;
  selosExtras?: string[];
}

export const DEFAULT_CHECKOUT_CONFIG: CheckoutConfig = {
  layout: 'padrao',
  metodoPrimario: 'pix',
  metodos: {
    pix: true,
    cartao: true,
    boleto: false
  },
  pixConfig: {
    permitirComprovante: false,
    cascata: ['padrao']
  },
  cartaoConfig: {
    exibirValorParcelado: true
  },
  coletaDados: {
    exigirEmail: false,
    confirmarEmail: false,
    exigirCpf: false,
    exigirTelefone: true,
    confirmarTelefone: false,
    telefoneUnico: true
  },
  parcelasMax: 12,
  taxaParcelamento: 'comprador',
  mensagens: {
    topo: 'Selecione a forma de pagamento:',
    pix: 'Aprovação imediata via Pix com QR Code e Copia e Cola.',
    cartao: 'Pague em até 12x no cartão de crédito.',
    sucesso: 'Pagamento aprovado! Boa sorte no sorteio.',
    urgencia: 'Finalize sua compra rápido, as cotas estão acabando!'
  },
  selosSeguranca: true,
  temporizadorAtivo: false,
  temporizadorMinutos: 15,
};
`;

code = code.replace(regexConfig, newConfig);

fs.writeFileSync('src/types.ts', code);
console.log('types.ts patched');
