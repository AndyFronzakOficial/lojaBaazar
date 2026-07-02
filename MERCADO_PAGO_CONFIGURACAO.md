# Configuração Mercado Pago — V34

## 1. Banco de dados

No Supabase, abra **SQL Editor** e execute:

```sql
supabase/v34_mercado_pago_assinaturas_migration.sql
```

## 2. Criar aplicação no Mercado Pago

No painel Mercado Pago Developers, crie ou abra sua aplicação e copie:

- Access Token de produção
- Chave secreta do Webhook

A conta recebedora precisa possuir uma chave Pix cadastrada.

## 3. Variáveis de ambiente na Vercel

Em **Project Settings > Environment Variables**, cadastre:

```txt
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=SUA_CHAVE_SECRETA_WEBHOOK
VITE_SAAS_OWNER_EMAILS=seuemail@dominio.com
```

A `SUPABASE_SERVICE_ROLE_KEY` e o `MERCADO_PAGO_ACCESS_TOKEN` são secretos. Não coloque prefixo `VITE_` neles.

## 4. Configurar Webhook

No Mercado Pago Developers:

1. Abra **Suas integrações**.
2. Selecione a aplicação.
3. Entre em **Webhooks > Configurar notificações**.
4. Em modo produtivo, use:

```txt
https://SEU-DOMINIO.vercel.app/api/mercadopago/webhook
```

5. Ative o evento **Order (Mercado Pago)** / **Orders**.
6. Salve e copie a chave secreta gerada para `MERCADO_PAGO_WEBHOOK_SECRET`.
7. Use o simulador do painel para confirmar resposta HTTP 200.

## 5. Publicar novamente

Depois de cadastrar as variáveis, faça um novo deploy na Vercel.

## Funcionamento

- O cliente escolhe um segmento.
- Se não houver assinatura válida, o backend cria uma cobrança Pix de R$ 59,90.
- O QR Code expira em 30 minutos.
- Quando a order fica `processed/accredited`, o sistema libera o segmento por 30 dias.
- A tela consulta o status a cada 5 segundos e o webhook confirma automaticamente.
- Após o vencimento, o acesso ao segmento é bloqueado e uma nova tela Pix é exibida.

## Segurança

O preço e a duração são definidos no backend, portanto não podem ser alterados pelo navegador. A aprovação só é executada pela Service Role do Supabase após consulta ao Mercado Pago. O webhook valida a assinatura secreta.
