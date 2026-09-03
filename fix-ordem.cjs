const fs = require('fs');
const path = 'src/components/admin/checkout/OrdemElementosTab.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "selosSeguranca: { label: 'Selos de Segurança   selosSeguranca: { label: 'Selos de Segurança & Garantia', desc: 'Badges de SSL, Compra Segura e Entrega Garantida', icon: '🛡️' }, Garantia', desc: 'Badges de SSL, Compra Segura e Entrega Garantida', icon: '🛡️' },",
  "selosSeguranca: { label: 'Selos de Segurança & Garantia', desc: 'Badges de SSL, Compra Segura e Entrega Garantida', icon: '🛡️' },"
);

fs.writeFileSync(path, code, 'utf8');
