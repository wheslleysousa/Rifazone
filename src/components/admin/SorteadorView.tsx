import React, { useState } from 'react';
import { 
  Trophy, Sparkles, RotateCw, CheckCircle2, AlertCircle, 
  Calendar, ShieldCheck, Share2, Copy, Download, Ticket, User, Gift, Phone, X
} from 'lucide-react';
import { dispararExplosaoConfetes } from '../../utils/confettiUtils';
import { Campanha, Pedido } from '../../types';

interface Props {
  campanhas: Campanha[];
  pedidos: Pedido[];
  onApurarCampanha: (campanhaId: string, numeroSorteado: string) => Promise<any>;
}

export const SorteadorView: React.FC<Props> = ({ campanhas, pedidos, onApurarCampanha }) => {
  const [campanhaId, setCampanhaId] = useState<string>(campanhas[0]?.id || '');
  const [metodoSorteio, setMetodoSorteio] = useState<'aleatorio' | 'loteria'>('aleatorio');
  
  // Inputs Loteria Federal (1º ao 5º prêmio)
  const [premio1, setPremio1] = useState('');
  const [premio2, setPremio2] = useState('');
  const [premio3, setPremio3] = useState('');
  const [premio4, setPremio4] = useState('');
  const [premio5, setPremio5] = useState('');
  
  // Animação
  const [animando, setAnimando] = useState(false);
  const [numeroAnimado, setNumeroAnimado] = useState('0000');
  const [resultadoFinal, setResultadoFinal] = useState<any | null>(null);
  const [modalGanhadorOpen, setModalGanhadorOpen] = useState(false);
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

  // Cotas elegíveis para o sorteio
  const cotasElegiveis: string[] = [];
  pedidosPagos.forEach(p => {
    const cleanW = (p.comprador?.whatsapp || '').replace(/\D/g, '');
    if (naoRepetirGanhador && cleanW && whatsappsGanhadores.has(cleanW)) {
      return;
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

  React.useEffect(() => {
    if (campanhaAtual?.tempoAnimacaoSorteioSegundos) {
      setDuracaoSegundos(campanhaAtual.tempoAnimacaoSorteioSegundos);
    }
  }, [campanhaId]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSortearAleatorio = async () => {
    if (!campanhaAtual) return;
    if (cotasElegiveis.length === 0) {
      if (todasCotasPagas.length === 0) {
        setErro('Esta campanha ainda não possui cotas pagas para sortear.');
      } else {
        setErro('Não há cotas elegíveis para este sorteio. Todos os participantes já ganharam anteriormente!');
      }
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setErro('');
    setAnimando(true);
    setResultadoFinal(null);
    setModalGanhadorOpen(false);

    const listAnim = cotasElegiveis.length > 0 ? cotasElegiveis : todasCotasPagas;
    const cotaGanhadora = cotasElegiveis[Math.floor(Math.random() * cotasElegiveis.length)];

    const totalDurationMs = Math.max(1, duracaoSegundos) * 1000;
    const startTime = Date.now();

    const runAnimationStep = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / totalDurationMs);

      if (progress < 1) {
        const randIndex = Math.floor(Math.random() * listAnim.length);
        setNumeroAnimado(listAnim[randIndex]);

        const nextDelay = 35 + Math.pow(progress, 2.5) * 520;
        timeoutRef.current = setTimeout(runAnimationStep, nextDelay);
      } else {
        setNumeroAnimado(cotaGanhadora);
        setAnimando(false);

        onApurarCampanha(campanhaAtual.id, cotaGanhadora)
          .then(res => {
            setResultadoFinal(res);
            setModalGanhadorOpen(true);
            dispararExplosaoConfetes();
          })
          .catch(err => {
            setErro(err.message || 'Erro ao registrar apuração.');
          });
      }
    };

    runAnimationStep();
  };

  // Regra exata de apuração da Loteria Federal baseada no total de cotas da campanha
  const handleApurarFederal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!premio1.trim()) {
      setErro('Informe pelo menos o número do 1º prêmio da Loteria Federal.');
      return;
    }

    setErro('');
    try {
      const totalCotas = campanhaAtual?.totalCotas || 1000;
      let numeroCalculado = '';

      const p1 = premio1.trim().replace(/\D/g, '');
      const p2 = premio2.trim().replace(/\D/g, '');
      const p3 = premio3.trim().replace(/\D/g, '');

      if (totalCotas <= 10) {
        // 10 cotas: último número do 1º prêmio
        numeroCalculado = p1.slice(-1);
      } else if (totalCotas <= 100) {
        // 100 cotas: 2 últimos números do 1º prêmio
        numeroCalculado = p1.slice(-2);
      } else if (totalCotas <= 1000) {
        // 1.000 cotas: 3 últimos números do 1º prêmio
        numeroCalculado = p1.slice(-3);
      } else if (totalCotas <= 10000) {
        // 10.000 cotas: 3 últimos do 1º + último do 2º
        const u1 = p1.slice(-3);
        const u2 = p2 ? p2.slice(-1) : '0';
        numeroCalculado = u1 + u2;
      } else if (totalCotas <= 100000) {
        // 100.000 cotas: 3 últimos do 1º + 2 últimos do 2º
        const u1 = p1.slice(-3);
        const u2 = p2 ? p2.slice(-2) : '00';
        numeroCalculado = u1 + u2;
      } else if (totalCotas <= 1000000) {
        // 1.000.000 cotas: 3 últimos do 1º + 3 últimos do 2º
        const u1 = p1.slice(-3);
        const u2 = p2 ? p2.slice(-3) : '000';
        numeroCalculado = u1 + u2;
      } else {
        // 10.000.000+ cotas: 3 últimos do 1º + 3 últimos do 2º + último do 3º
        const u1 = p1.slice(-3);
        const u2 = p2 ? p2.slice(-3) : '000';
        const u3 = p3 ? p3.slice(-1) : '0';
        numeroCalculado = u1 + u2 + u3;
      }

      const res = await onApurarCampanha(campanhaAtual.id, numeroCalculado);
      setResultadoFinal(res);
      setModalGanhadorOpen(true);
      dispararExplosaoConfetes();
    } catch (err: any) {
      setErro(err.message || 'Erro ao apurar com os números da Loteria Federal.');
    }
  };

  const formatWhatsapp = (val: string) => {
    const raw = val.replace(/\D/g, '');
    return raw.startsWith('55') ? raw : `55${raw}`;
  };

  const copiarComprovanteTexto = () => {
    if (!resultadoFinal) return;
    const ganhador = resultadoFinal.ganhador;
    const cota = resultadoFinal.campanha?.numeroSorteado || numeroAnimado;
    const texto = `🎉 *RESULTADO OFICIAL DO SORTEIO* 🎉\n\n` +
      `🏆 *Campanha:* ${campanhaAtual?.titulo || ''}\n` +
      `🎟️ *Cota Contemplada:* ${cota}\n` +
      `👤 *Ganhador(a):* ${ganhador?.nome || 'Não identificado'}\n` +
      `📱 *Telefone:* ${ganhador?.whatsapp || 'Não informado'}\n` +
      `📅 *Data do Sorteio:* ${new Date().toLocaleDateString('pt-BR')}\n\n` +
      `Parabéns ao ganhador e obrigado a todos os participantes! ✨`;

    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Sorteador
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Realize sorteios eletrônicos ou apuração oficial pela Loteria Federal.
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
                  {c.titulo}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Abas de Método */}
        <div className="flex gap-2 mt-5 pt-4 border-t border-slate-800">
          <button
            onClick={() => setMetodoSorteio('aleatorio')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              metodoSorteio === 'aleatorio'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            Sortear Aleatoriamente
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
            Loteria Federal
          </button>
        </div>
      </div>

      {erro && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* MODO 1: SORTEAR ALEATORIAMENTE */}
      {metodoSorteio === 'aleatorio' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm text-center">
          
          <div className="max-w-md mx-auto space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 block">
                Total de cotas da campanha: {campanhaAtual?.totalCotas || 0}
              </span>
              <p className="text-[11px] text-slate-400">
                Cotas pagas disponíveis: <span className="font-bold text-white">{todasCotasPagas.length}</span> | Elegíveis: <span className="font-bold text-emerald-400">{cotasElegiveis.length}</span>
              </p>
            </div>

            {/* Opção para Repetir Ganhador */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-left flex items-center justify-between gap-3">
              <label htmlFor="chk-nao-repetir" className="cursor-pointer text-xs font-bold text-slate-200 select-none flex-1">
                <span className="text-emerald-400 block mb-0.5">Repetir ganhador</span>
                <span className="text-[10px] text-slate-400 font-normal block leading-tight">
                  {naoRepetirGanhador ? 'Participantes que já ganharam estão BLOQUEADOS.' : 'Participantes que já ganharam PODEM vencer novamente.'}
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

            {/* Temporizador */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  ⏱️ Temporizador (Segundos)
                </span>
                <span className="text-xs font-mono font-black text-amber-400">
                  {duracaoSegundos}s
                </span>
              </div>
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

            {/* Display do Número Sorteado */}
            <div className="relative py-8 px-6 bg-slate-950 border-2 border-emerald-500/40 rounded-3xl shadow-2xl shadow-emerald-500/10">
              <div className="text-5xl sm:text-6xl font-black font-mono tracking-widest text-emerald-400 animate-pulse">
                {numeroAnimado}
              </div>
              <span className="text-[11px] text-slate-500 block mt-2 uppercase tracking-wider font-semibold">
                {animando ? 'Sorteando...' : 'Número Sorteado'}
              </span>
            </div>

            <button
              onClick={handleSortearAleatorio}
              disabled={animando || cotasElegiveis.length === 0}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition ${
                animando || cotasElegiveis.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/25 active:scale-[0.98]'
              }`}
            >
              <Sparkles className="w-5 h-5 fill-slate-950" />
              {animando ? 'SORTEANDO...' : 'Sortear'}
            </button>
          </div>

        </div>
      )}

      {/* MODO 2: LOTERIA FEDERAL */}
      {metodoSorteio === 'loteria' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="max-w-md mx-auto space-y-4">
            <div>
              <h3 className="text-base font-black text-white mb-1">
                Conferência da Loteria Federal
              </h3>
              <p className="text-xs text-slate-400">
                Insira os números extraídos da Loteria Federal na ordem dos prêmios para apurar a cota vencedora automaticamente.
              </p>
            </div>

            <form onSubmit={handleApurarFederal} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">1º Prêmio *</label>
                <input
                  type="text"
                  placeholder="Ex: 98221"
                  value={premio1}
                  onChange={e => setPremio1(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 font-mono text-sm text-white focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">2º Prêmio</label>
                <input
                  type="text"
                  placeholder="Ex: 43212"
                  value={premio2}
                  onChange={e => setPremio2(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 font-mono text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">3º Prêmio</label>
                <input
                  type="text"
                  placeholder="Ex: 11093"
                  value={premio3}
                  onChange={e => setPremio3(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 font-mono text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 mt-2"
              >
                Apurar por Loteria Federal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* POP-UP MODAL DO GANHADOR REVELADO */}
      {modalGanhadorOpen && resultadoFinal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border-2 border-amber-400/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 relative">
            
            <button
              onClick={() => setModalGanhadorOpen(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-8 h-8" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                Ganhador Sorteado!
              </span>
              <h3 className="text-2xl font-black text-white">
                {resultadoFinal.ganhador?.nome || 'Ganhador Verificado'}
              </h3>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <span className="text-slate-400">Campanha:</span>
                <span className="font-bold text-white text-right max-w-[200px] truncate">{campanhaAtual.titulo}</span>
              </div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <span className="text-slate-400">Cota Sorteada:</span>
                <span className="font-mono font-black text-emerald-400 text-base">
                  {resultadoFinal.campanha?.numeroSorteado || numeroAnimado}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">WhatsApp:</span>
                <span className="font-mono font-bold text-emerald-300">
                  {resultadoFinal.ganhador?.whatsapp || 'Não informado'}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {resultadoFinal.ganhador?.whatsapp && (
                <a
                  href={`https://wa.me/${formatWhatsapp(resultadoFinal.ganhador.whatsapp)}?text=${encodeURIComponent(`Parabéns ${resultadoFinal.ganhador.nome}! Você ganhou a rifa ${campanhaAtual.titulo} com a cota ${resultadoFinal.campanha?.numeroSorteado || numeroAnimado}! 🎉`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20"
                >
                  <Phone className="w-4 h-4" />
                  Mandar Mensagem no WhatsApp
                </a>
              )}

              <button
                onClick={copiarComprovanteTexto}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-slate-700"
              >
                {copiado ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiado ? 'Texto Copiado!' : 'Copiar Comprovante'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
