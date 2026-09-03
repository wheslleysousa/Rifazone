const fs = require('fs');
const path = 'src/components/CampanhaPublicaView.tsx';
let code = fs.readFileSync(path, 'utf8');

const lines = code.split('\n');
const startIndex = lines.findIndex((l, i) => i === 3770 && l.includes("checkoutPasso === 'final'")); // Index 3770 is line 3771
const endIndex = lines.findIndex((l, i) => i > 3770 && l.includes(") : (") && lines[i+1] && lines[i+1].includes("<form onSubmit={handleEnviarPedido}"));

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = `            {checkoutPasso === 'final' && pedidoGerado ? (
              <div className="space-y-5 py-2 animate-in fade-in duration-300">
                {pedidoGerado.metodo === 'pix' && (
                  <PixPaymentModal
                    inline={true}
                    pedidoId={pedidoGerado.pedidoId}
                    pixCopiaCola={pedidoGerado.pixCopiaCola || ''}
                    pixQrCodeBase64={pedidoGerado.pixQrCodeBase64 || ''}
                    valorTotal={pedidoGerado.valorTotal}
                    quantidade={pedidoGerado.quantidade}
                    expiraEm={pedidoGerado.expiraEm || new Date().toISOString()}
                    isMock={pedidoGerado.isMock}
                    compradorNome={pedidoGerado.compradorNome || nome}
                    compradorWhatsapp={pedidoGerado.compradorWhatsapp || whatsapp.replace(/\\D/g, '')}
                    tituloCampanha={campanha.titulo}
                    confirmacaoConfig={campanha?.checkout?.confirmacao}
                    onSuccess={() => {
                      const pixelId = campanha?.metaPixelId || data?.marca?.metaPixelId;
                      if (pixelId && campanha) {
                        trackPurchase(pixelId, {
                          contentIds: [campanha.id],
                          value: pedidoGerado.valorTotal,
                          numItems: pedidoGerado.quantidade
                        }, pedidoGerado.pedidoId);
                      }
                      carregarCampanha(true);
                    }}
                    onClose={() => {
                      setCheckoutPasso('dados');
                      setPedidoGerado(null);
                      carregarCampanha(true);
                    }}
                    onVerMeusNumeros={() => {
                      setCheckoutAberto(false);
                      setMeusNumerosAberto(true);
                      carregarCampanha(true);
                    }}
                    onGerarNovoPix={() => {
                      setCheckoutPasso('dados');
                      setPedidoGerado(null);
                      carregarCampanha(true);
                      setTimeout(() => {
                        const el = document.getElementById('input-nome-comprador');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                  />
                )}
                
                {pedidoGerado.metodo === 'boleto' && (
                  <BoletoPaymentModal
                    inline={true}
                    pedidoId={pedidoGerado.pedidoId}
                    boletoUrl={pedidoGerado.boletoUrl || ''}
                    boletoBarcode={pedidoGerado.boletoBarcode || ''}
                    linhaDigitavel={pedidoGerado.linhaDigitavel || ''}
                    valorTotal={pedidoGerado.valorTotal}
                    quantidade={pedidoGerado.quantidade}
                    expiraEm={pedidoGerado.expiraEm || new Date().toISOString()}
                    compradorNome={pedidoGerado.compradorNome || nome}
                    compradorWhatsapp={pedidoGerado.compradorWhatsapp || whatsapp}
                    onClose={() => {
                      setCheckoutPasso('dados');
                      setPedidoGerado(null);
                      carregarCampanha(true);
                    }}
                  />
                )}
                
                {pedidoGerado.metodo === 'cartao' && (
                  <CartaoSuccessModal
                    inline={true}
                    pedidoId={pedidoGerado.pedidoId}
                    valorTotal={pedidoGerado.valorTotal}
                    quantidade={pedidoGerado.quantidade}
                    numeros={pedidoGerado.numeros || []}
                    cartaoInfo={pedidoGerado.cartaoInfo || { ultimosDigitos: '', bandeira: '', parcelas: 1 }}
                    compradorNome={pedidoGerado.compradorNome || nome}
                    confirmacaoConfig={campanha?.checkout?.confirmacao}
                    onClose={() => {
                      setCheckoutPasso('dados');
                      setPedidoGerado(null);
                      carregarCampanha(true);
                    }}
                  />
                )}
              </div>
            ) : (`;
  
  lines.splice(startIndex, endIndex - startIndex + 1, newContent);
  fs.writeFileSync(path, lines.join('\n'), 'utf8');
} else {
  console.log("Not found", startIndex, endIndex);
}
