const fs = require('fs');
const path = 'src/types.ts';
let code = fs.readFileSync(path, 'utf8');

const target = `export const DEFAULT_CHECKOUT_CONFIG: CheckoutConfig = {
  layout: 'padrao',`;
const replacement = `export const DEFAULT_CHECKOUT_CONFIG: CheckoutConfig = {
  layout: 'padrao',
  ordemElementos: ['banner', 'temporizador', 'mensagemUrgencia', 'dadosComprador', 'divisorEtapas', 'metodosPagamento', 'cupomDesconto', 'resumoPedido', 'selosSeguranca'],`;

code = code.replace(target, replacement);
fs.writeFileSync(path, code, 'utf8');
