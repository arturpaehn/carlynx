const fs = require('fs');
const path = require('path');

function fixMissingSemicolonsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let fixed = false;
  
  // Исправляем строки, где return стоит в конце без точки с запятой
  const updatedContent = content.replace(/(\s+)return(\s*)$/gm, (match, indent, spacing) => {
    fixed = true;
    return `${indent}return;`;
  });
  
  if (fixed) {
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`Fixed missing semicolons in: ${filePath}`);
    return true;
  }
  
  return false;
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(filePath, callback);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      callback(filePath);
    }
  });
}

console.log('Starting semicolon fix...');
let fixedFiles = 0;

walkDir('./src', (filePath) => {
  if (fixMissingSemicolonsInFile(filePath)) {
    fixedFiles++;
  }
});

console.log(`Fixed ${fixedFiles} files with missing semicolons.`);