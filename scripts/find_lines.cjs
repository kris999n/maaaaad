const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'App.tsx');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

console.log('Searching for "selectedRecipe" in App.tsx...');
lines.forEach((line, idx) => {
  if (line.includes('selectedRecipe') && (line.includes('modal') || line.includes('Modal') || line.includes('details') || line.includes('Overlay') || line.includes('&&'))) {
    console.log(`Line ${idx + 1}: ${line.trim().substring(0, 100)}`);
  }
});
