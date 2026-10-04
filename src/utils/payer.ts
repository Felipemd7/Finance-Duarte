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

