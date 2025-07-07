const XLSX = require('xlsx');
const fs = require('fs');

async function readRedditExcel() {
    try {
        console.log('📊 Reading Reddit threads from Excel file...');
        
        // Read the Excel file
        const workbook = XLSX.readFile('Cato - Existing Reddit Threads.xlsx');
        
        // Get all sheet names
        const sheetNames = workbook.SheetNames;
        console.log(`📋 Found ${sheetNames.length} sheets:`, sheetNames);
        
        let allThreads = [];
        
        // Process each sheet
        for (const sheetName of sheetNames) {
            console.log(`\n🔍 Processing sheet: ${sheetName}`);
            
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            console.log(`📊 Sheet has ${jsonData.length} rows`);
            
            // Find header row and identify columns
            let headerRowIndex = -1;
            let urlColumnIndex = -1;
            let titleColumnIndex = -1;
            let subredditColumnIndex = -1;
            
            // Look for headers in first few rows
            for (let i = 0; i < Math.min(5, jsonData.length); i++) {
                const row = jsonData[i];
                if (Array.isArray(row)) {
                    for (let j = 0; j < row.length; j++) {
                        const cell = String(row[j] || '').toLowerCase();
                        if (cell.includes('url') || cell.includes('link')) {
                            headerRowIndex = i;
                            urlColumnIndex = j;
                            console.log(`✅ Found URL column at row ${i}, column ${j}`);
                        }
                        if (cell.includes('title') || cell.includes('thread')) {
                            titleColumnIndex = j;
                        }
                        if (cell.includes('subreddit') || cell.includes('sub')) {
                            subredditColumnIndex = j;
                        }
                    }
                    if (headerRowIndex >= 0) break;
                }
            }
            
            // If no header found, scan for reddit.com URLs
            if (headerRowIndex === -1) {
                console.log('🔍 No header found, scanning for Reddit URLs...');
                for (let i = 0; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (Array.isArray(row)) {
                        for (let j = 0; j < row.length; j++) {
                            const cell = String(row[j] || '');
                            if (cell.includes('reddit.com')) {
                                headerRowIndex = i - 1; // Assume header is row before first data
                                urlColumnIndex = j;
                                console.log(`✅ Found Reddit URL pattern at row ${i}, column ${j}`);
                                break;
                            }
                        }
                        if (headerRowIndex >= 0) break;
                    }
                }
            }
            
            if (urlColumnIndex === -1) {
                console.log(`❌ No URL column found in sheet ${sheetName}`);
                continue;
            }
            
            // Extract data rows
            const dataStartRow = Math.max(0, headerRowIndex + 1);
            console.log(`📊 Processing data from row ${dataStartRow}`);
            
            for (let i = dataStartRow; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (Array.isArray(row) && row[urlColumnIndex]) {
                    const url = String(row[urlColumnIndex]).trim();
                    
                    // Only include valid Reddit URLs
                    if (url.includes('reddit.com') && url.startsWith('http')) {
                        const thread = {
                            url: url,
                            title: titleColumnIndex >= 0 ? String(row[titleColumnIndex] || '').trim() : '',
                            subreddit: subredditColumnIndex >= 0 ? String(row[subredditColumnIndex] || '').trim() : '',
                            sheet: sheetName,
                            row: i + 1
                        };
                        
                        // Extract subreddit from URL if not provided
                        if (!thread.subreddit) {
                            const match = url.match(/reddit\.com\/r\/([^\/]+)/);
                            if (match) {
                                thread.subreddit = match[1];
                            }
                        }
                        
                        allThreads.push(thread);
                    }
                }
            }
        }
        
        console.log(`\n✅ Total Reddit threads found: ${allThreads.length}`);
        
        // Group by subreddit for summary
        const subredditCounts = {};
        allThreads.forEach(thread => {
            const sub = thread.subreddit || 'unknown';
            subredditCounts[sub] = (subredditCounts[sub] || 0) + 1;
        });
        
        console.log('\n📊 Threads by subreddit:');
        Object.entries(subredditCounts)
            .sort(([,a], [,b]) => b - a)
            .forEach(([sub, count]) => {
                console.log(`  ${sub}: ${count} threads`);
            });
        
        // Save extracted data
        const outputData = {
            extractedAt: new Date().toISOString(),
            totalThreads: allThreads.length,
            subredditCounts,
            threads: allThreads
        };
        
        await fs.promises.writeFile(
            'extracted-reddit-threads.json',
            JSON.stringify(outputData, null, 2)
        );
        
        console.log('\n💾 Saved extracted data to: extracted-reddit-threads.json');
        
        return outputData;
        
    } catch (error) {
        console.error('❌ Error reading Excel file:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    readRedditExcel()
        .then(data => {
            console.log('\n🎉 Excel extraction completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Extraction failed:', error);
            process.exit(1);
        });
}

module.exports = { readRedditExcel }; 