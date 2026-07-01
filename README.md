# Bazar Eletrônicos ERP - V33 SaaS Multiempresa

Esta versão transforma o sistema em uma base SaaS para vender assinaturas.

## Novidades da V33

- Assinaturas e planos
- Multiempresa
- Cadastro de empresas assinantes
- Status de teste, ativo, atrasado, suspenso e cancelado
- Controle de vencimento e período de teste
- Exportação Excel das empresas SaaS
- Migração Supabase `supabase/v33_saas_multiempresa_migration.sql`

## Atualização do banco

Depois de instalar a V32, execute também:

```sql
supabase/v33_saas_multiempresa_migration.sql
```

---

# Bazar Eletrônicos ERP - V29 Restaurante e Pizzaria

Versão 29 baseada na V28, adicionando módulos específicos para restaurante, pizzaria, delivery, mesas/comandas e cozinha.

# Sistema ERP Modular V28

Versão criada sobre a V26, preservando os módulos existentes e adicionando seleção de segmento, menu adaptável e configuração modular.

> A V28 organiza e personaliza os módulos que já existem. Agenda, mesas, comandas, matrículas, planos, pets e veículos serão adicionados nas próximas versões específicas.

## Histórico das versões anteriores

### V19 — Ordens de Serviço

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


## V23 — Responsivo para celular

- Menu lateral móvel em formato de gaveta.
- Botão para abrir e fechar o menu no celular.
- Formulários adaptados para telas pequenas.
- Tabelas com rolagem horizontal.
- Cards, botões, campos e espaçamentos otimizados para toque.
- Cabeçalho fixo no topo.
- Login responsivo.


## V24 — Correção definitiva para implantação na Vercel

- Node.js atualizado para 24.x.
- npm 11 definido como gerenciador do projeto.
- `package-lock.json` corrigido para usar apenas `https://registry.npmjs.org/`.
- Removidas todas as referências ao registro interno `applied-caas`.
- `.npmrc` configurado para o registro público e novas tentativas em caso de falha de rede.
- `vercel.json` configurado com `npm ci`, `npm run build` e saída `dist`.
- Projeto responsivo da V23 preservado.

### Vercel

Depois de enviar ao GitHub, faça uma nova implantação com **Clear Build Cache**.
Nas configurações do projeto, use Node.js 24.x.


## V25 — Instalação completa do banco Supabase

Execute `supabase/INSTALAR_BANCO_COMPLETO.sql` no SQL Editor do Supabase antes de usar o sistema.


## V26 — PDFs profissionais em uma página

- Ordem de Serviço redesenhada em formato profissional A4.
- Ordem de Serviço limitada a uma única página.
- Logo, dados da loja, cliente, aparelho, financeiro, termos e assinaturas organizados.
- Seção e campo de fotos anexadas removidos.
- Romaneio redesenhado em uma página com tabela e total corretamente alinhados.
- Texto “V23 responsivo mobile” removido do menu.

## Novidades da versão 27 — Sistema Modular

A V28 transforma o projeto em uma base única para vários segmentos.

### Segmentos disponíveis

- Loja e comércio
- Comunicação visual
- Assistência técnica
- Oficina mecânica
- Barbearia
- Salão de beleza
- Pet shop
- Academia
- Escola e cursos
- Restaurante e pizzaria

### Como funciona

1. Depois do login, abra **Início**.
2. Escolha o segmento da empresa.
3. O menu lateral passa a exibir somente os módulos adequados ao segmento.
4. O segmento pode ser alterado depois em **Configurações** ou em **Trocar segmento**.

### Atualização do banco da V26 para a V28

No SQL Editor do Supabase, execute:

```txt
supabase/v27_sistema_modular_migration.sql
```

Em uma instalação nova, você pode executar diretamente:

```txt
supabase/INSTALAR_BANCO_COMPLETO.sql
```

A seleção também é mantida localmente como segurança caso a migração ainda não tenha sido executada, mas o SQL da V28 é necessário para sincronizar o segmento entre dispositivos.


## V28 — Agenda e Profissionais

Esta versão adiciona o módulo de agenda para segmentos de atendimento e aulas.

### Novidades
- Menu Agenda e Profissionais.
- Cadastro de profissionais, função, telefone, comissão e horário de trabalho.
- Agendamento por data e horário.
- Seleção de cliente existente ou cliente avulso.
- Serviço/aula/atendimento, duração, valor, status e observações.
- Indicadores do dia: agendamentos, confirmados, concluídos e previsão de faturamento.
- Status: agendado, confirmado, em atendimento, concluído e cancelado.

Para atualizar banco existente da V27, execute:

```txt
supabase/v28_agenda_profissionais_migration.sql
```


## Atualização V29

Para banco já instalado, execute:

```txt
supabase/v29_restaurante_pizzaria_migration.sql
```

Novos módulos adicionados:

- Mesas e Comandas
- Painel da Cozinha
- Delivery
- Pedidos por status
- Taxa de entrega e forma de pagamento
- Cardápio/estoque usando o módulo de produtos

## V30 - Oficina Mecânica

Esta versão adiciona módulos para oficina mecânica:

- Veículos: placa, marca, modelo, ano, cor, chassi, Renavam, KM, combustível e cliente.
- Checklist de entrada: avarias, acessórios, diagnóstico, serviços, peças, garantia e PDF.
- Manutenção preventiva: revisão por data ou KM, status pendente/agendado/concluído.

Para bancos existentes, execute:

```txt
supabase/v30_oficina_mecanica_migration.sql
```


## V32 - Pet Shop

Adiciona cadastro completo de pets, ficha PDF do animal, histórico de vacinas, vermífugos, banho e tosa, consultas e retornos. Execute `supabase/v32_pet_shop_migration.sql` em bases existentes.
