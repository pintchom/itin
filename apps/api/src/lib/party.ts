import type { Party, PartyMember, PartyRole, User } from '@itin/db';

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
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      profileImageKey: string | null;
    };
  }>;
};

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export function toPartySummary(
  party: Party,
  viewerRole: PartyRole,
  memberCount: number
): PartySummary {
  return {
    id: party.id,
    title: party.title,
    startDate: isoDate(party.startDate),
    endDate: isoDate(party.endDate),
    coverImageKey: party.coverImageKey,
    timezone: party.timezone,
    role: viewerRole,
    memberCount,
  };
}

export function toPartyDetail(
  party: Party & {
    members: Array<
      PartyMember & {
        user: Pick<User, 'id' | 'firstName' | 'lastName' | 'profileImageKey'>;
      }
    >;
  },
  viewerRole: PartyRole
): PartyDetail {
  return {
    ...toPartySummary(party, viewerRole, party.members.length),
    createdById: party.createdById,
    members: party.members.map((m) => ({
      id: m.id,
      role: m.role,
      user: {
        id: m.user.id,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        profileImageKey: m.user.profileImageKey,
      },
    })),
  };
}
