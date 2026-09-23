-- ============================================================
-- Sistema de Gerenciamento Parlamentar — Schema inicial
-- Execute isso no SQL Editor do seu projeto Supabase
-- ============================================================

-- Extensão para gerar UUIDs
create extension if not exists "uuid-ossp";

-- ---------- USUÁRIOS / PERFIS ----------
-- Complementa a tabela auth.users do Supabase com dados do gabinete
create table perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  papel text not null default 'assessor' check (papel in ('coordenador', 'assessor', 'gabinete')),
  bairro_designado text,
  meta_diaria int,
  criado_em timestamptz default now()
);

-- ---------- ELEITORES ----------
create table eleitores (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  telefone text,
  email text,
  genero text,
  bairro text not null,
  zona text,
  endereco text,
  lat double precision,
  lng double precision,
  interesse text,
  tags text[] default '{}',
  data_nascimento date,
  cpf text,
  criado_por uuid references perfis(id),
  criado_em timestamptz default now()
);

-- ---------- ATENDIMENTOS ----------
create table atendimentos (
  id uuid primary key default uuid_generate_v4(),
  cidadao text not null,
  assunto text not null,
  bairro text not null,
  canal text default 'WhatsApp',
  status text not null default 'Aberto' check (status in ('Aberto', 'Em andamento', 'Concluído')),
  data date default current_date,
  data_nascimento date,
  cpf text,
  criado_por uuid references perfis(id),
  criado_em timestamptz default now()
);

-- ---------- DOCUMENTOS / OFÍCIOS ----------
create table documentos (
  id uuid primary key default uuid_generate_v4(),
  numero text not null,
  tipo text not null check (tipo in ('Ofício', 'Requerimento', 'Indicação', 'Moção')),
  destinatario text not null,
  assunto text not null,
  status text not null default 'Protocolado' check (status in ('Rascunho', 'Protocolado', 'Em análise', 'Respondido', 'Arquivado')),
  arquivo_url text,
  data date default current_date,
  criado_por uuid references perfis(id),
  criado_em timestamptz default now()
);

-- ---------- PROPOSIÇÕES LEGISLATIVAS ----------
create table proposicoes (
  id uuid primary key default uuid_generate_v4(),
  tipo text not null,
  titulo text not null,
  detalhe text,
  status text not null default 'Protocolado' check (status in ('Protocolado', 'Em comissão', 'Em votação', 'Aprovado', 'Arquivado')),
  data date default current_date,
  criado_por uuid references perfis(id),
  criado_em timestamptz default now()
);

-- ---------- FINANCEIRO ----------
create table lancamentos_financeiros (
  id uuid primary key default uuid_generate_v4(),
  descricao text not null,
  categoria text not null,
  tipo text not null check (tipo in ('receita', 'despesa')),
  valor numeric(12,2) not null,
  status text default 'Pendente' check (status in ('Pago', 'Pendente')),
  data date default current_date,
  criado_por uuid references perfis(id),
  criado_em timestamptz default now()
);

-- ---------- AGENDA ----------
create table eventos_agenda (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null,
  data date not null,
  hora time,
  hora_fim time,
  local text,
  participantes text[] default '{}',
  criado_por uuid references perfis(id),
  criado_em timestamptz default now()
);

-- ---------- SEGMENTOS DE COMUNICAÇÃO ----------
create table segmentos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  filtros jsonb not null default '{}',
  criado_por uuid references perfis(id),
  criado_em timestamptz default now()
);

-- ---------- CAMPANHAS DE COMUNICAÇÃO ----------
create table campanhas_comunicacao (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  canais text[] not null default '{}',
  segmento_id uuid references segmentos(id),
  status text default 'Rascunho' check (status in ('Rascunho', 'Agendado', 'Enviado')),
  agendado_para timestamptz,
  metricas jsonb default '{}',
  criado_por uuid references perfis(id),
  criado_em timestamptz default now()
);

