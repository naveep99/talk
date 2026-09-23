"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, COACH_LOOK } from "@/components/Avatar";
import { CHARACTERS } from "@/lib/characters";
import { useApp, useHydrated } from "@/lib/store";
import type { DatingExperience } from "@/lib/types";

const EXPERIENCE: { v: DatingExperience; label: string }[] = [
  { v: "never", label: "Never" },
  { v: "a_little", label: "A little" },
  { v: "a_few_times", label: "A few times" },
  { v: "relationships", label: "I've had relationships" },
];

const STRUGGLES: { v: string; label: string }[] = [
  { v: "starting", label: "Starting conversations" },
  { v: "what_to_say", label: "Knowing what to say" },
  { v: "flirting", label: "Flirting" },
  { v: "keeping_going", label: "Keeping conversations going" },
  { v: "reading_interest", label: "Knowing if she's interested" },
  { v: "rejection", label: "Handling rejection" },
  { v: "asking_out", label: "Asking someone out" },
  { v: "confidence", label: "Confidence" },
  { v: "overthinking", label: "Overthinking" },
];

const GOALS = [
  "Starting conversations",
  "Being more playful",
  "Flirting",
  "Talking about myself",
  "Keeping it going",
  "Reading signals",
  "Asking someone out",
  "Feeling less nervous",
];

const STEPS = 5;

export default function Welcome() {
  const router = useRouter();
  const hydrated = useHydrated();
  const existing = useApp((s) => s.profile);
  const complete = useApp((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [experience, setExperience] = useState<DatingExperience | null>(null);
  const [struggles, setStruggles] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);

  useEffect(() => {
    if (hydrated && existing) router.replace("/");
  }, [hydrated, existing, router]);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const canNext = [true, true, !!experience, struggles.length > 0, goals.length > 0][step];
  const next = () => {
    if (step < STEPS - 1) setStep(step + 1);
    else {
      complete({ name: name.trim(), experience: experience ?? "a_little", struggles, goals });
      router.replace("/");
    }
  };

  return (
    <main className="onb">
      {step > 0 && (
        <div className="onb-progress" aria-hidden>
          {Array.from({ length: STEPS - 1 }, (_, i) => (
            <b key={i} className={i < step ? "on" : ""} />
          ))}
        </div>
      )}

      <div className="onb-body" key={step}>
        {step === 0 && (
          <>
            <div className="hero-orbs" aria-hidden>
              <div style={{ left: "6%", top: 40 }}><Avatar c={CHARACTERS.riya} size={92} breathe /></div>
              <div style={{ left: "38%", top: 0 }}><Avatar c={CHARACTERS.ananya} size={70} breathe /></div>
              <div style={{ right: "8%", top: 58 }}><Avatar c={CHARACTERS.meera} size={100} breathe /></div>
              <div style={{ left: "30%", top: 128 }}><Avatar c={CHARACTERS.sara} size={78} breathe /></div>
            </div>
            <p className="eyebrow">Talk</p>
            <h1 className="h-display" style={{ marginTop: 10 }}>
              A private place to practice talking to women.
            </h1>
            <p className="lede">
              Have real conversations, see how you&rsquo;re coming across, and get a little more comfortable every time. Nobody&rsquo;s watching. Awkward is allowed.
            </p>
          </>
        )}

        {step === 1 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <Avatar c={COACH_LOOK} size={34} />
              <span className="muted" style={{ fontSize: 14 }}>Your coach</span>
            </div>
            <h1 className="h-title">Let&rsquo;s get to know you.</h1>
            <p className="lede">First — what should I call you?</p>
            <input
              className="field"
              style={{ marginTop: 22 }}
              placeholder="Your first name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && next()}
              autoFocus
              maxLength={30}
            />
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="h-title">Have you dated before?</h1>
            <p className="lede">No wrong answers. This just helps me pitch things right.</p>
            <div style={{ marginTop: 22 }}>
              {EXPERIENCE.map((o) => (
                <button key={o.v} className={`choice${experience === o.v ? " on" : ""}`} onClick={() => setExperience(o.v)}>
                  {o.label}
                  <span className="tick">{experience === o.v ? "✓" : ""}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="h-title">What&rsquo;s hardest for you?</h1>
            <p className="lede">Pick as many as feel true.</p>
            <div className="chips" style={{ marginTop: 22 }}>
              {STRUGGLES.map((o) => (
                <button key={o.v} className={`pick${struggles.includes(o.v) ? " on" : ""}`} onClick={() => toggle(struggles, setStruggles, o.v)}>
                  {o.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="h-title">What do you want to get better at?</h1>
            <p className="lede">We&rsquo;ll start here and adjust as we learn what actually helps.</p>
            <div className="chips" style={{ marginTop: 22 }}>
              {GOALS.map((g) => (
                <button key={g} className={`pick${goals.includes(g) ? " on" : ""}`} onClick={() => toggle(goals, setGoals, g)}>
                  {g}
                </button>
              ))}
            </div>
            {goals.length > 0 && (
              <div className="card" style={{ marginTop: 26, animation: "pageIn .4s var(--ease)" }}>
                <p className="serif" style={{ fontSize: 21, margin: 0, lineHeight: 1.25 }}>
                  Got it{name.trim() ? `, ${name.trim()}` : ""}. We&rsquo;ll use your conversations to figure out what actually helps you.
                </p>
                <div className="how">
                  <div className="how-item"><span className="n">💬</span><div><b>Talk to four different women</b><p>Each has her own personality, life and moods.</p></div></div>
                  <div className="how-item"><span className="n">❤️</span><div><b>See how you&rsquo;re coming across</b><p>A live read of what she thinks — as it happens.</p></div></div>
                  <div className="how-item"><span className="n">✦</span><div><b>Get better with your coach</b><p>Patterns, feedback, and what to try next.</p></div></div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="onb-foot">
        <button className="btn btn-primary btn-block" disabled={!canNext} onClick={next}>
          {step === 0 ? "Get started" : step === STEPS - 1 ? "Meet them" : "Continue"}
        </button>
        {step > 0 && (
          <button className="btn btn-block muted" style={{ height: 40 }} onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        {step === 0 && <p className="faint" style={{ textAlign: "center", fontSize: 12, margin: "4px 0 0" }}>The women you&rsquo;ll meet are AI characters. Everything stays on this device.</p>}
      </div>
    </main>
  );
}
