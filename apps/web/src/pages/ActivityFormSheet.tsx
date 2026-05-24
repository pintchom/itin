import { combineDateTimeInZone, dayKeyInZone, minutesInZone } from '@itin/shared/time';
import { Check, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Drawer } from 'vaul';
import { Avatar } from '../components/Avatar';
import { ImageUpload } from '../components/ImageUpload';
import { Button } from '../components/ui/Button';
import { DateChipPicker } from '../components/ui/DateChipPicker';
import { Field, Input } from '../components/ui/Input';
import { TimeChipPicker } from '../components/ui/TimeChipPicker';
import {
  type Activity,
  useCreateActivity,
  useDeleteActivity,
  useUpdateActivity,
} from '../lib/activities';
import { useSession } from '../lib/auth';
import { cn } from '../lib/cn';
import type { PartyDetail } from '../lib/parties';

const COMPACT_INPUT = 'h-9 text-sm px-2.5';

const COLOR_PALETTE = [
  '#7aa2ff',
  '#22c55e',
  '#f59e0b',
  '#a78bfa',
  '#06b6d4',
  '#f97316',
  '#3b82f6',
  '#f43f5e',
];

const pad2 = (n: number) => String(n).padStart(2, '0');

const roundUpToHalfHour = (d: Date): { hh: string; mm: string } => {
  const minutes = d.getMinutes();
  const bump = minutes <= 30 ? 30 - minutes : 60 - minutes;
  const out = new Date(d.getTime() + bump * 60_000);
  return { hh: pad2(out.getHours()), mm: pad2(out.getMinutes()) };
};

const hhmmInZone = (date: Date, tz: string): string => {
  const total = minutesInZone(date, tz);
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
};

