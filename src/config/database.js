import dotenv from 'dotenv';
dotenv.config();

import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';



const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

const isProduction = process.env.NODE_ENV === 'production';
const isNeonLocal = process.env.NEON_LOCAL === 'true';
if (!isProduction && isNeonLocal) {
  const neonLocalHost = process.env.NEON_LOCAL_HOST || 'neon-local';
  const neonLocalPort = process.env.NEON_LOCAL_PORT || '5432';

  neonConfig.fetchEndpoint = `http://${neonLocalHost}:${neonLocalPort}/sql`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

const client = neon(dbUrl);
const db = drizzle(client);

export { client, db };
