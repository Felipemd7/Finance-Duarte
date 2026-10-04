// Regra central de "quem pagou": débito do Cartão conjunto Inter sai da conta do casal.
// O usuario_id continua gravado (o banco exige um usuário), mas a exibição e o rateio tratam como "Casal".
export const isConjointDebitPayment = (forma?: string): boolean => {
  const f = (forma || '').toLowerCase();
  return f.includes('inter') && /d[eé]bito/.test(f);
};

export const isCasalPayer = (tx: { formaPagamento?: string; forma_pagamento?: string }): boolean =>
  isConjointDebitPayment(tx.formaPagamento || tx.forma_pagamento);
