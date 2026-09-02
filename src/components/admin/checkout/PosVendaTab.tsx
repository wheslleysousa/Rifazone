import React, { useRef } from 'react';
import { 
  PartyPopper, CheckCircle2, Trophy, Star, Heart, Flame, Sparkles, 
  Upload, Image, Eye, EyeOff, LayoutGrid, List, Sliders, Palette, Check, RefreshCw
} from 'lucide-react';
import { CheckoutConfigExtended } from './types_private';
import { ConfirmacaoCompraConfig } from '../../../types';

interface PosVendaTabProps {
  checkoutConfig: CheckoutConfigExtended;
  updConfirmacao: (patch: Partial<ConfirmacaoCompraConfig>) => void;
  setPreviewScreen: (screen: 'checkout' | 'sucesso') => void;
  setModalAnimacaoAberto: (open: boolean) => void;
}

export const PosVendaTab: React.FC<PosVendaTabProps> = ({
  checkoutConfig,
  updConfirmacao,
  setPreviewScreen,
  setModalAnimacaoAberto,
}) => {
  const conf = checkoutConfig.confirmacao || {};
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updConfirmacao({
          iconeSucessoTipo: 'imagem',
          iconeSucessoImagem: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Indicador / Bolinha de Sucesso (Totalmente Editável) */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1. Indicador / Ícone de Sucesso
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Personalize a bolinha redonda de sucesso, troque por outro ícone, emoji ou imagem própria
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updConfirmacao({ iconeSucessoExibir: conf.iconeSucessoExibir === false ? true : false })}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition cursor-pointer flex items-center gap-1.5 ${
                conf.iconeSucessoExibir !== false 
                  ? 'bg-emerald-500 text-slate-950 font-bold' 
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {conf.iconeSucessoExibir !== false ? (
                <><Eye className="w-3.5 h-3.5" /> Visível</>
              ) : (
                <><EyeOff className="w-3.5 h-3.5" /> Oculto</>
              )}
            </button>
            <button
              type="button"
              onClick={() => setPreviewScreen('sucesso')}
              className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
            >
              Ver Prévia →
            </button>
          </div>
        </div>

        {conf.iconeSucessoExibir !== false && (
          <div className="space-y-4 animate-in fade-in">
            {/* Escolha do tipo de ícone */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">O que vai aparecer na bolinha / indicador:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'check', label: 'Check Verde', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
                  { id: 'trofeu', label: 'Troféu Dourado', icon: <Trophy className="w-4 h-4 text-amber-400" /> },
                  { id: 'estrela', label: 'Estrela VIP', icon: <Star className="w-4 h-4 text-yellow-400" /> },
                  { id: 'festa', label: 'Festa / Celebração', icon: <PartyPopper className="w-4 h-4 text-purple-400" /> },
                  { id: 'coracao', label: 'Coração', icon: <Heart className="w-4 h-4 text-rose-400" /> },
                  { id: 'fogo', label: 'Fogo / Destaque', icon: <Flame className="w-4 h-4 text-orange-400" /> },
                  { id: 'emoji', label: 'Emoji Customizado', icon: <span className="text-base">✨</span> },
                  { id: 'imagem', label: 'Imagem / Logo', icon: <Image className="w-4 h-4 text-blue-400" /> },
                ].map(item => {
                  const isSel = (conf.iconeSucessoTipo || 'check') === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updConfirmacao({ iconeSucessoTipo: item.id as any })}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                        isSel 
                          ? 'bg-emerald-500/20 border-emerald-500 text-white ring-1 ring-emerald-500/50' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="shrink-0">{item.icon}</div>
                      <span className="text-xs font-bold truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Configuração específica de Emoji ou Imagem */}
            {conf.iconeSucessoTipo === 'emoji' && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 animate-in fade-in">
                <label className="text-xs font-bold text-slate-300 block">Insira ou selecione um Emoji:</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={conf.iconeSucessoEmoji || '🎉'}
                    onChange={e => updConfirmacao({ iconeSucessoEmoji: e.target.value })}
                    className="w-16 text-center text-2xl bg-slate-900 border border-slate-700 rounded-xl py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {['🎉', '🍀', '🏆', '💎', '🚀', '🔥', '🎟️', '⭐', '🙌', '💰'].map(em => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => updConfirmacao({ iconeSucessoEmoji: em })}
                        className="text-lg p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {conf.iconeSucessoTipo === 'imagem' && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3 animate-in fade-in">
                <label className="text-xs font-bold text-slate-300 block">Upload da Imagem ou Logo:</label>
                <div className="flex items-center gap-3">
                  {conf.iconeSucessoImagem ? (
                    <div className="relative w-14 h-14 rounded-full border border-slate-700 overflow-hidden bg-slate-900 shrink-0">
                      <img
                        src={conf.iconeSucessoImagem}
                        alt="Ícone Sucesso"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full border border-dashed border-slate-700 flex items-center justify-center bg-slate-900 shrink-0">
                      <Image className="w-6 h-6 text-slate-600" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow transition"
                    >
                      <Upload className="w-3.5 h-3.5" /> Escolher Imagem do Computador
                    </button>
                    <p className="text-[10px] text-slate-500">Recomendado formato quadrado (PNG, JPG, SVG)</p>
                  </div>
                </div>
              </div>
            )}

            {/* Cores e Dimensões da Bolinha de Sucesso */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <label className="text-[10px] font-bold text-slate-300 block">Cor de Fundo da Bolinha</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={conf.iconeSucessoCorFundo || '#10b981'}
                    onChange={e => updConfirmacao({ iconeSucessoCorFundo: e.target.value })}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent p-0 shrink-0"
                  />
                  <input
                    type="text"
                    value={conf.iconeSucessoCorFundo || '#10b981'}
                    onChange={e => updConfirmacao({ iconeSucessoCorFundo: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white uppercase focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <label className="text-[10px] font-bold text-slate-300 block">Cor do Sinalzinho / Ícone</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={conf.iconeSucessoCorIcone || '#ffffff'}
                    onChange={e => updConfirmacao({ iconeSucessoCorIcone: e.target.value })}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent p-0 shrink-0"
                  />
                  <input
                    type="text"
                    value={conf.iconeSucessoCorIcone || '#ffffff'}
                    onChange={e => updConfirmacao({ iconeSucessoCorIcone: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white uppercase focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                  <span>Tamanho da Bolinha</span>
                  <span className="font-mono text-emerald-400">{conf.iconeSucessoTamanho ?? 64}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={conf.iconeSucessoTamanho ?? 64}
                  onChange={e => updConfirmacao({ iconeSucessoTamanho: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                  <span>Animação do Ícone</span>
                </div>
                <select
                  value={conf.iconeSucessoAnimacao || 'pulse'}
                  onChange={e => updConfirmacao({ iconeSucessoAnimacao: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="pulse">Pulso Suave</option>
                  <option value="bounce">Salto / Bounce</option>
                  <option value="spin_once">Giro Inicial</option>
                  <option value="none">Estático (Sem animação)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Formato e Customização dos Bilhetes / Cotas */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-indigo-400" /> 2. Formato & Estilo dos Bilhetes
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Escolha como os números da sorte serão renderizados na tela de sucesso
            </p>
          </div>
          <button
            type="button"
            onClick={() => updConfirmacao({ exibirNumeros: conf.exibirNumeros === false ? true : false })}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
              conf.exibirNumeros !== false ? 'bg-indigo-500 text-white font-bold' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {conf.exibirNumeros !== false ? 'Bilhetes Visíveis' : 'Ocultar Bilhetes'}
          </button>
        </div>

        {conf.exibirNumeros !== false && (
          <div className="space-y-4 animate-in fade-in">
            {/* Seletor de Formato dos Bilhetes */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">Formato de Apresentação dos Bilhetes:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'grid', label: 'Grade de Badges', desc: 'Blocos compactos lado a lado' },
                  { id: 'pills', label: 'Pílulas / Chips', desc: 'Arredondado minimalista' },
                  { id: 'card_destaque', label: 'Certificado Digital', desc: 'Card com moldura premium' },
                  { id: 'lista', label: 'Lista Numerada', desc: 'Linhas com detalhes' },
                ].map(fmt => {
                  const isSel = (conf.formatoBilhetes || 'grid') === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => updConfirmacao({ formatoBilhetes: fmt.id as any })}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                        isSel 
                          ? 'bg-indigo-500/20 border-indigo-500 text-white ring-1 ring-indigo-500/50' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-black block">{fmt.label}</span>
                      <span className="text-[10px] text-slate-500 leading-tight">{fmt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cores dos Bilhetes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <label className="text-[10px] font-bold text-slate-300 block">Cor de Fundo do Bilhete</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={conf.bilhetesCorFundo || '#1e293b'}
                    onChange={e => updConfirmacao({ bilhetesCorFundo: e.target.value })}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent p-0 shrink-0"
                  />
                  <input
                    type="text"
                    value={conf.bilhetesCorFundo || '#1e293b'}
                    onChange={e => updConfirmacao({ bilhetesCorFundo: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white uppercase focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <label className="text-[10px] font-bold text-slate-300 block">Cor dos Números</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={conf.bilhetesCorTexto || '#38bdf8'}
                    onChange={e => updConfirmacao({ bilhetesCorTexto: e.target.value })}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent p-0 shrink-0"
                  />
                  <input
                    type="text"
                    value={conf.bilhetesCorTexto || '#38bdf8'}
                    onChange={e => updConfirmacao({ bilhetesCorTexto: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white uppercase focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <label className="text-[10px] font-bold text-slate-300 block">Cor da Borda</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={conf.bilhetesCorBorda || '#334155'}
                    onChange={e => updConfirmacao({ bilhetesCorBorda: e.target.value })}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent p-0 shrink-0"
                  />
                  <input
                    type="text"
                    value={conf.bilhetesCorBorda || '#334155'}
                    onChange={e => updConfirmacao({ bilhetesCorBorda: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white uppercase focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Arredondamento e Tamanho da Fonte dos Bilhetes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                  <span>Arredondamento dos Bilhetes</span>
                  <span className="font-mono text-indigo-400">{conf.bilhetesRaioBorda ?? 8}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={conf.bilhetesRaioBorda ?? 8}
                  onChange={e => updConfirmacao({ bilhetesRaioBorda: Number(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                  <span>Tamanho da Fonte dos Bilhetes</span>
                  <span className="font-mono text-indigo-400">{conf.bilhetesTamanhoFonte ?? 13}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={conf.bilhetesTamanhoFonte ?? 13}
                  onChange={e => updConfirmacao({ bilhetesTamanhoFonte: Number(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Textos & Mensagens da Tela de Sucesso */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <PartyPopper className="w-4 h-4 text-emerald-400" /> 3. Textos & Mensagens da Confirmação
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Título Principal</label>
            <input
              type="text"
              value={conf.titulo || 'Pagamento Confirmado! 🎉'}
              onChange={e => updConfirmacao({ titulo: e.target.value })}
              placeholder="Pagamento Confirmado! 🎉"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Subtítulo</label>
            <input
              type="text"
              value={conf.subtitulo || 'Seus números já estão salvos.'}
              onChange={e => updConfirmacao({ subtitulo: e.target.value })}
              placeholder="Seus números já estão salvos e vinculados ao seu WhatsApp!"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Agradecimento / Mensagem Positiva</label>
          <input
            type="text"
            value={conf.mensagemAgradecimento || ''}
            onChange={e => updConfirmacao({ mensagemAgradecimento: e.target.value })}
            placeholder="Obrigado por participar! Boa sorte no sorteio."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Instruções pós-compra (transmissão, regras, etc.)</label>
          <textarea
            value={conf.instrucoesPosCompra || ''}
            onChange={e => updConfirmacao({ instrucoesPosCompra: e.target.value })}
            rows={3}
            placeholder="Ex: O sorteio será transmitido ao vivo em nosso Instagram oficial às 20h. Fique atento às notificações!"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none resize-none"
          />
        </div>

        {/* Efeito de Confetes */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-200 block">Chuva de Confetes Comemorativa</span>
              <span className="text-[11px] text-slate-500 block">Animação festiva para celebrar a compra</span>
            </div>
            <button
              type="button"
              onClick={() => updConfirmacao({ exibirConfetes: !conf.exibirConfetes })}
              className={`px-3 py-1.5 text-xs font-black rounded-lg border transition cursor-pointer ${
                conf.exibirConfetes !== false 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              {conf.exibirConfetes !== false ? '🎉 Ativado' : 'Desativado'}
            </button>
          </div>
        </div>

        {/* Ações e Botões Secundários */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {[
            { label: 'Botão Copiar Números', key: 'exibirBotaoCopiar', desc: 'Facilita copiar cotas para a área de transferência' },
            { label: 'Botão WhatsApp Organizador', key: 'exibirBotaoWhatsapp', desc: 'Atalho direto para falar com o organizador' },
            { label: 'Botão "Meus Bilhetes"', key: 'exibirBotaoMeusNumeros', desc: 'Link para consultar histórico de compras' },
          ].map(t => (
            <label key={t.key} className="flex items-start gap-2.5 p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl cursor-pointer hover:bg-slate-950 transition-colors">
              <input
                type="checkbox"
                checked={!!(conf as any)[t.key]}
                onChange={e => updConfirmacao({ [t.key]: e.target.checked })}
                className="w-3.5 h-3.5 rounded text-indigo-500 bg-slate-900 border-slate-700 cursor-pointer mt-0.5"
              />
              <div>
                <span className="text-[11px] font-black text-slate-200 block leading-tight">{t.label}</span>
                <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">{t.desc}</span>
              </div>
            </label>
          ))}
        </div>

        {/* Botão de Grupo VIP / Canal */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3.5">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-200 block">Botão de Redirecionamento VIP</span>
              <span className="text-[11px] text-slate-400 block">Convide compradores a entrar no seu grupo ou canal pós-venda</span>
            </div>
            <input
              type="checkbox"
              checked={!!conf.botaoGrupoVipAtivo}
              onChange={e => updConfirmacao({ botaoGrupoVipAtivo: e.target.checked })}
              className="rounded border-slate-700 bg-slate-900 text-emerald-500 w-4 h-4 cursor-pointer"
            />
          </label>

          {conf.botaoGrupoVipAtivo && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-900 animate-in fade-in">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Texto do Botão VIP</label>
                <input
                  type="text"
                  value={conf.botaoGrupoVipTexto || 'Entrar no Grupo VIP do WhatsApp'}
                  onChange={e => updConfirmacao({ botaoGrupoVipTexto: e.target.value })}
                  placeholder="Entrar no Grupo VIP do WhatsApp"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">URL do Canal ou Grupo (Link)</label>
                <input
                  type="url"
                  value={conf.botaoGrupoVipLink || ''}
                  onChange={e => updConfirmacao({ botaoGrupoVipLink: e.target.value })}
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

