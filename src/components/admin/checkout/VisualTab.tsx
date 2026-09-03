import React, { useState, useRef } from 'react';
import { Palette, Type, Upload, Trash2, Check, Image as ImageIcon, Video, Film, Sparkles, Maximize2, Play } from 'lucide-react';
import { CheckoutConfigExtended } from './types_private';

const FONTES = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Outfit', label: 'Outfit' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans' },
  { value: 'Space Grotesk', label: 'Space Grotesk' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Syne', label: 'Syne' },
  { value: 'Cinzel', label: 'Cinzel' },
  { value: 'Sora', label: 'Sora' },
  { value: 'Urbanist', label: 'Urbanist' },
  { value: 'Oswald', label: 'Oswald' },
  { value: 'Bricolage Grotesque', label: 'Bricolage Grotesque' },
  { value: 'Archivo', label: 'Archivo' },
];

interface VisualTabProps {
  checkoutConfig: CheckoutConfigExtended;
  upd: (patch: Partial<CheckoutConfigExtended>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleUploadBanner: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const VisualTab: React.FC<VisualTabProps> = ({
  checkoutConfig,
  upd,
  fileInputRef,
  handleUploadBanner,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const tipoMidia = checkoutConfig.bannerTipo || (checkoutConfig.bannerVideoUrl ? 'video' : 'imagem');

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        if (file.size > 25 * 1024 * 1024) {
          alert('O vídeo deve ter no máximo 25MB.');
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            upd({ bannerTipo: 'video', bannerVideoUrl: reader.result, bannerUrl: '' });
          }
        };
        reader.readAsDataURL(file);
      } else {
        if (file.size > 8 * 1024 * 1024) {
          alert('A imagem deve ter no máximo 8MB.');
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            upd({ bannerTipo: 'imagem', bannerUrl: reader.result, bannerVideoUrl: '' });
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleUploadVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        alert('O vídeo deve ter no máximo 25MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          upd({ bannerTipo: 'video', bannerVideoUrl: reader.result, bannerUrl: '' });
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Palette className="w-4 h-4 text-pink-400" /> Identidade Visual do Checkout
          </h2>
          <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono">
            Cores & Mídia do Banner
          </span>
        </div>
        
        {/* Cores alinhadas em grid harmonioso */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Cor Primária (Botões & Destaques)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={checkoutConfig.corPrimaria || '#10b981'}
                onChange={e => upd({ corPrimaria: e.target.value })}
                className="w-9 h-9 rounded-lg border-0 cursor-pointer bg-transparent p-0 shrink-0"
              />
              <input
                type="text"
                value={checkoutConfig.corPrimaria || '#10b981'}
                onChange={e => upd({ corPrimaria: e.target.value })}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white uppercase focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Cor de Fundo do Checkout
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={checkoutConfig.corFundo || '#020617'}
                onChange={e => upd({ corFundo: e.target.value })}
                className="w-9 h-9 rounded-lg border-0 cursor-pointer bg-transparent p-0 shrink-0"
              />
              <input
                type="text"
                value={checkoutConfig.corFundo || '#020617'}
                onChange={e => upd({ corFundo: e.target.value })}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white uppercase focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Upload de Imagem ou Vídeo do Banner do Checkout */}
        <div className="space-y-4 pt-3 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                {tipoMidia === 'video' ? (
                  <Film className="w-4 h-4 text-purple-400" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                )}
                Banner do Topo no Checkout (Imagem ou Vídeo)
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Exibido no topo do modal de pagamento para reforçar sua marca.
              </p>
            </div>

            {/* Alternador Imagem vs Vídeo */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => upd({ bannerTipo: 'imagem' })}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  tipoMidia === 'imagem'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" /> Imagem
              </button>
              <button
                type="button"
                onClick={() => upd({ bannerTipo: 'video' })}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  tipoMidia === 'video'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" /> Vídeo
              </button>
            </div>
          </div>

          {/* Dica de Tamanho Recomendado e Sem Cortes */}
          <div className="p-3 bg-gradient-to-r from-emerald-950/40 via-slate-950 to-indigo-950/40 border border-emerald-500/20 rounded-xl flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-300 space-y-1">
              <p>
                <strong className="text-white font-bold">Tamanho Recomendado:</strong>{' '}
                <span className="text-emerald-400 font-mono font-bold">1200x400px (3:1)</span> ou{' '}
                <span className="text-indigo-400 font-mono font-bold">16:9</span>.
              </p>
              <p className="text-slate-400">
                ✨ <strong className="text-slate-200">Sem cortes indesejados:</strong> se você enviar uma imagem maior ou em outra proporção (vertical, quadrada ou panorâmica), ela se adapta automaticamente e aparece inteira na íntegra.
              </p>
            </div>
          </div>

          {/* Input oculto para imagem */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUploadBanner}
            accept="image/*"
            className="hidden"
          />

          {/* Input oculto para vídeo */}
          <input
            type="file"
            ref={videoInputRef}
            onChange={handleUploadVideo}
            accept="video/mp4,video/webm,video/quicktime,video/*"
            className="hidden"
          />

          {/* Mídia Imagem */}
          {tipoMidia === 'imagem' && (
            <div className="space-y-3">
              {!checkoutConfig.bannerUrl ? (
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
                    isDragging 
                      ? 'border-emerald-500 bg-emerald-500/10' 
                      : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white">Clique para fazer upload da imagem do banner</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">ou arraste e solte o arquivo aqui (PNG, JPG, WEBP — sem cortes)</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-lg group">
                    <div className="w-full max-h-56 bg-slate-950 flex items-center justify-center p-1">
                      <img
                        src={checkoutConfig.bannerUrl}
                        alt="Banner do Checkout"
                        className={`w-full max-h-52 ${
                          (checkoutConfig.bannerEnquadramento || 'contain') === 'cover'
                            ? 'object-cover h-36'
                            : 'object-contain h-auto'
                        } rounded-xl`}
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end justify-between p-3 pointer-events-none">
                      <div className="flex items-center gap-2 pointer-events-auto">
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black rounded-md">
                          Banner Ativo
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow"
                        >
                          <Upload className="w-3.5 h-3.5 text-emerald-400" /> Trocar Imagem
                        </button>
                        <button
                          type="button"
                          onClick={() => upd({ bannerUrl: '' })}
                          className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white text-[11px] font-bold rounded-lg transition shadow flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remover
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Configurações de Enquadramento sem cortes */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-indigo-400" /> Enquadramento:
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => upd({ bannerEnquadramento: 'contain' })}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          (checkoutConfig.bannerEnquadramento || 'contain') === 'contain'
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        ✓ Conter (Sem Cortes - 100% Visível)
                      </button>
                      <button
                        type="button"
                        onClick={() => upd({ bannerEnquadramento: 'cover' })}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          checkoutConfig.bannerEnquadramento === 'cover'
                            ? 'bg-indigo-500 text-white font-black'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        Preencher / Cobrir
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mídia Vídeo */}
          {tipoMidia === 'video' && (
            <div className="space-y-3">
              {!checkoutConfig.bannerVideoUrl ? (
                <div className="space-y-3">
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => videoInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
                      isDragging 
                        ? 'border-purple-500 bg-purple-500/10' 
                        : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
                      <Video className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">Clique para fazer upload de Vídeo do banner</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">MP4, WebM ou MOV (reproduz em loop no checkout)</p>
                    </div>
                  </div>

                  {/* Ou Inserir Link do YouTube / MP4 */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">
                      Ou digite o link do vídeo (YouTube ou MP4 direto):
                    </label>
                    <input
                      type="url"
                      placeholder="https://youtube.com/watch?v=... ou https://.../video.mp4"
                      value={checkoutConfig.bannerVideoUrl || ''}
                      onChange={e => upd({ bannerTipo: 'video', bannerVideoUrl: e.target.value, bannerUrl: '' })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-lg">
                    {checkoutConfig.bannerVideoUrl.includes('youtube.com') || checkoutConfig.bannerVideoUrl.includes('youtu.be') ? (
                      <div className="aspect-video w-full max-h-56">
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
                        controls
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full max-h-56 object-contain bg-slate-950"
                      />
                    )}
                    <div className="p-3 bg-slate-950/95 border-t border-slate-800 flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-black rounded-md flex items-center gap-1">
                        <Play className="w-3 h-3 fill-current" /> Vídeo Ativo
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-purple-400" /> Trocar Vídeo
                        </button>
                        <button
                          type="button"
                          onClick={() => upd({ bannerVideoUrl: '' })}
                          className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white text-[11px] font-bold rounded-lg transition shadow flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remover
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Configurações Avançadas do Botão Principal */}
        <div className="space-y-4 pt-3 border-t border-slate-800">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-indigo-400" /> Customização do Botão de Ação
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Formato do Botão
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'square', label: 'Quadrado', icon: '⬛' },
                  { id: 'rounded', label: 'Arredondado', icon: '▢' },
                  { id: 'pilled', label: 'Pílula', icon: '💊' },
                  { id: 'super', label: 'Super Arredondado', icon: '⭕' },
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => upd({ botaoFormato: f.id as any, botaoRaioBorda: f.id === 'square' ? 0 : f.id === 'rounded' ? 8 : f.id === 'pilled' ? 50 : 20 })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition ${
                      (checkoutConfig.botaoFormato || 'rounded') === f.id
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{f.icon}</span>
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Peso da Fonte & Tamanho
              </label>
              <div className="space-y-4">
                <div className="flex gap-1.5">
                  {[
                    { id: 'normal', label: 'Normal' },
                    { id: 'bold', label: 'Negrito' },
                    { id: 'black', label: 'Extra Black' },
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => upd({ botaoPesoFonte: p.id as any })}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                        (checkoutConfig.botaoPesoFonte || 'black') === p.id
                          ? 'bg-indigo-600 border-indigo-400 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-slate-500 font-bold">TAMANHO DO TEXTO</span>
                    <span className="text-[10px] text-indigo-400 font-black font-mono">{checkoutConfig.botaoTamanhoFonte || 14}px</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="22"
                    step="1"
                    value={checkoutConfig.botaoTamanhoFonte || 14}
                    onChange={e => upd({ botaoTamanhoFonte: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex justify-between">
                <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                  Arredondamento dos Campos
                </label>
                <span className="text-[10px] text-indigo-400 font-black font-mono">{checkoutConfig.inputArredondamento ?? 12}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={checkoutConfig.inputArredondamento ?? 12}
                onChange={e => upd({ inputArredondamento: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex justify-between">
                <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                  Arredondamento dos Cards
                </label>
                <span className="text-[10px] text-indigo-400 font-black font-mono">{checkoutConfig.cardArredondamento ?? 16}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={checkoutConfig.cardArredondamento ?? 16}
                onChange={e => upd({ cardArredondamento: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Seletor Visual de Tipografia com Prévias */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-indigo-400" /> Fonte Tipográfica do Checkout
            </label>
            <span className="text-[10px] text-indigo-400 font-mono font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {checkoutConfig.fonteFamilia || 'Inter'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
            {FONTES.map(f => {
              const isSelected = (checkoutConfig.fonteFamilia || 'Inter') === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => upd({ fonteFamilia: f.value })}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-500/15 border-indigo-500 ring-2 ring-indigo-500/40 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <span
                    className="text-xs font-bold truncate tracking-wide"
                    style={{ fontFamily: f.value }}
                  >
                    {f.label}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

