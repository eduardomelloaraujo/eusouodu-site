// Reenvio manual de um relatório: /api/mapa-reenviar?id=PAGAMENTO&chave=ADMIN_KEY[&para=outro@email]
import { processarPagamento } from '../lib/processar.mjs';

const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
export const config = { maxDuration: 300 };

export default async function handler(req, res) {
  const { id, chave, para } = req.query || {};
  if (!process.env.ADMIN_KEY || norm(chave) !== norm(process.env.ADMIN_KEY)) return res.status(403).send('Chave inválida.');
  if (!id) return res.status(400).send('Falta o id do pagamento.');
  try {
    const r = await processarPagamento(String(id), { forcar: true, para: para || undefined });
    return res.status(200).json(r);
  } catch (e) {
    return res.status(500).json({ erro: String(e.message || e) });
  }
}
