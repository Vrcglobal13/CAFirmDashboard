"use client";

import { Bell, Check, CheckCheck } from "lucide-react";
import { useTransition } from "react";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";
import type { Notification } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

export function NotificationPanel({ notifications }: { notifications: Notification[] }) {
  const [pending, startTransition] = useTransition();
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  function markOne(notificationId: string) {
    startTransition(async () => {
      await markNotificationRead(notificationId);
    });
  }

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
    });
  }

  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
            <Bell size={18} />
          </span>
          <div>
            <h2 className="font-semibold">Notifications</h2>
            <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
          </div>
        </div>
        <button className="btn-secondary px-2 py-1 text-xs" disabled={pending || unreadCount === 0} onClick={markAll}>
          <CheckCheck size={14} />
          Mark all
        </button>
      </div>

      <div className="max-h-[420px] divide-y divide-border overflow-y-auto">
        {notifications.length ? (
          notifications.map((notification) => (
            <article
              key={notification.id}
              className={cn("flex gap-3 px-5 py-4", !notification.is_read && "bg-emerald-50/70")}
            >
              <span
                className={cn(
                  "mt-1 h-2 w-2 shrink-0 rounded-full",
                  notification.is_read ? "bg-border" : "bg-primary"
                )}
              />
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", !notification.is_read && "font-medium")}>{notification.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(notification.created_at)}</p>
              </div>
              {!notification.is_read ? (
                <button
                  className="btn-secondary h-8 w-8 shrink-0 p-0"
                  disabled={pending}
                  onClick={() => markOne(notification.id)}
                  title="Mark as read"
                >
                  <Check size={14} />
                </button>
              ) : null}
            </article>
          ))
        ) : (
          <div className="px-5 py-8 text-center">
            <p className="text-sm font-medium">No notifications</p>
            <p className="mt-1 text-xs text-muted-foreground">Task updates will appear here.</p>
          </div>
        )}
      </div>
    </section>
  );
}
