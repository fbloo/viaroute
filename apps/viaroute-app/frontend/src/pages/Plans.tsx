import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { plansApi, Plan } from '../services/api';
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
import { Textarea } from '../components/ui/textarea';

interface PlansPageProps {
  isAdmin?: boolean;
}

const PlansPage = ({ isAdmin = false }: PlansPageProps) => {
  const apiClient = useApi();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({ name: '', features: '{}' });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await plansApi.getAll(apiClient);
      setPlans(Array.isArray(response.data) ? response.data : [response.data]);
    } catch (error) {
      console.error('Error loading plans:', error);
      alert('Error loading plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await plansApi.update(apiClient, editingPlan.id, formData);
      } else {
        await plansApi.create(apiClient, formData);
      }
      setShowModal(false);
      setEditingPlan(null);
      setFormData({ name: '', features: '{}' });
      loadPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Error saving plan');
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({ name: plan.name, features: plan.features });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      await plansApi.delete(apiClient, id);
      loadPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Error deleting plan');
    }
  };

  if (loading) {
    return <div className="container mx-auto max-w-7xl px-5">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{isAdmin ? 'Plans' : 'My Plan'}</h1>
        {isAdmin && (
          <Button
            onClick={() => {
              setEditingPlan(null);
              setFormData({ name: '', features: '{}' });
              setShowModal(true);
            }}
          >
            Create Plan
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Tenant ID</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No plans found
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-mono text-sm">
                      {plan.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>{plan.name}</TableCell>
                    <TableCell className="font-mono text-xs max-w-xs truncate">
                      {plan.features}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {plan.tenant_id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {new Date(plan.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEdit(plan)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(plan.id)}
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
            <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
            <DialogDescription>
              {editingPlan
                ? 'Update the plan information below.'
                : 'Enter the details for the new plan.'}
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
              <div className="grid gap-2">
                <Label htmlFor="features">Features (JSON)</Label>
                <Textarea
                  id="features"
                  value={formData.features}
                  onChange={(e) =>
                    setFormData({ ...formData, features: e.target.value })
                  }
                  rows={4}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{editingPlan ? 'Update' : 'Create'}</Button>
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

export default PlansPage;
