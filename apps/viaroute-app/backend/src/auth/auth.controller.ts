import {
    BadRequestException,
    Controller,
    Logger,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlansService } from '../plans/plans.service';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    private readonly plansService: PlansService,
    private readonly configService: ConfigService,
  ) {}

  @Post('callback')
  @UseGuards(JwtAuthGuard)
  async callback(@Request() req: any) {
    const auth0Sub = req.user?.userId || req.user?.sub;

    if (!auth0Sub) {
      this.logger.error('Missing auth0 sub in token', { 
        availableKeys: Object.keys(req.user || {}),
        userObject: req.user 
      });
      throw new BadRequestException('Missing required user information from token: sub/userId is required');
    }

    // Check if user exists by auth0_sub first
    let user = await this.usersService.findByAuth0Sub(auth0Sub);
    
    // If user exists, return user info (we already have their email in the database)
    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        tenant_id: user.tenant_id,
        isAdminUser: user.is_admin_user,
      };
    }

    // User doesn't exist - we need to fetch email from Auth0 userinfo endpoint
    // Extract access token from request headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new BadRequestException('Missing or invalid authorization header');
    }
    
    const accessToken = authHeader.substring(7);
    const auth0Domain = this.configService.get<string>('AUTH0_DOMAIN');
    
    if (!auth0Domain) {
      throw new BadRequestException('AUTH0_DOMAIN not configured');
    }

    // Fetch user info from Auth0
    let email: string;
    let name: string;
    
    try {
      const userinfoUrl = `https://${auth0Domain}/userinfo`;
      const response = await fetch(userinfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.error('Failed to fetch userinfo from Auth0', {
          status: response.status,
          statusText: response.statusText,
        });
        throw new BadRequestException('Failed to fetch user information from Auth0');
      }

      const userinfo = await response.json();
      email = userinfo.email;
      name = userinfo.name || userinfo.nickname || email?.split('@')[0] || 'User';

      if (!email) {
        throw new BadRequestException('Email not found in Auth0 userinfo response');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error fetching userinfo from Auth0', error);
      throw new BadRequestException('Failed to fetch user information from Auth0');
    }

    // Check if user exists by email (in case auth0_sub wasn't set but email matches)
    user = await this.usersService.findByEmail(email);
    if (user) {
      // Update existing user with auth0_sub if missing
      if (!user.auth0_sub) {
        // Note: You might want to add an update method that allows updating auth0_sub
        this.logger.warn('User exists but missing auth0_sub', { userId: user.id, email });
      }
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        tenant_id: user.tenant_id,
        isAdminUser: user.is_admin_user,
      };
    }

    // Create new user, tenant, and plan
    // 1. Create tenant
    const tenantName = email.split('@')[1] || `${name}'s Organization`;
    const tenant = await this.tenantsService.create({ name: tenantName });

    // 2. Create user
    const newUser = await this.usersService.create(
      {
        tenant_id: tenant.id,
        email,
        name,
      },
      auth0Sub,
    );

    // 3. Create trial plan
    await this.plansService.create({
      tenant_id: tenant.id,
      name: 'trial',
      features: JSON.stringify({ trial: true, features: [] }),
    });

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      tenant_id: newUser.tenant_id,
      isAdminUser: newUser.is_admin_user,
    };
  }
}

