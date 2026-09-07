# Integração Supabase + Hubla

O código desta integração fica em `supabase/`:

- `migrations/20260907170000_members_library.sql`: produtos, músicas, membros, acessos, idempotência e RLS.
- `functions/hubla-webhook`: recebe eventos v2 da Hubla, valida `x-hubla-token`, remove CPF do log, grava o comprador e concede/remove produtos.
- `functions/member-login`: confere e-mail + CPF e devolve um magic link de uso único para a biblioteca.

## Publicação inicial

Use o perfil separado deste projeto. Se o terminal tiver uma variável
`SUPABASE_ACCESS_TOKEN` antiga, remova-a somente desses comandos para que ela não
sobrescreva o perfil correto:

```bash
cd '/Users/admin/orca/workspaces/ENGLISH MUSIC SYNC letra/organizando'
env -u SUPABASE_ACCESS_TOKEN supabase db push --profile english-music-sync
```

Se a CLI solicitar a senha do banco, informe-a apenas no terminal. Não coloque essa senha em arquivos do Git.

O `APP_URL` e o `CPF_HASH_SECRET` já foram configurados no projeto. Falta
somente cadastrar o token secreto gerado pela Hubla. O comando abaixo lê o token
sem exibi-lo na tela:

```bash
read -s HUBLA_WEBHOOK_TOKEN
echo
env -u SUPABASE_ACCESS_TOKEN supabase secrets set \
  --profile english-music-sync --project-ref rdlznkwpffzhjilzmvbp \
  HUBLA_WEBHOOK_TOKEN="$HUBLA_WEBHOOK_TOKEN"
unset HUBLA_WEBHOOK_TOKEN
```

Depois publique as funções sem a validação JWT padrão, pois o webhook da Hubla autentica pelo próprio `x-hubla-token`:

```bash
env -u SUPABASE_ACCESS_TOKEN supabase functions deploy hubla-webhook --no-verify-jwt --use-api --profile english-music-sync
env -u SUPABASE_ACCESS_TOKEN supabase functions deploy member-login --no-verify-jwt --use-api --profile english-music-sync
```

O endpoint para colar na Hubla será:

```text
https://rdlznkwpffzhjilzmvbp.supabase.co/functions/v1/hubla-webhook
```

Na Hubla, crie regras v2 para `customer.member_added` e `customer.member_removed`. Se o produto for recorrente, inclua também `subscription.activated`, `subscription.deactivated` e `subscription.expired`. O token deve ser salvo apenas como segredo `HUBLA_WEBHOOK_TOKEN`.

## Chave pública do navegador

O arquivo `supabase-config.js` contém o URL público e um marcador para a chave `anon`. Recupere a chave pública (sem `--reveal`) e substitua apenas o marcador:

```bash
env -u SUPABASE_ACCESS_TOKEN supabase projects api-keys --project-ref rdlznkwpffzhjilzmvbp --profile english-music-sync
```

A chave anon pode aparecer no navegador; nunca coloque no navegador a chave `service_role`, o token da Hubla ou o segredo do CPF.

No painel do Supabase, em **Authentication → URL Configuration**, adicione
`https://english-music-sync.vercel.app/biblioteca.html` às Redirect URLs. Sem
essa permissão o magic link pode validar, mas não voltar para a biblioteca.

## Mapeamento de produtos e músicas

O webhook cria/atualiza os produtos da Hubla, mas não adivinha quais músicas pertencem a cada produto. Depois de receber o primeiro evento, o produto deve ser associado às músicas na tabela `product_songs`. Essa separação permite que um produto principal e um order bump liberem conjuntos diferentes de músicas.

O login não grava o CPF puro. Ele calcula um HMAC no servidor e compara o resultado; o payload de webhook salvo para auditoria também redige documento, IP e endereço.
