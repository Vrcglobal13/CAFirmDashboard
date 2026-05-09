export type AppRole = "admin" | "partner" | "employee";
export type TaskStatus = "created" | "in_progress" | "completed" | "verified";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type Profile = {
  id: string;
  firm_id: string;
  name: string;
  role: AppRole;
  designation: string | null;
  mobile: string | null;
  created_at: string;
  updated_at: string;
};

export type Firm = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  registration_code: string | null;
  is_active: boolean;
  created_at: string;
};

export type OwnerFirmSummary = {
  firm_id: string;
  firm_name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  registration_code: string | null;
  is_active: boolean;
  created_at: string;
  tasks_count: number;
  partners_count: number;
  clients_count: number;
  team_count: number;
};

export type RegistrationCode = {
  code: string;
  firm_id: string | null;
  created_by: string | null;
  created_at: string;
  used_at: string | null;
  notes: string | null;
};

export type Client = {
  id: string;
  firm_id: string;
  client_name: string;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  firm_id: string;
  client_id: string;
  title: string;
  description: string | null;
  created_by: string;
  doer_id: string;
  verifier_id: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  verified_at: string | null;
};

export type TaskWithRelations = Task & {
  clients: Pick<Client, "client_name"> | null;
  doer: Pick<Profile, "name"> | null;
  verifier: Pick<Profile, "name"> | null;
  creator: Pick<Profile, "name"> | null;
};

export type Attendance = {
  id: string;
  user_id: string;
  firm_id: string;
  attendance_date: string;
  check_in: string;
  check_out: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  working_minutes: number | null;
  users?: Pick<Profile, "name"> | null;
};

export type Notification = {
  id: string;
  firm_id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

export type TaskLog = {
  id: string;
  firm_id: string;
  task_id: string;
  action: string;
  user_id: string | null;
  timestamp: string;
  remarks: string | null;
};

export type Database = {
  public: {
    Tables: {
      firms: {
        Row: Firm;
        Insert: Omit<Firm, "id" | "created_at"> & Partial<Pick<Firm, "id" | "created_at">>;
        Update: Partial<Omit<Firm, "id" | "created_at">>;
        Relationships: [];
      };
      users: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at"> & Partial<Pick<Profile, "created_at" | "updated_at">>;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
        Relationships: [];
      };
      clients: {
        Row: Client;
        Insert: Omit<Client, "id" | "created_at" | "updated_at"> & Partial<Pick<Client, "id" | "created_at" | "updated_at">>;
        Update: Partial<Omit<Client, "id" | "created_at">>;
        Relationships: [];
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, "id" | "created_at" | "updated_at" | "started_at" | "completed_at" | "verified_at"> &
          Partial<Pick<Task, "id" | "created_at" | "updated_at" | "status" | "started_at" | "completed_at" | "verified_at">>;
        Update: Partial<Omit<Task, "id" | "created_at" | "firm_id">>;
        Relationships: [];
      };
      task_logs: {
        Row: TaskLog;
        Insert: {
          id?: string;
          firm_id: string;
          task_id: string;
          action: string;
          user_id?: string | null;
          timestamp?: string;
          remarks?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      attendance: {
        Row: Attendance;
        Insert: Omit<Attendance, "id" | "check_in" | "check_out" | "created_at" | "working_minutes" | "users"> &
          Partial<Pick<Attendance, "id" | "check_in" | "check_out" | "created_at" | "working_minutes">>;
        Update: Partial<Pick<Attendance, "check_out" | "latitude" | "longitude">>;
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, "id" | "created_at" | "is_read" | "read_at"> &
          Partial<Pick<Notification, "id" | "created_at" | "is_read" | "read_at">>;
        Update: Partial<Pick<Notification, "is_read" | "read_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_firm_and_admin: {
        Args: {
          registration_code: string;
          firm_name: string;
          firm_address: string;
          firm_phone: string;
          firm_email: string;
          full_name: string;
        };
        Returns: Profile;
      };
      create_team_member_profile: {
        Args: {
          p_registration_code: string;
          p_full_name: string;
          p_member_designation: string;
          p_member_mobile: string;
        };
        Returns: Profile;
      };
    };
    Enums: {
      app_role: AppRole;
      task_status: TaskStatus;
      task_priority: TaskPriority;
    };
    CompositeTypes: Record<string, never>;
  };
};
