const fs = require('fs');
let code = fs.readFileSync('src/components/admin/TemaBuilderView.tsx', 'utf8');

const regexPos = /\{\/\* 6\. SEÇÃO ESTILOS SALVOS \*\/\}/;

const newSection = `
          {/* SEÇÃO CHECKOUT E PAGAMENTO */}
          {secaoEditor === 'checkout' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 animate-in fade-in">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-emerald-400" />
                  Estrutura e Campos do Checkout
                </h3>
                <p className="text-xs text-slate-400">
                  Configure o layout do checkout, quais dados coletar do cliente e opções de pagamento.
                </p>
              </div>

              <div className="space-y-4">
                {/* Layout */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Modelo do Checkout</label>
                  <select
                    value={campanha.checkout?.layout || 'padrao'}
                    onChange={e => atualizarCampanha({ checkout: { ...(campanha.checkout || DEFAULT_CHECKOUT_CONFIG), layout: e.target.value as any } })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-emerald-500"
                  >
                    <option value="padrao">Checkout Original</option>
                    <option value="limpo">Checkout Limpo (Foco em Conversão)</option>
                    <option value="passos">Passo-a-Passo (Simplificado)</option>
                    <option value="rapido">Checkout Rápido (Com Urgência)</option>
                  </select>
                </div>

                {/* Coleta de Dados */}
                <div className="space-y-2 pt-3 border-t border-slate-800/50">
                  <label className="text-xs font-bold text-slate-300 block">Coleta de Dados</label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-emerald-500 w-4 h-4"
                      checked={campanha.checkout?.coletaDados?.exigirEmail ?? false}
                      onChange={e => atualizarCampanha({ checkout: { ...(campanha.checkout || DEFAULT_CHECKOUT_CONFIG), coletaDados: { ...(campanha.checkout?.coletaDados), exigirEmail: e.target.checked } } })}
                    />
                    <span className="text-xs text-slate-400">Coletar E-mail</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-emerald-500 w-4 h-4"
                      checked={campanha.checkout?.coletaDados?.confirmarEmail ?? false}
                      onChange={e => atualizarCampanha({ checkout: { ...(campanha.checkout || DEFAULT_CHECKOUT_CONFIG), coletaDados: { ...(campanha.checkout?.coletaDados), confirmarEmail: e.target.checked } } })}
                    />
                    <span className="text-xs text-slate-400">Exigir confirmação de E-mail</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-emerald-500 w-4 h-4"
                      checked={campanha.checkout?.coletaDados?.exigirCpf ?? false}
                      onChange={e => atualizarCampanha({ checkout: { ...(campanha.checkout || DEFAULT_CHECKOUT_CONFIG), coletaDados: { ...(campanha.checkout?.coletaDados), exigirCpf: e.target.checked } } })}
                    />
                    <span className="text-xs text-slate-400">Coletar CPF</span>
                  </label>
                </div>

                {/* Métodos de Pagamento */}
                <div className="space-y-2 pt-3 border-t border-slate-800/50">
                  <label className="text-xs font-bold text-slate-300 block">Formas de Pagamento Habilitadas</label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-emerald-500 w-4 h-4"
                      checked={campanha.checkout?.metodos?.pix ?? true}
                      onChange={e => atualizarCampanha({ checkout: { ...(campanha.checkout || DEFAULT_CHECKOUT_CONFIG), metodos: { ...(campanha.checkout?.metodos), pix: e.target.checked } } })}
                    />
                    <span className="text-xs text-slate-400">Pix</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-emerald-500 w-4 h-4"
                      checked={campanha.checkout?.metodos?.cartao ?? true}
                      onChange={e => atualizarCampanha({ checkout: { ...(campanha.checkout || DEFAULT_CHECKOUT_CONFIG), metodos: { ...(campanha.checkout?.metodos), cartao: e.target.checked } } })}
                    />
                    <span className="text-xs text-slate-400">Cartão de Crédito</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-emerald-500 w-4 h-4"
                      checked={campanha.checkout?.metodos?.boleto ?? false}
                      onChange={e => atualizarCampanha({ checkout: { ...(campanha.checkout || DEFAULT_CHECKOUT_CONFIG), metodos: { ...(campanha.checkout?.metodos), boleto: e.target.checked } } })}
                    />
                    <span className="text-xs text-slate-400">Boleto</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 6. SEÇÃO ESTILOS SALVOS */}`;

code = code.replace(regexPos, newSection);

fs.writeFileSync('src/components/admin/TemaBuilderView.tsx', code);
