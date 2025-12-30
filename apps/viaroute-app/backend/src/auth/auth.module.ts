import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [
    PassportModule,
    UsersModule,
    TenantsModule,
    PlansModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const auth0Domain = configService.get<string>('AUTH0_DOMAIN');
        const jwtSecret = configService.get<string>('JWT_SECRET', 'your-secret-key');
        
        if (auth0Domain) {
          // Auth0 JWT verification
          // Note: For production, consider using jwks-rsa for proper JWKS validation
          return {
            secret: jwtSecret, // Fallback secret, actual validation happens in strategy
            verifyOptions: {
              audience: configService.get<string>('AUTH0_AUDIENCE'),
              issuer: `https://${auth0Domain}/`,
            },
          };
        }
        // Fallback to simple JWT secret
        return {
          secret: jwtSecret,
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, JwtAuthGuard, AdminGuard],
  exports: [JwtAuthGuard, AdminGuard],
})
export class AuthModule {}

