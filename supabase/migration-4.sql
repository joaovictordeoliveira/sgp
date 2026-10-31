-- ============================================================
-- Migração 4 — RBAC (perfis de acesso), auditoria e novos módulos
-- Rode no SQL Editor do Supabase DEPOIS das migrações 2 e 3. Depois rode a migration-5.sql.
--
-- ATENÇÃO: esta migração troca a regra "qualquer usuário logado vê tudo" por
-- "só vê o que o perfil de acesso permite". Para ninguém ficar trancado do lado de fora,
-- todos os usuários que existem hoje viram ADMINISTRADOR (só na primeira execução).
-- Depois rebaixe quem não deve ser admin em Configurações → Usuários & Equipe.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- 1. PERFIS DE ACESSO ----------
create table if not exists perfis_acesso (
  id uuid primary key default uuid_generate_v4(),
  nome text not null unique,
  descricao text,
  permissoes jsonb not null default '{}',
  criado_em timestamptz default now()
);

-- ---------- 2. PERFIS (usuários) ----------
alter table perfis drop constraint if exists perfis_papel_check;
alter table perfis add constraint perfis_papel_check
  check (papel in ('administrador', 'coordenador', 'assessor', 'gabinete', 'usuario'));
alter table perfis alter column papel set default 'usuario';
alter table perfis add column if not exists email text;
alter table perfis add column if not exists telefone text;
alter table perfis add column if not exists avatar_url text;
alter table perfis add column if not exists ativo boolean not null default true;
alter table perfis add column if not exists perfil_acesso_id uuid references perfis_acesso(id) on delete restrict;
alter table perfis add column if not exists preferencias jsonb not null default '{}';

update perfis p set email = u.email from auth.users u where u.id = p.id and p.email is null;
update perfis set papel = 'administrador' where not exists (select 1 from perfis where papel = 'administrador');

-- ---------- 3. NOVOS CAMPOS EM TABELAS EXISTENTES ----------
alter table atendimentos add column if not exists tags text[] default '{}';
alter table proposicoes add column if not exists numero_protocolo text;
alter table proposicoes add column if not exists texto text;
alter table proposicoes add column if not exists justificativa text;
alter table proposicoes add column if not exists comissoes text;
alter table proposicoes add column if not exists notas jsonb not null default '[]';
alter table proposicoes add column if not exists anexos jsonb not null default '[]';
alter table proposicoes add column if not exists tags text[] default '{}';
alter table lancamentos_financeiros add column if not exists fornecedor text;

-- ---------- 4. TABELAS NOVAS ----------
create table if not exists mandato (
  id int primary key default 1 check (id = 1),
  nome_gabinete text, parlamentar text, cargo text, partido text,
  logo_url text, brasao_url text,
  assinatura_nome text, assinatura_cargo text, assinatura_url text,
  atualizado_em timestamptz default now()
);
insert into mandato (id) values (1) on conflict do nothing;

create table if not exists fornecedores (
  id uuid primary key default uuid_generate_v4(),
  razao_social text not null, nome_fantasia text, cnpj text unique, categoria text,
  contato text, telefone text, email text, observacao text,
  ativo boolean not null default true,
  criado_por uuid references perfis(id), criado_em timestamptz default now()
);

create table if not exists etiquetas (
  id uuid primary key default uuid_generate_v4(),
  nome text not null unique, cor text not null default '#3E72C0',
  criado_por uuid references perfis(id), criado_em timestamptz default now()
);

create table if not exists comissoes_pareceres (
  id uuid primary key default uuid_generate_v4(),
  tipo_materia text, numero text, ementa text not null, autor text, comissao text not null,
  data_designacao date, prazo_fatal date,
  status text not null default 'Designado'
    check (status in ('Designado', 'Em elaboração', 'Parecer entregue', 'Voto em separado', 'Arquivado')),
  parecer text, voto_separado text, anexos jsonb not null default '[]',
  criado_por uuid references perfis(id), criado_em timestamptz default now()
);

create table if not exists emendas (
  id uuid primary key default uuid_generate_v4(),
  numero text, ano int, municipio text not null, beneficiario text, objeto text not null,
  valor numeric(14,2), lideranca_nome text, lideranca_telefone text,
  status text not null default 'Indicada' check (status in ('Indicada', 'Em análise', 'Empenhada', 'Paga')),
  observacao text,
  criado_por uuid references perfis(id), criado_em timestamptz default now()
);

create table if not exists imprensa_itens (
  id uuid primary key default uuid_generate_v4(),
  tipo text not null check (tipo in ('post', 'clipping', 'nota', 'discurso')),
  titulo text not null, canal text, data date default current_date, status text, url text, conteudo text,
  criado_por uuid references perfis(id), criado_em timestamptz default now()
);

