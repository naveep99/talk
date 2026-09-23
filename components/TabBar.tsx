"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCoach, IconJourney, IconTalk } from "./Icons";

const TABS = [
  { href: "/", label: "Talk", Icon: IconTalk },
  { href: "/journey", label: "Journey", Icon: IconJourney },
  { href: "/coach", label: "Coach", Icon: IconCoach },
];

export function TabBar() {
  const path = usePathname();
  return (
    <nav className="tabbar" aria-label="Main">
      <div className="tabbar-inner">
        {TABS.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={`tab${path === href ? " active" : ""}`}>
            <Icon />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
