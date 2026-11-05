/**
 * Data export and import utilities supporting CSV and Excel (SpreadsheetML / XML).
 * Zero heavy external dependencies, pure browser-native and Excel-compatible.
 */

export function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateCSV(headers: string[], rows: (string | number)[][]): string {
  // \uFEFF is UTF-8 Byte Order Mark for Excel compatibility
  const escapeCell = (val: string | number) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map((r) => r.map(escapeCell).join(',')).join('\n');
  return '\uFEFF' + headerLine + '\n' + rowLines;
}

export function generateExcelXML(sheetName: string, headers: string[], rows: (string | number)[][]): string {
  const clean = (val: string | number) =>
    String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const headerCells = headers
    .map((h) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${clean(h)}</Data></Cell>`)
    .join('');

  const rowCells = rows
    .map((r) => {
      const cells = r
        .map((cell) => {
          const isNum = typeof cell === 'number' && !isNaN(cell);
          const type = isNum ? 'Number' : 'String';
          return `<Cell><Data ss:Type="${type}">${clean(cell)}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#2563EB" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${clean(sheetName)}">
  <Table>
   <Row>${headerCells}</Row>
   ${rowCells}
  </Table>
 </Worksheet>
</Workbook>`;
}

export function parseCSV(csvText: string): { headers: string[]; rows: string[][] } {
  // Strip BOM if present
  const text = csvText.startsWith('\uFEFF') ? csvText.slice(1) : csvText;
  if (!text.trim()) return { headers: [], rows: [] };

  // Auto-detect delimiter: semicolon ';' (Indonesian/European Excel) or comma ','
  const firstLine = text.split(/\r\n|\r|\n/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';

  const lines: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(cell.trim());
      if (row.some((c) => c !== '')) lines.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell.trim());
    if (row.some((c) => c !== '')) lines.push(row);
  }

  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0];
  const dataRows = lines.slice(1);
  return { headers, rows: dataRows };
}

