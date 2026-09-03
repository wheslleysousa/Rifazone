const fs = require('fs');
const path = 'src/components/PixPaymentModal.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/if \(inline\) return content;(\s+)<div className="fixed inset-0/, 'if (inline) return content;$1return (\n    <div className="fixed inset-0');

fs.writeFileSync(path, code, 'utf8');
