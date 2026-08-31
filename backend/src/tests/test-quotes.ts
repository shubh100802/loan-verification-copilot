import fs from 'fs';
import path from 'path';

const filePath = path.resolve(__dirname, '../../../data/loan_tape.csv');
const content = fs.readFileSync(filePath, 'utf-8');

let quoteCount = 0;
const quotePositions: number[] = [];

for (let i = 0; i < content.length; i++) {
  if (content[i] === '"') {
    quoteCount++;
    quotePositions.push(i);
  }
}

console.log(`Total double quotes in file: ${quoteCount}`);
if (quoteCount % 2 !== 0) {
  console.log('WARNING: Unbalanced double quotes found!');
  // Find where the unbalanced quote might be
  let inQuotes = false;
  const lines = content.split('\n');
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      }
    }
    // If we end a line still inside quotes, print it
    if (inQuotes) {
      console.log(`Line ${idx + 1} ends inside quotes! Content: "${line}"`);
      break;
    }
  }
} else {
  console.log('All double quotes are balanced!');
}
