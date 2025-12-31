import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => {
  // Use external Railway proxy by default - internal domain may not work during deploys
  const host = process.env.DATABASE_HOST || 'localhost';
  const port = parseInt(process.env.DATABASE_PORT || '5432', 10);
  
  return {
    host,
    port,
    username: process.env.DATABASE_USERNAME || 'handwork',
    password: process.env.DATABASE_PASSWORD || '',
    name: process.env.DATABASE_NAME || 'handwork_db',
    ssl: process.env.DATABASE_SSL === 'true',
  };
});
