const { createClient } = require('@supabase/supabase-js');
const url = 'https://vqrednhdhmimyjkxpwyl.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcmVkbmhkaG1pbXlqa3hwd3lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzU0NDQwNSwiZXhwIjoyMDkzMTIwNDA1fQ.ryW2g36G3fAXIKw-w3VDmC-hXy5yzI3T9eCkawCHZtc';
const client = createClient(url, serviceKey);
(async () => {
  for (const table of ['notes', 'users']) {
    const { data, error } = await client
      .from('pg_table_def')
      .select('column, type')
      .eq('schema', 'public')
      .eq('table_name', table)
      .order('ordinal_position', { ascending: true });
    console.log('TABLE', table);
    if (error) {
      console.error('ERROR', error);
    } else {
      console.log(data);
    }
  }
})();
