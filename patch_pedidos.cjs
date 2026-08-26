const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const search = `    const campanhas = await db.getCampanhas((req as any).userId);
    const campanhaIds = new Set(campanhas.map(c => c.id));
    const todosPedidos = await db.getTodosPedidos();
    const meusPedidos = todosPedidos.filter(p => campanhaIds.has(p.campanhaId));`;

const insert = `    const campanhas = await db.getCampanhas((req as any).userId);
    const arraysOfPedidos = await Promise.all(campanhas.map(c => db.getPedidosPorCampanha(c.id)));
    const meusPedidos = arraysOfPedidos.flat();`;

code = code.replace(search, insert);
fs.writeFileSync('server.ts', code);
