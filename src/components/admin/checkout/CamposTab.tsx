import React from 'react';
import { ShieldCheck, Tag, Trash2, Plus } from 'lucide-react';
import { CheckoutConfigExtended } from './types_private';
import { CupomDesconto } from '../../../types';

interface CamposTabProps {
  checkoutConfig: CheckoutConfigExtended;
  upd: (patch: Partial<CheckoutConfigExtended>) => void;
}

export const CamposTab: React.FC<CamposTabProps> = ({
  checkoutConfig,
  upd,
}) => {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 4. Campos Obrigatórios */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> 4. Campos Obrigatórios no Checkout
        </h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-950 transition-colors">
            <input
              type="checkbox"
              checked={checkoutConfig.exigirCpf || false}
              onChange={e => upd({ exigirCpf: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
            />
            <span className="text-xs text-slate-200 font-medium">Exigir CPF do comprador para participar</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-950 transition-colors">
            <input
              type="checkbox"
              checked={checkoutConfig.exigirEmail || false}
              onChange={e => upd({ exigirEmail: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
            />
            <span className="text-xs text-slate-200 font-medium">Exigir E-mail do comprador para confirmação</span>
          </label>

          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checkoutConfig.coletaDados?.coletarEndereco?.ativo || false}
                onChange={e => upd({
                  coletaDados: {
                    ...(checkoutConfig.coletaDados || {}),
                    coletarEndereco: {
                      ...(checkoutConfig.coletaDados?.coletarEndereco || {}),
                      ativo: e.target.checked
                    }
                  }
                })}
                className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
              />
              <div>
                <span className="text-xs text-slate-200 font-medium block">Coletar Endereço Completo do Comprador</span>
                <span className="text-[11px] text-slate-400 block">Exibe campos de CEP, Logradouro, Número, Bairro, Cidade e UF no checkout</span>
              </div>
            </label>
            {checkoutConfig.coletaDados?.coletarEndereco?.ativo && (
              <label className="flex items-center gap-3 pl-7 pt-1.5 cursor-pointer border-t border-slate-800/60 mt-2">
                <input
                  type="checkbox"
                  checked={checkoutConfig.coletaDados?.coletarEndereco?.obrigatorio || false}
                  onChange={e => upd({
                    coletaDados: {
                      ...(checkoutConfig.coletaDados || {}),
                      coletarEndereco: {
                        ...(checkoutConfig.coletaDados?.coletarEndereco || {}),
                        obrigatorio: e.target.checked
                      }
                    }
                  })}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <span className="text-xs text-amber-400 font-medium">Tornar preenchimento do endereço OBRIGATÓRIO</span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* 7. Cupom de Desconto */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Tag className="w-4 h-4 text-emerald-400" /> 7. Cupom de Desconto
        </h2>
        <label className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-950 transition-colors">
          <div>
            <p className="text-xs font-bold text-white">Ativar Campo de Cupom no Checkout</p>
            <p className="text-[11px] text-slate-400">Permite que o comprador insira códigos promocionais</p>
          </div>
          <div
            onClick={() => upd({ cupomAtivo: !checkoutConfig.cupomAtivo, exibirCupom: !checkoutConfig.cupomAtivo })}
            className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${checkoutConfig.cupomAtivo ? 'bg-emerald-500' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checkoutConfig.cupomAtivo ? 'translate-x-6' : 'translate-x-1'}`} />
          </div>
        </label>

        {checkoutConfig.cupomAtivo && (
          <div className="space-y-3 pt-1">
            {(!checkoutConfig.cupons || checkoutConfig.cupons.length === 0) && (
              <p className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                ⚠️ Adicione pelo menos um cupom abaixo para que os compradores possam utilizá-lo.
              </p>
            )}

            {(checkoutConfig.cupons || []).map((cup, i) => (
              <div key={cup.id || i} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={cup.codigo}
                    onChange={e => {
                      const arr = [...(checkoutConfig.cupons || [])];
                      arr[i] = { ...arr[i], codigo: e.target.value.toUpperCase().replace(/\s/g, '') };
                      upd({ cupons: arr });
                    }}
                    placeholder="CÓDIGO (ex: VOLTA10)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white uppercase font-mono font-bold focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const arr = (checkoutConfig.cupons || []).filter((_, idx) => idx !== i);
                      upd({ cupons: arr });
                    }}
                    className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                    title="Remover cupom"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={cup.tipo || 'percentual'}
                    onChange={e => {
                      const arr = [...(checkoutConfig.cupons || [])];
                      arr[i] = { ...arr[i], tipo: e.target.value as 'percentual' | 'fixo' };
                      upd({ cupons: arr });
                    }}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="percentual">Desconto em %</option>
                    <option value="fixo">Valor fixo (R$)</option>
                  </select>
                  {(cup.tipo || 'percentual') === 'fixo' ? (
                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-3 focus-within:border-emerald-500">
                      <span className="text-slate-500 text-xs mr-1">R$</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={cup.valorFixo ?? ''}
                        onChange={e => {
                          const arr = [...(checkoutConfig.cupons || [])];
                          arr[i] = { ...arr[i], valorFixo: Number(e.target.value) };
                          upd({ cupons: arr });
                        }}
                        placeholder="5,00"
                        className="w-full bg-transparent py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-3 focus-within:border-emerald-500">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={cup.descontoPct ?? ''}
                        onChange={e => {
                          const arr = [...(checkoutConfig.cupons || [])];
                          arr[i] = { ...arr[i], descontoPct: Number(e.target.value) };
                          upd({ cupons: arr });
                        }}
                        placeholder="10"
                        className="w-full bg-transparent py-2 text-xs text-white focus:outline-none"
                      />
                      <span className="text-slate-500 text-xs ml-1">%</span>
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cup.ativo !== false}
                    onChange={e => {
                      const arr = [...(checkoutConfig.cupons || [])];
                      arr[i] = { ...arr[i], ativo: e.target.checked };
                      upd({ cupons: arr });
                    }}
                    className="w-3.5 h-3.5 rounded text-emerald-500 bg-slate-900 border-slate-700/50 cursor-pointer"
                  />
                  Cupom ativo para uso
                </label>
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                const novo: CupomDesconto = {
                  id: `cup-${Date.now()}`,
                  codigo: '',
                  tipo: 'percentual',
                  descontoPct: 10,
                  valorFixo: 0,
                  ativo: true,
                  criadoEm: new Date().toISOString()
                };
                upd({ cupons: [...(checkoutConfig.cupons || []), novo] });
              }}
              className="w-full flex items-center justify-center gap-2 p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Adicionar cupom
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
