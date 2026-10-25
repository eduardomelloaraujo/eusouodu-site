// Confere as regras puras do Passe do céu: node scripts/passe-teste.mjs
import assert from 'node:assert/strict';
import { passeAtivo, planoDe, planoAtivo, periodoUso } from '../lib/jornada.mjs';
const agora = Date.now(), dia = 864e5;
const passe = { since: agora, until: agora + 30 * dia, ciclo: 'p1' };
assert.equal(passeAtivo({ passe }), true);
assert.equal(passeAtivo({ passe: { ...passe, until: agora - 1 } }), false);
assert.equal(passeAtivo({}), false);
// sem plano da Jornada: o passe abre a Jornada
assert.equal(planoAtivo(planoDe({ passe, plano: null })), true);
assert.equal(planoDe({ passe, plano: null }).until, passe.until);
// passe semanal da Jornada mais curto: vale o passe
assert.equal(planoDe({ passe, plano: { type: 'semana', until: agora + 3 * dia } }).until, passe.until);
// passe vencido: fica o plano da Jornada como está
assert.equal(planoDe({ passe: { ...passe, until: agora - 1 }, plano: null }), null);
assert.equal(periodoUso({ passe }, 'sonhos'), 'p1');
assert.match(periodoUso({ passe }, 'juri'), /^\d{4}-\d{2}-\d{2}$/);
console.log('passe: ok');
