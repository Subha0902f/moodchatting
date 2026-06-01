const { createClient } = require('@supabase/supabase-js');
const url = 'https://vqrednhdhmimyjkxpwyl.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcmVkbmhkaG1pbXlqa3hwd3lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzU0NDQwNSwiZXhwIjoyMDkzMTIwNDA1fQ.ryW2g36G3fAXIKw-w3VDmC-hXy5yzI3T9eCkawCHZtc';
const client = createClient(url, serviceKey);
(async () => {
  try {
    const email = `ui-test-${Date.now()}@example.com`;
    const password = 'Test1234!';
    console.log('Creating user', email);
    const { data, error } = await client.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) {
      console.error('Create user error', error);
      process.exit(1);
    }
    console.log('Created user id', data.user.id);
    const anonClient = createClient(url, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcmVkbmhkaG1pbXlqa3hwd3lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NDQ0MDUsImV4cCI6MjA5MzEyMDQwNX0.kddceHa5osWq59WqbepWivxIhbZ8K2eV5KkQkcIuUX0');
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({ email, password });
    console.log('Sign in response', authError, authData);
    if (authError) process.exit(1);
    const token = authData.session?.access_token;
    console.log('access token', token ? token.slice(0,40) : 'none');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
