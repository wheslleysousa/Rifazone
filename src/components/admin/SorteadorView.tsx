import React, { useState } from 'react';
import { 
  Trophy, Sparkles, RotateCw, CheckCircle2, AlertCircle, 
  Calendar, ShieldCheck, Share2, Copy, Download, Ticket, User, Gift
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Campanha, Pedido } from '../../types';

interface Props {
  campanhas: Campanha[];
  pedidos: Pedido[];
  onApurarCampanha: (campanhaId: string, numeroSorteado: string) => Promise<any>;
}

export const SorteadorView: React.FC<Props> = ({ campanhas, pedidos, onApurarCampanha }) => {
  const [campanhaId, setCampanhaId] = useState<string>(campanhas[0]?.id || '');
  const [metodoSorteio, setMetodoSorteio] = useState<'loteria' | 'globo'>('globo');
  
  // Input Loteria Federal
  const [numeroFederal, setNumeroFederal] = useState('');
  
  // Animação do Globo / Roleta
  const [animando, setAnimando] = useState(false);
  const [numeroAnimado, setNumeroAnimado] = useState('0000');
  const [resultadoFinal, setResultadoFinal] = useState<any | null>(null);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState(false);

  // Opção para não repetir ganhadores
  const [naoRepetirGanhador, setNaoRepetirGanhador] = useState(true);

  const campanhaAtual = campanhas.find(c => c.id === campanhaId) || campanhas[0];

  // Cotas pagas desta campanha
  const pedidosPagos = pedidos.filter(p => p.campanhaId === campanhaId && p.status === 'pago');
  const todasCotasPagas: string[] = pedidosPagos.flatMap(p => p.numeros || []);

  // Ganhadores que já foram contemplados nesta campanha
  const ganhadoresExistentes = [
    ...(campanhaAtual?.ganhadoresHistorico || []),
    ...(campanhaAtual?.ganhador ? [campanhaAtual.ganhador] : [])
  ];
  const whatsappsGanhadores = new Set(ganhadoresExistentes.map(g => (g.whatsapp || '').replace(/\D/g, '')));
  const cotasJaSorteadas = new Set(ganhadoresExistentes.map(g => String(g.cota)));

  // Cotas elegíveis para o sorteio (apenas vendidas/pagas, excluindo ganhadores se ativado)
  const cotasElegiveis: string[] = [];
  pedidosPagos.forEach(p => {
    const cleanW = (p.comprador?.whatsapp || '').replace(/\D/g, '');
    if (naoRepetirGanhador && cleanW && whatsappsGanhadores.has(cleanW)) {
      return; // Já ganhou, pula
    }
    (p.numeros || []).forEach(num => {
      const strNum = String(num);
      if (!cotasJaSorteadas.has(strNum)) {
        cotasElegiveis.push(strNum);
      }
    });
  });

  // Configuração do Temporizador (segundos)
  const [duracaoSegundos, setDuracaoSegundos] = useState<number>(3);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Atualizar temporizador padrão ao trocar de campanha
  React.useEffect(() => {
    if (campanhaAtual?.tempoAnimacaoSorteioSegundos) {
      setDuracaoSegundos(campanhaAtual.tempoAnimacaoSorteioSegundos);
    }
  }, [campanhaId]);

  // Limpar timeout no unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSortearGlobo = async () => {
    if (!campanhaAtual) return;
    if (cotasElegiveis.length === 0) {
      if (todasCotasPagas.length === 0) {
        setErro('Esta campanha ainda não possui cotas pagas para sortear.');
      } else {
        setErro('Não há cotas elegíveis para este sorteio. Todos os participantes compradores já ganharam anteriormente!');
      }
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setErro('');
    setAnimando(true);
    setResultadoFinal(null);

    const listAnim = cotasElegiveis.length > 0 ? cotasElegiveis : todasCotasPagas;
    const cotaGanhadora = cotasElegiveis[Math.floor(Math.random() * cotasElegiveis.length)];

    const totalDurationMs = Math.max(1, duracaoSegundos) * 1000;
    const startTime = Date.now();

    // Função de desaceleração suave (slow down gradually)
    const runAnimationStep = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / totalDurationMs);

      if (progress < 1) {
        // Exibe um número aleatório da lista de elegíveis
        const randIndex = Math.floor(Math.random() * listAnim.length);
        setNumeroAnimado(listAnim[randIndex]);

        // Calcula próximo delay: no início (~35ms), no final (~550ms)
        const nextDelay = 35 + Math.pow(progress, 2.5) * 520;
        timeoutRef.current = setTimeout(runAnimationStep, nextDelay);
      } else {
        // Animação concluída -> para no número sorteado
        setNumeroAnimado(cotaGanhadora);
        setAnimando(false);

        onApurarCampanha(campanhaAtual.id, cotaGanhadora)
          .then(res => {
            setResultadoFinal(res);
            confetti({
              particleCount: 160,
              spread: 85,
              origin: { y: 0.6 }
            });
          })
          .catch(err => {
            setErro(err.message || 'Erro ao registrar apuração.');
          });
      }
    };

    runAnimationStep();
  };

  const handleApurarFederal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroFederal.trim()) {
      setErro('Digite o número extraído da Loteria Federal.');
      return;
    }

    setErro('');
    try {
      const res = await onApurarCampanha(campanhaAtual.id, numeroFederal.trim());
      setResultadoFinal(res);
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      setErro(err.message || 'Erro ao apurar com o número informado.');
    }
  };

  const copiarComprovanteTexto = () => {
    if (!resultadoFinal) return;
    const g = resultadoFinal.ganhador;
    const txt = 
      `🏆 *RESULTADO OFICIAL DO SORTEIO* 🏆\n\n` +
      `Campanha: *${campanhaAtual.titulo}*\n` +
      `Prêmio: *${campanhaAtual.premios?.[0]?.descricao || 'Prêmio Principal'}*\n` +
      `Cota Sorteada: *${resultadoFinal.campanha?.numeroSorteado || numeroAnimado}*\n` +
      `Ganhador(a): *${g?.nome || 'Ganhador Verificado'}*\n` +
      `WhatsApp: *${g?.whatsapp || ''}*\n\n` +
      `Parabéns ao ganhador(a)! 🎉 Agradecemos a todos os participantes!`;

    navigator.clipboard.writeText(txt);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Sorteador Oficial & Apuração
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Realize o sorteio eletrônico transparente com animação ao vivo ou apure o resultado pela Loteria Federal.
            </p>
          </div>

          {/* Selecionar Campanha */}
          <div className="w-full sm:w-64">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Selecionar Campanha:
            </label>
            <select
              value={campanhaId}
              onChange={e => {
                setCampanhaId(e.target.value);
                setResultadoFinal(null);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:border-emerald-500 focus:outline-none"
            >
              {campanhas.map(c => (
                <option key={c.id} value={c.id}>
                  {c.titulo} ({c.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Abas de Método */}
        <div className="flex gap-2 mt-5 pt-4 border-t border-slate-800">
          <button
            onClick={() => setMetodoSorteio('globo')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              metodoSorteio === 'globo'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            Sorteador Eletrônico (Globo/Roleta)
          </button>

          <button
            onClick={() => setMetodoSorteio('loteria')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              metodoSorteio === 'loteria'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Apuração Loteria Federal
          </button>
        </div>
      </div>

      {erro && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* MÉTODO 1: GLOBO / ROLETA ELETRÔNICA */}
      {metodoSorteio === 'globo' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm text-center">
          
          <div className="max-w-md mx-auto space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 block">
                Sorteio entre as {cotasElegiveis.length} cotas elegíveis
              </span>
              <p className="text-[11px] text-slate-400">
                Total de cotas pagas: <span className="font-bold text-white">{todasCotasPagas.length}</span>
                {ganhadoresExistentes.length > 0 && (
                  <span> | Ganhadores anteriores: <span className="font-bold text-amber-400">{ganhadoresExistentes.length}</span></span>
                )}
              </p>
            </div>

            {/* Opção para Não Repetir Ganhador */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-left flex items-center justify-between gap-3">
              <label htmlFor="chk-nao-repetir" className="cursor-pointer text-xs font-bold text-slate-200 select-none flex-1">
                <span className="text-emerald-400 block mb-0.5">Não repetir ganhador</span>
                <span className="text-[10px] text-slate-400 font-normal block leading-tight">
                  Bloqueia participantes que já ganharam nesta mesma ação.
                </span>
              </label>
              <input
                id="chk-nao-repetir"
                type="checkbox"
                checked={naoRepetirGanhador}
                onChange={e => setNaoRepetirGanhador(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {/* Configuração do Temporizador da Animação */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  ⏱️ Temporizador da Animação
                </span>
                <span className="text-xs font-mono font-black text-amber-400">
                  {duracaoSegundos}s
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Duração em segundos que os números passarão desacelerando suavemente até revelar a cota vencedora.
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                {[2, 3, 5, 8, 10].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDuracaoSegundos(s)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition border ${
                      duracaoSegundos === s
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            </div>

            {/* Display do Número Digital */}
            <div className="relative py-8 px-6 bg-slate-950 border-2 border-emerald-500/40 rounded-3xl shadow-2xl shadow-emerald-500/10">
              <div className="text-5xl sm:text-6xl font-black font-mono tracking-widest text-emerald-400 animate-pulse">
                {numeroAnimado}
              </div>
              <span className="text-[11px] text-slate-500 block mt-2 uppercase tracking-wider font-semibold">
                {animando ? 'Girando globo da sorte...' : 'Número Oficial Sorteado'}
              </span>
            </div>

            <button
              onClick={handleSortearGlobo}
              disabled={animando || cotasElegiveis.length === 0}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition ${
                animando || cotasElegiveis.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/25 active:scale-[0.98]'
              }`}
            >
              <Sparkles className="w-5 h-5 fill-slate-950" />
              {animando ? 'REALIZANDO SORTEIO...' : 'GIRAR E SORTEAR GANHADOR! 🎲'}
            </button>
          </div>

        </div>
      )}

      {/* MÉTODO 2: LOTERIA FEDERAL */}
      {metodoSorteio === 'loteria' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="max-w-md mx-auto space-y-4">
            <div>
              <h3 className="text-base font-black text-white mb-1">
                Conferência da Loteria Federal
              </h3>
              <p className="text-xs text-slate-400">
                Informe o número do 1º prêmio extraído no concurso oficial da Caixa Econômica Federal.
              </p>
            </div>

            <form onSubmit={handleApurarFederal} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Número Extraído (ex: 049822 ou os últimos 4/5 dígitos) *
                </label>
                <input
                  type="text"
                  placeholder="Ex: 0421 ou 9822"
                  value={numeroFederal}
                  onChange={e => setNumeroFederal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono font-black text-white focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20"
              >
                APURAR E VALIDAR GANHADOR OFICIAL
              </button>
            </form>
          </div>
        </div>
      )}

      {/* COMPROVANTE OFICIAL DO GANHADOR */}
      {resultadoFinal && (
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400/60 rounded-3xl p-6 shadow-2xl space-y-6 max-w-xl mx-auto animate-in zoom-in-95">
          
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
              <Trophy className="w-7 h-7" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
              Comprovante Oficial de Premiação
            </span>
            <h2 className="text-2xl font-black text-white">
              Temos um Grande Ganhador! 🎉
            </h2>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-slate-400">Campanha:</span>
              <span className="font-bold text-white text-sm">{campanhaAtual.titulo}</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-slate-400">Cota Premiada:</span>
              <span className="font-mono font-black text-emerald-400 text-base">
                {resultadoFinal.campanha?.numeroSorteado || numeroAnimado}
              </span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-slate-400">Nome do Ganhador:</span>
              <span className="font-bold text-white text-sm">
                {resultadoFinal.ganhador?.nome || 'Comprador Verificado'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">WhatsApp:</span>
              <span className="font-mono font-bold text-emerald-300">
                {resultadoFinal.ganhador?.whatsapp || 'Cadastrado no pedido'}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={copiarComprovanteTexto}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
            >
              {copiado ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiado ? 'Texto Copiado!' : 'Copiar Texto para WhatsApp / Instagram'}
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
