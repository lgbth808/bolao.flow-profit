# Publicação do Bolão em `bolao.flow-profit.com`

Este projeto é um app Next.js. Ele não deve ser publicado como uma página
estática dentro do WordPress, porque precisa de banco, rotas API, login,
admin, Prisma e atualização de placar. O WordPress.com deve ficar responsável
apenas pelo domínio/DNS. O app roda na Vercel e o banco em Supabase/Postgres.

## 1. Antes de começar

Tenha estas contas abertas no navegador:

- GitHub: onde ficará o código.
- Vercel: onde o app Next.js será publicado.
- Supabase: onde ficará o banco Postgres.
- WordPress.com: onde o domínio `flow-profit.com` está hospedado.

URL final recomendada:

```text
https://bolao.flow-profit.com
```

## 2. Subir o código para o GitHub

No terminal, entre na pasta do projeto:

```bash
cd "/Users/lineugobeth/Documents/Site bolão"
```

Confira os arquivos:

```bash
git status
```

Se ainda não houver commit inicial:

```bash
git add .
git commit -m "Publicar bolao copa 2026"
```

Se o remoto ainda não estiver configurado, use o repositório que você criou no
GitHub:

```bash
git remote add origin https://github.com/lgbth808/bolao.flow-profit.git
git branch -M main
git push -u origin main
```

Se o remoto já existir, use apenas:

```bash
git push origin main
```

## 3. Criar banco no Supabase

1. Acesse o Supabase.
2. Clique em `New project`.
3. Escolha uma organização.
4. Nome sugerido: `bolao-flow-profit`.
5. Crie uma senha forte para o banco e guarde.
6. Escolha uma região próxima, preferencialmente `South America` se disponível.
7. Aguarde o projeto terminar de criar.

Depois:

1. Vá em `Project Settings`.
2. Abra `Database`.
3. Procure `Connection string`.
4. Se houver opção `Prisma`, use essa.
5. Copie a URL Postgres.

Ela será parecida com:

```text
postgresql://postgres.xxxxx:SENHA@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

## 4. Rodar migrações no Supabase

No terminal, rode a migração apontando para o banco Supabase.
Substitua `COLE_AQUI_A_DATABASE_URL` pela URL copiada.

```bash
DATABASE_URL="COLE_AQUI_A_DATABASE_URL" npm run prisma:migrate:deploy:postgres
```

Se quiser carregar a amostra Brasil x Japão no Supabase:

```bash
DATABASE_URL="COLE_AQUI_A_DATABASE_URL" npm run prisma:generate:postgres
DATABASE_URL="COLE_AQUI_A_DATABASE_URL" node prisma/seed.cjs
npx prisma generate
```

Importante: o seed apaga e recria os dados do banco. Use só no início.

## 5. Criar o projeto na Vercel

1. Acesse a Vercel.
2. Clique em `Add New...`.
3. Clique em `Project`.
4. Importe o repositório `lgbth808/bolao.flow-profit`.
5. Framework: `Next.js`.
6. Build Command:

```bash
npm run build:postgres
```

7. Install Command:

```bash
npm install
```

8. Output Directory: deixe vazio, a Vercel detecta Next.js.

## 6. Variáveis de ambiente na Vercel

Na tela do projeto Vercel, abra `Settings` > `Environment Variables`.

Cadastre:

```text
DATABASE_URL=COLE_AQUI_A_DATABASE_URL_DO_SUPABASE
ADMIN_PASSWORD=crie-uma-senha-forte-para-o-admin
ADMIN_SESSION_SECRET=crie-uma-string-longa-aleatoria
PLAYER_PIN_SECRET=crie-outra-string-longa-aleatoria
CRON_SECRET=crie-um-token-longo-aleatorio
```

Exemplos de strings longas:

```bash
openssl rand -hex 32
```

Use uma string diferente para cada secret.

Depois clique em `Deploy`.

## 7. Configurar o domínio `bolao.flow-profit.com` na Vercel

1. Na Vercel, abra o projeto.
2. Vá em `Settings`.
3. Clique em `Domains`.
4. Digite:

```text
bolao.flow-profit.com
```

5. Clique para adicionar.
6. A Vercel mostrará um registro DNS, normalmente:

```text
Type: CNAME
Name: bolao
Value: cname.vercel-dns.com
```

Guarde esses dados.

## 8. Criar o DNS no WordPress.com

1. Acesse `https://wordpress.com/sites/flow-profit.com`.
2. Abra o site `flow-profit.com`.
3. Vá em `Upgrades` ou `Domínios`.
4. Abra o domínio `flow-profit.com`.
5. Entre em `DNS records` ou `Registros DNS`.
6. Clique em `Add a record`.
7. Escolha:

```text
Type: CNAME
Name: bolao
Points to: cname.vercel-dns.com
```

8. Salve.

Pode demorar de alguns minutos até algumas horas para o DNS propagar.

## 9. Verificar publicação

Depois que o DNS propagar, abra:

```text
https://bolao.flow-profit.com
```

Teste:

1. Login/cadastro por WhatsApp.
2. Entrada em um bolão.
3. Página `/apostas`.
4. Página `/admin`.
5. Cadastro de jogo.
6. Baixa de pagamento.
7. API-Football, se já tiver API Key.
8. WhatsApp/Evolution API, se já tiver configuração.

## 10. Configurar API-Football no admin

No app publicado:

1. Abra `https://bolao.flow-profit.com/admin`.
2. Entre com a senha do admin.
3. Vá em `API-Football`.
4. Cole a API Key da API-Sports/API-Football.
5. Salve.
6. Use o buscador para obter `League ID`, `Team ID` e `Fixture ID`.
7. No cadastro do jogo, salve o `Fixture ID API-Football`.

O placar automático depende do `Fixture ID`.

## 11. Configurar Evolution API no admin

No app publicado:

1. Abra `/admin`.
2. Vá em `WhatsApp`.
3. Preencha:
   - URL base Evolution API.
   - Instance Name.
   - API Key.
   - URL do site: `https://bolao.flow-profit.com`.
   - Número de teste.
4. Clique em salvar.
5. Clique em testar envio.

Em produção, a Evolution API fica configurada no banco Supabase.

## 12. Atualização automática de placar

O app atualiza placar quando páginas/API são acessadas. Para automatizar mesmo
sem ninguém abrir a página, configure um cron externo chamando:

```text
POST https://bolao.flow-profit.com/api/admin/scores/sync
Authorization: Bearer SEU_CRON_SECRET
```

Pode usar:

- Vercel Cron.
- cron-job.org.
- UptimeRobot.

Intervalo sugerido durante jogos: 1 minuto.

## 13. WordPress como atalho opcional

Se quiser também manter uma página em:

```text
https://flow-profit.com/copa2026/bolao/
```

Crie uma página no WordPress com um botão:

```text
Participar do Bolão
https://bolao.flow-profit.com
```

Não coloque o app inteiro dentro do WordPress. Use o WordPress apenas como
atalho institucional.

## 14. Checklist final

- `npm run lint` passou localmente.
- `npm run build` passou localmente.
- `npm run build:postgres` passou localmente.
- Supabase criado.
- Migrações Postgres aplicadas.
- Vercel conectado ao GitHub.
- Variáveis de ambiente configuradas.
- Domínio adicionado na Vercel.
- CNAME `bolao` criado no WordPress.com.
- `/admin` protegido por senha.
- API-Football configurada.
- Evolution API configurada, se for usar WhatsApp.
