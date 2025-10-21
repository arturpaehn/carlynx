// Тест разделения объема двигателя на целую и дробную части
// node test-engine-split.js

function splitEngineSize(engineSizeStr, vehicleType) {
  let engineSizeWhole = ''
  let engineSizeDecimal = ''
  
  if (engineSizeStr && vehicleType === 'car') {
    const engineFloat = parseFloat(engineSizeStr)
    if (!isNaN(engineFloat)) {
      engineSizeWhole = Math.floor(engineFloat).toString()
      const decimal = engineFloat - Math.floor(engineFloat)
      // Always set decimal part, even if it's 0 (for 2.0 → whole="2", decimal="0")
      engineSizeDecimal = Math.round(decimal * 10).toString()
    }
  }
  
  return { engineSizeWhole, engineSizeDecimal }
}

console.log('🧪 Тестирование разделения объема двигателя:');
console.log('');

const testCases = [
  { input: '2.0', type: 'car', expected: { whole: '2', decimal: '0' } },
  { input: '2.5', type: 'car', expected: { whole: '2', decimal: '5' } },
  { input: '3.2', type: 'car', expected: { whole: '3', decimal: '2' } },
  { input: '600', type: 'motorcycle', expected: { whole: '', decimal: '' } }, // motorcycles don't use whole/decimal
  { input: '1200', type: 'motorcycle', expected: { whole: '', decimal: '' } },
  { input: '1.7', type: 'car', expected: { whole: '1', decimal: '7' } }
];

testCases.forEach(test => {
  const result = splitEngineSize(test.input, test.type);
  const wholeMatch = result.engineSizeWhole === test.expected.whole;
  const decimalMatch = result.engineSizeDecimal === test.expected.decimal;
  const status = wholeMatch && decimalMatch ? '✅' : '❌';
  
  console.log(`${status} ${test.type}: "${test.input}" → whole: "${result.engineSizeWhole}", decimal: "${result.engineSizeDecimal}"`);
  console.log(`    Expected: whole: "${test.expected.whole}", decimal: "${test.expected.decimal}"`);
  console.log('');
});

console.log('🔍 Полный пример для "2.0L" (автомобиль):');
console.log('1. "2.0L" → нормализация → "2.0"');
const split = splitEngineSize('2.0', 'car');
console.log(`2. "2.0" → разделение → engineSizeWhole: "${split.engineSizeWhole}", engineSizeDecimal: "${split.engineSizeDecimal}"`);
console.log('3. В форме: поле 1 = "2", поле 2 = "0" → 2.0L');
console.log('');
console.log('✅ Теперь в форме должны заполниться оба поля для автомобилей!');