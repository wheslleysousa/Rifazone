const fs = require('fs');
let code = fs.readFileSync('server/storage.ts', 'utf-8');
const search = `  public async getTodosPedidos(): Promise<Pedido[]> {`;
const insert = `  public async getPedidoPorPaymentId(paymentId: string): Promise<Pedido | null> {
    const pedidos = await this.getTodosPedidos();
    return pedidos.find(p => p.mpPaymentId === paymentId || p.efiPaymentId === paymentId || p.id === paymentId.replace('carteira_', '')) || null;
  }

`;
if (!code.includes('getPedidoPorPaymentId')) {
  code = code.replace(search, insert + search);
  fs.writeFileSync('server/storage.ts', code);
}
