-- ============================================================
-- Migração 5 — especificação v2 (Jurídico, Atendimento, WhatsApp, Agenda, ALESP)
-- Rode DEPOIS da migration-4.sql.
-- ============================================================

-- ---------- Proposições (acompanhamento + autoria + ALESP) ----------
alter table proposicoes add column if not exists origem text not null default 'autoria' check (origem in ('autoria', 'acompanhamento'));
alter table proposicoes add column if not exists autor text;
alter table proposicoes add column if not exists resumo text;
alter table proposicoes add column if not exists prejudicialidade text not null default 'Nenhuma' check (prejudicialidade in ('Nenhuma', 'Baixa', 'Média', 'Alta'));
alter table proposicoes add column if not exists temas_prejudiciais text[] default '{}';
alter table proposicoes add column if not exists tramitacao jsonb not null default '[]';
alter table proposicoes add column if not exists observacoes text;
alter table proposicoes add column if not exists alesp_id text;
alter table proposicoes add column if not exists etapa_atual text;
alter table proposicoes add column if not exists ultimo_andamento text;
alter table proposicoes add column if not exists ultimo_andamento_data date;
alter table proposicoes add column if not exists alesp_sincronizado_em timestamptz;
create index if not exists idx_proposicoes_alesp_id on proposicoes (alesp_id);

-- ---------- Documentos & Ofícios ----------
alter table documentos add column if not exists responsavel text;
alter table documentos add column if not exists data_protocolo date;
alter table documentos add column if not exists prazo date;
alter table documentos add column if not exists conteudo text;
alter table documentos add column if not exists modelo_id uuid;

-- ---------- Atendimento ao cidadão ----------
alter table atendimentos add column if not exists responsavel_id uuid references perfis(id) on delete set null;
alter table atendimentos add column if not exists descricao text;
alter table atendimentos add column if not exists observacao text;
alter table atendimentos add column if not exists alerta boolean not null default false;
alter table atendimentos add column if not exists alerta_data date;
alter table atendimentos add column if not exists alerta_texto text;

-- ---------- Agenda (institucional / reunião / externa) ----------
alter table eventos_agenda add column if not exists tipo text not null default 'institucional' check (tipo in ('institucional', 'reuniao', 'externa'));
alter table eventos_agenda add column if not exists endereco text;
alter table eventos_agenda add column if not exists rota_id uuid references rotas(id) on delete set null;

-- ---------- WhatsApp do gabinete (dados NÃO secretos; o token fica na Vercel) ----------
alter table mandato add column if not exists whatsapp_numero text;
alter table mandato add column if not exists whatsapp_phone_id text;

-- ---------- Tabelas novas ----------
create table if not exists modelos_documentos (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null, categoria text not null default 'Outros', conteudo text not null default '',
  ativo boolean not null default true,
  criado_por uuid references perfis(id), criado_em timestamptz default now()
);

create table if not exists modelos_mensagens (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null, texto text not null,
  criado_por uuid references perfis(id), criado_em timestamptz default now()
);

create table if not exists mensagens_enviadas (
  id uuid primary key default uuid_generate_v4(),
  canal text not null, nome text, telefone text, email text, mensagem text not null, campanha text,
  status text not null default 'enviado', erro text,
  criado_por uuid references perfis(id), criado_em timestamptz not null default now()
);
create index if not exists idx_mensagens_enviadas_data on mensagens_enviadas (criado_em desc);

create table if not exists agenda_alesp (
  id uuid primary key default uuid_generate_v4(),
  ext_id text unique, titulo text not null, data date, hora text, local text, url text,
  atualizado_em timestamptz default now()
);

-- ---------- Políticas (mesmo padrão da migração 4) ----------
alter table modelos_documentos enable row level security;
alter table modelos_mensagens enable row level security;
alter table mensagens_enviadas enable row level security;
alter table agenda_alesp enable row level security;

