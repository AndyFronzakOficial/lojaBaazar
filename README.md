# Bazar Eletrônicos ERP — V18

## Novidades da V18

- Dashboard com dados reais sincronizados:
  - Faturamento do dia
  - Faturamento dos últimos 7 dias
  - Faturamento do mês
  - Ticket médio
  - Top 3 produtos mais vendidos
  - Top 3 produtos menos vendidos
- Financeiro melhorado:
  - Saldo atual
  - A receber
  - A pagar
  - Saldo previsto
  - Gráfico de fluxo de caixa por dia
- Relatório mensal em PDF profissional
- Excel profissional com colunas traduzidas
- Cada login tem seus próprios dados/loja:
  - Produtos separados
  - Clientes separados
  - Vendas separadas
  - Financeiro separado
  - Configurações separadas

## Instalação

```bash
npm install
npm run dev
```

## Supabase

Rode o arquivo:

```txt
supabase/schema.sql
```

no SQL Editor.

Importante: a V18 usa `user_id` nas tabelas. Cada usuário autenticado vê somente seus próprios dados.


## Correções

- Cupom PDF 80mm ao finalizar venda.
- Botão para ocultar/mostrar menu lateral.
