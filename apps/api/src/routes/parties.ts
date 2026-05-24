import { zValidator } from '@hono/zod-validator';
import { createPartySchema, updatePartySchema } from '@itin/shared/schemas/party';
import { parseIsoDate } from '@itin/shared/time';
import { Hono } from 'hono';
import type { Env } from '../context.ts';
import { Forbidden, NotFound } from '../errors.ts';
import { toPartyDetail, toPartySummary } from '../lib/party.ts';
import { requireAuth } from '../middleware/session.ts';

export const partyRoutes = new Hono<Env>()
  .use('*', requireAuth())

  .get('/', async (c) => {
    const prisma = c.get('prisma');
    const user = c.get('user');
    if (!user) throw Forbidden();

    const memberships = await prisma.partyMember.findMany({
      where: { userId: user.id },
      orderBy: { joinedAt: 'desc' },
      include: {
        party: { include: { _count: { select: { members: true } } } },
      },
    });

    const parties = memberships.map((m) => toPartySummary(m.party, m.role, m.party._count.members));
    return c.json({ parties });
  })

  .post('/', zValidator('json', createPartySchema), async (c) => {
    const prisma = c.get('prisma');
    const user = c.get('user');
    if (!user) throw Forbidden();

    const input = c.req.valid('json');
    const party = await prisma.party.create({
      data: {
        title: input.title,
        startDate: parseIsoDate(input.startDate),
        endDate: parseIsoDate(input.endDate),
        coverImageKey: input.coverImageKey ?? null,
        timezone: input.timezone,
        createdById: user.id,
        members: {
          create: { userId: user.id, role: 'HOST' },
        },
      },
      include: {
        members: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });
    return c.json({ party: toPartyDetail(party, 'HOST') }, 201);
  })

  .get('/:id', async (c) => {
    const prisma = c.get('prisma');
    const user = c.get('user');
    if (!user) throw Forbidden();
    const id = c.req.param('id');

    const party = await prisma.party.findUnique({
      where: { id },
      include: {
        members: {
          orderBy: { joinedAt: 'asc' },
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
    if (!party) throw NotFound();

    const viewer = party.members.find((m) => m.userId === user.id);
    if (!viewer) throw Forbidden('Not a member of this party');

    return c.json({ party: toPartyDetail(party, viewer.role) });
  })

  .patch('/:id', zValidator('json', updatePartySchema), async (c) => {
    const prisma = c.get('prisma');
    const user = c.get('user');
    if (!user) throw Forbidden();
    const id = c.req.param('id');

    const member = await prisma.partyMember.findUnique({
      where: { partyId_userId: { partyId: id, userId: user.id } },
    });
    if (!member) throw Forbidden('Not a member of this party');
    if (member.role !== 'HOST') throw Forbidden('Only the host can edit this party');

    const input = c.req.valid('json');
    const updated = await prisma.party.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.startDate !== undefined && { startDate: parseIsoDate(input.startDate) }),
        ...(input.endDate !== undefined && { endDate: parseIsoDate(input.endDate) }),
        ...(input.coverImageKey !== undefined && { coverImageKey: input.coverImageKey }),
        ...(input.timezone !== undefined && { timezone: input.timezone }),
      },
      include: {
        members: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });
    return c.json({ party: toPartyDetail(updated, member.role) });
  });
