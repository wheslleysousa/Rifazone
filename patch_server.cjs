const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace(
`    const todosPedidos = await db.getTodosPedidos();
    let pedidoEncontrado = todosPedidos.find(p => p.mpPaymentId === String(paymentId));`,
`    let pedidoEncontrado = await db.getPedidoPorPaymentId(String(paymentId));`
);

code = code.replace(
`    if (!pedidoEncontrado && pagamento?.external_reference) {
      pedidoEncontrado = todosPedidos.find(p => p.id === pagamento.external_reference);
    }`,
`    if (!pedidoEncontrado && pagamento?.external_reference) {
      pedidoEncontrado = await db.getPedido(pagamento.external_reference);
    }`
);

fs.writeFileSync('server.ts', code);
