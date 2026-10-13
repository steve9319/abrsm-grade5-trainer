"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function Mark() {
  return (
    <svg className="mark" width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
      <rect width="36" height="36" rx="9" fill="#1c4f45" />
      <g stroke="#f3eadc" strokeWidth="1.2">
        <path d="M7 10h22M7 15h22M7 20h22M7 25h22M7 30h22" />
      </g>
      <circle cx="23" cy="20" r="3" fill="#e7b2a4" />
    </svg>
  );
}

export function Header() {
  const path = usePathname();
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link href="/" className="brand">
          <Mark />
          <span>
            <strong>Grade 5 Theory</strong>
            <small>Piano practice room</small>
          </span>
        </Link>
        <nav aria-label="Primary">
          <Link href="/#topics" aria-current={path === "/" ? "page" : undefined}>
            Practise
          </Link>
          <Link href="/exam" aria-current={path.startsWith("/exam") ? "page" : undefined}>
            Mock paper
          </Link>
          <Link href="/progress" aria-current={path.startsWith("/progress") ? "page" : undefined}>
            Progress
          </Link>
        </nav>
      </div>
    </header>
  );
}
