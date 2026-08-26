const fs = require('fs');
let code = fs.readFileSync('src/components/admin/TemaBuilderView.tsx', 'utf8');

code = code.replace(/onChangeCampanha\(prev => \{ checkout:/g, "onChangeCampanha(prev => ({ ...prev, checkout:");

// Fix end parenthesis
code = code.replace(/e\.target\.checked \} \} \}\)/g, "e.target.checked } } }))");
code = code.replace(/layout: e\.target\.value as any \} \}\)/g, "layout: e.target.value as any } }))");
code = code.replace(/minutos: parseInt\(e\.target\.value\) \} \} \}\)/g, "minutos: parseInt(e.target.value) } } }))");
code = code.replace(/descontoPct: parseFloat\(e\.target\.value\) \|\| undefined \} \} \}\)/g, "descontoPct: parseFloat(e.target.value) || undefined } } }))");

fs.writeFileSync('src/components/admin/TemaBuilderView.tsx', code);
