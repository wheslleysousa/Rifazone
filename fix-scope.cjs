const fs = require('fs');
const path = 'src/components/CampanhaPublicaView.tsx';
let code = fs.readFileSync(path, 'utf8');

const target = `{(!elementos || !elementos.includes('divisorEtapas') || etapaAtual === 2) && (`;
const replacement = `{(!hasDivisor || etapaAtual === 2) && (`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
}

fs.writeFileSync(path, code, 'utf8');
