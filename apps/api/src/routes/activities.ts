import { zValidator } from '@hono/zod-validator';
import { createActivitySchema } from '@itin/shared/schemas/activity';
import { rsvpSchema } from '@itin/shared/schemas/rsvp';
import { Hono } from 'hono';
import type { Env } from '../context.ts';
import { BadRequest, Forbidden, NotFound } from '../errors.ts';
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
        createdBy: { select: { id: true, firstName: true, lastName: true, profileImageKey: true } },
        participants: {
          select: {
            id: true,
            status: true,
            user: { select: { id: true, firstName: true, lastName: true, profileImageKey: true } },
          },
        },
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
        participants: a.participants.map((p) => ({
          id: p.id,
          status: p.status,
          user: p.user,
        })),
      })),
    });
  })

  .post('/:partyId/activities', zValidator('json', createActivitySchema), async (c) => {
    const prisma = c.get('prisma');
    const user = c.get('user');
    if (!user) throw Forbidden();
    const partyId = c.req.param('partyId');

    const member = await prisma.partyMember.findUnique({
      where: { partyId_userId: { partyId, userId: user.id } },
      select: { id: true },
    });
    if (!member) throw NotFound('Party not found');

    const input = c.req.valid('json');

    // All pre-assigned user ids must be members of the party.
    if (input.participantUserIds.length > 0) {
      const memberCount = await prisma.partyMember.count({
        where: { partyId, userId: { in: input.participantUserIds } },
      });
      if (memberCount !== input.participantUserIds.length) {
        throw BadRequest('Some participants are not members of this party');
      }
    }

    const allParticipantIds = Array.from(new Set([...input.participantUserIds, user.id]));
    const now = new Date();

    const created = await prisma.activity.create({
      data: {
        partyId,
        title: input.title,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        location: input.location ?? null,
        color: input.color ?? null,
        createdById: user.id,
        participants: {
          create: allParticipantIds.map((userId) => ({
            userId,
            status: 'GOING',
            respondedAt: now,
          })),
        },
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, profileImageKey: true } },
        participants: {
          select: {
            id: true,
            status: true,
            user: { select: { id: true, firstName: true, lastName: true, profileImageKey: true } },
          },
        },
      },
    });

    return c.json(
      {
        activity: {
          id: created.id,
          partyId: created.partyId,
          title: created.title,
          startsAt: created.startsAt.toISOString(),
          endsAt: created.endsAt.toISOString(),
          location: created.location,
          color: created.color,
          createdBy: created.createdBy,
          participants: created.participants.map((p) => ({
            id: p.id,
            status: p.status,
            user: p.user,
          })),
        },
      },
      201
    );
  });

export const rsvpRoutes = new Hono<Env>()
  .use('*', requireAuth())

  .post('/:activityId/rsvp', zValidator('json', rsvpSchema), async (c) => {
    const prisma = c.get('prisma');
    const user = c.get('user');
    if (!user) throw Forbidden();
    const activityId = c.req.param('activityId');
    const { status } = c.req.valid('json');

    // Ensure the caller is a member of the activity's party.
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { partyId: true },
    });
    if (!activity) throw NotFound('Activity not found');

    const member = await prisma.partyMember.findUnique({
      where: { partyId_userId: { partyId: activity.partyId, userId: user.id } },
      select: { id: true },
    });
    if (!member) throw Forbidden('Not a member of this party');

    const row = await prisma.activityParticipant.upsert({
      where: { activityId_userId: { activityId, userId: user.id } },
      create: { activityId, userId: user.id, status, respondedAt: new Date() },
      update: { status, respondedAt: new Date() },
      select: {
        id: true,
        status: true,
        user: { select: { id: true, firstName: true, lastName: true, profileImageKey: true } },
      },
    });

    return c.json({ participant: row });
  })

  .delete('/:activityId/rsvp', async (c) => {
    const prisma = c.get('prisma');
    const user = c.get('user');
    if (!user) throw Forbidden();
    const activityId = c.req.param('activityId');

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { partyId: true },
    });
    if (!activity) throw NotFound('Activity not found');

    await prisma.activityParticipant.deleteMany({
      where: { activityId, userId: user.id },
    });
    return c.json({ ok: true });
  });
