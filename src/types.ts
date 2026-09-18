// =====================================================================
// 💑 FINANÇAS CASAL DUARTE - TIPAGEM UNIFICADA TYPESCRIPT (SUPABASE & REACT)
// Felipe Duarte & Genivânia Duarte (2026)
// =====================================================================

export type CategoryType = 'Invariável' | 'Variável' | 'Extra/Eventualidades';

export type PaymentMethod =
  | 'Cartão conjunto Inter'
  | 'Cartão de Crédito'
  | 'Cartão de Crédito NuBank'
  | 'Débito'
  | 'Débito em Conta'
  | 'PIX'
  | 'PIX Inter'
  | 'PIX NuBank'
  | 'Dinheiro'
  | 'Boleto'
  | 'Boleto Bancário'
  | 'cartao'
  | 'debito'
  | 'pix'
  | string;

export type TransactionStatus = 'pago' | 'previsto' | 'pendente';
export type TransactionType = 'despesa';
export type UserRole = 'Felipe' | 'Genivânia' | 'Casal' | string;

export interface User {
  id: string;
  nome: string;
  email: string;
  avatar?: string;
  cor?: string;
  avatarColor?: string;
  dataCriacao?: string;
  data_criacao?: string;
  papel?: string;
}

export interface Category {
  id: string;
  nome: CategoryType | string;
  cor: string;
  icone: string;
  descricao?: string;
  created_at?: string;
}

export interface Subcategory {
  id: string;
  categoria_id: string;
  nome: string;
  cor?: string;
  icone?: string;
  limite_padrao?: number;
  created_at?: string;
}

export type EstablishmentType =
  | 'Supermercado'
  | 'Farmácia'
  | 'Posto de combustível'
  | 'Estacionamento'
  | 'Restaurante/Lazer'
  | 'Oficina'
  | 'Pedágio'
  | 'Serviços'
  | 'Outros';

export interface Establishment {
  id: string;
  nome: string;
  tipo: EstablishmentType | string;
  cidade?: string;
  created_at?: string;
}

export interface PurchaseItem {
  id: string;
  transacao_id?: string;
  transacaoId?: string;
  estabelecimento_id?: string;
  nome?: string;
  nome_do_item?: string;
  categoriaItem?: 'Alimentos' | 'Bebidas' | 'Limpeza' | 'Higiene' | 'Remédio' | 'Pet' | 'Outros' | string;
  categoria_item?: string;
  subcategoriaSugerida?: string;
  subcategoriaReal?: string;
  quantidade: number;
  precoUnitario?: number;
  preco_unitario?: number;
  precoTotal?: number;
  preco_total?: number;
  unidade?: string;
  desmembrado?: boolean;
  motivoDesmembramento?: string;
}

export interface PartnerSplit {
  // Casal Duarte: todas as despesas são geridas e divididas paritariamente 50/50
}

export interface Transaction {
  id: string;
  usuarioId?: string;
  usuario_id?: string;
  data: string; // YYYY-MM-DD
  mesReferencia?: string; // YYYY-MM
  mes_ano?: string; // YYYY-MM
  valor: number;
  tipo: TransactionType;
  categoria?: CategoryType | string;
  categoria_id?: string;
  subcategoria?: string;
  subcategoria_id?: string;
  estabelecimento?: string;
  estabelecimento_id?: string;
  estabelecimento_nome?: string;
  formaPagamento?: PaymentMethod;
  forma_pagamento?: PaymentMethod;
  status: TransactionStatus;
  pagoPor?: string;
  observacoes?: string;
  comprovanteId?: string;
  comprovante_id?: string;
  itens?: PurchaseItem[];
  itensDetalhados?: PurchaseItem[];
  created_at?: string;
}

export interface Receipt {
  id: string;
  transacaoId?: string;
  transacao_id?: string;
  data: string;
  estabelecimento: string;
  tipoEstabelecimento: EstablishmentType;
  numeroCupom?: string;
  valorTotal: number;
  status: 'Conciliado' | 'Pendente Vinculação' | 'Processando' | 'Pendente';
  itens: PurchaseItem[];
  imagemUrl?: string;
  dadosBrutos?: string;
  formaPagamento?: string;
  pagoPor?: string;
}

