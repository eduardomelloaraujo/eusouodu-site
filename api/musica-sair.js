// Música Astral: tira o e-mail da lista (link no fim de cada e-mail e cancelamento de um clique).
import { temBanco, redis, CHAVE_LISTA, chavePessoa, assinatura } from '../lib/musica.mjs';

const pagina = (titulo, texto) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titulo} · eusouodu</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500&display=swap"></head>
<body style="margin:0;background:#faf8f4;color:#1d1a16;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;padding:24px;box-sizing:border-box">
<main style="max-width:440px;text-align:center"><p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;margin:0 0 24px">eu<i style="color:#a8843f">sou</i>odu</p>
<h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:40px;margin:0 0 12px">${titulo}</h1><p style="color:#6f685d;line-height:1.6;margin:0 0 24px">${texto}</p>
<a href="https://eusouodu.com/musica/" style="color:#1d1a16">Voltar para a Música Astral</a></main></body></html>`;

export default async function handler(req, res) {
  const email = String(req.query.e || '').toLowerCase();
  const ok = email && String(req.query.s || '') === assinatura(email);
  res.setHeader('content-type', 'text/html; charset=utf-8');
  if (!ok) return res.status(400).send(pagina('Link incompleto', 'Esse link de saída não está completo. Se quiser parar de receber, escreve para falecom@eusouodu.com que a gente tira na hora.'));
  try {
    if (temBanco()) { await redis('DEL', chavePessoa(email)); await redis('SREM', CHAVE_LISTA, email); }
    return res.status(200).send(pagina('Pronto', 'Os e-mails da música do dia param por aqui. O disco continua no site, girando, para quando der vontade de voltar.'));
  } catch (e) {
    console.error('musica-sair', e);
    return res.status(500).send(pagina('Não deu certo', 'Tenta de novo daqui a pouco, ou escreve para falecom@eusouodu.com.'));
  }
}