-- ---------- CAMPO: ROTAS E CHECK-INS ----------
create table rotas (
  id uuid primary key default uuid_generate_v4(),
  assessor_id uuid references perfis(id),
  data date default current_date,
  paradas jsonb not null default '[]',
  status text default 'Planejada' check (status in ('Planejada', 'Em andamento', 'Concluída')),
  criado_em timestamptz default now()
);

create table visitas_checkin (
  id uuid primary key default uuid_generate_v4(),
  rota_id uuid references rotas(id),
  parada_index int not null,
  lat double precision,
  lng double precision,
  horario timestamptz default now(),
  observacao text,
  sincronizado boolean default true
);

-- ---------- LOGÍSTICA DO GABINETE ----------
create table materiais_logistica (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  categoria text,
  estoque_atual int default 0,
  criado_por uuid references perfis(id),
  criado_em timestamptz default now()
);

create table entregas_logistica (
  id uuid primary key default uuid_generate_v4(),
  material_id uuid references materiais_logistica(id),
  material_nome text not null,
  quantidade int not null,
  bairro text not null,
  responsavel text,
  data date default current_date,
  status text not null default 'Planejada' check (status in ('Planejada', 'Em rota', 'Entregue')),
  observacao text,
  criado_por uuid references perfis(id),
  criado_em timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY — protege os dados por usuário autenticado
-- ============================================================

alter table perfis enable row level security;
alter table eleitores enable row level security;
alter table atendimentos enable row level security;
alter table documentos enable row level security;
alter table proposicoes enable row level security;
alter table lancamentos_financeiros enable row level security;
alter table eventos_agenda enable row level security;
alter table segmentos enable row level security;
alter table campanhas_comunicacao enable row level security;
alter table rotas enable row level security;
alter table visitas_checkin enable row level security;
alter table materiais_logistica enable row level security;
alter table entregas_logistica enable row level security;

-- Regra padrão: qualquer usuário autenticado do gabinete pode ler e escrever.
-- (Ajuste depois para regras por papel, ex: assessor só vê a própria rota)
create policy "Usuários autenticados podem tudo em eleitores"
  on eleitores for all using (auth.role() = 'authenticated');

create policy "Usuários autenticados podem tudo em atendimentos"
  on atendimentos for all using (auth.role() = 'authenticated');

create policy "Usuários autenticados podem tudo em documentos"
  on documentos for all using (auth.role() = 'authenticated');

create policy "Usuários autenticados podem tudo em proposições"
  on proposicoes for all using (auth.role() = 'authenticated');

create policy "Usuários autenticados podem tudo em financeiro"
  on lancamentos_financeiros for all using (auth.role() = 'authenticated');

create policy "Usuários autenticados podem tudo em agenda"
  on eventos_agenda for all using (auth.role() = 'authenticated');

create policy "Usuários autenticados podem tudo em segmentos"
  on segmentos for all using (auth.role() = 'authenticated');

create policy "Usuários autenticados podem tudo em campanhas"
  on campanhas_comunicacao for all using (auth.role() = 'authenticated');

create policy "Usuários autenticados podem tudo em rotas"
  on rotas for all using (auth.role() = 'authenticated');

create policy "Usuários autenticados podem tudo em checkins"
  on visitas_checkin for all using (auth.role() = 'authenticated');

create policy "Usuários autenticados podem tudo em materiais_logistica"
  on materiais_logistica for all using (auth.role() = 'authenticated');
create policy "Usuários autenticados podem tudo em entregas_logistica"
  on entregas_logistica for all using (auth.role() = 'authenticated');

create policy "Usuário vê e edita o próprio perfil"
  on perfis for select using (auth.uid() = id);
create policy "Usuário atualiza o próprio perfil"
  on perfis for update using (auth.uid() = id);

-- Cria o perfil automaticamente quando um usuário se cadastra
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfis (id, nome, papel)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), 'assessor');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- STORAGE: bucket público para os PDFs de ofícios/requerimentos gerados
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', true)
on conflict (id) do nothing;
