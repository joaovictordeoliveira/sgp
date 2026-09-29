-- ============================================================
-- Migração 3 — município, atendimento completo e Contratos (Logística)
-- Rode isso no SQL Editor do Supabase (depois da migration-2.sql)
-- ============================================================

-- Eleitores: município
alter table eleitores add column if not exists municipio text;

-- Atendimentos: telefone, e-mail, endereço e município
-- (cidadão, bairro, data de nascimento e CPF já existiam desde a migração anterior)
alter table atendimentos add column if not exists telefone text;
alter table atendimentos add column if not exists email text;
alter table atendimentos add column if not exists endereco text;
alter table atendimentos add column if not exists municipio text;

-- ---------- CONTRATOS (dentro do módulo de Logística) ----------
create table if not exists contratos_logistica (
  id uuid primary key default uuid_generate_v4(),
  fornecedor text not null,
  objeto text not null,
  valor numeric(12,2),
  data_inicio date,
  data_fim date,
  status text not null default 'Ativo' check (status in ('Ativo', 'Pendente', 'Encerrado')),
  observacao text,
  criado_por uuid references perfis(id),
  criado_em timestamptz default now()
);

alter table contratos_logistica enable row level security;

create policy "Usuários autenticados podem tudo em contratos_logistica"
  on contratos_logistica for all using (auth.role() = 'authenticated');
