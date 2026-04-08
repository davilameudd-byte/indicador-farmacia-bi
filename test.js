const fs = require('fs');
const content = fs.readFileSync('C:/Users/Saude/.gemini/antigravity/brain/1cbd7fc9-ef67-4e4f-8573-7315df4acf35/.system_generated/steps/92/content.md', 'utf-8');

// extract the json part
const jsonStr = content.substring(content.indexOf('{', content.indexOf('processGoogleData_0')), content.lastIndexOf('}') + 1);
const json = JSON.parse(jsonStr);

let consolidatedIndicators = {};
let allDatesSet = new Set();

function parseMatrixData(table) {
    if(table.rows.length < 2) return;
    
    let dateRowIndex = 0;
    let dateHeaders = {}; 
    
    for(let r=0; r<table.rows.length; r++) {
        let foundDates = 0;
        let potentialDates = {};
        for(let c=3; c<table.cols.length; c++) {
            const cell = table.rows[r].c[c];
            // Fix: convert cell.f to string before matching
            if(cell && cell.f && String(cell.f).match(/^\d{2}\/\d{2}/)) {
                foundDates++;
                potentialDates[c] = String(cell.f);
            }
        }
        if(foundDates > 5) {
            dateRowIndex = r;
            dateHeaders = potentialDates;
            break;
        }
    }

    console.log("Found date headers:", dateHeaders, "at row", dateRowIndex);

    for(let r=dateRowIndex+1; r<table.rows.length; r++) {
        const row = table.rows[r];
        if(!row || !row.c || !row.c[1] || !row.c[1].v) continue;
        
        let indName = String(row.c[1].v).trim();
        if(indName.length === 0) continue;

        if(!consolidatedIndicators[indName]) {
            consolidatedIndicators[indName] = { total: 0, byDate: {} };
        }

        for(let c in dateHeaders) {
            const dateStr = dateHeaders[c];
            allDatesSet.add(dateStr);
            
            const cell = row.c[c];
            if(cell && cell.v !== null && cell.v !== undefined) {
                let value = parseFloat(cell.v) || 0;
                consolidatedIndicators[indName].total += value;
                consolidatedIndicators[indName].byDate[dateStr] = (consolidatedIndicators[indName].byDate[dateStr] || 0) + value;
            }
        }
    }
}

try {
    parseMatrixData(json.table);
    console.log("Indicators processed:", Object.keys(consolidatedIndicators).length);
    console.log("Dates accumulated:", allDatesSet.size);
    // test chart sort logic
    const allSortedKeys = Object.keys(consolidatedIndicators).sort((a,b) => consolidatedIndicators[b].total - consolidatedIndicators[a].total);
    const topKeys = allSortedKeys.slice(0, 20);
    console.log("Top Keys:", topKeys);
} catch(e) {
    console.error("Crash during parse:", e);
}
