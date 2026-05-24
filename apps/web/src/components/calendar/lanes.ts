export type Interval = {
  id: string;
  startMin: number;
  endMin: number;
};

export type LaidOutEvent<T extends Interval> = {
  event: T;
  lane: number;
  lanesInColumn: number;
};

// Assigns each event to a lane such that events that overlap in time
// share a column and get a unique lane index within that column.
// Returns the lane index per event plus the total number of lanes
// for the column the event belongs to, so the renderer can compute width.
export function layoutLanes<T extends Interval>(events: T[]): LaidOutEvent<T>[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort((a, b) => {
    if (a.startMin !== b.startMin) return a.startMin - b.startMin;
    return a.endMin - b.endMin;
  });

  // Group into overlapping columns.
  type Column = { events: T[]; lanes: T[][] };
  const columns: Column[] = [];
  let current: Column | null = null;
  let currentEnd = -1;

  for (const ev of sorted) {
    if (current && ev.startMin < currentEnd) {
      current.events.push(ev);
      currentEnd = Math.max(currentEnd, ev.endMin);
    } else {
      current = { events: [ev], lanes: [] };
      columns.push(current);
      currentEnd = ev.endMin;
    }
  }

  const result: LaidOutEvent<T>[] = [];
  for (const col of columns) {
    for (const ev of col.events) {
      let placed = false;
      for (let laneIdx = 0; laneIdx < col.lanes.length; laneIdx++) {
        const lane = col.lanes[laneIdx];
        if (!lane) continue;
        const last = lane[lane.length - 1];
        if (last && last.endMin <= ev.startMin) {
          lane.push(ev);
          result.push({ event: ev, lane: laneIdx, lanesInColumn: 0 });
          placed = true;
          break;
        }
      }
      if (!placed) {
        col.lanes.push([ev]);
        result.push({
          event: ev,
          lane: col.lanes.length - 1,
          lanesInColumn: 0,
        });
      }
    }
    const total = col.lanes.length;
    for (const r of result) {
      if (col.events.includes(r.event)) r.lanesInColumn = total;
    }
  }

  return result;
}
