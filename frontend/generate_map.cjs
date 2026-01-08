const fs = require('fs');
const path = require('path');

const LIST_FILE = '/Users/prashantyadav/Desktop/talent-IQ-master/frontend/leetcode_full_list.json';
const OUT_FILE = '/Users/prashantyadav/Desktop/talent-IQ-master/frontend/src/data/problemMap.js';

function generateMapping() {
    const rawData = fs.readFileSync(LIST_FILE, 'utf8');
    const fullData = JSON.parse(rawData);
    const mapping = {};

    fullData.stat_status_pairs.forEach(item => {
        const slug = item.stat.question__title_slug;
        const id = item.stat.frontend_question_id;
        if (slug && id) {
            mapping[slug] = id;
        }
    });

    const fileContent = `export const PROBLEM_ID_MAP = ${JSON.stringify(mapping, null, 2)};`;

    fs.writeFileSync(OUT_FILE, fileContent);
    console.log(`Generated mapping for ${Object.keys(mapping).length} problems from full list.`);
}

generateMapping();
