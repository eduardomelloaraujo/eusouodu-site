# Teste de ponta a ponta do app da Jornada no Chromium: página de captação e todas as lições das jornadas 2 e 3
# para vários mapas. Uso: python3 scripts/jornada/testar.py [pasta-de-saída]
import json, sys, os, time, threading, http.server, functools, glob
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__)) + '/'
REPO = os.path.abspath(HERE + '../..') + '/'
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/jornada-teste'
os.makedirs(OUT, exist_ok=True)
PORT = 8765
srv = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(http.server.SimpleHTTPRequestHandler, directory=REPO))
srv.RequestHandlerClass.log_message = lambda *a: None
threading.Thread(target=srv.serve_forever, daemon=True).start()

unidades = [json.load(open(f)) for f in sorted(glob.glob(REPO + 'lib/jornada/*.json')) if os.path.basename(f) not in ('mapa.json', 'transitos.json')]
extras = {k: json.load(open(REPO + f'lib/jornada/{k}.json')) for k in ('mapa', 'transitos')}
PERFIS = [
    dict(nome='Ana Luiza', birth='1988-07-21', time='14:35', unknownTime=False, city=['Salvador, BA, Brasil', -12.97, -38.5, 'America/Bahia']),
    dict(nome='Bia', birth='2003-01-09', time='', unknownTime=True, city=['São Paulo, SP, Brasil', -23.55, -46.63, 'America/Sao_Paulo']),
    dict(nome='Clara', birth='1955-11-30', time='06:10', unknownTime=False, city=['Lisboa, Portugal', 38.72, -9.14, 'Europe/Lisbon']),
    dict(nome='Duda', birth='1997-04-02', time='23:50', unknownTime=False, city=['Manaus, AM, Brasil', -3.12, -60.02, 'America/Manaus']),
]
BAD = ['undefined', 'null', 'NaN', '[object', '{A}', '{B}', '{a}', '{b}']
erros = []

def rotas(page, perfil, ativo=True):
    plano = {'type': 'semana', 'until': int(time.time() * 1000) + 5 * 864e5, 'canceled': False, 'status': None, 'ativo': True} if ativo else None
    def h(route):
        u = route.request.url
        if 'a=conteudo' in u:
            body = {'unidades': unidades, **extras}
        else:
            body = {'email': 'teste@exemplo.com', 'perfil': perfil, 'progresso': None, 'plano': plano, 'precos': {'semana': 9.9, 'mes': 29.9}}
        route.fulfill(status=200, content_type='application/json', body=json.dumps(body, ensure_ascii=False))
    page.route('**/api/jornada**', h)

