# Supabase

Supabase fornece o PostgreSQL de produção.

## Connection string

A variável usada pela aplicação é:

```text
DATABASE_URL=<DATABASE_URL>
```

Nunca commitar a URL real. Ela contém usuário, senha, host e banco.

## Atenção ao placeholder

Ao copiar a connection string do Supabase, substitua:

```text
[YOUR-PASSWORD]
```

pela senha real do banco. Se isso não for feito, a aplicação não conecta.

## Direct connection vs pooler

Algumas redes têm problema com conexão direta IPv6 do Supabase.

Se a conexão direta falhar:

- Testar a URL pooler do Supabase.
- Verificar SSL.
- Conferir se a senha foi codificada corretamente na URL.

## Prisma

Produção usa:

```text
prisma-postgres/schema.prisma
```

Comandos:

```bash
npm run prisma:generate:postgres
npm run prisma:migrate:deploy:postgres
```

## Migrações

Antes de aplicar:

1. Conferir ambiente certo.
2. Fazer backup.
3. Revisar SQL gerado.
4. Aplicar:

```bash
npm run prisma:migrate:deploy:postgres
```

5. Validar:

```bash
npm run build:postgres
```

## Backup

Checklist:

- Confirmar projeto Supabase correto.
- Exportar backup/snapshot.
- Registrar horário.
- Guardar referência do deploy atual da Vercel.
- Executar mudança.
- Validar aplicação.

## Restore

Checklist de restauração:

1. Pausar mudanças de produção.
2. Identificar backup correto.
3. Restaurar no Supabase conforme ferramenta disponível.
4. Validar tabelas principais:
   - `Pool`
   - `Player`
   - `Game`
   - `Prediction`
   - `PredictionAudit`
   - `AppSetting`
5. Redeploy Vercel sem cache se necessário.
