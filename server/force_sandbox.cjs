const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/infaqly' });

async function setSandbox() {
  await pool.query("UPDATE settings SET value='sandbox' WHERE key='midtrans_env'");
  const res = await pool.query("SELECT * FROM settings WHERE key='midtrans_env'");
  console.log(res.rows);
  process.exit(0);
}

setSandbox().catch(err => { console.error(err); process.exit(1); });
