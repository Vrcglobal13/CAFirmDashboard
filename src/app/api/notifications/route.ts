import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionContext } from "@/lib/data";
import { safeJson } from "@/lib/security";
import { toUserError } from "@/lib/task-workflow";

const markReadSchema = z.object({
  notification_id: z.string().uuid().optional(),
  all: z.boolean().optional()
});

export async function GET() {
  try {
    const { supabase, profile } = await getSessionContext();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: toUserError(error) }, { status: 400 });
    return NextResponse.json({ notifications: data });
  } catch (error) {
    console.error("GET /api/notifications failed", error);
    return NextResponse.json({ error: "Unable to load notifications." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const body = await safeJson(request, 4096);
  if (body.error) return NextResponse.json({ error: body.error }, { status: 400 });

  const parsed = markReadSchema.safeParse(body.data);

  if (!parsed.success || (!parsed.data.notification_id && !parsed.data.all)) {
    return NextResponse.json({ error: "Provide notification_id or all=true" }, { status: 422 });
  }

  try {
    const { supabase, profile } = await getSessionContext();
    let query = supabase.from("notifications").update({ is_read: true }).eq("user_id", profile.id);

    if (parsed.data.notification_id) {
      query = query.eq("id", parsed.data.notification_id);
    } else {
      query = query.eq("is_read", false);
    }

    const { error } = await query;

    if (error) return NextResponse.json({ error: toUserError(error) }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/notifications failed", error);
    return NextResponse.json({ error: "Unable to update notifications." }, { status: 500 });
  }
}
