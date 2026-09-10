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
