import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => {
  // Prefer internal Railway domain for better connectivity
  const internalHost = process.env.PGHOST || process.env.RAILWAY_PRIVATE_DOMAIN;
  const host = internalHost || process.env.DATABASE_HOST || 'localhost';
  
  // Use internal port (5432) when using internal host
  const port = internalHost 
    ? 5432 
    : parseInt(process.env.DATABASE_PORT || '5432', 10);
  
  return {
    host,
    port,
    username: process.env.DATABASE_USERNAME || process.env.PGUSER || 'handwork',
    password: process.env.DATABASE_PASSWORD || process.env.POSTGRES_PASSWORD || '',
    name: process.env.DATABASE_NAME || process.env.PGDATABASE || 'handwork_db',
    ssl: process.env.DATABASE_SSL === 'true',
  };
});
