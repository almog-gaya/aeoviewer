const XLSX = require('xlsx');
const path = require('path');

function inspectExcelStructure() {
  console.log('🔍 Inspecting Excel file structure...\n');
  
  const filePath = path.join(__dirname, '..', 'Cato - Existing Reddit Threads.xlsx');
  const workbook = XLSX.readFile(filePath);
  
  workbook.SheetNames.forEach(sheetName => {
    console.log(`📋 Sheet: ${sheetName}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    if (jsonData.length > 0) {
      console.log(`📊 Total rows: ${jsonData.length}`);
      console.log(`🔑 Column names:`, Object.keys(jsonData[0]));
      
      console.log('\n📝 Sample data (first 2 rows):');
      jsonData.slice(0, 2).forEach((row, index) => {
        console.log(`\n  Row ${index + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          const displayValue = typeof value === 'string' && value.length > 100 
            ? value.substring(0, 100) + '...' 
            : value;
          console.log(`    ${key}: ${displayValue}`);
        });
      });
    } else {
      console.log('📭 No data found in this sheet');
    }
    
    console.log('\n');
  });
}

inspectExcelStructure(); 