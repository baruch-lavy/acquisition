import dotenv from 'dotenv';
dotenv.config();

import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';



const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

console.log('Connecting to database with URL:', dbUrl);


const client = neon(dbUrl, new neonConfig({ maxConnections: 10 }));

const db = drizzle(client);

export { client, db };