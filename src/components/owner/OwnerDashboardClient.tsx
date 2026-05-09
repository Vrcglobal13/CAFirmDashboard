"use client";

import { useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleDashed,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Users,
  Settings,
  Activity,
  UserPlus
} from "lucide-react";
import { RegistrationCodeForm } from "@/components/owner/RegistrationCodeForm";
import type { OwnerFirmSummary, RegistrationCode } from "@/lib/types";
import { toggleFirmStatus } from "@/lib/actions/owner";

type OwnerDashboardClientProps = {
  firms: OwnerFirmSummary[];
  codes: RegistrationCode[];
};

export function OwnerDashboardClient({ firms, codes }: OwnerDashboardClientProps) {
  const [activeTab, setActiveTab] = useState("dashboard");

  const issuedCodes = codes.length;
  const usedCodes = codes.filter((code) => code.used_at).length;
  const availableCodes = issuedCodes - usedCodes;
  const totalTasks = firms.reduce((sum, firm) => sum + Number(firm.tasks_count), 0);
  const totalClients = firms.reduce((sum, firm) => sum + Number(firm.clients_count), 0);
  const totalTeam = firms.reduce((sum, firm) => sum + Number(firm.team_count), 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newRegistrations = firms.filter(firm => new Date(firm.created_at) > thirtyDaysAgo).length;

  const metrics = [
    { label: "Total firms", value: firms.length, icon: Building2 },
    { label: "Active users", value: totalTeam, icon: Users },
    { label: "Total tasks", value: totalTasks, icon: BriefcaseBusiness },
    { label: "New registrations", value: newRegistrations, icon: UserPlus }
  ];

  const handleToggleFirmStatus = async (firmId: string) => {
    await toggleFirmStatus(firmId);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="panel p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
              <span className="grid h-9 w-9 place-items-center rounded-md bg-muted text-primary">
                <metric.icon size={18} />
              </span>
            </div>
            <p className="mt-4 text-3xl font-semibold">{metric.value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="panel p-5">
           <h2 className="text-lg font-semibold mb-4">Platform Overview</h2>
           <div className="space-y-4 text-sm">
             <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Total Firms</span><span className="font-semibold">{firms.length}</span></div>
             <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Total Active Users</span><span className="font-semibold">{totalTeam}</span></div>
             <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Total Created Tasks</span><span className="font-semibold">{totalTasks}</span></div>
             <div className="flex justify-between pb-2"><span className="text-muted-foreground">Total Tracked Clients</span><span className="font-semibold">{totalClients}</span></div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderFirms = () => (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold">Registered firms</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tenant-level records and aggregate activity.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="badge bg-white text-muted-foreground">{totalTeam} team members</span>
          <span className="badge bg-white text-muted-foreground">{usedCodes} codes used</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead className="border-b border-border bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Firm</th>
              <th className="px-5 py-3">Contact</th>
              <th className="px-5 py-3">Registration</th>
              <th className="px-5 py-3 text-right">Tasks</th>
              <th className="px-5 py-3 text-right">Partners</th>
              <th className="px-5 py-3 text-right">Clients</th>
              <th className="px-5 py-3 text-right">Team</th>
              <th className="px-5 py-3 text-right">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {firms.map((firm) => (
              <tr key={firm.firm_id} className="align-top transition hover:bg-muted/35">
                <td className="px-5 py-4">
                  <div className="flex gap-3">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-white text-primary">
                      <Building2 size={17} />
                    </span>
                    <div>
                      <p className="font-semibold">{firm.firm_name}</p>
                      <p className="mt-1 flex max-w-[340px] items-start gap-1.5 text-xs leading-5 text-muted-foreground">
                        <MapPin className="mt-0.5 shrink-0" size={13} />
                        <span>{firm.address ?? "Address not provided"}</span>
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-muted-foreground" />
                    {firm.phone ?? "-"}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-muted-foreground">
                    <Mail size={14} />
                    {firm.email ?? "-"}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <p className="font-mono text-sm font-semibold">{firm.registration_code ?? "-"}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-primary">
                    <BadgeCheck size={13} />
                    Active since {new Date(firm.created_at).toLocaleDateString()}
                  </p>
                </td>
                <td className="px-5 py-4 text-right text-base font-semibold">{firm.tasks_count}</td>
                <td className="px-5 py-4 text-right text-base font-semibold">{firm.partners_count}</td>
                <td className="px-5 py-4 text-right text-base font-semibold">{firm.clients_count}</td>
                <td className="px-5 py-4 text-right text-base font-semibold">{firm.team_count}</td>
                <td className="px-5 py-4 text-right">
                  <span className={`badge ${firm.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                    {firm.is_active ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => handleToggleFirmStatus(firm.firm_id)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {firm.is_active ? 'Suspend' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {firms.length === 0 ? (
              <tr>
                <td className="px-5 py-12 text-center text-muted-foreground" colSpan={9}>
                  No firms have registered yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCodes = () => (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-6">
        <RegistrationCodeForm />
      </div>
      <div className="panel overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Code inventory</h2>
            <span className="badge bg-white text-muted-foreground">{issuedCodes} total</span>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
          <div className="p-5">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CircleDashed size={16} />
              Available
            </p>
            <p className="mt-2 text-2xl font-semibold">{availableCodes}</p>
          </div>
          <div className="p-5">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 size={16} />
              Used
            </p>
            <p className="mt-2 text-2xl font-semibold">{usedCodes}</p>
          </div>
        </div>
        <div className="max-h-[480px] divide-y divide-border overflow-y-auto">
          {codes.map((code) => (
            <div key={code.code} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-sm font-semibold">{code.code}</span>
                <span
                  className={`badge ${
                    code.used_at
                      ? "border-primary/20 bg-primary/10 text-primary"
                      : "border-border bg-white text-muted-foreground"
                  }`}
                >
                  {code.used_at ? "Used" : "Available"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{code.notes || "No note"}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Created {new Date(code.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
          {codes.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No codes created.</p> : null}
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="panel p-5">
      <h2 className="text-lg font-semibold mb-4">Platform Analytics</h2>
      <div className="space-y-4">
        <div className="rounded-lg border p-4 bg-muted/20">
          <h3 className="font-medium text-sm text-muted-foreground">Firm Growth</h3>
          <p className="mt-2 text-2xl font-semibold">+{newRegistrations} <span className="text-sm font-normal text-muted-foreground">in last 30 days</span></p>
        </div>
        <div className="rounded-lg border p-4 bg-muted/20">
          <h3 className="font-medium text-sm text-muted-foreground">User Growth</h3>
          <p className="mt-2 text-2xl font-semibold">{totalTeam} <span className="text-sm font-normal text-muted-foreground">total users</span></p>
        </div>
        <div className="rounded-lg border p-4 bg-muted/20">
          <h3 className="font-medium text-sm text-muted-foreground">Task Metrics</h3>
          <p className="mt-2 text-2xl font-semibold">{totalTasks} <span className="text-sm font-normal text-muted-foreground">total tasks created</span></p>
        </div>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="panel p-5">
      <h2 className="text-lg font-semibold mb-4">Support & Audit Logs</h2>
      <p className="text-sm text-muted-foreground mb-4">View recent system activity and support tickets.</p>
      <div className="rounded-lg border bg-muted/10 h-64 flex items-center justify-center text-muted-foreground text-sm">
        Log viewer component will be integrated here.
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="panel p-5">
      <h2 className="text-lg font-semibold mb-4">Platform Settings</h2>
      <div className="space-y-6">
        <div>
          <h3 className="font-medium text-sm mb-2">SMTP Configuration</h3>
          <p className="text-sm text-muted-foreground mb-2">Configure email delivery settings for the platform.</p>
          <div className="flex gap-2">
            <button className="btn-secondary" disabled>Configure SMTP</button>
          </div>
        </div>
        <div className="border-t pt-4">
          <h3 className="font-medium text-sm mb-2">Branding</h3>
          <p className="text-sm text-muted-foreground mb-2">Manage logos, colors, and platform identity.</p>
          <div className="flex gap-2">
            <button className="btn-secondary" disabled>Update Branding</button>
          </div>
        </div>
        <div className="border-t pt-4">
          <h3 className="font-medium text-sm mb-2">Feature Toggles</h3>
          <p className="text-sm text-muted-foreground mb-2">Enable or disable beta features across all tenants.</p>
          <div className="flex gap-2">
            <button className="btn-secondary" disabled>Manage Features</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 md:px-8">
      <div className="flex space-x-1 border-b border-border overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
            activeTab === "dashboard"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
          }`}
        >
          Dashboard Overview
        </button>
        <button
          onClick={() => setActiveTab("firms")}
          className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
            activeTab === "firms"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
          }`}
        >
          Firms Management
        </button>
        <button
          onClick={() => setActiveTab("codes")}
          className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
            activeTab === "codes"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
          }`}
        >
          Registration Codes
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
            activeTab === "analytics"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
          }`}
        >
          Platform Analytics
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
            activeTab === "logs"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
          }`}
        >
          Support & Logs
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
            activeTab === "settings"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
          }`}
        >
          Platform Settings
        </button>
      </div>

      <div className="mt-6">
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "firms" && renderFirms()}
        {activeTab === "codes" && renderCodes()}
        {activeTab === "analytics" && renderAnalytics()}
        {activeTab === "logs" && renderLogs()}
        {activeTab === "settings" && renderSettings()}
      </div>
    </div>
  );
}
