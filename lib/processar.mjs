// Do pagamento aprovado até o e-mail entregue
import { gerarRelatorio } from './relatorio.mjs';
import { montarEmail, montarEmailCurto, enviarEmail } from './email.mjs';
import { montarPdfHtml, gerarPdf } from './pdf.mjs';

// monta o envio: e-mail curto + PDF; se o PDF falhar, manda o relatório inteiro no corpo do e-mail
export async function prepararEnvio(rel) {
  try {
    const pdf = await gerarPdf(montarPdfHtml(rel));
    const { assunto, html } = montarEmailCurto(rel);
    const nome = (rel.plano > 7 ? 'o-mes-no-seu-mapa-' : 'a-semana-no-seu-mapa-') + rel.inicio + '.pdf';
    return { assunto, html, anexos: [{ filename: nome, content: pdf.toString('base64') }] };
  } catch (e) {
    console.error('PDF falhou, enviando no corpo do e-mail', e);
    return montarEmail(rel);
  }
}
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

// envia duas vezes: a original (com cópia oculta para o Eduardo, como registro) e, 30 segundos depois, uma cópia
const espera = ms => new Promise(r => setTimeout(r, ms));
async function enviarDuasVezes({ para, assunto, html, anexos, chave }) {
  await enviarEmail({ para, assunto, html, anexos, chave, copiaOculta: process.env.REGISTRO_EMAIL || 'falecom@eusouodu.com' });
  await espera(30000);
  try { await enviarEmail({ para, assunto: `Cópia do seu relatório · ${assunto}`, html, anexos, chave: chave ? `${chave}-copia` : undefined }); }
  catch (e) { console.error('a cópia não foi enviada', e); }
}

// cortesia: gera e envia sem pagamento (usado pela página protegida pela ADMIN_KEY)
export async function gerarEEnviar(pessoa, plano, inicio, para) {
  const rel = await gerarRelatorio(pessoa, plano === 30 ? 30 : 7, inicio);
  const { assunto, html, anexos } = await prepararEnvio(rel);
  await enviarDuasVezes({ para: para || pessoa.email, assunto, html, anexos });
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
    const { assunto, html, anexos } = await prepararEnvio(rel);
    await enviarDuasVezes({ para: para || pessoa.email, assunto, html, anexos, chave: forcar ? undefined : `mapa-${id}` });
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
