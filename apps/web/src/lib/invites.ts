import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, assertOk } from './api';

export type InvitePreview = {
  party: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    coverImageKey: string | null;
  };
};

export function useCreateInvite(partyId: string) {
  return useMutation({
    mutationFn: async (input?: { expiresInDays?: number }) => {
      const res = await api.api.parties[':id'].invites.$post({
        param: { id: partyId },
        json: input ?? {},
      });
      const data = await assertOk<{ token: string; expiresAt: string | null }>(res);
      return data;
    },
  });
}

export function useInvitePreview(token: string | undefined) {
  return useQuery({
    queryKey: ['invite', token],
    enabled: !!token,
    queryFn: async () => {
      if (!token) throw new Error('No token');
      const res = await api.api.invites[':token'].$get({ param: { token } });
      return assertOk<InvitePreview>(res);
    },
  });
}

export function useClaimInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      const res = await api.api.invites[':token'].claim.$post({ param: { token } });
      const data = await assertOk<{ partyId: string }>(res);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parties'] }),
  });
}

export function buildInviteUrl(token: string) {
  return `${window.location.origin}/join/${token}`;
}

const PENDING_KEY = 'itin.pendingInvite';

export const pendingInvite = {
  set(token: string) {
    try {
      sessionStorage.setItem(PENDING_KEY, token);
    } catch {}
  },
  read(): string | null {
    try {
      return sessionStorage.getItem(PENDING_KEY);
    } catch {
      return null;
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(PENDING_KEY);
    } catch {}
  },
};
