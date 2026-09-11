export type CategoryType = 'Invariável' | 'Variável' | 'Extra/Eventualidades' | 'Receita';

export type PaymentMethod =
  | 'Cartão de Crédito'
  | 'Cartão de Crédito NuBank'
  | 'Débito'
  | 'Débito em Conta'
  | 'PIX'
  | 'Dinheiro'
  | 'Boleto'
  | 'Boleto Bancário'
  | string;

export type TransactionStatus = 'pago' | 'previsto';

export type UserRole = 'Guilherme' | 'Mariana' | 'Casal';

export interface User {
  id: string;
  nome: string;
  email: string;
  avatar: string;
  cor: string;
  dataCriacao: string;
}

export interface PurchaseItem {
  id: string;
  nome: string;
  categoriaItem: 'Alimentos' | 'Bebidas' | 'Limpeza' | 'Higiene' | 'Remédio' | 'Pet' | 'Outros';
  subcategoriaSugerida?: string;
  subcategoriaReal?: string;
  quantidade: number;
  precoUnitario: number;
  precoTotal: number;
  desmembrado?: boolean;
  motivoDesmembramento?: string;
}

export interface PartnerSplit {
  tipo?: string;
  porcentagemGuilherme?: number;
  porcentagemMariana?: number;
  valorGuilherme?: number;
  valorMariana?: number;
  valorCasal?: number;
}

export interface Transaction {
  id: string;
  usuarioId?: string; // 'casal'
  data: string; // YYYY-MM-DD
  mesReferencia?: string; // ex: '2026-03'
  valor: number;
  tipo: 'despesa' | 'receita';
  categoria: CategoryType;
  subcategoria: string;
  estabelecimento: string;
  formaPagamento: PaymentMethod;
  status: TransactionStatus;
  pagoPor?: string;
  observacoes?: string;
  divisaoCasal?: PartnerSplit;
  comprovanteId?: string;
  itens?: PurchaseItem[];
  itensDetalhados?: PurchaseItem[];
}

export interface Receipt {
  id: string;
  transacaoId?: string;
  data: string;
  estabelecimento: string;
  tipoEstabelecimento: 'Supermercado' | 'Farmácia' | 'Posto de combustível' | 'Oficina' | 'Outros';
  numeroCupom?: string;
  valorTotal: number;
  status: 'Conciliado' | 'Pendente Vinculação' | 'Processando';
  itens: PurchaseItem[];
  imagemUrl?: string;
  dadosBrutos?: string;
  divisaoCasal?: {
    porcentagemGuilherme?: number;
    porcentagemMariana?: number;
    valorGuilherme?: number;
    valorMariana?: number;
  };
}

export interface FinancialGoal {
  id: string;
  usuarioId?: string;
  titulo: string;
  tipo?: 'teto_gasto' | 'economia_poupanca';
  tipoMeta?: 'gasto' | 'economia';
  periodo: 'mensal' | 'anual' | 'semanal';
  categoria?: CategoryType;
  subcategoria?: string;
  valorAlvo?: number;
  valorPlanejado?: number;
  valorAtual: number;
  descricao?: string;
  alertaPercentual?: number; // default 85%
  isCarro?: boolean;
  corDestaque?: string;
}

export interface ShoppingListItem {
  id: string;
  estabelecimentoTipo: 'Supermercado' | 'Farmácia' | 'Outros';
  estabelecimentoNome?: string;
  nome: string;
  quantidade?: string;
  categoriaItem: 'Alimentos' | 'Bebidas' | 'Limpeza' | 'Higiene' | 'Remédio' | 'Pet' | 'Outros';
  comprado: boolean;
  adicionadoPor: 'Guilherme' | 'Mariana' | 'Alexa' | 'Siri';
  dataAdicao: string;
  precoEstimado?: number;
  reconciliadoCupomId?: string;
}

export interface SpreadsheetRow {
  id: string;
  mes: string; // 'Janeiro 2026', 'Fevereiro 2026', etc.
  categoria: CategoryType;
  descricao: string; // Subcategoria ou detalhe (ex: 'Aluguel', 'Supermercado')
  situacao: 'Pago' | 'A Pagar' | 'Previsto';
  expectativa: number;
  realidade: number;
  diferenca: number; // expectativa - realidade
  observacoes: string;
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
  pagoPor?: 'Guilherme' | 'Mariana' | 'Casal';
  formaPagamento?: string;
  comprovanteUrl?: string; // Imagem do comprovante / cupom fiscal
  comprovanteNome?: string;
  observacoes?: string;
  origem?: 'manual' | 'comprovante_ia';
}
