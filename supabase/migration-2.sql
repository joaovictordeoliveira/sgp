-- ============================================================
-- Migração 2 — aniversário/CPF, horário final da agenda e Logística
-- Rode isso no SQL Editor do Supabase (não precisa rodar o schema.sql de novo)
-- ============================================================

-- Eleitores: data de nascimento e CPF
alter table eleitores add column if not exists data_nascimento date;
alter table eleitores add column if not exists cpf text;

-- Atendimentos: idem, para o cidadão atendido
alter table atendimentos add column if not exists data_nascimento date;
alter table atendimentos add column if not exists cpf text;

-- Agenda: horário de término do evento
alter table eventos_agenda add column if not exists hora_fim time;

-- ---------- LOGÍSTICA DO GABINETE ----------
create table if not exists materiais_logistica (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  categoria text,
  estoque_atual int default 0,
  criado_por uuid references perfis(id),
  criado_em timestamptz default now()
);

create table if not exists entregas_logistica (
  id uuid primary key default uuid_generate_v4(),
  material_id uuid references materiais_logistica(id),
  material_nome text not null, -- guarda o nome também, pra não depender de join
  quantidade int not null,
  bairro text not null,
  responsavel text,
  data date default current_date,
  status text not null default 'Planejada' check (status in ('Planejada', 'Em rota', 'Entregue')),
  observacao text,
  criado_por uuid references perfis(id),
  criado_em timestamptz default now()
);

alter table materiais_logistica enable row level security;
alter table entregas_logistica enable row level security;

create policy "Usuários autenticados podem tudo em materiais_logistica"
  on materiais_logistica for all using (auth.role() = 'authenticated');
create policy "Usuários autenticados podem tudo em entregas_logistica"
  on entregas_logistica for all using (auth.role() = 'authenticated');

-- ---------- LGPD: recomendação para o CPF ----------
-- Por padrão, qualquer usuário autenticado consegue ler o CPF (mesma regra das outras tabelas).
-- Quando quiser restringir (ex: só coordenador vê CPF), me avise que ajusto a policy
-- para checar o papel do usuário em vez de "authenticated" genérico.
