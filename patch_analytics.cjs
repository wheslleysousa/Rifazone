const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const search = `      const campanhas = await db.getCampanhas(ownerId);
      const campanhaIds = new Set(campanhas.map(c => c.id));
      const todos = await db.getTodosPedidos();
      pedidos = todos.filter(p => campanhaIds.has(p.campanhaId));`;

const insert = `      const campanhas = await db.getCampanhas(ownerId);
      // Fetch concurrently for all campaigns
      const arraysOfPedidos = await Promise.all(campanhas.map(c => db.getPedidosPorCampanha(c.id)));
      pedidos = arraysOfPedidos.flat();`;

code = code.replace(search, insert);
fs.writeFileSync('server.ts', code);
