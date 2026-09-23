import type { Availability } from "@/lib/types";

const LABEL: Record<Availability, string> = { online: "Online", away: "Away", offline: "Offline" };
const COLOR: Record<Availability, string> = { online: "var(--online)", away: "var(--away)", offline: "var(--offline)" };

export function Status({ status, activity }: { status: Availability; activity?: string }) {
  return (
    <span className="status">
      <i style={{ background: COLOR[status] }} />
      {LABEL[status]}
      {activity ? <span className="faint">· {activity}</span> : null}
    </span>
  );
}
