const fs = require('fs');
let code = fs.readFileSync('src/components/admin/TemaBuilderView.tsx', 'utf8');

const timerConfig = `
                {/* Timer de Urgência */}
                <div className="space-y-3 pt-3 border-t border-slate-800/50">
                  <label className="text-xs font-bold text-slate-300 block">Timer de Urgência no Checkout</label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-emerald-500 w-4 h-4"
                      checked={campanha.checkout?.timerUrgencia?.ativo ?? false}
                      onChange={e => onChangeCampanha(prev => ({ ...prev, checkout: { ...(prev.checkout || DEFAULT_CHECKOUT_CONFIG), timerUrgencia: { ...(prev.checkout?.timerUrgencia), ativo: e.target.checked } } }))}
                    />
                    <span className="text-xs text-slate-400">Ativar cronômetro de escassez</span>
                  </label>

                  {campanha.checkout?.timerUrgencia?.ativo && (
                    <div className="pl-6 space-y-2">
                      <label className="text-[11px] text-slate-400 block">Duração (Minutos)</label>
                      <input 
                        type="number"
                        min="1"
                        max="60"
                        value={campanha.checkout?.timerUrgencia?.minutos || 10}
                        onChange={e => onChangeCampanha(prev => ({ ...prev, checkout: { ...(prev.checkout || DEFAULT_CHECKOUT_CONFIG), timerUrgencia: { ...(prev.checkout?.timerUrgencia), minutos: parseInt(e.target.value) } } }))}
                        className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>
`;

code = code.replace("{/* Métodos de Pagamento */}", timerConfig + "\n                {/* Métodos de Pagamento */}");

fs.writeFileSync('src/components/admin/TemaBuilderView.tsx', code);
