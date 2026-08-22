import React, { useState, useEffect } from 'react';
import { CampanhaPublicaResponse, Promocao, OfertaRelampago } from '../types';
import { 
  Trophy, Flame, Sparkles, ShieldCheck, Ticket, Users, HelpCircle, 
  ChevronDown, ChevronUp, Plus, Minus, Check, Gift, Search, Info,
  Smartphone, Share2, Instagram, AlertTriangle, Copy, XCircle, CheckCircle2,
  User, Edit
} from 'lucide-react';
import { UpsellModal } from './UpsellModal';
import { PixPaymentModal } from './PixPaymentModal';
import { MeusNumerosModal } from './MeusNumerosModal';
import { MeusDadosModal } from './MeusDadosModal';

interface Props {
  codigo: string;
  onNavigateAdmin: () => void;
}

export const CampanhaPublicaView: React.FC<Props> = ({ codigo, onNavigateAdmin }) => {
  const [data, setData] = useState<CampanhaPublicaResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // Seleção de cotas
  const [quantidade, setQuantidade] = useState<number>(10);
  const [cotasManuais, setCotasManuais] = useState<string[]>([]);
  const [descricaoAberta, setDescricaoAberta] = useState(false);

  // Form Comprador Modal Checkout
  const [checkoutAberto, setCheckoutAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [maiorIdade, setMaiorIdade] = useState(true);
  const [compradorSalvo, setCompradorSalvo] = useState<{ nome: string; whatsapp: string } | null>(null);
  const [formErro, setFormErro] = useState('');
  const [enviandoPedido, setEnviandoPedido] = useState(false);

  // Modal Meus Dados
  const [meusDadosAberto, setMeusDadosAberto] = useState(false);

  // Modal de Diagnóstico de Erro (para copiar para o suporte)
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

  // Inicializar dados do comprador do localStorage
  useEffect(() => {
    try {
      const savedNome = localStorage.getItem('rifapix_comprador_nome');
      const savedPhone = localStorage.getItem('rifapix_comprador_whatsapp');
      const savedCpf = localStorage.getItem('rifapix_comprador_cpf');
      const savedEmail = localStorage.getItem('rifapix_comprador_email');

      if (savedNome) setNome(savedNome);
      if (savedPhone) {
        setWhatsapp(formatWhatsapp(savedPhone));
        setCompradorSalvo({ nome: savedNome || 'Participante', whatsapp: savedPhone });
      }
      if (savedCpf) setCpf(savedCpf);
      if (savedEmail) setEmail(savedEmail);
    } catch (e) {}
  }, []);

  // Carregar dados da campanha
  const carregarCampanha = async () => {
    try {
      setCarregando(true);
      const res = await fetch(`/api/campanhas/${codigo}`);
      if (!res.ok) {
        throw new Error('Campanha não encontrada.');
      }
      const json: CampanhaPublicaResponse = await res.json();
      setData(json);

      // Seta default quantidade
      if (json.campanha.promocoes && json.campanha.promocoes.length > 0) {
        const promoDestaque = json.campanha.promocoes.find(p => p.destaque) || json.campanha.promocoes[0];
        setQuantidade(promoDestaque.quantidade);
      } else {
        setQuantidade(json.campanha.minPorCompra || 10);
      }
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar sorteio.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarCampanha();
  }, [codigo]);

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

  const { campanha, estatisticas, ranking } = data;

  // Cálculo de valor
  const calcularValorTotal = (qtd: number) => {
    if (campanha.promocoes && campanha.promocoes.length > 0) {
      const promo = campanha.promocoes.find(p => p.quantidade === qtd);
      if (promo) return promo.valor;
    }
    return Number((qtd * campanha.valorCota).toFixed(2));
  };

  const valorTotalAtual = calcularValorTotal(quantidade);

  // Formatação de telefone
  const formatWhatsapp = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) return raw;
    if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  };

  // Botão Comprar / Iniciar Checkout
  const handleIniciarCompra = () => {
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

  // Submit Pedido e Geração Pix
  const handleEnviarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErro('');

    const cleanWhatsapp = whatsapp.replace(/\D/g, '');
    if (cleanWhatsapp.length < 10) {
      setFormErro('Informe um WhatsApp válido com DDD.');
      return;
    }

    if (!maiorIdade) {
      setFormErro('É obrigatório declarar ter no mínimo 18 anos para participar.');
      return;
    }

    if (campanha.exigirCpf && (!cpf || cpf.replace(/\D/g, '').length !== 11)) {
      setFormErro('Informe um CPF válido com 11 dígitos.');
      return;
    }

    if (campanha.exigirEmail && (!email || !email.includes('@'))) {
      setFormErro('Informe um endereço de e-mail válido.');
      return;
    }

    setEnviandoPedido(true);

    try {
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
            cpf: cpf.trim() || undefined,
            email: email.trim() || undefined
          },
          ofertaRelampagoId: ofertaSelecionada ? (ofertaSelecionada.id || 'oferta-1') : undefined
        })
      });

      const pedidoJson = await res.json();

      if (!res.ok) {
        setFormErro(pedidoJson.error || 'Erro ao gerar pedido e Pix.');
        setErroDiagnostico({
          titulo: pedidoJson.isMpError ? 'Erro na API do Mercado Pago' : 'Falha ao Gerar Pix',
          mensagem: pedidoJson.error || 'Não foi possível gerar a cobrança Pix.',
          detalhes: pedidoJson.detalhes || pedidoJson,
          isTestToken: pedidoJson.isTestToken
        });
        return;
      }

      setCheckoutAberto(false);
      try {
        localStorage.setItem('rifapix_comprador_nome', nome.trim());
        localStorage.setItem('rifapix_comprador_whatsapp', cleanWhatsapp);
        if (cpf) localStorage.setItem('rifapix_comprador_cpf', cpf.trim());
        if (email) localStorage.setItem('rifapix_comprador_email', email.trim());
        setCompradorSalvo({ nome: nome.trim(), whatsapp: cleanWhatsapp });
      } catch (e) {}

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
      setFormErro('Erro de conexão com o servidor. Tente novamente.');
      setErroDiagnostico({
        titulo: 'Erro de Conexão com o Servidor',
        mensagem: err.message || 'Falha ao enviar requisição para o servidor.',
        detalhes: err.stack || String(err)
      });
    } finally {
      setEnviandoPedido(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-lg shadow-md shadow-emerald-500/20">
              R
            </div>
            <span className="font-extrabold text-white text-base tracking-tight">
              Rifa<span className="text-emerald-400">Pix</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-abrir-meus-dados"
              type="button"
              onClick={() => setMeusDadosAberto(true)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Ver e preencher meus dados para o sorteio (+18 anos)"
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Meus Dados</span>
            </button>

            <button
              id="btn-ver-meus-numeros"
              type="button"
              onClick={() => setMeusNumerosAberto(true)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Meus Números</span>
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
                  className="text-emerald-400 hover:text-emerald-300 font-bold underline"
                >
                  Ver cotas
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-4 pb-28 pt-3 space-y-4">
        
        {/* Banner + Selo */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
          <img
            src={campanha.bannerUrl}
            alt={campanha.titulo}
            className="w-full aspect-[16/9] object-cover"
          />
          
          {campanha.selo && (
            <div className="absolute top-3 left-3 px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-full shadow-lg flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-slate-950" />
              {campanha.selo}
            </div>
          )}

          <div className="p-4 bg-gradient-to-t from-slate-950 via-slate-900 to-transparent">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Sorteio oficial: {campanha.localSorteio}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {campanha.titulo}
            </h1>
            {campanha.subtitulo && (
              <p className="text-slate-300 text-xs mt-1">
                {campanha.subtitulo}
              </p>
            )}
          </div>
        </div>

        {/* Barra de Progresso */}
        {campanha.exibirBarraProgresso && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 font-medium">Progresso do sorteio</span>
              <span className="text-emerald-400 font-extrabold">{estatisticas.percentualVendido}% vendido</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${Math.min(100, Math.max(2, estatisticas.percentualVendido))}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-2">
              <span>{estatisticas.vendidas.toLocaleString('pt-BR')} cotas vendidas</span>
              <span>{estatisticas.disponiveis.toLocaleString('pt-BR')} disponíveis</span>
            </div>
          </div>
        )}

        {/* Bloco: ESCOLHA A QUANTIDADE DE COTAS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                Passo 1
              </span>
              <h2 className="text-base font-black text-white">
                Escolha a quantidade de cotas
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Por apenas</span>
              <span className="text-sm font-extrabold text-emerald-400">
                R$ {campanha.valorCota.toFixed(2).replace('.', ',')} / cota
              </span>
            </div>
          </div>

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
                    className={`relative p-3 rounded-xl border text-center transition ${
                      selecionado
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {promo.destaque && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider rounded-full shadow">
                        Mais Popular
                      </span>
                    )}
                    <span className="block text-sm font-black text-white">
                      +{promo.quantidade}
                    </span>
                    <span className="block text-xs font-extrabold text-emerald-400 mt-0.5">
                      R$ {promo.valor.toFixed(2).replace('.', ',')}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Seletor Manual (- / +) */}
          <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              onClick={() => setQuantidade(q => Math.max(campanha.minPorCompra || 1, q - 5))}
              className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold transition active:scale-95"
              aria-label="Diminuir cotas"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="text-center">
              <span className="text-xl font-black text-white block">
                {quantidade} cotas
              </span>
              <span className="text-xs text-slate-400">
                Total: R$ {valorTotalAtual.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <button
              onClick={() => setQuantidade(q => Math.min(campanha.maxPorCompra || 5000, q + 5))}
              className="w-10 h-10 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-bold transition active:scale-95"
              aria-label="Aumentar cotas"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Seção: Prêmios */}
        {campanha.premios && campanha.premios.length > 0 && (
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
        )}

        {/* Seção: Cotas Premiadas (Instantâneas) */}
        {campanha.cotasPremiadas && campanha.cotasPremiadas.length > 0 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-emerald-400" />
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
                    <span className="font-mono font-black text-emerald-400 text-sm">
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
        )}

        {/* Seção: Regulamento / Descrição */}
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

        {/* Seção: Ranking dos Maiores Compradores */}
        {campanha.exibirRanking && ranking && ranking.length > 0 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
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
                  <span className="font-extrabold text-emerald-400 font-mono">
                    {item.quantidadeCotas} cotas
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Barra Fixa Inferior de Compra Instantânea */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-3">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {quantidade} cotas selecionadas
            </span>
            <span className="text-lg font-black text-emerald-400 leading-none">
              R$ {valorTotalAtual.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <button
            id="btn-finalizar-compra"
            onClick={handleIniciarCompra}
            className="flex-1 py-3 px-5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            PARTICIPAR DO SORTEIO
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-white my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Identificação do Comprador
                </span>
                <h3 className="text-lg font-black text-white">
                  Seus dados para o sorteio
                </h3>
              </div>
              <button
                onClick={() => setCheckoutAberto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnviarPedido} className="space-y-3.5">
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              {campanha.exigirCpf && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    CPF (obrigatório) *
                  </label>
                  <input
                    id="input-cpf-comprador"
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={e => setCpf(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              )}

              {campanha.exigirEmail && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    E-mail (obrigatório) *
                  </label>
                  <input
                    id="input-email-comprador"
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
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
                    className="w-4 h-4 mt-0.5 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-200 font-medium leading-tight">
                    <strong className="text-emerald-400 block">Idade mínima 18 anos:</strong>
                    Declaro que tenho 18 anos ou mais e estou de acordo com o regulamento do sorteio.
                  </span>
                </label>
              </div>

              {/* Resumo */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Cotas:</span>
                  <span className="font-bold text-white">
                    {quantidade + (ofertaSelecionada ? ofertaSelecionada.cotasExtras : 0)} cotas
                  </span>
                </div>
                <div className="flex justify-between text-slate-300 border-t border-slate-700/50 pt-1">
                  <span>Total a pagar via Pix:</span>
                  <span className="font-extrabold text-emerald-400 text-sm">
                    R$ {(valorTotalAtual + (ofertaSelecionada ? ofertaSelecionada.preco : 0)).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {formErro && (
                <p className="text-xs text-red-400 font-medium">{formErro}</p>
              )}

              <button
                id="btn-confirmar-gerar-pix"
                type="submit"
                disabled={enviandoPedido}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                {enviandoPedido ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Gerando Pix Oficial...
                  </span>
                ) : (
                  'GERAR PIX AGORA'
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
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                    erroCopiado
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
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

    </div>
  );
};
