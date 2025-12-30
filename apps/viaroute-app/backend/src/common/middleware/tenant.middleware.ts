import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract tenant ID from JWT token (set by AuthGuard) or header
    const tenantId = (req as any).user?.tenant_id || req.headers['x-tenant-id'] as string;
    
    if (tenantId) {
      (req as any).tenantId = tenantId;
    }
    
    next();
  }
}

