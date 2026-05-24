import { Link, useNavigate } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { ImageUpload } from '../components/ImageUpload';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Input';
import { useCreateParty } from '../lib/parties';

const guessTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

export function PartyNew() {
  const navigate = useNavigate();
  const create = useCreateParty();

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [coverImageKey, setCoverImageKey] = useState<string | null>(null);
  const [timezone] = useState(guessTimezone());

  const canSubmit = title.trim() && startDate && endDate && startDate <= endDate;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const party = await create.mutateAsync({
      title: title.trim(),
      startDate,
      endDate,
      coverImageKey,
      timezone,
    });
    navigate({ to: '/parties/$partyId', params: { partyId: party.id }, replace: true });
  };

  return (
    <div className="flex-1 flex flex-col">
      <header className="flex items-center gap-2 px-3 py-2">
        <Button asChild variant="ghost" size="icon" aria-label="Back">
          <Link to="/parties">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">New trip</h1>
      </header>

      <form onSubmit={onSubmit} className="flex-1 px-5 pb-8 space-y-5">
        <ImageUpload value={coverImageKey} onChange={setCoverImageKey} />

        <Field label="Title">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tahoe Birthday"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field
            label="End date"
            error={endDate && startDate && endDate < startDate ? 'After start' : undefined}
          >
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        </div>

        <p className="text-xs text-fg-muted">Times will be shown in {timezone}.</p>

        {create.isError && <p className="text-sm text-danger">{(create.error as Error).message}</p>}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={!canSubmit || create.isPending}
        >
          {create.isPending ? 'Creating…' : 'Create trip'}
        </Button>
      </form>
    </div>
  );
}
