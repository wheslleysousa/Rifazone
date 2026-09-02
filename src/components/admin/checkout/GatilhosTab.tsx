import React from 'react';
import { MessageSquare, Clock, ShieldCheck, Check, CheckCircle2, Flame, Zap, Hourglass, Bell, AlertTriangle, Trophy, Sliders, Shield } from 'lucide-react';
import { CheckoutConfigExtended } from './types_private';

export const SELOS_DISPONIVEIS = [
  { id: 'ssl', icon: '🔒', label: 'SSL 256-bit' },
  { id: 'seguro', icon: '🛡️', label: 'Compra 100% Segura' },
  { id: 'aprovacao', icon: '⚡', label: 'Aprovação Imediata' },
  { id: 'comprador', icon: '🤝', label: 'Proteção ao Comprador' },
  { id: 'pix_oficial', icon: '🏦', label: 'Pix Banco Central' },
  { id: 'criptografia', icon: '🔐', label: 'Dados Criptografados' },
  { id: 'satisfacao', icon: '🎯', label: 'Satisfação Garantida' },
  { id: 'suporte', icon: '💬', label: 'Suporte Humanizado 24h' },
  { id: 'auditado', icon: '🔍', label: 'Site Auditado & Verificado' },
  { id: 'antifraude', icon: '🛡️', label: 'Proteção Antifraude Ativa' },
  { id: 'entrega', icon: '📦', label: 'Bilhetes Imediatos' },
  { id: 'reclameaqui', icon: '🏆', label: 'Reclame Aqui Ótimo' },
  { id: 'https', icon: '🌐', label: 'Conexão Segura HTTPS' },
  { id: 'empresa', icon: '🏢', label: 'Empresa Verificada' },
  { id: 'monitorado', icon: '📡', label: 'Transação Monitorada' },
  { id: 'estrelas', icon: '⭐', label: '5 Estrelas Avaliação' },
];

interface GatilhosTabProps {
  checkoutConfig: CheckoutConfigExtended;
  upd: (patch: Partial<CheckoutConfigExtended>) => void;
  updMsgs: (patch: Partial<NonNullable<CheckoutConfigExtended['mensagens']>>) => void;
  toggleSelo: (id: string) => void;
}

