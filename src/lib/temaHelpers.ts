import React from 'react';
import {
  Trophy, Gift, Award, Crown, Sparkles, Gem, Medal, Star, Flame, Zap,
  Package, ShoppingBag, ShoppingCart, Heart, Target, Disc, ShieldCheck, Sun, Rocket, Coins, DollarSign,
  FileText, BookOpen, Scroll, Info, HelpCircle, CheckSquare, ListOrdered, ShieldAlert, AlertCircle, Compass,
  FileCheck, Bookmark, Feather, Scale, Clipboard, Layers, Lock, Shield, FileSpreadsheet, Eye,
  Ticket, Wallet, Percent, Bell, Key, Users, UserCheck, UserPlus, TrendingUp, BarChart3,
  ThumbsUp, Activity, PartyPopper, CheckCircle2, Smile, Radio, Tv, Search, User, QrCode,
  Clock, Smartphone, Hash, List, Tag, Calendar, Hourglass, Timer, PlayCircle, Dices, CheckCircle, Milestone,
  Slash
} from 'lucide-react';

// Mapeamento mestre de todos os ícones disponíveis no sistema
export const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Trophy, Gift, Award, Crown, Sparkles, Gem, Medal, Star, Flame, Zap,
  Package, ShoppingBag, ShoppingCart, Heart, Target, Disc, ShieldCheck, Sun, Rocket, Coins, DollarSign,
  FileText, BookOpen, Scroll, Info, HelpCircle, CheckSquare, ListOrdered, ShieldAlert, AlertCircle, Compass,
  FileCheck, Bookmark, Feather, Scale, Clipboard, Layers, Lock, Shield, FileSpreadsheet, Eye,
  Ticket, Wallet, Percent, Bell, Key, Users, UserCheck, UserPlus, TrendingUp, BarChart3,
  ThumbsUp, Activity, PartyPopper, CheckCircle2, Smile, Radio, Tv, Search, User, QrCode,
  Clock, Smartphone, Hash, List, Tag, Calendar, Hourglass, Timer, PlayCircle, Dices, CheckCircle, Milestone,
  Slash
};

export interface OpcaoIcone {
  id: string;
  nome: string;
  icon: React.ComponentType<any>;
}

