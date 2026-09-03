const fs = require('fs');
const path = 'src/components/CampanhaPublicaView.tsx';
let code = fs.readFileSync(path, 'utf8');

// We need to add state for etapaAtual
const targetState = `const [checkoutPasso, setCheckoutPasso] = useState<'dados' | 'pagamento' | 'final'>('dados');`;
const replacementState = `const [checkoutPasso, setCheckoutPasso] = useState<'dados' | 'pagamento' | 'final'>('dados');
  const [etapaAtual, setEtapaAtual] = useState(1);`;

if (code.includes(targetState)) {
  code = code.replace(targetState, replacementState);
}

// We need to change the map logic
const targetMap = `              <form onSubmit={handleEnviarPedido} className="space-y-4">
              {(campanha.checkout?.ordemElementos && campanha.checkout.ordemElementos.length > 0
                ? campanha.checkout.ordemElementos
                : ['banner', 'temporizador', 'mensagemUrgencia', 'metodosPagamento', 'dadosComprador', 'cupomDesconto', 'resumoPedido', 'selosSeguranca']
              ).map((chave) => {`;

const replacementMap = `              <form onSubmit={handleEnviarPedido} className="space-y-4">
              {(() => {
                const elementos = campanha.checkout?.ordemElementos && campanha.checkout.ordemElementos.length > 0
                  ? campanha.checkout.ordemElementos
                  : ['banner', 'temporizador', 'mensagemUrgencia', 'dadosComprador', 'divisorEtapas', 'metodosPagamento', 'cupomDesconto', 'resumoPedido', 'selosSeguranca'];
                
                const hasDivisor = elementos.includes('divisorEtapas');
                const divisorIndex = elementos.indexOf('divisorEtapas');
                
                let visibleElements = elementos;
                if (hasDivisor) {
                  visibleElements = etapaAtual === 1 ? elementos.slice(0, divisorIndex) : elementos.slice(divisorIndex + 1);
                }

                return (
                  <>
                    {/* Botão de Voltar se estiver na Etapa 2 */}
                    {hasDivisor && etapaAtual === 2 && (
                      <button 
                        type="button" 
                        onClick={() => setEtapaAtual(1)}
                        className="mb-4 flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white transition"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Voltar para Coleta de Dados
                      </button>
                    )}

                    {visibleElements.map((chave) => {
                      if (chave === 'divisorEtapas') return null;`;

if (code.includes(targetMap)) {
  code = code.replace(targetMap, replacementMap);
}

// We need to add the "Continuar" button at the end of the form if etapaAtual === 1
const targetFormEnd = `              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Pix Gerado */}`;

const replacementFormEnd = `                    
                    {/* Action Button for Form */}
                    {hasDivisor && etapaAtual === 1 ? (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            // Validation before going to step 2
                            if (!nome.trim() || !whatsapp.trim()) {
                              setFormErro('Preencha seu Nome e WhatsApp para continuar.');
                              return;
                            }
                            setFormErro('');
                            setEtapaAtual(2);
                            setTimeout(() => {
                              const el = document.getElementById('btn-abrir-menu-lateral');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }}
                          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-black text-sm uppercase tracking-wider transition-all shadow-lg hover:shadow-xl active:scale-[0.98] cursor-pointer"
                          style={{
                            background: 'linear-gradient(to right, var(--btn-grad-start, var(--brand)), var(--btn-grad-end, var(--brand)))',
                            color: 'var(--btn-txt)'
                          }}
                        >
                          Continuar para Pagamento <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    ) : null}
                  </>
                );
              })()}
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Pix Gerado */}`;

if (code.includes(targetFormEnd)) {
  code = code.replace(targetFormEnd, replacementFormEnd);
}

fs.writeFileSync(path, code, 'utf8');
