import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, assertOk } from './api';

export type PartyRole = 'HOST' | 'MEMBER';

export type PartySummary = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  coverImageKey: string | null;
  timezone: string;
  role: PartyRole;
  memberCount: number;
};

export type PartyDetail = PartySummary & {
  createdById: string;
  members: Array<{
    id: string;
    role: PartyRole;
    user: { id: string; firstName: string | null; lastName: string | null };
  }>;
};

export type PartyCreateInput = {
  title: string;
  startDate: string;
  endDate: string;
  coverImageKey: string | null;
  timezone: string;
};

export type PartyUpdateInput = Partial<PartyCreateInput>;

const partiesKey = ['parties'] as const;
const partyKey = (id: string) => ['parties', id] as const;

export function useParties() {
  return useQuery({
    queryKey: partiesKey,
    queryFn: async () => {
      const res = await api.api.parties.$get();
      const data = await assertOk<{ parties: PartySummary[] }>(res);
      return data.parties;
    },
  });
}

export function useParty(id: string) {
  return useQuery({
    queryKey: partyKey(id),
    queryFn: async () => {
      const res = await api.api.parties[':id'].$get({ param: { id } });
      const data = await assertOk<{ party: PartyDetail }>(res);
      return data.party;
    },
  });
}

export function useCreateParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PartyCreateInput) => {
      const res = await api.api.parties.$post({ json: input });
      const data = await assertOk<{ party: PartyDetail }>(res);
      return data.party;
    },
    onSuccess: (party) => {
      qc.setQueryData(partyKey(party.id), party);
      qc.invalidateQueries({ queryKey: partiesKey });
    },
  });
}

export function useUpdateParty(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PartyUpdateInput) => {
      const res = await api.api.parties[':id'].$patch({
        param: { id },
        json: input,
      });
      const data = await assertOk<{ party: PartyDetail }>(res);
      return data.party;
    },
    onSuccess: (party) => {
      qc.setQueryData(partyKey(party.id), party);
      qc.invalidateQueries({ queryKey: partiesKey });
    },
  });
}
