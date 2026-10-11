// Taxonomia única de categorias/subcategorias do Casal Duarte.
// Usada tanto pelo frontend (supabaseService.ts) quanto pelo servidor
// (server/receiptAnalyzer.ts), para que a IA do scanner categorize com
// a MESMA granularidade usada no resto do app — e não apenas
// "Supermercado" ou "Combustível".

export interface SubcategoryTaxonomyEntry {
  id: string;
  nome: string;
  categoriaId: 'cat-invariavel' | 'cat-variavel' | 'cat-extra';
  categoriaNome: 'Invariável' | 'Variável' | 'Extra/Eventualidades';
  keywords: string[];
}

export const SUBCATEGORY_TAXONOMY: SubcategoryTaxonomyEntry[] = [
  { id: 'sub-aluguel', nome: 'Aluguel', categoriaId: 'cat-invariavel', categoriaNome: 'Invariável', keywords: ['aluguel'] },
  { id: 'sub-condominio', nome: 'Condomínio', categoriaId: 'cat-invariavel', categoriaNome: 'Invariável', keywords: ['condom'] },
  { id: 'sub-internet', nome: 'Internet / TV', categoriaId: 'cat-invariavel', categoriaNome: 'Invariável', keywords: ['internet', 'fibra'] },
  { id: 'sub-rastreador', nome: 'Rastreador', categoriaId: 'cat-invariavel', categoriaNome: 'Invariável', keywords: ['rastreador'] },
  { id: 'sub-seguro', nome: 'Seguro (Carro)', categoriaId: 'cat-invariavel', categoriaNome: 'Invariável', keywords: ['seguro'] },
  { id: 'sub-amazon-music', nome: 'Amazon Music', categoriaId: 'cat-invariavel', categoriaNome: 'Invariável', keywords: ['amazon music'] },
  { id: 'sub-youtube-premium', nome: 'Youtube Premium', categoriaId: 'cat-invariavel', categoriaNome: 'Invariável', keywords: ['youtube'] },
  { id: 'sub-placa-solar', nome: 'Placa Solar', categoriaId: 'cat-variavel', categoriaNome: 'Variável', keywords: ['placa solar', 'solar'] },
  { id: 'sub-estacionamento', nome: 'Estacionamento', categoriaId: 'cat-variavel', categoriaNome: 'Variável', keywords: ['estacionamento', 'estac', 'pedagio', 'pedágio', 'rotativo', 'shopping', 'valet'] },
  { id: 'sub-supermercado', nome: 'Supermercado', categoriaId: 'cat-variavel', categoriaNome: 'Variável', keywords: ['supermercado', 'feira', 'frigor', 'atacado', 'mercado', 'hortifruti'] },
  { id: 'sub-combustivel', nome: 'Combustível', categoriaId: 'cat-variavel', categoriaNome: 'Variável', keywords: ['combust', 'gasolina', 'etanol', 'diesel', 'posto'] },
  { id: 'sub-farmacia', nome: 'Farmácia', categoriaId: 'cat-variavel', categoriaNome: 'Variável', keywords: ['farm', 'medic', 'saúde', 'saude', 'remedio', 'exame', 'droga'] },
  { id: 'sub-lazer', nome: 'Lazer', categoriaId: 'cat-variavel', categoriaNome: 'Variável', keywords: ['lazer', 'restaurante', 'bar', 'jantar', 'lanchonete', 'cinema', 'pizzaria'] },
  { id: 'sub-luz', nome: 'Luz', categoriaId: 'cat-variavel', categoriaNome: 'Variável', keywords: ['luz', 'energia', 'eletrica', 'elétrica'] },
  { id: 'sub-agua', nome: 'Água', categoriaId: 'cat-variavel', categoriaNome: 'Variável', keywords: ['agua', 'água'] },
  { id: 'sub-gas', nome: 'Gás', categoriaId: 'cat-variavel', categoriaNome: 'Variável', keywords: ['gas', 'gás', 'botijao', 'botijão'] },
  { id: 'sub-uber', nome: 'Uber / Transporte', categoriaId: 'cat-variavel', categoriaNome: 'Variável', keywords: ['uber', 'transporte app', 'mobilidade'] },
  { id: 'sub-manutencao-carro', nome: 'Manutenção de carro', categoriaId: 'cat-extra', categoriaNome: 'Extra/Eventualidades', keywords: ['manutencao carro', 'oficina', 'autopeças', 'pneu', 'mecanica'] },
  { id: 'sub-ipva', nome: 'IPVA', categoriaId: 'cat-extra', categoriaNome: 'Extra/Eventualidades', keywords: ['ipva'] },
  { id: 'sub-eventualidades', nome: 'Eventualidades', categoriaId: 'cat-extra', categoriaNome: 'Extra/Eventualidades', keywords: ['eventualidade', 'eventual'] },
];

export function mapCategoryToId(cat?: string): string {
  if (cat === 'Invariável') return 'cat-invariavel';
  if (cat === 'Extra/Eventualidades') return 'cat-extra';
  return 'cat-variavel';
}

export function mapSubcategoryToId(nomeSub?: string, categoria?: string): string {
  const norm = (nomeSub || '').toLowerCase();
  for (const entry of SUBCATEGORY_TAXONOMY) {
    if (entry.keywords.some((kw) => norm.includes(kw))) return entry.id;
  }
  // Fallbacks por categoria quando nada bateu
  if (categoria === 'Invariável') return 'sub-internet';
  if (categoria === 'Extra/Eventualidades') return 'sub-eventualidades';
  return 'sub-supermercado';
}

export function subcategoryIdToName(id?: string): string {
  const found = SUBCATEGORY_TAXONOMY.find((s) => s.id === id);
  return found?.nome || (id || '').replace('sub-', '').replace(/-/g, ' ');
}

/** Dado um subcategoria_id (ex: "sub-farmacia"), devolve a categoria mãe ("Variável", etc.) */
export function categoryNameForSubcategoryId(subcategoriaId?: string): 'Invariável' | 'Variável' | 'Extra/Eventualidades' {
  const found = SUBCATEGORY_TAXONOMY.find((s) => s.id === subcategoriaId);
  return found?.categoriaNome || 'Variável';
}

// Bloco de texto injetado no prompt da IA do scanner, para que ela escolha
// diretamente dentro da taxonomia real do app em vez de inventar um
// "tipoEstabelecimento" livre que depois cai tudo em "Supermercado".
export function buildTaxonomyPromptBlock(): string {
  const lines = SUBCATEGORY_TAXONOMY.map(
    (s) => `- "${s.id}" (${s.nome}, categoria ${s.categoriaNome}): ${s.keywords.join(', ')}`
  );
  return `Escolha a subcategoria_id MAIS ESPECÍFICA dentre EXATAMENTE estas opções (nunca invente outra):\n${lines.join('\n')}`;
}