with sync_playwright() as p:
    b = p.chromium.launch()
    # 1) página de captação
    for nome, vp, ua in [('iphone', {'width': 390, 'height': 844}, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'),
                         ('desktop', {'width': 1280, 'height': 900}, None)]:
        ctx = b.new_context(viewport=vp, user_agent=ua, device_scale_factor=2 if nome == 'iphone' else 1, reduced_motion='reduce')
        pg = ctx.new_page(); logs = []
        pg.on('pageerror', lambda e: logs.append(str(e)))
        pg.goto(f'http://127.0.0.1:{PORT}/jornada/index.html'); pg.wait_for_timeout(800)
        pg.screenshot(path=f'{OUT}/landing-{nome}.png', full_page=True)
        w = pg.evaluate('document.documentElement.scrollWidth');
        if w > vp['width'] + 1: erros.append(f'landing {nome}: rolagem horizontal {w}')
        if logs: erros.append(f'landing {nome}: {logs}')
        ctx.close()
    # 2) lições geradas para cada perfil
    for perfil in PERFIS:
        ctx = b.new_context(viewport={'width': 390, 'height': 844})
        pg = ctx.new_page(); logs = []
        pg.on('pageerror', lambda e: logs.append(str(e)))
        pg.on('console', lambda m: logs.append(m.text) if m.type == 'error' else None)
        rotas(pg, perfil)
        pg.add_init_script('localStorage.setItem("jornada-sessao","tok")')
        pg.goto(f'http://127.0.0.1:{PORT}/jornada/index.html'); pg.wait_for_timeout(1500)
        res = pg.evaluate('''() => { const out=[]; for(const j of [2,3]) for(let i=1;i<12;i++){ const t0=performance.now(); let L=null, err=null; try{ L=buildJ(j,i); }catch(e){ err=String(e); }
            const ms=Math.round(performance.now()-t0);
            if(!L){ out.push({j,i,err:err||"nulo",ms}); continue; }
            if(L.needTime){ out.push({j,i,needTime:true,ms}); continue; }
            const txt=[]; const walk=x=>{ if(typeof x==="string") txt.push(x); else if(Array.isArray(x)) x.forEach(walk); else if(x&&typeof x==="object") Object.values(x).forEach(walk); }; walk(L);
            let rerr=null; try{ startLesson(L); for(let k=0;k<L.steps.length;k++){ pos=k; render(); } }catch(e){ rerr=String(e); }
            out.push({j,i,id:L.id,n:L.steps.length,ms,rerr,txt:txt.join(" \\u2016 ")}); }
          return out; }''')
        nomef = perfil['nome'].split()[0].lower()
        with open(f'{OUT}/licoes-{nomef}.txt', 'w') as f:
            for r in res:
                f.write(json.dumps({k: v for k, v in r.items() if k != 'txt'}, ensure_ascii=False) + '\n')
                if r.get('txt'): f.write(r['txt'] + '\n\n')
                if r.get('err') or r.get('rerr'): erros.append(f"{nomef} j{r['j']} l{r['i']+1}: {r.get('err') or r.get('rerr')}")
                if r.get('ms', 0) > 1500: erros.append(f"{nomef} j{r['j']} l{r['i']+1}: lento {r['ms']}ms")
                for bad in BAD:
                    if r.get('txt') and bad in r['txt']: erros.append(f"{nomef} j{r['j']} l{r['i']+1}: contém {bad}")
        # tela inicial com a jornada 2 e 3
        pg.evaluate('()=>{ show("home"); S.j=2; renderHome(); }'); pg.wait_for_timeout(300)
        pg.screenshot(path=f'{OUT}/home-j2-{nomef}.png', full_page=True)
        pg.evaluate('()=>{ S.j=3; renderHome(); }'); pg.wait_for_timeout(300)
        pg.screenshot(path=f'{OUT}/home-j3-{nomef}.png', full_page=True)
        pg.evaluate('()=>{ const L=buildJ(2,1); startLesson(L); pos=3; render(); }'); pg.wait_for_timeout(200)
        pg.screenshot(path=f'{OUT}/licao-{nomef}.png')
        if logs: erros.append(f'{nomef}: console {logs[:5]}')
        ctx.close()
    # 3) sem plano: a trilha mostra os cadeados
    ctx = b.new_context(viewport={'width': 390, 'height': 844}); pg = ctx.new_page()
    rotas(pg, PERFIS[0], ativo=False); pg.add_init_script('localStorage.setItem("jornada-sessao","tok")')
    pg.goto(f'http://127.0.0.1:{PORT}/jornada/index.html'); pg.wait_for_timeout(1200)
    pg.evaluate('()=>{ show("home"); S.j=2; renderHome(); }'); pg.wait_for_timeout(200)
    pg.screenshot(path=f'{OUT}/home-j2-gratis.png', full_page=True)
    locked = pg.evaluate('document.querySelectorAll(".road.locked").length')
    if locked != 11: erros.append(f'sem plano: {locked} cadeados (esperava 11)')
    b.close()
srv.shutdown()
print('\n'.join(erros) if erros else 'tudo certo')
print('saída em', OUT)
