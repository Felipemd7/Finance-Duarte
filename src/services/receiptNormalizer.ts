import { EstablishmentType } from '../types';

// Marcas de adquirentes / maquininhas de cartão que NÃO são o nome da loja
const CARD_TERMINAL_BRANDS = [
  'laranjinha',
  'itau',
  'itaú',
  'rede',
  'cielo',
  'stone',
  'pagseguro',
  'pagbank',
  'getnet',
  'safrapay',
  'safra pay',
  'vero',
  'moderninha',
  'minizinha',
  'bin',
  'ticket',
  'alelo',
  'sodexo',
  'vr beneficios',
  'pluxee',
  'visanet',
  'redecard',
];

// Diretório de CNPJs conhecidos e regras de estabelecimentos
interface KnownMerchant {
  nome: string;
  tipo: EstablishmentType;
  subcategoria: string;
  cidade?: string;
}

const KNOWN_CNPJS: Record<string, KnownMerchant> = {
  // Posto Martines em Floriano/PI
  '12070974000120': {
    nome: 'Posto Martines',
    tipo: 'Posto de combustível',
    subcategoria: 'Combustível',
    cidade: 'Floriano/PI',
  },
  '12.070.974/0001-20': {
    nome: 'Posto Martines',
    tipo: 'Posto de combustível',
    subcategoria: 'Combustível',
    cidade: 'Floriano/PI',
  },
};

export interface NormalizedReceiptOutput {
  estabelecimento: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  tipoEstabelecimento: EstablishmentType;
  subcategoriaSugerida: string;
  cnpj?: string;
  cidade?: string;
  litros?: number;
  kmAtual?: number;
  tipoCombustivel?: string;
  precoLitro?: number;
  itens: Array<{
    nome: string;
    categoriaItem?: string;
    subcategoriaSugerida?: string;
    quantidade: number;
    precoUnitario: number;
    precoTotal: number;
    desmembrado?: boolean;
    motivoDesmembramento?: string;
  }>;
}

function cleanCnpj(raw?: string): string {
  if (!raw) return '';
  return raw.replace(/\D/g, '');
}

export function isCardTerminalBrand(name?: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase().trim();
  return CARD_TERMINAL_BRANDS.some((brand) => lower === brand || lower.startsWith(`${brand} `));
}