do $$
declare r record; m record;
begin
  for r in select tablename, policyname from pg_policies where schemaname = 'public'
           and tablename in ('modelos_documentos', 'modelos_mensagens', 'mensagens_enviadas', 'agenda_alesp') loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;

  for m in select * from (values
    ('modelos_documentos', 'modelos'), ('modelos_mensagens', 'comunicacao'), ('mensagens_enviadas', 'comunicacao')
  ) as t(tabela, modulo) loop
    execute format('create policy "rbac_select" on public.%I for select to authenticated using (public.tem_permissao(%L, ''ver''))', m.tabela, m.modulo);
    if m.tabela <> 'mensagens_enviadas' then  -- o histórico só é gravado pelo servidor
      execute format('create policy "rbac_insert" on public.%I for insert to authenticated with check (public.tem_permissao(%L, ''criar''))', m.tabela, m.modulo);
      execute format('create policy "rbac_update" on public.%I for update to authenticated using (public.tem_permissao(%L, ''editar'')) with check (public.tem_permissao(%L, ''editar''))', m.tabela, m.modulo, m.modulo);
      execute format('create policy "rbac_delete" on public.%I for delete to authenticated using (public.tem_permissao(%L, ''excluir''))', m.tabela, m.modulo);
    end if;
  end loop;
end $$;

-- agenda da ALESP: quem tem acesso lê; só o servidor (service role) grava
create policy "agenda_alesp_select" on agenda_alesp for select to authenticated using (public.usuario_ativo());

do $$
declare t text;
begin
  foreach t in array array['modelos_documentos', 'modelos_mensagens'] loop
    execute format('drop trigger if exists trg_auditoria on public.%I', t);
    execute format('create trigger trg_auditoria after insert or update or delete on public.%I for each row execute function public.registrar_log()', t);
  end loop;
end $$;

-- ---------- Modelos de documentos pré-cadastrados (estruturas-base; ajuste ao padrão do gabinete) ----------
insert into modelos_documentos (titulo, categoria, conteudo)
select * from (values
 ('Ofício padrão', 'Ofícios',
  E'Senhor(a) {{destinatario}},\n\nVenho, por meio deste, tratar do seguinte assunto: {{assunto}}.\n\n{{corpo}}\n\nCerto de sua atenção, apresento protestos de estima e consideração.'),
 ('Requerimento de Informação', 'Requerimentos',
  E'Requeiro, nos termos regimentais, sejam solicitadas ao(à) {{destinatario}} as seguintes informações sobre {{assunto}}:\n\n1. {{pergunta_1}}\n2. {{pergunta_2}}\n\nJUSTIFICATIVA\n\n{{justificativa}}'),
 ('Indicação', 'Indicações',
  E'INDICO ao(à) {{destinatario}}, nos termos regimentais, que sejam adotadas as providências necessárias para {{assunto}}.\n\nJUSTIFICATIVA\n\n{{justificativa}}'),
 ('Moção', 'Moções',
  E'O Deputado que esta subscreve propõe a presente MOÇÃO de {{tipo_mocao}} a {{homenageado}}, em razão de {{assunto}}.\n\nJUSTIFICATIVA\n\n{{justificativa}}'),
 ('Projeto de Lei', 'Projetos',
  E'Artigo 1º - {{objeto}}.\n\nArtigo 2º - As despesas decorrentes da execução desta lei correrão por conta de dotações orçamentárias próprias.\n\nArtigo 3º - Esta lei entra em vigor na data de sua publicação.\n\nJUSTIFICATIVA\n\n{{justificativa}}'),
 ('Projeto de Lei Complementar', 'Projetos',
  E'Artigo 1º - {{objeto}}.\n\nArtigo 2º - Esta lei complementar entra em vigor na data de sua publicação.\n\nJUSTIFICATIVA\n\n{{justificativa}}'),
 ('Voto em Separado', 'Pareceres',
  E'VOTO EM SEPARADO\n\nProjeto: {{numero_projeto}}\nComissão: {{comissao}}\n\nI - RELATÓRIO\n\n{{relatorio}}\n\nII - VOTO\n\n{{voto}}'),
 ('Emenda', 'Emendas',
  E'EMENDA Nº ___ ao {{numero_projeto}}\n\nDê-se ao {{dispositivo}} a seguinte redação:\n\n"{{nova_redacao}}"\n\nJUSTIFICATIVA\n\n{{justificativa}}')
) as v(titulo, categoria, conteudo)
where not exists (select 1 from modelos_documentos);
