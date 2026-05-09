import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionContext } from "@/lib/data";
import { safeJson, sanitizeText } from "@/lib/security";
import { toUserError, validateStatusTransition } from "@/lib/task-workflow";
import type { TaskStatus } from "@/lib/types";

const createTaskApiSchema = z.object({
  client_id: z.string().uuid(),
  title: z.string().transform((value) => sanitizeText(value, 160)).pipe(z.string().min(3)),
  description: z.string().optional().transform((value) => value ? sanitizeText(value, 2000) : undefined),
  doer_id: z.string().uuid(),
  verifier_id: z.string().uuid(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

const updateStatusApiSchema = z.object({
  task_id: z.string().uuid(),
  status: z.enum(["in_progress", "completed", "verified"])
});

export async function GET() {
  try {
    const { supabase } = await getSessionContext();
    const { data, error } = await supabase
      .from("tasks")
      .select("*, clients(client_name), doer:users!tasks_doer_same_firm(name), verifier:users!tasks_verifier_same_firm(name), creator:users!tasks_creator_same_firm(name)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return NextResponse.json({ error: toUserError(error) }, { status: 400 });
    return NextResponse.json({ tasks: data });
  } catch (error) {
    console.error("GET /api/tasks failed", error);
    return NextResponse.json({ error: "Unable to load tasks." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await safeJson(request);
  if (body.error) return NextResponse.json({ error: body.error }, { status: 400 });

  const parsed = createTaskApiSchema.safeParse(body.data);
  if (!parsed.success) return NextResponse.json({ error: "Invalid task payload" }, { status: 422 });

  try {
    const { supabase, profile } = await getSessionContext();
    if (profile.role !== "partner") {
      return NextResponse.json({ error: "Only partners can create tasks" }, { status: 403 });
    }

    if (parsed.data.doer_id === parsed.data.verifier_id) {
      return NextResponse.json({ error: "Doer and verifier must be different users" }, { status: 422 });
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        firm_id: profile.firm_id,
        client_id: parsed.data.client_id,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        created_by: profile.id,
        doer_id: parsed.data.doer_id,
        verifier_id: parsed.data.verifier_id,
        priority: parsed.data.priority,
        deadline: parsed.data.deadline ?? null,
        status: "created"
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: toUserError(error) }, { status: 400 });
    return NextResponse.json({ task: data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks failed", error);
    return NextResponse.json({ error: "Unable to create task." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const body = await safeJson(request, 4096);
  if (body.error) return NextResponse.json({ error: body.error }, { status: 400 });

  const parsed = updateStatusApiSchema.safeParse(body.data);
  if (!parsed.success) return NextResponse.json({ error: "Invalid status payload" }, { status: 422 });

  try {
    const { supabase, profile } = await getSessionContext();
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, status, doer_id, verifier_id")
      .eq("id", parsed.data.task_id)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found or not accessible" }, { status: 404 });
    }

    const permissionError = validateStatusTransition({
      currentStatus: task.status as TaskStatus,
      nextStatus: parsed.data.status,
      task,
      profile
    });

    if (permissionError) return NextResponse.json({ error: permissionError }, { status: 403 });

    const { data, error } = await supabase
      .from("tasks")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.task_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: toUserError(error) }, { status: 400 });
    return NextResponse.json({ task: data });
  } catch (error) {
    console.error("PATCH /api/tasks failed", error);
    return NextResponse.json({ error: "Unable to update task." }, { status: 500 });
  }
}