export interface ReceiptData {
  id: string;
  transacao_id?: string;
  tipo: 'imagem' | 'pdf' | 'texto';
  caminho_arquivo?: string;
  data_url?: string;
  status_de_processamento: 'pendente' | 'processado' | 'erro';
  estabelecimento_nome?: string;
  estabelecimento_tipo?: EstablishmentType;
  data?: string;
  valor_total?: number;
  itens_extraidos?: {
    nome: string;
    quantidade: number;
    preco_unitario: number;
    preco_total: number;
    categoria_item: string;
  }[];
  categoria_sugerida?: string;
  subcategoria_sugerida?: string;
  dados_brutos_extraidos?: string;
}

export interface FinancialGoal {
  id: string;
  usuarioId?: string;
  usuario_id?: string;
  titulo?: string;
  tipo?: 'teto_gasto' | 'economia_poupanca';
  tipo_meta?: 'gasto' | 'economia';
  tipoMeta?: 'gasto' | 'economia';
  periodo: 'mensal' | 'anual' | 'semanal';
  categoria?: CategoryType;
  categoria_id?: string;
  subcategoria?: string;
  subcategoria_id?: string;
  mes_ano?: string;
  valorAlvo?: number;
  valorPlanejado?: number;
  valor_planejado?: number;
  valorAtual?: number;
  valor_atual?: number;
  descricao?: string;
  alertaPercentual?: number;
  alerta_percentual?: number;
  isCarro?: boolean;
  is_carro?: boolean;
  corDestaque?: string;
  gasto_atual?: number;
  percentual?: number;
  percentual_real?: number;
  estourou?: boolean;
  saldo_restante?: number;
}

export interface ShoppingListItem {
  id: string;
  usuarioId?: string;
  usuario_id?: string;
  estabelecimentoTipo?: EstablishmentType | string;
  estabelecimento_tipo?: EstablishmentType | string;
  estabelecimentoNome?: string;
  estabelecimento_nome?: string;
  nome?: string;
  nome_do_item?: string;
  quantidade?: string;
  categoriaItem?: 'Alimentos' | 'Bebidas' | 'Limpeza' | 'Higiene' | 'Remédio' | 'Pet' | 'Outros' | string;
  categoria_item?: string;
  comprado: boolean;
  adicionadoPor?: 'Felipe' | 'Genivânia' | 'Alexa' | 'Siri' | string;
  origem?: 'manual' | 'alexa' | 'siri' | string;
  dataAdicao?: string;
  data_adicao?: string;
  precoEstimado?: number;
  preco_estimado?: number;
  reconciliadoCupomId?: string;
  transacao_id?: string;
}

export interface SpreadsheetRow {
  id?: string;
  mes?: string; // 'Janeiro 2026', '2026-03', etc.
  categoria?: CategoryType | string;
  CATEGORIA?: string;
  descricao?: string;
  DESCRICAO?: string;
  situacao?: 'Pago' | 'A Pagar' | 'Previsto' | string;
  SITUACAO?: string;
  expectativa?: number;
  EXPECTATIVA?: number;
  realidade?: number;
  REALIDADE?: number;
  diferenca?: number;
  DIFERENCA?: number;
  observacoes?: string;
  OBSERVACOES?: string;
}

export interface CategoryBudget {
  nome: string;
  categoria: CategoryType;
  orcamentoPadrao: number;
  icone: string;
  isCarro?: boolean;
}

export interface FuelLog {
  id: string;
  data: string; // YYYY-MM-DD or YYYY-MM-DD HH:mm
  posto: string; // Nome do Posto / Estabelecimento
  combustivel: 'Gasolina Comum' | 'Gasolina Aditivada' | 'Etanol' | 'Diesel' | string;
  valorTotal: number; // R$ total pago
  precoLitro: number; // R$/L
  litros: number; // Litros abastecidos
  kmAtual: number; // Odômetro atual do carro
  kmRodados?: number; // km percorridos desde o último abastecimento
  consumoKmPorLitro?: number; // Eficiência: kmRodados / litros
  custoPorKm?: number; // Custo do combustível por km: valorTotal / kmRodados
  pagoPor?: 'Felipe' | 'Genivânia' | 'Casal' | string;
  formaPagamento?: string;
  comprovanteUrl?: string; // Imagem do comprovante / cupom fiscal
  comprovanteNome?: string;
  observacoes?: string;
  origem?: 'manual' | 'comprovante_ia';
  transacaoId?: string;
  veiculoId?: string;
}

export interface Vehicle {
  id: string;
  modelo: string;
  placa: string;
  ano?: number;
  odometroAtual: number;
  motoristaPrincipalId?: string;
  custosFixosRateadosKm?: number;
  observacoes?: string;
}

