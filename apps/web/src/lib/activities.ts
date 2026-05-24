import { useQuery } from '@tanstack/react-query';
import { api, assertOk } from './api';

export type Activity = {
  id: string;
  partyId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  color: string | null;
  location: string | null;
  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
};

const activitiesKey = (partyId: string) => ['activities', partyId] as const;

export function useActivities(partyId: string) {
  return useQuery({
    queryKey: activitiesKey(partyId),
    queryFn: async (): Promise<Activity[]> => {
      const res = await api.api.parties[':partyId'].activities.$get({
        param: { partyId },
      });
      const data = await assertOk<{ activities: Activity[] }>(res);
      return data.activities;
    },
    staleTime: 60_000,
  });
}
