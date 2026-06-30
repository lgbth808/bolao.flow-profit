# Evolution API

A Evolution API é usada para enviar mensagens automáticas via WhatsApp.

## Instância validada

| Campo | Valor |
| --- | --- |
| Instance name | `bolao` |
| Endpoint | `POST /message/sendText/{instance}` |
| Uso | Mensagens transacionais do bolão |

> A versão exata da imagem/serviço deve ser conferida no ambiente Docker/VPS em uso. Esta documentação registra o contrato de integração validado pelo app.

## Configuração no admin

No painel `/admin`, seção WhatsApp / Evolution API:

- URL base da Evolution API.
- Instance Name.
- API Key.
- URL do site do bolão.
- Número de teste.
- Mensagem de teste.

As configurações são salvas no banco via `AppSetting`.

## Endpoint

```text
POST <BASE_URL>/message/sendText/<INSTANCE_NAME>
```

Headers:

```text
Content-Type: application/json
apikey: <EVOLUTION_API_KEY>
```

Payload:

```json
{
  "number": "55DDDNUMERO",
  "text": "Mensagem"
}
```

## Formatação de telefone

Regras:

- Remover espaços, parênteses, traços e caracteres não numéricos.
- Se houver 10 ou 11 dígitos nacionais, prefixar `55`.
- Se já começar com `55` e tiver tamanho válido, manter.
- Enviar como `55DDDNUMERO`.

## Fluxos de mensagem

| Evento | Destinatário | Observação |
| --- | --- | --- |
| Novo jogo cadastrado | Todos os jogadores do bolão | Enviado uma vez por jogo |
| Novo palpite | Jogador | Confirma palpite |
| Edição de palpite | Jogador | Confirma novo placar |
| Exclusão de palpite | Jogador | Confirma exclusão |
| Baixa de pagamento | Jogador | Confirma pagamento e palpite registrado |
| Teste admin | Número de teste | Diagnóstico de integração |

## Regra de consistência

A ação principal deve ser salva primeiro no banco. Depois o app tenta enviar WhatsApp.

Falha de WhatsApp:

- Não desfaz cadastro, palpite ou pagamento.
- Deve ser tratada como aviso operacional.
- Usuário final não deve depender do envio para concluir ação.

## Segurança

Hoje a configuração fica em banco e é administrada pela UI. Em produção madura, recomenda-se que o envio WhatsApp passe por backend/serverless function com segredos protegidos e rotação controlada.

Nunca registre API Key real em Git.
