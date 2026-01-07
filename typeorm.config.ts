import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config();

const configService = new ConfigService();

export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: configService.get<string>('TYPEORM_HOST'),
    port: parseInt(configService.get<string>('TYPEORM_PORT') || '5432', 10),
    username: configService.get<string>('TYPEORM_USERNAME'),
    password: configService.get<string>('TYPEORM_PASSWORD'),
    database: configService.get<string>('TYPEORM_DATABASE'),

    // Agregamos || '' para solucionar el error visual de TypeScript
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/src/migrations/*{.ts,.js}'],

    synchronize: configService.get('TYPEORM_SYNCHRONIZE') === 'true',
    logging: configService.get('TYPEORM_LOGGING') === 'true',
    migrationsRun: configService.get('TYPEORM_MIGRATIONS_RUN') === 'true',
};

export default new DataSource(dataSourceOptions);