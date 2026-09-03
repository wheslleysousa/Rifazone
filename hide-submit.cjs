const fs = require('fs');
const path = 'src/components/CampanhaPublicaView.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetSubmit = `<button
                id="btn-confirmar-gerar-pix"
                type="submit"
                disabled={enviandoPedido || !maiorIdade}`;

const replacementSubmit = `{(!hasDivisor || etapaAtual === 2) && (
              <button
                id="btn-confirmar-gerar-pix"
                type="submit"
                disabled={enviandoPedido || !maiorIdade}`;

if (code.includes(targetSubmit)) {
  code = code.replace(targetSubmit, replacementSubmit);
}

const targetEndSubmit = `                  campanha.modalidade === 'gratis'
                    ? '🎁 CONCLUIR MINHA INSCRIÇÃO GRÁTIS'
                    : metodoPagamento === 'cartao'
                    ? 'PAGAR COM CARTÃO AGORA'
                    : metodoPagamento === 'boleto'
                    ? 'GERAR BOLETO BANCÁRIO'
                    : 'GERAR PIX AGORA'
                )}
              </button>`;

const replacementEndSubmit = `                  campanha.modalidade === 'gratis'
                    ? '🎁 CONCLUIR MINHA INSCRIÇÃO GRÁTIS'
                    : metodoPagamento === 'cartao'
                    ? 'PAGAR COM CARTÃO AGORA'
                    : metodoPagamento === 'boleto'
                    ? 'GERAR BOLETO BANCÁRIO'
                    : 'GERAR PIX AGORA'
                )}
              </button>
            )}`;

if (code.includes(targetEndSubmit)) {
  code = code.replace(targetEndSubmit, replacementEndSubmit);
}

fs.writeFileSync(path, code, 'utf8');
