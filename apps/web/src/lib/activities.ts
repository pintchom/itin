import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, assertOk } from './api';

export type ParticipantStatus = 'GOING' | 'NOT_GOING';

export type ActivityParticipant = {
  id: string;
  status: ParticipantStatus;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
};

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
  participants: ActivityParticipant[];
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

export function useRsvp(partyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      activityId,
      status,
    }: {
      activityId: string;
      status: ParticipantStatus;
    }) => {
      const res = await api.api.activities[':activityId'].rsvp.$post({
        param: { activityId },
        json: { status },
      });
      const data = await assertOk<{ participant: ActivityParticipant }>(res);
      return data.participant;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: activitiesKey(partyId) }),
  });
}

export function useClearRsvp(partyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (activityId: string) => {
      const res = await api.api.activities[':activityId'].rsvp.$delete({
        param: { activityId },
      });
      await assertOk<{ ok: true }>(res);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: activitiesKey(partyId) }),
  });
}
