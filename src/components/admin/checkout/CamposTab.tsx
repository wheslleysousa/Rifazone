import React from 'react';
import { 
  User, Phone, Mail, ShieldCheck, Calendar, HeartHandshake, 
  MapPin, AtSign, CheckCheck, Tag, Trash2, Plus, Sliders, Check, HelpCircle
} from 'lucide-react';
import { CheckoutConfigExtended } from './types_private';
import { CupomDesconto, obterConfigCamposCheckout } from '../../../types';

interface CamposTabProps {
  checkoutConfig: CheckoutConfigExtended;
  upd: (patch: Partial<CheckoutConfigExtended>) => void;
}

interface CampoItemDef {
  id: 'nome' | 'telefone' | 'confirmarTelefone' | 'email' | 'cpf' | 'dataNascimento' | 'nomeSocial' | 'endereco' | 'redesSociais';
  label: string;
  descricao: string;
  placeholderExemplo: string;
  icon: React.ElementType;
  obrigatorioRecomendado?: boolean;
}

const LISTA_CAMPOS: CampoItemDef[] = [
  {
    id: 'nome',
    label: 'Nome do Cliente / Nome Completo',
    descricao: 'Nome para emissão das cotas e identificação oficial no sorteio.',
    placeholderExemplo: 'Ex: Maria Silva Santos',
    icon: User,
    obrigatorioRecomendado: true
  },
  {
    id: 'telefone',
    label: 'Número de Telefone / WhatsApp com DDD',
    descricao: 'Contato principal para envio do bilhete por mensagem e verificação.',
    placeholderExemplo: 'Ex: (11) 98765-4321',
    icon: Phone,
    obrigatorioRecomendado: true
  },
  {
    id: 'confirmarTelefone',
    label: 'Confirmar Número de Telefone / WhatsApp',
    descricao: 'Exige confirmação dupla do número para evitar digitação incorreta.',
    placeholderExemplo: 'Confirmação do WhatsApp',
    icon: CheckCheck
  },
  {
    id: 'email',
    label: 'E-mail do Cliente',
    descricao: 'Envio de comprovante de compra e atualizações por correio eletrônico.',
    placeholderExemplo: 'Ex: cliente@email.com',
    icon: Mail
  },
  {
    id: 'cpf',
    label: 'CPF do Cliente',
    descricao: 'Documento individual do comprador para validação fiscal e auditoria.',
    placeholderExemplo: 'Ex: 123.456.789-00',
    icon: ShieldCheck
  },
  {
    id: 'dataNascimento',
    label: 'Data de Nascimento',
    descricao: 'Para conferência de maioridade legal (18+) ou aniversários.',
    placeholderExemplo: 'DD/MM/AAAA',
    icon: Calendar
  },
  {
    id: 'nomeSocial',
    label: 'Nome Social',
    descricao: 'Nome pelo qual pessoas trans e travestis preferem ser chamadas.',
    placeholderExemplo: 'Ex: Nome Social do participante',
    icon: HeartHandshake
  },
  {
    id: 'endereco',
    label: 'Endereço Completo de Entrega',
    descricao: 'Coleta CEP, Logradouro, Número, Bairro, Cidade e UF para prêmios físicos.',
    placeholderExemplo: 'CEP, Rua, Número, Cidade, UF',
    icon: MapPin
  },
  {
    id: 'redesSociais',
    label: 'Redes Sociais (@Instagram e @TikTok)',
    descricao: 'Identificador do perfil do comprador nas redes sociais.',
    placeholderExemplo: '@seu_instagram',
    icon: AtSign
  }
];

export const CamposTab: React.FC<CamposTabProps> = ({
  checkoutConfig,
  upd,
}) => {
  const configsAtuais = obterConfigCamposCheckout(checkoutConfig);

  const atualizarCampo = (
    campoId: CampoItemDef['id'],
    ativo: boolean,
    obrigatorio: boolean
  ) => {
    const novosCampos = {
      ...(checkoutConfig.coletaDados || {}),
      [campoId]: {
        ativo,
        obrigatorio: ativo ? obrigatorio : false
      }
    };

    // Sincroniza também flags legadas para compatibilidade máxima
    const patch: Partial<CheckoutConfigExtended> = {
      coletaDados: novosCampos
    };

    if (campoId === 'cpf') {
      patch.exigirCpf = ativo && obrigatorio;
    } else if (campoId === 'email') {
      patch.exigirEmail = ativo && obrigatorio;
    } else if (campoId === 'endereco') {
      patch.coletaDados = {
        ...novosCampos,
        coletarEndereco: {
          ativo,
          obrigatorio: ativo ? obrigatorio : false
        }
      };
    } else if (campoId === 'confirmarTelefone') {
      patch.coletaDados = {
        ...novosCampos,
        confirmarTelefone: {
          ativo,
          obrigatorio: ativo ? obrigatorio : false
        }
      };
    }

    upd(patch);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* 4. Campos do Checkout */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" /> 4. Campos do Checkout
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Defina com precisão quais informações serão pedidas no checkout e quais são obrigatórias.
            </p>
          </div>
        </div>

        {/* Lista de Campos com Sim/Não Dinâmicos */}
        <div className="space-y-3">
          {LISTA_CAMPOS.map(campo => {
            const Icon = campo.icon;
            const estado = configsAtuais[campo.id] || { ativo: false, obrigatorio: false };
            const estaAtivo = estado.ativo;
            const estaObrigatorio = estado.obrigatorio;

            return (
              <div 
                key={campo.id} 
                className={`p-3.5 rounded-xl border transition-all ${
                  estaAtivo 
                    ? 'bg-slate-950/80 border-slate-700/80 shadow-sm' 
                    : 'bg-slate-950/40 border-slate-800/60 opacity-75'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Informações do Campo */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                      estaAtivo ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">
                          {campo.label}
                        </span>
                        {estaAtivo && (
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                            estaObrigatorio
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          }`}>
                            {estaObrigatorio ? 'Obrigatório' : 'Opcional'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        {campo.descricao}
                      </p>
                    </div>
                  </div>

                  {/* Controles: Pedir no Checkout? + É Obrigatório? */}
                  <div className="flex items-center gap-4 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 w-full sm:w-auto justify-between sm:justify-end">
                    
                    {/* Toggle: Pedir no Checkout (Sim/Não) */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-300 font-medium">
                        Pedir no checkout:
                      </span>
                      <button
                        type="button"
                        onClick={() => atualizarCampo(campo.id, !estaAtivo, estaObrigatorio)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                          estaAtivo
                            ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {estaAtivo ? 'SIM' : 'NÃO'}
                      </button>
                    </div>

                    {/* Checkbox/Botão: É Obrigatório? */}
                    {estaAtivo && (
                      <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                        <span className="text-[11px] text-slate-400">Obrigatório:</span>
                        <button
                          type="button"
                          onClick={() => atualizarCampo(campo.id, true, !estaObrigatorio)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                            estaObrigatorio
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {estaObrigatorio ? 'SIM' : 'NÃO'}
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Cupom de Desconto */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Tag className="w-4 h-4 text-emerald-400" /> Cupom de Desconto
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
