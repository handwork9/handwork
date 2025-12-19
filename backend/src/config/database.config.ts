import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'handwork',
  password: process.env.DATABASE_PASSWORD || '',
  name: process.env.DATABASE_NAME || 'handwork_db',
  ssl: process.env.DATABASE_SSL === 'true',
}));
