const fs = require('fs');
const path = 'src/components/CampanhaPublicaView.tsx';
let code = fs.readFileSync(path, 'utf8');

const target = `                    : 'GERAR PIX AGORA'
                   </button>
                 
                  {/* Action Button for Form */}`;

const replacement = `                    : 'GERAR PIX AGORA'
                )}
              </button>
            )}
                 
                  {/* Action Button for Form */}`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
}

fs.writeFileSync(path, code, 'utf8');
