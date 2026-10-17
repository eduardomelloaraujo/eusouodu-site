// eusouodu app: uma rota só (o plano da Vercel limita o número de funções).
// GET /api/app?r=dia&d=AAAA-MM-DD            → energia astrológica do dia, igual para todos
// GET /api/app?r=meu&data=..&hora=..&tz=..&lat=..&lon=..&d=..  → o dia cruzado com o mapa natal
import dia from '../lib/app-dia.mjs';
import meu from '../lib/app-meu-dia.mjs';

export const config = { maxDuration: 60 };

export default function handler(req, res) {
  const r = (req.query || {}).r;
  if (r === 'dia') return dia(req, res);
  if (r === 'meu') return meu(req, res);
  return res.status(404).json({ erro: 'rota' });
}
