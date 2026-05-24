import { useState } from 'react';
import { Drawer } from 'vaul';
import { ImageUpload } from '../components/ImageUpload';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Input';
import { type PartyDetail, useUpdateParty } from '../lib/parties';

export function PartyEditDialog({
  party,
  onClose,
}: {
  party: PartyDetail;
  onClose: () => void;
}) {
  const update = useUpdateParty(party.id);
  const [title, setTitle] = useState(party.title);
  const [startDate, setStartDate] = useState(party.startDate);
  const [endDate, setEndDate] = useState(party.endDate);
  const [coverImageKey, setCoverImageKey] = useState<string | null>(party.coverImageKey);

  const canSubmit =
    title.trim() && startDate && endDate && startDate <= endDate && !update.isPending;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await update.mutateAsync({
      title: title.trim(),
      startDate,
      endDate,
      coverImageKey,
    });
    onClose();
  };

  return (
    <Drawer.Root open onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/55 z-40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 flex h-[92dvh] flex-col rounded-t-2xl bg-bg-elev border-t border-border text-fg">
          <div className="mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-border" />
          <div className="px-5 pb-3 flex items-center justify-between">
            <Drawer.Title className="text-lg font-semibold">Edit trip</Drawer.Title>
            <Drawer.Description className="sr-only">Edit your trip details</Drawer.Description>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>
          <form onSubmit={onSubmit} className="flex-1 overflow-auto px-5 pb-8 space-y-5">
            <ImageUpload value={coverImageKey} onChange={setCoverImageKey} />
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start date">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Field>
              <Field label="End date">
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </Field>
            </div>
            {update.isError && (
              <p className="text-sm text-danger">{(update.error as Error).message}</p>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={!canSubmit}>
              {update.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
