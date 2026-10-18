// Subdomínios que abrem um app próprio na raiz. A regra de "rewrites" do vercel.json não vale para "/",
// porque o index.html do site existe e tem prioridade; aqui a troca acontece antes disso.
export const config = { matcher: '/' };

const APPS = {
  'jornada.eusouodu.com': '/jornada/index.html',
  'musica.eusouodu.com': '/musica/index.html',
};

export default function middleware(request) {
  const host = (request.headers.get('host') || '').toLowerCase().split(':')[0];
  const destino = APPS[host];
  if (!destino) return;
  return new Response(null, { headers: { 'x-middleware-rewrite': new URL(destino, request.url).toString() } });
}
