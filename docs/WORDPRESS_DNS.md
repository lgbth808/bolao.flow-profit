# WordPress.com DNS

O domínio `flow-profit.com` é gerenciado pelo WordPress.com.

## Produção atual

| Host | Destino |
| --- | --- |
| `bolao.flow-profit.com` | CNAME para Vercel |

O WordPress.com continua como gestor de DNS do domínio raiz. A aplicação do bolão roda fora do WordPress, na Vercel.

## Registro esperado

No WordPress.com, criar/validar:

```text
Type: CNAME
Name: bolao
Value: <CNAME_DA_VERCEL>
```

O valor exato do CNAME deve ser copiado do painel da Vercel, sem inventar.

## Futuro: Evolution API em VPS

Quando a Evolution API sair do ambiente local/tunnel e for para VPS, o host planejado é:

```text
evolution.flow-profit.com
```

Registro futuro:

```text
Type: A ou CNAME
Name: evolution
Value: <IP_OU_HOST_DA_VPS>
```

## Checklist antes de alterar DNS

1. Confirmar que está no WordPress.com correto.
2. Confirmar domínio `flow-profit.com`.
3. Fazer print ou anotação do registro atual.
4. Aplicar alteração.
5. Aguardar propagação.
6. Validar:

```bash
dig bolao.flow-profit.com
```

ou:

```bash
nslookup bolao.flow-profit.com
```

## Observações

- DNS pode levar minutos ou horas para propagar.
- Não remova registros existentes sem saber a função.
- Não confunda página WordPress com subdomínio de app na Vercel.
