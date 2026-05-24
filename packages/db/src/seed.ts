// Local dev seed script: fills the most recently created party with fake
// members and a variety of activities so the calendar UI has something to render.
//
// Run from the repo root:    bun db:seed
// Or:                        cd packages/db && bun run seed

import type { User } from '@prisma/client';
import { prisma } from './index.ts';

const ONE_HOUR = 60 * 60 * 1000;
const SEED_EMAIL_DOMAIN = 'seed.itin.local';

const FAKE_PEOPLE: Array<{ firstName: string; lastName: string }> = [
  { firstName: 'Alice', lastName: 'Park' },
  { firstName: 'Ben', lastName: 'Chen' },
  { firstName: 'Carmen', lastName: 'Lopez' },
  { firstName: 'Daniel', lastName: 'Schwartz' },
  { firstName: 'Elena', lastName: 'Rossi' },
  { firstName: 'Fatima', lastName: 'Khan' },
  { firstName: 'Gabriel', lastName: 'Mueller' },
  { firstName: 'Hana', lastName: 'Suzuki' },
  { firstName: 'Ivan', lastName: 'Petrov' },
  { firstName: 'Julia', lastName: 'Andersson' },
  { firstName: 'Karim', lastName: 'Hassan' },
  { firstName: 'Liam', lastName: 'OSullivan' },
];

type Template = {
  // Days into the trip the activity starts (0-indexed against the party startDate).
  dayOffset: number;
  // Local-time start, e.g. "09:00".
  start: string;
  // Duration in minutes.
  durationMin: number;
  title: string;
  location?: string;
  color?: string;
};

const TEMPLATES: Template[] = [
  // Day 0
  {
    dayOffset: 0,
    start: '08:30',
    durationMin: 60,
    title: 'Airport pickup',
    location: 'SJO Terminal 2',
    color: '#7aa2ff',
  },
  {
    dayOffset: 0,
    start: '12:00',
    durationMin: 90,
    title: 'Welcome lunch',
    location: 'Casa del Mar',
    color: '#f59e0b',
  },
  {
    dayOffset: 0,
    start: '15:00',
    durationMin: 120,
    title: 'Beach walk',
    location: 'Playa Hermosa',
  },
  {
    dayOffset: 0,
    start: '19:30',
    durationMin: 90,
    title: 'Group dinner',
    location: "Lola's",
    color: '#22c55e',
  },

  // Day 1 — busy day with overlaps
  {
    dayOffset: 1,
    start: '07:00',
    durationMin: 60,
    title: 'Sunrise yoga',
    location: 'Hotel lawn',
    color: '#a78bfa',
  },
  {
    dayOffset: 1,
    start: '09:00',
    durationMin: 180,
    title: 'Surf lessons',
    location: 'Playa Hermosa',
    color: '#06b6d4',
  },
  {
    dayOffset: 1,
    start: '10:30',
    durationMin: 60,
    title: 'Coffee tasting (optional)',
    location: 'Cafe Milagro',
    color: '#f97316',
  },
  { dayOffset: 1, start: '13:00', durationMin: 60, title: 'Lunch break' },
  {
    dayOffset: 1,
    start: '16:00',
    durationMin: 120,
    title: 'Catamaran tour',
    location: 'Quepos Marina',
    color: '#3b82f6',
  },
  { dayOffset: 1, start: '20:00', durationMin: 90, title: 'Bonfire' },

  // Day 2
  {
    dayOffset: 2,
    start: '06:00',
    durationMin: 240,
    title: 'Manuel Antonio hike',
    location: 'National Park',
    color: '#22c55e',
  },
  { dayOffset: 2, start: '13:30', durationMin: 90, title: 'Late lunch', location: 'El Avion' },
  {
    dayOffset: 2,
    start: '18:00',
    durationMin: 60,
    title: 'Sunset cocktails',
    location: 'Hotel rooftop',
    color: '#f43f5e',
  },

  // Day 4 — sparse
  {
    dayOffset: 4,
    start: '10:00',
    durationMin: 180,
    title: 'Zipline & waterfall',
    location: 'Vista Los Sueños',
    color: '#06b6d4',
  },
  {
    dayOffset: 4,
    start: '19:00',
    durationMin: 120,
    title: 'Farewell dinner',
    location: 'Casa del Mar',
    color: '#f59e0b',
  },

  // Day 6 — overlapping activities at the same time
  { dayOffset: 6, start: '11:00', durationMin: 120, title: 'Pottery class', color: '#a78bfa' },
  { dayOffset: 6, start: '11:00', durationMin: 90, title: 'Pickleball (alt)' },
];

