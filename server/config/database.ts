import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@shared/schema';

let sql: postgres.Sql | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!sql) {
    sql = postgres(process.env.DATABASE_URL, {
      max: 10, // connection pool size
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
      ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
      connection: {
        application_name: 'portfolio-risk-app'
      },
      onnotice: () => {}, // suppress notices
      onparameter: () => {}, // suppress parameter status messages
    });
  }

  if (!db) {
    db = drizzle(sql, { schema });
  }

  return { sql, db };
}

// Graceful shutdown
export async function closeDatabaseConnection() {
  if (sql) {
    await sql.end({ timeout: 5 });
    sql = null;
    db = null;
  }
}