// Música Astral: a lista de inscritos para o Eduardo, em planilha (CSV) ou em números.
// Uso: /api/musica-lista?key=ADMIN_KEY  (baixa o CSV)  ·  &resumo=1 (só os números)
import { temBanco, redis, CHAVE_LISTA, chavePessoa } from '../lib/musica.mjs';

const cel = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default async function handler(req, res) {
  if (!process.env.ADMIN_KEY || req.query.key !== process.env.ADMIN_KEY) return res.status(401).send('sem permissão');
  if (!temBanco()) return res.status(503).send('o banco ainda não está conectado');
  const emails = (await redis('SMEMBERS', CHAVE_LISTA)) || [];
  const linhas = [];
  for (let i = 0; i < emails.length; i += 50) {
    const regs = await redis('MGET', ...emails.slice(i, i + 50).map(chavePessoa));
    for (const b of regs || []) if (b) linhas.push(JSON.parse(b));
  }
  linhas.sort((a, b) => String(b.criado).localeCompare(String(a.criado)));
  if (req.query.resumo) {
    return res.status(200).json({ total: linhas.length, diario: linhas.filter(l => l.freq === 'diario').length, semanal: linhas.filter(l => l.freq === 'semanal').length });
  }
  const csv = ['email,nome,frequencia,cidade,inscrito_em']
    .concat(linhas.map(l => [l.email, l.perfil?.nome, l.freq === 'semanal' ? 'domingos' : 'todo dia', l.perfil?.city?.[0], (l.criado || '').slice(0, 10)].map(cel).join(',')))
    .join('\n');
  res.setHeader('content-type', 'text/csv; charset=utf-8');
  res.setHeader('content-disposition', 'attachment; filename="musica-astral-inscritos.csv"');
  return res.status(200).send('﻿' + csv);
}
