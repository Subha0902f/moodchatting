const { createClient } = require('@supabase/supabase-js');
const url = 'https://vqrednhdhmimyjkxpwyl.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcmVkbmhkaG1pbXlqa3hwd3lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzU0NDQwNSwiZXhwIjoyMDkzMTIwNDA1fQ.ryW2g36G3fAXIKw-w3VDmC-hXy5yzI3T9eCkawCHZtc';
const client = createClient(url, serviceKey);
const token = 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImEyYmMwNzA2LWI2MzEtNDYwNC05NjQyLTAwM2ZiMzY1NTFlNCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3ZxcmVkbmhkaG1pbXlqa3hwd3lsLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIyMTFmOGE0NC0wYTY0LTRjMGMtOGNlNC1kMWU1MDc2MDU3YWQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzgwMjEwNTE3LCJpYXQiOjE3ODAyMDY5MTcsImVtYWlsIjoidWktdGVzdC0xNzgwMjA2OTAwMTM1QGV4YW1wbGUuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3ODAyMDY5MTd9XSwic2Vzc2lvbl9pZCI6IjA4MmNjM2M5LWJhY2UtNDBhZC05OTFkLWI3NjdmNTI4NTVjOCIsImlzX2Fub255bW91cyI6ZmFsc2V9.A6vgvAh0_MJn96_9ENj5e_De-V2jUIl9x2JmVA-ktUAeEp43GpNU5RXnPjzS9htoxFxIFsBPAh0hONPs86TEmA';
(async () => {
  try {
    const { data, error } = await client.auth.getUser(token);
    console.log('getUser error', error);
    console.log('getUser data', data);
    const authUser = data.user;
    const userRow = {
      id: authUser.id,
      email: authUser.email,
      full_name: (authUser.user_metadata?.full_name) || (authUser.user_metadata?.name) || (authUser.user_metadata?.username) || null,
      role: 'user',
      avatar_url: (authUser.user_metadata?.avatar_url) || null,
      updated_at: new Date().toISOString(),
    };
    const { data: upsertData, error: upsertError } = await client
      .from('users')
      .upsert(userRow, { onConflict: 'id' })
      .select('id, email, full_name, role, avatar_url, created_at, updated_at')
      .single();
    console.log('upsertError', upsertError);
    console.log('upsertData', upsertData);
  } catch (err) {
    console.error('caught', err);
  }
})();
