const { createClient } = require('@supabase/supabase-js');
const url = 'https://vqrednhdhmimyjkxpwyl.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcmVkbmhkaG1pbXlqa3hwd3lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzU0NDQwNSwiZXhwIjoyMDkzMTIwNDA1fQ.ryW2g36G3fAXIKw-w3VDmC-hXy5yzI3T9eCkawCHZtc';
const client = createClient(url, serviceKey);
(async () => {
  const tests = ['is_pinned', 'color', 'tags', 'user_id', 'created_at', 'updated_at'];
  for (const col of tests) {
    const { data, error } = await client.from('notes').select(col).limit(1);
    console.log(col, 'error=', error ? error.message : 'none', 'data=', data);
  }
})();
