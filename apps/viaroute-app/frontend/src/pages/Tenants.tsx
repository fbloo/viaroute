import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { tenantsApi, Tenant } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

interface TenantsPageProps {
  isAdmin?: boolean;
}

const TenantsPage = ({ isAdmin = false }: TenantsPageProps) => {
  const apiClient = useApi();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const response = await tenantsApi.getAll(apiClient);
      const data = Array.isArray(response.data) ? response.data : [response.data];
      setTenants(data);
    } catch (error) {
      console.error('Error loading tenants:', error);
      alert('Error loading tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTenant) {
        await tenantsApi.update(apiClient, editingTenant.id, formData);
      } else {
        await tenantsApi.create(apiClient, formData);
      }
      setShowModal(false);
      setEditingTenant(null);
      setFormData({ name: '' });
      loadTenants();
    } catch (error) {
      console.error('Error saving tenant:', error);
      alert('Error saving tenant');
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({ name: tenant.name });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tenant?')) return;
    try {
      await tenantsApi.delete(apiClient, id);
      loadTenants();
    } catch (error) {
      console.error('Error deleting tenant:', error);
      alert('Error deleting tenant');
    }
  };

  if (loading) {
    return <div className="container mx-auto max-w-7xl px-5">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{isAdmin ? 'Tenants' : 'My Tenant'}</h1>
        {isAdmin && (
          <Button
            onClick={() => {
              setEditingTenant(null);
              setFormData({ name: '' });
              setShowModal(true);
            }}
          >
            Create Tenant
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No tenants found
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-mono text-sm">
                      {tenant.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>{tenant.name}</TableCell>
                    <TableCell>
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEdit(tenant)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(tenant.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                      {!isAdmin && (
                        <span className="text-sm text-muted-foreground">Read-only</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTenant ? 'Edit Tenant' : 'Create Tenant'}
            </DialogTitle>
            <DialogDescription>
              {editingTenant
                ? 'Update the tenant information below.'
                : 'Enter the details for the new tenant.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{editingTenant ? 'Update' : 'Create'}</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantsPage;
