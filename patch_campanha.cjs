const fs = require('fs');
let code = fs.readFileSync('src/components/CampanhaPublicaView.tsx', 'utf8');

// Replace `campanha.exigirCpf` with `(campanha.checkout?.coletaDados?.exigirCpf || campanha.exigirCpf)`
code = code.replace(/campanha\.exigirCpf/g, "(campanha.checkout?.coletaDados?.exigirCpf || campanha.exigirCpf)");

// Replace `campanha.exigirEmail` with `(campanha.checkout?.coletaDados?.exigirEmail || campanha.exigirEmail)`
code = code.replace(/campanha\.exigirEmail/g, "(campanha.checkout?.coletaDados?.exigirEmail || campanha.exigirEmail)");

// Also check the checkbox for methods based on `campanha.checkout.metodos`
const regexMetodosAtivos = /const metodosAtivos = \[\n\s*\.\.\.\(chk\.metodos\?\.pix !== false \? \['pix'\] : \[\]\),\n\s*\.\.\.\(chk\.metodos\?\.cartao \? \['cartao'\] : \[\]\),\n\s*\.\.\.\(chk\.metodos\?\.boleto \? \['boleto'\] : \[\]\)\n\s*\];/m;

const replacementMetodos = `const metodosAtivos = [
                ...(chk.metodos?.pix !== false ? ['pix'] : []),
                ...(chk.metodos?.cartao ? ['cartao'] : []),
                ...(chk.metodos?.boleto ? ['boleto'] : [])
              ];`;
code = code.replace(regexMetodosAtivos, replacementMetodos);

fs.writeFileSync('src/components/CampanhaPublicaView.tsx', code);
