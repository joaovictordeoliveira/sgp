# Sistema de Gerenciamento Parlamentar (SGP)

Este é o projeto real (Next.js + Supabase), gerado a partir do protótipo funcional
validado anteriormente. Já inclui: autenticação, schema completo do banco de dados
com segurança por linha (RLS), e o primeiro módulo (Base de Eleitores) 100%
funcional e conectado ao banco.

## 1. Criar o projeto no Supabase
1. Crie uma conta gratuita em https://supabase.com
2. Clique em "New project" e escolha uma senha forte para o banco
3. Depois que o projeto for criado, vá em **SQL Editor** e cole todo o conteúdo
   de `supabase/schema.sql` → clique em "Run". Isso cria todas as tabelas.
4. Vá em **Project Settings → API** e copie:
   - `Project URL` → vai virar `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → vai virar `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Configurar variáveis de ambiente
```bash
cp .env.example .env.local
```
Abra `.env.local` e preencha com os valores do Supabase (passo 1) e sua chave
do Google Maps.

## 3. Rodar localmente
```bash
npm install
npm run dev
```
Acesse http://localhost:3000 — você será redirecionado para `/login`.

## 4. Criar seu primeiro usuário
No painel do Supabase → **Authentication → Users → Add user** → crie com e-mail
e senha. Esse é o login que você vai usar no sistema. (Depois dá pra criar uma
tela de convite de novos usuários dentro do próprio sistema.)

## 5. Deploy em produção (Vercel)
1. Crie um repositório no GitHub e suba este projeto:
   ```bash
   git init
   git add .
   git commit -m "Primeiro commit do SGP"
   git branch -M main
   git remote add origin <url-do-seu-repositorio>
   git push -u origin main
   ```
2. Crie uma conta gratuita em https://vercel.com e conecte ao GitHub
3. Importe o repositório do SGP
4. Em **Environment Variables**, adicione as mesmas 3 variáveis do `.env.local`
5. Clique em Deploy — em poucos minutos o sistema estará no ar com uma URL
   `algumacoisa.vercel.app`
6. Depois, em **Settings → Domains**, aponte seu domínio próprio (registrado no
   registro.br, por exemplo)

## ⚠️ Sobre a hospedagem
Este projeto usa **Next.js** (servidor + frontend). Ele **não roda em hospedagem PHP tradicional
como InfinityFree, Hostgator compartilhado, etc.** — precisa de um provedor que rode Node.js.
Use **Vercel** (grátis, feito para Next.js — veja o passo 5 abaixo) ou alternativas como Netlify,
Railway ou Render.

## O que já está pronto
- ✅ Login/autenticação real (Supabase Auth) + middleware protegendo todas as rotas
- ✅ Schema completo do banco (11 tabelas + bucket de storage, com RLS habilitado)
- ✅ Sidebar de navegação real, compartilhada entre todos os módulos
- ✅ **Dashboard** — KPIs reais agregados do banco + agenda do dia
- ✅ **Base de Eleitores** — criar, listar, excluir, geocodificação automática de endereço
- ✅ **Território** — Google Maps real com heatmap gerado a partir dos eleitores geocodificados no banco
- ✅ **Gabinete → Atendimentos** — criar, mudar status, excluir
- ✅ **Gabinete → Documentos** — geração com numeração automática, **PDF real gerado e salvo no Storage**, atualização de status, exclusão
- ✅ **Gabinete → Proposições** — kanban real (criar, mover entre etapas, excluir)
- ✅ **Campo** — cadastro de rotas por assessor + **app de check-in com fila offline (PWA)**
- ✅ **Comunicação → Segmentação e disparo real** — WhatsApp (Meta Cloud API), SMS (Twilio) e E-mail (Resend), com chaves protegidas no servidor
- ✅ **Gestão → Financeiro** — lançamentos de receita/despesa com saldo calculado ao vivo
- ✅ **Gestão → Agenda** — eventos reais, usados também no Dashboard

## Configurando os envios reais (opcional, ative quando quiser)
As integrações de comunicação só funcionam quando as variáveis correspondentes no `.env.local`
(e na Vercel) estiverem preenchidas — sem elas, o sistema simplesmente ignora aquele canal.

- **WhatsApp**: crie um app em https://developers.facebook.com → produto "WhatsApp" → Cloud API.
  Preencha `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID`. A aprovação da conta comercial pode levar
  alguns dias — comece esse processo cedo.
- **SMS**: crie conta em https://twilio.com, compre um número, preencha `TWILIO_ACCOUNT_SID`,
  `TWILIO_AUTH_TOKEN` e `TWILIO_FROM_NUMBER`.
- **E-mail**: crie conta em https://resend.com, verifique seu domínio, preencha `RESEND_API_KEY`
  e `RESEND_FROM_EMAIL`.
- **PDF/Storage**: já funciona assim que você rodar o `schema.sql` atualizado (cria o bucket
  `documentos` automaticamente) e preencher `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API).

## App de campo (PWA) — como o assessor usa
Peça para o assessor abrir, no celular, a URL `/dashboard/campo/checkin` depois de logar. O
navegador vai oferecer "Adicionar à tela inicial" (usa o `manifest.json`). A partir daí funciona
como um app: mesmo sem internet, os check-ins ficam guardados no aparelho (IndexedDB) e sobem
sozinhos para o banco assim que a conexão voltar.

## O que ainda pode evoluir
- **Directions API** para otimizar automaticamente a ordem das paradas nas rotas de campo
- **Página de convite de novos usuários** (hoje, criação de usuário é manual pelo painel do Supabase)
- **Regras de permissão por papel** no RLS (hoje todo usuário autenticado vê tudo; ajuste as policies
  em `supabase/schema.sql` para restringir por `papel` quando quiser diferenciar acesso)
- **Páginas de captura** (landing pages para novos apoiadores) — ainda não portado do protótipo
