import React from 'react';
import { CreditCard, QrCode, FileText, X, AlertTriangle, Sparkles, Sliders, Check } from 'lucide-react';
import { CheckoutConfigExtended } from './types_private';

interface PagamentoTabProps {
  checkoutConfig: CheckoutConfigExtended;
  upd: (patch: Partial<CheckoutConfigExtended>) => void;
  updMetodos: (patch: Partial<NonNullable<CheckoutConfigExtended['metodos']>>) => void;
  updMsgs: (patch: Partial<NonNullable<CheckoutConfigExtended['mensagens']>>) => void;
  selectedPaymentCard: 'pix' | 'cartao' | 'boleto';
  handleSelectPaymentCard: (method: 'pix' | 'cartao' | 'boleto') => void;
}

export const PagamentoTab: React.FC<PagamentoTabProps> = ({
  checkoutConfig,
  upd,
  updMetodos,
  updMsgs,
  selectedPaymentCard,
  handleSelectPaymentCard,
}) => {
  const isCurrentlyActive = checkoutConfig.metodos[selectedPaymentCard] !== false;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-400" /> Métodos de Pagamento Habilitados
          </h2>
          <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400 font-mono">
            Selecione um card para editar
          </span>
        </div>

        {/* Payment Method Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'pix', title: 'Pix', desc: 'Aprovação imediata', icon: QrCode, active: checkoutConfig.metodos.pix !== false, color: 'text-emerald-400', activeBg: 'bg-emerald-500/10 border-emerald-500', activeBadgeColor: 'bg-emerald-500/20 text-emerald-400' },
            { id: 'cartao', title: 'Cartão', desc: 'Até 12x parcelado', icon: CreditCard, active: checkoutConfig.metodos.cartao === true, color: 'text-blue-400', activeBg: 'bg-blue-500/10 border-blue-500', activeBadgeColor: 'bg-blue-500/20 text-blue-400' },
            { id: 'boleto', title: 'Boleto', desc: 'Até 3 dias úteis', icon: FileText, active: checkoutConfig.metodos.boleto === true, color: 'text-amber-400', activeBg: 'bg-amber-500/10 border-amber-500', activeBadgeColor: 'bg-amber-500/20 text-amber-400' }
          ].map(m => {
            const isSelected = selectedPaymentCard === m.id;
            const isAct = m.active;
            const IconComp = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectPaymentCard(m.id as any)}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-3 transition cursor-pointer relative ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950'
                    : 'hover:border-slate-700'
                } ${isAct ? m.activeBg : 'bg-slate-950/60 border-slate-800 text-slate-400'}`}
              >
                <div className="flex items-center justify-between w-full">
                  <IconComp className={`w-5 h-5 ${isAct ? m.color : 'text-slate-600'}`} />
                  <div className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${isAct ? m.activeBadgeColor : 'bg-slate-900 text-slate-500'}`}>
                    {isAct ? 'Ativo' : 'Inativo'}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-black text-white leading-none">{m.title}</p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">{m.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detalhes do Método Selecionado */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-900">
            <div>
              <p className="text-xs font-black text-white flex items-center gap-1.5">
                Configurando: <span className="text-indigo-400 uppercase font-mono font-black">{selectedPaymentCard}</span>
              </p>
              <p className="text-[10px] text-slate-500">
                {selectedPaymentCard === 'pix' && 'Aprovação por QR Code dinâmico e código copia e cola.'}
                {selectedPaymentCard === 'cartao' && 'Aceite as principais bandeiras com parcelamento automático.'}
                {selectedPaymentCard === 'boleto' && 'Opção para clientes tradicionais sem cartão de crédito.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const novoEstado = !isCurrentlyActive;
                updMetodos({ [selectedPaymentCard]: novoEstado });
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow ${
                isCurrentlyActive
                  ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold'
              }`}
            >
              {isCurrentlyActive ? (
                <>Desativar Método</>
              ) : (
                <>Ativar & Usar Método</>
              )}
            </button>
          </div>

          {/* Configurações secundárias do método selecionado se ele estiver ativo */}
          {isCurrentlyActive ? (
            <div className="space-y-4 pt-1 animate-in fade-in duration-200">
              {selectedPaymentCard === 'pix' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Desconto no Pix (%)</label>
                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 focus-within:border-indigo-500">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={checkoutConfig.pixConfig?.descontoPct ?? 0}
                        onChange={e => upd({
                          pixConfig: {
                            ...(checkoutConfig.pixConfig || {}),
                            descontoPct: Number(e.target.value)
                          }
                        })}
                        placeholder="0"
                        className="w-full bg-transparent py-2.5 text-xs text-white focus:outline-none"
                      />
                      <span className="text-slate-500 text-xs ml-1">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Rótulo do Pix no Checkout</label>
                    <input
                      type="text"
                      value={checkoutConfig.mensagens?.pix || ''}
                      onChange={e => updMsgs({ pix: e.target.value })}
                      placeholder="Escaneie o QR Code ou copie o código."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2.5 p-2 bg-slate-900/50 border border-slate-800 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checkoutConfig.pixConfig?.permitirComprovante || false}
                        onChange={e => upd({
                          pixConfig: {
                            ...(checkoutConfig.pixConfig || {}),
                            permitirComprovante: e.target.checked
                          }
                        })}
                        className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs text-slate-200 font-bold block">Permitir Envio de Comprovante manual</span>
                        <span className="text-[10px] text-slate-500 block">Oferece campo para anexar imagem se a aprovação automática falhar</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {selectedPaymentCard === 'cartao' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Parcelas Máximas</label>
                    <select
                      value={checkoutConfig.parcelasMax ?? 12}
                      onChange={e => upd({ parcelasMax: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                        <option key={n} value={n}>{n === 1 ? '1x à vista' : `Até ${n}x`}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Juros por Conta do</label>
                    <select
                      value={checkoutConfig.taxaParcelamento || 'comprador'}
                      onChange={e => upd({ taxaParcelamento: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="comprador">Comprador (Taxa de juros do gateway)</option>
                      <option value="organizador">Organizador (Sem juros para o cliente)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2.5 p-2 bg-slate-900/50 border border-slate-800 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checkoutConfig.cartaoConfig?.exibirValorParcelado !== false}
                        onChange={e => upd({
                          cartaoConfig: {
                            ...(checkoutConfig.cartaoConfig || {}),
                            exibirValorParcelado: e.target.checked
                          }
                        })}
                        className="w-4 h-4 rounded text-blue-500 bg-slate-950 border-slate-700 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs text-slate-200 font-bold block">Exibir Valor das Parcelas no Botão</span>
                        <span className="text-[10px] text-slate-500 block">Mostra ex: "ou 12x de R$ 1,50" abaixo do preço final</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {selectedPaymentCard === 'boleto' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Texto de Instrução do Boleto</label>
                    <input
                      type="text"
                      value={checkoutConfig.mensagens?.boleto || 'Vencimento em até 3 dias úteis. Compensação de 24h a 72h.'}
                      onChange={e => updMsgs({ boleto: e.target.value })}
                      placeholder="Vencimento em até 3 dias úteis. Compensação de 24h a 72h."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Selecionar como método padrão */}
              <div className="pt-2 border-t border-slate-900">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="metodoPrimario"
                    checked={checkoutConfig.metodoPrimario === selectedPaymentCard}
                    onChange={() => upd({ metodoPrimario: selectedPaymentCard })}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-950"
                  />
                  <div>
                    <span className="text-xs text-slate-200 font-bold block">Definir {selectedPaymentCard.toUpperCase()} como método padrão inicial</span>
                    <span className="text-[10px] text-slate-500 block">Este método aparecerá selecionado automaticamente para o cliente ao abrir a tela</span>
                  </div>
                </label>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                <X className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="font-bold text-slate-400">Método Desativado</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Clique em "Ativar & Usar Método" acima para aceitar esta forma de pagamento.</p>
              </div>
            </div>
          )}
        </div>

        {/* Personalização Completa do Botão de Pagamento */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-900">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Estilo do Botão Principal de Pagamento
            </h3>
            <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Botão CTA
            </span>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
              Texto do Botão
            </label>
            <input
              type="text"
              value={checkoutConfig.textoBotao || ''}
              onChange={e => upd({ textoBotao: e.target.value })}
              placeholder="Ex: FINALIZAR COMPRA AGORA"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'solido', label: 'Sólido Elegante' },
              { id: 'gradiente', label: 'Gradiente Brilhante' },
              { id: 'vidro', label: 'Vidro / Glass' },
              { id: 'borda', label: 'Borda Marcante' },
              { id: 'sombra_glow', label: 'Glow Neon' }
            ].map(st => {
              const isSel = (checkoutConfig.botaoEstilo || 'solido') === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => upd({ botaoEstilo: st.id as any })}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                    isSel 
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/40' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          {/* Cores e Dimensões do Botão */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
              <label className="text-[10px] font-bold text-slate-300 block">Cor do Fundo do Botão</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={checkoutConfig.botaoCorFundo || checkoutConfig.corPrimaria || '#10b981'}
                  onChange={e => upd({ botaoCorFundo: e.target.value })}
                  className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent p-0 shrink-0"
                />
                <input
                  type="text"
                  value={checkoutConfig.botaoCorFundo || checkoutConfig.corPrimaria || '#10b981'}
                  onChange={e => upd({ botaoCorFundo: e.target.value })}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white uppercase focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
              <label className="text-[10px] font-bold text-slate-300 block">Cor do Texto do Botão</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={checkoutConfig.botaoCorTexto || '#ffffff'}
                  onChange={e => upd({ botaoCorTexto: e.target.value })}
                  className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent p-0 shrink-0"
                />
                <input
                  type="text"
                  value={checkoutConfig.botaoCorTexto || '#ffffff'}
                  onChange={e => upd({ botaoCorTexto: e.target.value })}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white uppercase focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                <span>Arredondamento</span>
                <span className="font-mono text-amber-400">{checkoutConfig.botaoRaioBorda ?? 14}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                value={checkoutConfig.botaoRaioBorda ?? 14}
                onChange={e => upd({ botaoRaioBorda: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                <span>Altura do Botão</span>
                <span className="font-mono text-amber-400">{checkoutConfig.botaoAltura ?? 48}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                value={checkoutConfig.botaoAltura ?? 48}
                onChange={e => upd({ botaoAltura: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                <span>Tamanho da Fonte</span>
                <span className="font-mono text-amber-400">{checkoutConfig.botaoTamanhoFonte ?? 14}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                value={checkoutConfig.botaoTamanhoFonte ?? 14}
                onChange={e => upd({ botaoTamanhoFonte: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Alerta de nenhum método de pagamento ativo */}
        {!(checkoutConfig.metodos.pix !== false) && !checkoutConfig.metodos.cartao && !checkoutConfig.metodos.boleto && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black">Configure um método de pagamento!</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Nenhuma forma de pagamento está ativa no momento. É necessário ativar pelo menos uma (Pix, Cartão ou Boleto) para que este checkout funcione.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

