// Brazilian Real currency formatter
export function formatBRL(value: number): string {
  if (isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Clean number parser from currency strings
export function parseBRL(valueStr: string): number {
  if (!valueStr) return 0;
  const clean = valueStr
    .replace(/[R$\s.]/g, '')
    .replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

// Format date to Brazilian standard
export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  // If already formatted as "04 Mar 2026, 18:42"
  if (dateStr.includes('Mar') || dateStr.includes('Fev') || dateStr.includes('Jan')) {
    return dateStr;
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTimeBR(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getMonthName(mesAno: string): string {
  if (!mesAno) return '';
  const meses: Record<string, string> = {
    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
    '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
    '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
  };
  const parts = mesAno.split('-');
  if (parts.length === 2 && meses[parts[1]]) {
    return `${meses[parts[1]]} de ${parts[0]}`;
  }
  return mesAno;
}

// Retorna o mês e ano corrente por extenso (ex: "Setembro 2026")
export function getCurrentMonthName(): string {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const now = new Date();
  const mes = meses[now.getMonth()];
  const ano = now.getFullYear();
  return `${mes} ${ano}`;
}

// Retorna o código do mês e ano corrente (ex: "2026-09")
export function getCurrentMonthCode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}