export function normalizeReceiptData(data: any): NormalizedReceiptOutput {
  if (!data) {
    return {
      estabelecimento: 'Estabelecimento Identificado',
      tipoEstabelecimento: 'Supermercado',
      subcategoriaSugerida: 'Supermercado',
      itens: [],
    };
  }

  let estabelecimento = String(data.estabelecimento || data.nomeFantasia || data.razaoSocial || '').trim();
  const razaoSocial = String(data.razaoSocial || '').trim();
  const nomeFantasia = String(data.nomeFantasia || '').trim();
  const rawCnpj = String(data.cnpj || '').trim();
  const numericCnpj = cleanCnpj(rawCnpj);
  let cidade = String(data.cidade || data.endereco || '').trim();

  let tipoEstabelecimento: EstablishmentType = (data.tipoEstabelecimento as EstablishmentType) || 'Supermercado';
  let subcategoriaSugerida = String(data.subcategoriaSugerida || 'Supermercado');

  // 1. Checar CNPJ conhecido na base
  if (numericCnpj && KNOWN_CNPJS[numericCnpj]) {
    const known = KNOWN_CNPJS[numericCnpj];
    estabelecimento = known.nome;
    tipoEstabelecimento = known.tipo;
    subcategoriaSugerida = known.subcategoria;
    if (known.cidade) cidade = known.cidade;
  }

  // 2. Se o nome extraído for marca de maquininha de cartão (Ex: "laranjinha"), descartar e procurar alternativa
  if (isCardTerminalBrand(estabelecimento)) {
    if (nomeFantasia && !isCardTerminalBrand(nomeFantasia)) {
      estabelecimento = nomeFantasia;
    } else if (razaoSocial && !isCardTerminalBrand(razaoSocial)) {
      estabelecimento = razaoSocial;
    } else if (data.endereco && data.endereco.toLowerCase().includes('posto')) {
      estabelecimento = 'Posto de Combustível';
      tipoEstabelecimento = 'Posto de combustível';
      subcategoriaSugerida = 'Combustível';
    } else {
      estabelecimento = 'Posto / Estabelecimento Comercial';
    }
  }

  // 3. Inspeção de palavras-chave no nome do estabelecimento / Razão Social
  const fullTextName = `${estabelecimento} ${razaoSocial} ${nomeFantasia}`.toLowerCase();

  if (
    fullTextName.includes('posto') ||
    fullTextName.includes('combust') ||
    fullTextName.includes('auto posto') ||
    fullTextName.includes('petrobras') ||
    fullTextName.includes('ipiranga') ||
    fullTextName.includes('shell') ||
    fullTextName.includes('martines')
  ) {
    tipoEstabelecimento = 'Posto de combustível';
    subcategoriaSugerida = 'Combustível';
    if (fullTextName.includes('martines')) {
      estabelecimento = 'Posto Martines';
    }
  } else if (
    fullTextName.includes('shopping') ||
    fullTextName.includes('estacionamento') ||
    fullTextName.includes('rot. extern') ||
    fullTextName.includes('estac') ||
    fullTextName.includes('indigo') ||
    fullTextName.includes('estapar')
  ) {
    tipoEstabelecimento = 'Estacionamento';
    subcategoriaSugerida = 'Estacionamento';
    if (fullTextName.includes('teresina') || fullTextName.includes('rio poty')) {
      estabelecimento = 'Shopping Rio Poty - Estacionamento';
    }
  } else if (
    fullTextName.includes('farm') ||
    fullTextName.includes('droga') ||
    fullTextName.includes('pague menos') ||
    fullTextName.includes('drogasil') ||
    fullTextName.includes('pacheco')
  ) {
    tipoEstabelecimento = 'Farmácia';
    subcategoriaSugerida = 'Farmácia';
    if (fullTextName.includes('pague menos')) {
      estabelecimento = 'Farmácia Pague Menos';
    }
  } else if (
    fullTextName.includes('pinheiro e regadas') ||
    fullTextName.includes('restaurante') ||
    fullTextName.includes('lanchonete') ||
    fullTextName.includes('burger') ||
    fullTextName.includes('pizzaria') ||
    fullTextName.includes('cafe') ||
    fullTextName.includes('café') ||
    fullTextName.includes('bar e lanches')
  ) {
    tipoEstabelecimento = 'Restaurante/Lazer';
    subcategoriaSugerida = 'Lazer';
    if (fullTextName.includes('pinheiro e regadas')) {
      estabelecimento = 'Pinheiro e Regadas (Lanchonete)';
    }
  } else if (
    fullTextName.includes('pedagio') ||
    fullTextName.includes('pedágio') ||
    fullTextName.includes('via 040') ||
    fullTextName.includes('concessionaria')
  ) {
    tipoEstabelecimento = 'Estacionamento';
    subcategoriaSugerida = 'Estacionamento';
  }

  // 4. Analisar itens para refinar a categoria se ainda houver dúvida
  const rawItems = Array.isArray(data.itens) ? data.itens : [];
  const normalizedItems = rawItems.map((it: any) => {
    const itemName = String(it.nome || '').trim();
    const itemLower = itemName.toLowerCase();
    let cat = it.categoriaItem || '';
    let sub = it.subcategoriaSugerida || '';
    let desmembrado = !!it.desmembrado;
    let motivo = it.motivoDesmembramento || '';

    // Detecção de Estacionamento nos itens
    if (
      itemLower.includes('rot. extern') ||
      itemLower.includes('estacionamento') ||
      itemLower.includes('rotativo') ||
      itemLower.includes('ticket estac')
    ) {
      tipoEstabelecimento = 'Estacionamento';
      subcategoriaSugerida = 'Estacionamento';
      cat = 'Estacionamento & Transporte';
      sub = 'Estacionamento';
    }

    // Detecção de Combustível nos itens
    if (
      itemLower.includes('gasolina') ||
      itemLower.includes('etanol') ||
      itemLower.includes('diesel') ||
      itemLower.includes('aditivada') ||
      itemLower.includes('abastecimento') ||
      itemLower.includes('bico ')
    ) {
      tipoEstabelecimento = 'Posto de combustível';
      subcategoriaSugerida = 'Combustível';
      cat = 'Combustível';
      sub = 'Combustível';
    }

    // Detecção de Lanches / Restaurante nos itens
    if (
      itemLower.includes('batata palito') ||
      itemLower.includes('maionese') ||
      itemLower.includes('hamburguer') ||
      itemLower.includes('lanche') ||
      itemLower.includes('refeicao') ||
      itemLower.includes('pastel')
    ) {
      if (tipoEstabelecimento === 'Supermercado' && !fullTextName.includes('mercado') && !fullTextName.includes('atacadao')) {
        tipoEstabelecimento = 'Restaurante/Lazer';
        subcategoriaSugerida = 'Lazer';
        cat = 'Alimentação Fora & Lazer';
        sub = 'Lazer';
      }
    }

    // Detecção de Remédios
    if (
      itemLower.includes('luftal') ||
      itemLower.includes('luftagastro') ||
      itemLower.includes('dipirona') ||
      itemLower.includes('paracetamol') ||
      itemLower.includes('dorflex') ||
      itemLower.includes('comprimido') ||
      itemLower.includes('capsula') ||
      itemLower.includes('xarope')
    ) {
      if (tipoEstabelecimento === 'Supermercado') {
        desmembrado = true;
        motivo = 'Item de saúde/medicamento desmembrado para Farmácia';
      } else {
        tipoEstabelecimento = 'Farmácia';
        subcategoriaSugerida = 'Farmácia';
      }
      cat = 'Remédios & Farmácia';
      sub = 'Farmácia';
    }

    return {
      nome: itemName || 'Item do Comprovante',
      categoriaItem: cat || (tipoEstabelecimento === 'Farmácia' ? 'Saúde / Farmácia' : tipoEstabelecimento === 'Posto de combustível' ? 'Combustível' : 'Supermercado'),
      subcategoriaSugerida: sub || subcategoriaSugerida,
      quantidade: Number(it.quantidade) || 1,
      precoUnitario: Number(it.precoUnitario) || Number(it.precoTotal) || 0,
      precoTotal: Number(it.precoTotal) || 0,
      desmembrado,
      motivoDesmembramento: motivo || undefined,
    };
  });

  // Extrair telemetria veicular se for posto de combustível
  let litros: number | undefined = data.litros ? Number(data.litros) : undefined;
  let kmAtual: number | undefined = data.km || data.kmAtual ? Number(data.km || data.kmAtual) : undefined;
  let tipoCombustivel: string | undefined = data.tipoCombustivel || data.combustivel;
  let precoLitro: number | undefined = data.precoPorLitro || data.precoLitro ? Number(data.precoPorLitro || data.precoLitro) : undefined;

  if (tipoEstabelecimento === 'Posto de combustível') {
    const fuelItem = normalizedItems.find((it) => {
      const lower = it.nome.toLowerCase();
      return lower.includes('gasolina') || lower.includes('etanol') || lower.includes('diesel') || lower.includes('combustivel') || lower.includes('abastecimento');
    });

    if (fuelItem) {
      if (!litros && fuelItem.quantidade > 0 && fuelItem.quantidade !== 1) {
        litros = Number(fuelItem.quantidade.toFixed(2));
      }
      if (!precoLitro && fuelItem.precoUnitario > 0) {
        precoLitro = Number(fuelItem.precoUnitario.toFixed(2));
      }
      if (!tipoCombustivel) {
        const itemLower = fuelItem.nome.toLowerCase();
        if (itemLower.includes('aditivada')) tipoCombustivel = 'Gasolina Aditivada';
        else if (itemLower.includes('etanol')) tipoCombustivel = 'Etanol';
        else if (itemLower.includes('diesel')) tipoCombustivel = 'Diesel';
        else tipoCombustivel = 'Gasolina Comum';
      }
    }

    const valorTotal = Number(data.valorTotal) || 0;
    if (!precoLitro) precoLitro = 5.85;
    if (!litros && valorTotal > 0 && precoLitro > 0) {
      litros = Number((valorTotal / precoLitro).toFixed(2));
    }
    if (!tipoCombustivel) tipoCombustivel = 'Gasolina Comum';
  }

  return {
    estabelecimento: estabelecimento || 'Estabelecimento Identificado',
    razaoSocial: razaoSocial || undefined,
    nomeFantasia: nomeFantasia || undefined,
    tipoEstabelecimento,
    subcategoriaSugerida,
    cnpj: rawCnpj || undefined,
    cidade: cidade || undefined,
    litros,
    kmAtual,
    tipoCombustivel,
    precoLitro,
    itens: normalizedItems,
  };
}
