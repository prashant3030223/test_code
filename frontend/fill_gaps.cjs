const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gskygqcgunlbnajnrpnz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdza3lncWNndW5sYm5ham5ycG56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY4MjQ5OCwiZXhwIjoyMDgzMjU4NDk4fQ.lIJ2wIWzVWBrdPYxKq_0w6zYv_wMgtDOXR1Rwgg8C6I';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fillGaps() {
    console.log("Reading full list...");
    const rawArgs = fs.readFileSync('/Users/prashantyadav/Desktop/talent-IQ-master/frontend/leetcode_full_list.json', 'utf8');
    const fullData = JSON.parse(rawArgs);

    // Fetch existing IDs from Supabase
    console.log("Fetching existing problems from DB...");
    // We need to fetch all IDs. Since there are 3000, we might need pagination or just a big limit.
    // Actually we can just get all `id` (slugs).

    let existingSlugs = new Set();
    let from = 0;
    while (true) {
        const { data, error } = await supabase
            .from('problems')
            .select('id')
            .range(from, from + 999);

        if (error) throw error;
        if (!data || data.length === 0) break;
        data.forEach(d => existingSlugs.add(d.id));
        from += 1000;
    }
    console.log(`Found ${existingSlugs.size} existing problems.`);

    const toInsert = [];

    for (const item of fullData.stat_status_pairs) {
        const stat = item.stat;
        const slug = stat.question__title_slug;

        if (!existingSlugs.has(slug)) {
            const level = item.difficulty.level;
            const diffMap = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };

            toInsert.push({
                id: slug,
                title: stat.question__title,
                difficulty: diffMap[level] || 'Medium',
                category: 'Premium',
                companies: [],
                description: {
                    text: "This is a Premium problem. Upgrade to unlock full access.",
                    notes: ["Locked Content"]
                },
                examples: [],
                constraints: [],
                starter_code: {
                    javascript: "// Premium Problem",
                    python: "# Premium Problem"
                },
                expected_output: {},
                test_cases: [] // Empty for now
            });
        }
    }

    console.log(`Found ${toInsert.length} missing problems to insert.`);

    // Insert in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
        const batch = toInsert.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('problems').upsert(batch);
        if (error) console.error("Error inserting batch:", error.message);
        else console.log(`Inserted batch ${i} - ${i + BATCH_SIZE}`);
    }

    console.log("Gap filling complete.");
}

fillGaps();