const parseLocalTime = (baseUtcMidnight: Date, hhmm: string, tz: string): Date => {
  const [h, m] = hhmm.split(':').map(Number);
  if (h === undefined || m === undefined) throw new Error(`Bad time: ${hhmm}`);
  const utcGuess = new Date(baseUtcMidnight.getTime() + h * ONE_HOUR + m * 60_000);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    timeZoneName: 'shortOffset',
  }).formatToParts(utcGuess);
  const offsetPart = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+0';
  const match = offsetPart.match(/GMT([+-]\d+)(?::(\d+))?/);
  const offsetHours = match ? Number(match[1]) : 0;
  const offsetMinutes = match?.[2] ? Number(match[2]) : 0;
  const offsetMs = (offsetHours * 60 + Math.sign(offsetHours || 1) * offsetMinutes) * 60_000;
  return new Date(utcGuess.getTime() - offsetMs);
};

const emailFor = (firstName: string, lastName: string) =>
  `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${SEED_EMAIL_DOMAIN}`;

async function upsertFakeUsers(): Promise<User[]> {
  const users = await Promise.all(
    FAKE_PEOPLE.map((p) => {
      const email = emailFor(p.firstName, p.lastName);
      return prisma.user.upsert({
        where: { email },
        update: { firstName: p.firstName, lastName: p.lastName },
        create: {
          email,
          emailVerified: false,
          firstName: p.firstName,
          lastName: p.lastName,
          name: `${p.firstName} ${p.lastName}`,
        },
      });
    })
  );
  return users;
}

async function ensureMemberships(partyId: string, users: User[]) {
  // Remove memberships for previous seeded users no longer in our list, then upsert all current ones.
  const emails = users.map((u) => u.email).filter((e): e is string => Boolean(e));
  await prisma.partyMember.deleteMany({
    where: {
      partyId,
      user: { email: { endsWith: `@${SEED_EMAIL_DOMAIN}` } },
      NOT: { user: { email: { in: emails } } },
    },
  });
  await Promise.all(
    users.map((u) =>
      prisma.partyMember.upsert({
        where: { partyId_userId: { partyId, userId: u.id } },
        update: {},
        create: { partyId, userId: u.id, role: 'MEMBER' },
      })
    )
  );
}

async function main() {
  const party = await prisma.party.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
  });

  if (!party) {
    console.error('No party found. Sign in to the app and create one first, then re-run.');
    process.exit(1);
  }

  console.log(
    `Seeding "${party.title}" (${party.id}) — host: ${party.createdBy.firstName} ${party.createdBy.lastName}`
  );

  const fakeUsers = await upsertFakeUsers();
  console.log(`  upserted ${fakeUsers.length} fake users`);

  await ensureMemberships(party.id, fakeUsers);
  console.log(`  ensured ${fakeUsers.length} memberships`);

  const deleted = await prisma.activity.deleteMany({ where: { partyId: party.id } });
  console.log(`  cleared ${deleted.count} existing activities`);

  const startUtc = party.startDate;
  // Spread activity authorship across the host + fake users so the
  // "Added by ..." line shows variety.
  const authors = [party.createdById, ...fakeUsers.map((u) => u.id)];

  const activities = TEMPLATES.map((t, i) => {
    const dayStart = new Date(startUtc.getTime() + t.dayOffset * 24 * ONE_HOUR);
    const startsAt = parseLocalTime(dayStart, t.start, party.timezone);
    const endsAt = new Date(startsAt.getTime() + t.durationMin * 60_000);
    return {
      partyId: party.id,
      title: t.title,
      startsAt,
      endsAt,
      location: t.location,
      color: t.color,
      createdById: authors[i % authors.length] ?? party.createdById,
    };
  });

  await prisma.activity.createMany({ data: activities });
  console.log(`  inserted ${activities.length} activities`);
  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
