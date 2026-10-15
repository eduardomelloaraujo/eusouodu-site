// Música Astral no servidor: carrega o mesmo motor da página (musica/motor.js) e o catálogo,
// para o e-mail mostrar exatamente a mesma música que o site mostra no dia.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { createHmac } from 'node:crypto';

const require = createRequire(import.meta.url);
const raiz = new URL('../', import.meta.url);

let motor = null;
export function Motor() {
  if (motor) return motor;
  const ctx = { Astronomy: require('./vendor/astronomy.cjs'), Intl, Date, Math, JSON, Object, Array, String, Number };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(readFileSync(new URL('musica/motor.js', raiz), 'utf8'), ctx);
  motor = ctx.MusicaMotor;
  motor.setCatalogo(JSON.parse(readFileSync(new URL('musica/catalogo.json', raiz), 'utf8')));
  return motor;
}

// Perfil guardado: { nome, d, t, sem, city: [rótulo, lat, lon, fuso] }
export function discoDe(perfil, dia) {
  const M = Motor();
  const v = { nome: perfil.nome, d: perfil.d, t: perfil.sem ? '' : (perfil.t || ''), city: perfil.city };
  const ch = M.chartFrom(v);
  if (!ch) return null;
  return M.discoDoDia(v, ch, dia || M.diaLocal());
}

export const hoje = () => Motor().diaLocal();

// Link de saída assinado, sem guardar segredo por pessoa
export const assinatura = email => createHmac('sha256', process.env.ADMIN_KEY || 'musica-astral').update(String(email).toLowerCase()).digest('hex').slice(0, 24);

// Banco: Upstash Redis pela API REST (as variáveis que a Vercel cria ao conectar o banco)
const URL_DB = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN_DB = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
export const temBanco = () => !!(URL_DB() && TOKEN_DB());

export async function redis(...comando) {
  const r = await fetch(URL_DB(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN_DB()}`, 'content-type': 'application/json' },
    body: JSON.stringify(comando),
  });
  const j = await r.json();
  if (j.error) throw new Error('redis: ' + j.error);
  return j.result;
}

export const CHAVE_LISTA = 'musica:inscritos';
export const chavePessoa = email => 'musica:pessoa:' + String(email).toLowerCase();
