// Shared types between frontend and backend

export interface Tenant {
  id: string;
  name: string;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface Plan {
  id: string;
  tenant_id: string;
  name: string;
  features: string; // JSON string
  created_at: string | Date;
  updated_at: string | Date;
}

