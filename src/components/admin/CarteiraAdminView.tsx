import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, X, Clock, RefreshCw, Wallet, Users, ArrowUpRight, Settings } from 'lucide-react';

interface CarteiraAdminViewProps {
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const CarteiraAdminView: React.FC<CarteiraAdminViewProps> = ({ authFetch }) => {
  const [taxasPersonalizadasMap, setTaxasPersonalizadasMap] = useState<Record<string, { taxaVendaPct?: number; taxaSaqueImediato?: number; observacao?: string; atualizadoEm?: string }>>({});
  const [targetUserInput, setTargetUserInput] = useState('');
  const [targetTaxaVenda, setTargetTaxaVenda] = useState(3.0);
  const [targetTaxaSaque, setTargetTaxaSaque] = useState(0.0);
  const [targetObs, setTargetObs] = useState('');
  const [salvandoUserTaxa, setSalvandoUserTaxa] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState('');
  const [msgErro, setMsgErro] = useState('');
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);


  const [efiClientId, setEfiClientId] = useState('');
  const [efiClientSecret, setEfiClientSecret] = useState('');
  const [efiChavePix, setEfiChavePix] = useState('');
  const [efiAmbiente, setEfiAmbiente] = useState<'producao' | 'homologacao'>('producao');
  
  const [salvandoMaster, setSalvandoMaster] = useState(false);
  const [globalTaxaVenda, setGlobalTaxaVenda] = useState(5.0);
  const [globalTaxaSaque, setGlobalTaxaSaque] = useState(4.50);
  const [salvandoGlobal, setSalvandoGlobal] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const res = await authFetch('/api/admin/configuracoes');
      const data = await res.json();
      if (res.ok && data) {
        if (data.carteiraConfig?.taxasPersonalizadas) {
          setTaxasPersonalizadasMap(data.carteiraConfig.taxasPersonalizadas);
        }
        if (data.efipayConfig) {
          setEfiClientId(data.efipayConfig.clientId || '');
          setEfiClientSecret(data.efipayConfig.clientSecret || '');
          setEfiChavePix(data.efipayConfig.chavePix || '');
          setEfiAmbiente(data.efipayConfig.ambiente || 'producao');
        }
        if (data.carteiraConfig) {
          setGlobalTaxaVenda(data.carteiraConfig.taxaVendaPct ?? 5.0);
          setGlobalTaxaSaque(data.carteiraConfig.taxaSaqueImediato ?? 4.50);
        }
      }
    } catch (e) {}
  };

  const handleSalvarUserTaxa = async (targetUser: string, remover: boolean = false) => {
    if (!targetUser || !targetUser.trim()) {
      setMsgErro('Informe o e-mail ou ID do usuário.');
      return;
    }
    setSalvandoUserTaxa(true);
    setMsgSucesso('');
    setMsgErro('');
    try {
      const res = await authFetch('/api/admin/usuarios/taxa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUser: targetUser.trim(),
          taxaVendaPct: Number(targetTaxaVenda),
          taxaSaqueImediato: Number(targetTaxaSaque),
          observacao: targetObs.trim(),
          remover
        })
      });
      const data = await res.json();
      if (res.ok && data.taxasPersonalizadas) {
        setTaxasPersonalizadasMap(data.taxasPersonalizadas);
        setTargetUserInput('');
        setTargetObs('');
        setMsgSucesso(remover ? 'Taxa personalizada removida!' : 'Taxa de comissão do usuário atualizada com sucesso!');
      } else {
        setMsgErro(data.error || 'Erro ao atualizar taxa do usuário.');
      }
    } catch (e: any) {
      setMsgErro(e.message || 'Erro na requisição');
    } finally {
      setSalvandoUserTaxa(false);
    }
  };

  const handleSalvarMaster = async () => {
    setSalvandoMaster(true);
    setMsgSucesso('');
    setMsgErro('');
    try {
      const res = await authFetch('/api/admin/configuracoes/efi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: efiClientId,
          clientSecret: efiClientSecret,
          chavePix: efiChavePix,
          ambiente: efiAmbiente
        })
      });
      if (res.ok) {
        setMsgSucesso('Credenciais mestre Efí Pay salvas com sucesso!');
      } else {
        setMsgErro('Erro ao salvar credenciais.');
      }
    } catch (e: any) {
      setMsgErro('Erro na requisição.');
    } finally {
      setSalvandoMaster(false);
    }
  };

  
  
  const alterarStatusUsuario = async (userId: string, status: 'aprovado' | 'rejeitado') => {
    try {
      const res = await authFetch('/api/admin/configuracoes/status-carteira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status })
      });
      if (res.ok) {
        setUsuarios(prev => prev.map(u => u.ownerId === userId ? { ...u, carteiraConfig: { ...u.carteiraConfig, status } } : u));
        setMsgSucesso('Status alterado com sucesso!');
      } else {
        setMsgErro('Erro ao alterar status.');
      }
    } catch(e) {
      setMsgErro('Erro na requisição.');
    }
  };

  const handleSalvarGlobal = async () => {
    setSalvandoGlobal(true);
    setMsgSucesso('');
    setMsgErro('');
    try {
      const res = await authFetch('/api/admin/configuracoes/gerais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carteiraConfig: {
            taxaVendaPct: Number(globalTaxaVenda),
            taxaSaqueImediato: Number(globalTaxaSaque)
          }
        })
      });
      if (res.ok) {
        setMsgSucesso('Taxas globais padrão atualizadas com sucesso!');
      } else {
        setMsgErro('Erro ao salvar taxas globais.');
      }
    } catch (e: any) {
      setMsgErro('Erro na requisição.');
    } finally {
      setSalvandoGlobal(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          Administração da Carteira do Sistema
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Defina taxas personalizadas, credenciais mestres da Efí Pay e gerencie a carteira oficial.
        </p>
      </div>

      {msgSucesso && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-300 text-sm flex items-center gap-2">
          <Check className="w-5 h-5" />
          {msgSucesso}
        </div>
      )}

      {msgErro && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm flex items-center gap-2">
          <X className="w-5 h-5" />
          {msgErro}
        </div>
      )}

      
      {/* TAXAS GLOBAIS DA CARTEIRA DO SISTEMA */}
      <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
            <Wallet className="w-5 h-5 text-emerald-400" />
            Taxas Globais Padrão do Sistema
          </h5>
        </div>
        <p className="text-xs text-slate-400">Essas são as taxas cobradas de todos os organizadores (a não ser que tenham taxa personalizada abaixo).</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 block">Taxa sobre Vendas de Rifas (%) *</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={globalTaxaVenda}
              onChange={e => setGlobalTaxaVenda(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 block">Tarifa por Saque Solicitado (R$) *</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={globalTaxaSaque}
              onChange={e => setGlobalTaxaSaque(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={salvandoGlobal}
            onClick={handleSalvarGlobal}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow border border-emerald-400 transition flex items-center gap-2"
          >
            {salvandoGlobal ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Salvar Taxas Globais
          </button>
        </div>
      </div>

      {/* GERENCIADOR DE TAXAS PERSONALIZADAS */}
      <div className="p-4 bg-slate-950 border border-sky-500/30 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-black text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
            <Settings className="w-5 h-5 text-sky-400" />
            Taxas Personalizadas por Usuário
          </h5>
          <span className="text-[11px] text-slate-400 hidden sm:block">Ex: Reduzir taxa de cliente VIP</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-[11px] font-bold text-slate-300 block">E-mail ou ID do Usuário *</label>
            <input
              type="text"
              value={targetUserInput}
              onChange={e => setTargetUserInput(e.target.value)}
              placeholder="exemplo@usuario.com ou UID"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 block">Taxa Venda (%) *</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={targetTaxaVenda}
              onChange={e => setTargetTaxaVenda(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 block">Taxa Saque (R$) *</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={targetTaxaSaque}
              onChange={e => setTargetTaxaSaque(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-slate-300 block">Observação / Motivo</label>
            <input
              type="text"
              value={targetObs}
              onChange={e => setTargetObs(e.target.value)}
              placeholder="Ex: Cliente alto volume - VIP"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              disabled={salvandoUserTaxa}
              onClick={() => handleSalvarUserTaxa(targetUserInput)}
              className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl shadow border border-sky-400 transition flex items-center justify-center gap-1.5"
            >
              {salvandoUserTaxa ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Salvar Taxa
            </button>
          </div>
        </div>

        {Object.keys(taxasPersonalizadasMap).length > 0 && (
          <div className="space-y-2 pt-2">
            <h6 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
              Taxas Personalizadas Ativas ({Object.keys(taxasPersonalizadasMap).length})
            </h6>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {Object.entries(taxasPersonalizadasMap).map(([usrKey, item]) => {
                const val = item as { taxaVendaPct?: number; taxaSaqueImediato?: number; observacao?: string };
                return (
                  <div key={usrKey} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono">{usrKey}</span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-xs font-black">
                          Venda: {val.taxaVendaPct}%
                        </span>
                        <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 rounded text-xs font-black">
                          Saque: R$ {(val.taxaSaqueImediato ?? 0).toFixed(2)}
                        </span>
                      </div>
                      {val.observacao && (
                        <p className="text-xs text-slate-400 mt-1">{val.observacao}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSalvarUserTaxa(usrKey, true)}
                      className="px-3 py-1.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition"
                    >
                      Remover
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* DADOS MESTRE EFI PAY */}
      <div className="p-4 bg-slate-950 border border-amber-500/30 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            Configuração Mestre Efí Pay (Gateway Oficial)
          </h5>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 block">Ambiente *</label>
            <select
              value={efiAmbiente}
              onChange={e => setEfiAmbiente(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="producao">Produção (Valores Reais)</option>
              <option value="homologacao">Homologação (Testes)</option>
            </select>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 block">Chave Pix de Recebimento Global *</label>
            <input
              type="text"
              value={efiChavePix}
              onChange={e => setEfiChavePix(e.target.value)}
              placeholder="Chave Pix Mestre da Plataforma"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-300 block">Client ID *</label>
            <input
              type="text"
              value={efiClientId}
              onChange={e => setEfiClientId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-300 block">Client Secret *</label>
            <input
              type="password"
              value={efiClientSecret}
              onChange={e => setEfiClientSecret(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={salvandoMaster}
            onClick={handleSalvarMaster}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl shadow border border-amber-400 transition flex items-center gap-2"
          >
            {salvandoMaster ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Salvar Credenciais
          </button>
        </div>
      </div>
    </div>
  );
};
