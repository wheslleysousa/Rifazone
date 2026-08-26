const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const search = `        const todosPedidos = await db.getTodosPedidos();
        const pedidoEncontrado = todosPedidos.find(p => p.mpPaymentId === \`efi_\${txid}\` || p.id === txid);`;

const insert = `        let pedidoEncontrado = await db.getPedido(txid) || undefined;
        if (!pedidoEncontrado) {
          pedidoEncontrado = await db.getPedidoPorPaymentId(\`efi_\${txid}\`) || undefined;
        }`;

code = code.replace(search, insert);
fs.writeFileSync('server.ts', code);
