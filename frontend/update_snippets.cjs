const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gskygqcgunlbnajnrpnz.supabase.co';
// Service Role Key
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdza3lncWNndW5sYm5ham5ycG56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY4MjQ5OCwiZXhwIjoyMDgzMjU4NDk4fQ.lIJ2wIWzVWBrdPYxKq_0w6zYv_wMgtDOXR1Rwgg8C6I';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const problemsDir = '/Users/prashantyadav/Desktop/talent-IQ-master/problems';
    if (!fs.existsSync(problemsDir)) {
        console.error("Problems directory not found");
        process.exit(1);
    }
    const files = fs.readdirSync(problemsDir).filter(f => f.endsWith('.json'));

    console.log(`Processing ${files.length} files...`);

    const updates = [];

    for (const f of files) {
        const p = path.join(problemsDir, f);
        try {
            const content = JSON.parse(fs.readFileSync(p, 'utf8'));
            const slug = content.problem_slug || content.problem_id || f.replace('.json', '');

            if (content.code_snippets) {
                // Capture ALL snippets
                const starter_code = {};
                for (const [lang, code] of Object.entries(content.code_snippets)) {
                    starter_code[lang] = code;
                }
                // Ensure default python key
                if (starter_code.python3 && !starter_code.python) starter_code.python = starter_code.python3;

                updates.push({ id: slug, starter_code });
            }
        } catch (e) { }
    }

    console.log(`Updating ${updates.length} problems...`);

    let success = 0;
    let fail = 0;

    // Process in chunks of 10 concurrent requests
    const CHUNK_SIZE = 10;
    for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
        const batch = updates.slice(i, i + CHUNK_SIZE);
        await Promise.all(batch.map(async (item) => {
            // Update only the starter_code column for the specific ID
            const { error } = await supabase.from('problems').update({ starter_code: item.starter_code }).eq('id', item.id);
            if (error) {
                console.error(`Failed ${item.id}:`, error.message);
                fail++;
            } else {
                success++;
            }
        }));
        process.stdout.write('.');
    }

    console.log(`\nDone. Success: ${success}, Fail: ${fail}`);
}
run();
