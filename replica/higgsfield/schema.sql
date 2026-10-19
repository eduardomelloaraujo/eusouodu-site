-- estúdio orbe: banco local (SQLite, node:sqlite)
-- um usuário só, numa máquina só: sem coluna de dono e sem regras por linha
pragma foreign_keys = on;
pragma journal_mode = wal;

-- estilos de imagem e movimentos de câmera
create table presets (
  id text primary key,
  tipo text not null check (tipo in ('imagem', 'movimento')),
  nome text not null,
  molde text not null,                 -- prompt com {assunto} no lugar do texto do usuário
  negativo text not null default '',
  modelo text not null check (modelo in ('flux-schnell', 'wan22-5b', 'ltx', 'runway')),
  parametros text not null default '{}',   -- json: passos, quadros, força, lora...
  exemplo_id text references arquivos(id) on delete set null,
  ordem integer not null default 0,
  ativo integer not null default 1 check (ativo in (0, 1)),
  criado_em text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  atualizado_em text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index presets_tipo on presets (tipo, ativo, ordem);

-- tudo que existe em disco: uploads e saídas
create table arquivos (
  id text primary key,
  caminho text not null unique,        -- relativo a ~/orbe-estudio/arquivos
  tipo text not null check (tipo in ('imagem', 'video', 'audio')),
  mime text not null,
  bytes integer not null check (bytes >= 0),
  largura integer,
  altura integer,
  duracao_ms integer,
  origem text not null check (origem in ('upload', 'gerado')),
  criado_em text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index arquivos_origem on arquivos (origem, criado_em);

-- personagem consistente (LoRA treinado fora e copiado para o ComfyUI)
create table personagens (
  id text primary key,
  nome text not null,
  arquivo_lora text,                   -- nome do arquivo na pasta de LoRAs do ComfyUI
  palavra_gatilho text,
  status text not null default 'fotos' check (status in ('fotos', 'treinando', 'pronto', 'erro')),
  consentimento integer not null default 0 check (consentimento in (0, 1)),
  criado_em text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  atualizado_em text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- a fila e a biblioteca
create table geracoes (
  id text primary key,
  tipo text not null check (tipo in ('imagem', 'texto_video', 'imagem_video', 'inpaint', 'lipsync')),
  motor text not null default 'local' check (motor in ('local', 'runway')),
  preset_id text references presets(id) on delete set null,
  movimento_id text references presets(id) on delete set null,
  personagem_id text references personagens(id) on delete set null,
  prompt text not null,
  prompt_final text,                   -- o prompt depois do molde, como foi enviado
  entrada_id text references arquivos(id) on delete restrict,
  mascara_id text references arquivos(id) on delete restrict,
  audio_id text references arquivos(id) on delete restrict,
  proporcao text not null default '9:16' check (proporcao in ('9:16', '1:1', '4:5', '16:9')),
  duracao_s real check (duracao_s is null or duracao_s between 1 and 10),
  semente integer,
  status text not null default 'fila'
    check (status in ('aguardando_confirmacao', 'fila', 'gerando', 'pronto', 'erro', 'cancelado')),
  progresso real not null default 0 check (progresso between 0 and 1),
  id_remoto text,                      -- prompt_id do ComfyUI ou task id do Runway, para retomar
  custo_creditos integer check (custo_creditos is null or custo_creditos >= 0),
  erro text,
  saida_id text references arquivos(id) on delete set null,
  origem_id text references geracoes(id) on delete set null,   -- "repetir" aponta para a original
  criado_em text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  iniciado_em text,
  terminado_em text,
  atualizado_em text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  check (motor = 'local' or status <> 'fila' or custo_creditos is not null),
  check (tipo <> 'imagem_video' or entrada_id is not null),
  check (tipo <> 'inpaint' or (entrada_id is not null and mascara_id is not null)),
  check (tipo <> 'lipsync' or (entrada_id is not null and audio_id is not null))
);
create index geracoes_fila on geracoes (status, criado_em);
create index geracoes_biblioteca on geracoes (tipo, criado_em desc);
create index geracoes_preset on geracoes (preset_id);
create index geracoes_movimento on geracoes (movimento_id);
create index geracoes_personagem on geracoes (personagem_id);
create index geracoes_entrada on geracoes (entrada_id);
create index geracoes_saida on geracoes (saida_id);
-- só uma geração rodando por vez (32 GB não aguentam duas)
create unique index uma_por_vez on geracoes (status) where status = 'gerando';

-- gasto no Runway, para o teto mensal
create table custos_runway (
  id text primary key,
  geracao_id text not null references geracoes(id) on delete cascade,
  creditos integer not null check (creditos >= 0),
  mes text not null,                   -- 'AAAA-MM', em UTC
  criado_em text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index custos_mes on custos_runway (mes);
create index custos_geracao on custos_runway (geracao_id);
