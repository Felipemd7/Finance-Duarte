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
  - `Preço do Litro` + `Volume (Litros)` ➔ calcula automaticamente o `Total Pago`.
  - Os campos inicializam vazios para evitar interferência de valores fixos hardcoded.