export function ActivityFormSheet({
  party,
  activity,
  open,
  onOpenChange,
}: {
  party: PartyDetail;
  /** When provided, the sheet is in edit mode for this activity. */
  activity?: Activity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const session = useSession();
  const create = useCreateActivity(party.id);
  const update = useUpdateActivity(party.id);
  const remove = useDeleteActivity(party.id);

  const isEditing = !!activity;
  // Cache the activity at the moment the sheet opened so closing animations
  // don't flash a "stale" state.
  const sheetActivity = useMemo(() => activity ?? null, [activity?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const defaults = useMemo(() => {
    if (sheetActivity) {
      const start = new Date(sheetActivity.startsAt);
      const end = new Date(sheetActivity.endsAt);
      return {
        date: dayKeyInZone(start, party.timezone),
        startTime: hhmmInZone(start, party.timezone),
        endTime: hhmmInZone(end, party.timezone),
        title: sheetActivity.title,
        description: sheetActivity.description ?? '',
        location: sheetActivity.location ?? '',
        color: sheetActivity.color,
        coverImageKey: sheetActivity.coverImageKey,
      };
    }
    const now = new Date();
    const todayInTrip = dayKeyInZone(now, party.timezone);
    const tripStart = party.startDate;
    const tripEnd = party.endDate;
    const dateDefault =
      todayInTrip >= tripStart && todayInTrip <= tripEnd ? todayInTrip : tripStart;
    const start = roundUpToHalfHour(now);
    const endH = (Number(start.hh) + 1) % 24;
    return {
      date: dateDefault,
      startTime: `${start.hh}:${start.mm}`,
      endTime: `${pad2(endH)}:${start.mm}`,
      title: '',
      description: '',
      location: '',
      color: COLOR_PALETTE[0] ?? null,
      coverImageKey: null as string | null,
    };
  }, [sheetActivity, party.timezone, party.startDate, party.endDate]);

  const [title, setTitle] = useState(defaults.title);
  const [description, setDescription] = useState(defaults.description);
  const [date, setDate] = useState(defaults.date);
  const [startTime, setStartTime] = useState(defaults.startTime);
  const [endTime, setEndTime] = useState(defaults.endTime);
  const [location, setLocation] = useState(defaults.location);
  const [color, setColor] = useState<string | null>(defaults.color);
  const [coverImageKey, setCoverImageKey] = useState<string | null>(defaults.coverImageKey);
  const [participants, setParticipants] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Re-seed local state whenever the sheet opens (or the underlying activity changes).
  // This keeps the form in sync with the activity being edited and avoids stale state.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-seed on open transitions only
  useEffect(() => {
    if (!open) return;
    setTitle(defaults.title);
    setDescription(defaults.description);
    setDate(defaults.date);
    setStartTime(defaults.startTime);
    setEndTime(defaults.endTime);
    setLocation(defaults.location);
    setColor(defaults.color);
    setCoverImageKey(defaults.coverImageKey);
    setParticipants(new Set());
    setConfirmDelete(false);
  }, [open, sheetActivity?.id]);

  const otherMembers = useMemo(
    () => party.members.filter((m) => m.user.id !== session.data?.id),
    [party.members, session.data?.id]
  );

  const toggleParticipant = (userId: string) => {
    setParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const isPending = create.isPending || update.isPending || remove.isPending;

  const canSubmit =
    title.trim().length > 0 &&
    date >= party.startDate &&
    date <= party.endDate &&
    !!startTime &&
    !!endTime &&
    startTime < endTime &&
    !isPending;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const startsAt = combineDateTimeInZone(date, startTime, party.timezone);
    const endsAt = combineDateTimeInZone(date, endTime, party.timezone);
    if (sheetActivity) {
      await update.mutateAsync({
        activityId: sheetActivity.id,
        input: {
          title: title.trim(),
          description: description.trim() || null,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          location: location.trim() || null,
          color,
          coverImageKey,
        },
      });
    } else {
      await create.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        location: location.trim() || null,
        color,
        coverImageKey,
        participantUserIds: Array.from(participants),
      });
    }
    onOpenChange(false);
  };

  const onDelete = async () => {
    if (!sheetActivity) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await remove.mutateAsync(sheetActivity.id);
    onOpenChange(false);
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/55 z-40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-6 flex h-[96dvh] flex-col rounded-t-2xl bg-bg-elev border-t border-border text-fg">
          <div className="mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-border shrink-0" />
          <div className="px-4 pt-2 pb-2.5 flex items-center justify-between shrink-0">
            <Drawer.Title className="text-sm font-semibold">
              {isEditing ? 'Edit activity' : 'New activity'}
            </Drawer.Title>
            <Drawer.Description className="sr-only">
              {isEditing ? 'Edit this activity' : 'Add a new activity to this trip'}
            </Drawer.Description>
            <Button size="sm" onClick={onSubmit} disabled={!canSubmit} type="button">
              {isPending ? 'Saving…' : isEditing ? 'Save' : 'Create'}
            </Button>
          </div>

          <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-4 pb-6 space-y-3.5">
            <Field label="Title">
              <Input
                autoFocus
                placeholder="Surf lessons"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                className={COMPACT_INPUT}
              />
            </Field>

            <div className="space-y-1.5">
              <span className="block text-sm font-medium text-fg">Description (optional)</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                placeholder="Anything people should know — meeting spot, what to bring, etc."
                rows={3}
                className={cn(
                  'w-full rounded-xl border border-border bg-bg-elev px-2.5 py-2 text-sm text-fg placeholder:text-fg-muted resize-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
                )}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="block text-xs font-medium text-fg">Date</span>
                <span className="text-[11px] text-fg-muted">Times in {party.timezone}</span>
              </div>
              <DateChipPicker
                startDate={party.startDate}
                endDate={party.endDate}
                value={date}
                onChange={setDate}
              />
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-fg">Start</span>
              <TimeChipPicker value={startTime} onChange={setStartTime} />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="block text-xs font-medium text-fg">End</span>
                {endTime && startTime && endTime <= startTime && (
                  <span className="text-[11px] text-danger">Must be after start</span>
                )}
              </div>
              <TimeChipPicker value={endTime} onChange={setEndTime} />
            </div>

            <Field label="Location (optional)">
              <Input
                placeholder="Playa Hermosa"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={200}
                className={COMPACT_INPUT}
              />
            </Field>

            <ImageUpload
              value={coverImageKey}
              onChange={setCoverImageKey}
              label="Cover image (optional)"
            />

            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-fg">Color</span>
              <div className="flex flex-wrap gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Color ${c}`}
                    aria-pressed={color === c}
                    className={cn(
                      'h-6 w-6 rounded-full border-2 transition active:scale-90',
                      color === c ? 'border-fg' : 'border-transparent'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setColor(null)}
                  aria-pressed={color === null}
                  className={cn(
                    'h-6 px-2.5 rounded-full border text-[11px] transition',
                    color === null ? 'border-fg text-fg' : 'border-border text-fg-muted hover:bg-bg'
                  )}
                >
                  None
                </button>
              </div>
            </div>

            {!isEditing && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="block text-xs font-medium text-fg">
                    Who's going{participants.size > 0 && ` (${participants.size + 1})`}
                  </span>
                  {otherMembers.length > 0 && (
                    <button
                      type="button"
                      className="text-[11px] text-accent"
                      onClick={() => {
                        if (participants.size === otherMembers.length) {
                          setParticipants(new Set());
                        } else {
                          setParticipants(new Set(otherMembers.map((m) => m.user.id)));
                        }
                      }}
                    >
                      {participants.size === otherMembers.length ? 'Clear' : 'Select all'}
                    </button>
                  )}
                </div>

                <ul className="rounded-lg border border-border divide-y divide-border bg-bg/40">
                  {session.data && (
                    <li className="flex items-center gap-2.5 px-2.5 py-1.5 text-fg-muted">
                      <Avatar
                        userId={session.data.id}
                        firstName={session.data.firstName}
                        lastName={session.data.lastName}
                        profileImageKey={session.data.profileImageKey}
                        size="xs"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-fg truncate">
                          {[session.data.firstName, session.data.lastName]
                            .filter(Boolean)
                            .join(' ')}
                        </div>
                        <div className="text-[11px]">You — auto-included</div>
                      </div>
                      <Check className="h-4 w-4 text-emerald-300/80" />
                    </li>
                  )}
                  {otherMembers.map((m) => {
                    const selected = participants.has(m.user.id);
                    const name =
                      [m.user.firstName, m.user.lastName].filter(Boolean).join(' ') || 'Unknown';
                    return (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => toggleParticipant(m.user.id)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left active:bg-bg"
                        >
                          <Avatar
                            userId={m.user.id}
                            firstName={m.user.firstName}
                            lastName={m.user.lastName}
                            profileImageKey={m.user.profileImageKey}
                            size="xs"
                          />
                          <div className="flex-1 min-w-0 text-sm text-fg truncate">{name}</div>
                          <span
                            className={cn(
                              'h-5 w-5 rounded border-2 flex items-center justify-center transition',
                              selected ? 'bg-accent border-accent text-accent-fg' : 'border-border'
                            )}
                          >
                            {selected && <Check className="h-3.5 w-3.5" />}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {(create.isError || update.isError || remove.isError) && (
              <p className="text-sm text-danger">
                {((create.error || update.error || remove.error) as Error).message}
              </p>
            )}

            {isEditing && (
              <div className="pt-3 mt-2 border-t border-border">
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={isPending}
                  className={cn(
                    'w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium border-2 transition active:scale-[0.98]',
                    confirmDelete
                      ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                      : 'border-rose-500/60 text-rose-300/90 hover:bg-rose-500/10'
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                  {confirmDelete ? 'Tap again to confirm delete' : 'Delete activity'}
                </button>
              </div>
            )}
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
