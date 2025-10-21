// Тест функции нормализации объема двигателя
// node test-engine-size.js

function normalizeEngineSize(size, vehicleType) {
  let sizeStr = String(size).toLowerCase().trim()
  
  // Replace comma with dot for decimal separator
  sizeStr = sizeStr.replace(',', '.')
  
  // Remove common suffixes and spaces
  sizeStr = sizeStr.replace(/cc|l|liters?|litres?|\s/g, '').trim()
  
  const sizeNum = parseFloat(sizeStr)
  
  if (vehicleType === 'motorcycle') {
    // For motorcycles: return CC as number only
    let ccValue
    
    // If it's a decimal (like 1.2, 0.6), assume it's in liters
    if (sizeNum > 0 && sizeNum < 10) {
      ccValue = Math.round(sizeNum * 1000)
    } else {
      ccValue = sizeNum
    }
    
    if (isNaN(ccValue) || ccValue < 50 || ccValue > 2500) {
      throw new Error(`Invalid motorcycle engine size. Expected: 50-2500cc or 0.05-2.5L. Got: "${size}"`)
    }
    
    return String(ccValue)
  } else {
    // For cars: return liters as decimal number only (no 'L' suffix)
    let literValue
    
    // If it's a large number (>10), assume it's in CC
    if (sizeNum >= 10) {
      literValue = sizeNum / 1000
    } else {
      literValue = sizeNum
    }
    
    if (isNaN(literValue) || literValue < 0.5 || literValue > 12) {
      throw new Error(`Invalid car engine size. Expected: 0.5-12.0L or 500-12000cc. Got: "${size}"`)
    }
    
    return literValue.toFixed(1)
  }
}

// Тестируем различные варианты
console.log('🧪 Тестирование нормализации объема двигателя:');
console.log('');

const testCases = [
  { input: '2.0L', type: 'car', expected: '2.0' },
  { input: '2,0L', type: 'car', expected: '2.0' },
  { input: '3.5L', type: 'car', expected: '3.5' },
  { input: '2000cc', type: 'car', expected: '2.0' },
  { input: '600cc', type: 'motorcycle', expected: '600' },
  { input: '1.2L', type: 'motorcycle', expected: '1200' },
  { input: '250', type: 'motorcycle', expected: '250' }
];

testCases.forEach(test => {
  try {
    const result = normalizeEngineSize(test.input, test.type);
    const status = result === test.expected ? '✅' : '❌';
    console.log(`${status} ${test.type}: "${test.input}" → "${result}" (expected: "${test.expected}")`);
  } catch (error) {
    console.log(`❌ ${test.type}: "${test.input}" → ERROR: ${error.message}`);
  }
});

console.log('');
console.log('🔍 Проверим конкретный случай из шаблона:');
try {
  const result = normalizeEngineSize('2.0L', 'car');
  console.log(`Результат для "2.0L" (car): "${result}"`);
} catch (error) {
  console.log(`Ошибка для "2.0L" (car): ${error.message}`);
}