// Analytics and Consumer Metrics
export interface WeeklyMetric {
  semana: string;
  Supermercado: number;
  Combustivel: number;
  Lazer: number;
  Eventualidades: number;
  Outros: number;
  Total: number;
}

export interface DashboardMetrics {
  totalReceitas?: number;
  orcamentoTotal?: number;
  totalDespesas: number;
  saldo: number;
  totalExpectativa: number;
  totalRealidade: number;
  economiaRealizada: number;
  porCategoria: {
    categoriaId: string;
    categoriaNome: string;
    cor: string;
    total: number;
    expectativa: number;
    diferenca: number;
    percentual: number;
    estourou: boolean;
  }[];
  porSubcategoria: {
    subcategoriaId: string;
    subcategoriaNome: string;
    categoriaNome: string;
    total: number;
    expectativa: number;
    diferenca: number;
    estourou: boolean;
  }[];
  principaisEstabelecimentos: {
    nome: string;
    tipo: string;
    total: number;
    transacoesCount: number;
  }[];
  evolucaoMeses: {
    mes: string;
    mesNome: string;
    Supermercado: number;
    Lazer: number;
    Combustivel: number;
    Carro: number;
    Eventualidades: number;
    Total: number;
    Expectativa: number;
  }[];
  evolucaoSemanas?: WeeklyMetric[];
  categoriasEstouradas: {
    nome: string;
    categoria: string;
    limite: number;
    gasto: number;
    excesso: number;
  }[];
}

export interface ConsumedItemDetail {
  id: string;
  nome: string;
  categoriaKey: string;
  categoriaNome: string;
  categoriaCor: string;
  quantidadeTotal: number;
  unidade: string;
  valorTotal: number;
  precoMedio: number;
  frequenciaCompras: number;
  percentualDoTotal: number;
  estabelecimentos: string[];
  historicoMeses: {
    mes: string;
    mesNome: string;
    quantidade: number;
    valorTotal: number;
    precoMedio: number;
  }[];
  variacaoPrecoMoM: number;
}

export interface TrackedItemEvolution {
  itemKey: string;
  nome: string;
  unidade: string;
  categoria: string;
  historico: {
    mes: string;
    mesNome: string;
    quantidade: number;
    gastoTotal: number;
    precoMedio: number;
  }[];
  variacaoPrecoMoM: number;
}

export interface SupermarketCategoryBreakdown {
  key: string;
  nome: string;
  cor: string;
  total: number;
  percentual: number;
  itensCount: number;
  quantidadeTotal: number;
  unidadePredominante: string;
}

export interface MeatCutAnalysis {
  corte: string;
  tipoAnimal: 'Bovina' | 'Aves' | 'Suína';
  kgTotal: number;
  valorTotal: number;
  precoMedioKg: number;
  percentualDosCortes: number;
}

export interface MeatTypeBreakdown {
  tipo: string;
  kg: number;
  total: number;
  percentual: number;
  cor: string;
}

export interface MeatEvolutionMonth {
  mes: string;
  mesNome: string;
  kgCarne: number;
  gastoCarne: number;
  precoMedioKg: number;
  gastoSupermercadoTotal: number;
  percentualDoMercado: number;
}

export interface TopPurchasedItem {
  nome: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  valorTotal: number;
  precoMedio: number;
  frequenciaCompras: number;
}

export interface SupermarketAnalytics {
  selectedMonth: string;
  availableMonths: { mes: string; mesNome: string }[];
  summary: {
    totalGastoSupermercado: number;
    totalItensComprados: number;
    totalProdutosDistintos: number;
    ticketMedio: number;
    totalComprasCount: number;
    maiorDespesaItem: { nome: string; valor: number };
    totalKgCarne: number;
    totalGastoCarne: number;
    percentualCarne: number;
    precoMedioKgCarne: number;
  };
  todosItensConsumidos: ConsumedItemDetail[];
  categoriasConsumo: SupermarketCategoryBreakdown[];
  comparativoItensMesAMes: TrackedItemEvolution[];
  carnesAnalysis: {
    cortesMaisConsumidos: MeatCutAnalysis[];
    consumoPorTipoAnimal: MeatTypeBreakdown[];
    evolucaoCarneMeses: MeatEvolutionMonth[];
  };
  topProdutosMaisComprados: TopPurchasedItem[];
}
