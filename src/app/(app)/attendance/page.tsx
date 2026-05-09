import { AttendanceControls } from "@/components/attendance/AttendanceControls";
import { getAttendancePageData } from "@/lib/data";
import { formatDateTime, formatDuration, minutesBetween } from "@/lib/utils";

export default async function AttendancePage() {
  const { attendance, todayRecord } = await getAttendancePageData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Attendance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Geo-tagged check-ins with one attendance record per day.</p>
      </div>
      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <AttendanceControls todayRecord={todayRecord} />
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Check in</th>
                  <th className="px-4 py-3">Check out</th>
                  <th className="px-4 py-3">Hours</th>
                  <th className="px-4 py-3">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attendance.map((entry) => {
                  const totalMinutes = entry.working_minutes ?? minutesBetween(entry.check_in, entry.check_out);

                  return (
                    <tr key={entry.id}>
                      <td className="px-4 py-4">{entry.users?.name ?? "You"}</td>
                      <td className="px-4 py-4">{entry.attendance_date}</td>
                      <td className="px-4 py-4">{formatDateTime(entry.check_in)}</td>
                      <td className="px-4 py-4">{formatDateTime(entry.check_out)}</td>
                      <td className="px-4 py-4 font-medium">{formatDuration(totalMinutes)}</td>
                      <td className="px-4 py-4 text-xs text-muted-foreground">
                        {entry.latitude != null && entry.longitude != null ? `${entry.latitude}, ${entry.longitude}` : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
