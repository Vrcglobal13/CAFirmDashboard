"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { RealtimePostgresInsertPayload, RealtimePostgresUpdatePayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { AppRole, Notification, Task } from "@/lib/types";

type RealtimeContextValue = {
  highlightedTaskIds: Set<string>;
  clearTaskHighlight: (taskId: string) => void;
  isPending: boolean;
};

const RealtimeContext = createContext<RealtimeContextValue>({
  highlightedTaskIds: new Set(),
  clearTaskHighlight: () => undefined,
  isPending: false
});

const STORAGE_KEY = "ca-firm-os.highlighted-task-ids";

function shouldRefreshForTask(task: Task, userId: string, role: AppRole) {
  return role === "admin" || task.created_by === userId || task.doer_id === userId || task.verifier_id === userId;
}

function readStoredHighlights() {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "[]");
    return new Set<string>(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set<string>();
  }
}

function writeStoredHighlights(ids: Set<string>) {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function RealtimeProvider({
  children,
  firmId,
  userId,
  role
}: {
  children: React.ReactNode;
  firmId: string;
  userId: string;
  role: AppRole;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [highlightedTaskIds, setHighlightedTaskIds] = useState<Set<string>>(() => readStoredHighlights());
  const refreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    writeStoredHighlights(highlightedTaskIds);
  }, [highlightedTaskIds]);

  useEffect(() => {
    const supabase = createClient();

    function refreshUi() {
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = window.setTimeout(() => {
        startTransition(() => {
          router.refresh();
        });
      }, 150);
    }

    function handleTaskInsert(payload: RealtimePostgresInsertPayload<Task>) {
      const task = payload.new;
      if (!shouldRefreshForTask(task, userId, role)) return;

      setHighlightedTaskIds((current) => {
        const next = new Set(current);
        next.add(task.id);
        return next;
      });
      refreshUi();
    }

    function handleTaskUpdate(payload: RealtimePostgresUpdatePayload<Task>) {
      if (!shouldRefreshForTask(payload.new, userId, role)) return;
      refreshUi();
    }

    function handleNotificationInsert(payload: RealtimePostgresInsertPayload<Notification>) {
      if (payload.new.user_id !== userId) return;
      refreshUi();
    }

    const channel = supabase
      .channel(`firm-workspace:${firmId}:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tasks", filter: `firm_id=eq.${firmId}` },
        (payload) => handleTaskInsert(payload as RealtimePostgresInsertPayload<Task>)
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tasks", filter: `firm_id=eq.${firmId}` },
        (payload) => handleTaskUpdate(payload as RealtimePostgresUpdatePayload<Task>)
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => handleNotificationInsert(payload as RealtimePostgresInsertPayload<Notification>)
      )
      .subscribe();

    return () => {
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [firmId, role, router, userId]);

  const value = useMemo<RealtimeContextValue>(
    () => ({
      highlightedTaskIds,
      clearTaskHighlight(taskId: string) {
        setHighlightedTaskIds((current) => {
          const next = new Set(current);
          next.delete(taskId);
          return next;
        });
      },
      isPending
    }),
    [highlightedTaskIds, isPending]
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeHighlights() {
  return useContext(RealtimeContext);
}
