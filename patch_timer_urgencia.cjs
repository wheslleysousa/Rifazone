const fs = require('fs');
let code = fs.readFileSync('src/components/admin/TemaBuilderView.tsx', 'utf8');

// Ensure checkout is properly patched
code = code.replace(/timerUrgencia: \{ \.\.\.\(prev\.checkout\?\.timerUrgencia\), ativo: e\.target\.checked \} \} \}\)/g, "timerUrgencia: { ...(prev.checkout?.timerUrgencia), ativo: e.target.checked } } }))");

fs.writeFileSync('src/components/admin/TemaBuilderView.tsx', code);
