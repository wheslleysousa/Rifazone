const fs = require('fs');
const path = 'src/components/CampanhaPublicaView.tsx';
let code = fs.readFileSync(path, 'utf8');

// The Pix Payment modal shouldn't be rendered if we are just checking out
// It should only be rendered INLINE where the form was if we are in step 2.
// BUT we also need to keep the modals working for other flows (like from "Meus Numeros").
// Wait, the easiest way to make it look like a seamless checkout flow is:
// If step === 2 and it's Pix, just show the PixPaymentModal inline INSTEAD of the form.
// But what about Boleto and Cartao? They also have modals.

const targetForm = `                  </>
                );
              })()}
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Pix Gerado */}`;

// The PixModalData state is set when the payment succeeds via the API.
// And it renders the PixPaymentModal at the end of the file.
// If we pass inline={true} when it's part of the main flow, and inline={false} otherwise...
// Actually, when it's inline, it replaces the form?
// But PixPaymentModal is outside the form container.
// It's rendered at the root of CampanhaPublicaView.
// When inline is true, it won't be a popup, but it will still be at the root, making it look weird if it's below the header/banner.
// If we want it to replace the form, we should render it INSIDE the main block if we have pixModalData.

const replacementForm = `                  </>
                );
              })()}
              </form>
            )}
            
            {/* Inline Payment Result */}
            {pixModalData && (
              <div className="mt-4 animate-in fade-in duration-300">
                <PixPaymentModal
                  inline={true}
                  pedidoId={pixModalData.pedidoId}
                  pixCopiaCola={pixModalData.pixCopiaCola}
                  pixQrCodeBase64={pixModalData.pixQrCodeBase64}
                  valorTotal={pixModalData.valorTotal}
                  quantidade={pixModalData.quantidade}
                  expiraEm={pixModalData.expiraEm}
                  isMock={pixModalData.isMock}
                  compradorNome={pixModalData.compradorNome || nome}
                  compradorWhatsapp={pixModalData.compradorWhatsapp || whatsapp.replace(/\\D/g, '')}
                  tituloCampanha={campanha.titulo}
                  confirmacaoConfig={campanha?.checkout?.confirmacao}
                  onSuccess={() => {
                    const pixelId = campanha?.metaPixelId || data?.marca?.metaPixelId;
                    if (pixelId && campanha && pixModalData) {
                      trackPurchase(pixelId, {
                        contentIds: [campanha.id],
                        value: pixModalData.valorTotal,
                        numItems: pixModalData.quantidade
                      }, pixModalData.pedidoId);
                    }
                    carregarCampanha(true);
                  }}
                  onClose={() => {
                    setPixModalData(null);
                    carregarCampanha(true);
                  }}
                  onVerMeusNumeros={() => {
                    setPixModalData(null);
                    setMeusNumerosAberto(true);
                    carregarCampanha(true);
                  }}
                  onGerarNovoPix={() => {
                    setPixModalData(null);
                    carregarCampanha(true);
                    setTimeout(() => {
                      const el = document.getElementById('input-nome-comprador');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                />
              </div>
            )}
            
            {boletoModalData && (
              <div className="mt-4 animate-in fade-in duration-300">
                <BoletoPaymentModal
                  inline={true}
                  pedidoId={boletoModalData.pedidoId}
                  boletoUrl={boletoModalData.boletoUrl}
                  boletoBarcode={boletoModalData.boletoBarcode}
                  linhaDigitavel={boletoModalData.linhaDigitavel}
                  valorTotal={boletoModalData.valorTotal}
                  quantidade={boletoModalData.quantidade}
                  expiraEm={boletoModalData.expiraEm}
                  compradorNome={boletoModalData.compradorNome}
                  compradorWhatsapp={boletoModalData.compradorWhatsapp}
                  onClose={() => {
                    setBoletoModalData(null);
                    carregarCampanha(true);
                  }}
                />
              </div>
            )}
            
            {cartaoSuccessModalData && (
              <div className="mt-4 animate-in fade-in duration-300">
                <CartaoSuccessModal
                  inline={true}
                  pedidoId={cartaoSuccessModalData.pedidoId}
                  valorTotal={cartaoSuccessModalData.valorTotal}
                  quantidade={cartaoSuccessModalData.quantidade}
                  numeros={cartaoSuccessModalData.numeros}
                  cartaoInfo={cartaoSuccessModalData.cartaoInfo}
                  compradorNome={cartaoSuccessModalData.compradorNome}
                  confirmacaoConfig={campanha?.checkout?.confirmacao}
                  onClose={() => {
                    setCartaoSuccessModalData(null);
                    carregarCampanha(true);
                  }}
                />
              </div>
            )}

          </div>
        </div>
      )}

      {/* Modal Pix Gerado (Fallback for other usages if any) */}`;

// Let's modify where these modals are rendered so they replace the form.
