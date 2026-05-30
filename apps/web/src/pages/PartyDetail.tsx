import { Link, useParams } from "@tanstack/react-router";
import { ChevronLeft, Pencil, Plus, UserPlus } from "lucide-react";
import { useState } from "react";
import { MembersSheet } from "../components/MembersSheet";
import { MembersStack } from "../components/MembersStack";
import { PartyCalendar } from "../components/calendar/PartyCalendar";
import { Button } from "../components/ui/Button";
import { ErrorScreen, LoadingScreen } from "../components/ui/StatusScreen";
import type { Activity } from "../lib/activities";
import { formatDateRange } from "../lib/dates";
import { coverImageUrl } from "../lib/images";
import { buildInviteUrl, useCreateInvite } from "../lib/invites";
import { useParty } from "../lib/parties";
import { ActivityFormSheet } from "./ActivityFormSheet";
import { PartyEditDialog } from "./PartyEdit";

export function PartyDetail() {
  const { partyId } = useParams({ strict: false }) as { partyId: string };
  const party = useParty(partyId);
  const createInvite = useCreateInvite(partyId);
  const [editing, setEditing] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const sheetOpen = creating || editingActivity !== null;
  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      setCreating(false);
      setEditingActivity(null);
    }
  };

  const onInvite = async () => {
    const data = party.data;
    if (!data) return;
    const { token } = await createInvite.mutateAsync(undefined);
    const url = buildInviteUrl(token);

    const host =
      data.members
        .find((m) => m.user.id === data.createdById)
        ?.user.firstName?.trim() || "a friend";
    const dates = formatDateRange(data.startDate, data.endDate);
    const message = `Join ${host}'s itin party for ${data.title} on ${dates} with this link:`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${data.title} on itin`,
          text: message,
          url,
        });
        return;
      } catch {}
    }
    await navigator.clipboard?.writeText(`${message} ${url}`).catch(() => {});
  };

  if (party.isLoading) return <LoadingScreen />;
  if (party.error || !party.data) {
    return (
      <ErrorScreen message={(party.error as Error)?.message ?? "Not found"} />
    );
  }
  const p = party.data;
  const isHost = p.role === "HOST";

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="shrink-0 relative z-10 w-full aspect-[16/9] bg-bg-elev">
        {p.coverImageKey && (
          <img
            src={coverImageUrl(p.coverImageKey, "lg")}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/55" />
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Back"
            className="bg-black/35 text-white backdrop-blur"
          >
            <Link to="/parties">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Invite"
              className="bg-black/35 text-white backdrop-blur"
              onClick={onInvite}
              disabled={createInvite.isPending}
            >
              <UserPlus className="h-5 w-5" />
            </Button>
            {isHost && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Edit"
                className="bg-black/35 text-white backdrop-blur"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
        <div className="absolute left-5 right-5 bottom-3 flex items-end justify-between gap-3 text-white">
          <div className="min-w-0">
            <div className="text-2xl font-semibold drop-shadow truncate">
              {p.title}
            </div>
            <div className="text-sm opacity-90">
              {formatDateRange(p.startDate, p.endDate)}
            </div>
          </div>
          <MembersStack
            members={p.members}
            onClick={() => setMembersOpen(true)}
          />
        </div>

        <div
          aria-hidden
          className="absolute left-0 right-0 top-full h-6 pointer-events-none bg-gradient-to-b from-black/55 via-black/20 to-transparent"
        />
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
        <PartyCalendar
          party={p}
          isHost={isHost}
          onEditActivity={(activity) => setEditingActivity(activity)}
        />
      </div>

      <button
        type="button"
        onClick={() => setCreating(true)}
        aria-label="Add activity"
        className="fixed bottom-4 right-4 z-20 h-14 w-14 rounded-full bg-accent text-accent-fg shadow-lg shadow-black/40 flex items-center justify-center transition active:scale-95"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>

      {editing && (
        <PartyEditDialog party={p} onClose={() => setEditing(false)} />
      )}
      <MembersSheet
        party={p}
        open={membersOpen}
        onOpenChange={setMembersOpen}
      />
      <ActivityFormSheet
        party={p}
        activity={editingActivity}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
      />
    </div>
  );
}
