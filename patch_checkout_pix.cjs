const fs = require('fs');
let code = fs.readFileSync('src/components/admin/TemaBuilderView.tsx', 'utf8');

const pixConfig = `
                {/* Configurações Avançadas do Pix */}
                {campanha.checkout?.metodos?.pix !== false && (
                  <div className="space-y-3 pt-3 border-t border-slate-800/50">
                    <label className="text-xs font-bold text-slate-300 block">Configurações Avançadas do Pix</label>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Desconto (%)</label>
                        <input 
                          type="number"
                          min="0"
                          max="100"
                          placeholder="Ex: 5"
                          value={campanha.checkout?.pixConfig?.descontoPct || ''}
                          onChange={e => onChangeCampanha(prev => ({ ...prev, checkout: { ...(prev.checkout || DEFAULT_CHECKOUT_CONFIG), pixConfig: { ...(prev.checkout?.pixConfig), descontoPct: parseFloat(e.target.value) || undefined } } }))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Ordem Gateways (Cascata)</label>
                        <select
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-emerald-500"
                        >
                          <option>Mercado Pago - Padrão</option>
                          <option>PushInPay &gt; Mercado Pago</option>
                          <option>Suitpay &gt; PushInPay</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
`;

code = code.replace("</label>\n                </div>\n              </div>", "</label>\n                </div>\n" + pixConfig + "              </div>");

fs.writeFileSync('src/components/admin/TemaBuilderView.tsx', code);
