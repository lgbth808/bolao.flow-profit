# Troubleshooting

Erros conhecidos e procedimentos de correção.

## `provider = "sqlite"` em produção

| Campo | Detalhe |
| --- | --- |
| Sintoma | Erro Prisma mencionando `provider = "sqlite"` |
| Causa provável | Vercel gerou Prisma Client com `prisma/schema.prisma` |
| Correção | Usar build `npm run build:postgres` |
| Validação | `npm run build:postgres` |

## Build command errado na Vercel

| Campo | Detalhe |
| --- | --- |
| Sintoma | Deploy passa, mas runtime aponta schema errado |
| Causa provável | Build command está como `npm run build` |
| Correção | Alterar para `npm run build:postgres` |
| Validação | Redeploy sem cache e abrir `/admin` |

## Supabase password placeholder `[YOUR-PASSWORD]`

| Campo | Detalhe |
| --- | --- |
| Sintoma | Falha de conexão com banco |
| Causa provável | URL copiada sem substituir placeholder |
| Correção | Substituir `[YOUR-PASSWORD]` pela senha real, com encoding se necessário |
| Validação | `npm run prisma:generate:postgres` |

## Supabase direct IPv6 issue

| Campo | Detalhe |
| --- | --- |
| Sintoma | Conexão local falha em algumas redes |
| Causa provável | Rede sem suporte adequado a IPv6 para conexão direta |
| Correção | Testar pooler do Supabase |
| Validação | `npm run prisma:migrate:deploy:postgres` |

## Evolution API Docker image issue

| Campo | Detalhe |
| --- | --- |
| Sintoma | Container não sobe ou reinicia |
| Causa provável | Imagem/tag incompatível ou configuração incompleta |
| Correção | Conferir tag validada, variáveis e logs do container |
| Validação | `docker logs evolution-api` |

## Database provider invalid

| Campo | Detalhe |
| --- | --- |
| Sintoma | Prisma informa provider inválido |
| Causa provável | Schema errado para o ambiente |
| Correção | Produção deve usar `prisma-postgres/schema.prisma` |
| Validação | `npm run prisma:generate:postgres` |

## Cloudflare Tunnel URL changes

| Campo | Detalhe |
| --- | --- |
| Sintoma | WhatsApp parou após reiniciar tunnel |
| Causa provável | URL `trycloudflare.com` mudou |
| Correção | Copiar nova URL e atualizar admin |
| Validação | Enviar mensagem de teste no admin |

## WhatsApp desconectado

| Campo | Detalhe |
| --- | --- |
| Sintoma | Evolution API responde, mas mensagem não chega |
| Causa provável | Instância `bolao` desconectada do WhatsApp |
| Correção | Reconectar instância no painel/API da Evolution |
| Validação | Testar envio para número próprio |

## Admin password wrong

| Campo | Detalhe |
| --- | --- |
| Sintoma | Não consegue entrar em `/admin` |
| Causa provável | `ADMIN_PASSWORD` incorreto ou alterado na Vercel |
| Correção | Atualizar variável na Vercel e redeploy se necessário |
| Validação | Login em `https://bolao.flow-profit.com/admin` |

## API-Football sem resultado

| Campo | Detalhe |
| --- | --- |
| Sintoma | Busca retorna zero fixtures |
| Causa provável | `league`, `season` ou `team` enviados como texto em vez de ID numérico |
| Correção | Buscar IDs em Teams/Leagues e repetir consulta |
| Validação | Fixture aparece no admin |

## API-Football HTTP error

| Campo | Detalhe |
| --- | --- |
| Sintoma | Mensagem `API-Football retornou HTTP <status>` |
| Causa provável | Chave inválida, limite excedido ou indisponibilidade |
| Correção | Conferir chave, plano e painel API-Sports |
| Validação | Buscar fixture manualmente pelo admin |
