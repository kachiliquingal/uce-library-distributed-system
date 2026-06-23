import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { LoanEntity } from './loan.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'secret',
  database: process.env.DB_NAME || 'loan_db',
  synchronize: true, // Auto-create tables (good for dev/QA)
  logging: false,
  entities: [LoanEntity],
  migrations: [],
  subscribers: [],
});
