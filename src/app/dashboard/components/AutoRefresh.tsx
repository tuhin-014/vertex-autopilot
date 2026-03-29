"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AutoRefresh({ intervalMs = 30000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [secondsUntil, setSecondsUntil] = useState(Math.floor(intervalMs / 1000));

  useEffect(() => {
    const countdown = setInterval(() => {
      const elapsed = Date.now() - lastRefresh.getTime();
      const remaining = Math.max(0, Math.floor((intervalMs - elapsed) / 1000));
      setSecondsUntil(remaining);

      if (remaining <= 0) {
        router.refresh();
        setLastRefresh(new Date());
        setSecondsUntil(Math.floor(intervalMs / 1000));
      }
    }, 1000);

    return () => clearInterval(countdown);
  }, [lastRefresh, intervalMs, router]);

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
      Auto-refresh in {secondsUntil}s
      <button
        onClick={() => { router.refresh(); setLastRefresh(new Date()); }}
        className="text-blue-400 hover:text-blue-300 transition ml-1"
      >
        ↻ Now
      </button>
    </div>
  );
}
