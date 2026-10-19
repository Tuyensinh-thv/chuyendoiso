const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=([^\r\n]+)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=([^\r\n]+)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseKey = keyMatch ? keyMatch[1].trim() : '';

console.log('Querying Supabase URL:', supabaseUrl);

async function check() {
  const resp = await fetch(`${supabaseUrl}/rest/v1/tasks?select=id,nhom_ke_hoach,ten_nhiem_vu,don_vi_chu_tri&limit=100`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });

  if (!resp.ok) {
    console.error('Error:', resp.status, await resp.text());
    return;
  }

  const tasks = await resp.json();
  console.log('Total tasks in Supabase table:', tasks.length);
  const nhoms = [...new Set(tasks.map(t => t.nhom_ke_hoach))];
  console.log('Current plan groups (nhom_ke_hoach):', nhoms);
  tasks.slice(0, 5).forEach(t => console.log(`- [${t.id}] [${t.nhom_ke_hoach}] ${t.ten_nhiem_vu.slice(0, 50)}... (${t.don_vi_chu_tri})`));

  // Also check plan_groups table
  const pResp = await fetch(`${supabaseUrl}/rest/v1/plan_groups?select=*`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  if (pResp.ok) {
    const pGroups = await pResp.json();
    console.log('Current plan_groups table rows:', pGroups);
  }
}

check().catch(console.error);
