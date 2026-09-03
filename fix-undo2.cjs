const fs = require('fs');
const path = 'src/components/CampanhaPublicaView.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/                    : 'GERAR PIX AGORA'\s+<\/button>/g, 
`                    : 'GERAR PIX AGORA'
                )}
              </button>
            )}`);

fs.writeFileSync(path, code, 'utf8');
