import { Drawer } from 'vaul';
import type { PartyDetail } from '../lib/parties';
import { Avatar } from './Avatar';

export function MembersSheet({
  party,
  open,
  onOpenChange,
}: {
  party: PartyDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // Hosts first, then members; within each group keep join order.
  const ordered = [...party.members].sort((a, b) => {
    if (a.role === b.role) return 0;
    return a.role === 'HOST' ? -1 : 1;
  });

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/55 z-40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[85dvh] flex-col rounded-t-2xl bg-bg-elev border-t border-border text-fg">
          <div className="mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-border shrink-0" />
          <div className="px-5 pt-2 pb-3 flex items-center justify-between shrink-0">
            <Drawer.Title className="text-lg font-semibold">
              {party.members.length === 1 ? '1 member' : `${party.members.length} members`}
            </Drawer.Title>
            <Drawer.Description className="sr-only">Members of this trip</Drawer.Description>
          </div>

          <ul className="flex-1 overflow-y-auto px-5 pb-6 space-y-3">
            {ordered.map((m) => {
              const name = [m.user.firstName, m.user.lastName].filter(Boolean).join(' ');
              return (
                <li key={m.id} className="flex items-center gap-3">
                  <Avatar
                    userId={m.user.id}
                    firstName={m.user.firstName}
                    lastName={m.user.lastName}
                    profileImageKey={m.user.profileImageKey}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-fg truncate">{name || 'Unknown'}</div>
                    {m.role === 'HOST' && <div className="text-xs text-fg-muted">Host</div>}
                  </div>
                </li>
              );
            })}
          </ul>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
