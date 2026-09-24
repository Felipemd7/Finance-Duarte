# 💑 Finanças Casal Duarte - Memória de Arquitetura e Regras de Negócio

Este documento serve como diretriz e memória de contexto para o projeto de finanças do casal (Felipe Duarte & Genivânia Duarte).

---

## 📌 Contexto Geral & Usuários
- **Usuários:** Felipe Duarte (`usr-felipe`) e Genivânia Duarte (`usr-genivania`).
- **Escopo:** Finanças conjuntas com categorização de despesas (Invariável, Variável, Extra/Eventualidades), metas, controle de combustível e leitor inteligente de comprovantes (OCR).

---

## 💳 Formas de Pagamento & Status
1. **Formas de Pagamento:**
   - Opção padrão e principal: **`Cartão conjunto Inter`**.
   - Outras formas válidas: `PIX Inter`, `Cartão de Crédito NuBank`, `PIX NuBank`, `Débito em Conta`, `Dinheiro`, `Boleto Bancário`.
2. **Status da Transação:**
   - Suporta: `pago`, `previsto`, `pendente`.
   - **Compatibilidade com Supabase:** O banco possui restrição check (`pago`, `previsto`, `pendente`). No serviço do Supabase (`supabaseService.ts`), transações com status `'pendente'` são mapeadas preventivamente para `'previsto'` ao gravar se necessário, evitando erro 400.
   - Funções `addTransactionToCloud` e `updateTransactionInCloud` retornam `{ success: boolean; error?: string }` para feedback claro ao usuário.

---

## 🏷️ Categorias & Subcategorias Recentes
- **Saúde / Farmácia:** A categoria antiga "Médico/Exames" foi reestruturada para focar em **"Farmácia"** (`sub-farmacia`).
- **Transporte / Estacionamento & Pedágio:** Despesas de "Pedágio" foram unificadas em **"Estacionamento"** dentro do fluxo de despesas.
- **Categorias Principais:**
  - `Invariável` (`cat-invariavel`)
  - `Variável` (`cat-variavel`)
  - `Extra/Eventualidades` (`cat-extra`)

---

## 🧾 Scanner Inteligente & OCR (receiptNormalizer.ts)
- **Normalização de Recibos (`src/services/receiptNormalizer.ts`):**
  - Trata comprovantes de maquininhas de cartão (POS/TEF como Cielo, Rede, Stone, PagSeguro, Getnet, SafraPay).
  - Garante que a adquirente da máquina **NÃO** seja confundida com o nome do estabelecimento comercial.
  - Reconhece e mapeia CNPJs conhecidos (ex: Postos locais) para nome fantasia, subcategoria e cidade.
  - Extrai dados fiscais (CNPJ, data, hora, itens e total).
- **Integração de Combustível com o Módulo de Metas:**
  - Comprovantes de abastecimento detectados no scanner ativam o fluxo de registro de combustível.
  - Permite input de KM atual, litros, valor por litro e posto, gravando simultaneamente na despesa e no log de abastecimento (`fuel_logs` no Supabase) para cálculo de consumo (km/l) e custo por km.

---

## ✏️ Gestão e Edição de Transações
- O modal `NewTransactionModal` oferece suporte nativo tanto para criação quanto para **edição completa** de transações existentes (`isEditing`, pré-preenchimento de campos e atualização no Supabase).
- Tela de listagem (`TransactionsView`) possui gatilhos de edição direta em cada linha/cartão.

---

## 📊 Dashboard
- O filtro de mês selecionado no Dashboard é inicializado **dinamicamente com o mês vigente atual** (`YYYY-MM`), evitando meses travados hardcoded.

---

## ⛽ Telemetria Veicular & Odômetro (Marco Zero: 124.524 km)
- **Marco Zero do Odômetro:** O abastecimento de **`124.524 km`** (registrado em 16/09/2026 no Posto Martines) é oficialmente o **marco inicial/zero** do veículo da família.
- **Cálculo de Consumo (KM/L) e Custo por KM:**
  - O abastecimento do marco zero serve como referência inicial (`isMarcoZero = true`, `kmRodados = 0`, consumo pausado).
  - Os abastecimentos subsequentes calculam o `deltaKm = kmAtual - kmAnteriorValido` e dividem pelos litros para apurar o consumo real.
  - Abastecimentos antigos sem odômetro (`km_atual = 0`) não distorcem os cálculos de KM/L nem o custo por KM.
  - Fallbacks legados de ~44 mil km foram substituídos pela faixa real de 124 mil km.
- **Cálculo Automático no Formulário Manual:** O formulário sincroniza dinamicamente:
  - `Total Pago` + `Preço do Litro` ➔ calcula automaticamente o `Volume (Litros)`.
  - `Total Pago` + `Volume (Litros)` ➔ calcula automaticamente o `Preço do Litro`.
  - Os campos inicializam vazios para evitar interferência de valores fixos hardcoded.
- **Foco Exclusivo em Combustível (Sem Custos Fixos):** O rateio de despesas fixas (IPVA/Seguro de R$ 0,53/km) foi desativado da telemetria a pedido do usuário; o cálculo de Custo/KM reflete estritamente o gasto direto com combustível dividido pela quilometragem percorrida.
- **Dashboard Personalizado & Comparador de Postos (`FuelCustomAnalyticsDashboard.tsx`):**
  - Posicionado logo abaixo do painel principal sem alterar sua estrutura.
  - Permite seleção de postos (chips) ou seleção individual de abastecimentos (checklist manual com marcar/desmarcar todos).
  - Recalcula KPIs dinâmicos da seleção (Gasto Total, Litros, Preço Médio, KM/L e Custo/KM de gasolina).
  - Comparador inteligente de postos: identifica o posto de maior autonomia (mais km/l), maior consumo (rende menos) e menor preço por litro, acompanhado de gráfico de barras interativo.
- **Unificação dos 3 Canais de Abastecimento (Regra de Ouro):**
  - Todo abastecimento (seja lançado manualmente em Transações, lido por IA no Scanner ou cadastrado em Metas/Carro) é **simultaneamente** uma despesa financeira (`transactions` com subcategoria `sub-combustivel`) e um registro de telemetria veicular (`fuel_logs` com `transacao_id`).
  - **Sincronização Bidirecional:** A inclusão, edição ou exclusão de um abastecimento em qualquer um dos 3 módulos reflete automaticamente nos outros em tempo real (tanto no banco Supabase quanto nos estados locais do React sem necessidade de refresh).

---

## 🧭 Navegação & Persistência de Tela (Reload / F5)
- Ao navegar entre as abas (`dashboard`, `extrato`, `scanner`, `metas`, `lista`, `relatorios`, `voz`), a aba ativa é mantida sincronizada no hash da URL (`#metas`, `#extrato`, etc.) e no `localStorage` (`duarte_active_tab`).
- Ao recarregar a página (F5 ou refresh do navegador), o `App.tsx` restaura automaticamente a tela e o mês (`duarte_selected_month`) que estavam sendo visualizados, evitando o redirecionamento forçado para a dashboard.
- Suporta também histórico do navegador (botões avançar/voltar via listener de `hashchange`).

