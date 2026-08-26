const fs = require('fs');
let code = fs.readFileSync('src/components/admin/TemaBuilderView.tsx', 'utf8');

code = code.replace("</div>\n          )}\n\n        </div>\n\n        {/* COLUNA DA DIREITA: PRÉVIA AO VIVO */}", "</div>\n            </div>\n          )}\n\n        </div>\n\n        {/* COLUNA DA DIREITA: PRÉVIA AO VIVO */}");

fs.writeFileSync('src/components/admin/TemaBuilderView.tsx', code);
