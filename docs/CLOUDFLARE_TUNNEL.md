# Cloudflare Tunnel

Cloudflare Tunnel pode expor temporariamente a Evolution API local para testes.

## Comando temporário

```bash
cloudflared tunnel --url http://localhost:8080
```

Esse comando gera uma URL temporária `trycloudflare.com`.

## Uso no admin

No `/admin`, seção WhatsApp / Evolution API:

```text
URL base da Evolution API = https://<url-temporaria>.trycloudflare.com
Instance Name = bolao
API Key = <EVOLUTION_API_KEY>
URL do site = https://bolao.flow-profit.com
```

## Importante

URLs `trycloudflare.com` são temporárias:

- Mudam quando o tunnel é reiniciado.
- Não devem ser usadas como produção definitiva.
- Podem quebrar envios WhatsApp se a URL expirar.

## Quando usar

- Teste local.
- Demonstração rápida.
- Validação de WhatsApp antes de contratar/configurar VPS.

## Quando não usar

- Operação permanente.
- Ambiente com usuários reais dependendo de WhatsApp.
- Integração crítica com alta disponibilidade.

## Produção recomendada

Usar Evolution API em VPS com DNS estável:

```text
https://evolution.flow-profit.com
```

## Validação

Após abrir tunnel:

1. Configurar URL no admin.
2. Salvar configuração.
3. Enviar mensagem de teste.
4. Confirmar recebimento no WhatsApp.
