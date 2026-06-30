# API-Football / API-Sports

A API-Football é usada para buscar dados de futebol e atualizar placares dos jogos cadastrados.

## Uso atual

| Recurso | Uso |
| --- | --- |
| Teams | Buscar IDs de seleções/times |
| Leagues | Buscar IDs de ligas/campeonatos |
| Fixtures | Buscar jogos do Brasil e sincronizar placar |
| Fixture ID | Identificador principal salvo em cada jogo |

## Endpoint base

```text
https://v3.football.api-sports.io
```

Headers:

```text
x-apisports-key: <API_FOOTBALL_KEY>
```

## Fixture ID

Cada jogo cadastrado pode ter `apiFootballFixtureId`.

Esse ID é usado para buscar apenas o jogo específico:

```text
GET /fixtures?id=<FIXTURE_ID>
```

Não buscar todos os jogos sem necessidade. Isso evita consumo indevido do plano gratuito.

## Busca de fixtures

O app possui busca por:

```text
league=<LEAGUE_ID>
season=<YYYY>
team=<TEAM_ID>
date=<YYYY-MM-DD> opcional
```

Exemplo conceitual:

```text
GET /fixtures?league=<LEAGUE_ID>&season=2026&team=<BRAZIL_TEAM_ID>&date=<YYYY-MM-DD>
```

## Sincronização de placar

Arquivo relevante:

```text
lib/score-sync.ts
```

Regras implementadas:

- Intervalo de sincronização: 5 minutos.
- Janela de sincronização automática: início do jogo até 2h depois.
- Atualização manual pode ignorar intervalo e permitir jogo finalizado.
- Status final considerados:
  - `FT`
  - `AET`
  - `PEN`

## Mandante/visitante

O código identifica se Brasil/Brazil está em `teams.home.name` ou `teams.away.name`.

| Caso | Placar Brasil | Placar adversário |
| --- | --- | --- |
| Brasil mandante | `goals.home` | `goals.away` |
| Brasil visitante | `goals.away` | `goals.home` |

## Quando o jogo finaliza

Ao detectar status final:

1. Atualiza placar real.
2. Marca status como finalizado/encerrado.
3. Salva data de finalização.
4. Crava snapshot de prêmio/rateio.
5. Registra erro/status de sync se houver falha.

## Validação

```bash
npm run build:postgres
```

Para testar operacionalmente:

1. Entrar em `/admin`.
2. Salvar API Key API-Football.
3. Buscar liga/time/fixture.
4. Associar Fixture ID ao jogo.
5. Clicar em "Buscar/Atualizar placar agora".
