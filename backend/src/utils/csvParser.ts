/**
 * Parses raw CSV content into an array of string arrays, adhering to RFC-4180.
 * Handles double quotes, nested commas, and variable carriage returns.
 */
export function parseCsv(content: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentValue = '';

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        i++; // Skip next double quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentValue.trim());
      currentValue = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // Skip \n on CRLF windows breaks
      }
      row.push(currentValue.trim());
      result.push(row);
      row = [];
      currentValue = '';
    } else {
      currentValue += char;
    }
  }

  // Handle final lingering row if content doesn't end with a trailing newline
  if (currentValue || row.length > 0) {
    row.push(currentValue.trim());
    result.push(row);
  }

  return result.filter((r) => r.length > 0 && r.some((cell) => cell !== ''));
}
