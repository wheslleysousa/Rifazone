const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const searchAsaas = `      const todosPedidos = await db.getTodosPedidos();
      let pedidoEncontrado = todosPedidos.find(p => p.id === externalReference || p.mpPaymentId === \`asaas_\${paymentId}\`);`;

const insertAsaas = `      let pedidoEncontrado = undefined;
      if (externalReference) {
        pedidoEncontrado = await db.getPedido(externalReference) || undefined;
      }
      if (!pedidoEncontrado && paymentId) {
        pedidoEncontrado = await db.getPedidoPorPaymentId(\`asaas_\${paymentId}\`) || undefined;
      }`;

code = code.replace(searchAsaas, insertAsaas);
fs.writeFileSync('server.ts', code);
