const fs = require('fs');
let code = fs.readFileSync('src/components/admin/TemaBuilderView.tsx', 'utf8');

const presetsArray = `
const PRESETS = [
  {
    nome: 'Dark Moderno',
    tema: { ...TEMA_PADRAO }
  },
  {
    nome: 'Padrão Claro',
    tema: { ...TEMA_PADRAO, cores: { primaria: '#10b981', destaque: '#059669', fundo: '#f8fafc', texto: '#0f172a', titulos: '#020617', descricoes: '#475569', botao: '#10b981', textoBotao: '#ffffff', cardFundo: '#ffffff', cardBorda: '#e2e8f0', faviconFundo: '#10b981', iconeCor: '#10b981' } }
  },
  {
    nome: 'Oceano Azul',
    tema: { ...TEMA_PADRAO, cores: { primaria: '#3b82f6', destaque: '#2563eb', fundo: '#0a192f', texto: '#e2e8f0', titulos: '#ffffff', descricoes: '#94a3b8', botao: '#3b82f6', textoBotao: '#ffffff', cardFundo: '#112240', cardBorda: '#1e293b', faviconFundo: '#3b82f6', iconeCor: '#3b82f6' } }
  },
  {
    nome: 'Floresta Verde',
    tema: { ...TEMA_PADRAO, cores: { primaria: '#22c55e', destaque: '#16a34a', fundo: '#064e3b', texto: '#ecfdf5', titulos: '#ffffff', descricoes: '#a7f3d0', botao: '#22c55e', textoBotao: '#064e3b', cardFundo: '#065f46', cardBorda: '#047857', faviconFundo: '#22c55e', iconeCor: '#22c55e' } }
  },
  {
    nome: 'Dourado Escuro',
    tema: { ...TEMA_PADRAO, cores: { primaria: '#eab308', destaque: '#ca8a04', fundo: '#18181b', texto: '#fafafa', titulos: '#ffffff', descricoes: '#a1a1aa', botao: '#eab308', textoBotao: '#18181b', cardFundo: '#27272a', cardBorda: '#3f3f46', faviconFundo: '#eab308', iconeCor: '#eab308' } }
  },
  {
    nome: 'Roxo Escuro',
    tema: { ...TEMA_PADRAO, cores: { primaria: '#a855f7', destaque: '#9333ea', fundo: '#2e1065', texto: '#f3e8ff', titulos: '#ffffff', descricoes: '#d8b4fe', botao: '#a855f7', textoBotao: '#ffffff', cardFundo: '#3b0764', cardBorda: '#581c87', faviconFundo: '#a855f7', iconeCor: '#a855f7' } }
  }
];
`;

const regexPos = /\{\/\* 6\. SEÇÃO ESTILOS SALVOS \*\/\}/;
const presetJSX = `
          {/* SEÇÃO ESTILOS SALVOS E PRESETS */}
          {secaoEditor === 'estilos' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 animate-in fade-in">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Temas Prontos
                  </h3>
                  <p className="text-xs text-slate-400">
                    Escolha um dos presets para aplicar rapidamente.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => atualizarTema(preset.tema)}
                      className="p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500 rounded-xl transition text-left flex flex-col gap-2"
                    >
                      <div className="flex gap-1.5 h-6 w-full rounded-md overflow-hidden" style={{ backgroundColor: preset.tema.cores.fundo }}>
                        <div className="w-1/3 h-full" style={{ backgroundColor: preset.tema.cores.primaria }}></div>
                        <div className="w-2/3 h-full" style={{ backgroundColor: preset.tema.cores.cardFundo }}></div>
                      </div>
                      <span className="text-xs font-bold text-white block mt-1">{preset.nome}</span>
                    </button>
                  ))}
                </div>
              </div>

`;

code = code.replace("import { auth } from '../../lib/firebase';", "import { auth } from '../../lib/firebase';\n" + presetsArray);

const regexEstilosOriginal = /\{\/\* 6\. SEÇÃO ESTILOS SALVOS \*\/\}[\s\S]*?\{secaoEditor === 'estilos' && \(/;
code = code.replace(regexEstilosOriginal, presetJSX);

fs.writeFileSync('src/components/admin/TemaBuilderView.tsx', code);
