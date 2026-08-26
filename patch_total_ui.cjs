const fs = require('fs');
let code = fs.readFileSync('src/components/CampanhaPublicaView.tsx', 'utf8');

const regexUiTotal = /<div className="flex justify-between text-slate-300 border-t border-slate-700\/50 pt-1">\n\s*<span>Total:<\/span>/;

const newUiTotal = `{metodoPagamento === 'pix' && campanha.checkout?.pixConfig?.descontoPct && (
                  <div className="flex justify-between text-emerald-400 text-[11px] mb-1">
                    <span>Desconto Pix ({campanha.checkout.pixConfig.descontoPct}%)</span>
                    <span className="font-bold">- {formatarMoeda(valorSemCupom * (campanha.checkout.pixConfig.descontoPct / 100))}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300 border-t border-slate-700/50 pt-1">
                  <span>Total:</span>`;

code = code.replace(regexUiTotal, newUiTotal);

fs.writeFileSync('src/components/CampanhaPublicaView.tsx', code);
