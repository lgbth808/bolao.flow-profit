# Banco de Dados

Produção usa Supabase PostgreSQL com Prisma.

## Fonte de verdade de produção

| Ambiente | Schema Prisma |
| --- | --- |
| Produção | `prisma-postgres/schema.prisma` |
| Desenvolvimento local legado | `prisma/schema.prisma` |

Produção nunca deve gerar Prisma Client a partir de SQLite.

## Comandos corretos para PostgreSQL

```bash
npm run prisma:generate:postgres
npm run prisma:migrate:deploy:postgres
npm run build:postgres
```

## Aviso crítico sobre SQLite

O projeto ainda pode conter schema SQLite para desenvolvimento local antigo. Isso não deve ser usado em produção.

Sinais de erro:

```text
Error validating datasource "db":
provider = "sqlite"
```

Correção:

- Confirmar que a Vercel usa `npm run build:postgres`.
- Confirmar que `DATABASE_URL` aponta para PostgreSQL.
- Confirmar que o Prisma Client foi gerado com `prisma-postgres/schema.prisma`.

## Modelos principais

| Modelo | Função |
| --- | --- |
| `Pool` | Bolão/grupo e dados de PIX |
| `Player` | Palpiteiro, WhatsApp único e PIN |
| `Game` | Jogo, valor, placar, fixture e status |
| `Prediction` | Palpite e pagamento por aposta |
| `PredictionAudit` | Trilha de auditoria |
| `AppSetting` | Configurações operacionais, como API keys |

## Seed

Seed existe para desenvolvimento, mas deve ser tratado como operação perigosa em produção.

Não execute:

```bash
npm run db:seed
```

em produção sem:

1. Backup Supabase.
2. Confirmação explícita.
3. Plano de rollback.
4. Entendimento do que o seed altera.

## Migrações

Migrações PostgreSQL ficam em:

```text
prisma-postgres/migrations
```

Aplicar em produção:

```bash
npm run prisma:migrate:deploy:postgres
```

Criar migração em desenvolvimento:

```bash
npm run prisma:migrate:dev:postgres
```

## Backup mínimo antes de mudanças

1. Abrir Supabase.
2. Confirmar projeto correto.
3. Exportar backup ou snapshot conforme plano disponível.
4. Registrar horário e objetivo da mudança.
5. Só então aplicar migração.
