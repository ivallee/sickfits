import formatMoney from '../lib/formatMoney';

describe('formatMoney Function', () => {
  it('Works with fractional dollars', () => {
    expect(formatMoney(1)).toEqual('$0.01');
    expect(formatMoney(10)).toEqual('$0.10');
    expect(formatMoney(9)).toEqual('$0.09');
    expect(formatMoney(40)).toEqual('$0.40');
  });

  it('Omits cents for whole dollars', () => {
    expect(formatMoney(100)).toEqual('$1');
    expect(formatMoney(500)).toEqual('$5');
    expect(formatMoney(3700)).toEqual('$37');
    expect(formatMoney(15000)).toEqual('$150');
    expect(formatMoney(10000000)).toEqual('$100,000');
  });

  it('works with whole and fractional dollars', () => {
    expect(formatMoney(5037)).toEqual('$50.37');
    expect(formatMoney(101)).toEqual('$1.01');
    expect(formatMoney(255609)).toEqual('$2,556.09');
  });
});