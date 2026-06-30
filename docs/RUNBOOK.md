# Runbook Operacional - bolao.flow-profit.com

Este é o índice mestre da documentação de engenharia do Bolão da Copa 2026.
Use este documento para operar, publicar, diagnosticar e evoluir o sistema em produção.

## Produção

| Item | Valor |
| --- | --- |
| Domínio público | `https://bolao.flow-profit.com` |
| Repositório | GitHub |
| Hospedagem app | Vercel |
| Banco de dados | Supabase PostgreSQL |
| ORM | Prisma |
| DNS | WordPress.com para `flow-profit.com` |
| Placar | API-Football / API-Sports |
| WhatsApp | Evolution API |

## Documentos

| Documento | Uso |
| --- | --- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitetura, componentes e fluxos de dados |
| [DEPLOY.md](./DEPLOY.md) | Deploy GitHub -> Vercel, validações e rollback |
| [DATABASE.md](./DATABASE.md) | Supabase/PostgreSQL, Prisma e migrações |
| [API_FOOTBALL.md](./API_FOOTBALL.md) | Fixture IDs, busca e sincronização de placar |
| [EVOLUTION_API.md](./EVOLUTION_API.md) | WhatsApp, payloads e fluxos de mensagem |
| [WORDPRESS_DNS.md](./WORDPRESS_DNS.md) | DNS no WordPress.com e CNAME para Vercel |
| [VERCEL.md](./VERCEL.md) | Variáveis, build e redeploy sem cache |
| [SUPABASE.md](./SUPABASE.md) | Connection string, migrations, backup/restore |
| [DOCKER.md](./DOCKER.md) | Evolution API local via Docker Desktop |
| [CLOUDFLARE_TUNNEL.md](./CLOUDFLARE_TUNNEL.md) | Exposição temporária local por tunnel |
| [OPERATIONS.md](./OPERATIONS.md) | Rotina diária do administrador |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Erros conhecidos e correções |
| [ROADMAP.md](./ROADMAP.md) | Fases de evolução do produto |
| [CHANGELOG.md](./CHANGELOG.md) | Linha de base de produção e mudanças |
| [DECISIONS.md](./DECISIONS.md) | Decisões arquiteturais registradas |

## Operação rápida

1. Acesse `https://bolao.flow-profit.com/admin`.
2. Cadastre ou revise o bolão.
3. Cadastre jogos do Brasil, valor por palpite, horário e regra.
4. Configure Fixture ID API-Football quando houver.
5. Confirme pagamentos na aba Financeiro.
6. Verifique placares e vencedores após o jogo.
7. Teste WhatsApp quando houver nova instância ou novo tunnel.

## Validação local

Use estes comandos no diretório raiz do projeto:

```bash
npm install
npm run prisma:generate:postgres
npm run build:postgres
```

Para rodar localmente:

```bash
npm run dev
```

## Regras de segurança operacional

- Nunca publique segredos em Markdown, GitHub, prints ou mensagens.
- Produção deve usar `prisma-postgres/schema.prisma`.
- Não use SQLite em produção.
- Não execute seed em produção sem backup e autorização explícita.
- Não altere variáveis Vercel sem registrar a mudança.
- Antes de mexer em DNS, confirme o domínio correto no WordPress.com.

## Quando algo falhar

1. Abra [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).
2. Identifique o sintoma.
3. Aplique a correção indicada.
4. Rode o comando de validação.
5. Registre mudança relevante em [CHANGELOG.md](./CHANGELOG.md) ou [DECISIONS.md](./DECISIONS.md).
