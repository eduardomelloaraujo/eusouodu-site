// Recebe o aviso de pagamento do Mercado Pago, gera o relatório e envia por e-mail
import { waitUntil } from '@vercel/functions';
import { processarPagamento } from '../lib/processar.mjs';
import { atualizarAssinatura, mp } from '../lib/jornada.mjs';

export const config = { maxDuration: 300 };

export default async function handler(req, res) {
  const q = req.query || {};
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const tipo = b.type || b.topic || q.type || q.topic;
  const id = (b.data && b.data.id) || q['data.id'] || q.id;
  // avisos de assinatura configurados no painel do Mercado Pago chegam aqui: repassa para a Jornada
  if (id && /subscription_preapproval|^preapproval$/.test(String(tipo))) { waitUntil(atualizarAssinatura(String(id)).catch(e => console.error('jornada assinatura', id, e.message))); return res.status(200).send('ok'); }
  if (id && /authorized_payment/.test(String(tipo))) { waitUntil(mp(`/authorized_payments/${encodeURIComponent(id)}`).then(ap => ap.preapproval_id && atualizarAssinatura(ap.preapproval_id)).catch(e => console.error('jornada cobrança', id, e.message))); return res.status(200).send('ok'); }
  if (tipo !== 'payment' || !id) return res.status(200).send('ok');
  waitUntil(processarPagamento(String(id)).catch(e => console.error('falha no pagamento', id, e)));
  return res.status(200).send('ok');
}
