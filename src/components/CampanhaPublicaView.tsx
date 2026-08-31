import { toast } from '../lib/toast';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Campanha, CampanhaPublicaResponse, Promocao, OfertaRelampago, TemaCampanha, TEMA_PADRAO, DEFAULT_CHECKOUT_CONFIG, RankingItem } from '../types';
import { 
  Trophy, Flame, Sparkles, ShieldCheck, Ticket, Users, Tag,
  ChevronDown, ChevronUp, Plus, Minus, Gift, Info, HelpCircle,
  Smartphone, Share2, Instagram, AlertTriangle, AlertCircle, Copy, CheckCircle2,
  User, CreditCard, QrCode, FileText, Lock, Shield, X, Music2, MessageCircle,
  ChevronLeft, ChevronRight, Star, TrendingUp, Zap, Camera, Video, Layout, Eye, Calendar,
  MapPin, Building, Home, Hash, Loader2
} from 'lucide-react';
import { validarCPF, formatarCPF } from '../utils/cpfValidation';
import { UpsellModal } from './UpsellModal';
import { PixPaymentModal } from './PixPaymentModal';
import { BoletoPaymentModal } from './BoletoPaymentModal';
import { CartaoSuccessModal } from './CartaoSuccessModal';
import { MeusNumerosModal } from './MeusNumerosModal';
import { MeusDadosModal } from './MeusDadosModal';
import { SocialNotifications } from './SocialNotifications';
import { ExitPopup } from './ExitPopup';
import { WhatsAppIcon, TikTokIcon, InstagramIcon } from './BrandIcons';
import { formatarMoeda, toCents, toReais } from '../lib/money';
import { getSectionIcon, calcularEstiloBotao, calcularEstiloCard, obterFundoCss, gerarGradientDegradeBanner } from '../lib/temaHelpers';
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
  onNavigateComoFunciona?: () => void;
  modoPreview?: boolean;
  previewCampanha?: Campanha;
  previewTema?: TemaCampanha;
}

