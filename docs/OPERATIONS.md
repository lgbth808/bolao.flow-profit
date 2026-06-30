# Operações

Rotina prática para operar o bolão em produção.

## Acesso admin

URL:

```text
https://bolao.flow-profit.com/admin
```

Use a senha configurada em `ADMIN_PASSWORD`.

## Criar bolão

1. Abrir Admin.
2. Aba Bolões.
3. Cadastrar bolão.
4. Informar PIX e responsável.
5. Validar que aparece para o jogador na tela de apostas.

## Criar jogo

1. Aba Jogos.
2. Cadastrar jogo.
3. Selecionar bolão.
4. Selecionar adversário.
5. Informar fase, data/hora e valor.
6. Preencher dados API-Football quando disponíveis.
7. Salvar.

## Configurar API-Football

1. Aba API-Football.
2. Salvar API Key.
3. Buscar liga/campeonato.
4. Buscar time/seleção.
5. Buscar fixture.
6. Associar Fixture ID ao jogo.
7. Testar "Buscar/Atualizar placar agora".

## Confirmar pagamentos

1. Aba Financeiro.
2. Filtrar por jogo, jogador ou pendentes.
3. Dar baixa no pagamento.
4. Conferir se o palpite deixa de aparecer como pendente.
5. Se WhatsApp estiver configurado, confirmar envio ou testar depois.

## Gerenciar palpiteiros

1. Aba Palpiteiros.
2. Editar nome ou WhatsApp quando necessário.
3. Resetar senha se o jogador esqueceu PIN.
4. Excluir palpiteiro apenas com confirmação operacional.

## Conferir vencedores

1. Após o jogo, sincronizar placar pela API-Football ou inserir placar real.
2. Confirmar que o jogo está finalizado.
3. Conferir card de vencedores/rateio.
4. Validar financeiro do jogo.

## Testar WhatsApp

1. Aba WhatsApp / Evolution API.
2. Confirmar URL base, instance `bolao`, API Key e site URL.
3. Informar número de teste.
4. Enviar teste.
5. Se falhar, ver [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

## Operação no dia do jogo

| Momento | Ação |
| --- | --- |
| Antes do jogo | Conferir horário, valor, fixture e WhatsApp |
| Até 10min antes | Palpites ainda editáveis |
| Fechamento | Palpites de outros são revelados conforme regra |
| Durante jogo | Sync de placar pode atualizar status/minuto |
| Pós-jogo | Finalizar placar, conferir vencedores e rateio |

## Registros

Mudanças relevantes devem ser registradas em:

- [CHANGELOG.md](./CHANGELOG.md)
- [DECISIONS.md](./DECISIONS.md), se for decisão arquitetural
