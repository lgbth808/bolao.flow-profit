# Vercel

A Vercel hospeda a aplicação Next.js e suas rotas API.

## Build

O comando correto de produção é:

```bash
npm run build:postgres
```

Não usar `npm run build` em produção, porque ele pode gerar Prisma Client com schema SQLite.

## Variáveis de ambiente

Configurar em Vercel Project Settings -> Environment Variables.

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Connection string PostgreSQL/Supabase |
| `ADMIN_PASSWORD` | Senha do admin |
| `ADMIN_SESSION_SECRET` | Assinatura da sessão admin |
| `PLAYER_PIN_SECRET` | Hash/segredo dos PINs dos jogadores |
| `CRON_SECRET` | Autorização para sync automático/cron |

Exemplo sem segredos reais:

```text
DATABASE_URL=<DATABASE_URL>
ADMIN_PASSWORD=<ADMIN_PASSWORD>
ADMIN_SESSION_SECRET=<ADMIN_SESSION_SECRET>
PLAYER_PIN_SECRET=<PLAYER_PIN_SECRET>
CRON_SECRET=<CRON_SECRET>
```

## Redeploy sem cache

Quando houver suspeita de Prisma Client antigo ou cache:

1. Abrir Vercel.
2. Ir em Deployments.
3. Escolher o último deploy.
4. Clicar em Redeploy.
5. Marcar opção equivalente a "without cache".
6. Confirmar.

## Validação pós-deploy

```bash
npm run build:postgres
```

Em produção:

- Abrir `https://bolao.flow-profit.com`.
- Abrir `/admin`.
- Confirmar que não aparece erro de SQLite.
- Testar tela de apostas.
- Testar leitura de dados do Supabase.

## Vercel Cron

O endpoint de sync aceita autorização por:

```text
Authorization: Bearer <CRON_SECRET>
```

Endpoint:

```text
POST /api/admin/scores/sync
```

Não exponha `CRON_SECRET`.
