import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'budget_user',
  password: process.env.DB_PASSWORD || 'budget_pass',
  database: process.env.DB_DATABASE || 'budget_db',
  synchronize:
    (process.env.DB_SYNCHRONIZE || '').toLowerCase() === 'true' ||
    (process.env.NODE_ENV || 'development') === 'development',
}));
