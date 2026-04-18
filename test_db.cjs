const { Pool } = require('pg');
const p = new Pool({ connectionString: 'postgresql://postgres:infaqly@localhost:5432/infaqly' });
p.query("SELECT * FROM settings WHERE key='midtrans_env'")
  .then(r => { console.log("DB Env is:", r.rows); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
