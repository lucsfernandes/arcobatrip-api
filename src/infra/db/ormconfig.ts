import { env } from '../../main/config/env';
import { DataSource } from "typeorm";
import * as path from 'path';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.TYPEORM_HOST,
  port: env.TYPEORM_PORT || 5433,
  username: env.TYPEORM_USERNAME,
  password: env.TYPEORM_PASSWORD,
  database: env.TYPEORM_DATABASE,
  entities: [path.join(__dirname, '../../domain/entities/**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '/migrations/*{.ts,.js}')],
  synchronize: env.TYPEORM_SYNC, // Evite true em produção
})

export default AppDataSource;