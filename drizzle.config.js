import 'dotenv/config';

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

export default {
  schema: './src/models/*.{js,ts}',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: DATABASE_URL,
  },
};