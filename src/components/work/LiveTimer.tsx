"use client";

import { useEffect, useState } from "react";

type LiveTimerProps = {
  startedAt: string;
  className?: string;
};

function format(startedAt: string, now: number) {
  const total = Math.max(
    0,
    Math.floor((now - new Date(startedAt).getTime()) / 1000),
  );
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    pad(Math.floor(total / 3600)),
    pad(Math.floor((total % 3600) / 60)),
    pad(total % 60),
  ].join(":");
}

export function LiveTimer({ startedAt, className }: LiveTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className={className} suppressHydrationWarning>
      {format(startedAt, now)}
    </span>
  );
}