create table if not exists logs_auditoria (
  id uuid primary key default uuid_generate_v4(),
  criado_em timestamptz not null default now(),
  usuario_id uuid, usuario_nome text, tabela text not null, acao text not null, registro_id text,
  dados_antes jsonb, dados_depois jsonb
);
create index if not exists idx_logs_auditoria_data on logs_auditoria (criado_em desc);

-- ---------- 5. FUNÇÕES DE PERMISSÃO ----------
-- Quem tem 2FA verificado só vale como logado se a sessão estiver em aal2.
create or replace function public.mfa_ok() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified')
$$;

create or replace function public.usuario_ativo() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from perfis p
    where p.id = auth.uid() and p.ativo and (p.papel = 'administrador' or p.perfil_acesso_id is not null)
  ) and public.mfa_ok()
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfis p where p.id = auth.uid() and p.ativo and p.papel = 'administrador')
     and public.mfa_ok()
$$;

create or replace function public.tem_permissao(modulo text, acao text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin()
      or (
        coalesce((
          select (pa.permissoes -> modulo ->> acao)::boolean
          from perfis p join perfis_acesso pa on pa.id = p.perfil_acesso_id
          where p.id = auth.uid() and p.ativo
        ), false)
        and public.mfa_ok()
      )
$$;

-- ---------- 6. IMPEDE ESCALAÇÃO DE PRIVILÉGIO ----------
-- Todo usuário edita o próprio perfil (nome, foto...), mas NÃO o próprio papel, perfil de acesso, status ou e-mail.
create or replace function public.proteger_campos_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.papel is distinct from old.papel
       or new.perfil_acesso_id is distinct from old.perfil_acesso_id
       or new.ativo is distinct from old.ativo
       or new.email is distinct from old.email then
      raise exception 'Apenas administradores podem alterar papel, perfil de acesso, status ou e-mail.';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_proteger_perfil on perfis;
create trigger trg_proteger_perfil before update on perfis
  for each row execute function public.proteger_campos_perfil();

-- Novo usuário nasce SEM acesso (papel 'usuario', sem perfil de acesso)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, nome, email, papel)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', new.email), new.email, 'usuario')
  on conflict (id) do nothing;
  return new;
end $$;

-- ---------- 7. POLÍTICAS (RLS) ----------
alter table perfis_acesso enable row level security;
alter table mandato enable row level security;
alter table fornecedores enable row level security;
alter table etiquetas enable row level security;
alter table comissoes_pareceres enable row level security;
alter table emendas enable row level security;
alter table imprensa_itens enable row level security;
alter table logs_auditoria enable row level security;

-- apaga as políticas antigas ("authenticated pode tudo")
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in (
      'perfis', 'perfis_acesso', 'mandato', 'fornecedores', 'etiquetas', 'logs_auditoria',
      'eleitores', 'atendimentos', 'documentos', 'proposicoes', 'lancamentos_financeiros',
      'eventos_agenda', 'segmentos', 'campanhas_comunicacao', 'rotas', 'visitas_checkin',
      'materiais_logistica', 'entregas_logistica', 'contratos_logistica',
      'comissoes_pareceres', 'emendas', 'imprensa_itens'
    )
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- tabelas ligadas a um módulo: ver / criar / editar / excluir
do $$
declare m record;
begin
  for m in select * from (values
    ('eleitores', 'eleitores'), ('atendimentos', 'atendimentos'), ('documentos', 'documentos'),
    ('proposicoes', 'proposicoes'), ('lancamentos_financeiros', 'financeiro'),
    ('eventos_agenda', 'agenda'), ('segmentos', 'comunicacao'), ('campanhas_comunicacao', 'comunicacao'),
    ('rotas', 'campo'), ('visitas_checkin', 'campo'),
    ('materiais_logistica', 'logistica'), ('entregas_logistica', 'logistica'), ('contratos_logistica', 'logistica'),
    ('comissoes_pareceres', 'comissoes'), ('emendas', 'emendas'), ('imprensa_itens', 'imprensa'),
    ('fornecedores', 'fornecedores'), ('etiquetas', 'etiquetas')
  ) as t(tabela, modulo)
  loop
    -- fornecedores e etiquetas são lidos por vários módulos (listas de seleção)
    if m.tabela in ('fornecedores', 'etiquetas') then
      execute format('create policy "rbac_select" on public.%I for select to authenticated using (public.usuario_ativo())', m.tabela);
    else
      execute format('create policy "rbac_select" on public.%I for select to authenticated using (public.tem_permissao(%L, ''ver''))', m.tabela, m.modulo);
    end if;
    execute format('create policy "rbac_insert" on public.%I for insert to authenticated with check (public.tem_permissao(%L, ''criar''))', m.tabela, m.modulo);
    execute format('create policy "rbac_update" on public.%I for update to authenticated using (public.tem_permissao(%L, ''editar'')) with check (public.tem_permissao(%L, ''editar''))', m.tabela, m.modulo, m.modulo);
    execute format('create policy "rbac_delete" on public.%I for delete to authenticated using (public.tem_permissao(%L, ''excluir''))', m.tabela, m.modulo);
  end loop;
