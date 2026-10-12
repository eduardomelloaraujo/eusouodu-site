// Teste do gerador de PDF com dados de exemplo (sem IA e sem e-mail)
import { mapaNatal, transitosPeriodo, semanas, NOMES } from '../lib/astro.mjs';
import { montarPdfHtml, gerarPdf } from '../lib/pdf.mjs';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  try {
    const pessoa = { nome: 'Exemplo', data: '1990-07-21', hora: '09:40', cidade: 'Salvador, Bahia, Brasil', tz: 'America/Bahia', lat: -12.9714, lon: -38.5014 };
    const natal = mapaNatal(pessoa); const [s] = semanas(transitosPeriodo(natal, '2026-10-13', 7));
    const rel = { pessoa, plano: 7, inicio: s.inicio, fim: s.fim,
      natal: Object.fromEntries(Object.entries(natal.planetas).map(([k, p]) => [NOMES[k], { signo: p.signo, grau: p.grau, casa: p.casa }])),
      semanas: [{ rotulo: s.rotulo, melhores: s.melhores, fases: s.fases, cartaNome: 'A Estrela (XVII)', cartaLeitura: 'Teste.', chave: { titulo: 'Teste do PDF', texto: 'Texto de teste.' }, lua: [], cor: { nome: 'Azul', hex: '#5B6E8C', texto: 'Teste.' }, incenso: { nome: 'Olíbano', texto: 'Teste.' }, oleo: { nome: 'Lavanda', texto: 'Teste.' },
        dias: s.dias.map(d => ({ data: d.data, rotulo: d.rotulo, energia: d.energia, lua: d.lua, titulo: 'Dia', texto: 'Teste.' })) }] };
    const pdf = await gerarPdf(montarPdfHtml(rel));
    res.setHeader('content-type', 'application/pdf');
    return res.status(200).send(pdf);
  } catch (e) {
    return res.status(500).send(String(e.stack || e));
  }
}
