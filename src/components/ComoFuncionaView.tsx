import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  Smartphone,
  Trophy,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Gift,
  Search,
  Lock,
  Zap,
  Ticket,
  Clock,
  MessageCircle,
  FileText,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface ComoFuncionaViewProps {
  onVoltar?: () => void;
  codigoCampanha?: string;
  nomeCampanha?: string;
}

export function ComoFuncionaView({ onVoltar, codigoCampanha, nomeCampanha }: ComoFuncionaViewProps) {
  const [faqsAbertos, setFaqsAbertos] = useState<number[]>([0]);
  const [buscaFaq, setBuscaFaq] = useState('');
  const [abaSimulador, setAbaSimulador] = useState<number>(50);
  const [simuladorStatus, setSimuladorStatus] = useState<'selecao' | 'pagamento' | 'confirmado'>('selecao');

  const faqs = [
    {
      pergunta: '1. Preciso enviar comprovante de pagamento no WhatsApp?',
      resposta: 'Não! Nosso sistema possui conciliação bancária 100% automática em tempo real. Assim que o Pix é pago no seu aplicativo de banco, nosso servidor identifica a compensação em menos de 5 segundos, aprova suas cotas e envia a confirmação diretamente no seu WhatsApp.'
    },
    {
      pergunta: '2. Como e quando recebo meus números da sorte?',
      resposta: 'Seus números são gerados e exibidos instantaneamente na tela após o pagamento. Além disso, você recebe uma notificação completa no seu WhatsApp e no seu E-mail com o comprovante do pedido e a lista das suas cotas. Você também pode consultar suas cotas a qualquer momento clicando no botão "Meus Números" e digitando seu telefone.'
    },
    {
      pergunta: '3. O que são as Cotas Premiadas e como recebo o prêmio na hora?',
      resposta: 'Cotas Premiadas são números da sorte especiais pré-sorteados pela organização que dão prêmios instantâneos (Pix de R$ 100, R$ 500, R$ 1.000 ou eletrônicos). Se ao comprar suas cotas você for contemplado com um desses números, o sistema avisa na hora na tela e a organização realiza o Pix imediato para sua conta!'
    },
    {
      pergunta: '4. Como funciona o sorteio oficial pela Loteria Federal?',
      resposta: 'A apuração utiliza as extrações oficiais dos sorteios da Loteria Federal da Caixa Econômica Federal (geralmente realizados às quartas e sábados). O número ganhador é formado pela combinação dos dígitos dos primeiros prêmios oficiais da extração, garantindo 100% de imparcialidade e auditoria pública.'
    },
    {
      pergunta: '5. O que acontece se o tempo de reserva expirar antes do pagamento?',
      resposta: 'Quando você seleciona seus números, eles ficam reservados exclusivamente para você durante o tempo limite do checkout (geralmente de 10 a 15 minutos). Caso o pagamento não seja efetuado nesse período, as cotas são automaticamente liberadas para que outros participantes possam concorrer.'
    },
    {
      pergunta: '6. Como sei se fui o ganhador do prêmio principal?',
      resposta: 'Assim que o sorteio é realizado e o número apurado, o ganhador é contatado imediatamente por WhatsApp e ligação telefônica pelos organizadores oficiais. Além disso, o resultado com o nome e cota do vencedor fica publicado publicamente na página da campanha.'
    },
    {
      pergunta: '7. Como é feita a entrega do prêmio?',
      resposta: 'Caso o prêmio seja em dinheiro (Pix), o valor é transferido instantaneamente na conta bancária do titular. Caso o prêmio seja um veículo, eletrônico ou produto físico, a entrega é feita com frete 100% grátis ou com entrega presencial com gravação oficial do comprovante de entrega.'
    },
    {
      pergunta: '8. É seguro participar e colocar meus dados na plataforma?',
      resposta: 'Sim! Utilizamos criptografia SSL de ponta a ponta e processamento de pagamentos seguro através de gateways oficiais autorizados pelo Banco Central. Seus dados cadastrais são protegidos de acordo com a Lei Geral de Proteção de Dados (LGPD).'
    }
  ];

  const faqsFiltrados = faqs.filter(
    f =>
      f.pergunta.toLowerCase().includes(buscaFaq.toLowerCase()) ||
      f.resposta.toLowerCase().includes(buscaFaq.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950 font-sans pb-16">
      {/* HEADER DE NAVEGAÇÃO */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3.5 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 font-black text-lg">
              R
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white block">RifaZone</span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Guia de Participação Oficial</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onVoltar && (
              <button
                onClick={onVoltar}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
              >
                <Ticket className="w-3.5 h-3.5" />
                {codigoCampanha ? 'Voltar para Campanha' : 'Voltar ao Início'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative px-4 pt-12 pb-16 sm:px-6 text-center max-w-4xl mx-auto overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-6">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          Transparência, Rapidez e Segurança em Cada Etapa
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
          Como Funciona a <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">RifaZone</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
          Participar dos nossos sorteios é simples, rápido e 100% digital. Aprenda em poucos passos como escolher suas cotas, efetuar o pagamento seguro e concorrer aos prêmios.
        </p>

        {/* CHIPS DE DESTAQUES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Pix Automático</span>
              <span className="text-[10px] text-slate-400">Baixa em segundos</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Aviso no WhatsApp</span>
              <span className="text-[10px] text-slate-400">Cotas no seu celular</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Cotas Premiadas</span>
              <span className="text-[10px] text-slate-400">Prêmios instantâneos</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Loteria Federal</span>
              <span className="text-[10px] text-slate-400">Auditoria pública</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 PASSOS VISUAIS DETALHADOS */}
      <section className="px-4 py-8 sm:px-6 max-w-5xl mx-auto space-y-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Passo a Passo da Participação
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Veja exatamente o que acontece desde a escolha até a entrega do prêmio
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PASSO 1 */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Passo 01
                </span>
                <Ticket className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">1. Escolha suas Cotas ou Pacotes com Desconto</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Selecione a quantidade de números desejada. Você pode escolher pacotes promocionais pré-definidos (com descontos progressivos) ou selecionar cotas específicas.
              </p>

              <div className="bg-slate-950/60 border border-slate-800/70 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Pacotes Inteligentes:</strong> Quanto mais cotas compra, menor o valor unitário.</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Cotas Premiadas:</strong> Procure pelos números da sorte com prêmios em dinheiro na hora.</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>⏱️ Duração: ~30 segundos</span>
              <span className="text-emerald-400 font-semibold">Seleção Automática ou Manual</span>
            </div>
          </div>

          {/* PASSO 2 */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
                  Passo 02
                </span>
                <QrCode className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">2. Pagamento Seguro e Instantâneo via Pix</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Informe seu nome, telefone WhatsApp e CPF. O sistema gera imediatamente o QR Code e o código <strong>Pix Copia e Cola</strong> exclusivo do seu pedido.
              </p>

              <div className="bg-slate-950/60 border border-slate-800/70 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-4 h-4 text-teal-400 shrink-0" />
                  <span><strong>Reserva Temporária:</strong> Seus números ficam bloqueados exclusivamente para você.</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                  <span><strong>Zero Complicação:</strong> Sem taxa extra, sem necessidade de mandar print de comprovante.</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>💳 Métodos: Pix, Cartão e Boleto</span>
              <span className="text-teal-400 font-semibold">Baixa Automática</span>
            </div>
          </div>

          {/* PASSO 3 */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
                  Passo 03
                </span>
                <Smartphone className="w-6 h-6 text-sky-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">3. Confirmação & Notificação no WhatsApp</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Assim que o banco confirma o pagamento, nosso sistema envia uma mensagem completa no seu WhatsApp com seu comprovante oficial e lista dos números adquiridos.
              </p>

              <div className="bg-slate-950/60 border border-slate-800/70 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span><strong>Consulta "Meus Números":</strong> Acesse suas cotas a qualquer momento pelo site.</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                  <span><strong>Comprovante Digital:</strong> Registro criptográfico de participação inviolável.</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>📱 Notificação via WhatsApp e E-mail</span>
              <span className="text-sky-400 font-semibold">Envio Imediato</span>
            </div>
          </div>

          {/* PASSO 4 */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  Passo 04
                </span>
                <Trophy className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">4. Sorteio Auditado & Entrega do Prêmio</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                O sorteio ocorre na data marcada com base nos resultados públicos da Loteria Federal. O vencedor é notificado imediatamente e recebe o prêmio sem burocracia.
              </p>

              <div className="bg-slate-950/60 border border-slate-800/70 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span><strong>Contato Imediato:</strong> Ligação e WhatsApp oficial da equipe com o vencedor.</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Gift className="w-4 h-4 text-amber-400 shrink-0" />
                  <span><strong>Entrega 100% Grátis:</strong> Pix instantâneo ou envio do produto com frete pago.</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>🏆 Apuração Oficial & Transparente</span>
              <span className="text-amber-400 font-semibold">Entrega Garantida</span>
            </div>
          </div>
        </div>
      </section>

      {/* SIMULADOR INTERATIVO DE PARTICIPAÇÃO */}
      <section className="px-4 py-10 sm:px-6 max-w-4xl mx-auto">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/20">
          <div className="flex items-center gap-2.5 mb-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg sm:text-xl font-bold text-white">Simulador Interativo de Participação</h2>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Faça um teste de como é a experiência rápida de escolher cotas e receber suas confirmações
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => { setAbaSimulador(10); setSimuladorStatus('selecao'); }}
              className={`p-4 rounded-2xl border text-left transition ${
                abaSimulador === 10
                  ? 'bg-emerald-500/10 border-emerald-500 text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span className="text-xs font-bold block">10 Cotas</span>
              <span className="text-base font-black text-emerald-400">R$ 5,00</span>
              <span className="text-[10px] text-slate-400 block mt-1">Pacote Básico</span>
            </button>

            <button
              onClick={() => { setAbaSimulador(50); setSimuladorStatus('selecao'); }}
              className={`p-4 rounded-2xl border text-left transition relative ${
                abaSimulador === 50
                  ? 'bg-emerald-500/10 border-emerald-500 text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500 text-slate-950 text-[9px] font-black rounded-full">
                MAIS POPULAR
              </span>
              <span className="text-xs font-bold block">50 Cotas</span>
              <span className="text-base font-black text-emerald-400">R$ 20,00</span>
              <span className="text-[10px] text-emerald-300/80 block mt-1">20% de Desconto</span>
            </button>

            <button
              onClick={() => { setAbaSimulador(100); setSimuladorStatus('selecao'); }}
              className={`p-4 rounded-2xl border text-left transition ${
                abaSimulador === 100
                  ? 'bg-emerald-500/10 border-emerald-500 text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span className="text-xs font-bold block">100 Cotas</span>
              <span className="text-base font-black text-emerald-400">R$ 35,00</span>
              <span className="text-[10px] text-teal-300/80 block mt-1">30% de Desconto</span>
            </button>
          </div>

          {/* ESTADO DO SIMULADOR */}
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800/80 text-xs">
            {simuladorStatus === 'selecao' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-slate-400 block">Você selecionou:</span>
                  <span className="text-base font-bold text-white">{abaSimulador} cotas da sorte</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Seus números serão gerados de forma criptográfica e auditada.</p>
                </div>
                <button
                  onClick={() => setSimuladorStatus('pagamento')}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  Simular Geração do Pix
                </button>
              </div>
            )}

            {simuladorStatus === 'pagamento' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-bold text-white">QR Code Pix Gerado (Aguardando Pagamento)</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">Expira em 10:00</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
                  <div className="w-24 h-24 bg-white p-2 rounded-xl flex items-center justify-center shrink-0">
                    <QrCode className="w-20 h-20 text-slate-950" />
                  </div>
                  <div className="space-y-1.5 text-slate-300">
                    <p className="font-semibold text-white">Código Pix Copia e Cola gerado para {abaSimulador} cotas.</p>
                    <p className="text-[11px] text-slate-400">Assim que você pagar no seu banco, o sistema reconhece automaticamente sem precisar enviar comprovante.</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSimuladorStatus('confirmado')}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Simular Aprovação Imediata
                  </button>
                </div>
              </div>
            )}

            {simuladorStatus === 'confirmado' && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Pagamento Confirmado em 3 Segundos!</span>
                </div>

                <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3.5 space-y-1.5">
                  <span className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider block">Mensagem Enviada no seu WhatsApp:</span>
                  <p className="text-[11px] text-slate-200 font-mono leading-relaxed bg-slate-950/80 p-2.5 rounded-lg">
                    ✅ *Pagamento Confirmado!*<br />
                    Olá! Seu pedido de *{abaSimulador} cotas* foi aprovado com sucesso.<br />
                    🎟️ *Seus Números:* 04821, 19482, 38102, 59102... (+{abaSimulador - 4} cotas)<br />
                    🍀 Boa sorte! Você já está concorrendo aos prêmios oficiais!
                  </p>
                </div>

                <button
                  onClick={() => setSimuladorStatus('selecao')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reiniciar Simulação
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ SECTION - PERGUNTAS FREQUENTES */}
      <section className="px-4 py-8 sm:px-6 max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            Tire Todas as suas Dúvidas
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Perguntas Frequentes (FAQ)</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Respostas diretas para as dúvidas mais comuns dos participantes</p>
        </div>

        {/* CAMPO DE BUSCA NO FAQ */}
        <div className="relative mb-6">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={buscaFaq}
            onChange={e => setBuscaFaq(e.target.value)}
            placeholder="Buscar dúvida (ex: pix, comprovante, números, sorteio)..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* LISTA DE ACCORDIONS */}
        <div className="space-y-3">
          {faqsFiltrados.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              Nenhuma pergunta encontrada com o termo "{buscaFaq}".
            </div>
          ) : (
            faqsFiltrados.map((item, idx) => {
              const aberto = faqsAbertos.includes(idx);
              return (
                <div
                  key={idx}
                  className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden transition"
                >
                  <button
                    onClick={() => setFaqsAbertos(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-800/40 transition"
                  >
                    <span className="text-xs sm:text-sm font-bold text-white leading-snug">
                      {item.pergunta}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-emerald-400 shrink-0 transition-transform duration-200 ${
                        aberto ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {aberto && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs text-slate-300 leading-relaxed border-t border-slate-800/50 mt-1">
                      <p className="mt-3 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/40">
                        {item.resposta}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="px-4 pt-10 sm:px-6 max-w-3xl mx-auto text-center">
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 rounded-3xl p-8 shadow-xl">
          <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
            Pronto para Concorrer?
          </h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto mb-6">
            Escolha sua campanha favorita, garanta seus números da sorte e boa sorte!
          </p>

          {onVoltar && (
            <button
              onClick={onVoltar}
              className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl transition shadow-lg shadow-emerald-950/50 inline-flex items-center gap-2"
            >
              <Ticket className="w-4 h-4" />
              {codigoCampanha ? `Ver Campanha ${nomeCampanha ? `"${nomeCampanha}"` : ''}` : 'Ver Campanhas Disponíveis'}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
