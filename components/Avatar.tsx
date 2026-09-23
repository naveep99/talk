import type { Character } from "@/lib/characters";
import type { Availability } from "@/lib/types";

/** Abstract "aura" portrait: each woman gets her own light, not a stock photo. */
export function Avatar({
  c,
  size = 48,
  status,
  breathe,
}: {
  c: Pick<Character, "name" | "palette">;
  size?: number;
  status?: Availability;
  breathe?: boolean;
}) {
  const { a, b, c: c3 } = c.palette;
  return (
    <div className={`avatar${breathe ? " avatar-breathe" : ""}`} style={{ width: size, height: size }} aria-hidden>
      <div
        className="avatar-orb"
        style={{
          background: `radial-gradient(circle at 70% 80%, ${b} 0%, transparent 60%), radial-gradient(circle at 20% 30%, ${c3} 0%, transparent 55%), linear-gradient(145deg, ${a}, ${b})`,
        }}
      />
      <div className="avatar-initial" style={{ fontSize: size * 0.46 }}>
        {c.name[0]}
      </div>
      {status && <span className={`dot dot-${status}`} />}
    </div>
  );
}

export const COACH_LOOK = {
  name: "Coach",
  palette: { a: "#3a3444", b: "#6b5f7d", c: "#bfb3cf", ink: "#fff" },
};
