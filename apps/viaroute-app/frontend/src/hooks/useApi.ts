import { useAuth0 } from '@auth0/auth0-react';
import { createAuthenticatedClient } from '../services/api';
import { useMemo } from 'react';

export const useApi = () => {
  const { getAccessTokenSilently } = useAuth0();

  const apiClient = useMemo(() => {
    return createAuthenticatedClient(getAccessTokenSilently);
  }, [getAccessTokenSilently]);

  return apiClient;
};

