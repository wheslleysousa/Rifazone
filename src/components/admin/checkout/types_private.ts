import { CheckoutConfig, ConfirmacaoCompraConfig, CupomDesconto } from '../../../types';

export interface CheckoutConfigExtended extends CheckoutConfig {
  corPrimaria?: string;
  corFundo?: string;
  fonteFamilia?: string;
  textoBotao?: string;
  textoRodape?: string;
  bannerUrl?: string;
  bannerTipo?: 'imagem' | 'video';
  bannerVideoUrl?: string;
  bannerEnquadramento?: 'contain' | 'cover' | 'auto';
  bannerAltura?: number;
  temporizadorAtivo?: boolean;
  temporizadorMinutos?: number;
  temporizadorEstilo?: 'fogo' | 'alerta' | 'minimalista' | 'badge' | 'pulsante' | 'barra_compacta' | 'neon';
  temporizadorTexto?: string;
  temporizadorMostrarIcone?: boolean;
  temporizadorIcone?: string;
  temporizadorFundo?: string;
  temporizadorTextoCor?: string;
  temporizadorRaioBorda?: number;
  temporizadorAltura?: number;
  temporizadorTamanhoFonte?: number;
  posicaoSelos?: 'abaixo_botao' | 'abaixo_banner' | 'topo' | 'rodape';
  estiloSelos?: 'chips_modernos' | 'cards_detalhados' | 'icones_minimalistas' | 'barra_seguranca';
  botaoEstilo?: 'solido' | 'gradiente' | 'vidro' | 'borda' | 'sombra_glow';
  botaoCorFundo?: string;
  botaoCorTexto?: string;
  botaoRaioBorda?: number;
  botaoAltura?: number;
  botaoTamanhoFonte?: number;
  mensagemEscassez?: string;
  selosExtras?: string[];
  confirmacao?: ConfirmacaoCompraConfig;
  exigirCpf?: boolean;
  exigirEmail?: boolean;
  cupomAtivo?: boolean;
  exibirCupom?: boolean;
  cupons?: CupomDesconto[];
  notificacoesModoIntervalo?: 'fixo' | 'aleatorio';
  notificacoesIntervaloMin?: number;
  notificacoesIntervaloMax?: number;
}

