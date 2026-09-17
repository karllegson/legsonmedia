"use client";

import { Bell } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { WorkNotification } from "@/lib/work/notifications";

export function WorkNotifications() {
  const [open, setOpen] = useState(false);
  const [items] = useState<WorkNotification[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const unreadCount = items.filter((item) => !item.read).length;

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="wk-notif" ref={rootRef}>
      <button
        type="button"
        className="wk-icon-btn wk-notif-trigger"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={15} strokeWidth={1.9} aria-hidden />
        {unreadCount > 0 ? (
          <span className="wk-notif-dot" aria-hidden>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="wk-notif-panel"
          id={panelId}
          role="dialog"
          aria-label="Notifications"
        >
          <div className="wk-notif-head">
            <div>
              <p className="wk-notif-title">Notifications</p>
              <p className="wk-notif-sub">You’re all caught up</p>
            </div>
          </div>

          <div className="wk-notif-empty">
            <p className="wk-notif-empty-title">No notifications yet</p>
            <p className="wk-notif-empty-text">
              Team updates will show up here.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
