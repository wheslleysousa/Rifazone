import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, FileText, CheckCircle2, ShieldCheck, ArrowLeft, Save, AlertCircle } from 'lucide-react';

interface Props {
  onClose: () => void;
  exigirCpf?: boolean;
  exigirEmail?: boolean;
  onSalvarSucesso?: (dados: { nome: string; whatsapp: string; cpf: string; email: string; maiorIdade: boolean }) => void;
}

export const MeusDadosModal: React.FC<Props> = ({
  onClose,
  exigirCpf = false,
  exigirEmail = false,
  onSalvarSucesso
}) => {
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [maiorIdade, setMaiorIdade] = useState(true);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState('');

  const formatWhatsapp = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) return raw;
    if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  };

  const formatCpf = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 3) return raw;
    if (raw.length <= 6) return `${raw.slice(0, 3)}.${raw.slice(3)}`;
    if (raw.length <= 9) return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
    return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
  };

  useEffect(() => {
    try {
      const savedNome = localStorage.getItem('rifapix_comprador_nome');
      const savedPhone = localStorage.getItem('rifapix_comprador_whatsapp');
      const savedCpf = localStorage.getItem('rifapix_comprador_cpf');
      const savedEmail = localStorage.getItem('rifapix_comprador_email');
      const savedIdade = localStorage.getItem('rifapix_comprador_maior_idade');

      if (savedNome) setNome(savedNome);
      if (savedPhone) setWhatsapp(formatWhatsapp(savedPhone));
      if (savedCpf) setCpf(formatCpf(savedCpf));
      if (savedEmail) setEmail(savedEmail);
      if (savedIdade !== null) setMaiorIdade(savedIdade === 'true');
    } catch (e) {}
  }, []);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!nome.trim() || nome.trim().split(' ').length < 2) {
      setErro('Por favor, informe seu nome e sobrenome completos.');
      return;
    }

    const cleanPhone = whatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErro('Informe um número de WhatsApp válido com DDD (ex: 11 99999-8888).');
      return;
    }

    if (!maiorIdade) {
      setErro('É obrigatório ter no mínimo 18 anos para participar dos sorteios.');
      return;
    }

    if (exigirCpf && cpf.replace(/\D/g, '').length !== 11) {
      setErro('Informe um CPF válido com 11 dígitos.');
      return;
    }

    if (exigirEmail && (!email.trim() || !email.includes('@'))) {
      setErro('Informe um endereço de e-mail válido.');
      return;
    }

    try {
      localStorage.setItem('rifapix_comprador_nome', nome.trim());
      localStorage.setItem('rifapix_comprador_whatsapp', cleanPhone);
      localStorage.setItem('rifapix_comprador_cpf', cpf.trim());
      localStorage.setItem('rifapix_comprador_email', email.trim());
      localStorage.setItem('rifapix_comprador_maior_idade', String(maiorIdade));

      setSalvo(true);
      if (onSalvarSucesso) {
        onSalvarSucesso({
          nome: nome.trim(),
          whatsapp: cleanPhone,
          cpf: cpf.trim(),
          email: email.trim(),
          maiorIdade
        });
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (e) {
      setErro('Erro ao salvar dados localmente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-white my-8 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white leading-tight">
                Meus Dados de Participante
              </h3>
              <span className="text-[11px] text-slate-400">
                Cadastro e identificação para compra
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
          💡 Seus dados ficam salvos de forma prática para preencher automaticamente na hora de escolher suas cotas e para que você consulte seus números a qualquer momento.
        </p>

        <form onSubmit={handleSalvar} className="space-y-3.5">
          {/* Nome */}
          <div>
            <label className="text-xs font-bold text-slate-200 block mb-1">
              Nome Completo *
            </label>
            <div className="relative">
              <input
                id="modal-input-nome"
                type="text"
                placeholder="Ex: Wheslley de Sousa Aviz"
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="text-xs font-bold text-slate-200 block mb-1">
              WhatsApp com DDD (para receber os bilhetes) *
            </label>
            <div className="relative">
              <input
                id="modal-input-whatsapp"
                type="tel"
                placeholder="(95) 98404-9808"
                value={whatsapp}
                onChange={e => setWhatsapp(formatWhatsapp(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          {/* Confirmação de Idade (+18 anos) */}
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                id="modal-check-maior-idade"
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

          {/* CPF (opcional ou obrigatório se a rifa exigir) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-200">
                CPF {exigirCpf ? '*' : '(Opcional)'}
              </label>
              {exigirCpf && (
                <span className="text-[10px] text-amber-400 font-bold">Obrigatório nesta rifa</span>
              )}
            </div>
            <input
              id="modal-input-cpf"
              type="text"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={e => setCpf(formatCpf(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none placeholder:text-slate-600"
              required={exigirCpf}
            />
          </div>

          {/* E-mail (opcional ou obrigatório) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-200">
                E-mail {exigirEmail ? '*' : '(Opcional)'}
              </label>
              {exigirEmail && (
                <span className="text-[10px] text-amber-400 font-bold">Obrigatório nesta rifa</span>
              )}
            </div>
            <input
              id="modal-input-email"
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none placeholder:text-slate-600"
              required={exigirEmail}
            />
          </div>

          {erro && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {salvo && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Dados salvos com sucesso! Preenchimento automático ativo.</span>
            </div>
          )}

          <div className="pt-2">
            <button
              id="btn-salvar-meus-dados"
              type="submit"
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              Salvar Meus Dados
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
