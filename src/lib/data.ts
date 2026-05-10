import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildEmployeePerformance, buildTaskReport, filterTasks, type ReportFilters } from "@/lib/reports";
import type { Attendance, Notification, OwnerFirmSummary, Profile, RegistrationCode, TaskWithRelations, AuditLog } from "@/lib/types";

export async function getSessionContext() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    redirect("/onboarding");
  }

  const { data: firm } = await supabase.from("firms").select("*").eq("id", profile.firm_id).single();

  return { supabase, user, profile: profile as Profile, firm };
}

export async function getDashboardData() {
  const context = await getSessionContext();
  const { supabase, profile } = context;

  const taskQuery = supabase
    .from("tasks")
    .select("*, clients(client_name), doer:users!tasks_doer_same_firm(name), verifier:users!tasks_verifier_same_firm(name), creator:users!tasks_creator_same_firm(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  const attendanceQuery = supabase
    .from("attendance")
    .select("*, users(name)")
    .order("check_in", { ascending: false })
    .limit(25);

  const notificationsQuery = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const [{ data: tasks }, { data: attendance }, { data: notifications }] = await Promise.all([
    taskQuery,
    profile.role === "admin" || profile.role === "partner"
      ? attendanceQuery
      : attendanceQuery.eq("user_id", profile.id),
    notificationsQuery
  ]);

  return {
    ...context,
    tasks: (tasks ?? []) as unknown as TaskWithRelations[],
    attendance: (attendance ?? []) as unknown as Attendance[],
    notifications: (notifications ?? []) as Notification[]
  };
}

export async function getTaskPageData() {
  const context = await getSessionContext();
  const { supabase } = context;

  const [tasks, clients, members] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, clients(client_name), doer:users!tasks_doer_same_firm(name), verifier:users!tasks_verifier_same_firm(name), creator:users!tasks_creator_same_firm(name)")
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("*").order("client_name"),
    supabase.from("users").select("*").order("name")
  ]);

  return {
    ...context,
    tasks: (tasks.data ?? []) as unknown as TaskWithRelations[],
    clients: clients.data ?? [],
    members: members.data ?? []
  };
}

export async function getClientsPageData() {
  const context = await getSessionContext();
  const { supabase } = context;
  const { data: clients } = await supabase.from("clients").select("*").order("client_name");

  return {
    ...context,
    clients: clients ?? []
  };
}

export async function getTeamPageData() {
  const context = await getSessionContext();
  const { supabase } = context;
  const [membersResult, tasksResult] = await Promise.all([
    supabase.from("users").select("*").order("role").order("name"),
    supabase.from("tasks").select("id, created_by, doer_id, verifier_id, status")
  ]);

  return {
    ...context,
    members: (membersResult.data ?? []) as Profile[],
    tasks: tasksResult.data ?? []
  };
}

export async function getReportsData(filters: ReportFilters) {
  const context = await getSessionContext();
  const { supabase } = context;

  const [tasksResult, clientsResult, membersResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, clients(client_name), doer:users!tasks_doer_same_firm(name), verifier:users!tasks_verifier_same_firm(name), creator:users!tasks_creator_same_firm(name)")
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("*").order("client_name"),
    supabase.from("users").select("*").order("name")
  ]);

  const filteredTasks = filterTasks((tasksResult.data ?? []) as unknown as TaskWithRelations[], filters);
  const taskReport = buildTaskReport(filteredTasks);

  return {
    ...context,
    clients: clientsResult.data ?? [],
    members: (membersResult.data ?? []) as Profile[],
    taskReport,
    employeePerformance: buildEmployeePerformance(taskReport, (membersResult.data ?? []) as Profile[])
  };
}

export async function getAttendancePageData() {
  const context = await getSessionContext();
  const { supabase, profile } = context;
  const { data: attendance } = await supabase
    .from("attendance")
    .select("*, users(name)")
    .order("check_in", { ascending: false })
    .limit(100);

  const todayParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const today = `${todayParts.find((part) => part.type === "year")?.value}-${todayParts.find((part) => part.type === "month")?.value}-${todayParts.find((part) => part.type === "day")?.value}`;
  const todayRecord = (attendance ?? []).find((entry) => entry.user_id === profile.id && entry.attendance_date === today);

  return {
    ...context,
    attendance: (attendance ?? []) as unknown as Attendance[],
    todayRecord: todayRecord as Attendance | undefined
  };
}

export async function getOwnerDashboardData() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/owner");

  const { data: isOwner } = await supabase.rpc("is_platform_owner");
  if (!isOwner) redirect("/dashboard");

  const [summariesResult, codesResult, logsResult] = await Promise.all([
    supabase.rpc("get_owner_firm_summaries"),
    supabase.from("registration_codes").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50)
  ]);

  return {
    user,
    firms: (summariesResult.data ?? []) as OwnerFirmSummary[],
    codes: (codesResult.data ?? []) as RegistrationCode[],
    auditLogs: (logsResult.data ?? []) as AuditLog[]
  };
}
