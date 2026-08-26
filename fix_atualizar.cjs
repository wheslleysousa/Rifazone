const fs = require('fs');
let code = fs.readFileSync('src/components/admin/TemaBuilderView.tsx', 'utf8');

code = code.replace(/atualizarCampanha\(/g, "onChangeCampanha(prev => ");
code = code.replace(/e\.target\.checked \} \} \}\)/g, "e.target.checked } } }))");
code = code.replace(/e\.target\.value as any \} \}\)/g, "e.target.value as any } }))");

fs.writeFileSync('src/components/admin/TemaBuilderView.tsx', code);
