const fs = require('fs');

const path = 'src/components/admin/CheckoutBuilderView.tsx';
let code = fs.readFileSync(path, 'utf8');

const startMarker = '<div className="p-4 space-y-3 max-h-[560px] overflow-y-auto">';
const endMarker = '                  /* Preview da Tela de Compra Concluída (Sucesso) */';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log("Markers not found! startIndex:", startIndex, "endIndex:", endIndex);
  process.exit(1);
}

const replacement = `<div className="p-4 space-y-3 max-h-[560px] overflow-y-auto">
                      {(Array.isArray(checkoutConfig.ordemElementos) && checkoutConfig.ordemElementos.length > 0 ? checkoutConfig.ordemElementos : ELEMENTOS_CHECKOUT_PADRAO).map(chave => {
                        switch(chave) {
                          case 'banner':
                            return (
                              <React.Fragment key="banner">
                                {checkoutConfig.bannerTipo === 'video' && checkoutConfig.bannerVideoUrl ? (
                                  <div className="rounded-xl overflow-hidden border border-slate-800 shadow bg-slate-950">
                                    {checkoutConfig.bannerVideoUrl.includes('youtube.com') || checkoutConfig.bannerVideoUrl.includes('youtu.be') ? (
                                      <div className="aspect-video w-full max-h-48">
                                        <iframe
                                          src={checkoutConfig.bannerVideoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                          title="Vídeo do Checkout"
                                          className="w-full h-full"
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                          allowFullScreen
                                        />
                                      </div>
                                    ) : (
                                      <video
                                        src={checkoutConfig.bannerVideoUrl}
                                        controls autoPlay loop muted playsInline
                                        className="w-full max-h-44 object-contain bg-slate-950"
                                      />
                                    )}
                                  </div>
                                ) : checkoutConfig.bannerUrl ? (
                                  <div className="rounded-xl overflow-hidden border border-slate-800 shadow bg-slate-950 flex items-center justify-center">
                                    <img
                                      src={checkoutConfig.bannerUrl}
                                      alt="Banner"
                                      className={\`w-full \${checkoutConfig.bannerEnquadramento === 'cover' ? 'h-28 object-cover' : 'max-h-44 object-contain'} rounded-xl\`}
                                      onError={e => (e.currentTarget.style.display = 'none')}
                                    />
                                  </div>
                                ) : null}
                              </React.Fragment>
                            );
                          case 'selosSeguranca':
                            return (
                              <React.Fragment key="selosSeguranca">
                                {checkoutConfig.selosSeguranca && (checkoutConfig.selosExtras || []).length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 justify-center py-1">
                                    {SELOS_DISPONIVEIS.filter(s => (checkoutConfig.selosExtras || []).includes(s.id)).map(s => (
                                      <span key={s.id} className="text-[9px] text-slate-400 flex items-center gap-1 bg-slate-900/80 border border-slate-800 px-2 py-0.5 rounded-lg shadow-sm">
                                        {s.icon} {s.label}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          case 'mensagemUrgencia':
                            return (
                              <React.Fragment key="mensagemUrgencia">
                                {checkoutConfig.mensagens?.urgencia && (
                                  <div className="p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse" style={{ backgroundColor: \`\${primary}15\`, border: \`1px solid \${primary}40\`, color: primary }}>
                                    <Zap className="w-3.5 h-3.5 shrink-0" />{checkoutConfig.mensagens.urgencia}
                                  </div>
                                )}
                                {checkoutConfig.mensagemEscassez && (
                                  <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] font-bold text-red-400 text-center mt-2">
                                    {checkoutConfig.mensagemEscassez}
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          case 'temporizador':
                            return (
                              <React.Fragment key="temporizador">
                                {checkoutConfig.temporizadorAtivo && (
                                  <div
                                    className={\`p-2.5 rounded-xl flex items-center justify-between \${
                                      (checkoutConfig.temporizadorEstilo || 'fogo') === 'fogo'
                                        ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border border-orange-500/40 text-amber-300'
                                        : checkoutConfig.temporizadorEstilo === 'alerta'
                                          ? 'bg-red-500/15 border border-red-500/40 text-red-400 animate-pulse'
                                          : checkoutConfig.temporizadorEstilo === 'minimalista'
                                            ? 'bg-slate-900 border border-slate-700 text-slate-300'
                                            : 'bg-slate-950 border border-amber-500/30 text-amber-400 font-mono'
                                    }\`}
                                  >
                                    <span className="text-[11px] font-bold flex items-center gap-1">
                                      {(checkoutConfig.temporizadorEstilo || 'fogo') === 'fogo' && <Flame className="w-3.5 h-3.5 text-orange-400 animate-bounce" />}
                                      {checkoutConfig.temporizadorTexto || '⏱️ Sua reserva expira em'}
                                    </span>
                                    <span className="text-sm font-black font-mono">
                                      {String(checkoutConfig.temporizadorMinutos || 10).padStart(2,'0')}:00
                                    </span>
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          case 'metodosPagamento':
                            return (
                              <React.Fragment key="metodosPagamento">
                                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl mb-3">
                                  {checkoutConfig.metodos.pix !== false && (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewTab('pix')}
                                      className={\`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer \${previewTab === 'pix' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}\`}
                                    >
                                      <QrCode className="w-3.5 h-3.5" /> Pix
                                    </button>
                                  )}
                                  {checkoutConfig.metodos.cartao && (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewTab('cartao')}
                                      className={\`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer \${previewTab === 'cartao' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}\`}
                                    >
                                      <CreditCard className="w-3.5 h-3.5" /> Cartão
                                    </button>
                                  )}
                                  {checkoutConfig.metodos.boleto && (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewTab('boleto')}
                                      className={\`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer \${previewTab === 'boleto' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}\`}
                                    >
                                      <FileText className="w-3.5 h-3.5" /> Boleto
                                    </button>
                                  )}
                                </div>
                                {previewTab === 'pix' && checkoutConfig.metodos.pix !== false && (
                                  <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4 text-center space-y-3 relative overflow-hidden mb-3">
                                    <div className="absolute top-0 right-0 p-2 opacity-5"><QrCode className="w-24 h-24" /></div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5"><QrCode className="w-4 h-4" /> Pagamento Instantâneo</span>
                                      <span className="text-white font-black font-mono">R$ 25,00</span>
                                    </div>
                                    <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl flex items-center justify-center shadow-lg relative z-10">
                                      <svg viewBox="0 0 100 100" className="w-full h-full"><rect width="100" height="100" fill="#fff" /><rect x="10" y="10" width="30" height="30" fill="none" stroke="#000" strokeWidth="8" /><rect x="20" y="20" width="10" height="10" fill="#000" /><rect x="60" y="10" width="30" height="30" fill="none" stroke="#000" strokeWidth="8" /><rect x="70" y="20" width="10" height="10" fill="#000" /><rect x="10" y="60" width="30" height="30" fill="none" stroke="#000" strokeWidth="8" /><rect x="20" y="70" width="10" height="10" fill="#000" /><rect x="44" y="44" width="12" height="12" fill="#fff" /><rect x="48" y="48" width="4" height="4" fill="#000" /><rect x="68" y="38" width="10" height="6" fill="#000" /><rect x="82" y="44" width="8" height="10" fill="#000" /><rect x="38" y="70" width="10" height="8" fill="#000" /><rect x="54" y="76" width="16" height="8" fill="#000" /><rect x="76" y="70" width="14" height="14" fill="#000" /></svg>
                                    </div>
                                    <p className="text-[11px] text-slate-300">{checkoutConfig.mensagens?.pix || 'Escaneie o QR Code acima no app do seu banco ou use a chave Copia e Cola.'}</p>
                                    <button type="button" onClick={copiarChavePix} className={\`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer \${copiadoPix ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'}\`}>
                                      {copiadoPix ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4 text-emerald-400" />}
                                      {copiadoPix ? 'Código Pix Copiado com Sucesso!' : 'Copiar Código Pix Copia e Cola'}
                                    </button>
                                  </div>
                                )}
                                {previewTab === 'cartao' && checkoutConfig.metodos.cartao && (
                                  <div className="space-y-3 mb-3">
                                    <input type="text" value={cartaoNumero} onChange={e => setCartaoNumero(formatarNumeroCartao(e.target.value))} placeholder="0000 0000 0000 0000" className="w-full h-9 bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 text-xs text-white focus:outline-none" />
                                    <input type="text" value={cartaoNome} onChange={e => setCartaoNome(e.target.value)} placeholder="Nome impresso no cartão" className="w-full h-9 bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 text-xs text-white focus:outline-none uppercase" />
                                  </div>
                                )}
                                {previewTab === 'boleto' && checkoutConfig.metodos.boleto && (
                                  <div className="p-3.5 bg-slate-950/90 border border-amber-500/30 rounded-xl space-y-3 text-center mb-3">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-bold text-amber-400 flex items-center gap-1"><FileText className="w-4 h-4" /> Boleto Bancário</span>
                                      <span className="text-white font-black font-mono">R$ 25,00</span>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-lg space-y-1">
                                      <div className="flex items-center justify-between h-8 gap-0.5 px-2">
                                        {Array.from({ length: 42 }).map((_, i) => (<div key={i} className="h-full bg-black" style={{ width: i % 3 === 0 ? '3px' : i % 5 === 0 ? '4px' : '1.5px' }} />))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          case 'dadosComprador':
                            return (
                              <React.Fragment key="dadosComprador">
                                <div className="space-y-2 mb-3">
                                  {['Nome completo', 'WhatsApp', 'Data de Nascimento'].map(f => (
                                    <div key={f} className="h-9 bg-slate-900/80 border border-slate-700/50 rounded-xl px-3 flex items-center text-xs text-slate-500">{f}</div>
                                  ))}
                                </div>
                              </React.Fragment>
                            );
                          case 'cupomDesconto':
                            return (
                              <React.Fragment key="cupomDesconto">
                                {(checkoutConfig.cupomAtivo || checkoutConfig.exibirCupom) && (
                                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 mb-3">
                                    <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold">
                                      <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-emerald-400" /> Tem um cupom?</span>
                                    </div>
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          case 'resumoPedido':
                            return (
                              <React.Fragment key="resumoPedido">
                                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-xs space-y-1 mb-3">
                                  <div className="flex justify-between text-slate-300"><span>Cotas selecionadas:</span><span className="font-bold text-white">5 cotas</span></div>
                                  <div className="flex justify-between text-slate-300 border-t border-slate-700/50 pt-1"><span>Total a Pagar:</span><span className="font-extrabold text-sm" style={{ color: primary }}>R$ 25,00</span></div>
                                </div>
                              </React.Fragment>
                            );
                          default: return null;
                        }
                      })}
                      
                      <button className="w-full py-3.5 rounded-xl text-sm font-black text-slate-950 shadow-lg transition mt-4" style={{ backgroundColor: primary, boxShadow: \`0 8px 20px \${primary}40\` }}>
                        {checkoutConfig.textoBotao || 'Garantir Minha Cota Agora'} →
                      </button>
                      {checkoutConfig.textoRodape && <p className="text-[10px] text-slate-600 text-center leading-snug mt-2">🔒 {checkoutConfig.textoRodape}</p>}
                    </div>
                  </>
`;

const newCode = code.substring(0, startIndex) + replacement + code.substring(endIndex);
fs.writeFileSync(path, newCode, 'utf8');
console.log("Replaced successfully!");