export const CampanhaPublicaView: React.FC<Props> = ({
  codigo = '',
  onNavigateAdmin,
  onNavigateComoFunciona,
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
  const [nomeSocial, setNomeSocial] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [confirmarWhatsapp, setConfirmarWhatsapp] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [instagramInput, setInstagramInput] = useState('');
  const [tiktokInput, setTiktokInput] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [maiorIdade, setMaiorIdade] = useState(false);

  // Endereço
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [uf, setUf] = useState('');
  const [cidade, setCidade] = useState('');
  const [complemento, setComplemento] = useState('');
  const [carregandoCep, setCarregandoCep] = useState(false);
  const [cepErro, setCepErro] = useState('');

  const [compradorSalvo, setCompradorSalvo] = useState<{ nome: string; whatsapp: string } | null>(null);
  const [formErro, setFormErro] = useState('');
  const [enviandoPedido, setEnviandoPedido] = useState(false);

  const handleCepChange = async (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 8);
    const formatted = raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw;
    setCep(formatted);
    setCepErro('');

    if (raw.length === 8) {
      setCarregandoCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        const dataJson = await res.json();
        if (dataJson.erro) {
          setCepErro('CEP não encontrado. Preencha o endereço manualmente.');
        } else {
          if (dataJson.logradouro) setLogradouro(dataJson.logradouro);
          if (dataJson.bairro) setBairro(dataJson.bairro);
          if (dataJson.localidade) setCidade(dataJson.localidade);
          if (dataJson.uf) setUf(dataJson.uf.toUpperCase());
          setCepErro('');
        }
      } catch (err) {
        setCepErro('Erro ao buscar CEP. Preencha o endereço manualmente.');
      } finally {
        setCarregandoCep(false);
      }
    }
  };

  // Checkout Transparente: Métodos de Pagamento & Cartão
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao' | 'boleto'>('pix');
  const [cartaoNumero, setCartaoNumero] = useState('');
  const [checkoutTimer, setCheckoutTimer] = useState<number | null>(null);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (checkoutAberto && data?.campanha?.checkout?.timerUrgencia?.ativo) {
      if (checkoutTimer === null) {
        setCheckoutTimer((data.campanha.checkout.timerUrgencia.minutos || 10) * 60);
      }
      interval = setInterval(() => {
        setCheckoutTimer(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCheckoutTimer(null);
    }
    return () => clearInterval(interval);
  }, [checkoutAberto, data?.campanha?.checkout?.timerUrgencia]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
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
  const [campanhaResultadoModal, setCampanhaResultadoModal] = useState<Campanha | null>(null);

  useEffect(() => {
    if (organizadorModalAberto) {
      setCarregandoOrganizador(true);
      const ref = codigo || data?.campanha?.codigo || '';
      fetch(`/api/campanhas?ref=${encodeURIComponent(ref)}`)
        .then(res => res.json())
        .then(resData => {
          if (Array.isArray(resData)) {
            // Exclui campanhas com exclusão lógica (excluidaEm preenchido)
            const validas = resData.filter((c: Campanha) => 
              !c.excluidaEm && (c.status === 'publicada' || c.status === 'pausada' || c.status === 'encerrada')
            );
            
            // Campanhas ativas primeiro (mais recentes no topo)
            const ativas = validas
              .filter(c => c.status === 'publicada' || c.status === 'pausada')
              .sort((a, b) => new Date(b.criadaEm || 0).getTime() - new Date(a.criadaEm || 0).getTime());

            // Campanhas encerradas depois (mais recentes no topo)
            const encerradas = validas
              .filter(c => c.status === 'encerrada')
              .sort((a, b) => {
                const dataA = new Date(a.encerradaEm || a.atualizadaEm || a.criadaEm || 0).getTime();
                const dataB = new Date(b.encerradaEm || b.atualizadaEm || b.criadaEm || 0).getTime();
                return dataB - dataA;
              });

            setCampanhasOrganizador([...ativas, ...encerradas]);
          }
        })
        .catch(err => console.error('Erro ao buscar campanhas do organizador:', err))
        .finally(() => setCarregandoOrganizador(false));
    }
  }, [organizadorModalAberto, codigo, data?.campanha?.codigo]);

  // Cupom de Desconto
  const [cupomInput, setCupomInput] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState<{ codigo: string; tipo?: 'percentual' | 'fixo'; descontoPct: number; valorFixo?: number; mensagem?: string } | null>(null);
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
      const savedNomeSocial = localStorage.getItem('rifazone_comprador_nome_social');
      const savedDataNasc = localStorage.getItem('rifazone_comprador_data_nascimento');
      const savedCep = localStorage.getItem('rifazone_comprador_cep');
      const savedLogradouro = localStorage.getItem('rifazone_comprador_logradouro');
      const savedNumero = localStorage.getItem('rifazone_comprador_numero');
      const savedBairro = localStorage.getItem('rifazone_comprador_bairro');
      const savedUf = localStorage.getItem('rifazone_comprador_uf');
      const savedCidade = localStorage.getItem('rifazone_comprador_cidade');
      const savedComplemento = localStorage.getItem('rifazone_comprador_complemento');

      if (savedNome) setNome(savedNome);
      if (savedPhone) {
        const formattedPhone = formatWhatsapp(savedPhone);
        setWhatsapp(formattedPhone);
        setConfirmarWhatsapp(formattedPhone);
        setCompradorSalvo({ nome: savedNome || 'Participante', whatsapp: savedPhone });
      }
      if (savedCpf) setCpf(savedCpf);
      if (savedEmail) setEmail(savedEmail);
      if (savedNomeSocial) setNomeSocial(savedNomeSocial);
      if (savedDataNasc) setDataNascimento(savedDataNasc);
      if (savedCep) setCep(savedCep);
      if (savedLogradouro) setLogradouro(savedLogradouro);
      if (savedNumero) setNumero(savedNumero);
      if (savedBairro) setBairro(savedBairro);
      if (savedUf) setUf(savedUf);
      if (savedCidade) setCidade(savedCidade);
      if (savedComplemento) setComplemento(savedComplemento);
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
          tipo: json.tipo || 'percentual',
          descontoPct: json.descontoPct,
          valorFixo: json.valorFixo,
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
  const carregarCampanha = async (silencioso = false) => {
    if (modoPreview && previewCampanha) {
      let realEst = data?.estatisticas || {
        totalCotas: previewCampanha.totalCotas || 10000,
        vendidas: 0,
        reservadas: 0,
        disponiveis: previewCampanha.totalCotas || 10000,
        percentualVendido: 0
      };
      let realRank: RankingItem[] = data?.ranking || [];

      // Se a campanha já tem um código e não é um mock, E as estatísticas reais ainda não foram carregadas, busca do servidor
      if (!data?.estatisticas && previewCampanha.codigo && !previewCampanha.codigo.startsWith('sorteio-preview')) {
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
      if (!silencioso) setCarregando(false);
      return;
    }

    if (!codigo) return;

    try {
      if (!silencioso) setCarregando(true);
      const res = await fetch(`/api/campanhas/${codigo}`);
      if (!res.ok) {
        if (!silencioso) throw new Error('Campanha não encontrada.');
        return;
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
      if (!silencioso) setErro(err.message || 'Erro ao carregar sorteio.');
    } finally {
      if (!silencioso) setCarregando(false);
    }
  };

  useEffect(() => {
    carregarCampanha();
  }, [codigo, modoPreview]);

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

  const ranking = data?.ranking || [];
  const marca = data?.marca;
  const campanha = (modoPreview && previewCampanha ? previewCampanha : data?.campanha) as Campanha;

  if ((erro || !data) && !modoPreview) {
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

  if (!campanha) return null;

  const estatisticas = data?.estatisticas || {
    totalCotas: campanha.totalCotas || 0,
    vendidas: 0,
    reservadas: 0,
    disponiveis: campanha.totalCotas || 0,
    percentualVendido: 0
  };

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
    '--barra-fundo': tema.cores.barraProgressoFundo,
    '--barra-preenchimento': tema.cores.barraProgressoPreenchimento,
    '--barra-texto': tema.cores.barraProgressoTexto,
    '--card-barra-fundo': tema.cores.cardBarraProgressoFundo,
    '--botao-cotas-fundo': tema.cores.botaoCotasFundo,
    '--botao-cotas-texto': tema.cores.botaoCotasTexto,
    '--botao-cotas-numero': tema.cores.botaoCotasNumero,
    '--controles-fundo': tema.cores.controlesFundo,
    '--controles-texto': tema.cores.controlesTexto,
    '--texto-preco-barra': tema.cores.textoPrecoBarra,
    '--subtitulo-cor': tema.cores.subtituloCor,
    '--local-sorteio-cor': tema.cores.localSorteioCor,
    '--icone-cor': tema.cores.iconeCor,
    // Grade de Cotas Manuais (Cores por Estado)
    '--cota-disponivel-fundo': (tema.cores as any).cotaDisponivelFundo || '#0f172a',
    '--cota-disponivel-texto': (tema.cores as any).cotaDisponivelTexto || '#ffffff',
    '--cota-disponivel-borda': (tema.cores as any).cotaDisponivelBorda || '#334155',
    '--cota-selecionada-fundo': (tema.cores as any).cotaSelecionadaFundo || tema.cores.primaria || '#10b981',
    '--cota-selecionada-texto': (tema.cores as any).cotaSelecionadaTexto || '#022c22',
    '--cota-selecionada-borda': (tema.cores as any).cotaSelecionadaBorda || tema.cores.primaria || '#10b981',
    '--cota-reservada-fundo': (tema.cores as any).cotaReservadaFundo || '#d97706',
    '--cota-reservada-texto': (tema.cores as any).cotaReservadaTexto || '#ffffff',
    '--cota-reservada-borda': (tema.cores as any).cotaReservadaBorda || '#b45309',
    '--cota-paga-fundo': (tema.cores as any).cotaPagaFundo || '#1e293b',
    '--cota-paga-texto': (tema.cores as any).cotaPagaTexto || '#64748b',
    '--cota-paga-borda': (tema.cores as any).cotaPagaBorda || '#334155',
  } as React.CSSProperties;

  const getIcon = (name: string) => {
    return getSectionIcon(name);
  };

  // Carregamento dinâmico de fontes do Google Fonts para títulos e textos
  // Efeito temporariamente removido para teste


  // Helpers de classes de estilo baseadas no tema
  const getBtnRoundingClass = (formato?: string) => {
    if (formato === 'square' || formato === 'reto') return 'rounded-none';
    if (formato === 'rounded') return 'rounded-xl';
    if (formato === 'pilled' || formato === 'pill') return 'rounded-full px-6';
    if (formato === 'round') return 'rounded-full';
    if (formato === 'super') return 'rounded-3xl';
    if (formato === 'cortado') return 'rounded-md clip-chamfer';
    if (formato === 'inclinado') return 'rounded-lg skew-x-[-3deg]';
    return 'rounded-xl';
  };

  const getBtnStyleObjectAndClass = (estiloBotao?: string) => {
    const b = tema.botao;
    const est = estiloBotao || b.estilo || 'solido';
    let className = 'bg-[var(--btn)] text-[var(--btn-txt)] shadow-lg hover:opacity-95';
    let style: React.CSSProperties = {
      fontSize: `${b.tamanhoTexto || 15}px`,
      fontFamily: tema.tipografia.fonteTexto || 'Inter',
    };

    if (est === 'vidro' || est === 'glass') {
      className = 'bg-white/15 backdrop-blur-md border border-white/30 text-white shadow-xl hover:bg-white/25';
    } else if (est === 'transparente' || est === 'transparent') {
      className = 'bg-transparent border-2 border-[var(--btn)] text-[var(--btn)] hover:bg-[var(--btn)] hover:text-[var(--btn-txt)] shadow-md';
    } else if (est === '3d') {
      const sombraH = b.sombraAltura ?? 4;
      const sombraW = b.sombraLargura ?? 4;
      const sombraC = b.corSombra || 'rgba(0,0,0,0.4)';
      className = 'bg-[var(--btn)] text-[var(--btn-txt)] font-black active:translate-y-1 transition-transform';
      style = {
        ...style,
        boxShadow: `${sombraW}px ${sombraH}px 0px 0px ${sombraC}`,
      };
    } else if (est === 'gradiente') {
      className = 'text-white shadow-lg';
      style = {
        ...style,
        background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
      };
    } else if (est === 'neon') {
      className = 'bg-[var(--btn)] text-[var(--btn-txt)] shadow-[0_0_20px_rgba(16,185,129,0.6)]';
    } else if (est === 'outline') {
      className = 'bg-transparent border border-[var(--btn)] text-[var(--btn)] hover:bg-[var(--btn)] hover:text-[var(--btn-txt)]';
    }

    return { className, style };
  };

  const getBtnSizeClass = (tamanho?: string | number) => {
    if (tamanho === 'sm' || (typeof tamanho === 'number' && tamanho < 14)) return 'py-2.5 px-4 text-xs';
    if (tamanho === 'lg' || (typeof tamanho === 'number' && tamanho > 18)) return 'py-4 px-6 text-base';
    return 'py-3 px-5 text-sm';
  };

  const getTitleSizeClass = (tamanho?: string | number) => {
    if (tamanho === 'sm' || (typeof tamanho === 'number' && tamanho < 20)) return 'text-lg sm:text-xl';
    if (tamanho === 'lg' || (typeof tamanho === 'number' && tamanho > 28)) return 'text-2xl sm:text-3xl';
    return 'text-xl sm:text-2xl';
  };

  const getFontFamilyClass = (fonte?: string) => {
    if (fonte === 'serif') return 'font-serif';
    if (fonte === 'display') return 'font-sans tracking-tight';
    return 'font-sans';
  };

  // Cálculo de valor com suporte a pacotes e desconto progressivo
  const calcularValorTotal = (qtd: number): number => {
    const unitario = Number(campanha.valorCota) || 0;
    const valorBase = Number((qtd * unitario).toFixed(2));
    if (campanha.promocoes && campanha.promocoes.length > 0) {
      const promo = campanha.promocoes.find(p => Number(p.quantidade) === qtd);
      if (promo && Number(promo.valor) > 0) {
        const pVal = Number(promo.valor);
        // Garante que o pacote promocional nunca custe mais que a compra avulsa
        if (pVal <= valorBase) {
          return pVal;
        }
      }
    }
    if (campanha.descontoPorValorTotal && campanha.descontoPorValorTotal.length > 0) {
      const regrasOrdenadas = [...campanha.descontoPorValorTotal].sort(
        (a, b) => Number(b.aPartirDeValor) - Number(a.aPartirDeValor)
      );
      const regraValida = regrasOrdenadas.find(r => valorBase >= Number(r.aPartirDeValor));
      if (regraValida && Number(regraValida.valorCotaComDesconto) > 0) {
        return Number((qtd * Number(regraValida.valorCotaComDesconto)).toFixed(2));
      }
    }
    return valorBase;
  };

  const valorSemCupom = calcularValorTotal(quantidade);
  let valorBase = valorSemCupom;
  if (cupomAplicado) {
    if (cupomAplicado.tipo === 'fixo') {
      valorBase = Number(Math.max(0, valorSemCupom - (cupomAplicado.valorFixo || 0)).toFixed(2));
    } else {
      valorBase = Number((valorSemCupom * (1 - cupomAplicado.descontoPct / 100)).toFixed(2));
    }
  }
    
  if (metodoPagamento === 'pix' && data?.campanha?.checkout?.pixConfig?.descontoPct) {
    valorBase = Number((valorBase * (1 - data.campanha.checkout.pixConfig.descontoPct / 100)).toFixed(2));
  }
  const valorTotalAtual = valorBase;

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
    const cleanConfirmar = confirmarWhatsapp.replace(/\D/g, '');

    if (!nome.trim() || nome.trim().split(' ').length < 2) {
      setFormErro('Por favor, informe seu nome e sobrenome completos.');
      return;
    }

    if (cleanWhatsapp.length < 10) {
      setFormErro('Informe um WhatsApp válido com DDD.');
      return;
    }

    if (cleanWhatsapp !== cleanConfirmar) {
      setFormErro('Os números de WhatsApp informados não coincidem. Verifique a confirmação.');
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

    // Validação de CPF com dígitos verificadores
    const cleanCpf = cpf.replace(/\D/g, '');
    const cpfExigido = (campanha.checkout?.coletaDados?.exigirCpf || campanha.exigirCpf) || campanha.modalidade === 'gratis' || metodoPagamento === 'boleto';
    if (cpfExigido || cleanCpf.length > 0) {
      if (cleanCpf.length !== 11 || !validarCPF(cleanCpf)) {
        setFormErro('Informe um CPF válido com 11 dígitos e dígitos verificadores corretos.');
        return;
      }
    }

    // Validação de E-mail
    const emailExigido = (campanha.checkout?.coletaDados?.exigirEmail || campanha.exigirEmail) || campanha.modalidade === 'gratis' || metodoPagamento === 'cartao';
    if (emailExigido || email.trim().length > 0) {
      if (!email || !email.includes('@') || !email.includes('.')) {
        setFormErro('Informe um endereço de e-mail válido para confirmação do pagamento.');
        return;
      }
    }

    // Validação de Endereço se ativado
    const coletarEnderecoAtivo = !!(campanha.coletarEndereco?.ativo || campanha.checkout?.coletaDados?.coletarEndereco?.ativo);
    const coletarEnderecoObrigatorio = !!(campanha.coletarEndereco?.obrigatorio || campanha.checkout?.coletaDados?.coletarEndereco?.obrigatorio);

    if (coletarEnderecoAtivo && coletarEnderecoObrigatorio) {
      const cleanCep = cep.replace(/\D/g, '');
      if (cleanCep.length < 8) {
        setFormErro('Informe um CEP válido com 8 dígitos.');
        return;
      }
      if (!logradouro.trim()) {
        setFormErro('Informe o logradouro (rua/avenida).');
        return;
      }
      if (!numero.trim()) {
        setFormErro('Informe o número do endereço.');
        return;
      }
      if (!bairro.trim()) {
        setFormErro('Informe o bairro.');
        return;
      }
      if (!cidade.trim() || !uf.trim()) {
        setFormErro('Informe a cidade e UF.');
        return;
      }
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
      if (cpfCartaoLimpo.length !== 11 || !validarCPF(cpfCartaoLimpo)) {
        setFormErro('Informe o CPF válido do titular do cartão (11 dígitos).');
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
            cpf: cleanCpf || cartaoCpf.replace(/\D/g, '') || undefined,
            email: email.trim() || undefined,
            instagram: instagramInput.trim() || undefined,
            tiktok: tiktokInput.trim() || undefined,
            nomeSocial: nomeSocial.trim() || undefined,
            dataNascimento: dataNascimento.trim() || undefined,
            cep: cep.trim() || undefined,
            logradouro: logradouro.trim() || undefined,
            numero: numero.trim() || undefined,
            bairro: bairro.trim() || undefined,
            uf: uf.trim() || undefined,
            cidade: cidade.trim() || undefined,
            complemento: complemento.trim() || undefined
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
        if (nomeSocial) localStorage.setItem('rifazone_comprador_nome_social', nomeSocial.trim());
        if (cpf) localStorage.setItem('rifazone_comprador_cpf', cpf.trim());
        if (email) localStorage.setItem('rifazone_comprador_email', email.trim());
        if (dataNascimento) localStorage.setItem('rifazone_comprador_data_nascimento', dataNascimento.trim());
        if (cep) localStorage.setItem('rifazone_comprador_cep', cep.trim());
        if (logradouro) localStorage.setItem('rifazone_comprador_logradouro', logradouro.trim());
        if (numero) localStorage.setItem('rifazone_comprador_numero', numero.trim());
        if (bairro) localStorage.setItem('rifazone_comprador_bairro', bairro.trim());
        if (uf) localStorage.setItem('rifazone_comprador_uf', uf.trim());
        if (cidade) localStorage.setItem('rifazone_comprador_cidade', cidade.trim());
        if (complemento) localStorage.setItem('rifazone_comprador_complemento', complemento.trim());
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
        carregarCampanha(true);
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

        carregarCampanha(true);
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

  // 1. Seção Banner / Hero (Carousel Infinito)
  const BannerSection = ({ campanha, tema }: { campanha: Campanha; tema: TemaCampanha }) => {
    const imagens = [campanha.bannerUrl, ...(campanha.fotosCarrossel || [])].filter(Boolean);
    const [index, setIndex] = useState(0);

    const bannerConfig = tema.bannerConfig || {};
    const isFullWidth = bannerConfig.fullWidth !== false;
    const isSeloPulsando = bannerConfig.seloEstilo === 'pulso' || bannerConfig.seloAnimado === true;

    const bannerCardStyle = calcularEstiloCard({
      estilo: tema.botao?.estiloCards,
      corFundo: (tema.cores as any).cardBannerFundo || tema.cores.cardFundo,
      corBorda: (tema.cores as any).cardBannerBorda || tema.cores.cardBorda,
      raioBorda: isFullWidth ? 0 : (tema.botao?.raioBordaCards ?? 16),
      possuirBorda: tema.botao?.possuirBordaCards,
      larguraBorda: tema.botao?.larguraBordaCards,
      tamanhoAlturaCards: tema.botao?.tamanhoAlturaCards,
      tamanhoFonteCards: tema.botao?.tamanhoFonteCards,
    });

    const overlayCor = bannerConfig.overlayCor || '#000000';
    const overlayDegradeEstilo = bannerConfig.overlayDegradeAtivo !== false
      ? (bannerConfig.overlayDegrade || gerarGradientDegradeBanner(overlayCor))
      : 'none';

    // Auto-play opcional
    useEffect(() => {
      if (imagens.length <= 1 || !campanha.autoplayGaleria) return;
      const intervalo = (campanha.autoplayIntervaloGaleria || 5) * 1000;
      const timer = setInterval(() => {
        setIndex(prev => (prev + 1) % imagens.length);
      }, intervalo);
      return () => clearInterval(timer);
    }, [imagens.length, campanha.autoplayGaleria, campanha.autoplayIntervaloGaleria]);

    if (imagens.length === 0) return null;

    return (
      <div 
        className={`relative overflow-hidden group shadow-2xl ${
          isFullWidth ? '-mx-4 sm:mx-0 sm:rounded-2xl' : `border ${bannerCardStyle.className}`
        }`}
        style={
          isFullWidth
            ? { borderRadius: '0px', fontFamily: tema.tipografia.fonteCardBanner }
            : {
                ...bannerCardStyle.style,
                borderRadius: `${tema.botao?.raioBordaCards ?? 16}px`,
                fontFamily: tema.tipografia.fonteCardBanner
              }
        }
      >
        <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-slate-950">
          <AnimatePresence initial={false} mode="wait">
            <div key={index} className="absolute inset-0 bg-slate-950">
              {/* Fundo Desfocado para preenchimento de borda caso a proporção varie */}
              <img 
                src={imagens[index]} 
                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30 scale-110" 
                alt="" 
              />
              <motion.img
                src={imagens[index]}
                alt={`${campanha.titulo} - Foto ${index + 1}`}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="relative z-10 w-full h-full object-cover cursor-grab active:cursor-grabbing"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -50) {
                    setIndex(prev => (prev + 1) % imagens.length);
                  } else if (info.offset.x > 50) {
                    setIndex(prev => (prev - 1 + imagens.length) % imagens.length);
                  }
                }}
              />
            </div>
          </AnimatePresence>

          {/* Selo de Destaque no Banner */}
          {campanha.selo && (campanha.exibirSelo ?? true) && (bannerConfig.exibirSeloBanner !== false) && (() => {
            const seloBordaAtiva = bannerConfig.seloBordaAtiva ?? false;
            const seloBordaCor = bannerConfig.seloBordaCor || '#ffffff';
            const seloBordaEspessura = bannerConfig.seloBordaEspessura ?? 1;
            return (
              <div 
                style={{
                  ...obterFundoCss(bannerConfig.seloFundo || tema.cores.seloBannerFundo || '#f59e0b', '#f59e0b'),
                  color: bannerConfig.seloTexto || tema.cores.seloBannerTexto || '#022c22',
                  ...(seloBordaAtiva ? { border: `${seloBordaEspessura}px solid ${seloBordaCor}` } : { border: 'none' })
                }}
                className={`absolute top-3 left-3 px-3 py-1 font-black text-[10px] uppercase tracking-wider rounded-full shadow-xl flex items-center gap-1.5 z-20 select-none ${
                  isSeloPulsando ? 'animate-pulse' : ''
                }`}
              >
                {!(/^\s*[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(campanha.selo.trim())) && (
                  <Flame className="w-3 h-3 fill-current" />
                )}
                <span>{campanha.selo}</span>
              </div>
            );
          })()}

          {/* Overlay com Degradê do Título sobreposto na imagem */}
          {(() => {
            const alinhamentoBanner = tema.tipografia?.alinhamentoBanner || 'esquerda';
            const alignClassBanner = alinhamentoBanner === 'centro' ? 'text-center items-center' :
                                     alinhamentoBanner === 'direita' ? 'text-right items-end' :
                                     'text-left items-start';
            const overlayAltura = bannerConfig.overlayAltura ?? 60;
            const tamanhoBannerTitulo = tema.tipografia.tamanhoBannerTitulo;
            const tamanhoBannerSubtitulo = tema.tipografia.tamanhoBannerSubtitulo;
            return (
              <div 
                className={`absolute inset-x-0 bottom-0 pt-16 pb-4 px-4 sm:px-5 flex flex-col justify-end z-20 pointer-events-none ${alignClassBanner}`}
                style={{ 
                  background: overlayDegradeEstilo,
                  height: bannerConfig.overlayDegradeAtivo !== false ? `${overlayAltura}%` : 'auto',
                  maxHeight: '100%'
                }}
              >
                {campanha.exibirSeloOficial !== false && (
                  <div
                    className="flex items-center gap-1.5 text-[10px] font-black mb-1 uppercase tracking-widest text-emerald-400 drop-shadow pointer-events-auto"
                    style={{ color: 'var(--brand)' }}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Sorteio oficial: {campanha.localSorteio || 'Loteria Federal'}</span>
                  </div>
                )}
                <h1 
                  className={`font-black leading-tight drop-shadow-md pointer-events-auto ${tamanhoBannerTitulo ? '' : getTitleSizeClass(tema.tipografia.tamanhoTitulo)}`}
                  style={{ 
                    color: tema.cores.titulos, 
                    fontFamily: tema.tipografia.fonteCardBanner || tema.tipografia.fonteTitulo,
                    ...(tamanhoBannerTitulo ? { fontSize: `${tamanhoBannerTitulo}px` } : {})
                  }}
                >
                  {campanha.titulo}
                </h1>
                {campanha.subtitulo && (
                  <p 
                    className="mt-1 line-clamp-2 opacity-95 uppercase font-medium tracking-tight text-slate-200 drop-shadow pointer-events-auto"
                    style={{ 
                      color: tema.cores.subtituloCor || '#e2e8f0', 
                      fontFamily: tema.tipografia.fonteCardBannerSubtitulo || tema.tipografia.fonteCardBanner || tema.tipografia.fonteTexto,
                      fontSize: tamanhoBannerSubtitulo ? `${tamanhoBannerSubtitulo}px` : '12px'
                    }}
                  >
                    {campanha.subtitulo}
                  </p>
                )}
              </div>
            );
          })()}

          {imagens.length > 1 && (
            <>
              {/* Indicadores de Paginação */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                <span className="text-[10px] font-mono font-bold text-white">
                  {index + 1}/{imagens.length}
                </span>
              </div>

              {/* Botões de Navegação */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(prev => (prev - 1 + imagens.length) % imagens.length);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(prev => (prev + 1) % imagens.length);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // 2. Seção Barra de Progresso
  const ProgressoSection = ({ campanha, estatisticas, tema }: { campanha: Campanha; estatisticas: any, tema: TemaCampanha }) => {
    if (campanha.exibirBarraProgresso === false || estatisticas.vendidas === 0) return null;
    const progCardStyle = calcularEstiloCard({
      estilo: tema.botao?.estiloCards,
      corFundo: (tema.cores as any).cardProgressoFundo || tema.cores.cardBarraProgressoFundo || tema.cores.cardFundo,
      corBorda: (tema.cores as any).cardProgressoBorda || tema.cores.cardBorda,
      raioBorda: tema.botao?.raioBordaCards ?? 16,
      tamanhoAlturaCards: tema.botao?.tamanhoAlturaCards,
      tamanhoFonteCards: tema.botao?.tamanhoFonteCards,
    });

    const cfg = tema.barraProgresso || {};
    const pct = estatisticas.percentualVendido;
    const textoBarra = (cfg.textoInterno ?? '{pct}% vendido').replace('{pct}', String(pct));
    const tituloText = cfg.titulo !== undefined ? cfg.titulo : 'Progresso do sorteio';
    const subtituloText = cfg.subtitulo;
    const rodapeText = cfg.rodape;
    const altura = cfg.altura ?? 16;
    const raioBorda = cfg.raioBorda ?? 9999;
    const larguraMax = cfg.larguraMax ?? '100%';

    return (
      <div 
        className={`border rounded-2xl p-4 shadow-sm mx-auto ${progCardStyle.className}`}
        style={{ ...progCardStyle.style, maxWidth: larguraMax, fontFamily: tema.tipografia.fonteCardProgresso }}
      >
        {(tituloText || subtituloText || textoBarra) && (
          <div className="mb-2 space-y-0.5">
            <div className={`flex items-center justify-between text-xs ${
              (tema.tipografia?.alinhamentoProgressoTitulo || tema.tipografia?.alinhamentoProgresso) === 'centro' ? 'justify-center text-center' :
              (tema.tipografia?.alinhamentoProgressoTitulo || tema.tipografia?.alinhamentoProgresso) === 'direita' ? 'justify-end text-right' :
              'justify-between text-left'
            }`}>
              {tituloText ? (
                <span 
                  className="font-bold opacity-90"
                  style={{ 
                    fontFamily: tema.tipografia.fonteCardProgresso,
                    fontSize: `${tema.tipografia.tamanhoProgressoTitulo ?? 14}px`,
                    color: tema.cores.titulos || '#ffffff'
                  }}
                >
                  {tituloText}
                </span>
              ) : <span />}
              {textoBarra && (
                <span className="font-extrabold text-xs ml-auto" style={{ fontFamily: tema.tipografia.fonteProgressoInterno || tema.tipografia.fonteCardProgresso || 'Inter', color: tema.cores.barraProgressoPreenchimento || 'var(--brand)' }}>
                  {textoBarra}
                </span>
              )}
            </div>
            {subtituloText && (
              <p 
                className={`opacity-70 ${
                  (tema.tipografia?.alinhamentoProgressoSubtitulo || tema.tipografia?.alinhamentoProgresso) === 'centro' ? 'text-center' :
                  (tema.tipografia?.alinhamentoProgressoSubtitulo || tema.tipografia?.alinhamentoProgresso) === 'direita' ? 'text-right' :
                  'text-left'
                }`}
                style={{ 
                  fontFamily: tema.tipografia.fonteCardProgressoSubtitulo || 'Inter', 
                  fontSize: `${tema.tipografia.tamanhoProgressoSubtitulo ?? 11}px`,
                  color: tema.cores.descricoes 
                }}
              >
                {subtituloText}
              </p>
            )}
          </div>
        )}

        {/* Barra de progresso */}
        <div 
          className="w-full overflow-hidden p-0.5 border border-slate-700/50 relative flex items-center" 
          style={{ 
            height: `${altura}px`, 
            borderRadius: `${raioBorda}px`, 
            backgroundColor: tema.cores.barraProgressoFundo || '#1e293b' 
          }}
        >
          <div
            className="h-full transition-all duration-500 shadow-sm"
            style={{
              width: `${Math.min(100, Math.max(2, pct))}%`,
              borderRadius: `${Math.max(0, raioBorda - 2)}px`,
              background: tema.cores.barraProgressoPreenchimento || '#10b981'
            }}
          />
        </div>

        {/* Rodapé customizado ou padrão */}
        {rodapeText ? (
          <div className="text-[11px] mt-2 text-center opacity-80" style={{ fontFamily: tema.tipografia.fonteProgressoRodape || tema.tipografia.fonteCardProgresso || 'Inter', color: tema.cores.barraProgressoTexto }}>
            {rodapeText.replace('{vendidas}', estatisticas.vendidas.toLocaleString('pt-BR')).replace('{disponiveis}', estatisticas.disponiveis.toLocaleString('pt-BR'))}
          </div>
        ) : (campanha.exibirQtdCotas ?? true) ? (
          <div className="flex justify-between text-[11px] mt-2 opacity-60" style={{ fontFamily: tema.tipografia.fonteProgressoRodape || tema.tipografia.fonteCardProgresso || 'Inter' }}>
            <span style={{ color: tema.cores.barraProgressoTexto }}>{estatisticas.vendidas.toLocaleString('pt-BR')} cotas vendidas</span>
            <span style={{ color: tema.cores.barraProgressoTexto }}>{estatisticas.disponiveis.toLocaleString('pt-BR')} disponíveis</span>
          </div>
        ) : null}
      </div>
    );
  };

  // 2a. Seção Preço Unitário ("Por apenas R$ ...")
  const PrecoUnitarioSection = ({ campanha, tema }: { campanha: Campanha; tema: TemaCampanha }) => {
    if (campanha.modalidade === 'gratis') return null;

    const cotasCfg = tema.cotasConfig || {};
    const rawTexto = cotasCfg.textoPorApenas ?? 'Por apenas';
    const textoPorApenas = rawTexto.trim();
    const temTexto = textoPorApenas.length > 0;
    const porApenasFundo = cotasCfg.porApenasFundo || '#064e3b';
    const porApenasTexto = cotasCfg.porApenasTexto || tema.cores.primaria || '#10b981';
    const porApenasBorda = cotasCfg.porApenasBorda || '#059669';
    const porApenasTemBorda = cotasCfg.porApenasTemBorda ?? true;
    const porApenasEspessuraBorda = cotasCfg.porApenasEspessuraBorda ?? 1;
    const porApenasRaioBorda = cotasCfg.porApenasRaioBorda ?? 12;
    const porApenasEstiloBotao = cotasCfg.porApenasEstiloBotao || 'solido';
    const porApenasTamanhoValor = cotasCfg.porApenasTamanhoValor || 24;
    const porApenasTamanhoTexto = cotasCfg.porApenasTamanhoTexto || 14;
    const porApenasFonte = cotasCfg.porApenasFonte || tema.tipografia.fonteCardCotas;
    const estiloContainer = cotasCfg.estiloContainer || 'texto_e_botao';
    const layout = cotasCfg.porApenasLayout || 'vertical';
    const alinhamento = cotasCfg.porApenasAlinhamento || 'centro';

    // Alinhamento na página (wrapper externo)
    const alignWrapperClass = 
      alinhamento === 'esquerda' ? 'justify-start text-left items-start' :
      alinhamento === 'direita' ? 'justify-end text-right items-end' :
      'justify-center text-center items-center';

    const justifyFlexClass =
      alinhamento === 'esquerda' ? 'justify-start' :
      alinhamento === 'direita' ? 'justify-end' :
      'justify-center';

    const textAlignmentClass =
      alinhamento === 'esquerda' ? 'text-left' :
      alinhamento === 'direita' ? 'text-right' :
      'text-center';

    // Estilização do Botão/Tag quando usado
    const styleBotaoObj = (() => {
      if (porApenasEstiloBotao === 'vidro') {
        return {
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          backdropFilter: 'blur(8px)',
          border: porApenasTemBorda ? `${porApenasEspessuraBorda}px solid ${porApenasBorda}` : 'none',
          borderRadius: `${porApenasRaioBorda}px`,
          color: porApenasTexto,
        };
      }
      if (porApenasEstiloBotao === 'transparente') {
        return {
          backgroundColor: 'transparent',
          border: porApenasTemBorda ? `${porApenasEspessuraBorda}px solid ${porApenasBorda}` : 'none',
          borderRadius: `${porApenasRaioBorda}px`,
          color: porApenasTexto,
        };
      }
      if (porApenasEstiloBotao === 'sombra') {
        return {
          ...obterFundoCss(porApenasFundo, '#064e3b'),
          border: porApenasTemBorda ? `${porApenasEspessuraBorda}px solid ${porApenasBorda}` : 'none',
          borderRadius: `${porApenasRaioBorda}px`,
          color: porApenasTexto,
          boxShadow: `0 4px 0 ${porApenasBorda}`,
        };
      }
      // Padrão: Sólido
      return {
        ...obterFundoCss(porApenasFundo, '#064e3b'),
        border: porApenasTemBorda ? `${porApenasEspessuraBorda}px solid ${porApenasBorda}` : 'none',
        borderRadius: `${porApenasRaioBorda}px`,
        color: porApenasTexto,
      };
    })();

    // Elemento de Texto Solto
    const renderTextoSolto = () => {
      if (!temTexto) return null;
      return (
        <span 
          style={{ 
            fontSize: `${porApenasTamanhoTexto}px`,
            color: porApenasTexto,
            fontFamily: porApenasFonte 
          }}
          className="font-bold tracking-tight inline-block opacity-90"
        >
          {textoPorApenas}
        </span>
      );
    };

    // Elemento de Valor Solto (apenas texto)
    const renderValorSolto = () => (
      <span 
        style={{ 
          fontSize: `${porApenasTamanhoValor}px`,
          color: porApenasTexto,
          fontFamily: porApenasFonte 
        }}
        className="font-mono font-black tracking-tight inline-block"
      >
        {formatarMoeda(campanha.valorCota)}
      </span>
    );

    // Elemento de Valor com Botão/Tag
    const renderValorBotao = () => (
      <div 
        style={{
          ...styleBotaoObj,
          fontSize: `${porApenasTamanhoValor}px`,
          fontFamily: porApenasFonte
        }}
        className="px-4 py-1.5 font-black shadow-sm font-mono tracking-tight inline-flex items-center justify-center transition-all"
      >
        {formatarMoeda(campanha.valorCota)}
      </div>
    );

    // Conteúdo estruturado conforme a disposição (vertical | horizontal | inverso)
    const renderConteudo = (tipo: 'solto' | 'valor_botao') => {
      const renderVal = tipo === 'solto' ? renderValorSolto() : renderValorBotao();
      const renderTxt = renderTextoSolto();

      if (layout === 'horizontal') {
        return (
          <div className={`flex flex-row flex-wrap items-center gap-2.5 ${justifyFlexClass}`}>
            {renderTxt}
            {renderVal}
          </div>
        );
      }
      if (layout === 'inverso') {
        return (
          <div className={`flex flex-col gap-1 ${alignWrapperClass}`}>
            {renderVal}
            {renderTxt}
          </div>
        );
      }
      // Padrão: vertical
      return (
        <div className={`flex flex-col gap-1 ${alignWrapperClass}`}>
          {renderTxt}
          {renderVal}
        </div>
      );
    };

    // Regras de Desconto Progressivo por Valor Total (Totalmente Customizável)
    const renderRegrasDesconto = () => {
      if (!campanha.descontoPorValorTotal || campanha.descontoPorValorTotal.length === 0) return null;

      const cotasCfg = tema.cotasConfig || {};
      const regraEstilo = cotasCfg.regraDescontoEstilo || 'badge';
      const regraFundo = cotasCfg.regraDescontoFundo || 'rgba(16, 185, 129, 0.1)';
      const regraTexto = cotasCfg.regraDescontoTexto || '#34d399';
      const regraDestaque = cotasCfg.regraDescontoDestaque || '#10b981';
      const regraTemBorda = cotasCfg.regraDescontoTemBorda ?? true;
      const regraBorda = cotasCfg.regraDescontoBorda || 'rgba(16, 185, 129, 0.3)';
      const regraEspessuraBorda = cotasCfg.regraDescontoEspessuraBorda ?? 1;
      const regraRaioBorda = cotasCfg.regraDescontoRaioBorda ?? 9999;
      const regraFonte = cotasCfg.regraDescontoFonte || tema.tipografia.fonteCardCotas || '';
      const regraTamanhoTexto = cotasCfg.regraDescontoTamanhoTexto ?? 12;
      const regraPaddingY = cotasCfg.regraDescontoPaddingY ?? 4;
      const regraAlinhamento = cotasCfg.regraDescontoAlinhamento || cotasCfg.porApenasAlinhamento || 'centro';
      const regraMostrarIcone = cotasCfg.regraDescontoMostrarIcone ?? true;
      const regraIconeTipo = cotasCfg.regraDescontoIcone || 'zap';
      const regraTextoModelo = cotasCfg.regraDescontoTextoModelo || 'A partir de {valor} cada cota fica por {desconto}';

      const regraAlignClass = 
        regraAlinhamento === 'esquerda' ? 'items-start text-left' :
        regraAlinhamento === 'direita' ? 'items-end text-right' :
        'items-center text-center';

      const IconComponent = (() => {
        if (!regraMostrarIcone || regraIconeTipo === 'nenhum' || regraIconeTipo === 'none') return null;
        return getSectionIcon(regraIconeTipo, Zap);
      })();

      const regraCardStyle = (() => {
        const base: React.CSSProperties = {
          fontFamily: regraFonte || undefined,
          fontSize: `${regraTamanhoTexto}px`,
          color: regraTexto,
          borderRadius: `${regraRaioBorda}px`,
          border: regraTemBorda ? `${regraEspessuraBorda}px solid ${regraBorda}` : 'none',
          paddingTop: `${regraPaddingY}px`,
          paddingBottom: `${regraPaddingY}px`,
        };

        if (regraEstilo === 'vidro') {
          return {
            ...base,
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            backdropFilter: 'blur(8px)',
          };
        }
        if (regraEstilo === 'transparente') {
          return {
            ...base,
            backgroundColor: 'transparent',
          };
        }
        if (regraEstilo === '3d') {
          return {
            ...base,
            ...obterFundoCss(regraFundo, '#064e3b'),
            boxShadow: `0 3px 0 ${regraBorda || '#059669'}`,
          };
        }
        if (regraEstilo === 'gradiente' || regraEstilo === 'solido') {
          return {
            ...base,
            ...obterFundoCss(regraFundo, '#064e3b'),
          };
        }
        // badge
        return {
          ...base,
          ...obterFundoCss(regraFundo, 'rgba(16, 185, 129, 0.1)'),
        };
      })();

      return (
        <div className={`w-full flex flex-col gap-1.5 mt-2.5 ${regraAlignClass}`}>
          {campanha.descontoPorValorTotal.map((d, dIdx) => {
            const aPartir = formatarMoeda(d.aPartirDeValor);
            const comDesconto = formatarMoeda(d.valorCotaComDesconto);
            const partes = regraTextoModelo.split(/(\{valor\}|\{desconto\})/g);

            return (
              <div 
                key={dIdx}
                className="inline-flex items-center gap-1.5 px-3.5 shadow-sm font-semibold transition-all max-w-full"
                style={regraCardStyle}
              >
                {IconComponent && <IconComponent className="w-3.5 h-3.5 shrink-0" style={{ color: regraDestaque }} />}
                <span className="leading-snug">
                  {partes.map((parte, pIdx) => {
                    if (parte === '{valor}') {
                      return <strong key={pIdx} className="font-extrabold" style={{ color: regraDestaque }}>{aPartir}</strong>;
                    }
                    if (parte === '{desconto}') {
                      return <strong key={pIdx} className="font-extrabold font-mono" style={{ color: regraDestaque }}>{comDesconto}</strong>;
                    }
                    return <span key={pIdx}>{parte}</span>;
                  })}
                </span>
              </div>
            );
          })}
        </div>
      );
    };

    // 1. Apenas Texto & Preço Soltos (sem nenhum card ou botão externo)
    if (estiloContainer === 'apenas_texto_preco') {
      return (
        <div className={`w-full flex flex-col ${alignWrapperClass} py-1.5 transition-all`}>
          <div className={`w-full flex ${justifyFlexClass}`}>
            {renderConteudo('solto')}
          </div>
          {renderRegrasDesconto()}
        </div>
      );
    }

    // 2. Texto Solto + Botão no Valor
    if (estiloContainer === 'texto_e_botao') {
      return (
        <div className={`w-full flex flex-col ${alignWrapperClass} py-1.5 transition-all`}>
          <div className={`w-full flex ${justifyFlexClass}`}>
            {renderConteudo('valor_botao')}
          </div>
          {renderRegrasDesconto()}
        </div>
      );
    }

    // 3. Botão Único Unificado (Texto e Preço juntos dentro da mesma tag/botão)
    if (estiloContainer === 'botao_unico') {
      const content = (() => {
        if (layout === 'horizontal') {
          return (
            <div className="flex flex-row flex-wrap items-center gap-2 justify-center">
              {temTexto && (
                <span style={{ fontSize: `${porApenasTamanhoTexto}px` }} className="font-bold opacity-90">
                  {textoPorApenas}
                </span>
              )}
              <span style={{ fontSize: `${porApenasTamanhoValor}px` }} className="font-mono font-black">
                {formatarMoeda(campanha.valorCota)}
              </span>
            </div>
          );
        }
        if (layout === 'inverso') {
          return (
            <div className="flex flex-col items-center gap-0.5 justify-center">
              <span style={{ fontSize: `${porApenasTamanhoValor}px` }} className="font-mono font-black">
                {formatarMoeda(campanha.valorCota)}
              </span>
              {temTexto && (
                <span style={{ fontSize: `${porApenasTamanhoTexto}px` }} className="font-bold opacity-90">
                  {textoPorApenas}
                </span>
              )}
            </div>
          );
        }
        // Vertical
        return (
          <div className="flex flex-col items-center gap-0.5 justify-center">
            {temTexto && (
              <span style={{ fontSize: `${porApenasTamanhoTexto}px` }} className="font-bold opacity-90">
                {textoPorApenas}
              </span>
            )}
            <span style={{ fontSize: `${porApenasTamanhoValor}px` }} className="font-mono font-black">
              {formatarMoeda(campanha.valorCota)}
            </span>
          </div>
        );
      })();

      return (
        <div className={`w-full flex flex-col ${alignWrapperClass} py-1.5 transition-all`}>
          <div className={`w-full flex ${justifyFlexClass}`}>
            <div 
              style={{
                ...styleBotaoObj,
                fontFamily: tema.tipografia.fonteCardCotas
              }}
              className="px-5 py-2.5 shadow-md inline-flex items-center justify-center transition-all"
            >
              {content}
            </div>
          </div>
          {renderRegrasDesconto()}
        </div>
      );
    }

    // 4. Card Destaque Tradicional (moldura com fundo e borda em volta de todo o conjunto)
    const estiloCard = calcularEstiloCard({
      estilo: tema.botao?.estiloCards,
      corFundo: tema.cores.cardFundo || '#090d16',
      corBorda: porApenasBorda,
      raioBorda: porApenasRaioBorda,
      larguraBorda: porApenasTemBorda ? porApenasEspessuraBorda : 0,
      possuirBorda: porApenasTemBorda,
    });

    return (
      <div 
        className={`w-full p-4 shadow-sm transition-all ${estiloCard.className}`}
        style={{
          ...estiloCard.style,
          borderColor: porApenasTemBorda ? porApenasBorda : 'transparent',
          fontFamily: tema.tipografia.fonteCardCotas
        }}
      >
        <div className={`w-full flex ${justifyFlexClass}`}>
          {renderConteudo('valor_botao')}
        </div>
        {renderRegrasDesconto()}
      </div>
    );
  };

  // 2b. Seção Cabeçalho da Promoção (Separado, Título em cima, Subtítulo embaixo, sem texto informativo)
  const CabecalhoPromocaoSection = ({ campanha, tema }: { campanha: Campanha; tema: TemaCampanha }) => {
    const cotasCfg = tema.cotasConfig || {};
    const exibirPromo = (cotasCfg.exibirBlocoPromocao !== false) && (campanha.promocoes && campanha.promocoes.length > 0);
    
    if (!exibirPromo) return null;

    const promoTitulo = cotasCfg.promoTituloDestaque || '📢 Promoção';
    const promoSubtitulo = cotasCfg.promoSubtituloDestaque || 'Compre mais barato!';
    const promoTituloCor = cotasCfg.promoTituloCor || '#fbbf24';
    const promoSubtituloCor = cotasCfg.promoSubtituloCor || '#ffffff';
    const promoTituloTamanho = cotasCfg.promoTituloTamanho || 14;
    const promoSubtituloTamanho = cotasCfg.promoSubtituloTamanho || 12;

    const estiloCard = calcularEstiloCard({
      estilo: tema.botao?.estiloCards,
      corFundo: cotasCfg.promoBlocoFundo || '#0f172a',
      corBorda: cotasCfg.promoCorBorda || '#334155',
      larguraBorda: cotasCfg.promoLarguraBorda ?? 1,
      possuirBorda: cotasCfg.promoPossuirBorda ?? true,
      raioBorda: cotasCfg.promoRaioBorda ?? 12,
      tamanhoAlturaCards: cotasCfg.promoAltura ?? 12,
    });

    return (
      <div 
        className={`border rounded-2xl p-4 shadow-sm text-center transition-all ${estiloCard.className}`}
        style={{
          ...estiloCard.style,
          fontFamily: tema.tipografia.fonteCardCotas
        }}
      >
        <div className="flex flex-col items-center gap-1.5 justify-center">
          {/* Título da Promoção - Fica em cima */}
          <span 
            className="font-black leading-tight tracking-wide uppercase block"
            style={{ 
              color: promoTituloCor,
              fontSize: `${promoTituloTamanho}px`
            }}
          >
            {promoTitulo}
          </span>
          {/* Subtítulo da Promoção - Fica embaixo */}
          <span 
            className="font-bold leading-normal opacity-90 block"
            style={{ 
              color: promoSubtituloCor,
              fontSize: `${promoSubtituloTamanho}px`
            }}
          >
            {promoSubtitulo}
          </span>
        </div>
      </div>
    );
  };

  // 3. Seção Seletor de Cotas
  const CotasSection = ({ campanha, tema, setQuantidade, setCheckoutAberto }: { campanha: Campanha; tema: TemaCampanha; setQuantidade: any; setCheckoutAberto: any }) => {
    const cotasCardStyle = calcularEstiloCard({
      estilo: tema.botao?.estiloCards,
      corFundo: (tema.cores as any).cardCotasFundo || tema.cores.cardFundo,
      corBorda: (tema.cores as any).cardCotasBorda || tema.cores.cardBorda,
      raioBorda: tema.botao?.raioBordaCards ?? 16,
      possuirBorda: tema.botao?.possuirBordaCards,
      larguraBorda: tema.botao?.larguraBordaCards,
      tamanhoAlturaCards: tema.botao?.tamanhoAlturaCards,
      tamanhoFonteCards: tema.botao?.tamanhoFonteCards,
    });
    const corTextoCotas = (tema.cores as any).cardCotasTexto || tema.cores.texto || '#ffffff';

    const unitPrice = Number(campanha.valorCota) || 0.01;
    const listaBotoes: Array<{ quantidade: number; valor: number; destaque: boolean; descontoPct?: number; rotulo?: string }> = (campanha.promocoes && campanha.promocoes.length > 0)
      ? campanha.promocoes.map(p => {
          const q = Number(p.quantidade) || 1;
          const regularTotal = Number((q * unitPrice).toFixed(2));
          const promoVal = Number(p.valor);
          const valorFinal = (promoVal > 0 && promoVal <= regularTotal) ? promoVal : regularTotal;
          
          let pct = p.descontoPct;
          if (pct === undefined && regularTotal > 0 && valorFinal > 0 && valorFinal < regularTotal) {
            pct = Math.round((1 - (valorFinal / regularTotal)) * 100);
          }

          return {
            quantidade: q,
            valor: valorFinal,
            destaque: !!p.destaque,
            descontoPct: pct && pct > 0 ? pct : undefined,
            rotulo: p.rotulo || (p.destaque ? 'Mais popular' : undefined)
          };
        })
      : [
          { quantidade: 10, valor: Number((10 * unitPrice).toFixed(2)), destaque: false },
          { quantidade: 25, valor: Number((25 * unitPrice).toFixed(2)), destaque: false },
          { quantidade: 50, valor: Number((50 * unitPrice).toFixed(2)), destaque: true, rotulo: 'Mais popular' },
          { quantidade: 100, valor: Number((100 * unitPrice).toFixed(2)), destaque: false },
          { quantidade: 250, valor: Number((250 * unitPrice).toFixed(2)), destaque: false },
          { quantidade: 500, valor: Number((500 * unitPrice).toFixed(2)), destaque: false }
        ];

    // Melhor promoção para exibir no destaque
    const melhorPromo = listaBotoes.slice().sort((a, b) => (b.descontoPct || 0) - (a.descontoPct || 0))[0];

    const cotasCfg = tema.cotasConfig || {};
    const textoPorApenas = cotasCfg.textoPorApenas || 'Por apenas';
    const porApenasFundo = cotasCfg.porApenasFundo || 'rgba(16, 185, 129, 0.15)';
    const porApenasTexto = cotasCfg.porApenasTexto || tema.cores.primaria || '#10b981';
    const porApenasBorda = cotasCfg.porApenasBorda || 'rgba(16, 185, 129, 0.3)';

    const exibirPromo = (cotasCfg.exibirBlocoPromocao !== false) && (campanha.promocoes && campanha.promocoes.length > 0);
    const promoTitulo = cotasCfg.promoTituloDestaque || '📢 Promoção';
    const promoSubtitulo = cotasCfg.promoSubtituloDestaque || 'Compre mais barato!';
    const promoTexto = cotasCfg.promoTextoInformativo || 'Quanto mais títulos, mais chances de ganhar!';
    const promoTituloCor = cotasCfg.promoTituloCor || '#fbbf24';
    const promoSubtituloCor = cotasCfg.promoSubtituloCor || '#ffffff';
    const promoTextoCor = cotasCfg.promoTextoCor || '#94a3b8';

    const colMobile = Number(tema.botao?.colunasPacotesMobile) || 2;
    const colDesktop = Number(tema.botao?.colunasPacotesDesktop) || 4;

    const colMobileClass = 
      colMobile === 1 ? 'grid-cols-1' :
      colMobile === 3 ? 'grid-cols-3' :
      colMobile === 4 ? 'grid-cols-4' : 'grid-cols-2';

    const colDesktopClass = 
      colDesktop === 1 ? 'sm:grid-cols-1' :
      colDesktop === 2 ? 'sm:grid-cols-2' :
      colDesktop === 3 ? 'sm:grid-cols-3' :
      colDesktop === 6 ? 'sm:grid-cols-6' : 'sm:grid-cols-4';

    return (
      <div 
        className={`border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 ${cotasCardStyle.className}`}
        style={{
          ...cotasCardStyle.style,
          color: corTextoCotas,
          fontFamily: tema.tipografia.fonteCardCotas
        }}
      >
        {/* 
        {(tema.botao.tituloCotas || tema.botao.subtituloCotas || campanha.tituloSelecaoCotas) && (
          <div className="pb-1 border-b border-slate-800/60 text-center sm:text-left space-y-0.5 mb-2">
            {(tema.botao.tituloCotas || campanha.tituloSelecaoCotas) && (
              <h3 className="font-black uppercase tracking-wider text-slate-300" style={{ fontFamily: tema.tipografia.fonteCotasTitulo || 'Inter', fontSize: '0.85rem', color: tema.cores.titulos || '#ffffff' }}>
                {tema.botao.tituloCotas || campanha.tituloSelecaoCotas}
              </h3>
            )}
            {tema.botao.subtituloCotas && (
              <p className="text-[10px] opacity-70 mt-0.5" style={{ fontFamily: tema.tipografia.fonteCotasSubtitulo || 'Inter', color: tema.cores.descricoes || '#94a3b8' }}>
                {tema.botao.subtituloCotas}
              </p>
            )}
          </div>
        )}
        */}

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
              style={{ backgroundColor: 'var(--btn)', color: 'var(--btn-txt)', borderRadius: `${tema.botao.raioBorda}px` }}
              className={`w-full py-3.5 font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition hover:opacity-90 active:scale-[0.98] ${getBtnRoundingClass(tema.botao.formato)}`}
            >
              <Gift className="w-4 h-4" />
              <span>🎁 GARANTIR MINHA COTA GRÁTIS AGORA</span>
            </button>
          </div>
        ) : (
          <>
            {/* Títulos e Subtítulos - Pacotes */}
            {(() => {
              const tituloP = tema.botao?.tituloPacotes === undefined ? '⚡ Pacotes Promocionais' : tema.botao.tituloPacotes;
              const subtituloP = tema.botao?.subtituloPacotes === undefined ? 'Compre em pacotes e garanta super descontos!' : tema.botao.subtituloPacotes;
              const temTitulo = Boolean(tituloP && tituloP.trim());
              const temSubtitulo = Boolean(subtituloP && subtituloP.trim());
              if (!temTitulo && !temSubtitulo) return null;
              
              const alinTitP = tema.tipografia?.alinhamentoPacotesTitulo || tema.tipografia?.alinhamentoPacotes || 'esquerda';
              const alinSubP = tema.tipografia?.alinhamentoPacotesSubtitulo || tema.tipografia?.alinhamentoPacotes || 'esquerda';

              const alignTitClass = alinTitP === 'centro' ? 'text-center' : alinTitP === 'direita' ? 'text-right' : 'text-left';
              const alignSubClass = alinSubP === 'centro' ? 'text-center' : alinSubP === 'direita' ? 'text-right' : 'text-left';

              return (
                <div className="space-y-0.5 pb-2">
                  {temTitulo && (
                    <h3 
                      className={`font-black ${alignTitClass}`}
                      style={{ 
                        fontFamily: tema.tipografia?.fontePacotesTitulo || 'Inter', 
                        fontSize: `${tema.tipografia?.tamanhoPacotesTitulo ?? 16}px`, 
                        color: tema.cores?.titulos || '#ffffff' 
                      }}
                    >
                      {tituloP}
                    </h3>
                  )}
                  {temSubtitulo && (
                    <p 
                      className={`opacity-70 ${alignSubClass}`}
                      style={{ 
                        fontFamily: tema.tipografia?.fontePacotesSubtitulo || 'Inter', 
                        fontSize: `${tema.tipografia?.tamanhoPacotesSubtitulo ?? 12}px`, 
                        color: tema.cores?.descricoes || '#94a3b8' 
                      }}
                    >
                      {subtituloP}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Botões de Pacotes de Cotas */}
            <div className={`grid ${colMobileClass} ${colDesktopClass} gap-2.5`}>
              {listaBotoes.map((item, idx: number) => {
                const isSelected = quantidade === item.quantidade;
                const rotuloTexto = item.rotulo || (item.destaque ? 'Mais popular' : undefined);
                const isDestaque = item.destaque || !!item.rotulo;
                const corFundoPacote = isDestaque ? (tema.cores.botaoDestaqueFundo || tema.cores.primaria) : tema.cores.botaoCotasFundo;
                const corTextoPacote = isDestaque ? (tema.cores.botaoDestaqueTexto || '#022c22') : tema.cores.botaoCotasTexto;
                const corNumeroPacote = isDestaque ? (tema.cores.botaoDestaqueTexto || '#022c22') : tema.cores.botaoCotasNumero;
                const corSeloPopularFundo = tema.cores.seloPopularFundo || '#f59e0b';
                const corSeloPopularTexto = tema.cores.seloPopularTexto || '#022c22';

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuantidade(item.quantidade);
                    }}
                    style={calcularEstiloBotao({
                      estilo: tema.botao?.estiloPacotes || 'solido',
                      corFundo: corFundoPacote,
                      corTexto: corTextoPacote,
                      corBorda: isSelected ? (tema.cores.primaria || '#10b981') : (tema.botao?.corBordaPacotes || tema.cores.botaoCotasBorda || tema.cores.cardBorda),
                      larguraBorda: isSelected ? Math.max(2, (tema.botao?.larguraBordaPacotes || 1)) : tema.botao?.larguraBordaPacotes,
                      possuirBorda: isSelected ? true : tema.botao?.possuirBordaPacotes,
                      raioBorda: tema.botao?.raioBordaPacotes ?? 12,
                      tamanhoAltura: tema.botao?.tamanhoAlturaPacotes ?? 12,
                      sombraAltura: tema.botao?.sombraAlturaPacotes ?? 3,
                      corSombra: tema.botao?.corSombraPacotes,
                    }).style}
                    className={`${
                      calcularEstiloBotao({
                        estilo: tema.botao?.estiloPacotes || 'solido',
                        corFundo: corFundoPacote,
                        corTexto: corTextoPacote,
                        raioBorda: tema.botao?.raioBordaPacotes ?? 12,
                      }).className
                    } relative py-3 px-2 border text-center transition flex flex-col items-center justify-center gap-1 group active:scale-95 cursor-pointer min-h-[70px] shadow-sm ${isSelected ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-950 scale-[1.02]' : ''}`}
                  >
                    {rotuloTexto && (
                      <span 
                        style={{
                          backgroundColor: corSeloPopularFundo,
                          color: corSeloPopularTexto,
                        }}
                        className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 font-black text-[8px] uppercase tracking-wider rounded-full shadow-md whitespace-nowrap z-10"
                      >
                        {rotuloTexto}
                      </span>
                    )}
                    <span className="block text-base font-black group-hover:opacity-80 transition-opacity leading-tight" style={{ color: corNumeroPacote }}>
                      +{item.quantidade}
                    </span>
                    <div className="flex items-center gap-1 flex-wrap justify-center">
                      <span
                        className="block text-xs font-black font-mono"
                        style={{ color: corTextoPacote }}
                      >
                        {formatarMoeda(item.valor)}
                      </span>
                      {item.descontoPct !== undefined && (
                        <span className="px-1 py-0.2 bg-emerald-500 text-slate-950 font-black text-[9px] rounded leading-none">
                          -{item.descontoPct}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Títulos e Subtítulos - Controles */}
            {(() => {
              const tituloC = tema.botao?.tituloControles === undefined ? 'Selecione a quantidade manualmente' : tema.botao.tituloControles;
              const subtituloC = tema.botao?.subtituloControles === undefined ? 'Use os botões + e - ou digite o valor' : tema.botao.subtituloControles;
              const temTitulo = Boolean(tituloC && tituloC.trim());
              const temSubtitulo = Boolean(subtituloC && subtituloC.trim());
              if (!temTitulo && !temSubtitulo) return null;
              
              const alinTitC = tema.tipografia?.alinhamentoControlesTitulo || tema.tipografia?.alinhamentoControles || 'esquerda';
              const alinSubC = tema.tipografia?.alinhamentoControlesSubtitulo || tema.tipografia?.alinhamentoControles || 'esquerda';

              const alignTitClass = alinTitC === 'centro' ? 'text-center' : alinTitC === 'direita' ? 'text-right' : 'text-left';
              const alignSubClass = alinSubC === 'centro' ? 'text-center' : alinSubC === 'direita' ? 'text-right' : 'text-left';

              return (
                <div className="space-y-0.5 pt-4 pb-1">
                  {temTitulo && (
                    <h3 
                      className={`font-black ${alignTitClass}`}
                      style={{ 
                        fontFamily: tema.tipografia?.fonteControlesTitulo || 'Inter', 
                        fontSize: `${tema.tipografia?.tamanhoControlesTitulo ?? 16}px`, 
                        color: tema.cores?.titulos || '#ffffff' 
                      }}
                    >
                      {tituloC}
                    </h3>
                  )}
                  {temSubtitulo && (
                    <p 
                      className={`opacity-70 ${alignSubClass}`}
                      style={{ 
                        fontFamily: tema.tipografia?.fonteControlesSubtitulo || 'Inter', 
                        fontSize: `${tema.tipografia?.tamanhoControlesSubtitulo ?? 12}px`, 
                        color: tema.cores?.descricoes || '#94a3b8' 
                      }}
                    >
                      {subtituloC}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Seletor Manual (+1 / -1 e Input Direto) */}
            {(() => {
              const cardControlesStyle = calcularEstiloCard({
                estilo: tema.botao?.estiloCards,
                corFundo: tema.cores.cardFundo,
                corBorda: tema.cores.cardBorda,
                raioBorda: tema.botao?.raioBordaCards ?? 16,
              });

              const btnCtrlStyle = calcularEstiloBotao({
                estilo: tema.botao?.estiloControles || 'solido',
                corFundo: tema.cores.controlesFundo,
                corTexto: tema.cores.controlesTexto,
                corBorda: tema.botao?.corBordaControles,
                larguraBorda: tema.botao?.larguraBordaControles,
                possuirBorda: tema.botao?.possuirBordaControles,
                raioBorda: tema.botao?.raioBordaControles ?? 12,
                tamanhoAltura: tema.botao?.tamanhoControles ? Math.floor(tema.botao.tamanhoControles / 4) : 10,
                sombraAltura: tema.botao?.sombraAlturaControles ?? 3,
                corSombra: tema.botao?.corSombraControles,
              });

              return (
                <div 
                  className={`p-3 border rounded-xl ${cardControlesStyle.className}`} 
                  style={cardControlesStyle.style}
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* Botão Decrementar -1 */}
                    <button
                      type="button"
                      onClick={() => setQuantidade((q: number) => Math.max(campanha.minPorCompra || 1, (Number(q) || 1) - 1))}
                      className={`active:scale-95 flex items-center justify-center font-black transition shrink-0 cursor-pointer ${btnCtrlStyle.className}`}
                      style={{ ...btnCtrlStyle.style, width: tema.botao?.tamanhoControles ?? 44, height: tema.botao?.tamanhoControles ?? 44 }}
                      aria-label="Diminuir 1 cota"
                      title="Diminuir 1 cota"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    {/* Input Central com Digitação e Edição Livre */}
                    <div className="flex-1 flex items-center justify-center gap-2">
                      <input
                        type="number"
                        min={campanha.minPorCompra || 1}
                        max={campanha.maxPorCompra || 500000}
                        value={quantidade === 0 ? '' : quantidade}
                        onChange={e => {
                          const valStr = e.target.value;
                          if (valStr === '') {
                            setQuantidade(0);
                            return;
                          }
                          const val = parseInt(valStr, 10);
                          if (!isNaN(val)) {
                            const max = campanha.maxPorCompra || 500000;
                            if (val > max) {
                              setQuantidade(max);
                            } else {
                              setQuantidade(val);
                            }
                          }
                        }}
                        onBlur={() => {
                          const min = campanha.minPorCompra || 1;
                          if (!quantidade || quantidade < min) {
                            setQuantidade(min);
                          }
                        }}
                        className="w-28 bg-transparent border border-slate-700 rounded-xl py-1.5 px-2 text-center text-xl font-black focus:outline-none font-mono shadow-inner"
                        style={{ color: tema.cores.texto, borderColor: tema.cores.cardBorda }}
                      />
                      <span className="text-sm font-bold opacity-70">cotas</span>
                    </div>

                    {/* Botão Incrementar +1 */}
                    <button
                      type="button"
                      onClick={() => setQuantidade((q: number) => Math.min(campanha.maxPorCompra || 500000, (Number(q) || 0) + 1))}
                      style={{ ...btnCtrlStyle.style, width: tema.botao?.tamanhoControles ?? 44, height: tema.botao?.tamanhoControles ?? 44 }}
                      className={`flex items-center justify-center font-black transition active:scale-95 shrink-0 hover:opacity-90 ${btnCtrlStyle.className}`}
                      aria-label="Aumentar 1 cota"
                      title="Aumentar 1 cota"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>
    );
  };

  // 4. Seção Prêmios Oficiais
  const PremiosSection = ({ campanha, tema }: { campanha: Campanha; tema: TemaCampanha }) => {
    if (campanha.exibirPremios === false || !campanha.premios || campanha.premios.length === 0) return null;
    const SectionIcon = getSectionIcon(tema.secaoIcones?.premios || 'Trophy');
    const iconeCor = (tema.cores as any)?.iconePremios || tema.cores?.iconeCor || '#10b981';
    const cardStyle = calcularEstiloCard({
      estilo: tema.botao?.estiloCards,
      corFundo: (tema.cores as any).cardPremiosFundo || tema.cores.cardFundo,
      corBorda: (tema.cores as any).cardPremiosBorda || tema.cores.cardBorda,
      raioBorda: tema.botao?.raioBordaCards ?? 16,
      tamanhoAlturaCards: tema.botao?.tamanhoAlturaCards,
      tamanhoFonteCards: tema.botao?.tamanhoFonteCards,
    });

    const alinPrem = tema.tipografia?.alinhamentoPremiosTitulo || tema.tipografia?.alinhamentoPremios || 'esquerda';
    const alignClassPremios = alinPrem === 'centro' ? 'justify-center text-center' :
                              alinPrem === 'direita' ? 'justify-end text-right' :
                              'justify-start text-left';

    return (
      <div className={`border rounded-2xl p-5 shadow-sm ${cardStyle.className}`} style={{ ...cardStyle.style, fontFamily: tema.tipografia.fonteCardPremios }}>
        <h3 
          className={`font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 opacity-80 ${alignClassPremios}`}
          style={{ fontSize: `${tema.tipografia.tamanhoPremiosTitulo ?? 12}px`, color: tema.cores.titulos || '#ffffff' }}
        >
          <SectionIcon className="w-4 h-4 shrink-0" style={{ color: iconeCor }} />
          <span>Premiação</span>
        </h3>
        <div className="space-y-2.5">
          {campanha.premios.map((premio, idx) => {
            const numPosicao = premio.posicao || (idx + 1);
            const posicaoText = `${numPosicao}º`;
            
            // Custom item colors or theme fallback
            const bg = premio.corFundo || (tema.cores as any).premioFundo || tema.cores.controlesFundo || 'rgba(15, 23, 42, 0.7)';
            const textCor = premio.corTexto || (tema.cores as any).premioTexto || tema.cores.texto || '#ffffff';
            const badgeBg = premio.corBadgeFundo || (tema.cores as any).premioBadgeFundo || tema.cores.primaria || '#10b981';
            const badgeTexto = premio.corBadgeTexto || (tema.cores as any).premioBadgeTexto || '#022c22';
            const bordaCor = premio.corBorda || (tema.cores as any).premioBorda || 'rgba(51, 65, 85, 0.6)';

            return (
              <div
                key={idx}
                className="flex items-center gap-3 p-3.5 rounded-xl border shadow-sm transition-all"
                style={{
                  backgroundColor: bg,
                  borderColor: bordaCor,
                  color: textCor
                }}
              >
                <div 
                  className="px-2.5 py-1 min-w-[38px] rounded-lg border font-black text-xs shrink-0 flex items-center justify-center shadow-sm uppercase tracking-wider"
                  style={{ 
                    backgroundColor: badgeBg, 
                    borderColor: `${badgeBg}99`, 
                    color: badgeTexto 
                  }}
                >
                  {posicaoText}
                </div>
                <span className="text-sm font-bold flex-1 leading-snug">
                  {premio.descricao}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 5. Seção Cotas Premiadas (Instantâneas)
  const CotasPremiadasSection = ({ campanha, tema }: { campanha: Campanha; tema: TemaCampanha }) => {
    if (campanha.exibirCotasPremiadas === false || !campanha.cotasPremiadas || campanha.cotasPremiadas.length === 0) return null;
    const SectionIcon = getSectionIcon(tema.secaoIcones?.cotasPremiadas || 'Gift');
    const iconeCor = (tema.cores as any)?.iconeCotasPremiadas || tema.cores?.iconeCor || '#10b981';
    const cardStyle = calcularEstiloCard({
      estilo: tema.botao?.estiloCards,
      corFundo: (tema.cores as any).cardCotasPremiadasFundo || tema.cores.cardFundo,
      corBorda: (tema.cores as any).cardCotasPremiadasBorda || tema.cores.cardBorda,
      raioBorda: tema.botao?.raioBordaCards ?? 16,
      tamanhoAlturaCards: tema.botao?.tamanhoAlturaCards,
      tamanhoFonteCards: tema.botao?.tamanhoFonteCards,
    });

    const alinPremiadoTit = tema.tipografia?.alinhamentoPremiadoTitulo || tema.tipografia?.alinhamentoPremiado || 'esquerda';
    const alinPremiadoSub = tema.tipografia?.alinhamentoPremiadoSubtitulo || tema.tipografia?.alinhamentoPremiado || 'esquerda';
    const alignPremiadoTitClass = alinPremiadoTit === 'centro' ? 'justify-center text-center' : alinPremiadoTit === 'direita' ? 'justify-end text-right' : 'justify-start text-left';
    const alignPremiadoSubClass = alinPremiadoSub === 'centro' ? 'text-center' : alinPremiadoSub === 'direita' ? 'text-right' : 'text-left';

    return (
      <div className={`border rounded-2xl p-5 shadow-sm ${cardStyle.className}`} style={{ ...cardStyle.style }}>
        <div className="mb-3 space-y-1">
          <h3 
            className={`font-bold uppercase tracking-wider flex items-center gap-1.5 opacity-80 ${alignPremiadoTitClass}`} 
            style={{ 
              fontFamily: tema.tipografia.fonteCardCotasPremiadas || 'Inter',
              fontSize: `${tema.tipografia.tamanhoPremiadoTitulo ?? 12}px`,
              color: tema.cores.titulos || '#ffffff'
            }}
          >
            <SectionIcon className="w-4 h-4 shrink-0" style={{ color: iconeCor }} />
            <span>{tema.botao.tituloPremiado || 'Cotas Premiadas (Ganhe no Pix na Hora)'}</span>
          </h3>
          {tema.botao.subtituloPremiado && (
            <p 
              className={`opacity-70 ${alignPremiadoSubClass}`} 
              style={{ 
                fontFamily: tema.tipografia.fonteCardCotasPremiadasSubtitulo || 'Inter',
                fontSize: `${tema.tipografia.tamanhoPremiadoSubtitulo ?? 10}px`,
                color: tema.cores.descricoes || '#94a3b8'
              }}
            >
              {tema.botao.subtituloPremiado}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {campanha.cotasPremiadas.map((cp, idx) => {
            const isEncontrada = cp.status === 'encontrada';
            const bg = isEncontrada
              ? ((tema.cores as any).premiadoGanhoFundo || (tema.cores as any).cotaPremiadaAchadaFundo || '#1e1b4b')
              : ((tema.cores as any).premiadoDisponivelFundo || (tema.cores as any).cotaPremiadaLivreFundo || '#0f172a');
            const border = isEncontrada
              ? ((tema.cores as any).premiadoGanhoBorda || (tema.cores as any).cotaPremiadaAchadaBorda || '#334155')
              : ((tema.cores as any).premiadoDisponivelBorda || (tema.cores as any).cotaPremiadaLivreBorda || '#1e293b');
            const textNum = isEncontrada
              ? ((tema.cores as any).premiadoGanhoTexto || (tema.cores as any).cotaPremiadaAchadaTexto || '#94a3b8')
              : ((tema.cores as any).premiadoDisponivelTexto || (tema.cores as any).cotaPremiadaLivreTexto || '#ffffff');
            const badgeBg = isEncontrada
              ? ((tema.cores as any).premiadoGanhoBadgeFundo || '#f59e0b')
              : ((tema.cores as any).premiadoDisponivelBadgeFundo || '#10b981');
            const badgeText = isEncontrada
              ? ((tema.cores as any).premiadoGanhoBadgeTexto || '#022c22')
              : ((tema.cores as any).premiadoDisponivelBadgeTexto || '#022c22');

            const raioBordaFinal = tema.botao?.raioBordaPremiado !== undefined ? `${tema.botao.raioBordaPremiado}px` : '12px';
            const paddingV = tema.botao?.tamanhoAlturaPremiado !== undefined ? `${tema.botao.tamanhoAlturaPremiado}px` : '12px';
            const paddingH = tema.botao?.tamanhoAlturaPremiado !== undefined ? `${Math.floor(tema.botao.tamanhoAlturaPremiado * 1.25)}px` : '16px';
            const numFontSize = tema.botao?.tamanhoTextoPremiado !== undefined ? `${tema.botao.tamanhoTextoPremiado}px` : '14px';
            const textFontSize = tema.botao?.tamanhoTextoPremiado !== undefined ? `${Math.max(10, tema.botao.tamanhoTextoPremiado - 3)}px` : '11px';

            return (
              <div
                key={idx}
                className={`border transition-all ${isEncontrada ? 'opacity-75' : ''}`}
                style={{ 
                  backgroundColor: bg, 
                  borderColor: border,
                  borderRadius: raioBordaFinal,
                  paddingTop: paddingV,
                  paddingBottom: paddingV,
                  paddingLeft: paddingH,
                  paddingRight: paddingH,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="font-mono font-black"
                    style={{ color: textNum, fontSize: numFontSize }}
                  >
                    {cp.numero}
                  </span>
                  <span 
                    className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                    style={{ 
                      backgroundColor: badgeBg,
                      color: badgeText
                    }}
                  >
                    {isEncontrada ? 'Ganha' : 'Disponível'}
                  </span>
                </div>
                <span className="block font-medium truncate opacity-80" style={{ color: textNum, fontSize: textFontSize }}>
                  {cp.premio}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 6. Seção Top Compradores / Ranking
  const RankingSection = ({ ranking, tema }: { ranking: RankingItem[]; tema: TemaCampanha }) => {
    if (!ranking || ranking.length === 0) return null;
    const SectionIcon = getSectionIcon(tema.secaoIcones?.topCompradores || 'Users');
    const iconeCor = (tema.cores as any)?.iconeTopCompradores || tema.cores?.iconeCor || '#10b981';
    const cardStyle = calcularEstiloCard({
      estilo: tema.botao?.estiloCards,
      corFundo: (tema.cores as any).cardRankingFundo || tema.cores.cardFundo,
      corBorda: (tema.cores as any).cardRankingBorda || tema.cores.cardBorda,
      raioBorda: tema.botao?.raioBordaCards ?? 16,
      tamanhoAlturaCards: tema.botao?.tamanhoAlturaCards,
      tamanhoFonteCards: tema.botao?.tamanhoFonteCards,
    });

    const alinRank = tema.tipografia?.alinhamentoRankingTitulo || tema.tipografia?.alinhamentoRanking || 'esquerda';
    const alignClassRanking = alinRank === 'centro' ? 'justify-center text-center' :
                              alinRank === 'direita' ? 'justify-end text-right' :
                              'justify-start text-left';

    return (
      <div className={`border rounded-2xl p-5 shadow-sm ${cardStyle.className}`} style={{ ...cardStyle.style, fontFamily: tema.tipografia.fonteCardRanking }}>
        <h3 
          className={`font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 opacity-80 ${alignClassRanking}`}
          style={{ fontSize: `${tema.tipografia.tamanhoRankingTitulo ?? 12}px`, color: tema.cores.titulos || '#ffffff' }}
        >
          <SectionIcon className="w-4 h-4 shrink-0" style={{ color: iconeCor }} />
          <span>Top Compradores</span>
        </h3>
        <div className="space-y-2">
          {ranking.map((item) => {
            const is1st = item.posicao === 1;
            const itemBg = (tema.cores as any).rankingItemFundo || tema.cores.controlesFundo;
            const badgeBg = is1st
              ? ((tema.cores as any).ranking1Fundo || '#fbbf24')
              : ((tema.cores as any).rankingOutroFundo || '#334155');
            const badgeText = is1st
              ? ((tema.cores as any).ranking1Texto || '#020617')
              : ((tema.cores as any).rankingOutroTexto || '#cbd5e1');
            const qtyTextCol = (tema.cores as any).rankingQtdCotasTexto || tema.cores.primaria;

            return (
              <div
                key={item.posicao}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-700/40 text-xs"
                style={{ backgroundColor: itemBg }}
              >
                <div className="flex items-center gap-2.5">
                  <span 
                    className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]"
                    style={{ backgroundColor: badgeBg, color: badgeText }}
                  >
                    {item.posicao}
                  </span>
                  <span className="font-semibold truncate max-w-[150px]" style={{ color: tema.cores.texto }}>
                    {item.nome}
                  </span>
                </div>
                <span
                  className="font-extrabold font-mono"
                  style={{ color: qtyTextCol }}
                >
                  {item.quantidadeCotas} cotas
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 7. Seção Regulamento & Informações (Acordeão Expansível)
  const RegulamentoSection = ({ campanha, tema }: { campanha: Campanha; tema: TemaCampanha }) => {
    const [descAberta, setDescAberta] = useState(false);
    const [regAberto, setRegAberto] = useState(false);

    const temDesc = Boolean(campanha.descricao && campanha.descricao.trim());
    const regTexto = (campanha as any).regulamento || (campanha as any).regras;
    const temReg = Boolean(regTexto && regTexto.trim() && regTexto !== campanha.descricao);

    const SectionIconDesc = getSectionIcon(tema.secaoIcones?.descricao || 'Info');
    const SectionIconReg = getSectionIcon(tema.secaoIcones?.regulamento || 'FileText');
    const iconeCorReg = (tema.cores as any)?.iconeRegulamento || tema.cores?.iconeCor || '#10b981';

    const cardStyle = calcularEstiloCard({
      estilo: tema.botao?.estiloCards,
      corFundo: (tema.cores as any).cardRegulamentoFundo || tema.cores.cardFundo,
      corBorda: (tema.cores as any).cardRegulamentoBorda || tema.cores.cardBorda,
      raioBorda: tema.botao?.raioBordaCards ?? 16,
      tamanhoAlturaCards: tema.botao?.tamanhoAlturaCards,
      tamanhoFonteCards: tema.botao?.tamanhoFonteCards,
    });
    const regTextoCor = (tema.cores as any).cardRegulamentoTexto || tema.cores.descricoes || '#cbd5e1';

    const alinReg = tema.tipografia?.alinhamentoRegulamentoTitulo || tema.tipografia?.alinhamentoRegulamento || 'esquerda';
    const alignClassReg = alinReg === 'centro' ? 'justify-center text-center' :
                          alinReg === 'direita' ? 'justify-end text-right' :
                          'justify-start text-left';

    if (!temDesc && !temReg) return null;

    return (
      <div className="space-y-3">
        {temDesc && (
          <div className={`border rounded-2xl p-4 sm:p-5 shadow-sm transition-all ${cardStyle.className}`} style={{ ...cardStyle.style, fontFamily: tema.tipografia.fonteCardRegulamento }}>
            <button
              type="button"
              onClick={() => setDescAberta(!descAberta)}
              aria-expanded={descAberta}
              className={`w-full flex items-center justify-between focus:outline-none group cursor-pointer ${alignClassReg}`}
            >
              <span 
                className="font-bold uppercase tracking-wider flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity"
                style={{ fontSize: `${tema.tipografia.tamanhoRegulamentoTitulo ?? 12}px`, color: tema.cores.titulos || '#ffffff' }}
              >
                <SectionIconDesc className="w-4 h-4 shrink-0" style={{ color: iconeCorReg }} />
                <span>{temReg ? 'Descrição da Campanha' : 'Descrição & Regulamento'}</span>
              </span>
              <div className="p-1 rounded-lg bg-slate-800/40 text-slate-400 group-hover:text-white transition shrink-0 ml-2">
                {descAberta ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {descAberta && (
              <div
                className="mt-3 pt-3 border-t border-slate-800/80 text-xs leading-relaxed space-y-2 animate-in fade-in duration-200"
                style={{ color: regTextoCor }}
                dangerouslySetInnerHTML={{ __html: campanha.descricao }}
              />
            )}
          </div>
        )}

        {temReg && (
          <div className={`border rounded-2xl p-4 sm:p-5 shadow-sm transition-all ${cardStyle.className}`} style={{ ...cardStyle.style, fontFamily: tema.tipografia.fonteCardRegulamento }}>
            <button
              type="button"
              onClick={() => setRegAberto(!regAberto)}
              aria-expanded={regAberto}
              className={`w-full flex items-center justify-between focus:outline-none group cursor-pointer ${alignClassReg}`}
            >
              <span 
                className="font-bold uppercase tracking-wider flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity"
                style={{ fontSize: `${tema.tipografia.tamanhoRegulamentoTitulo ?? 12}px`, color: tema.cores.titulos || '#ffffff' }}
              >
                <SectionIconReg className="w-4 h-4 shrink-0" style={{ color: iconeCorReg }} />
                <span>Regulamento & Regras</span>
              </span>
              <div className="p-1 rounded-lg bg-slate-800/40 text-slate-400 group-hover:text-white transition shrink-0 ml-2">
                {regAberto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {regAberto && (
              <div
                className="mt-3 pt-3 border-t border-slate-800/80 text-xs leading-relaxed space-y-2 animate-in fade-in duration-200"
                style={{ color: regTextoCor }}
                dangerouslySetInnerHTML={{ __html: regTexto }}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  // 8. Seção Ganhadores da Campanha
  const GanhadoresSection = ({ campanha, tema }: { campanha: Campanha; tema: TemaCampanha }) => {
    if (campanha.exibirPaginaGanhadores === false || !campanha.ganhador) return null;
    const SectionIcon = getSectionIcon(tema.secaoIcones?.ganhadores || 'Trophy');
    const iconeCor = (tema.cores as any)?.iconeGanhadores || tema.cores?.iconeCor || '#f59e0b';
    const cardStyle = calcularEstiloCard({
      estilo: tema.botao?.estiloCards,
      corFundo: (tema.cores as any).cardGanhadoresFundo || tema.cores.cardFundo,
      corBorda: (tema.cores as any).cardGanhadoresBorda || tema.cores.cardBorda,
      raioBorda: tema.botao?.raioBordaCards ?? 16,
      tamanhoAlturaCards: tema.botao?.tamanhoAlturaCards,
      tamanhoFonteCards: tema.botao?.tamanhoFonteCards,
    });

    const alinGanh = tema.tipografia?.alinhamentoGanhadoresTitulo || tema.tipografia?.alinhamentoGanhadores || 'esquerda';
    const alignClassGanhadores = alinGanh === 'centro' ? 'justify-center text-center' :
                                 alinGanh === 'direita' ? 'justify-end text-right' :
                                 'justify-start text-left';

    return (
      <div className={`border rounded-2xl p-5 shadow-sm space-y-3 ${cardStyle.className}`} style={{ ...cardStyle.style, fontFamily: tema.tipografia.fonteCardGanhadores }}>
        <h3 
          className={`font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 ${alignClassGanhadores}`}
          style={{ fontSize: `${tema.tipografia.tamanhoGanhadoresTitulo ?? 12}px`, color: tema.cores.titulos || '#ffffff' }}
        >
          <SectionIcon className="w-4 h-4 shrink-0" style={{ color: iconeCor }} />
          <span>Ganhadores da Campanha</span>
        </h3>

        {campanha.ganhador ? (
          <div 
            className="p-4 rounded-xl flex items-center gap-3 border"
            style={{
              backgroundColor: (tema.cores as any).ganhadorBlocoFundo || 'rgba(16, 185, 129, 0.1)',
              borderColor: (tema.cores as any).ganhadorBlocoBorda || 'rgba(16, 185, 129, 0.3)',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shadow"
              style={{ 
                backgroundColor: (tema.cores as any).ganhadorTrofeuFundo || tema.cores.primaria, 
                color: '#ffffff' 
              }}
            >
              🏆
            </div>
            <div>
              <h4 className="text-sm font-extrabold" style={{ color: tema.cores.texto }}>
                {campanha.ganhador.nome}
              </h4>
              <p
                className="text-xs font-mono font-bold"
                style={{ color: (tema.cores as any).ganhadorCotaTexto || tema.cores.primaria }}
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

    const posicaoPreco = tema.cotasConfig?.posicaoExibicao || 'proximo_cotas';

    switch (secaoId) {
      case 'banner':
        return (
          <div className="space-y-4">
            <BannerSection campanha={campanha} tema={tema} />
            {posicaoPreco === 'abaixo_banner' && (
              <PrecoUnitarioSection campanha={campanha} tema={tema} />
            )}
          </div>
        );
      case 'barraProgresso':
      case 'progresso':
        return (
          <div className="space-y-4">
            {posicaoPreco === 'proximo_cotas' && (
              <PrecoUnitarioSection campanha={campanha} tema={tema} />
            )}
            <CabecalhoPromocaoSection campanha={campanha} tema={tema} />
            <ProgressoSection campanha={campanha} estatisticas={estatisticas} tema={tema} />
          </div>
        );
      case 'cotas':
        return (
          <div className="space-y-4">
            {posicaoPreco === 'proximo_cotas' && (tema.layout.visivel.barraProgresso === false || !tema.layout.ordem.includes('barraProgresso')) && (
              <PrecoUnitarioSection campanha={campanha} tema={tema} />
            )}
            <CotasSection campanha={campanha} tema={tema} setQuantidade={setQuantidade} setCheckoutAberto={setCheckoutAberto} />
          </div>
        );
      case 'premios':
        return <PremiosSection campanha={campanha} tema={tema} />;
      case 'premiadas':
      case 'cotasPremiadas':
        return <CotasPremiadasSection campanha={campanha} tema={tema} />;
      case 'ranking':
        return <RankingSection ranking={ranking} tema={tema} />;
      case 'regulamento':
      case 'descricao':
        return <RegulamentoSection campanha={campanha} tema={tema} />;
      case 'ganhadores':
        return <GanhadoresSection campanha={campanha} tema={tema} />;
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

  // Layout do checkout (padrao | limpo | passos | rapido): controla foco/densidade da página.
  // A ordem/visibilidade dos blocos no Tema é preservada; o layout apenas curadoria em cima dela.
  const layoutCheckout = (campanha.checkout?.layout as string) || 'padrao';
  const ordemPorLayout = (() => {
    if (layoutCheckout === 'rapido') {
      // Compra rápida: apenas o essencial para converter (produto + seleção de cotas).
      const permitido = ['banner', 'barraProgresso', 'progresso', 'cotas'];
      return ordemEfetiva.filter((s) => permitido.includes(s));
    }
    if (layoutCheckout === 'limpo') {
      // Limpo: remove blocos sociais/secundários para reduzir distrações no fluxo de compra.
      const ocultar = ['ranking', 'ganhadores', 'premiadas', 'cotasPremiadas'];
      return ordemEfetiva.filter((s) => !ocultar.includes(s));
    }
    if (layoutCheckout === 'passos') {
      // Passos: reordena em um fluxo guiado (produto → cotas → prêmios/regras → prova social).
      const guia = ['banner', 'barraProgresso', 'progresso', 'cotas', 'premios', 'premiadas', 'cotasPremiadas', 'regulamento', 'descricao', 'ranking', 'ganhadores'];
      const rank = (s: string) => { const i = guia.indexOf(s); return i === -1 ? 99 : i; };
      return [...ordemEfetiva].sort((a, b) => rank(a) - rank(b));
    }
    return ordemEfetiva; // padrao
  })();
  const mainSpacing = layoutCheckout === 'rapido' ? 'space-y-3' : layoutCheckout === 'limpo' ? 'space-y-3.5' : 'space-y-4';

  return (
    <div
      style={rootCssVariables}
      className={`min-h-screen bg-[var(--bg,#020617)] text-[var(--texto,#f8fafc)] selection:bg-[var(--brand,#10b981)] selection:text-slate-950 ${getFontFamilyClass(tema.tipografia.fonteTitulo)}`}
    >
      {/* Top Navbar com Menu Lateral */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className={`flex items-center gap-2 ${campanha.exibirCabecalhoTipo === 'logo' && campanha.cabecalhoLogoLarguraTotal ? 'flex-1 max-w-full justify-center overflow-hidden px-1' : 'min-w-0'}`}>
            <button
              type="button"
              onClick={() => setOrganizadorModalAberto(true)}
              className={`flex items-center gap-2.5 text-left hover:opacity-90 transition cursor-pointer group ${campanha.exibirCabecalhoTipo === 'logo' && campanha.cabecalhoLogoLarguraTotal ? 'w-full justify-center' : 'min-w-0'}`}
            >
              {(!campanha.cabecalhoLogoLarguraTotal || campanha.exibirCabecalhoTipo !== 'logo') && (
                campanha.organizadorFoto ? (
                  <img
                    src={campanha.organizadorFoto}
                    alt={campanha.organizadorNome || 'Organizador'}
                    className="w-9 h-9 rounded-full object-cover border border-[var(--brand)]/50 shadow-md group-hover:scale-105 transition-transform shrink-0"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-black text-base shadow-md group-hover:scale-105 transition-transform shrink-0"
                    style={{ backgroundColor: 'var(--brand)', color: 'var(--btn-txt)' }}
                  >
                    {(campanha.organizadorNome || 'Rifa')[0].toUpperCase()}
                  </div>
                )
              )}

              {/* Conteúdo ao lado da foto: Nome ou Logo */}
              {campanha.exibirCabecalhoTipo === 'logo' && (campanha.cabecalhoLogoUrl || marca?.logoUrl) ? (
                <img 
                  src={campanha.cabecalhoLogoUrl || marca?.logoUrl || ''} 
                  alt="Logo" 
                  className={`object-contain transition cursor-pointer ${campanha.cabecalhoLogoLarguraTotal ? 'w-full max-w-full mx-auto' : 'max-w-[200px] sm:max-w-[280px]'}`} 
                  style={{ 
                    height: `${campanha.cabecalhoLogoTamanho || 40}px`, 
                    maxHeight: '56px',
                    maxWidth: '100%',
                    objectFit: 'contain'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = '/campanhas';
                  }} 
                />
              ) : (
                <div>
                  <span className="font-extrabold text-white text-sm tracking-tight block truncate max-w-[160px] sm:max-w-[200px]">
                    {campanha.organizadorNome || 'Organizador Oficial'}
                  </span>
                </div>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateComoFunciona && (
              <button
                id="btn-como-funciona-topo"
                type="button"
                onClick={onNavigateComoFunciona}
                className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Como Funciona</span>
              </button>
            )}

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
              onClick={() => setMenuAberto(prev => !prev)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition shadow cursor-pointer"
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
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setMenuAberto(false)}
        >
          <div 
            className="w-full max-w-xs bg-slate-900 border-l border-slate-800 h-full p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right"
            onClick={(e) => e.stopPropagation()}
          >
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
                {onNavigateComoFunciona && (
                  <button
                    onClick={() => { setMenuAberto(false); onNavigateComoFunciona(); }}
                    className="w-full p-3 bg-slate-800 hover:bg-slate-700/80 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-2.5 transition"
                  >
                    <HelpCircle className="w-4 h-4 text-emerald-400" />
                    <span>Como Funciona / Guia Oficial</span>
                  </button>
                )}

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
                    <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
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
                    <InstagramIcon className="w-4 h-4 text-pink-400" />
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
                    <TikTokIcon className="w-4 h-4 text-slate-100" />
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

      {/* BOTÕES FLUTUANTES NO CANTO DIREITO (WHATSAPP, INSTAGRAM, TIKTOK, COMPARTILHAR) */}
      {(campanha.organizadorWhatsapp || campanha.organizadorInstagram || campanha.organizadorTiktok || campanha.exibirBotaoCompartilhar !== false) && (
        <div className="fixed bottom-24 right-3 z-30 flex flex-col gap-2.5">
          {campanha.organizadorWhatsapp && (
            <a
              href={`https://wa.me/55${campanha.organizadorWhatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-[#25D366] shadow-lg shadow-black/30 ring-1 ring-white/15 transition-transform hover:scale-110 active:scale-95"
              title="WhatsApp de Suporte"
              aria-label="WhatsApp de Suporte"
            >
              <WhatsAppIcon className="w-6 h-6" />
            </a>
          )}
          {campanha.organizadorInstagram && (
            <a
              href={`https://instagram.com/${campanha.organizadorInstagram.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg shadow-black/30 ring-1 ring-white/15 transition-transform hover:scale-110 active:scale-95"
              style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}
              title="Instagram"
              aria-label="Instagram do organizador"
            >
              <InstagramIcon className="w-6 h-6" />
            </a>
          )}
          {campanha.organizadorTiktok && (
            <a
              href={`https://tiktok.com/@${campanha.organizadorTiktok.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-black shadow-lg shadow-black/30 ring-1 ring-white/15 transition-transform hover:scale-110 active:scale-95"
              title="TikTok"
              aria-label="TikTok do organizador"
            >
              <TikTokIcon className="w-6 h-6" />
            </a>
          )}
          {campanha.exibirBotaoCompartilhar !== false && (
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: campanha.titulo, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  toast('Link da campanha copiado com sucesso!');
                }
              }}
              className="w-12 h-12 bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-full flex items-center justify-center shadow-lg shadow-black/30 backdrop-blur transition-transform hover:scale-110 active:scale-95"
              title="Compartilhar Link"
              aria-label="Compartilhar link da campanha"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Main Container com Renderização das Seções na Ordem do Tema */}
      <main className={`max-w-xl mx-auto px-4 pb-28 pt-3 ${mainSpacing}`}>
        
        {/* BANNER CAMPANHA PAUSADA / DESATIVADA */}
        {((campanha.status as string) === 'pausada' || campanha.status === 'rascunho') && (
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
        <div className="max-w-xl mx-auto flex flex-col gap-2 w-full">
          {(tema.botao.tituloCompra || tema.botao.subtituloCompra) && (
            <div className="text-center w-full pb-1">
              {tema.botao.tituloCompra && (
                <div className="font-black" style={{ fontFamily: tema.tipografia.fonteBotaoCompraTitulo || 'Inter', fontSize: '0.85rem', color: tema.cores.titulos || '#ffffff' }}>
                  {tema.botao.tituloCompra}
                </div>
              )}
              {tema.botao.subtituloCompra && (
                <div className="text-[10px] opacity-70 mt-0.5" style={{ fontFamily: tema.tipografia.fonteBotaoCompraSubtitulo || 'Inter', color: tema.cores.descricoes || '#94a3b8' }}>
                  {tema.botao.subtituloCompra}
                </div>
              )}
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
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
              (campanha.status as string) === 'pausada' ||
              campanha.status === 'rascunho'
            }
            style={
              tempoRestante?.status === 'aguardando_inicio' ||
              tempoRestante?.status === 'encerrada' ||
              (campanha.status as string) === 'pausada' ||
              campanha.status === 'rascunho'
                ? undefined
                : calcularEstiloBotao({
                    estilo: tema.botao?.estilo || 'solido',
                    corFundo: tema.cores.botao,
                    corTexto: tema.cores.textoBotao,
                    raioBorda: tema.botao.raioBorda,
                    tamanhoAltura: tema.botao.tamanhoAltura,
                    tamanhoTexto: tema.botao.tamanhoTexto,
                    sombraAltura: tema.botao.sombraAltura,
                    sombraLargura: tema.botao.sombraLargura,
                    corSombra: tema.botao.corSombra,
                  }).style
            }
            className={`flex-1 font-black flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer ${
              calcularEstiloBotao({
                estilo: tema.botao?.estilo || 'solido',
                corFundo: tema.cores.botao,
                corTexto: tema.cores.textoBotao,
                raioBorda: tema.botao.raioBorda,
              }).className
            } ${getBtnSizeClass(tema.botao.tamanhoAltura)} ${
              (campanha.status as string) === 'pausada' || campanha.status === 'rascunho'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 cursor-not-allowed shadow-none'
                : tempoRestante?.status === 'aguardando_inicio'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 cursor-not-allowed shadow-none'
                : tempoRestante?.status === 'encerrada'
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 cursor-not-allowed shadow-none'
                : 'hover:opacity-95 shadow-lg'
            }`}
          >
            {(() => {
              const iconeCompraName = tema.botao?.iconeCompra || tema.secaoIcones?.botaoCompra || 'Sparkles';
              const IconeCompraBtn = getSectionIcon(iconeCompraName, null);
              if (!IconeCompraBtn) return null;
              return (
                <IconeCompraBtn className={`w-4 h-4 ${
                  tempoRestante?.status === 'aguardando_inicio' || tempoRestante?.status === 'encerrada' || (campanha.status as string) === 'pausada'
                    ? 'text-current'
                    : 'fill-current'
                }`} />
              );
            })()}
            {(campanha.status as string) === 'pausada' || campanha.status === 'rascunho'
              ? 'CAMPANHA PAUSADA'
              : tempoRestante?.status === 'aguardando_inicio'
              ? 'AGUARDANDO INÍCIO DAS VENDAS'
              : tempoRestante?.status === 'encerrada'
              ? 'VENDAS ENCERRADAS'
              : (tema.botao.textoCompra || 'PARTICIPAR DO SORTEIO').toUpperCase()}
          </button>
        </div>
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

            {/* Timer de Urgência Checkout */}
            {campanha.checkout?.timerUrgencia?.ativo && checkoutTimer !== null && checkoutTimer > 0 && (
              <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center justify-between text-red-400">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 animate-pulse" />
                  <span className="text-sm font-bold">Oferta expira em:</span>
                </div>
                <span className="text-xl font-mono font-black tracking-widest">{formatTimer(checkoutTimer)}</span>
              </div>
            )}
            
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      Nome social <span className="text-slate-500 font-normal">(opcional)</span>
                    </label>
                    <input
                      id="input-nome-social-comprador"
                      type="text"
                      placeholder="Como prefere ser chamado"
                      value={nomeSocial}
                      onChange={e => setNomeSocial(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[var(--brand)] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      WhatsApp com DDD *
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

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Confirmar WhatsApp *
                      </label>
                      {confirmarWhatsapp && whatsapp && (
                        <span className={`text-[10px] font-bold ${
                          whatsapp.replace(/\D/g, '') === confirmarWhatsapp.replace(/\D/g, '')
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}>
                          {whatsapp.replace(/\D/g, '') === confirmarWhatsapp.replace(/\D/g, '') ? '✓ Coincidem' : '✗ Diferentes'}
                        </span>
                      )}
                    </div>
                    <input
                      id="input-confirmar-whatsapp-comprador"
                      type="tel"
                      placeholder="Repita seu WhatsApp"
                      value={confirmarWhatsapp}
                      onChange={e => setConfirmarWhatsapp(formatWhatsapp(e.target.value))}
                      className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none ${
                        confirmarWhatsapp && whatsapp.replace(/\D/g, '') !== confirmarWhatsapp.replace(/\D/g, '')
                          ? 'border-rose-500/80 focus:border-rose-500'
                          : 'border-slate-700 focus:border-[var(--brand)]'
                      }`}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300 block">
                        CPF * {campanha.modalidade === 'gratis' ? <span className="text-purple-400 font-normal text-[10px]">(1/CPF)</span> : metodoPagamento === 'boleto' && <span className="text-amber-400 font-normal text-[10px]">(boleto)</span>}
                      </label>
                      {cpf && cpf.replace(/\D/g, '').length === 11 && (
                        <span className={`text-[10px] font-bold ${
                          validarCPF(cpf) ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {validarCPF(cpf) ? '✓ Válido' : '✗ Inválido'}
                        </span>
                      )}
                    </div>
                    <input
                      id="input-cpf-comprador"
                      type="text"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={e => setCpf(formatarCPF(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:border-[var(--brand)] focus:outline-none"
                      required={!!((campanha.checkout?.coletaDados?.exigirCpf || campanha.exigirCpf) || campanha.modalidade === 'gratis' || metodoPagamento === 'boleto')}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      E-mail {((campanha.checkout?.coletaDados?.exigirEmail || campanha.exigirEmail) || campanha.modalidade === 'gratis' || metodoPagamento === 'cartao') ? '*' : <span className="text-slate-500 font-normal">(opcional)</span>}
                    </label>
                    <input
                      id="input-email-comprador"
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[var(--brand)] focus:outline-none"
                      required={!!((campanha.checkout?.coletaDados?.exigirEmail || campanha.exigirEmail) || campanha.modalidade === 'gratis' || metodoPagamento === 'cartao')}
                    />
                  </div>
                </div>

                {/* REDES SOCIAIS DO COMPRADOR (@usuário) */}
                {campanha.coletarRedesSociais?.ativo && (
                  <div className="space-y-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                    <p className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5" style={{ color: 'var(--brand)' }} />
                      Suas redes sociais {campanha.coletarRedesSociais?.obrigatorio ? '*' : <span className="text-slate-500 font-normal">(opcional)</span>}
                    </p>
                    {campanha.coletarRedesSociais?.instagram !== false && (
                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 focus-within:border-[var(--brand)]">
                        <Instagram className="w-4 h-4 text-pink-500 shrink-0" />
                        <span className="text-slate-500 text-sm">@</span>
                        <input
                          type="text"
                          placeholder="seu_usuario"
                          value={instagramInput}
                          onChange={e => setInstagramInput(e.target.value.replace(/^@+/, '').trim())}
                          className="flex-1 bg-transparent text-sm text-white focus:outline-none"
                          required={!!campanha.coletarRedesSociais?.obrigatorio}
                        />
                      </div>
                    )}
                    {campanha.coletarRedesSociais?.tiktok !== false && (
                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 focus-within:border-[var(--brand)]">
                        <Music2 className="w-4 h-4 text-slate-200 shrink-0" />
                        <span className="text-slate-500 text-sm">@</span>
                        <input
                          type="text"
                          placeholder="seu_usuario"
                          value={tiktokInput}
                          onChange={e => setTiktokInput(e.target.value.replace(/^@+/, '').trim())}
                          className="flex-1 bg-transparent text-sm text-white focus:outline-none"
                          required={!!campanha.coletarRedesSociais?.obrigatorio}
                        />
                      </div>
                    )}
                    {campanha.coletarRedesSociais?.whatsapp && (
                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-[11px] text-slate-400">
                        <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Seu WhatsApp já foi informado acima ✓</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Data de Nascimento para Cálculo Automático de Idade */}
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

                {/* ENDEREÇO DO COMPRADOR (ViaCEP Auto-fill) */}
                {(campanha.coletarEndereco?.ativo || campanha.checkout?.coletaDados?.coletarEndereco?.ativo) && (
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3 mt-2">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        Endereço Residencial {(campanha.coletarEndereco?.obrigatorio || campanha.checkout?.coletaDados?.coletarEndereco?.obrigatorio) ? '*' : <span className="text-slate-500 font-normal text-[11px]">(opcional)</span>}
                      </span>
                      {carregandoCep && (
                        <span className="text-[11px] text-amber-400 flex items-center gap-1 animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" /> Buscando CEP...
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        CEP <span className="text-slate-400 font-normal text-[11px]">(preenche rua, bairro e cidade)</span>
                      </label>
                      <input
                        id="input-cep-comprador"
                        type="text"
                        inputMode="numeric"
                        placeholder="00000-000"
                        maxLength={9}
                        value={cep}
                        onChange={e => handleCepChange(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:border-amber-400 focus:outline-none"
                        required={!!(campanha.coletarEndereco?.obrigatorio || campanha.checkout?.coletaDados?.coletarEndereco?.obrigatorio)}
                      />
                      {cepErro && <p className="text-[11px] text-rose-400 mt-1">{cepErro}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Logradouro / Rua</label>
                        <input
                          type="text"
                          placeholder="Rua, Avenida, Alameda..."
                          value={logradouro}
                          onChange={e => setLogradouro(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                          required={!!(campanha.coletarEndereco?.obrigatorio || campanha.checkout?.coletaDados?.coletarEndereco?.obrigatorio)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Número</label>
                        <input
                          type="text"
                          placeholder="123"
                          value={numero}
                          onChange={e => setNumero(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:border-amber-400 focus:outline-none"
                          required={!!(campanha.coletarEndereco?.obrigatorio || campanha.checkout?.coletaDados?.coletarEndereco?.obrigatorio)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Bairro</label>
                        <input
                          type="text"
                          placeholder="Bairro"
                          value={bairro}
                          onChange={e => setBairro(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                          required={!!(campanha.coletarEndereco?.obrigatorio || campanha.checkout?.coletaDados?.coletarEndereco?.obrigatorio)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Cidade</label>
                        <input
                          type="text"
                          placeholder="Cidade"
                          value={cidade}
                          onChange={e => setCidade(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                          required={!!(campanha.coletarEndereco?.obrigatorio || campanha.checkout?.coletaDados?.coletarEndereco?.obrigatorio)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">UF</label>
                        <input
                          type="text"
                          maxLength={2}
                          placeholder="SP"
                          value={uf}
                          onChange={e => setUf(e.target.value.toUpperCase())}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white uppercase focus:border-amber-400 focus:outline-none text-center"
                          required={!!(campanha.coletarEndereco?.obrigatorio || campanha.checkout?.coletaDados?.coletarEndereco?.obrigatorio)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Complemento <span className="text-slate-500 font-normal">(opcional)</span></label>
                      <input
                        type="text"
                        placeholder="Apto 42, Bloco B, etc."
                        value={complemento}
                        onChange={e => setComplemento(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
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

              {/* CAMPO DE CUPOM DE DESCONTO — só aparece se o organizador ativar */}
              {campanha.modalidade !== 'gratis' && (campanha.cupomAtivo === true || campanha.checkout?.cupomAtivo === true || campanha.checkout?.exibirCupom === true) && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>Tem um cupom de desconto?</span>
                    {cupomAplicado && (
                      <span className="text-emerald-400 text-[10px] uppercase font-mono font-bold">
                        {cupomAplicado.tipo === 'fixo'
                          ? `${formatarMoeda(cupomAplicado.valorFixo || 0)} OFF APLICADO`
                          : `${cupomAplicado.descontoPct}% OFF APLICADO`}
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
                      ✓ Cupom {cupomAplicado.codigo} ativado ({cupomAplicado.tipo === 'fixo'
                        ? `${formatarMoeda(cupomAplicado.valorFixo || 0)} de desconto`
                        : `${cupomAplicado.descontoPct}% de desconto`})!
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
                {metodoPagamento === 'pix' && campanha.checkout?.pixConfig?.descontoPct && (
                  <div className="flex justify-between text-emerald-400 text-[11px] mb-1">
                    <span>Desconto Pix ({campanha.checkout.pixConfig.descontoPct}%)</span>
                    <span className="font-bold">- {formatarMoeda(valorSemCupom * (campanha.checkout.pixConfig.descontoPct / 100))}</span>
                  </div>
                )}
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
                disabled={enviandoPedido || !maiorIdade}
                title={!maiorIdade ? 'Marque a confirmação de idade e regulamento para continuar' : undefined}
                style={{ backgroundColor: 'var(--btn)', color: 'var(--btn-txt)', borderRadius: `${tema.botao.raioBorda}px` }}
                className={`w-full py-3.5 font-black rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] ${getBtnRoundingClass(tema.botao.formato)} ${(!maiorIdade || enviandoPedido) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
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
          confirmacaoConfig={campanha?.checkout?.confirmacao}
          onSuccess={() => {
            const pixelId = campanha?.metaPixelId || data?.marca?.metaPixelId;
            if (pixelId && campanha && pixModalData) {
              trackPurchase(pixelId, {
                contentIds: [campanha.id],
                value: pixModalData.valorTotal,
                numItems: pixModalData.quantidade
              }, pixModalData.pedidoId);
            }
            carregarCampanha(true);
          }}
          onClose={() => {
            setPixModalData(null);
            carregarCampanha(true);
          }}
          onVerMeusNumeros={() => {
            setPixModalData(null);
            setMeusNumerosAberto(true);
            carregarCampanha(true);
          }}
          onGerarNovoPix={() => {
            setPixModalData(null);
            carregarCampanha(true);
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
            carregarCampanha(true);
          }}
          onClose={() => {
            setBoletoModalData(null);
            carregarCampanha(true);
          }}
          onVerMeusNumeros={() => {
            setBoletoModalData(null);
            setMeusNumerosAberto(true);
            carregarCampanha(true);
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
          confirmacaoConfig={campanha?.checkout?.confirmacao}
          onClose={() => {
            setCartaoSuccessModalData(null);
            carregarCampanha(true);
          }}
          onVerMeusNumeros={() => {
            setCartaoSuccessModalData(null);
            setMeusNumerosAberto(true);
            carregarCampanha(true);
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
          exigirCpf={(campanha.checkout?.coletaDados?.exigirCpf || campanha.exigirCpf)}
          exigirEmail={(campanha.checkout?.coletaDados?.exigirEmail || campanha.exigirEmail)}
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
                  style={{ backgroundColor: 'var(--btn)', color: 'var(--btn-txt)', borderRadius: `${tema.botao.raioBorda}px` }}
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

            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
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
                <>
                  {/* Seção Campanhas Ativas */}
                  {campanhasOrganizador.filter(c => c.status === 'publicada' || c.status === 'pausada').length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                        Campanhas em Andamento
                      </h4>
                      <div className="space-y-2">
                        {campanhasOrganizador
                          .filter(c => c.status === 'publicada' || c.status === 'pausada')
                          .map(c => (
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
                                  <div className="w-14 h-14 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 text-xs shrink-0 font-bold">
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
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Seção Campanhas Encerradas */}
                  {campanhasOrganizador.filter(c => c.status === 'encerrada').length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        Campanhas Encerradas
                      </h4>
                      <div className="space-y-2">
                        {campanhasOrganizador
                          .filter(c => c.status === 'encerrada')
                          .map(c => {
                            const dataEnc = c.encerradaEm || c.atualizadaEm || c.criadaEm;
                            let dataFmt = '—';
                            if (dataEnc) {
                              try {
                                const d = new Date(dataEnc);
                                dataFmt = isNaN(d.getTime()) ? dataEnc : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                              } catch(e) {}
                            }
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => setCampanhaResultadoModal(c)}
                                className="w-full text-left p-3 rounded-xl border bg-slate-950 border-slate-800 hover:border-amber-500/40 text-slate-200 transition group"
                              >
                                <div className="flex items-center gap-3">
                                  {c.bannerUrl ? (
                                    <img src={c.bannerUrl} alt={c.titulo} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                                  ) : (
                                    <div className="w-14 h-14 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 text-xs shrink-0 font-bold">
                                      Rifa
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-bold text-xs text-white truncate group-hover:text-amber-300 transition-colors">{c.titulo}</span>
                                      <span className="text-[9px] font-bold uppercase bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded border border-red-500/30 shrink-0">
                                        Encerrada
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                      Encerrada em: {dataFmt}
                                    </p>
                                    <div className="text-[10px] text-amber-400/90 font-medium mt-1 flex items-center gap-1">
                                      <Eye className="w-3 h-3" />
                                      <span>Ver resultado oficial</span>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </>
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

      {/* Modal Visão de Resultado (Campanha Encerrada) */}
      {campanhaResultadoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Encerrada
                </span>
                <span className="text-xs text-slate-400 font-medium">Resultado Oficial</span>
              </div>
              <button
                type="button"
                onClick={() => setCampanhaResultadoModal(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Resultado */}
            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {/* Card Banner + Título */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden p-3 flex gap-3.5 items-center">
                {campanhaResultadoModal.bannerUrl ? (
                  <img
                    src={campanhaResultadoModal.bannerUrl}
                    alt={campanhaResultadoModal.titulo}
                    className="w-16 h-16 rounded-lg object-cover shrink-0 border border-slate-800"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 text-xs shrink-0 font-bold">
                    Rifa
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-white text-sm line-clamp-2">{campanhaResultadoModal.titulo}</h3>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>
                      Encerrada em:{' '}
                      {(() => {
                        const dataEnc = campanhaResultadoModal.encerradaEm || campanhaResultadoModal.atualizadaEm || campanhaResultadoModal.criadaEm;
                        if (!dataEnc) return '—';
                        try {
                          const d = new Date(dataEnc);
                          return isNaN(d.getTime()) ? dataEnc : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                        } catch (e) {
                          return dataEnc;
                        }
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Estatísticas da Campanha Encerrada */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[11px] text-slate-400 block font-medium">Números Vendidos</span>
                  <span className="text-base font-mono font-black text-emerald-400">
                    {((campanhaResultadoModal as any).estatisticas?.vendidas ?? 0).toLocaleString('pt-BR')} / {campanhaResultadoModal.totalCotas.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[11px] text-slate-400 block font-medium">Total Arrecadado</span>
                  <span className="text-base font-mono font-black text-amber-400">
                    R$ {(((campanhaResultadoModal as any).estatisticas?.arrecadado ?? 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Bloco de Ganhadores */}
              <div className="bg-slate-950/90 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                  Ganhador(es) da Campanha
                </h4>

                {campanhaResultadoModal.ganhadoresHistorico && campanhaResultadoModal.ganhadoresHistorico.length > 0 ? (
                  <div className="space-y-2">
                    {campanhaResultadoModal.ganhadoresHistorico.map((g, idx) => (
                      <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black text-xs flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </div>
                          <div className="min-w-0">
                            <span className="font-extrabold text-xs text-white block truncate">{g.nome || 'Ganhador'}</span>
                            {g.premioDescricao && (
                              <span className="text-[10px] text-slate-400 block truncate">{g.premioDescricao}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 block">Cota</span>
                          <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {g.cota}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : campanhaResultadoModal.ganhador ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shrink-0 shadow">
                        🏆
                      </div>
                      <div className="min-w-0">
                        <span className="font-extrabold text-sm text-white block truncate">{campanhaResultadoModal.ganhador.nome || 'Ganhador'}</span>
                        <span className="text-[11px] text-emerald-400 font-medium block truncate">Número Sorteado: {campanhaResultadoModal.ganhador.cota || campanhaResultadoModal.numeroSorteado || '—'}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block">Cota</span>
                      <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        {campanhaResultadoModal.ganhador.cota}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
                    <p className="text-xs text-slate-400 font-medium">Nenhum ganhador registrado até o momento nesta campanha.</p>
                  </div>
                )}
              </div>

              {/* Botão de Compra Desabilitado */}
              <div className="pt-1">
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-400 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
                >
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>VENDAS ENCERRADAS PARA ESTA CAMPANHA</span>
                </button>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="pt-2 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setCampanhaResultadoModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
              >
                Voltar
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

      {/* Prova social (toast de vendas) e Exit Pop-up — só na página real, não no preview */}
      {!modoPreview && campanha.checkout?.notificacoesSociais?.ativo && (
        <SocialNotifications
          config={campanha.checkout.notificacoesSociais}
          campanhaTitulo={campanha.titulo}
        />
      )}
      {!modoPreview && campanha.checkout?.exitPopup?.ativo && (
        <ExitPopup
          config={campanha.checkout.exitPopup}
          onComprar={handleIniciarCompra}
        />
      )}

    </div>
  );
};
