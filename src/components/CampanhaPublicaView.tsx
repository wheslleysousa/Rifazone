import React, { useState, useEffect } from 'react';
import { Campanha, CampanhaPublicaResponse, Promocao, OfertaRelampago, TemaCampanha, TEMA_PADRAO, DEFAULT_CHECKOUT_CONFIG, RankingItem } from '../types';
import { 
  Trophy, Flame, Sparkles, ShieldCheck, Ticket, Users,
  ChevronDown, ChevronUp, Plus, Minus, Gift, Info,
  Smartphone, Share2, Instagram, AlertTriangle, Copy, CheckCircle2,
  User, CreditCard, QrCode, FileText, Lock, Shield, X
} from 'lucide-react';
import { UpsellModal } from './UpsellModal';
import { PixPaymentModal } from './PixPaymentModal';
import { BoletoPaymentModal } from './BoletoPaymentModal';
import { CartaoSuccessModal } from './CartaoSuccessModal';
import { MeusNumerosModal } from './MeusNumerosModal';
import { MeusDadosModal } from './MeusDadosModal';
import { formatarMoeda, toCents, toReais } from '../lib/money';
import { 
  initMetaPixel, 
  trackViewContent, 
  trackInitiateCheckout, 
  trackAddPaymentInfo, 
  trackPurchase 
} from '../lib/meta-pixel';
import { 
  formatarNumeroCartao, 
  formatarValidade, 
  criarCardTokenMercadoPago, 
  detectarBandeiraCartao 
} from '../lib/mercadopago-client';

interface Props {
  codigo?: string;
  onNavigateAdmin?: () => void;
  modoPreview?: boolean;
  previewCampanha?: Campanha;
  previewTema?: TemaCampanha;
}

