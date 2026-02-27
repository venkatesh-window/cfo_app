const { createClient } = require('@libsql/client');
const client = createClient({ url: 'file:local.db' });

async function migrate() {
    await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone_or_email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    await client.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at DATETIME NOT NULL
    )
  `);

    await client.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      description TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      category TEXT NOT NULL DEFAULT 'Other',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    await client.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC)`);

    console.log('Migration complete');
}

migrate().catch(console.error);