export const GatilhosTab: React.FC<GatilhosTabProps> = ({
  checkoutConfig,
  upd,
  updMsgs,
  toggleSelo,
}) => {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Textos & Gatilhos Mentais */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-400" /> 1. Textos & Mensagens do Checkout
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">Mensagem de Urgência (Topo)</label>
            <input
              type="text"
              value={checkoutConfig.mensagens?.urgencia || ''}
              onChange={e => updMsgs({ urgencia: e.target.value })}
              placeholder="⚡ Seus números estão reservados!"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">Mensagem de Escassez (Banner)</label>
            <input
              type="text"
              value={checkoutConfig.mensagemEscassez || ''}
              onChange={e => upd({ mensagemEscassez: e.target.value })}
              placeholder="🔥 Apenas poucas cotas restantes nesta fase!"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 block mb-1">Texto de Rodapé do Checkout</label>
          <textarea
            value={checkoutConfig.textoRodape || ''}
            onChange={e => upd({ textoRodape: e.target.value })}
            rows={2}
            placeholder="Ambiente seguro com criptografia 256-bit. Seus dados estão 100% protegidos."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* 2. Temporizador / Contador de Urgência Totalmente Editável */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" /> 2. Temporizador / Contador Regressivo
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Defina o tempo limite, estilo visual e dimensões do contador</p>
          </div>
          <button
            type="button"
            onClick={() => upd({ temporizadorAtivo: !checkoutConfig.temporizadorAtivo })}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
              checkoutConfig.temporizadorAtivo 
                ? 'bg-amber-500 text-slate-950 font-bold' 
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {checkoutConfig.temporizadorAtivo ? 'Ativo' : 'Desativado'}
          </button>
        </div>

        {checkoutConfig.temporizadorAtivo && (
          <div className="space-y-4 pt-1 animate-in fade-in">
            {/* Seletor de Estilos de Temporizador */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">Estilo Visual do Temporizador:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'fogo', label: 'Fogo Quente', icon: '🔥', desc: 'Gradiente quente' },
                  { id: 'alerta', label: 'Alerta Vermelho', icon: '🚨', desc: 'Pulsante intenso' },
                  { id: 'minimalista', label: 'Minimalista Clean', icon: '⏱️', desc: 'Clean moderno' },
                  { id: 'badge', label: 'Badge Escuro', icon: '⏳', desc: 'Mono digital' },
                  { id: 'pulsante', label: 'Pulsante Neon', icon: '⚡', desc: 'Glow dinâmico' },
                  { id: 'barra_compacta', label: 'Barra Compacta', icon: '📊', desc: 'Faixa discreta' },
                  { id: 'neon', label: 'Ciber Neon', icon: '💡', desc: 'Borda iluminada' },
                ].map(st => {
                  const isSel = (checkoutConfig.temporizadorEstilo || 'fogo') === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => upd({ temporizadorEstilo: st.id as any })}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                        isSel ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/50 text-white' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{st.icon}</span>
                        {isSel && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <span className="text-xs font-black block leading-tight">{st.label}</span>
                      <span className="text-[9px] text-slate-500">{st.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ícone do Temporizador */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Ícone do Temporizador:</label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {[
                  { id: 'fogo', label: 'Fogo', icon: '🔥' },
                  { id: 'relogio', label: 'Relógio', icon: '⏱️' },
                  { id: 'raio', label: 'Raio', icon: '⚡' },
                  { id: 'ampulheta', label: 'Ampulheta', icon: '⏳' },
                  { id: 'alerta', label: 'Alerta', icon: '🚨' },
                  { id: 'sino', label: 'Sino', icon: '🔔' },
                  { id: 'nenhum', label: 'Sem Ícone', icon: '❌' },
                ].map(ic => {
                  const isSel = (checkoutConfig.temporizadorIcone || 'relogio') === ic.id;
                  return (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => upd({ temporizadorIcone: ic.id, temporizadorMostrarIcone: ic.id !== 'nenhum' })}
                      className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                        isSel 
                          ? 'bg-amber-500/20 border-amber-500 text-white ring-1 ring-amber-500/40' 
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-base">{ic.icon}</div>
                      <div className="text-[9px] font-bold mt-0.5 truncate">{ic.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Textos & Duração */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Duração da Reserva (Minutos)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={checkoutConfig.temporizadorMinutos || 10}
                  onChange={e => upd({ temporizadorMinutos: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Texto Customizado do Contador</label>
                <input
                  type="text"
                  value={checkoutConfig.temporizadorTexto || 'Sua reserva expira em'}
                  onChange={e => upd({ temporizadorTexto: e.target.value })}
                  placeholder="Sua reserva expira em"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Cores e Dimensões do Temporizador */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <label className="text-[10px] font-bold text-slate-300 block">Cor de Fundo do Contador</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={checkoutConfig.temporizadorFundo || '#1e1b4b'}
                    onChange={e => upd({ temporizadorFundo: e.target.value })}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent p-0 shrink-0"
                  />
                  <input
                    type="text"
                    value={checkoutConfig.temporizadorFundo || '#1e1b4b'}
                    onChange={e => upd({ temporizadorFundo: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white uppercase focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <label className="text-[10px] font-bold text-slate-300 block">Cor do Texto & Contador</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={checkoutConfig.temporizadorTextoCor || '#fbbf24'}
                    onChange={e => upd({ temporizadorTextoCor: e.target.value })}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent p-0 shrink-0"
                  />
                  <input
                    type="text"
                    value={checkoutConfig.temporizadorTextoCor || '#fbbf24'}
                    onChange={e => upd({ temporizadorTextoCor: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white uppercase focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                  <span>Arredondamento</span>
                  <span className="font-mono text-amber-400">{checkoutConfig.temporizadorRaioBorda ?? 12}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={checkoutConfig.temporizadorRaioBorda ?? 12}
                  onChange={e => upd({ temporizadorRaioBorda: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                  <span>Altura do Bloco</span>
                  <span className="font-mono text-amber-400">{checkoutConfig.temporizadorAltura ?? 40}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={checkoutConfig.temporizadorAltura ?? 40}
                  onChange={e => upd({ temporizadorAltura: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                  <span>Tamanho da Fonte</span>
                  <span className="font-mono text-amber-400">{checkoutConfig.temporizadorTamanhoFonte ?? 12}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={checkoutConfig.temporizadorTamanhoFonte ?? 12}
                  onChange={e => upd({ temporizadorTamanhoFonte: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Selos de Segurança & Certificados (16+ Opções) */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 3. Selos de Confiança & Certificados
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">16+ selos oficiais e formatos para elevar a autoridade</p>
          </div>
          <button
            type="button"
            onClick={() => upd({ selosSeguranca: !checkoutConfig.selosSeguranca })}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
              checkoutConfig.selosSeguranca 
                ? 'bg-emerald-500 text-slate-950 font-bold' 
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {checkoutConfig.selosSeguranca ? 'Ativo' : 'Desativado'}
          </button>
        </div>

        {checkoutConfig.selosSeguranca && (
          <div className="space-y-4 pt-1 animate-in fade-in">
            {/* Posição dos Selos */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Posicionamento dos Selos no Checkout:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'abaixo_botao', label: 'Abaixo do Botão' },
                  { id: 'abaixo_banner', label: 'Abaixo do Banner' },
                  { id: 'topo', label: 'No Topo da Tela' },
                  { id: 'rodape', label: 'No Rodapé' },
                ].map(pos => {
                  const isSel = (checkoutConfig.posicaoSelos || 'abaixo_botao') === pos.id;
                  return (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => upd({ posicaoSelos: pos.id as any })}
                      className={`p-2 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSel 
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${isSel ? 'opacity-100' : 'opacity-0'}`} />
                      {pos.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Estilo dos Selos */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Estilo dos Selos:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'chips_modernos', label: 'Chips Modernos' },
                  { id: 'cards_detalhados', label: 'Cards com Borda' },
                  { id: 'icones_minimalistas', label: 'Badges Minimalistas' },
                  { id: 'barra_seguranca', label: 'Barra Contínua' },
                ].map(st => {
                  const isSel = (checkoutConfig.estiloSelos || 'chips_modernos') === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => upd({ estiloSelos: st.id as any })}
                      className={`p-2 rounded-lg border text-xs font-bold transition cursor-pointer text-center ${
                        isSel 
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40' 
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 16+ Selos para selecionar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300">Escolha os Selos que deseja exibir:</label>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  {(checkoutConfig.selosExtras || ['ssl', 'seguro', 'aprovacao', 'comprador']).length} selecionados
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SELOS_DISPONIVEIS.map(selo => {
                  const ativo = (checkoutConfig.selosExtras || ['ssl', 'seguro', 'aprovacao', 'comprador']).includes(selo.id);
                  return (
                    <div
                      key={selo.id}
                      onClick={() => toggleSelo(selo.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center gap-2 select-none ${
                        ativo
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <span className="text-base shrink-0">{selo.icon}</span>
                      <span className="text-[11px] font-bold flex-1 truncate">{selo.label}</span>
                      {ativo && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Conversão & Prova Social */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <h4 className="text-sm font-black text-white flex items-center gap-2">🔔 4. Notificações de Vendas & Retenção</h4>

        {/* Notificações Sociais */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-200 block">Notificações Sociais (Toast "Fulano comprou...")</span>
              <span className="text-[11px] text-slate-400 block">Gera prova social com alertas periódicos de compra</span>
            </div>
            <input
              type="checkbox"
              checked={!!checkoutConfig.notificacoesSociais?.ativo}
              onChange={e => upd({ notificacoesSociais: { ...checkoutConfig.notificacoesSociais, ativo: e.target.checked } })}
              className="rounded border-slate-700 bg-slate-900 text-emerald-500 w-4 h-4 cursor-pointer"
            />
          </label>

          {checkoutConfig.notificacoesSociais?.ativo && (
            <div className="space-y-3 pt-2 border-t border-slate-800 animate-in fade-in">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Posição na Tela</label>
                  <select
                    value={checkoutConfig.notificacoesSociais?.posicao || 'base-esq'}
                    onChange={e => upd({
                      notificacoesSociais: {
                        ...checkoutConfig.notificacoesSociais,
                        ativo: true,
                        posicao: e.target.value as any
                      }
                    })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="base-esq">Inferior esquerda</option>
                    <option value="base-dir">Inferior direita</option>
                    <option value="topo-esq">Superior esquerda</option>
                    <option value="topo-dir">Superior direita</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Disparar a cada (segundos)</label>
                  <input
                    type="number"
                    min={3}
                    max={120}
                    value={checkoutConfig.notificacoesSociais?.intervalo || 12}
                    onChange={e => upd({
                      notificacoesSociais: {
                        ...checkoutConfig.notificacoesSociais,
                        ativo: true,
                        intervalo: Number(e.target.value)
                      }
                    })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Exit Pop-up */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-200 block">Pop-up de retenção (Exit Pop-up)</span>
              <span className="text-[11px] text-slate-400 block">Oferece última chance antes do comprador sair</span>
            </div>
            <input
              type="checkbox"
              checked={!!checkoutConfig.exitPopup?.ativo}
              onChange={e => upd({ exitPopup: { ...checkoutConfig.exitPopup, ativo: e.target.checked } })}
              className="rounded border-slate-700 bg-slate-900 text-emerald-500 w-4 h-4 cursor-pointer"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

