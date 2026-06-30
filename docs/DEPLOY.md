# Deploy

O deploy de produção é feito pelo fluxo:

```text
Git local -> GitHub main -> Vercel build -> Vercel production
```

## Build command

Na Vercel, o comando de build deve ser:

```bash
npm run build:postgres
```

Esse comando gera o Prisma Client usando `prisma-postgres/schema.prisma` e depois executa `next build`.

## Comandos de validação local

```bash
npm install
npm run prisma:generate:postgres
npm run build:postgres
git status
```

Não rode seed em produção durante deploy normal.

## Deploy por GitHub

1. Faça alterações localmente.
2. Valide:

```bash
npm run build:postgres
```

3. Faça commit:

```bash
git status
git add <arquivos>
git commit -m "Mensagem objetiva"
git push origin main
```

4. Acompanhe o deploy na Vercel.
5. Valide produção em `https://bolao.flow-profit.com`.

## Variáveis necessárias em produção

As variáveis ficam no painel da Vercel. Nunca grave valores reais no Git.

```text
DATABASE_URL=<DATABASE_URL>
ADMIN_PASSWORD=<ADMIN_PASSWORD>
ADMIN_SESSION_SECRET=<ADMIN_SESSION_SECRET>
PLAYER_PIN_SECRET=<PLAYER_PIN_SECRET>
CRON_SECRET=<CRON_SECRET>
```

## Migrações

Quando houver migração PostgreSQL nova:

```bash
npm run prisma:migrate:deploy:postgres
```

Em produção, confirme backup no Supabase antes de migrações destrutivas.

## Rollback

### Rollback pela Vercel

1. Abra o projeto na Vercel.
2. Vá em Deployments.
3. Escolha o deploy anterior estável.
4. Clique em Promote to Production.
5. Teste login, admin e página `/apostas`.

### Rollback por Git

Use apenas se precisar reverter código no repositório:

```bash
git revert <commit_sha>
git push origin main
```

Não use `git reset --hard` em branch compartilhada.

## Checklist pós-deploy

- `https://bolao.flow-profit.com` abre.
- Login do jogador funciona.
- `/admin` exige autenticação.
- Admin carrega bolões, jogos, palpiteiros e financeiro.
- `npm run build:postgres` passou antes do push.
- API-Football mostra erro claro se chave/fixture estiverem ausentes.
- WhatsApp continua opcional: falha de envio não quebra operação.
