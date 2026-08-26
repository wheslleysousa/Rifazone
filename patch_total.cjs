const fs = require('fs');
let code = fs.readFileSync('src/components/CampanhaPublicaView.tsx', 'utf8');

const regexTotal = /const valorTotalAtual = cupomAplicado\n\s*\? Number\(\(valorSemCupom \* \(1 - cupomAplicado\.descontoPct \/ 100\)\)\.toFixed\(2\)\)\n\s*: valorSemCupom;/;

const newTotalLogic = `let valorBase = cupomAplicado
    ? Number((valorSemCupom * (1 - cupomAplicado.descontoPct / 100)).toFixed(2))
    : valorSemCupom;
    
  if (metodoPagamento === 'pix' && data?.campanha?.checkout?.pixConfig?.descontoPct) {
    valorBase = Number((valorBase * (1 - data.campanha.checkout.pixConfig.descontoPct / 100)).toFixed(2));
  }
  const valorTotalAtual = valorBase;`;

code = code.replace(regexTotal, newTotalLogic);

fs.writeFileSync('src/components/CampanhaPublicaView.tsx', code);
