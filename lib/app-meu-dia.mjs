// eusouodu app: o dia cruzado com o mapa natal da pessoa.
// GET /api/app-meu-dia?data=AAAA-MM-DD&hora=HH:MM&tz=Area/Cidade&lat=..&lon=..&d=AAAA-MM-DD
// Sem hora de nascimento: usa meio-dia e não fala de casas nem de Ascendente.
import { mapaNatal, resumoNatal, partesLocais } from './astro.mjs';
import { transitosNoMapa } from './app.mjs';
import { escrever, blocos } from './voz.mjs';


const lista = xs => xs.map(t => `${t.transito}${t.retro ? ' retrógrado' : ''} em ${t.aspecto} com ${t.natal} natal${t.exatoHoje ? ' (exato hoje)' : ''}, de ${t.rotulo}`).join('; ');

export default async function handler(req, res) {
  const q = req.query || {};
  const data = String(q.data || ''), semHora = !q.hora, hora = semHora ? '12:00' : String(q.hora);
  const tz = String(q.tz || 'America/Sao_Paulo'), lat = +q.lat, lon = +q.lon;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(q.d || '') ? q.d : partesLocais(new Date()).data;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !/^\d{2}:\d{2}$/.test(hora) || !isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return res.status(400).json({ erro: 'dados incompletos' });
  }
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); } catch { return res.status(400).json({ erro: 'fuso inválido' }); }

  try {
    const natal = mapaNatal({ data, hora, tz, lat, lon });
    const tr = transitosNoMapa(natal, iso);
    if (semHora) {
      // sem hora o Ascendente, o Meio do Céu e as casas não são confiáveis
      const fora = t => t.natal !== 'Ascendente' && t.natal !== 'Meio do Céu';
      tr.curtos = tr.curtos.filter(fora); tr.longos = tr.longos.filter(fora);
      tr.lua_aspectos = tr.lua_aspectos.filter(fora);
      for (const t of [...tr.curtos, ...tr.longos]) delete t.casa;
      delete tr.lua.casaNatal;
      tr.mudancas = tr.mudancas.filter(m => m.tipo !== 'casa');
    }
    const resumo = semHora ? resumoNatal(natal).split('; ').filter(s => !/^Ascendente|^Meio do Céu/.test(s)).map(s => s.replace(/, casa \d+/, '')).join('; ') : resumoNatal(natal);
    const bruto = await escrever(`Mapa natal: ${resumo}.${semHora ? ' (Sem hora de nascimento: não fale de casas nem de Ascendente.)' : ''}
Dia: ${iso}. Tom geral do dia para esta pessoa: ${tr.energia}.
Lua de hoje em ${tr.lua.signo}${tr.lua.casaNatal ? `, passando pela casa ${tr.lua.casaNatal} do mapa` : ''}${tr.lua_aspectos.length ? `; toca ${tr.lua_aspectos.map(a => `${a.natal} natal em ${a.aspecto}`).join(', ')}` : ''}.
Trânsitos curtos ativos: ${lista(tr.curtos) || 'nenhum'}.
Trânsitos longos ativos (pano de fundo de meses): ${lista(tr.longos) || 'nenhum'}.
Mudanças do dia: ${tr.mudancas.map(m => JSON.stringify(m)).join('; ') || 'nenhuma'}.

Tarefa: escreva a leitura pessoal deste dia, cruzando a energia astrológica do dia com este mapa. Comece pelo trânsito curto mais forte (o exato hoje pesa mais) e deixe o longo aparecer como pano de fundo, sem listar trânsitos.
Aprofunde o movimento psicológico que isso mexe nesta pessoa e aterrisse no cotidiano.

Responda exatamente neste formato, sem mais nada:
TITULO: (de 2 a 6 palavras, sem dois pontos)
TEXTO: (de 140 a 200 palavras, 3 parágrafos curtos separados por linha em branco)
TRABALHO: (de 40 a 60 palavras: um trabalho pessoal específico para hoje, concreto, que a pessoa consiga fazer no dia)`);
    const texto = bruto ? blocos(bruto, ['TITULO', 'TEXTO', 'TRABALHO']) : null;
    res.setHeader('Cache-Control', texto && texto.texto ? 'private, max-age=21600' : 'no-store');
    return res.status(200).json({ ...tr, semHora, texto: texto && texto.texto ? texto : null });
  } catch (e) {
    console.error('app-meu-dia:', e);
    return res.status(500).json({ erro: 'falha' });
  }
}
