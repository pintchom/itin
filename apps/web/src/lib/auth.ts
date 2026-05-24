import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, api, assertOk } from './api';

export type SessionUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  profileImageKey: string | null;
};

const sessionKey = ['session'] as const;

export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: async () => {
      const res = await api.api.me.$get();
      const data = await assertOk<{ user: SessionUser | null }>(res);
      return data.user;
    },
    staleTime: 60_000,
    retry: (_count, err) => !(err instanceof ApiError && err.status === 401),
  });
}

export function useDevLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { firstName: string; lastName: string }) => {
      const res = await api.api['dev-login'].$post({ json: input });
      await assertOk<{ ok: true }>(res);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKey }),
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKey }),
  });
}
