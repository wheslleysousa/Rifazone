import React from 'react';
import { 
  QrCode, Copy, Clock, MessageCircle, AlertCircle, 
  HelpCircle, Eye, Sliders, CheckCircle2, Sparkles, Shield
} from 'lucide-react';
import { CheckoutConfigExtended } from './types_private';

interface PixTabProps {
  checkoutConfig: CheckoutConfigExtended;
  upd: (patch: Partial<CheckoutConfigExtended>) => void;
}

export const PixTab: React.FC<PixTabProps> = ({
  checkoutConfig,
  upd,
}) => {
  const pix = checkoutConfig.pixConfig || {};

  const updPix = (patch: Partial<NonNullable<CheckoutConfigExtended['pixConfig']>>) => {
    upd({
      pixConfig: {
        ...(checkoutConfig.pixConfig || {}),
        ...patch,
      }
    });
  };

  const instrucoes = pix.instrucoes || [
    'Copie o código Pix abaixo ou aponte a câmera para o QR Code.',
    'Abra o aplicativo do seu banco e acesse a opção "Pix Copia e Cola".',
    'Confirme o valor e finalize. Seus números serão vinculados e liberados imediatamente!'
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* 1. Textos e Títulos da Área do Pix */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <QrCode className="w-4 h-4 text-emerald-400" /> 1. Títulos e Mensagens da Tela do Pix
        </h2>
        <p className="text-xs text-slate-400">
          Personalize as mensagens que o comprador vê logo após clicar em "Gerar Pix".
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Badge / Selo Superior
            </label>
            <input
              type="text"
              value={pix.badgeTexto ?? 'Aprovação Instantânea'}
              onChange={e => updPix({ badgeTexto: e.target.value })}
              placeholder="Ex: Aprovação Instantânea, Pagamento Seguro"
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Título Principal da Tela do Pix
            </label>
            <input
              type="text"
              value={pix.titulo ?? 'Pague com Pix para Garantir suas Cotas'}
              onChange={e => updPix({ titulo: e.target.value })}
              placeholder="Ex: Pague com Pix para Garantir suas Cotas"
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-bold"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Subtítulo / Instrução Rápida
            </label>
            <textarea
              rows={2}
              value={pix.subtitulo ?? 'Abra o app do seu banco e escaneie o QR Code ou utilize o Pix Copia e Cola.'}
              onChange={e => updPix({ subtitulo: e.target.value })}
              placeholder="Instrução direta e clara para o comprador..."
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Visual do QR Code & Copia e Cola */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Eye className="w-4 h-4 text-emerald-400" /> 2. Exibição do QR Code e Botão Copiar
        </h2>

        {/* Toggle Exibir QR Code */}
        <label className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-950 transition-colors">
          <div>
            <p className="text-xs font-bold text-white">Exibir QR Code Visual</p>
            <p className="text-[11px] text-slate-400">
              Mostra o desenho do QR Code em fundo branco para leitura de câmera de outro aparelho.
            </p>
          </div>
          <div
            onClick={() => updPix({ exibirQrCode: pix.exibirQrCode === false ? true : false })}
            className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${pix.exibirQrCode !== false ? 'bg-emerald-500' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${pix.exibirQrCode !== false ? 'translate-x-6' : 'translate-x-1'}`} />
          </div>
        </label>

        {pix.exibirQrCode !== false && (
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-bold">Tamanho do QR Code:</span>
              <span className="text-emerald-400 font-mono font-black">{pix.tamanhoQrCode || 200}px</span>
            </div>
            <input
              type="range"
              min={150}
              max={280}
              step={10}
              value={pix.tamanhoQrCode || 200}
              onChange={e => updPix({ tamanhoQrCode: Number(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Compacto (150px)</span>
              <span>Padrão (200px)</span>
              <span>Grande (280px)</span>
            </div>
          </div>
        )}

        {/* Textos do Botão Copia e Cola */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Texto do Botão Copiar Código Pix
            </label>
            <input
              type="text"
              value={pix.textoBotaoCopiar ?? 'Copiar Código Pix'}
              onChange={e => updPix({ textoBotaoCopiar: e.target.value })}
              placeholder="Ex: Copiar Código Pix"
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-medium"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Texto após Copiar (Feedback)
            </label>
            <input
              type="text"
              value={pix.textoBotaoCopiado ?? 'Código Pix Copiado com Sucesso!'}
              onChange={e => updPix({ textoBotaoCopiado: e.target.value })}
              placeholder="Ex: Código Pix Copiado com Sucesso!"
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-medium"
            />
          </div>
        </div>
      </div>

      {/* 3. Instruções Passo a Passo */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 3. Guia Passo a Passo para o Comprador
        </h2>
        <p className="text-xs text-slate-400">
          Oriente seu cliente em 3 passos simples para aumentar a taxa de conversão do Pix.
        </p>

        <div className="space-y-2.5">
          {[0, 1, 2].map(idx => (
            <div key={idx} className="flex items-start gap-2.5 bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 mt-1">
                {idx + 1}
              </span>
              <div className="flex-1">
                <input
                  type="text"
                  value={instrucoes[idx] || ''}
                  onChange={e => {
                    const copy = [...instrucoes];
                    copy[idx] = e.target.value;
                    updPix({ instrucoes: copy });
                  }}
                  placeholder={`Passo ${idx + 1}...`}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Urgência, Cronômetro e Resumo */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" /> 4. Urgência, Cronômetro e Resumo
        </h2>

        {/* Toggle Exibir Timer */}
        <label className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-950 transition-colors">
          <div>
            <p className="text-xs font-bold text-white">Exibir Cronômetro de Expiração</p>
            <p className="text-[11px] text-slate-400">Mostra a contagem regressiva em minutos/segundos para gerar urgência</p>
          </div>
          <div
            onClick={() => updPix({ exibirTimer: pix.exibirTimer === false ? true : false })}
            className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${pix.exibirTimer !== false ? 'bg-emerald-500' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${pix.exibirTimer !== false ? 'translate-x-6' : 'translate-x-1'}`} />
          </div>
        </label>

        {/* Toggle Exibir Resumo */}
        <label className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-950 transition-colors">
          <div>
            <p className="text-xs font-bold text-white">Exibir Resumo do Pedido (Valor e Cotas)</p>
            <p className="text-[11px] text-slate-400">Card com quantidade de cotas e valor total a ser pago</p>
          </div>
          <div
            onClick={() => updPix({ exibirResumo: pix.exibirResumo === false ? true : false })}
            className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${pix.exibirResumo !== false ? 'bg-emerald-500' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${pix.exibirResumo !== false ? 'translate-x-6' : 'translate-x-1'}`} />
          </div>
        </label>

        {/* Aviso de Expiração / Reserva */}
        <div>
          <label className="text-[11px] font-bold text-slate-300 block mb-1">
            Texto do Aviso de Reserva / Expiração
          </label>
          <input
            type="text"
            value={pix.avisoExpiracao ?? 'Suas cotas ficam reservadas temporariamente. Finalize o pagamento para garantir a sua participação.'}
            onChange={e => updPix({ avisoExpiracao: e.target.value })}
            placeholder="Ex: Suas cotas ficam reservadas por tempo limitado..."
            className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 5. Suporte WhatsApp na Tela do Pix */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-emerald-400" /> 5. Botão de Ajuda / Suporte WhatsApp no Pix
        </h2>
        <p className="text-xs text-slate-400">
          Ofereça um canal direto caso o comprador tenha alguma dúvida na hora de pagar o Pix.
        </p>

        <label className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-950 transition-colors">
          <div>
            <p className="text-xs font-bold text-white">Ativar Botão de Suporte WhatsApp</p>
            <p className="text-[11px] text-slate-400">Exibe um botão discreto de suporte logo abaixo do Pix</p>
          </div>
          <div
            onClick={() => updPix({ suporteWhatsappAtivo: !pix.suporteWhatsappAtivo })}
            className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${pix.suporteWhatsappAtivo ? 'bg-emerald-500' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${pix.suporteWhatsappAtivo ? 'translate-x-6' : 'translate-x-1'}`} />
          </div>
        </label>

        {pix.suporteWhatsappAtivo && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                WhatsApp de Suporte (com DDD)
              </label>
              <input
                type="text"
                value={pix.suporteWhatsappNumero || ''}
                onChange={e => updPix({ suporteWhatsappNumero: e.target.value.replace(/\D/g, '') })}
                placeholder="Ex: 11999998888"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Texto do Botão de Suporte
              </label>
              <input
                type="text"
                value={pix.suporteWhatsappTexto || 'Precisa de ajuda com o Pix? Fale conosco'}
                onChange={e => updPix({ suporteWhatsappTexto: e.target.value })}
                placeholder="Ex: Precisa de ajuda com o Pix? Fale conosco"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
