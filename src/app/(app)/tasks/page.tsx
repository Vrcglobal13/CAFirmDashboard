import { ClientForm } from "@/components/tasks/ClientForm";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskList } from "@/components/tasks/TaskList";
import { getTaskPageData } from "@/lib/data";

export default async function TasksPage() {
  const { profile, tasks, clients, members } = await getTaskPageData();
  const canManageClients = ["admin", "partner"].includes(profile.role);
  const canCreateTask = ["admin", "partner"].includes(profile.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create, assign, complete, and verify work with audit logs.</p>
      </div>
      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <ClientForm canCreate={canManageClients} />
          <TaskForm clients={clients} members={members} canCreate={canCreateTask} />
        </div>
        <TaskList tasks={tasks} profile={profile} />
      </section>
    </div>
  );
}