// 20 Opções de Ícones para cada Seção do Sistema
export const ICON_SETS = {
  premios: [
    { id: 'Trophy', nome: 'Troféu Ouro', icon: Trophy },
    { id: 'Gift', nome: 'Presente', icon: Gift },
    { id: 'Award', nome: 'Medalha Honra', icon: Award },
    { id: 'Crown', nome: 'Coroa Imperial', icon: Crown },
    { id: 'Sparkles', nome: 'Brilho Mágico', icon: Sparkles },
    { id: 'Gem', nome: 'Diamante', icon: Gem },
    { id: 'Medal', nome: 'Medalha Vitória', icon: Medal },
    { id: 'Star', nome: 'Estrela', icon: Star },
    { id: 'Flame', nome: 'Fogo / Fogueira', icon: Flame },
    { id: 'Zap', nome: 'Raio Turbo', icon: Zap },
    { id: 'Package', nome: 'Caixa / Pacote', icon: Package },
    { id: 'ShoppingBag', nome: 'Sacola Compras', icon: ShoppingBag },
    { id: 'Heart', nome: 'Coração', icon: Heart },
    { id: 'Target', nome: 'Alvo Certeiro', icon: Target },
    { id: 'Disc', nome: 'Disco / Selo', icon: Disc },
    { id: 'ShieldCheck', nome: 'Escudo Seguro', icon: ShieldCheck },
    { id: 'Sun', nome: 'Sol Radiante', icon: Sun },
    { id: 'Rocket', nome: 'Foguete', icon: Rocket },
    { id: 'Coins', nome: 'Moedas Ouro', icon: Coins },
    { id: 'DollarSign', nome: 'Cifrão Dinheiro', icon: DollarSign },
  ] as OpcaoIcone[],

  regulamento: [
    { id: 'FileText', nome: 'Documento / Termos', icon: FileText },
    { id: 'BookOpen', nome: 'Livro Aberto', icon: BookOpen },
    { id: 'Scroll', nome: 'Pergaminho', icon: Scroll },
    { id: 'Info', nome: 'Informações Gerais', icon: Info },
    { id: 'HelpCircle', nome: 'Ajuda / Dúvidas', icon: HelpCircle },
    { id: 'CheckSquare', nome: 'Checklist Regras', icon: CheckSquare },
    { id: 'ListOrdered', nome: 'Passo a Passo', icon: ListOrdered },
    { id: 'ShieldAlert', nome: 'Aviso Seguro', icon: ShieldAlert },
    { id: 'AlertCircle', nome: 'Alerta Importante', icon: AlertCircle },
    { id: 'Compass', nome: 'Guia / Bússola', icon: Compass },
    { id: 'FileCheck', nome: 'Regras Validadas', icon: FileCheck },
    { id: 'Bookmark', nome: 'Marcador / Guia', icon: Bookmark },
    { id: 'Feather', nome: 'Edital Oficial', icon: Feather },
    { id: 'Scale', nome: 'Legalidade / Balança', icon: Scale },
    { id: 'Clipboard', nome: 'Prancheta Regulamento', icon: Clipboard },
    { id: 'Layers', nome: 'Camadas / Tópicos', icon: Layers },
    { id: 'Lock', nome: 'Segurança / Transparência', icon: Lock },
    { id: 'Shield', nome: 'Proteção Jurídica', icon: Shield },
    { id: 'FileSpreadsheet', nome: 'Tabela Detalhes', icon: FileSpreadsheet },
    { id: 'Eye', nome: 'Transparência Pública', icon: Eye },
  ] as OpcaoIcone[],

  cotasPremiadas: [
    { id: 'Ticket', nome: 'Bilhete Premiado', icon: Ticket },
    { id: 'Sparkles', nome: 'Brilho Instantâneo', icon: Sparkles },
    { id: 'Gem', nome: 'Cota de Diamante', icon: Gem },
    { id: 'Flame', nome: 'Cota Quente', icon: Flame },
    { id: 'Star', nome: 'Estrela da Sorte', icon: Star },
    { id: 'Zap', nome: 'Pix na Hora', icon: Zap },
    { id: 'Gift', nome: 'Prêmio Instantâneo', icon: Gift },
    { id: 'Crown', nome: 'Cota Real', icon: Crown },
    { id: 'Trophy', nome: 'Troféu Pix', icon: Trophy },
    { id: 'Award', nome: 'Medalha Pix', icon: Award },
    { id: 'DollarSign', nome: 'Dinheiro na Conta', icon: DollarSign },
    { id: 'Wallet', nome: 'Carteira Pix', icon: Wallet },
    { id: 'Percent', nome: 'Desconto / Prêmio', icon: Percent },
    { id: 'Bell', nome: 'Notificação Pix', icon: Bell },
    { id: 'Eye', nome: 'Achou Ganhou', icon: Eye },
    { id: 'Compass', nome: 'Radar Premiado', icon: Compass },
    { id: 'Rocket', nome: 'Turbo Pix', icon: Rocket },
    { id: 'Shield', nome: 'Pix Garantido', icon: Shield },
    { id: 'Key', nome: 'Chave da Sorte', icon: Key },
    { id: 'Heart', nome: 'Cota do Coração', icon: Heart },
  ] as OpcaoIcone[],

  topCompradores: [
    { id: 'Users', nome: 'Comunidade', icon: Users },
    { id: 'Crown', nome: 'Rei das Cotas', icon: Crown },
    { id: 'Trophy', nome: 'Líder do Ranking', icon: Trophy },
    { id: 'Medal', nome: 'Pódio Compradores', icon: Medal },
    { id: 'Award', nome: 'Destaque Participação', icon: Award },
    { id: 'Flame', nome: 'Mais Ativos', icon: Flame },
    { id: 'UserCheck', nome: 'Comprador Verificado', icon: UserCheck },
    { id: 'Heart', nome: 'Apoiadores Fiéis', icon: Heart },
    { id: 'Star', nome: 'Estrelas da Rifa', icon: Star },
    { id: 'Sparkles', nome: 'Top VIP', icon: Sparkles },
    { id: 'Shield', nome: 'Guardiões', icon: Shield },
    { id: 'UserPlus', nome: 'Novos Participantes', icon: UserPlus },
    { id: 'TrendingUp', nome: 'Gráfico Subindo', icon: TrendingUp },
    { id: 'BarChart3', nome: 'Estatísticas Top', icon: BarChart3 },
    { id: 'Target', nome: 'Foco no Prêmio', icon: Target },
    { id: 'Compass', nome: 'Líderes', icon: Compass },
    { id: 'Zap', nome: 'Compradores Rápidos', icon: Zap },
    { id: 'Gem', nome: 'Compradores Diamante', icon: Gem },
    { id: 'ThumbsUp', nome: 'Mais Curtidos', icon: ThumbsUp },
    { id: 'Activity', nome: 'Atividade em Alta', icon: Activity },
  ] as OpcaoIcone[],

  ganhadores: [
    { id: 'PartyPopper', nome: 'Confetes Festa', icon: PartyPopper },
    { id: 'Trophy', nome: 'Grande Campeão', icon: Trophy },
    { id: 'Award', nome: 'Prêmio Entregue', icon: Award },
    { id: 'Crown', nome: 'Ganhador Coroado', icon: Crown },
    { id: 'Medal', nome: 'Medalha Campeão', icon: Medal },
    { id: 'Sparkles', nome: 'Momento Mágico', icon: Sparkles },
    { id: 'Star', nome: 'Estrela Contemplada', icon: Star },
    { id: 'Gift', nome: 'Prêmio nas Mãos', icon: Gift },
    { id: 'Flame', nome: 'Resultado Quente', icon: Flame },
    { id: 'Users', nome: 'Todos Ganhadores', icon: Users },
    { id: 'CheckCircle2', nome: 'Apuração 100% OK', icon: CheckCircle2 },
    { id: 'Heart', nome: 'Felicidade / Sonho', icon: Heart },
    { id: 'Smile', nome: 'Ganhador Feliz', icon: Smile },
    { id: 'ShieldCheck', nome: 'Resultado Auditado', icon: ShieldCheck },
    { id: 'Rocket', nome: 'Sonho Realizado', icon: Rocket },
    { id: 'Zap', nome: 'Pix Pago ao Ganhador', icon: Zap },
    { id: 'Coins', nome: 'Bolada Entregue', icon: Coins },
    { id: 'Gem', nome: 'Prêmio de Luxo', icon: Gem },
    { id: 'Radio', nome: 'Transmissão Ao Vivo', icon: Radio },
    { id: 'Tv', nome: 'Sorteio Transmitido', icon: Tv },
  ] as OpcaoIcone[],

  meusNumeros: [
    { id: 'Search', nome: 'Buscar Cotas', icon: Search },
    { id: 'Ticket', nome: 'Meus Bilhetes', icon: Ticket },
    { id: 'User', nome: 'Meus Dados', icon: User },
    { id: 'CheckCircle2', nome: 'Cotas Pagas', icon: CheckCircle2 },
    { id: 'QrCode', nome: 'Comprovante Pix', icon: QrCode },
    { id: 'Key', nome: 'Acesso às Cotas', icon: Key },
    { id: 'Eye', nome: 'Consultar Pedido', icon: Eye },
    { id: 'Clock', nome: 'Histórico de Compras', icon: Clock },
    { id: 'FileText', nome: 'Extrato de Números', icon: FileText },
    { id: 'Smartphone', nome: 'Acesso via WhatsApp', icon: Smartphone },
    { id: 'Hash', nome: 'Lista de Números', icon: Hash },
    { id: 'Layers', nome: 'Todas Minhas Cotas', icon: Layers },
    { id: 'ShieldCheck', nome: 'Reserva Segura', icon: ShieldCheck },
    { id: 'List', nome: 'Lista Ordenada', icon: List },
    { id: 'Bookmark', nome: 'Cotas Salvas', icon: Bookmark },
    { id: 'HelpCircle', nome: 'Onde Estão Minhas Cotas', icon: HelpCircle },
    { id: 'Sparkles', nome: 'Minhas Cotas da Sorte', icon: Sparkles },
    { id: 'Star', nome: 'Cotas Favoritas', icon: Star },
    { id: 'Tag', nome: 'Etiquetas de Cotas', icon: Tag },
    { id: 'Award', nome: 'Certificado de Compra', icon: Award },
  ] as OpcaoIcone[],

  sorteio: [
    { id: 'Calendar', nome: 'Data do Sorteio', icon: Calendar },
    { id: 'Clock', nome: 'Horário Oficial', icon: Clock },
    { id: 'Hourglass', nome: 'Contagem Regressiva', icon: Hourglass },
    { id: 'Timer', nome: 'Cronômetro Final', icon: Timer },
    { id: 'PlayCircle', nome: 'Ao Vivo / Play', icon: PlayCircle },
    { id: 'Dices', nome: 'Apuração Federal', icon: Dices },
    { id: 'Sparkles', nome: 'Dia da Sorte', icon: Sparkles },
    { id: 'Flame', nome: 'Reta Final', icon: Flame },
    { id: 'CheckCircle', nome: 'Sorteio Realizado', icon: CheckCircle },
    { id: 'Bell', nome: 'Aviso de Sorteio', icon: Bell },
    { id: 'Target', nome: 'Extração Oficial', icon: Target },
    { id: 'Compass', nome: 'Loteria Federal', icon: Compass },
    { id: 'Radio', nome: 'Transmissão no Ar', icon: Radio },
    { id: 'Tv', nome: 'Canal do Sorteio', icon: Tv },
    { id: 'Activity', nome: 'Sorteio em Andamento', icon: Activity },
    { id: 'Trophy', nome: 'Apuração Final', icon: Trophy },
    { id: 'Zap', nome: 'Sorteio Imediato', icon: Zap },
    { id: 'Shield', nome: 'Sorteio Auditado', icon: Shield },
    { id: 'Disc', nome: 'Globo do Sorteio', icon: Disc },
    { id: 'Milestone', nome: 'Meta de Sorteio', icon: Milestone },
  ] as OpcaoIcone[],
  botaoCompra: [
    { id: 'none', nome: 'Nenhum (Sem Ícone)', icon: Slash },
    { id: 'Sparkles', nome: 'Brilho Mágico', icon: Sparkles },
    { id: 'ShoppingCart', nome: 'Carrinho Compras', icon: ShoppingCart },
    { id: 'ShoppingBag', nome: 'Sacola Compras', icon: ShoppingBag },
    { id: 'Ticket', nome: 'Cota / Ticket', icon: Ticket },
    { id: 'Flame', nome: 'Fogo / Fogueira', icon: Flame },
    { id: 'Zap', nome: 'Raio Turbo', icon: Zap },
    { id: 'CheckCircle2', nome: 'Check Verificado', icon: CheckCircle2 },
    { id: 'CheckSquare', nome: 'Check Quadrado', icon: CheckSquare },
    { id: 'Trophy', nome: 'Troféu Ouro', icon: Trophy },
    { id: 'Gift', nome: 'Presente', icon: Gift },
    { id: 'Crown', nome: 'Coroa Imperial', icon: Crown },
    { id: 'Star', nome: 'Estrela', icon: Star },
    { id: 'ShieldCheck', nome: 'Escudo Seguro', icon: ShieldCheck },
    { id: 'Rocket', nome: 'Foguete', icon: Rocket },
    { id: 'Coins', nome: 'Moedas Ouro', icon: Coins },
    { id: 'DollarSign', nome: 'Cifrão R$', icon: DollarSign },
    { id: 'Heart', nome: 'Coração', icon: Heart },
    { id: 'ThumbsUp', nome: 'Joinha', icon: ThumbsUp },
    { id: 'PartyPopper', nome: 'Festa Confete', icon: PartyPopper },
  ] as OpcaoIcone[],
};

