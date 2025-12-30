export interface Database {
  tenants: TenantTable;
  users: UserTable;
  plans: PlanTable;
}

export interface TenantTable {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserTable {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  is_admin_user: boolean;
  auth0_sub: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PlanTable {
  id: string;
  tenant_id: string;
  name: string;
  features: string; // JSON string
  created_at: Date;
  updated_at: Date;
}