export const CampanhaPublicaView: React.FC<Props> = ({
  codigo = '',
  onNavigateAdmin,
  modoPreview = false,
  previewCampanha,
  previewTema
}) => {
  const [data, setData] = useState<CampanhaPublicaResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // Seleção de cotas
  const [quantidade, setQuantidade] = useState<number>(10);
  const [qtdInicializada, setQtdInicializada] = useState(false);
  const [cotasManuais] = useState<string[]>([]);
  const [descricaoAberta, setDescricaoAberta] = useState(false);

  // Form Comprador Modal Checkout
  const [checkoutAberto, setCheckoutAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [maiorIdade, setMaiorIdade] = useState(true);
  const [compradorSalvo, setCompradorSalvo] = useState<{ nome: string; whatsapp: string } | null>(null);
  const [formErro, setFormErro] = useState('');
  const [enviandoPedido, setEnviandoPedido] = useState(false);

  // Checkout Transparente: Métodos de Pagamento & Cartão
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao' | 'boleto'>('pix');
  const [cartaoNumero, setCartaoNumero] = useState('');
  const [cartaoNome, setCartaoNome] = useState('');
  const [cartaoValidade, setCartaoValidade] = useState('');
  const [cartaoCvv, setCartaoCvv] = useState('');
  const [cartaoCpf, setCartaoCpf] = useState('');
  const [cartaoParcelas, setCartaoParcelas] = useState<number>(1);

  // Modals de Pagamento
  const [boletoModalData, setBoletoModalData] = useState<{
    pedidoId: string;
    boletoUrl?: string;
    boletoBarcode?: string;
    linhaDigitavel?: string;
    valorTotal: number;
    quantidade: number;
    expiraEm: string;
    compradorNome?: string;
    compradorWhatsapp?: string;
  } | null>(null);

  const [cartaoSuccessModalData, setCartaoSuccessModalData] = useState<{
    pedidoId: string;
    valorTotal: number;
    quantidade: number;
    numeros: string[];
    cartaoInfo?: {
      ultimosDigitos?: string;
      bandeira?: string;
      parcelas?: number;
      status?: string;
    };
    compradorNome?: string;
  } | null>(null);

  // Menu Lateral Drawer
  const [menuAberto, setMenuAberto] = useState(false);

  // Contador Regressivo (Aguardando Início / Em Andamento / Encerrada)
  const [tempoRestante, setTempoRestante] = useState<{ 
    dias: number; 
    horas: number; 
    minutos: number; 
    segundos: number; 
    status: 'aguardando_inicio' | 'em_andamento' | 'encerrada';
  } | null>(null);

  // Modal Meus Dados
  const [meusDadosAberto, setMeusDadosAberto] = useState(false);

  // Modal de Diagnóstico de Erro (para suporte)
  const [erroDiagnostico, setErroDiagnostico] = useState<{
    titulo: string;
    mensagem: string;
    detalhes?: any;
    isTestToken?: boolean;
  } | null>(null);
  const [erroCopiado, setErroCopiado] = useState(false);

  // Oferta Relâmpago / Upsell
  const [upsellAberto, setUpsellAberto] = useState(false);
  const [ofertaSelecionada, setOfertaSelecionada] = useState<OfertaRelampago | null>(null);

  // Pix Modal
  const [pixModalData, setPixModalData] = useState<{
    pedidoId: string;
    pixCopiaCola: string;
    pixQrCodeBase64: string;
    valorTotal: number;
    quantidade: number;
    expiraEm: string;
    isMock?: boolean;
    compradorNome?: string;
    compradorWhatsapp?: string;
  } | null>(null);

  // Meus Números Modal
  const [meusNumerosAberto, setMeusNumerosAberto] = useState(false);

  // Modal de Todas as Campanhas do Organizador
  const [organizadorModalAberto, setOrganizadorModalAberto] = useState(false);
  const [campanhasOrganizador, setCampanhasOrganizador] = useState<Campanha[]>([]);
  const [carregandoOrganizador, setCarregandoOrganizador] = useState(false);

  useEffect(() => {
    if (organizadorModalAberto) {
      setCarregandoOrganizador(true);
      fetch('/api/campanhas')
        .then(res => res.json())
        .then(resData => {
          if (Array.isArray(resData)) {
            setCampanhasOrganizador(resData.filter((c: Campanha) => c.status === 'publicada' || c.status === 'pausada'));
          }
        })
        .catch(err => console.error('Erro ao buscar campanhas do organizador:', err))
        .finally(() => setCarregandoOrganizador(false));
    }
  }, [organizadorModalAberto]);

  // Cupom de Desconto
  const [cupomInput, setCupomInput] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState<{ codigo: string; descontoPct: number; mensagem?: string } | null>(null);
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [cupomErro, setCupomErro] = useState('');

  // Inicializar dados do comprador do localStorage e Cupom da URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const c = params.get('cupom');
      if (c) {
        setCupomInput(c.toUpperCase());
      }

      const savedNome = localStorage.getItem('rifazone_comprador_nome') || localStorage.getItem('rifapix_comprador_nome');
      const savedPhone = localStorage.getItem('rifazone_comprador_whatsapp') || localStorage.getItem('rifapix_comprador_whatsapp');
      const savedCpf = localStorage.getItem('rifazone_comprador_cpf') || localStorage.getItem('rifapix_comprador_cpf');
      const savedEmail = localStorage.getItem('rifazone_comprador_email') || localStorage.getItem('rifapix_comprador_email');

      if (savedNome) setNome(savedNome);
      if (savedPhone) {
        setWhatsapp(formatWhatsapp(savedPhone));
        setCompradorSalvo({ nome: savedNome || 'Participante', whatsapp: savedPhone });
      }
      if (savedCpf) setCpf(savedCpf);
      if (savedEmail) setEmail(savedEmail);
    } catch (e) {}
  }, []);

  const handleValidarCupom = async (codOverride?: string) => {
    const cod = (codOverride || cupomInput).trim().toUpperCase();
    if (!cod || !data?.campanha?.id) return;

    setValidandoCupom(true);
    setCupomErro('');
    try {
      const res = await fetch('/api/pedidos/validar-cupom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campanhaId: data.campanha.id, cupom: cod })
      });
      const json = await res.json();
      if (res.ok && json.valido) {
        setCupomAplicado({
          codigo: json.codigo,
          descontoPct: json.descontoPct,
          mensagem: json.mensagem
        });
        setCupomInput(json.codigo);
      } else {
        setCupomErro(json.error || 'Cupom de desconto inválido.');
        setCupomAplicado(null);
      }
    } catch (e) {
      setCupomErro('Erro ao validar cupom.');
    } finally {
      setValidandoCupom(false);
    }
  };

  // Carregar dados da campanha
  const carregarCampanha = async () => {
    if (modoPreview && previewCampanha) {
      let realEst = {
        totalCotas: previewCampanha.totalCotas || 10000,
        vendidas: 0,
        reservadas: 0,
        disponiveis: previewCampanha.totalCotas || 10000,
        percentualVendido: 0
      };
      let realRank: RankingItem[] = [];

      // Se a campanha já tem um código e não é um mock, tenta buscar as estatísticas reais
      if (previewCampanha.codigo && !previewCampanha.codigo.startsWith('sorteio-preview')) {
        try {
          const res = await fetch(`/api/campanhas/${previewCampanha.codigo}`);
          if (res.ok) {
            const json: CampanhaPublicaResponse = await res.json();
            if (json.estatisticas) {
              realEst = {
                ...json.estatisticas,
                totalCotas: previewCampanha.totalCotas || json.estatisticas.totalCotas
              };
            }
            if (json.ranking) {
              realRank = json.ranking;
            }
          }
        } catch (e) {
          // Ignora erro
        }
      }

      setData({
        campanha: previewCampanha,
        estatisticas: realEst,
        ranking: realRank
      });

      if (!qtdInicializada) {
        if (previewCampanha.promocoes && previewCampanha.promocoes.length > 0) {
          const promoDestaque = previewCampanha.promocoes.find(p => p.destaque) || previewCampanha.promocoes[0];
          setQuantidade(promoDestaque.quantidade);
        } else {
          setQuantidade(previewCampanha.minPorCompra || 10);
        }
        setQtdInicializada(true);
      } else {
        setQuantidade(prev => {
          if (prev < (previewCampanha.minPorCompra || 1)) {
            return previewCampanha.minPorCompra || 1;
          }
          return prev;
        });
      }
      setCarregando(false);
      return;
    }

    if (!codigo) return;

    try {
      setCarregando(true);
      const res = await fetch(`/api/campanhas/${codigo}`);
      if (!res.ok) {
        throw new Error('Campanha não encontrada.');
      }
      const json: CampanhaPublicaResponse = await res.json();
      setData(json);

      const pixelId = json.campanha?.metaPixelId || json.marca?.metaPixelId;
      if (pixelId && json.campanha) {
        trackViewContent(pixelId, {
          contentIds: [json.campanha.id],
          contentName: json.campanha.titulo,
          value: json.campanha.valorCota
        });
      }

      // Seta default quantidade apenas na primeira carga
      if (!qtdInicializada) {
        if (json.campanha.promocoes && json.campanha.promocoes.length > 0) {
          const promoDestaque = json.campanha.promocoes.find(p => p.destaque) || json.campanha.promocoes[0];
          setQuantidade(promoDestaque.quantidade);
        } else {
          setQuantidade(json.campanha.minPorCompra || 10);
        }
        setQtdInicializada(true);
      } else {
        setQuantidade(prev => {
          if (prev < (json.campanha.minPorCompra || 1)) {
            return json.campanha.minPorCompra || 1;
          }
          return prev;
        });
      }
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar sorteio.');
    } finally {
      setCarregando(false);
    }
  };

  const strPreviewCampanha = previewCampanha ? JSON.stringify(previewCampanha) : '';

  useEffect(() => {
    carregarCampanha();
  }, [codigo, modoPreview, strPreviewCampanha]);

  // Efeito do Contador Regressivo (Início e Término)
  useEffect(() => {
    const camp = data?.campanha;
    if (!camp) return;

    if (camp.agendamentoAtivo === false) {
      setTempoRestante(null);
      return;
    }

    const interval = setInterval(() => {
      const agora = new Date().getTime();
      const inicio = camp.dataInicio ? new Date(camp.dataInicio).getTime() : null;
      const fim = camp.dataTermino ? new Date(camp.dataTermino).getTime() : null;

      if (inicio && agora < inicio) {
        const diff = inicio - agora;
        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diff % (1000 * 60)) / 1000);
        setTempoRestante({ dias, horas, minutos, segundos, status: 'aguardando_inicio' });
      } else if (fim && agora < fim) {
        const diff = fim - agora;
        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diff % (1000 * 60)) / 1000);
        setTempoRestante({ dias, horas, minutos, segundos, status: 'em_andamento' });
      } else if (fim && agora >= fim) {
        setTempoRestante({ dias: 0, horas: 0, minutos: 0, segundos: 0, status: 'encerrada' });
        clearInterval(interval);
      } else {
        setTempoRestante(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [data?.campanha?.agendamentoAtivo, data?.campanha?.dataInicio, data?.campanha?.dataTermino]);

  // Função para calcular idade pela data de nascimento (suporta DD/MM/AAAA e AAAA-MM-DD)
  const calcularIdade = (dataNascStr: string): number | null => {
    if (!dataNascStr) return null;
    let nasc: Date;
    if (dataNascStr.includes('/')) {
      const parts = dataNascStr.split('/');
      if (parts.length !== 3 || parts[2].length !== 4) return null;
      const dia = parseInt(parts[0], 10);
      const mes = parseInt(parts[1], 10);
      const ano = parseInt(parts[2], 10);
      if (isNaN(dia) || isNaN(mes) || isNaN(ano) || mes < 1 || mes > 12 || dia < 1 || dia > 31 || ano < 1900) return null;
      nasc = new Date(ano, mes - 1, dia);
    } else {
      nasc = new Date(dataNascStr);
    }
    if (isNaN(nasc.getTime())) return null;
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return idade;
  };

  // Formatação de data de nascimento DD/MM/AAAA (ex: 01062004 -> 01/06/2004)
  const formatDataNascimento = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 8);
    if (raw.length <= 2) return raw;
    if (raw.length <= 4) return `${raw.slice(0, 2)}/${raw.slice(2)}`;
    return `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`;
  };

  // Formatação de telefone
  const formatWhatsapp = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) return raw;
    if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium text-sm">Carregando campanha oficial...</p>
      </div>
    );
  }

  if (erro || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center text-red-400 mb-4">
          <Ticket className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black mb-2">Campanha não encontrada</h2>
        <p className="text-slate-400 text-sm max-w-md mb-6">
          {erro || 'O link pode estar incorreto ou a campanha foi encerrada.'}
        </p>
        <button
          onClick={onNavigateAdmin}
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition"
        >
          Ir para o Painel Admin
        </button>
      </div>
    );
  }

  const { campanha, estatisticas, ranking, marca } = data;

  // Resolução do tema ativo com fallbacks seguros para o TEMA_PADRAO (aceita previewTema se fornecido)
  const temaAtivo = previewTema || campanha.tema;
  const tema: TemaCampanha = {
    ...TEMA_PADRAO,
    ...(temaAtivo || {}),
    cores: { ...TEMA_PADRAO.cores, ...(temaAtivo?.cores || {}) },
    botao: { ...TEMA_PADRAO.botao, ...(temaAtivo?.botao || {}) },
    tipografia: { ...TEMA_PADRAO.tipografia, ...(temaAtivo?.tipografia || {}) },
    layout: {
      ordem: (temaAtivo?.layout?.ordem && temaAtivo.layout.ordem.length > 0)
        ? temaAtivo.layout.ordem
        : TEMA_PADRAO.layout.ordem,
      visivel: { ...TEMA_PADRAO.layout.visivel, ...(temaAtivo?.layout?.visivel || {}) }
    }
  };

  // Variáveis CSS aplicadas no container raiz
  const rootCssVariables = {
    '--brand': tema.cores.primaria,
    '--brand-2': tema.cores.destaque,
    '--bg': tema.cores.fundo,
    '--texto': tema.cores.texto,
    '--btn': tema.cores.botao,
    '--btn-txt': tema.cores.textoBotao,
  } as React.CSSProperties;

  // Helpers de classes de estilo baseadas no tema
  const getBtnRoundingClass = (formato?: string) => {
    if (formato === 'reto') return 'rounded-none';
    if (formato === 'pill') return 'rounded-full';
    return 'rounded-xl';
  };

  const getBtnSizeClass = (tamanho?: string) => {
    if (tamanho === 'sm') return 'py-2.5 px-4 text-xs';
    if (tamanho === 'lg') return 'py-4 px-6 text-base';
    return 'py-3 px-5 text-sm';
  };

  const getTitleSizeClass = (tamanho?: string) => {
    if (tamanho === 'sm') return 'text-lg sm:text-xl';
    if (tamanho === 'lg') return 'text-2xl sm:text-3xl';
    return 'text-xl sm:text-2xl';
  };

  const getFontFamilyClass = (fonte?: string) => {
    if (fonte === 'serif') return 'font-serif';
    if (fonte === 'display') return 'font-sans tracking-tight';
    return 'font-sans';
  };

  // Cálculo de valor com suporte a pacotes e desconto progressivo
  const calcularValorTotal = (qtd: number): number => {
    if (campanha.promocoes && campanha.promocoes.length > 0) {
      const promo = campanha.promocoes.find(p => Number(p.quantidade) === qtd);
      if (promo) return toReais(toCents(promo.valor));
    }
    const valorBaseCents = qtd * toCents(campanha.valorCota);
    if (campanha.descontoPorValorTotal && campanha.descontoPorValorTotal.length > 0) {
      const regrasOrdenadas = [...campanha.descontoPorValorTotal].sort(
        (a, b) => toCents(b.aPartirDeValor) - toCents(a.aPartirDeValor)
      );
      const regraValida = regrasOrdenadas.find(r => valorBaseCents >= toCents(r.aPartirDeValor));
      if (regraValida && toCents(regraValida.valorCotaComDesconto) > 0) {
        return toReais(qtd * toCents(regraValida.valorCotaComDesconto));
      }
    }
    return toReais(valorBaseCents);
  };

  const valorSemCupom = calcularValorTotal(quantidade);
  const valorTotalAtual = cupomAplicado
    ? toReais(Math.round(toCents(valorSemCupom) * (1 - cupomAplicado.descontoPct / 100)))
    : valorSemCupom;

  // Botão Comprar / Iniciar Checkout
  const handleIniciarCompra = () => {
    if (modoPreview) {
      return;
    }
    const pixelId = campanha?.metaPixelId || data?.marca?.metaPixelId;
    if (pixelId && campanha) {
      trackInitiateCheckout(pixelId, {
        contentIds: [campanha.id],
        value: valorTotalAtual,
        numItems: quantidade
      });
    }
    // Determina o método inicial de pagamento conforme configuração do checkout
    const chk = campanha.checkout || DEFAULT_CHECKOUT_CONFIG;
    if (chk.metodos?.pix) {
      setMetodoPagamento('pix');
    } else if (chk.metodos?.cartao) {
      setMetodoPagamento('cartao');
    } else if (chk.metodos?.boleto) {
      setMetodoPagamento('boleto');
    }

    if (campanha.ofertasRelampago && campanha.ofertasRelampago.length > 0) {
      setOfertaSelecionada(campanha.ofertasRelampago[0]);
      setUpsellAberto(true);
    } else {
      setCheckoutAberto(true);
    }
  };

  const handleAceitarUpsell = () => {
    setUpsellAberto(false);
    setCheckoutAberto(true);
  };

  const handleRecusarUpsell = () => {
    setOfertaSelecionada(null);
    setUpsellAberto(false);
    setCheckoutAberto(true);
  };

  // Submit Pedido e Checkout Transparente (Pix, Cartão, Boleto)
  const handleEnviarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErro('');

    if (tempoRestante?.status === 'aguardando_inicio') {
      setFormErro('Esta campanha ainda não iniciou as vendas. Por favor, aguarde o horário de início.');
      return;
    }

    if (tempoRestante?.status === 'encerrada') {
      setFormErro('Esta campanha já foi encerrada e não está aceitando novos pedidos.');
      return;
    }

    const cleanWhatsapp = whatsapp.replace(/\D/g, '');
    if (cleanWhatsapp.length < 10) {
      setFormErro('Informe um WhatsApp válido com DDD.');
      return;
    }

    if (!maiorIdade) {
      setFormErro('É obrigatório declarar ter no mínimo 18 anos para participar.');
      return;
    }

    if (dataNascimento) {
      const idad = calcularIdade(dataNascimento);
      if (idad !== null && idad < 18) {
        setFormErro(`Pela sua data de nascimento, você tem ${idad} anos. É necessário ter 18 anos ou mais para participar.`);
        return;
      }
    }

    // Validação de CPF
    const cleanCpf = cpf.replace(/\D/g, '');
    if ((campanha.exigirCpf || metodoPagamento === 'boleto') && cleanCpf.length !== 11) {
      setFormErro('Informe um CPF válido com 11 dígitos (obrigatório para emissão de boleto bancário).');
      return;
    }

    // Validação de E-mail
    if ((campanha.exigirEmail || metodoPagamento === 'cartao') && (!email || !email.includes('@'))) {
      setFormErro('Informe um endereço de e-mail válido para confirmação do pagamento.');
      return;
    }

    // Validação específica de Cartão de Crédito
    if (metodoPagamento === 'cartao') {
      const numCartaoLimpo = cartaoNumero.replace(/\D/g, '');
      if (numCartaoLimpo.length < 13 || numCartaoLimpo.length > 19) {
        setFormErro('Informe um número de cartão de crédito válido.');
        return;
      }
      if (!cartaoNome.trim() || cartaoNome.trim().length < 3) {
        setFormErro('Informe o nome impresso no cartão de crédito.');
        return;
      }
      const partesValidade = cartaoValidade.split('/');
      if (partesValidade.length !== 2 || !partesValidade[0] || !partesValidade[1]) {
        setFormErro('Informe a validade do cartão no formato MM/AA.');
        return;
      }
      const mesNum = parseInt(partesValidade[0], 10);
      if (isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
        setFormErro('Mês de validade do cartão inválido.');
        return;
      }
      if (!cartaoCvv || cartaoCvv.replace(/\D/g, '').length < 3) {
        setFormErro('Informe o código de segurança (CVV) do cartão com 3 ou 4 dígitos.');
        return;
      }
      const cpfCartaoLimpo = (cartaoCpf || cpf).replace(/\D/g, '');
      if (cpfCartaoLimpo.length !== 11) {
        setFormErro('Informe o CPF do titular do cartão (11 dígitos).');
        return;
      }
    }

    setEnviandoPedido(true);

    const pixelId = campanha?.metaPixelId || data?.marca?.metaPixelId;
    if (pixelId && campanha) {
      trackAddPaymentInfo(pixelId, {
        contentIds: [campanha.id],
        value: valorTotalAtual
      });
    }

    try {
      // 1. Cria o Pedido no Backend
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campanhaId: campanha.id,
          quantidade,
          numeros: campanha.modelo === 'manual' ? cotasManuais : undefined,
          comprador: {
            nome: nome.trim(),
            whatsapp: cleanWhatsapp,
            cpf: cpf.trim() || cartaoCpf.trim() || undefined,
            email: email.trim() || undefined
          },
          ofertaRelampagoId: ofertaSelecionada ? (ofertaSelecionada.id || 'oferta-1') : undefined,
          metodoPagamento,
          cupom: cupomAplicado?.codigo || (cupomInput ? cupomInput.trim().toUpperCase() : undefined)
        })
      });

      const pedidoJson = await res.json();

      if (!res.ok) {
        setFormErro(pedidoJson.error || 'Erro ao gerar pedido.');
        setErroDiagnostico({
          titulo: pedidoJson.isMpError ? 'Erro na API do Mercado Pago' : 'Falha ao Processar Pagamento',
          mensagem: pedidoJson.error || 'Não foi possível processar seu pedido.',
          detalhes: pedidoJson.detalhes || pedidoJson,
          isTestToken: pedidoJson.isTestToken
        });
        return;
      }

      // Salva dados locais do comprador para agilizar próximas compras
      try {
        localStorage.setItem('rifazone_comprador_nome', nome.trim());
        localStorage.setItem('rifazone_comprador_whatsapp', cleanWhatsapp);
        if (cpf) localStorage.setItem('rifazone_comprador_cpf', cpf.trim());
        if (email) localStorage.setItem('rifazone_comprador_email', email.trim());
        setCompradorSalvo({ nome: nome.trim(), whatsapp: cleanWhatsapp });
      } catch (e) {}

      // 2. Fluxo Específico por Método

      // Sorteio Gratuito
      if (pedidoJson.metodoPagamento === 'gratis' || campanha.modalidade === 'gratis') {
        setCheckoutAberto(false);
        const pixelId = campanha?.metaPixelId || data?.marca?.metaPixelId;
        if (pixelId && campanha) {
          trackPurchase(pixelId, {
            contentIds: [campanha.id],
            value: 0,
            numItems: 1
          }, pedidoJson.pedidoId);
        }
        setCartaoSuccessModalData({
          pedidoId: pedidoJson.pedidoId,
          valorTotal: 0,
          quantidade: 1,
          numeros: pedidoJson.numeros || [],
          compradorNome: nome.trim()
        });
        carregarCampanha();
        return;
      }

      // A) CARTÃO DE CRÉDITO — Tokenização Client-Side e Cobrança
      if (metodoPagamento === 'cartao') {
        const partesValidade = cartaoValidade.split('/');
        const mes = partesValidade[0].trim();
        const ano = partesValidade[1].trim();
        const cpfTitular = (cartaoCpf || cpf).replace(/\D/g, '');

        // Tokenização 100% Client-Side via Mercado Pago
        const tokenRes = await criarCardTokenMercadoPago({
          numero: cartaoNumero,
          nomeTitular: cartaoNome,
          cpfTitular,
          mesExpiracao: mes,
          anoExpiracao: ano,
          cvv: cartaoCvv
        }, data?.marca?.mpPublicKey);

        // Envia apenas o Token para cobrança segura
        const resCartao = await fetch(`/api/pedidos/${pedidoJson.pedidoId}/pagar-cartao`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: tokenRes.token,
            installments: cartaoParcelas || 1,
            paymentMethodId: tokenRes.paymentMethodId,
            issuerId: tokenRes.issuerId,
            payerEmail: email.trim() || 'comprador@rifazone.com'
          })
        });

        const cartaoData = await resCartao.json();

        if (!resCartao.ok || cartaoData.error) {
          setFormErro(cartaoData.error || 'Cartão não autorizado pelo emissor.');
          setErroDiagnostico({
            titulo: 'Pagamento no Cartão Não Aprovado',
            mensagem: cartaoData.error || 'O pagamento não pôde ser aprovado.',
            detalhes: cartaoData.detalhes || cartaoData
          });
          return;
        }

        setCheckoutAberto(false);

        // Sucesso no Cartão
        const pixelId = campanha?.metaPixelId || data?.marca?.metaPixelId;
        if (pixelId && campanha) {
          trackPurchase(pixelId, {
            contentIds: [campanha.id],
            value: pedidoJson.valorTotal,
            numItems: pedidoJson.quantidade
          }, pedidoJson.pedidoId);
        }

        setCartaoSuccessModalData({
          pedidoId: pedidoJson.pedidoId,
          valorTotal: pedidoJson.valorTotal,
          quantidade: pedidoJson.quantidade,
          numeros: cartaoData.numeros || [],
          cartaoInfo: {
            ultimosDigitos: tokenRes.ultimosDigitos,
            bandeira: tokenRes.bandeira,
            parcelas: cartaoParcelas,
            status: cartaoData.status
          },
          compradorNome: nome.trim()
        });

        carregarCampanha();
        return;
      }

      // B) BOLETO BANCÁRIO
      if (metodoPagamento === 'boleto') {
        setCheckoutAberto(false);
        setBoletoModalData({
          pedidoId: pedidoJson.pedidoId,
          boletoUrl: pedidoJson.boletoUrl,
          boletoBarcode: pedidoJson.boletoBarcode,
          linhaDigitavel: pedidoJson.linhaDigitavel,
          valorTotal: pedidoJson.valorTotal,
          quantidade: pedidoJson.quantidade,
          expiraEm: pedidoJson.expiraEm,
          compradorNome: nome.trim(),
          compradorWhatsapp: cleanWhatsapp
        });
        return;
      }

      // C) PIX (Padrão)
      setCheckoutAberto(false);
      setPixModalData({
        pedidoId: pedidoJson.pedidoId,
        pixCopiaCola: pedidoJson.pixCopiaCola,
        pixQrCodeBase64: pedidoJson.pixQrCodeBase64,
        valorTotal: pedidoJson.valorTotal,
        quantidade: pedidoJson.quantidade,
        expiraEm: pedidoJson.expiraEm,
        isMock: pedidoJson.isMock,
        compradorNome: nome.trim(),
        compradorWhatsapp: cleanWhatsapp
      });

    } catch (err: any) {
      setFormErro(err.message || 'Erro de conexão com o servidor. Tente novamente.');
      setErroDiagnostico({
        titulo: 'Erro no Processamento do Pagamento',
        mensagem: err.message || 'Falha ao processar pagamento.',
        detalhes: err.stack || String(err)
      });
    } finally {
      setEnviandoPedido(false);
    }
  };

  // --- SUBCOMPONENTES DE SEÇÃO EXTRAÍDOS ---

  // 1. Seção Banner / Hero
  const SecaoBanner = () => {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
        <img
          src={campanha.bannerUrl}
          alt={campanha.titulo}
          className="w-full aspect-[16/9] object-cover"
        />
        
        {campanha.selo && (campanha.exibirSelo ?? true) && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-full shadow-lg flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-slate-950" />
            {campanha.selo}
          </div>
        )}

        <div className="p-4 bg-gradient-to-t from-slate-950 via-slate-900 to-transparent">
          <div
            className="flex items-center gap-2 text-xs font-semibold mb-1"
            style={{ color: 'var(--brand)' }}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sorteio oficial: {campanha.localSorteio}</span>
          </div>
          <h1 className={`font-black text-white leading-tight ${getTitleSizeClass(tema.tipografia.tamanhoTitulo)}`}>
            {campanha.titulo}
          </h1>
          {campanha.subtitulo && (
            <p className="text-slate-300 text-xs mt-1">
              {campanha.subtitulo}
            </p>
          )}
        </div>
      </div>
    );
  };

  // 2. Seção Barra de Progresso
  const SecaoBarraProgresso = () => {
    if (campanha.exibirBarraProgresso === false || estatisticas.vendidas === 0) return null;
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400 font-medium">Progresso do sorteio</span>
          <span className="font-extrabold" style={{ color: 'var(--brand)' }}>
            {estatisticas.percentualVendido}% vendido
          </span>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className="h-full rounded-full transition-all duration-500 shadow-sm"
            style={{
              width: `${Math.min(100, Math.max(2, estatisticas.percentualVendido))}%`,
              background: `linear-gradient(to right, var(--brand), var(--brand-2, var(--brand)))`
            }}
          />
        </div>
        {(campanha.exibirQtdCotas ?? true) && (
          <div className="flex justify-between text-[11px] text-slate-400 mt-2">
            <span>{estatisticas.vendidas.toLocaleString('pt-BR')} cotas vendidas</span>
            <span>{estatisticas.disponiveis.toLocaleString('pt-BR')} disponíveis</span>
          </div>
        )}
      </div>
    );
  };

  // 3. Seção Seletor de Cotas
  const SecaoCotas = () => {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span
              className="text-[11px] font-bold uppercase tracking-wider block"
              style={{ color: 'var(--brand)' }}
            >
              Passo 1
            </span>
            <h2 className="text-base font-black text-white">
              Escolha a quantidade de cotas
            </h2>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">{campanha.modalidade === 'gratis' ? 'Inscrição' : 'Por apenas'}</span>
            <span className="text-sm font-extrabold" style={{ color: 'var(--brand)' }}>
              {campanha.modalidade === 'gratis' ? 'GRÁTIS (R$ 0,00)' : `${formatarMoeda(campanha.valorCota)} / cota`}
            </span>
          </div>
        </div>

        {campanha.modalidade === 'gratis' ? (
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-purple-300 font-extrabold text-sm">
              <Gift className="w-5 h-5 text-purple-400" />
              <span>Sorteio Gratuito — 1 Cota Grátis Por Pessoa</span>
            </div>
            <p className="text-xs text-slate-300">
              Inscreva-se com seu Nome, WhatsApp e CPF para receber seu bilhete oficial gratuitamente e concorrer aos prêmios!
            </p>
            <button
              type="button"
              onClick={() => {
                setQuantidade(1);
                setCheckoutAberto(true);
              }}
              style={{ backgroundColor: 'var(--btn)', color: 'var(--btn-txt)' }}
              className={`w-full py-3.5 font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition hover:opacity-90 active:scale-[0.98] ${getBtnRoundingClass(tema.botao.formato)}`}
            >
              <Gift className="w-4 h-4" />
              <span>🎁 GARANTIR MINHA COTA GRÁTIS AGORA</span>
            </button>
          </div>
        ) : (
          <>
            {/* Botões Rápidos de Pacotes / Promoções */}
        {campanha.promocoes && campanha.promocoes.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {campanha.promocoes.map((promo: Promocao, idx: number) => {
              const selecionado = quantidade === promo.quantidade;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setQuantidade(promo.quantidade)}
                  className={`relative pt-3 pb-2 px-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    selecionado
                      ? 'border-[var(--brand)] text-white shadow-md'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-200 hover:bg-slate-800'
                  }`}
                  style={selecionado ? {
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    borderColor: 'var(--brand)'
                  } : undefined}
                >
                  <span className="block text-sm font-black text-white">
                    +{promo.quantidade}
                  </span>
                  <span
                    className="block text-xs font-extrabold"
                    style={{ color: 'var(--brand)' }}
                  >
                    {formatarMoeda(promo.valor)}
                  </span>
                  {promo.destaque && (
                    <span className="mt-1 px-1.5 py-0.5 bg-amber-500 text-slate-950 font-black text-[8px] uppercase tracking-wider rounded-md shadow w-full text-center">
                      + Popular
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Seletor Manual / Digitação Direta (- / +) */}
        <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl gap-3">
          <button
            type="button"
            onClick={() => setQuantidade(q => Math.max(campanha.minPorCompra || 1, q - 1))}
            className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold transition active:scale-95 shrink-0"
            aria-label="Diminuir cotas"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="flex-1 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <input
                type="number"
                min={campanha.minPorCompra || 1}
                max={campanha.maxPorCompra || 500000}
                value={quantidade}
                onChange={e => {
                  const v = Number(e.target.value);
                  setQuantidade(isNaN(v) || v < 1 ? 1 : v);
                }}
                className="w-20 bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-center text-lg font-black text-white focus:border-[var(--brand)] focus:outline-none font-mono"
              />
              <span className="text-sm font-bold text-slate-200">cotas</span>
            </div>
            <span
              className="text-xs font-extrabold block"
              style={{ color: 'var(--brand)' }}
            >
              Total: {formatarMoeda(valorTotalAtual)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setQuantidade(q => Math.min(campanha.maxPorCompra || 500000, q + 1))}
            style={{ backgroundColor: 'var(--btn)', color: 'var(--btn-txt)' }}
            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold transition active:scale-95 shrink-0 hover:opacity-90 shadow-sm"
            aria-label="Aumentar cotas"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        </>
        )}
      </div>
    );
  };

  // 4. Seção Prêmios Oficiais
  const SecaoPremios = () => {
    if (campanha.exibirPremios === false || !campanha.premios || campanha.premios.length === 0) return null;
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-400" />
          Premiação Oficial
        </h3>
        <div className="space-y-2">
          {campanha.premios.map((premio, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-black text-xs">
                {premio.posicao}º
              </div>
              <span className="text-sm font-bold text-white">
                {premio.descricao}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 5. Seção Cotas Premiadas (Instantâneas)
  const SecaoCotasPremiadas = () => {
    if (campanha.exibirCotasPremiadas === false || !campanha.cotasPremiadas || campanha.cotasPremiadas.length === 0) return null;
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Gift className="w-4 h-4" style={{ color: 'var(--brand)' }} />
            Cotas Premiadas (Ganhe no Pix na Hora)
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {campanha.cotasPremiadas.map((cp, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border text-xs ${
                cp.status === 'encontrada'
                  ? 'bg-slate-800/30 border-slate-800 text-slate-500 opacity-60'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="font-mono font-black text-sm"
                  style={{ color: cp.status === 'encontrada' ? undefined : 'var(--brand)' }}
                >
                  {cp.numero}
                </span>
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                  cp.status === 'encontrada' ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {cp.status === 'encontrada' ? 'Ganha' : 'Disponível'}
                </span>
              </div>
              <span className="block font-medium text-slate-300 text-[11px] truncate">
                {cp.premio}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 6. Seção Top Compradores / Ranking
  const SecaoRanking = () => {
    if (campanha.exibirRanking === false || campanha.exibirCompradores === false || !ranking || ranking.length === 0) return null;
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Users className="w-4 h-4" style={{ color: 'var(--brand)' }} />
          Top Compradores
        </h3>
        <div className="space-y-2">
          {ranking.map((item) => (
            <div
              key={item.posicao}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                  item.posicao === 1 ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-300'
                }`}>
                  {item.posicao}
                </span>
                <span className="font-semibold text-white truncate max-w-[150px]">
                  {item.nome}
                </span>
              </div>
              <span
                className="font-extrabold font-mono"
                style={{ color: 'var(--brand)' }}
              >
                {item.quantidadeCotas} cotas
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 7. Seção Regulamento & Informações
  const SecaoRegulamento = () => {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <button
          onClick={() => setDescricaoAberta(!descricaoAberta)}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400" />
            Regulamento & Informações
          </span>
          {descricaoAberta ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {descricaoAberta && (
          <div
            className="mt-4 pt-4 border-t border-slate-800 text-slate-300 text-xs leading-relaxed space-y-2"
            dangerouslySetInnerHTML={{ __html: campanha.descricao }}
          />
        )}
      </div>
    );
  };

  // 8. Seção Ganhadores da Campanha
  const SecaoGanhadores = () => {
    if (campanha.exibirPaginaGanhadores === false || !campanha.ganhador) return null;
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-400" />
          Ganhadores da Campanha
        </h3>

        {campanha.ganhador ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shadow"
              style={{ backgroundColor: 'var(--brand)', color: 'var(--btn-txt)' }}
            >
              🏆
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">
                {campanha.ganhador.nome}
              </h4>
              <p
                className="text-xs font-mono font-bold"
                style={{ color: 'var(--brand)' }}
              >
                Cota Contemplada: #{campanha.ganhador.cota}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-950/60 border border-dashed border-slate-800 rounded-xl text-center">
            <p className="text-xs text-slate-400">
              Ainda não há ganhadores para a campanha
            </p>
          </div>
        )}
      </div>
    );
  };

  // Mapeamento dinâmico de seções para a renderização baseada na ordem do layout
  const renderizarSecao = (secaoId: string) => {
    // Verifica se a visibilidade foi desativada no tema
    if (tema.layout.visivel[secaoId] === false) {
      return null;
    }

    switch (secaoId) {
      case 'banner':
        return SecaoBanner();
      case 'barraProgresso':
      case 'progresso':
        return SecaoBarraProgresso();
      case 'cotas':
        return SecaoCotas();
      case 'premios':
        return SecaoPremios();
      case 'premiadas':
      case 'cotasPremiadas':
        return SecaoCotasPremiadas();
      case 'ranking':
        return SecaoRanking();
      case 'regulamento':
      case 'descricao':
        return SecaoRegulamento();
      case 'ganhadores':
        return SecaoGanhadores();
      default:
        return null;
    }
  };

  // Lista de seções a serem renderizadas na ordem configurada
  const secoesParaRenderizar = tema.layout.ordem;

  // Adiciona 'barraProgresso' e 'ganhadores' se não estiverem na ordem explícita, preservando layout original
  const ordemEfetiva = [...secoesParaRenderizar];
  if (!ordemEfetiva.includes('barraProgresso') && !ordemEfetiva.includes('progresso') && tema.layout.visivel.barraProgresso !== false) {
    const bannerIdx = ordemEfetiva.indexOf('banner');
    if (bannerIdx !== -1) {
      ordemEfetiva.splice(bannerIdx + 1, 0, 'barraProgresso');
    } else {
      ordemEfetiva.unshift('barraProgresso');
    }
  }
  if (!ordemEfetiva.includes('ganhadores') && tema.layout.visivel.ganhadores !== false) {
    ordemEfetiva.push('ganhadores');
  }

  return (
    <div
      style={rootCssVariables}
      className={`min-h-screen bg-[var(--bg,#020617)] text-[var(--texto,#f8fafc)] selection:bg-[var(--brand,#10b981)] selection:text-slate-950 ${getFontFamilyClass(tema.tipografia.fonte)}`}
    >
      {/* Top Navbar com Menu Lateral */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={marca?.logoUrl || "/logorifazone.png.jpeg"} alt="RifaZone" className="w-7 h-7 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => setOrganizadorModalAberto(true)}
              className="flex items-center gap-2.5 text-left hover:opacity-90 transition cursor-pointer group"
            >
            {campanha.organizadorFoto ? (
              <img
                src={campanha.organizadorFoto}
                alt={campanha.organizadorNome || 'Organizador'}
                className="w-9 h-9 rounded-full object-cover border border-[var(--brand)]/50 shadow-md group-hover:scale-105 transition-transform"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-black text-base shadow-md group-hover:scale-105 transition-transform"
                style={{ backgroundColor: 'var(--brand)', color: 'var(--btn-txt)' }}
              >
                {(campanha.organizadorNome || 'Rifa')[0].toUpperCase()}
              </div>
            )}
            <div>
              <span className="font-extrabold text-white text-sm tracking-tight block truncate max-w-[160px] sm:max-w-[200px]">
                {campanha.titulo}
              </span>
              <span className="text-[10px] text-slate-400 font-medium block flex items-center gap-1 group-hover:text-emerald-400 transition-colors">
                <span>{campanha.organizadorNome || 'Organizador Oficial'}</span>
                <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full border border-slate-700">Ver todas</span>
              </span>
            </div>
          </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-ver-meus-numeros"
              type="button"
              onClick={() => setMeusNumerosAberto(true)}
              className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition"
              style={{
                color: 'var(--brand)',
                borderColor: 'var(--brand)',
                backgroundColor: 'rgba(16, 185, 129, 0.12)'
              }}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Meus Números</span>
            </button>

            {/* Menu Lateral */}
            <button
              id="btn-abrir-menu-lateral"
              type="button"
              onClick={() => setMenuAberto(true)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition shadow"
            >
              <span className="font-extrabold text-sm" style={{ color: 'var(--brand)' }}>≡</span>
              <span>MENU</span>
            </button>
          </div>
        </div>

        {/* Banner sutil se o comprador já possui dados salvos no navegador */}
        {compradorSalvo && (
          <div className="bg-emerald-950/40 border-t border-b border-emerald-500/20 px-4 py-1.5">
            <div className="max-w-xl mx-auto flex items-center justify-between text-[11px]">
              <span className="text-emerald-300 font-medium truncate">
                👋 Olá, <strong>{compradorSalvo.nome}</strong>! Seus dados e bilhetes estão salvos.
              </span>
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setMeusDadosAberto(true)}
                  className="text-slate-400 hover:text-slate-200 underline font-medium"
                >
                  Editar dados
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={() => setMeusNumerosAberto(true)}
                  className="font-bold underline"
                  style={{ color: 'var(--brand)' }}
                >
                  Ver cotas
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* DRAWER MENU LATERAL */}
      {menuAberto && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xs bg-slate-900 border-l border-slate-800 h-full p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  {campanha.organizadorFoto ? (
                    <img src={campanha.organizadorFoto} alt="Perfil" className="w-10 h-10 rounded-full object-cover border border-[var(--brand)]/50" />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-black"
                      style={{ backgroundColor: 'var(--brand)', color: 'var(--btn-txt)' }}
                    >
                      {(campanha.organizadorNome || 'O')[0]}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {campanha.organizadorNome || 'Organizador Oficial'}
                    </h4>
                    <span className="text-[11px] text-slate-400">Organizador Oficial</span>
                  </div>
                </div>
                <button onClick={() => setMenuAberto(false)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => { setMenuAberto(false); setMeusNumerosAberto(true); }}
                  className="w-full p-3 bg-slate-800 hover:bg-slate-700/80 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-2.5 transition"
                >
                  <Ticket className="w-4 h-4" style={{ color: 'var(--brand)' }} />
                  <span>Meus Números / Buscar Cotas</span>
                </button>

                <button
                  onClick={() => { setMenuAberto(false); setMeusDadosAberto(true); }}
                  className="w-full p-3 bg-slate-800 hover:bg-slate-700/80 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-2.5 transition"
                >
                  <User className="w-4 h-4" style={{ color: 'var(--brand)' }} />
                  <span>Meus Dados Cadastrados</span>
                </button>

                {campanha.organizadorWhatsapp && (
                  <a
                    href={`https://wa.me/55${campanha.organizadorWhatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full p-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-300 flex items-center gap-2.5 transition"
                  >
                    <Smartphone className="w-4 h-4" style={{ color: 'var(--brand)' }} />
                    <span>Suporte WhatsApp</span>
                  </a>
                )}

                {campanha.organizadorInstagram && (
                  <a
                    href={`https://instagram.com/${campanha.organizadorInstagram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full p-3 bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/30 rounded-xl text-xs font-bold text-pink-300 flex items-center gap-2.5 transition"
                  >
                    <Instagram className="w-4 h-4 text-pink-400" />
                    <span>Instagram do Organizador</span>
                  </a>
                )}

                {campanha.organizadorTiktok && (
                  <a
                    href={`https://tiktok.com/@${campanha.organizadorTiktok.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full p-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-2.5 transition"
                  >
                    <Share2 className="w-4 h-4 text-cyan-400" />
                    <span>TikTok do Organizador</span>
                  </a>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-center">
              <p className="text-[11px] text-slate-500 font-medium">
                {campanha.organizadorNome || 'RifaZone'} - todos os direitos reservados
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3 BOTÕES FLUTUANTES NO CANTO DIREITO */}
      <div className="fixed bottom-20 right-3 z-30 flex flex-col gap-2">
        {campanha.organizadorWhatsapp && (
          <a
            href={`https://wa.me/55${campanha.organizadorWhatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noreferrer"
            style={{ backgroundColor: 'var(--brand)', color: 'var(--btn-txt)' }}
            className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition hover:scale-105"
            title="WhatsApp de Suporte"
          >
            <Smartphone className="w-5 h-5 fill-current" />
          </a>
        )}
        {campanha.organizadorInstagram && (
          <a
            href={`https://instagram.com/${campanha.organizadorInstagram.replace('@', '')}`}
            target="_blank"
            rel="noreferrer"
            className="w-11 h-11 bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white rounded-full flex items-center justify-center shadow-lg transition hover:scale-105"
            title="Instagram"
          >
            <Instagram className="w-5 h-5" />
          </a>
        )}
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: campanha.titulo, url: window.location.href });
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert('Link da campanha copiado com sucesso!');
            }
          }}
          className="w-11 h-11 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-full flex items-center justify-center shadow-lg transition hover:scale-105"
          title="Compartilhar Link"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Main Container com Renderização das Seções na Ordem do Tema */}
      <main className="max-w-xl mx-auto px-4 pb-28 pt-3 space-y-4">
        
        {/* BANNER CAMPANHA PAUSADA / DESATIVADA */}
        {(campanha.status === 'pausada' || campanha.status === 'inativa' || campanha.status === 'rascunho') && (
          <div className="bg-amber-500/15 border-2 border-amber-500/40 rounded-2xl p-4 text-center shadow-lg animate-in fade-in">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2 font-black text-lg">
              ⏸️
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Campanha Pausada no Momento
            </h3>
            <p className="text-xs text-amber-200/90 mt-1">
              As vendas desta rifa foram temporariamente desativadas/pausadas pelo organizador. Volte em breve!
            </p>
          </div>
        )}
        
        {/* CONTADOR REGRESSIVO DA CAMPANHA */}
        {tempoRestante && tema.layout.visivel.contador !== false && (
          <div className={`bg-gradient-to-r ${
            tempoRestante.status === 'aguardando_inicio'
              ? 'from-amber-950/90 via-slate-900 to-amber-950/90 border-amber-500/40'
              : tempoRestante.status === 'encerrada'
              ? 'from-red-950/90 via-slate-900 to-red-950/90 border-red-500/40'
              : 'from-emerald-950/90 via-slate-900 to-emerald-950/90 border-emerald-500/30'
          } border rounded-2xl p-4 text-center shadow-lg animate-in fade-in`}>
            <span className={`text-[10px] font-bold uppercase tracking-widest block mb-2 ${
              tempoRestante.status === 'aguardando_inicio'
                ? 'text-amber-400'
                : tempoRestante.status === 'encerrada'
                ? 'text-red-400'
                : 'text-emerald-400'
            }`}
            style={tempoRestante.status === 'em_andamento' ? { color: 'var(--brand)' } : undefined}
            >
              {tempoRestante.status === 'aguardando_inicio' && '⏳ Faltam para o INÍCIO da campanha:'}
              {tempoRestante.status === 'em_andamento' && '⏳ A campanha ENCERRA em:'}
              {tempoRestante.status === 'encerrada' && '🏁 Campanha Encerrada'}
            </span>

            <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
                <span className="text-lg font-black text-white font-mono block leading-none">
                  {String(tempoRestante.dias).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-medium mt-1 block">Dias</span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
                <span className="text-lg font-black text-white font-mono block leading-none">
                  {String(tempoRestante.horas).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-medium mt-1 block">Horas</span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
                <span className="text-lg font-black text-white font-mono block leading-none">
                  {String(tempoRestante.minutos).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-medium mt-1 block">Min</span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
                <span className={`text-lg font-black font-mono block leading-none ${
                  tempoRestante.status === 'aguardando_inicio'
                    ? 'text-amber-400'
                    : tempoRestante.status === 'encerrada'
                    ? 'text-red-400'
                    : 'text-emerald-400'
                }`}
                style={tempoRestante.status === 'em_andamento' ? { color: 'var(--brand)' } : undefined}
                >
                  {String(tempoRestante.segundos).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-medium mt-1 block">Seg</span>
              </div>
            </div>

            {tempoRestante.status === 'aguardando_inicio' && (
              <p className="text-[11px] text-amber-300 font-medium mt-2.5">
                🔒 Vendas bloqueadas até a data/hora de início definida.
              </p>
            )}

            {tempoRestante.status === 'encerrada' && (
              <p className="text-[11px] text-red-300 font-medium mt-2.5">
                ⛔ Período de vendas encerrado para esta campanha.
              </p>
            )}
          </div>
        )}

        {/* Renderização dinâmica das seções configuradas no Tema */}
        {ordemEfetiva.map((secaoKey, idx) => (
          <React.Fragment key={`${secaoKey}-${idx}`}>
            {renderizarSecao(secaoKey)}
          </React.Fragment>
        ))}

      </main>

      {/* Barra Fixa Inferior de Compra Instantânea */}
      <footer className={`${modoPreview ? 'sticky' : 'fixed'} bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-3`}>
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {quantidade} cotas selecionadas
            </span>
            <span
              className="text-lg font-black leading-none"
              style={{ color: 'var(--brand)' }}
            >
              {formatarMoeda(valorTotalAtual)}
            </span>
          </div>

          <button
            id="btn-finalizar-compra"
            onClick={handleIniciarCompra}
            disabled={
              tempoRestante?.status === 'aguardando_inicio' ||
              tempoRestante?.status === 'encerrada' ||
              campanha.status === 'pausada' ||
              campanha.status === 'inativa' ||
              campanha.status === 'rascunho'
            }
            style={
              tempoRestante?.status === 'aguardando_inicio' ||
              tempoRestante?.status === 'encerrada' ||
              campanha.status === 'pausada' ||
              campanha.status === 'inativa' ||
              campanha.status === 'rascunho'
                ? undefined
                : {
                    backgroundColor: 'var(--btn)',
                    color: 'var(--btn-txt)',
                  }
            }
            className={`flex-1 font-black flex items-center justify-center gap-2 transition active:scale-[0.98] ${getBtnRoundingClass(tema.botao.formato)} ${getBtnSizeClass(tema.botao.tamanho)} ${
              tema.botao.sombra ? 'shadow-lg' : ''
            } ${
              campanha.status === 'pausada' || campanha.status === 'inativa' || campanha.status === 'rascunho'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 cursor-not-allowed shadow-none'
                : tempoRestante?.status === 'aguardando_inicio'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 cursor-not-allowed shadow-none'
                : tempoRestante?.status === 'encerrada'
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 cursor-not-allowed shadow-none'
                : 'hover:opacity-95'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${
              tempoRestante?.status === 'aguardando_inicio' || tempoRestante?.status === 'encerrada' || campanha.status === 'pausada' || campanha.status === 'inativa'
                ? 'text-current'
                : 'fill-current'
            }`} />
            {campanha.status === 'pausada' || campanha.status === 'inativa' || campanha.status === 'rascunho'
              ? 'CAMPANHA PAUSADA'
              : tempoRestante?.status === 'aguardando_inicio'
              ? 'AGUARDANDO INÍCIO DAS VENDAS'
              : tempoRestante?.status === 'encerrada'
              ? 'VENDAS ENCERRADAS'
              : (tema.botao.cta || 'PARTICIPAR DO SORTEIO').toUpperCase()}
          </button>
        </div>
      </footer>

      {/* Modal Upsell Oferta Relâmpago */}
      {upsellAberto && ofertaSelecionada && (
        <UpsellModal
          oferta={ofertaSelecionada}
          valorCotaBase={campanha.valorCota}
          onAccept={handleAceitarUpsell}
          onDecline={handleRecusarUpsell}
        />
      )}

      {/* Modal Formulário de Checkout */}
      {checkoutAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl text-white my-6 max-h-[92vh] overflow-y-auto">
            
            {/* Header do Checkout */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <span
                  className="text-[11px] font-bold uppercase tracking-wider block"
                  style={{ color: 'var(--brand)' }}
                >
                  {campanha.checkout?.mensagens?.topo || 'Checkout Transparente e Seguro'}
                </span>
                <h3 className="text-lg font-black text-white">
                  Concluir sua Participação
                </h3>
              </div>
              <button
                onClick={() => setCheckoutAberto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Mensagem de Urgência / Banner Topo */}
            {campanha.checkout?.mensagens?.urgencia && (
              <div className="mb-4 p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs font-semibold text-amber-300 flex items-center gap-2 animate-pulse">
                <Flame className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{campanha.checkout.mensagens.urgencia}</span>
              </div>
            )}

            {/* SELETOR DE MÉTODOS DE PAGAMENTO OU BANNER GRATUITO */}
            {campanha.modalidade === 'gratis' ? (
              <div className="mb-4 p-3.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-center">
                <span className="text-xs font-black text-purple-300 flex items-center justify-center gap-1.5">
                  <Gift className="w-4 h-4 text-purple-400" />
                  Sorteio 100% Gratuito — 1 Cota por CPF
                </span>
                <p className="text-[11px] text-slate-300 mt-1">
                  Preencha seus dados abaixo para validar sua inscrição e receber seu bilhete da sorte sem pagar nada!
                </p>
              </div>
            ) : (() => {
              const chk = campanha.checkout || DEFAULT_CHECKOUT_CONFIG;
              const metodosAtivos = [
                ...(chk.metodos?.pix !== false ? ['pix'] : []),
                ...(chk.metodos?.cartao ? ['cartao'] : []),
                ...(chk.metodos?.boleto ? ['boleto'] : [])
              ];

              if (metodosAtivos.length <= 1) return null;

              return (
                <div className="mb-4 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
                    Forma de Pagamento:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {chk.metodos?.pix !== false && (
                      <button
                        type="button"
                        onClick={() => setMetodoPagamento('pix')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition ${
                          metodoPagamento === 'pix'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Pix</span>
                      </button>
                    )}

                    {chk.metodos?.cartao && (
                      <button
                        type="button"
                        onClick={() => setMetodoPagamento('cartao')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition ${
                          metodoPagamento === 'cartao'
                            ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Cartão</span>
                      </button>
                    )}

                    {chk.metodos?.boleto && (
                      <button
                        type="button"
                        onClick={() => setMetodoPagamento('boleto')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition ${
                          metodoPagamento === 'boleto'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span>Boleto</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            <form onSubmit={handleEnviarPedido} className="space-y-3.5">
              
              {/* DADOS PESSOAIS DO COMPRADOR */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nome completo *
                  </label>
                  <input
                    id="input-nome-comprador"
                    type="text"
                    placeholder="Ex: João da Silva"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[var(--brand)] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    WhatsApp com DDD (para receber os números) *
                  </label>
                  <input
                    id="input-whatsapp-comprador"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={whatsapp}
                    onChange={e => setWhatsapp(formatWhatsapp(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:border-[var(--brand)] focus:outline-none"
                    required
                  />
                </div>

                {(campanha.exigirCpf || campanha.modalidade === 'gratis' || metodoPagamento === 'boleto') && (
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      CPF * {campanha.modalidade === 'gratis' ? <span className="text-purple-400 font-normal text-[11px]">(1 cota por CPF)</span> : metodoPagamento === 'boleto' && <span className="text-amber-400 font-normal text-[11px]">(obrigatório para boleto)</span>}
                    </label>
                    <input
                      id="input-cpf-comprador"
                      type="text"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={e => setCpf(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:border-[var(--brand)] focus:outline-none"
                      required
                    />
                  </div>
                )}

                {(campanha.exigirEmail || campanha.modalidade === 'gratis' || metodoPagamento === 'cartao') && (
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      E-mail * {metodoPagamento === 'cartao' && <span className="text-blue-400 font-normal text-[11px]">(para comprovante do cartão)</span>}
                    </label>
                    <input
                      id="input-email-comprador"
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[var(--brand)] focus:outline-none"
                      required
                    />
                  </div>
                )}

                {/* Data de Nascimento para Cálculo Automático de Idade (Sem calendário nativo, digitação direta 01062004) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Data de Nascimento *
                    </label>
                    {dataNascimento && dataNascimento.length === 10 && (
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        (calcularIdade(dataNascimento) || 0) >= 18
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {calcularIdade(dataNascimento) !== null
                          ? `Idade: ${calcularIdade(dataNascimento)} anos`
                          : 'Data inválida'}
                      </span>
                    )}
                  </div>
                  <input
                    id="input-nascimento-comprador"
                    type="text"
                    inputMode="numeric"
                    placeholder="DD/MM/AAAA (ex: 01/06/2004)"
                    maxLength={10}
                    value={dataNascimento}
                    onChange={e => setDataNascimento(formatDataNascimento(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:border-[var(--brand)] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* CAMPOS ESPECÍFICOS DE CARTÃO DE CRÉDITO */}
              {metodoPagamento === 'cartao' && (
                <div className="p-4 bg-slate-950 border border-blue-500/30 rounded-2xl space-y-3 animate-in fade-in-50">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      Dados do Cartão de Crédito
                    </span>
                    {cartaoNumero && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
                        {detectarBandeiraCartao(cartaoNumero).nome}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Número do Cartão *
                    </label>
                    <input
                      id="input-cartao-numero"
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      value={cartaoNumero}
                      onChange={e => setCartaoNumero(formatarNumeroCartao(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Nome impresso no Cartão *
                    </label>
                    <input
                      id="input-cartao-nome"
                      type="text"
                      placeholder="Como está gravado no cartão"
                      value={cartaoNome}
                      onChange={e => setCartaoNome(e.target.value.toUpperCase())}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white uppercase focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Validade (MM/AA) *
                      </label>
                      <input
                        id="input-cartao-validade"
                        type="text"
                        placeholder="MM/AA"
                        maxLength={5}
                        value={cartaoValidade}
                        onChange={e => setCartaoValidade(formatarValidade(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white text-center focus:border-blue-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        CVV / Código *
                      </label>
                      <input
                        id="input-cartao-cvv"
                        type="password"
                        placeholder="123"
                        maxLength={4}
                        value={cartaoCvv}
                        onChange={e => setCartaoCvv(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white text-center focus:border-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* CPF do Titular se diferente */}
                  {!cpf && (
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        CPF do Titular do Cartão *
                      </label>
                      <input
                        id="input-cartao-cpf-titular"
                        type="text"
                        placeholder="000.000.000-00"
                        value={cartaoCpf}
                        onChange={e => setCartaoCpf(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:border-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                  )}

                  {/* Seleção de Parcelamento */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Opções de Parcelamento
                    </label>
                    <select
                      id="select-cartao-parcelas"
                      value={cartaoParcelas}
                      onChange={e => setCartaoParcelas(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                    >
                      {(() => {
                        const maxP = Math.min(campanha.checkout?.parcelasMax || 12, 12);
                        const totalAtual = valorTotalAtual + (ofertaSelecionada ? ofertaSelecionada.preco : 0);
                        const opts = [];
                        for (let i = 1; i <= maxP; i++) {
                          const valorParcela = totalAtual / i;
                          // Só exibe parcelas cujo valor seja no mínimo R$ 5,00 (ou 1x)
                          if (i === 1 || valorParcela >= 5.0) {
                            opts.push(
                              <option key={i} value={i}>
                                {i === 1
                                  ? `1x de ${formatarMoeda(totalAtual)} (À vista)`
                                  : `${i}x de ${formatarMoeda(valorParcela)} sem juros`}
                              </option>
                            );
                          }
                        }
                        return opts;
                      })()}
                    </select>
                  </div>
                </div>
              )}

              {/* Confirmação Idade Mínima (+18 anos) */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    id="checkout-check-maior-idade"
                    type="checkbox"
                    checked={maiorIdade}
                    onChange={e => setMaiorIdade(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-[var(--brand)]"
                  />
                  <span className="text-xs text-slate-200 font-medium leading-tight">
                    <strong className="block" style={{ color: 'var(--brand)' }}>Idade mínima 18 anos:</strong>
                    Declaro que tenho 18 anos ou mais e estou de acordo com o regulamento do sorteio.
                  </span>
                </label>
              </div>

              {/* CAMPO DE CUPOM DE DESCONTO */}
              {campanha.modalidade !== 'gratis' && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>Tem um cupom de desconto?</span>
                    {cupomAplicado && (
                      <span className="text-emerald-400 text-[10px] uppercase font-mono font-bold">
                        {cupomAplicado.descontoPct}% OFF APLICADO
                      </span>
                    )}
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Digite o código (ex: VOLTA10)"
                      value={cupomInput}
                      onChange={e => {
                        setCupomInput(e.target.value.toUpperCase());
                        setCupomErro('');
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white uppercase font-mono font-bold focus:border-[var(--brand)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleValidarCupom()}
                      disabled={validandoCupom || !cupomInput.trim()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition disabled:opacity-50"
                    >
                      {validandoCupom ? 'Aplicando...' : cupomAplicado ? 'Atualizar' : 'Aplicar'}
                    </button>
                  </div>

                  {cupomAplicado && (
                    <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      ✓ Cupom {cupomAplicado.codigo} ativado ({cupomAplicado.descontoPct}% de desconto)!
                    </p>
                  )}

                  {cupomErro && (
                    <p className="text-[11px] text-rose-400 font-medium">
                      ⚠️ {cupomErro}
                    </p>
                  )}
                </div>
              )}

              {/* Resumo Financeiro */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Cotas:</span>
                  <span className="font-bold text-white">
                    {campanha.modalidade === 'gratis' ? '1 cota' : `${quantidade + (ofertaSelecionada ? ofertaSelecionada.cotasExtras : 0)} cotas`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300 border-t border-slate-700/50 pt-1">
                  <span>Total:</span>
                  <span className="font-extrabold text-sm" style={{ color: 'var(--brand)' }}>
                    {campanha.modalidade === 'gratis' ? 'R$ 0,00 (Grátis)' : formatarMoeda(valorTotalAtual + (ofertaSelecionada ? ofertaSelecionada.preco : 0))}
                  </span>
                </div>
              </div>

              {/* Selos de Segurança e Criptografia */}
              {(campanha.checkout?.selosSeguranca !== false) && (
                <div className="flex items-center justify-center gap-4 py-1 text-[10px] text-slate-400 border-t border-slate-800/80 pt-2">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    Criptografia SSL 256-bit
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-blue-400" />
                    Validação Anti-Fraude CPF
                  </span>
                </div>
              )}

              {formErro && (
                <p className="text-xs text-red-400 font-medium bg-red-950/40 border border-red-800/40 p-2.5 rounded-xl">{formErro}</p>
              )}

              <button
                id="btn-confirmar-gerar-pix"
                type="submit"
                disabled={enviandoPedido}
                style={{ backgroundColor: 'var(--btn)', color: 'var(--btn-txt)' }}
                className={`w-full py-3.5 font-black rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] ${getBtnRoundingClass(tema.botao.formato)} hover:opacity-90`}
              >
                {enviandoPedido ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    {campanha.modalidade === 'gratis' ? 'Validando Inscrição Gratuita...' : metodoPagamento === 'cartao' ? 'Processando Cartão com Segurança...' : metodoPagamento === 'boleto' ? 'Gerando Boleto Bancário...' : 'Gerando Pix Oficial...'}
                  </span>
                ) : (
                  campanha.modalidade === 'gratis'
                    ? '🎁 CONCLUIR MINHA INSCRIÇÃO GRÁTIS'
                    : metodoPagamento === 'cartao'
                    ? 'PAGAR COM CARTÃO AGORA'
                    : metodoPagamento === 'boleto'
                    ? 'GERAR BOLETO BANCÁRIO'
                    : 'GERAR PIX AGORA'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pix Gerado */}
      {pixModalData && (
        <PixPaymentModal
          pedidoId={pixModalData.pedidoId}
          pixCopiaCola={pixModalData.pixCopiaCola}
          pixQrCodeBase64={pixModalData.pixQrCodeBase64}
          valorTotal={pixModalData.valorTotal}
          quantidade={pixModalData.quantidade}
          expiraEm={pixModalData.expiraEm}
          isMock={pixModalData.isMock}
          compradorNome={pixModalData.compradorNome || nome}
          compradorWhatsapp={pixModalData.compradorWhatsapp || whatsapp.replace(/\D/g, '')}
          tituloCampanha={campanha.titulo}
          onSuccess={() => {
            const pixelId = campanha?.metaPixelId || data?.marca?.metaPixelId;
            if (pixelId && campanha && pixModalData) {
              trackPurchase(pixelId, {
                contentIds: [campanha.id],
                value: pixModalData.valorTotal,
                numItems: pixModalData.quantidade
              }, pixModalData.pedidoId);
            }
            carregarCampanha();
          }}
          onClose={() => {
            setPixModalData(null);
            carregarCampanha();
          }}
          onVerMeusNumeros={() => {
            setPixModalData(null);
            setMeusNumerosAberto(true);
            carregarCampanha();
          }}
          onGerarNovoPix={() => {
            setPixModalData(null);
            carregarCampanha();
            setTimeout(() => {
              const el = document.getElementById('btn-confirmar-gerar-pix') || document.getElementById('input-nome-comprador');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
        />
      )}

      {/* Modal Boleto Gerado */}
      {boletoModalData && (
        <BoletoPaymentModal
          pedidoId={boletoModalData.pedidoId}
          boletoUrl={boletoModalData.boletoUrl}
          boletoBarcode={boletoModalData.boletoBarcode}
          linhaDigitavel={boletoModalData.linhaDigitavel}
          valorTotal={boletoModalData.valorTotal}
          quantidade={boletoModalData.quantidade}
          expiraEm={boletoModalData.expiraEm}
          compradorNome={boletoModalData.compradorNome}
          compradorWhatsapp={boletoModalData.compradorWhatsapp}
          tituloCampanha={campanha.titulo}
          onSuccess={() => {
            carregarCampanha();
          }}
          onClose={() => {
            setBoletoModalData(null);
            carregarCampanha();
          }}
          onVerMeusNumeros={() => {
            setBoletoModalData(null);
            setMeusNumerosAberto(true);
            carregarCampanha();
          }}
        />
      )}

      {/* Modal Sucesso Cartão de Crédito */}
      {cartaoSuccessModalData && (
        <CartaoSuccessModal
          pedidoId={cartaoSuccessModalData.pedidoId}
          valorTotal={cartaoSuccessModalData.valorTotal}
          quantidade={cartaoSuccessModalData.quantidade}
          numeros={cartaoSuccessModalData.numeros}
          cartaoInfo={cartaoSuccessModalData.cartaoInfo}
          compradorNome={cartaoSuccessModalData.compradorNome}
          tituloCampanha={campanha.titulo}
          onClose={() => {
            setCartaoSuccessModalData(null);
            carregarCampanha();
          }}
          onVerMeusNumeros={() => {
            setCartaoSuccessModalData(null);
            setMeusNumerosAberto(true);
            carregarCampanha();
          }}
        />
      )}

      {/* Modal Meus Números */}
      {meusNumerosAberto && (
        <MeusNumerosModal
          campanha={campanha}
          onBack={() => setMeusNumerosAberto(false)}
        />
      )}

      {/* Modal Meus Dados / Identificação do Comprador */}
      {meusDadosAberto && (
        <MeusDadosModal
          onClose={() => setMeusDadosAberto(false)}
          exigirCpf={campanha.exigirCpf}
          exigirEmail={campanha.exigirEmail}
          onSalvarSucesso={(dados) => {
            setNome(dados.nome);
            setWhatsapp(dados.whatsapp);
            if (dados.cpf) setCpf(dados.cpf);
            if (dados.email) setEmail(dados.email);
            setMaiorIdade(dados.maiorIdade);
            setCompradorSalvo({ nome: dados.nome, whatsapp: dados.whatsapp });
          }}
        />
      )}

      {/* Modal Diagnóstico de Erro para Suporte */}
      {erroDiagnostico && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-red-500/40 rounded-2xl p-6 shadow-2xl text-white my-8 animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5 text-red-400">
                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400/80 block">
                    Diagnóstico de Integração
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {erroDiagnostico.titulo}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setErroDiagnostico(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-3.5 text-xs text-red-200 leading-relaxed">
                {erroDiagnostico.mensagem}
              </div>

              {erroDiagnostico.isTestToken && (
                <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-3 text-xs text-amber-200">
                  <span className="font-bold block mb-1">⚠️ Atenção sobre Credenciais de Teste:</span>
                  Você está usando um Access Token de teste (<code className="font-mono text-amber-300">TEST-...</code>). O Banco Central e os aplicativos de bancos reais (Nubank, Itaú, Bradesco, etc.) <strong>rejeitam pagamentos de tokens de teste</strong>. Para receber dinheiro real, você deve cadastrar seu <strong>Access Token de Produção</strong> (<code className="font-mono text-amber-300">APP_USR-...</code>).
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Log técnico para envio ao suporte:
                </label>
                <div className="max-h-40 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-slate-300 break-all select-all">
                  {typeof erroDiagnostico.detalhes === 'object'
                    ? JSON.stringify(erroDiagnostico.detalhes, null, 2)
                    : String(erroDiagnostico.detalhes || erroDiagnostico.mensagem)}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const textoParaCopiar = `--- DIAGNÓSTICO ERRO PIX RIFAZONE ---\nData: ${new Date().toISOString()}\nTítulo: ${erroDiagnostico.titulo}\nMensagem: ${erroDiagnostico.mensagem}\nDetalhes:\n${typeof erroDiagnostico.detalhes === 'object' ? JSON.stringify(erroDiagnostico.detalhes, null, 2) : String(erroDiagnostico.detalhes || '')}\n--------------------------------------`;
                    navigator.clipboard.writeText(textoParaCopiar);
                    setErroCopiado(true);
                    setTimeout(() => setErroCopiado(false), 3500);
                  }}
                  style={{ backgroundColor: 'var(--btn)', color: 'var(--btn-txt)' }}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                    erroCopiado ? 'opacity-80' : 'hover:opacity-90 shadow-lg'
                  }`}
                >
                  {erroCopiado ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copiado! Envie para o assistente
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar Detalhes do Erro
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setErroDiagnostico(null)}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Todas as Campanhas do Organizador */}
      {organizadorModalAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                {campanha.organizadorFoto ? (
                  <img
                    src={campanha.organizadorFoto}
                    alt={campanha.organizadorNome || 'Organizador'}
                    className="w-10 h-10 rounded-full object-cover border border-emerald-500/50"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-lg">
                    {(campanha.organizadorNome || 'R')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-white text-sm">
                    {campanha.organizadorNome || 'Organizador Oficial'}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Campanhas e Ações Disponíveis
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrganizadorModalAberto(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              {carregandoOrganizador ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Carregando campanhas do organizador...
                </div>
              ) : campanhasOrganizador.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Nenhuma outra campanha encontrada no momento.
                </div>
              ) : (
                campanhasOrganizador.map(c => (
                  <a
                    key={c.id}
                    href={`/c/${c.slug || c.id}`}
                    className={`p-3 rounded-xl border block transition ${
                      c.id === campanha.id
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {c.bannerUrl ? (
                        <img src={c.bannerUrl} alt={c.titulo} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 text-xs shrink-0">
                          Rifa
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-white truncate">{c.titulo}</span>
                          {c.modalidade === 'gratis' ? (
                            <span className="text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">Grátis</span>
                          ) : (
                            <span className="text-[9px] font-mono font-bold text-emerald-400">
                              {c.valorCota === 0 ? 'Grátis' : `R$ ${(c.valorCota || 0).toFixed(2).replace('.', ',')}`}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{c.subtitulo || c.descricao || 'Sorteio Oficial'}</p>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                          <span>{c.totalCotas.toLocaleString()} cotas</span>
                          {c.id === campanha.id && <span className="text-emerald-400 font-bold">• Atual</span>}
                        </div>
                      </div>
                    </div>
                  </a>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setOrganizadorModalAberto(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DIAGNÓSTICO DE ERRO PARA SUPORTE */}
      {erroDiagnostico && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-base font-black text-white">{erroDiagnostico.titulo}</h3>
              </div>
              <button
                type="button"
                onClick={() => setErroDiagnostico(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">{erroDiagnostico.mensagem}</p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 max-h-48 overflow-y-auto">
              <pre className="whitespace-pre-wrap break-all">
                {typeof erroDiagnostico.detalhes === 'string'
                  ? erroDiagnostico.detalhes
                  : JSON.stringify(erroDiagnostico.detalhes, null, 2)}
              </pre>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  const textoParaCopiar = `=== DIAGNÓSTICO DE ERRO RIFAZONE ===\nTítulo: ${erroDiagnostico.titulo}\nMensagem: ${erroDiagnostico.mensagem}\nDetalhes:\n${typeof erroDiagnostico.detalhes === 'string' ? erroDiagnostico.detalhes : JSON.stringify(erroDiagnostico.detalhes, null, 2)}\nData: ${new Date().toISOString()}`;
                  await navigator.clipboard.writeText(textoParaCopiar);
                  setErroCopiado(true);
                  setTimeout(() => setErroCopiado(false), 3000);
                }}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                <Copy className="w-4 h-4" />
                {erroCopiado ? 'Copiado para Área de Transferência!' : 'Copiar Diagnóstico do Erro'}
              </button>
              <button
                type="button"
                onClick={() => setErroDiagnostico(null)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
