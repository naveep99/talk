import { CHARACTERS, CHARACTER_ORDER, type Character, type LifeBeat } from "./characters";
import type { Availability, CharacterId } from "./types";

const DAY = 24 * 60 * 60 * 1000;

export function dayIndexSince(start: number, now = Date.now(), offsetDays = 0): number {
  return Math.max(0, Math.floor((now - start) / DAY) + offsetDays);
}

function inBlock(hour: number, from: number, to: number) {
  return hour >= from && hour < to;
}

export function statusFor(
  c: Character,
  date: Date,
): { status: Availability; activity: string } {
  const hour = date.getHours();
  const day = date.getDay();
  const weekend = day === 0 || day === 6;
  if (weekend) {
    const w = c.schedule.find((b) => b.days === "weekend" && inBlock(hour, b.from, b.to));
    if (w) return { status: w.status, activity: w.activity };
  }
  const b = c.schedule.find((s) => !s.days && inBlock(hour, s.from, s.to));
  return b ? { status: b.status, activity: b.activity } : { status: "offline", activity: "" };
}

/** Availability for everyone, guaranteeing that at least one person is reachable. */
export function allStatuses(date = new Date()): Record<CharacterId, { status: Availability; activity: string }> {
  const out = {} as Record<CharacterId, { status: Availability; activity: string }>;
  for (const id of CHARACTER_ORDER) out[id] = statusFor(CHARACTERS[id], date);
  if (CHARACTER_ORDER.every((id) => out[id].status === "offline")) {
    out.riya = { status: "away", activity: "Couldn't sleep, scrolling" };
  }
  return out;
}

/** When she's next likely to be around, in human terms. */
export function nextOnline(c: Character, date = new Date()): string {
  for (let i = 1; i <= 24; i++) {
    const d = new Date(date.getTime() + i * 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    if (statusFor(c, d).status !== "offline") {
      const h = d.getHours();
      const label = h === 0 ? "midnight" : h === 12 ? "noon" : h < 12 ? `${h}am` : `${h - 12}pm`;
      const tomorrow = d.getDate() !== date.getDate();
      return tomorrow ? `tomorrow around ${label}` : `around ${label}`;
    }
  }
  return "later";
}

export function currentBeat(c: Character, dayIndex: number): LifeBeat {
  const eligible = c.beats.filter((b) => b.day <= dayIndex);
  return eligible[eligible.length - 1] ?? c.beats[0];
}

export function pastBeats(c: Character, dayIndex: number): LifeBeat[] {
  const cur = currentBeat(c, dayIndex);
  return c.beats.filter((b) => b.day <= dayIndex && b.id !== cur.id);
}

/** A life update she might open with, if there's one she hasn't shared yet. */
export function openerBeat(c: Character, dayIndex: number, toldBeats: string[]): LifeBeat | undefined {
  const cur = currentBeat(c, dayIndex);
  if (cur.opener && !toldBeats.includes(cur.id)) return cur;
  return undefined;
}

export function lifeContext(c: Character, dayIndex: number, toldBeats: string[]) {
  const cur = currentBeat(c, dayIndex);
  const past = pastBeats(c, dayIndex);
  return {
    now: cur.now,
    past: past.map((b) => ({ text: b.after, told: toldBeats.includes(b.id) })),
    currentId: cur.id,
  };
}