// Retorna o componente de ícone correspondente
export function getSectionIcon(name?: string, fallback: React.ComponentType<any> | null = Trophy): React.ComponentType<any> | null {
  if (!name || name === 'none' || name === 'nenhum') return null;
  return ICON_MAP[name] || fallback;
}

// Converte HEX para RGBA seguro
export function hexToRgba(hex?: string, alpha: number = 1): string {
  if (!hex || typeof hex !== 'string') return `rgba(16, 185, 129, ${alpha})`;
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) return `rgba(16, 185, 129, ${alpha})`;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Escurece uma cor HEX para gerar sombras 3D perfeitas
export function escurecerCor(hex?: string, percent: number = 30): string {
  if (!hex || typeof hex !== 'string') return '#047857';
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) return '#047857';
  let r = parseInt(clean.substring(0, 2), 16);
  let g = parseInt(clean.substring(2, 4), 16);
  let b = parseInt(clean.substring(4, 6), 16);

  r = Math.max(0, Math.floor(r * (1 - percent / 100)));
  g = Math.max(0, Math.floor(g * (1 - percent / 100)));
  b = Math.max(0, Math.floor(b * (1 - percent / 100)));

  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');
  return `#${rHex}${gHex}${bHex}`;
}

export type TipoEstiloBotao = 'solido' | 'vidro' | 'transparente' | '3d';

