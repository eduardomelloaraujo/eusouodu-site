// Do pagamento aprovado até o e-mail entregue
import { gerarRelatorio } from './relatorio.mjs';
import { montarEmail, enviarEmail } from './email.mjs';
import { partesLocais } from './astro.mjs';

async function buscarPagamento(id) {
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`, { headers: { authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } });
  if (!r.ok) throw new Error(`MP pagamento ${id}: ${r.status}`);
  return r.json();
}

function diaSeguinte(dataPagamento) {
  const hoje = partesLocais(new Date(dataPagamento)).data;
  const [y, m, d] = hoje.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

// cortesia: gera e envia sem pagamento (usado pela página protegida pela ADMIN_KEY)
export async function gerarEEnviar(pessoa, plano, inicio, para) {
  const rel = await gerarRelatorio(pessoa, plano === 30 ? 30 : 7, inicio);
  const { assunto, html } = montarEmail(rel);
  await enviarEmail({ para: para || pessoa.email, assunto, html });
  return { enviado: para || pessoa.email, assunto };
}
export { diaSeguinte };

export async function processarPagamento(id, { forcar = false, para } = {}) {
  const pg = await buscarPagamento(id);
  const md = pg.metadata || {};
  if (md.produto !== 'mapa') return { ignorado: 'outro produto' };
  if (pg.status !== 'approved') return { ignorado: pg.status };
  const pessoa = { nome: md.nome, email: md.email, data: md.data, hora: md.hora, cidade: md.cidade, tz: md.tz, lat: Number(md.lat), lon: Number(md.lon) };
  const plano = Number(md.plano) === 30 ? 30 : 7;
  const inicio = diaSeguinte(pg.date_approved || pg.date_created);
  try {
    const rel = await gerarRelatorio(pessoa, plano, inicio);
    const { assunto, html } = montarEmail(rel);
    await enviarEmail({ para: para || pessoa.email, assunto, html, chave: forcar ? undefined : `mapa-${id}` });
    return { enviado: para || pessoa.email, assunto };
  } catch (e) {
    // avisa o Eduardo para reenviar depois
    try {
      await enviarEmail({
        para: process.env.ALERTA_EMAIL || 'falecom@eusouodu.com',
        assunto: `Falha no relatório do mapa · pagamento ${id}`,
        html: `<p>O relatório do pagamento <b>${id}</b> (${pessoa.nome}, ${pessoa.email}, ${plano} dias) não foi enviado.</p><p>Erro: ${String(e.message || e).replace(/</g, '&lt;')}</p><p>Para reenviar: https://eusouodu.com/api/mapa-reenviar?id=${id}&amp;chave=SUA_CHAVE</p>`,
        chave: `alerta-${id}`,
      });
    } catch {}
    throw e;
  }
}
