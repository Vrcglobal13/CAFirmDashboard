import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default"
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "accent";
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={tone === "accent" ? "text-accent" : "text-primary"}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}
