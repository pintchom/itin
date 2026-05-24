import { useQuery } from '@tanstack/react-query';

export type Activity = {
  id: string;
  partyId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  color: string | null;
  location: string | null;
};

const activitiesKey = (partyId: string, dateIso: string) =>
  ['activities', partyId, dateIso] as const;

export function useActivities(partyId: string, dateIso: string) {
  return useQuery({
    queryKey: activitiesKey(partyId, dateIso),
    queryFn: async (): Promise<Activity[]> => {
      // Activities API arrives in a future plan. Returning [] keeps the
      // calendar shell rendering against an empty data set.
      return [];
    },
    staleTime: 60_000,
  });
}
