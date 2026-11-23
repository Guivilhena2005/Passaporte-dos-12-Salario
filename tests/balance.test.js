import test from 'node:test'; import assert from 'node:assert/strict'; import { toCents, distribute } from '../js/modules/salary/balance.js'; import { validatePlanning } from '../js/modules/salary/planning.js'; test('converte reais em centavos', () => assert.equal(toCents('123.45'), 12345)); test('distribui percentuais sugeridos', () => { const r = distribute(100000, [50, 20, 10, 10, 10]); assert.deepEqual(r.amounts, [50000, 20000, 10000, 10000, 10000]); assert.equal(r.difference, 0) }); test('impede confirmar percentuais incompletos', () => assert.equal(validatePlanning(10000, [40, 20, 10, 10, 10]).ok, false)); test('impede negativos', () => assert.throws(() => toCents(-1))); test('mostra excedente no rascunho', () => assert.equal(distribute(10000, [60, 20, 10, 10, 10]).difference, -1000));

test('distribui centavos residuais sem perder dinheiro', () => {
  for (let cents = 1; cents < 1000; cents++) {
    const r = distribute(cents, [50,20,10,10,10]);
    assert.equal(r.total,cents);
    assert.equal(r.difference,0);
    assert.ok(r.amounts.every(n=>Number.isSafeInteger(n)&&n>=0));
  }
});
test('distribui percentuais fracionários', () => assert.equal(distribute(12345,[33.33,33.33,11.12,11.11,11.11]).total,12345));
test('rejeita salário acima do limite monetário', () => assert.throws(()=>toCents(10000000000)));
