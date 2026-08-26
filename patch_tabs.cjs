const fs = require('fs');
let code = fs.readFileSync('src/components/admin/TemaBuilderView.tsx', 'utf8');

const regexTabs = /\{\s*id: 'organizador', label: 'Logo \/ Topo', icon: User\s*\},/g;
code = code.replace(regexTabs, "{ id: 'organizador', label: 'Logo / Topo', icon: User },\n              { id: 'checkout', label: 'Checkout', icon: ShoppingCart },");

fs.writeFileSync('src/components/admin/TemaBuilderView.tsx', code);
