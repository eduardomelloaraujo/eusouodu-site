// Recebe o aviso de pagamento do Mercado Pago, gera o relatório e envia por e-mail
import { waitUntil } from '@vercel/functions';
import { processarPagamento } from '../lib/processar.mjs';

export const config = { maxDuration: 300 };

export default async function handler(req, res) {
  const q = req.query || {};
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const tipo = b.type || b.topic || q.type || q.topic;
  const id = (b.data && b.data.id) || q['data.id'] || q.id;
  if (tipo !== 'payment' || !id) return res.status(200).send('ok');
  waitUntil(processarPagamento(String(id)).catch(e => console.error('falha no pagamento', id, e)));
  return res.status(200).send('ok');
}
