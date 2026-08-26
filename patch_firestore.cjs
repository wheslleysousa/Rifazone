const fs = require('fs');
let code = fs.readFileSync('server/firestore-storage.ts', 'utf-8');
const search = `  public async getPedidosPorCampanha(campanhaId: string): Promise<Pedido[]> {`;
const insert = `  public async getPedidoPorPaymentId(paymentId: string): Promise<Pedido | null> {
    const snap = await this.pedidosCol().where('mpPaymentId', '==', paymentId).limit(1).get();
    if (snap.empty) {
      // Fallback para efi/asaas (paymentId, transactionId)
      const snap2 = await this.pedidosCol().where('efiPaymentId', '==', paymentId).limit(1).get();
      if (!snap2.empty) return snap2.docs[0].data() as Pedido;
      
      const snap3 = await this.pedidosCol().where('id', '==', paymentId.replace('carteira_', '')).limit(1).get();
      if (!snap3.empty) return snap3.docs[0].data() as Pedido;

      return null;
    }
    return snap.docs[0].data() as Pedido;
  }

`;
if (!code.includes('getPedidoPorPaymentId')) {
  code = code.replace(search, insert + search);
  fs.writeFileSync('server/firestore-storage.ts', code);
}
