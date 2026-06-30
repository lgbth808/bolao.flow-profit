# Docker

Docker Desktop é usado para rodar dependências locais da Evolution API.

## Containers esperados

| Container | Função |
| --- | --- |
| `evolution-api` | Serviço HTTP da Evolution API |
| `evolution-postgres` | Banco da Evolution API |
| `evolution-redis` | Cache/fila da Evolution API |

## Operação básica

Listar containers:

```bash
docker ps
```

Ver todos, incluindo parados:

```bash
docker ps -a
```

Logs:

```bash
docker logs evolution-api
docker logs evolution-postgres
docker logs evolution-redis
```

Reiniciar:

```bash
docker restart evolution-api
```

## Portas

A documentação operacional usa a Evolution API local exposta em:

```text
http://localhost:8080
```

Confirme a porta real no compose/containers locais antes de configurar o admin.

## Problemas comuns

| Sintoma | Causa provável | Ação |
| --- | --- | --- |
| API não responde | Container parado | `docker ps -a` e `docker start evolution-api` |
| WhatsApp desconectado | Instância perdeu sessão | Abrir painel Evolution e reconectar QR |
| Erro de banco Evolution | Postgres local parado | Reiniciar `evolution-postgres` |
| Erro de imagem | Tag inexistente ou incompatível | Conferir imagem oficial/validada antes de recriar |

## Produção

Docker local é útil para desenvolvimento e testes. Para produção estável de WhatsApp, o plano é usar VPS com domínio próprio, por exemplo:

```text
https://evolution.flow-profit.com
```

Não trate `localhost` ou tunnel temporário como produção definitiva.
