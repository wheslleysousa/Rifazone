const fs = require('fs');
let code = fs.readFileSync('src/components/admin/TemaBuilderView.tsx', 'utf8');

code = code.replace(/atualizarTema\(\{ botao: \{ \.\.\.temaSeguro\.botao, estiloCotas: e\.target\.value as any \} \}\)\)/, "atualizarTema({ botao: { ...temaSeguro.botao, estiloCotas: e.target.value as any } })");
code = code.replace(/atualizarTema\(\{ fundoMidia: \{ \.\.\.temaSeguro\.fundoMidia, tipo: m\.id as any \} \}\)\)/, "atualizarTema({ fundoMidia: { ...temaSeguro.fundoMidia, tipo: m.id as any } })");
code = code.replace(/atualizarTema\(\{ ganhadorCelebracaoEstilo: e\.target\.value as any \}\)\)/, "atualizarTema({ ganhadorCelebracaoEstilo: e.target.value as any })");
code = code.replace(/atualizarTema\(\{ organizadorCabecalho: \{ \.\.\.temaSeguro\.organizadorCabecalho, logoAlinhamento: al\.id as any \} \}\)\)/, "atualizarTema({ organizadorCabecalho: { ...temaSeguro.organizadorCabecalho, logoAlinhamento: al.id as any } })");

fs.writeFileSync('src/components/admin/TemaBuilderView.tsx', code);
