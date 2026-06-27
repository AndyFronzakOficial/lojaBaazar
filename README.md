# Bazar Eletrônicos ERP — V19 Ordens de Serviço

Versão criada sobre a **V18 corrigida com caixa, cupom e menu recolhível**.

## Novidades

- Nova tela **Ordens de Serviço**.
- Cadastro com nome, Instagram, WhatsApp e data.
- Seleção de produtos cadastrados com preço unitário automático.
- Quantidade, valor unitário e total por item.
- PDF A4 profissional inspirado no modelo enviado.
- Dados PIX no PDF:
  - Chave: `41-98464-8144`
  - Titular: `Abquella Carmo de Lima`
  - Banco: `Banco Itaú`
- Histórico organizado em tabela.
- Controle de pago/pendente.
- Controle de entregue/não entregue.
- Integração automática com o financeiro.
- Ordens pagas entram como receita.
- Ordens pendentes entram em contas a receber.
- Dashboard mostra ordens do mês e valor a receber.
- Botão para abrir conversa no WhatsApp da cliente.
- Botão para gerar novamente o PDF.

## Supabase

No SQL Editor, execute:

```txt
supabase/v19_ordens_servico_migration.sql
```

O mesmo conteúdo também está em `supabase/schema.sql`.

## Instalação

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

A pasta `dist` será criada automaticamente.

## Vercel

O projeto inclui `vercel.json` para forçar:

- instalação com npm;
- build com `npm run build`;
- saída em `dist`.

Configure as variáveis:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```


## V20 — Histórico Completo do Cliente

Incluído:

- Nova tela "Histórico Cliente"
- Todas as compras do cliente
- Itens comprados
- Ordens de serviço vinculadas
- Produtos reservados
- Fiado / contas a receber
- Pagamentos
- Trocas e devoluções
- Garantias
- Total gasto
- Última compra
- Botão direto para WhatsApp

Antes de usar, rode no Supabase:

```txt
supabase/v20_historico_cliente_migration.sql
```

## V21 — Ordem de Serviço Completa

Incluído:
- Número automático da OS
- Data e hora da entrada
- Cliente
- Aparelho
- Defeito relatado pelo cliente
- Condição visual do aparelho
- Serviço solicitado
- Técnico responsável
- Prioridade
- Prazo estimado
- Valor estimado
- Valor final
- Entrada paga
- Saldo restante
- Forma de pagamento
- Status do serviço
- Observações internas
- Termos da assistência
- Assinatura do cliente
- Fotos anexadas
- PDF profissional
- Envio pelo WhatsApp
- Consultar, alterar e excluir OS
- Sincronização com financeiro

Antes de usar, rode no Supabase:

```txt
supabase/v21_ordem_servico_completa_migration.sql
```


## Correção V21

Corrigido erro de tela branca:

- Removido conflito entre `import ServiceOrdersPage from './ServiceOrdersPage'` e `function ServiceOrdersPage()` dentro do `main.tsx`.
- Adicionado `src/vite-env.d.ts`.
- Adicionado `"types": ["vite/client"]` no `tsconfig.json`.
- Adicionado `vercel.json` forçando `npm install`.

Se aparecer tela branca, pare o servidor e rode:

```bash
CTRL + C
npm install
npm run dev
```

No Vercel, faça redeploy com **Clear Build Cache**.


## Atualização CRUD

Incluído nesta versão:
- Financeiro: adicionar, consultar, alterar, excluir e baixar pagamento.
- Produtos: adicionar, consultar, alterar e excluir.
- Clientes: adicionar, consultar, alterar, excluir e botão de WhatsApp.


## V22 — Romaneio + Upload de Logo

Incluído:
- Tela Romaneios
- Selecionar cliente cadastrado
- Cadastrar cliente na hora
- Preencher Instagram e contato automaticamente quando existir
- Múltiplos produtos no romaneio
- Total automático
- PDF parecido com o modelo enviado
- Pix fixo: 41-98464-8144 — Abquella Carmo de Lima — Banco Itaú
- Histórico/listagem de romaneios
- Alterar, excluir, gerar PDF e enviar WhatsApp
- Clicar no nome do cliente abre o histórico do cliente
- Configurações agora permite upload de logo até 50MB
- Logo usada nos PDFs

Antes de usar, rode no Supabase:

```txt
supabase/v22_romaneio_logo_migration.sql
```

Observação: para upload de logo funcionar, o SQL cria o bucket público `logos` no Supabase Storage.


## Correção V22

Corrigido:
- Tela Romaneios adicionada ao menu lateral.
- Fluxo de caixa agora mostra botão "Baixar recibo" para lançamentos vinculados a vendas.
- O recibo baixa em PDF 80mm com dados da loja, cliente, itens, total e forma de pagamento.


## Correção PDF Romaneio

Corrigido:
- Valor da coluna TOTAL agora fica dentro do quadrado da tabela.
- Descrição do produto foi limitada para não invadir as colunas de valor.
