const fs = require('fs');
const path = 'src/components/CampanhaPublicaView.tsx';
let code = fs.readFileSync(path, 'utf8');

const target = `<div className="relative w-full h-[180px] sm:h-[280px] md:h-[360px] lg:h-[420px] bg-slate-950 overflow-hidden flex items-center justify-center">
                  <img
                    src={campanha.organizadorCapa}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-105 pointer-events-none select-none"
                  />
                  <img
                    src={campanha.organizadorCapa}
                    alt="Capa do Perfil"
                    className="relative z-10 max-w-full max-h-full object-contain block mx-auto transition-all"
                  />
                </div>`;

const replacement = `<div className="w-full bg-slate-950">
                  <img
                    src={campanha.organizadorCapa}
                    alt="Capa do Perfil"
                    className="w-full h-auto object-contain block"
                  />
                </div>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(path, code, 'utf8');
  console.log('Fixed banner');
} else {
  console.log('Target not found');
}