export interface ParametrosEstiloBotao {
  estilo?: TipoEstiloBotao | string;
  corFundo?: string;
  corTexto?: string;
  corBorda?: string;
  raioBorda?: number;
  tamanhoAltura?: number;
  tamanhoTexto?: number;
  sombraAltura?: number;
  sombraLargura?: number;
  corSombra?: string;
  isPressionado?: boolean;
}

/**
 * Retorna os estilos inline e classes exatas para renderizar qualquer botão
 * com distinção visual real entre Sólido, Vidro, Transparente e Sombra 3D.
 */
export function calcularEstiloBotao(params: ParametrosEstiloBotao): { style: React.CSSProperties; className: string } {
  const {
    estilo = 'solido',
    corFundo = '#10b981',
    corTexto = '#ffffff',
    corBorda,
    raioBorda = 12,
    tamanhoAltura = 16,
    tamanhoTexto = 15,
    sombraAltura = 4,
    sombraLargura = 4,
    corSombra,
    isPressionado = false
  } = params;

  const bordaRaioPx = `${raioBorda}px`;
  const sombraCorFinal = corSombra || escurecerCor(corFundo, 35);
  const bordaPadrao = corBorda || hexToRgba(corFundo, 0.6);

  let style: React.CSSProperties = {
    borderRadius: bordaRaioPx,
    paddingTop: `${Math.max(6, Math.floor(tamanhoAltura * 0.75))}px`,
    paddingBottom: `${Math.max(6, Math.floor(tamanhoAltura * 0.75))}px`,
    fontSize: `${tamanhoTexto}px`,
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  let className = 'relative font-black tracking-wide flex items-center justify-center select-none ';

  switch (estilo) {
    case 'vidro':
      style = {
        ...style,
        background: `linear-gradient(135deg, ${hexToRgba(corFundo, 0.35)} 0%, ${hexToRgba(corFundo, 0.15)} 100%)`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${hexToRgba('#ffffff', 0.25)}`,
        boxShadow: `0 8px 24px 0 ${hexToRgba(corFundo, 0.25)}, inset 0 1px 1px 0 rgba(255, 255, 255, 0.45)`,
        color: corTexto,
      };
      className += 'hover:brightness-110 active:scale-[0.98]';
      break;

    case 'transparente':
      style = {
        ...style,
        backgroundColor: 'transparent',
        border: `2px solid ${corFundo}`,
        color: corTexto === '#022c22' || corTexto === '#000000' ? corFundo : corTexto,
        boxShadow: `0 0 12px ${hexToRgba(corFundo, 0.15)}`,
      };
      className += 'hover:bg-white/10 active:scale-[0.98]';
      break;

    case '3d':
      const altura = Math.max(2, sombraAltura || 4);
      const largura = Math.max(2, sombraLargura || 4);
      style = {
        ...style,
        backgroundColor: corFundo,
        color: corTexto,
        border: `1px solid ${hexToRgba('#ffffff', 0.2)}`,
        boxShadow: isPressionado
          ? `0px 1px 0px ${sombraCorFinal}, 0px 2px 4px rgba(0, 0, 0, 0.3)`
          : `0px ${altura}px 0px ${sombraCorFinal}, 0px ${altura + 2}px ${largura}px rgba(0, 0, 0, 0.4)`,
        transform: isPressionado ? `translateY(${altura - 1}px)` : 'translateY(0px)',
      };
      className += 'active:translate-y-1 active:shadow-none cursor-pointer';
      break;

    case 'solido':
    default:
      style = {
        ...style,
        backgroundColor: corFundo,
        color: corTexto,
        border: `1px solid ${hexToRgba('#ffffff', 0.15)}`,
        boxShadow: `0 4px 14px 0 ${hexToRgba(corFundo, 0.35)}`,
      };
      className += 'hover:brightness-105 active:scale-[0.98]';
      break;
  }

  return { style, className };
}

/**
 * Retorna os estilos inline e classes para Cards (Premiação, Regulamento, Ranking, etc)
 */
export function calcularEstiloCard(params: {
  estilo?: TipoEstiloBotao | string;
  corFundo?: string;
  corBorda?: string;
  raioBorda?: number;
  sombraAltura?: number;
  corSombra?: string;
}): { style: React.CSSProperties; className: string } {
  const {
    estilo = 'solido',
    corFundo = '#1e293b',
    corBorda = '#334155',
    raioBorda = 16,
    sombraAltura = 4,
    corSombra
  } = params;

  let style: React.CSSProperties = {
    borderRadius: `${raioBorda}px`,
    transition: 'all 0.2s ease',
  };

  let className = 'relative p-5 ';

  switch (estilo) {
    case 'vidro':
      style = {
        ...style,
        background: `linear-gradient(135deg, ${hexToRgba(corFundo, 0.65)} 0%, ${hexToRgba(corFundo, 0.35)} 100%)`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${hexToRgba('#ffffff', 0.15)}`,
        boxShadow: `0 12px 32px 0 rgba(0, 0, 0, 0.35), inset 0 1px 1px 0 rgba(255, 255, 255, 0.25)`,
      };
      break;

    case 'transparente':
      style = {
        ...style,
        backgroundColor: 'transparent',
        border: `2px solid ${corBorda}`,
        boxShadow: 'none',
      };
      break;

    case '3d':
      const altura = Math.max(2, sombraAltura || 4);
      const sombraCor = corSombra || escurecerCor(corFundo, 40);
      style = {
        ...style,
        backgroundColor: corFundo,
        border: `1px solid ${corBorda}`,
        boxShadow: `0px ${altura}px 0px ${sombraCor}, 0px ${altura + 4}px 12px rgba(0, 0, 0, 0.45)`,
      };
      break;

    case 'solido':
    default:
      style = {
        ...style,
        backgroundColor: corFundo,
        border: `1px solid ${corBorda}`,
        boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.25)',
      };
      break;
  }

  return { style, className };
}
