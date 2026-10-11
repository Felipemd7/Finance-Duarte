// Regra central de "quem pagou": débito do Cartão conjunto Inter sai da conta do casal.
// O usuario_id continua gravado (o banco exige um usuário), mas a exibição e o rateio tratam como "Casal".
export const isConjointDebitPayment = (forma?: string, obs?: string): boolean => {
  const f = `${forma || ''} ${obs || ''}`.toLowerCase();
  const hasDebit = /d[eé]bito/.test(f);
  const isInter = f.includes('inter');
  const isConjunto = f.includes('conjunt');
  return hasDebit && (isInter || isConjunto);
};

export const isCasalPayer = (tx: {
  formaPagamento?: string;
  forma_pagamento?: string;
  pagoPor?: string;
  observacoes?: string;
}): boolean => {
  const pag = (tx.pagoPor || '').toLowerCase();
  if (pag.includes('casal') || pag.includes('conjunt')) return true;
  return isConjointDebitPayment(tx.formaPagamento || tx.forma_pagamento, tx.observacoes);
};

// Identifica se uma forma de pagamento é cartão de crédito (fatura futura, não desembolso imediato).
// Fonte única — antes duplicada em MonthlyBudgetSpreadsheetPanel.tsx.
export const isCreditCardPayment = (forma?: string, obs?: string): boolean => {
  const str = `${forma || ''} ${obs || ''}`.toLowerCase();
  // Débito (inclusive 'Cartão conjunto Inter - Débito') nunca é crédito
  if (str.includes('debito') || str.includes('débito')) return false;
  if (str.includes('credito') || str.includes('crédito')) return true;
  if (str.includes('cartao') && !str.includes('debito') && !str.includes('débito')) return true;
  if (str.includes('fatura') || str.includes('nubank') || str.includes('inter')) return true;
  return false;
};

// Identifica se foi pago à vista (PIX, Débito ou Dinheiro) — desembolso imediato.
export const isImmediatePayment = (forma?: string, obs?: string): boolean => {
  const str = `${forma || ''} ${obs || ''}`.toLowerCase();
  if (str.includes('pix')) return true;
  if (str.includes('debito') || str.includes('débito')) return true;
  if (str.includes('dinheiro') || str.includes('especie') || str.includes('espécie')) return true;
  if (str.includes('transferencia') || str.includes('transferência') || str.includes('ted') || str.includes('doc')) return true;
  return false;
};

