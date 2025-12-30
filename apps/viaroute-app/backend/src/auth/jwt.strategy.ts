import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const auth0Domain = configService.get<string>('AUTH0_DOMAIN');
    const jwtSecret = configService.get<string>('JWT_SECRET', 'your-secret-key');
    
    const strategyOptions: any = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
    };

    if (auth0Domain) {
      // Use JWKS for Auth0 token validation
      strategyOptions.secretOrKeyProvider = passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${auth0Domain}/.well-known/jwks.json`,
      });
      strategyOptions.audience = configService.get<string>('AUTH0_AUDIENCE');
      strategyOptions.issuer = `https://${auth0Domain}/`;
      strategyOptions.algorithms = ['RS256'];
    } else {
      // Use simple JWT secret for non-Auth0 tokens
      strategyOptions.secretOrKey = jwtSecret;
    }
    
    super(strategyOptions);
  }

  async validate(payload: any) {
    console.log(JSON.stringify(payload, null, 2));
    if (!payload) {
      throw new UnauthorizedException('Invalid token payload');
    }
    
    const auth0Sub = payload.sub;
    const email = payload.email;
    
    // Look up user in database by auth0_sub or email
    let user = null;
    if (auth0Sub) {
      user = await this.usersService.findByAuth0Sub(auth0Sub);
    }
    if (!user && email) {
      user = await this.usersService.findByEmail(email);
    }
    
    // If user exists, attach full user object to request
    if (user) {
      return {
        userId: payload.sub,
        email: user.email,
        name: user.name,
        tenant_id: user.tenant_id,
        isAdminUser: user.is_admin_user,
        user: user, // Full user object for guards
        ...payload,
      };
    }
    
    // If user doesn't exist yet, still allow token (will be created on callback)
    // Extract tenant_id from Auth0 custom claim or token as fallback
    const auth0Domain = this.configService.get<string>('AUTH0_DOMAIN');
    const tenantIdClaim = auth0Domain 
      ? `https://${auth0Domain}/tenant_id`
      : 'tenant_id';
    
    return {
      userId: payload.sub,
      email: payload.email,
      tenant_id: payload[tenantIdClaim] || payload.tenant_id || null,
      isAdminUser: false,
      ...payload,
    };
  }
}

