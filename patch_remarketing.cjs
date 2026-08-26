const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const search = `    const todosPedidos = await db.getTodosPedidos();
    const agoraMs = Date.now();`;

const insert = `    const arraysOfPedidos = await Promise.all(campanhasAtivas.map(c => db.getPedidosPorCampanha(c.id)));
    const todosPedidos = arraysOfPedidos.flat();
    const agoraMs = Date.now();`;

code = code.replace(search, insert);
fs.writeFileSync('server.ts', code);
