import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AuthUsersModule } from './auth-users/auth-users.module';
import { User as AuthUser } from './auth-users/user.entity';
import { RolesModule } from './roles/roles.module';
import { SessionsModule } from './sessions/sessions.module';
import { UsersModule } from './users/users.module';
import { ImportsModule } from './imports/imports.module';

const enablePersistence = process.env.NODE_ENV !== 'test' && Boolean(process.env.DATABASE_URL);
const persistenceImports = enablePersistence
  ? [TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.getOrThrow<string>('DATABASE_URL'),
        entities: [AuthUser],
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: config.get('RUN_MIGRATIONS') === 'true',
        synchronize: false,
        autoLoadEntities: true,
      }),
    })]
  : [];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ...persistenceImports,
    AuthUsersModule,
    AuthModule,
    SessionsModule,
    RolesModule,
    UsersModule,
    ImportsModule,
  ],
})
export class AppModule {}
