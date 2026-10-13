"use client";

import { useEffect, useRef, useState } from "react";

export function Staff({ notation, label }: { notation: string; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    (async () => {
      try {
        const abcjs = await import("abcjs");
        if (cancelled || !ref.current) return;
        const render = abcjs.renderAbc ?? abcjs.default?.renderAbc;
        if (!render) throw new Error("abcjs renderAbc is unavailable");
        const width = Math.max(260, Math.min(560, ref.current.clientWidth - 12));
        ref.current.replaceChildren();
        render(ref.current, notation, {
          responsive: "resize",
          staffwidth: width,
          paddingtop: 6,
          paddingbottom: 6,
          paddingleft: 0,
          paddingright: 0,
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [notation]);

  if (failed) {
    return (
      <pre className="staff staff-fallback" aria-label={label || "Staff notation"}>
        {notation}
      </pre>
    );
  }

  return <div className="staff" ref={ref} role="img" aria-label={label || "Staff notation"} />;
}
