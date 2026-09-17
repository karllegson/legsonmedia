"use client";

import { useEffect, useState } from "react";

type LiveTimerProps = {
  startedAt: string;
  className?: string;
  pausedMs?: number;
  isPaused?: boolean;
};

function formatElapsed(totalSeconds: number) {
  const total = Math.max(0, totalSeconds);
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    pad(Math.floor(total / 3600)),
    pad(Math.floor((total % 3600) / 60)),
    pad(total % 60),
  ].join(":");
}

export function LiveTimer({
  startedAt,
  className,
  pausedMs = 0,
  isPaused = false,
}: LiveTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (isPaused) {
      return;
    }
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isPaused]);

  const elapsedSeconds = Math.floor(
    Math.max(0, now - new Date(startedAt).getTime() - pausedMs) / 1000,
  );

  return (
    <span className={className} suppressHydrationWarning>
      {formatElapsed(elapsedSeconds)}
    </span>
  );
}
