// Test script to create proper Excel file for import
// Run in Node.js: node create-test-excel.js

const XLSX = require('xlsx');

// Create test data with correct values
const testData = [
  {
    vehicleType: 'INSTRUCTIONS: car or motorcycle',
    title: 'BRAND ONLY! Honda, Toyota, BMW',
    model: 'Model: Civic, Camry, X5',
    price: 'Price in USD: 15999',
    description: 'Vehicle description',
    transmission: 'manual or automatic',
    fuelType: 'gasoline, diesel, hybrid, electric',
    mileage: 'Mileage in miles: 45000',
    year: 'Year: 2020',
    engineSize: 'Cars: 2.0L, 3.5L | Motorcycles: 250cc, 600cc',
    state: 'State code: TX, CA, FL',
    city: 'City: Houston'
  },
  {
    vehicleType: 'car',
    title: 'Honda', // ТОЛЬКО МАРКУ!
    model: 'Civic',
    price: 15999,
    description: 'Clean title, well maintained, single owner',
    transmission: 'automatic', // lowercase
    fuelType: 'gasoline', // lowercase
    mileage: 45000,
    year: 2020,
    engineSize: '2,0L', // Test comma decimal separator
    state: 'TX',
    city: 'Houston'
  },
  {
    vehicleType: 'car',
    title: 'Toyota', // ТОЛЬКО МАРКУ!
    model: 'Camry',
    price: 22000,
    description: 'Excellent condition, low mileage',
    transmission: 'Automatic', // С заглавной - должно работать
    fuelType: 'Hybrid', // С заглавной - должно работать
    mileage: 25000,
    year: 2022,
    engineSize: '2.5', // Test without L suffix
    state: 'CA',
    city: 'Los Angeles'
  },
  {
    vehicleType: 'motorcycle',
    title: 'Yamaha', // ТОЛЬКО МАРКУ!
    model: 'YZF-R6',
    price: 8500,
    description: 'Sport bike, excellent condition',
    transmission: 'manual',
    fuelType: 'gasoline',
    mileage: 12000,
    year: 2019,
    engineSize: '600cc', // Test CC format
    state: 'FL',
    city: 'Miami'
  },
  {
    vehicleType: 'motorcycle',
    title: 'Harley-Davidson', // ТОЛЬКО МАРКУ!
    model: 'Street Glide',
    price: 18000,
    description: 'Touring motorcycle, well maintained',
    transmission: 'manual',
    fuelType: 'gasoline',
    mileage: 8500,
    year: 2021,
    engineSize: '1,7L', // Test comma + L for motorcycle (will convert to 1700cc)
    state: 'TX',
    city: 'Austin'
  }
];

// Создаем Excel файл
const ws = XLSX.utils.json_to_sheet(testData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Test Listings');

// Устанавливаем ширину колонок
ws['!cols'] = [
  { wch: 15 }, // vehicleType
  { wch: 30 }, // title
  { wch: 20 }, // model
  { wch: 15 }, // price
  { wch: 40 }, // description
  { wch: 15 }, // transmission
  { wch: 15 }, // fuelType
  { wch: 15 }, // mileage
  { wch: 10 }, // year
  { wch: 25 }, // engineSize
  { wch: 10 }, // state
  { wch: 15 }  // city
];

// Сохраняем файл
XLSX.writeFile(wb, 'test-carlynx-listings.xlsx');

console.log('✅ Test Excel file created: test-carlynx-listings.xlsx');
console.log('');
console.log('File contains:');
console.log('- Instructions (first row)');
console.log('- 2 cars with proper engine sizes in liters');
console.log('- 2 motorcycles with different engine size formats');
console.log('- Various transmission/fuelType formats (uppercase/lowercase)');
console.log('');
console.log('Use this file for testing import on carlynx.us');