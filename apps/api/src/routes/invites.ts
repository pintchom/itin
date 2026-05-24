import { zValidator } from '@hono/zod-validator';
import { createInviteSchema } from '@itin/shared/schemas/invite';
import { Hono } from 'hono';
import type { Env } from '../context.ts';
import { Forbidden, NotFound } from '../errors.ts';
import { loadSession, requireAuth } from '../middleware/session.ts';

const generateToken = () => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('base64url');
};

export const inviteRoutes = new Hono<Env>()
  .use('*', loadSession())

  .post(
    '/parties/:id/invites',
    requireAuth(),
    zValidator(
      'json',
      createInviteSchema.optional().transform((v) => v ?? {})
    ),
    async (c) => {
      const prisma = c.get('prisma');
      const user = c.get('user');
      if (!user) throw Forbidden();
      const partyId = c.req.param('id');

      const member = await prisma.partyMember.findUnique({
        where: { partyId_userId: { partyId, userId: user.id } },
      });
      if (!member) throw Forbidden('Not a member of this party');

      const { expiresInDays } = c.req.valid('json');
      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      const invite = await prisma.invite.create({
        data: {
          partyId,
          token: generateToken(),
          createdById: user.id,
          expiresAt,
        },
      });
      return c.json({ token: invite.token, expiresAt: invite.expiresAt });
    }
  )

  .get('/invites/:token', async (c) => {
    const prisma = c.get('prisma');
    const token = c.req.param('token');
    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        party: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            coverImageKey: true,
          },
        },
      },
    });
    if (!invite) throw NotFound('Invite not found');
    if (invite.expiresAt && invite.expiresAt < new Date()) throw NotFound('Invite expired');

    const isoDate = (d: Date) => d.toISOString().slice(0, 10);
    return c.json({
      party: {
        id: invite.party.id,
        title: invite.party.title,
        startDate: isoDate(invite.party.startDate),
        endDate: isoDate(invite.party.endDate),
        coverImageKey: invite.party.coverImageKey,
      },
    });
  })

  .post('/invites/:token/claim', requireAuth(), async (c) => {
    const prisma = c.get('prisma');
    const user = c.get('user');
    if (!user) throw Forbidden();
    const token = c.req.param('token');

    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite) throw NotFound('Invite not found');
    if (invite.expiresAt && invite.expiresAt < new Date()) throw NotFound('Invite expired');

    await prisma.partyMember.upsert({
      where: { partyId_userId: { partyId: invite.partyId, userId: user.id } },
      create: { partyId: invite.partyId, userId: user.id, role: 'MEMBER' },
      update: {},
    });

    return c.json({ partyId: invite.partyId });
  });
