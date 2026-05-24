import type { PartyDetail } from '../lib/parties';
import { Avatar } from './Avatar';

const MAX_VISIBLE = 3;

export function MembersStack({
  members,
  onClick,
}: {
  members: PartyDetail['members'];
  onClick: () => void;
}) {
  const sorted = [...members].sort((a, b) => {
    if (a.role === b.role) return 0;
    return a.role === 'HOST' ? -1 : 1;
  });
  const visible = sorted.slice(0, MAX_VISIBLE);
  const overflow = sorted.length - visible.length;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View all ${members.length} members`}
      className="flex items-center -space-x-2 rounded-full transition active:scale-95"
    >
      {visible.map((m) => (
        <Avatar
          key={m.id}
          userId={m.user.id}
          firstName={m.user.firstName}
          lastName={m.user.lastName}
          profileImageKey={m.user.profileImageKey}
          size="sm"
          ringClassName="ring-2 ring-black/55"
        />
      ))}
      {overflow > 0 && (
        <span className="inline-flex items-center justify-center h-7 min-w-7 px-1.5 rounded-full bg-black/55 text-white text-[11px] font-semibold ring-2 ring-black/55 shrink-0">
          +{overflow}
        </span>
      )}
    </button>
  );
}
