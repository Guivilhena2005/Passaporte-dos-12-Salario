export function toCents(value) {
  const n = Number(value);
  const cents = Math.round((n + Number.EPSILON) * 100);
  if (!Number.isFinite(n) || n < 0 || !Number.isSafeInteger(cents) || cents > 999999999999) throw new RangeError('Valor inválido');
  return cents;
}
export function distribute(cents, percents) {
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > 999999999999) throw new RangeError('Salário inválido');
  if (!Array.isArray(percents) || percents.length !== 5 || percents.some(p => !Number.isFinite(p) || p < 0 || p > 100)) throw new RangeError('Percentuais inválidos');
  const percentTotal = percents.reduce((a,b) => a+b, 0);
  const raw = percents.map(p => cents*p/100);
  let amounts = raw.map(Math.round);
  if (Math.abs(percentTotal - 100) <= 1e-9) {
    amounts = raw.map(Math.floor);
    const order = raw.map((v,i) => ({i, fraction:v-amounts[i]})).sort((a,b) => b.fraction-a.fraction || a.i-b.i);
    const remaining = cents - amounts.reduce((a,b) => a+b,0);
    for (let i=0; i<remaining; i++) amounts[order[i % 5].i]++;
  }
  const total = amounts.reduce((a,b) => a+b,0);
  return {amounts,total,difference:cents-total,percentTotal};
}
export function formatBRL(cents){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100)}
