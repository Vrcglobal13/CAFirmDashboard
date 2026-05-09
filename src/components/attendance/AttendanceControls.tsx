"use client";

import { useEffect, useState, useTransition } from "react";
import { MapPin, Timer, TimerOff } from "lucide-react";
import { checkInWithLocation, checkOut } from "@/lib/actions/attendance";
import type { Attendance } from "@/lib/types";
import { formatDuration, formatDateTime, minutesBetween } from "@/lib/utils";

export function AttendanceControls({ todayRecord }: { todayRecord?: Attendance }) {
  const [error, setError] = useState("");
  const [, setClockTick] = useState(0);
  const [pending, startTransition] = useTransition();
  const isCheckedIn = Boolean(todayRecord && !todayRecord.check_out);
  const hasCheckedOut = Boolean(todayRecord?.check_out);
  const totalMinutes = todayRecord
    ? todayRecord.working_minutes ?? minutesBetween(todayRecord.check_in, todayRecord.check_out)
    : null;

  useEffect(() => {
    if (!isCheckedIn) return;

    const timer = window.setInterval(() => setClockTick((tick) => tick + 1), 60000);
    return () => window.clearInterval(timer);
  }, [isCheckedIn]);

  function captureLocation() {
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        startTransition(async () => {
          const result = await checkInWithLocation(position.coords.latitude, position.coords.longitude);
          if (result?.error) setError(result.error);
        });
      },
      () => setError("Location permission is required for attendance."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Attendance</h2>
          <p className="mt-1 text-sm text-muted-foreground">One geo-tagged check-in is allowed per day.</p>
        </div>
        <MapPin className="text-primary" size={20} />
      </div>

      <div className="mt-5 rounded-md bg-muted p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Today</p>
        <p className="mt-1 text-lg font-semibold">
          {!todayRecord ? "Not checked in" : isCheckedIn ? "Checked in" : "Checked out"}
        </p>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Check in</dt>
            <dd className="text-right">{formatDateTime(todayRecord?.check_in ?? null)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Check out</dt>
            <dd className="text-right">{formatDateTime(todayRecord?.check_out ?? null)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Working hours</dt>
            <dd className="font-semibold">{formatDuration(totalMinutes)}</dd>
          </div>
        </dl>
      </div>

      {isCheckedIn && todayRecord ? (
        <button
          className="btn-primary mt-5"
          disabled={pending}
          onClick={() => startTransition(async () => {
            const result = await checkOut(todayRecord.id);
            if (result?.error) setError(result.error);
          })}
        >
          <TimerOff size={16} />
          Check out
        </button>
      ) : hasCheckedOut ? (
        <button className="btn-secondary mt-5" disabled>
          <TimerOff size={16} />
          Attendance completed
        </button>
      ) : (
        <button className="btn-primary mt-5" disabled={pending} onClick={captureLocation}>
          <Timer size={16} />
          Check in
        </button>
      )}
      {error ? <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
