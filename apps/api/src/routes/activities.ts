import { Hono } from 'hono';
import type { Env } from '../context.ts';
import { Forbidden, NotFound } from '../errors.ts';
import { requireAuth } from '../middleware/session.ts';

export const activityRoutes = new Hono<Env>()
  .use('*', requireAuth())

  .get('/:partyId/activities', async (c) => {
    const prisma = c.get('prisma');
    const user = c.get('user');
    if (!user) throw Forbidden();
    const partyId = c.req.param('partyId');

    const member = await prisma.partyMember.findUnique({
      where: { partyId_userId: { partyId, userId: user.id } },
      select: { id: true },
    });
    if (!member) throw NotFound('Party not found');

    const activities = await prisma.activity.findMany({
      where: { partyId },
      orderBy: { startsAt: 'asc' },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return c.json({
      activities: activities.map((a) => ({
        id: a.id,
        partyId: a.partyId,
        title: a.title,
        startsAt: a.startsAt.toISOString(),
        endsAt: a.endsAt.toISOString(),
        location: a.location,
        color: a.color,
        createdBy: a.createdBy,
      })),
    });
  });
