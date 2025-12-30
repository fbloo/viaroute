import { useAuth0 } from '@auth0/auth0-react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import TenantsPage from './pages/Tenants';
import UsersPage from './pages/Users';
import PlansPage from './pages/Plans';
import { useApi } from './hooks/useApi';
import { authApi, AuthCallbackResponse } from './services/api';
import { Button } from './components/ui/button';

function App() {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();
  const apiClient = useApi();
  const [currentUser, setCurrentUser] = useState<AuthCallbackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      // Call auth callback to ensure user exists in database
      // The apiClient will automatically add the Auth0 token to the request
      authApi
        .callback(apiClient)
        .then((response) => {
          setCurrentUser(response.data);
          setError(null);
          setLoading(false);
        })
        .catch((err: any) => {
          console.error('Error calling auth callback:', err);
          const errorMessage = err.response?.data?.message || err.message || 'Failed to authenticate';
          setError(errorMessage);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, apiClient]);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto max-w-4xl px-5 py-24 text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to ViaRoute</h1>
        <p className="text-muted-foreground mb-6">Please log in to continue</p>
        <Button onClick={() => loginWithRedirect()}>
          Log In
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-5 py-24 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl px-5 py-24 text-center">
        <h1 className="text-2xl font-bold mb-4 text-destructive">Authentication Error</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => {
          setError(null);
          setLoading(true);
          window.location.reload();
        }}>
          Retry
        </Button>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto max-w-4xl px-5 py-24 text-center">
        <p>Loading user data...</p>
      </div>
    );
  }

  const isAdmin = currentUser.isAdminUser;

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <nav className="border-b bg-background">
          <div className="container mx-auto max-w-7xl px-5">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-6">
                <Link to="/" className="text-xl font-bold text-primary">ViaRoute</Link>
                {isAdmin ? (
                  <>
                    <Link to="/tenants" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Tenants</Link>
                    <Link to="/users" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Users</Link>
                    <Link to="/plans" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Plans</Link>
                  </>
                ) : (
                  <>
                    <Link to="/tenants" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">My Tenant</Link>
                    <Link to="/users" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">My Team</Link>
                    <Link to="/plans" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">My Plan</Link>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{user?.email}</span>
                <Button variant="secondary" onClick={() => logout()}>
                  Log Out
                </Button>
              </div>
            </div>
          </div>
        </nav>

        <div className="container mx-auto max-w-7xl px-5 py-6">
          <Routes>
            <Route path="/" element={<div><h1 className="text-3xl font-bold mb-2">Dashboard</h1><p className="text-muted-foreground">Select a section from the navigation</p></div>} />
            <Route path="/tenants" element={<TenantsPage isAdmin={isAdmin} />} />
            <Route path="/users" element={<UsersPage isAdmin={isAdmin} />} />
            <Route path="/plans" element={<PlansPage isAdmin={isAdmin} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