end $$;

create policy "perfis_select" on perfis for select to authenticated using (id = auth.uid() or public.usuario_ativo());
create policy "perfis_update" on perfis for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create policy "pa_select" on perfis_acesso for select to authenticated using (public.usuario_ativo());
create policy "pa_write" on perfis_acesso for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "mandato_select" on mandato for select to authenticated using (public.usuario_ativo());
create policy "mandato_write" on mandato for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- logs: só administrador lê; ninguém altera/apaga pela API (só o gatilho grava)
create policy "logs_select" on logs_auditoria for select to authenticated using (public.is_admin());

-- ---------- 8. AUDITORIA (gatilhos) — o CPF NÃO é copiado para os logs ----------
create or replace function public.registrar_log() returns trigger
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); nome text; antes jsonb; depois jsonb;
begin
  select p.nome into nome from perfis p where p.id = uid;
  if tg_op in ('UPDATE', 'DELETE') then antes := to_jsonb(old) - 'cpf'; end if;
  if tg_op in ('INSERT', 'UPDATE') then depois := to_jsonb(new) - 'cpf'; end if;
  insert into logs_auditoria (usuario_id, usuario_nome, tabela, acao, registro_id, dados_antes, dados_depois)
  values (uid, nome, tg_table_name, tg_op,
          case when tg_op = 'DELETE' then (to_jsonb(old) ->> 'id') else (to_jsonb(new) ->> 'id') end, antes, depois);
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'eleitores', 'atendimentos', 'documentos', 'proposicoes', 'lancamentos_financeiros',
    'eventos_agenda', 'segmentos', 'campanhas_comunicacao', 'rotas',
    'materiais_logistica', 'entregas_logistica', 'contratos_logistica',
    'comissoes_pareceres', 'emendas', 'imprensa_itens', 'fornecedores', 'etiquetas',
    'perfis', 'perfis_acesso', 'mandato'
  ] loop
    execute format('drop trigger if exists trg_auditoria on public.%I', t);
    execute format('create trigger trg_auditoria after insert or update or delete on public.%I for each row execute function public.registrar_log()', t);
  end loop;
end $$;

-- ---------- 9. PERFIS DE ACESSO DE EXEMPLO (edite ou apague à vontade) ----------
insert into perfis_acesso (nome, descricao, permissoes) values
 ('Assessor Legislativo', 'Proposições, comissões, documentos e atendimento',
  '{"proposicoes":{"ver":true,"criar":true,"editar":true,"excluir":false},
    "comissoes":{"ver":true,"criar":true,"editar":true,"excluir":false},
    "documentos":{"ver":true,"criar":true,"editar":true,"excluir":false},
    "modelos":{"ver":true},
    "atendimentos":{"ver":true,"criar":true,"editar":true,"excluir":false},
    "agenda":{"ver":true,"criar":true,"editar":true,"excluir":false},
    "etiquetas":{"ver":true}}'),
 ('Equipe de Rua', 'Campo, base de eleitores e mapa',
  '{"campo":{"ver":true,"criar":true,"editar":true,"excluir":false},
    "eleitores":{"ver":true,"criar":true,"editar":true,"excluir":false},
    "territorio":{"ver":true},
    "agenda":{"ver":true},
    "logistica":{"ver":true},
    "etiquetas":{"ver":true}}'),
 ('Comunicação', 'Disparos, imprensa e redes sociais',
  '{"comunicacao":{"ver":true,"criar":true,"editar":true,"excluir":true},
    "imprensa":{"ver":true,"criar":true,"editar":true,"excluir":true},
    "fidelizacao":{"ver":true},
    "atendimentos":{"ver":true},
    "agenda":{"ver":true},
    "etiquetas":{"ver":true}}')
on conflict (nome) do nothing;

-- ---------- 10. STORAGE (anexos e fotos) ----------
insert into storage.buckets (id, name, public) values ('anexos', 'anexos', true), ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "sgp_storage_insert" on storage.objects;
drop policy if exists "sgp_storage_delete" on storage.objects;
create policy "sgp_storage_insert" on storage.objects for insert to authenticated
  with check (bucket_id in ('anexos', 'avatars') and public.usuario_ativo());
create policy "sgp_storage_delete" on storage.objects for delete to authenticated
  using (bucket_id in ('anexos', 'avatars') and public.usuario_ativo());
