# Decisions

Registro de decisões técnicas relevantes.

## 001 - Next.js em vez de página estática WordPress

| Campo | Decisão |
| --- | --- |
| Status | Aceita |
| Decisão | Usar Next.js para frontend e backend serverless |
| Motivo | O produto exige autenticação, admin, banco, APIs e regras de negócio |
| Consequência | WordPress fica apenas como DNS/domínio, não como runtime do app |

## 002 - Vercel para frontend/backend

| Campo | Decisão |
| --- | --- |
| Status | Aceita |
| Decisão | Hospedar Next.js na Vercel |
| Motivo | Deploy simples via GitHub e suporte nativo ao App Router/API routes |
| Consequência | Variáveis e build devem ser controlados no painel Vercel |

## 003 - Supabase PostgreSQL para produção

| Campo | Decisão |
| --- | --- |
| Status | Aceita |
| Decisão | Usar PostgreSQL gerenciado no Supabase |
| Motivo | Persistência real, backup, acesso remoto e compatibilidade Prisma |
| Consequência | SQLite não pode ser usado em produção |

## 004 - Prisma Postgres schema para produção

| Campo | Decisão |
| --- | --- |
| Status | Aceita |
| Decisão | Produção usa `prisma-postgres/schema.prisma` |
| Motivo | Evitar geração acidental do Prisma Client SQLite |
| Consequência | Build correto é `npm run build:postgres` |

## 005 - WordPress DNS retido

| Campo | Decisão |
| --- | --- |
| Status | Aceita |
| Decisão | Manter WordPress.com gerenciando `flow-profit.com` |
| Motivo | Domínio já estava hospedado/gerenciado lá |
| Consequência | Subdomínios apontam para Vercel/VPS via registros DNS |

## 006 - Evolution API para WhatsApp

| Campo | Decisão |
| --- | --- |
| Status | Aceita |
| Decisão | Usar Evolution API para mensagens automáticas |
| Motivo | Permite mensagens transacionais de palpite, pagamento e jogos |
| Consequência | Instância precisa estar conectada e monitorada |

## 007 - Cloudflare Tunnel apenas para desenvolvimento

| Campo | Decisão |
| --- | --- |
| Status | Aceita |
| Decisão | Usar `trycloudflare.com` só para testes temporários |
| Motivo | URL muda e não é adequada para operação permanente |
| Consequência | Produção deve migrar para endpoint estável |

## 008 - VPS planejada para Evolution API

| Campo | Decisão |
| --- | --- |
| Status | Planejada |
| Decisão | Hospedar Evolution API em VPS com DNS próprio |
| Motivo | Maior estabilidade para WhatsApp em produção |
| Consequência | Criar `evolution.flow-profit.com`, TLS, backup e monitoramento |
