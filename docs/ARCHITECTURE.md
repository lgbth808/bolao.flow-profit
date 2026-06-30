# Arquitetura

O projeto `bolao.flow-profit.com` é uma aplicação Next.js com backend serverless no próprio Vercel, persistência em Supabase PostgreSQL via Prisma e integrações externas com API-Football e Evolution API.

## Visão geral

```text
                      +---------------------------+
                      | WordPress.com DNS         |
                      | bolao.flow-profit.com     |
                      +-------------+-------------+
                                    |
                                    v
                  +-----------------+-----------------+
                  | Vercel                            |
                  | Next.js App Router                |
                  | UI publica + admin + API routes   |
                  +------+--------------------+-------+
                         |                    |
                         v                    v
          +--------------+------+     +-------+----------------+
          | Supabase PostgreSQL |     | External APIs          |
          | Prisma Client       |     | API-Football           |
          +---------------------+     | Evolution API          |
                                      +------------------------+
```

## Componentes

| Componente | Responsabilidade |
| --- | --- |
| Next.js | Interface pública, `/apostas`, `/admin` e rotas API |
| Vercel | Deploy, runtime serverless, domínio e variáveis |
| Prisma | ORM e geração do client para PostgreSQL |
| Supabase PostgreSQL | Banco de dados de produção |
| API-Football | Busca de times, ligas, fixtures e placares |
| Evolution API | Envio de mensagens WhatsApp |
| WordPress.com DNS | DNS principal de `flow-profit.com` |
| Docker Desktop | Execução local da Evolution API |
| Cloudflare Tunnel | Exposição temporária de API local para testes |

## Fluxo do jogador

```text
Jogador
  |
  | login WhatsApp + senha / palpite / exclusão / edição
  v
Vercel Next.js
  |
  | Prisma Client
  v
Supabase PostgreSQL
```

Dados principais:

- `Player`: palpiteiro, WhatsApp único, senha PIN em hash.
- `Pool`: bolão, PIX e grupo.
- `Game`: jogo do Brasil, horário, valor por palpite, placar e fixture.
- `Prediction`: palpite do jogador por jogo.
- `PredictionAudit`: trilha de auditoria de palpites.
- `AppSetting`: chaves/configurações operacionais.

## Fluxo do admin com API-Football

```text
Admin
  |
  | busca liga/time/fixture ou sincroniza placar
  v
Vercel API route
  |
  | x-apisports-key
  v
API-Football
  |
  | status, minuto, placar, fixture
  v
Vercel
  |
  | atualiza jogo e calcula prêmio quando finalizado
  v
Supabase PostgreSQL
```

O app nunca deve buscar todos os jogos sem filtro. A busca operacional deve usar IDs de liga, time e fixture para reduzir custo e respeitar limite da API.

## Fluxo de WhatsApp

```text
App / Admin action
  |
  | evento: novo jogo, palpite, edição, exclusão, baixa de pagamento
  v
Vercel API route
  |
  | POST /message/sendText/{instance}
  v
Evolution API
  |
  v
WhatsApp do palpiteiro
```

As ações devem ser salvas primeiro no banco. O envio WhatsApp é secundário: falha de mensagem não deve desfazer a operação principal.

## Camadas de segurança

| Camada | Regra |
| --- | --- |
| Admin | Cookie de sessão assinado por `ADMIN_SESSION_SECRET` |
| Cron/API sync | `Authorization: Bearer <CRON_SECRET>` quando acionado por automação |
| Jogador | WhatsApp + PIN de 4 números |
| Banco | PostgreSQL gerenciado no Supabase |
| Segredos | Variáveis no Vercel, nunca em Git |

## Arquivos relevantes

| Arquivo | Função |
| --- | --- |
| `app/page.tsx` | Login do jogador |
| `app/apostas/page.tsx` | Área pública/autenticada do palpiteiro |
| `app/admin/page.tsx` | Painel administrativo |
| `app/api/*` | Rotas serverless |
| `lib/prisma.ts` | Instância Prisma |
| `lib/score-sync.ts` | API-Football e sincronização de placar |
| `lib/whatsapp.ts` | Evolution API e mensagens |
| `prisma-postgres/schema.prisma` | Schema de produção PostgreSQL |
