# Changelog

## Baseline de produção - 2026-06-30

Primeira linha de base documentada para `https://bolao.flow-profit.com`.

### Infraestrutura

- Aplicação em produção na Vercel.
- Deploy via GitHub `main`.
- Banco Supabase PostgreSQL.
- Prisma Client de produção gerado por `prisma-postgres/schema.prisma`.
- DNS `bolao.flow-profit.com` gerenciado via WordPress.com.

### Produto

- Login de jogador por WhatsApp e PIN.
- Admin protegido por senha.
- Bolões, jogos, palpiteiros, palpites e financeiro.
- Palpites múltiplos por jogador.
- Rateio por jogo.
- Regra de 1º e 2º tempos/tempo regulamentar.
- Auditoria de palpites.

### Integrações

- API-Football para busca de times, ligas, fixtures e placares.
- Evolution API para WhatsApp.
- Cloudflare Tunnel usado apenas como apoio temporário de desenvolvimento.
- Docker Desktop usado para Evolution API local.

### Validação esperada

```bash
npm run build:postgres
```

## Próximos registros

Adicionar novas entradas neste formato:

```markdown
## YYYY-MM-DD - Título

- Mudança 1.
- Mudança 2.
- Validação executada.
```
