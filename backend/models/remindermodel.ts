// backend/models/remindermodel.ts

import { supabaseAdmin as supabase } from "../config/supabase";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ReminderStatus = "pending" | "completed" | "overdue" | "cancelled";
export type ReminderCategory = "personal" | "work" | "health" | "shopping" | "finance" | "other";
export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly";

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime?: string;
  status: ReminderStatus;
  category: ReminderCategory;
  priority: "low" | "medium" | "high";
  isRecurring: boolean;
  recurrenceType: RecurrenceType;
  recurrenceEndDate?: string;
  tags: string[];
  notificationSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderPayload {
  userId: string;
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  category?: ReminderCategory;
  priority?: "low" | "medium" | "high";
  isRecurring?: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceEndDate?: string;
  tags?: string[];
}

export interface UpdateReminderPayload {
  title?: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  status?: ReminderStatus;
  category?: ReminderCategory;
  priority?: "low" | "medium" | "high";
  isRecurring?: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceEndDate?: string;
  tags?: string[];
}

// ─── Reminder Model ────────────────────────────────────────────────────────────

const ReminderModel = {

  // ── Create a new reminder ──────────────────────────────────────────────────

  async create(payload: CreateReminderPayload): Promise<Reminder> {
    const { data, error } = await supabase
      .from("reminders")
      .insert([
        {
          user_id: payload.userId,
          title: payload.title,
          description: payload.description || "",
          due_date: payload.dueDate,
          due_time: payload.dueTime || null,
          status: "pending",
          category: payload.category || "other",
          priority: payload.priority || "medium",
          is_recurring: payload.isRecurring || false,
          recurrence_type: payload.recurrenceType || "none",
          recurrence_end_date: payload.recurrenceEndDate || null,
          tags: payload.tags || [],
          notification_sent: false,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(`ReminderModel.create: ${error.message}`);

    // Transform snake_case to camelCase
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      dueDate: data.due_date,
      dueTime: data.due_time,
      status: data.status,
      category: data.category,
      priority: data.priority,
      isRecurring: data.is_recurring,
      recurrenceType: data.recurrence_type,
      recurrenceEndDate: data.recurrence_end_date,
      tags: data.tags,
      notificationSent: data.notification_sent,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Reminder;
  },

  // ── Get a single reminder by ID ─────────────────────────────────────────────

  async getById(reminderId: string): Promise<Reminder | null> {
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("id", reminderId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // not found
      throw new Error(`ReminderModel.getById: ${error.message}`);
    }

    // Transform snake_case to camelCase
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      dueDate: data.due_date,
      dueTime: data.due_time,
      status: data.status,
      category: data.category,
      priority: data.priority,
      isRecurring: data.is_recurring,
      recurrenceType: data.recurrence_type,
      recurrenceEndDate: data.recurrence_end_date,
      tags: data.tags,
      notificationSent: data.notification_sent,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Reminder;
  },

  // ── Get all reminders ──────────────────────────────────────────────────────

  async getAll(limit = 20, offset = 0): Promise<Reminder[]> {
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .order("due_date", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`ReminderModel.getAll: ${error.message}`);

    // Transform snake_case to camelCase
    return ((data ?? []) as any[]).map((reminder) => ({
      id: reminder.id,
      userId: reminder.user_id,
      title: reminder.title,
      description: reminder.description,
      dueDate: reminder.due_date,
      dueTime: reminder.due_time,
      status: reminder.status,
      category: reminder.category,
      priority: reminder.priority,
      isRecurring: reminder.is_recurring,
      recurrenceType: reminder.recurrence_type,
      recurrenceEndDate: reminder.recurrence_end_date,
      tags: reminder.tags,
      notificationSent: reminder.notification_sent,
      createdAt: reminder.created_at,
      updatedAt: reminder.updated_at,
    })) as Reminder[];
  },

  // ── Get reminders by user ID ────────────────────────────────────────────

  async getByUser(userId: string): Promise<Reminder[]> {
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", userId)
      .order("due_date", { ascending: true });

    if (error) throw new Error(`ReminderModel.getByUser: ${error.message}`);

    // Transform snake_case to camelCase
    return ((data ?? []) as any[]).map((reminder) => ({
      id: reminder.id,
      userId: reminder.user_id,
      title: reminder.title,
      description: reminder.description,
      dueDate: reminder.due_date,
      dueTime: reminder.due_time,
      status: reminder.status,
      category: reminder.category,
      priority: reminder.priority,
      isRecurring: reminder.is_recurring,
      recurrenceType: reminder.recurrence_type,
      recurrenceEndDate: reminder.recurrence_end_date,
      tags: reminder.tags,
      notificationSent: reminder.notification_sent,
      createdAt: reminder.created_at,
      updatedAt: reminder.updated_at,
    })) as Reminder[];
  },

  // ── Get upcoming reminders for a user ────────────────────────────────────

  async getUpcoming(userId: string, days = 7): Promise<Reminder[]> {
    const today = new Date().toISOString().split("T")[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const futureDateStr = futureDate.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["pending", "overdue"])
      .gte("due_date", today)
      .lte("due_date", futureDateStr)
      .order("due_date", { ascending: true })
      .order("due_time", { ascending: true });

    if (error) throw new Error(`ReminderModel.getUpcoming: ${error.message}`);

    // Transform snake_case to camelCase
    return ((data ?? []) as any[]).map((reminder) => ({
      id: reminder.id,
      userId: reminder.user_id,
      title: reminder.title,
      description: reminder.description,
      dueDate: reminder.due_date,
      dueTime: reminder.due_time,
      status: reminder.status,
      category: reminder.category,
      priority: reminder.priority,
      isRecurring: reminder.is_recurring,
      recurrenceType: reminder.recurrence_type,
      recurrenceEndDate: reminder.recurrence_end_date,
      tags: reminder.tags,
      notificationSent: reminder.notification_sent,
      createdAt: reminder.created_at,
      updatedAt: reminder.updated_at,
    })) as Reminder[];
  },

  // ── Get reminders by status ────────────────────────────────────────────

  async getByStatus(userId: string, status: ReminderStatus): Promise<Reminder[]> {
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", userId)
      .eq("status", status)
      .order("due_date", { ascending: true });

    if (error) throw new Error(`ReminderModel.getByStatus: ${error.message}`);

    // Transform snake_case to camelCase
    return ((data ?? []) as any[]).map((reminder) => ({
      id: reminder.id,
      userId: reminder.user_id,
      title: reminder.title,
      description: reminder.description,
      dueDate: reminder.due_date,
      dueTime: reminder.due_time,
      status: reminder.status,
      category: reminder.category,
      priority: reminder.priority,
      isRecurring: reminder.is_recurring,
      recurrenceType: reminder.recurrence_type,
      recurrenceEndDate: reminder.recurrence_end_date,
      tags: reminder.tags,
      notificationSent: reminder.notification_sent,
      createdAt: reminder.created_at,
      updatedAt: reminder.updated_at,
    })) as Reminder[];
  },

  // ── Get reminders by category ──────────────────────────────────────────

  async getByCategory(userId: string, category: ReminderCategory): Promise<Reminder[]> {
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", userId)
      .eq("category", category)
      .order("due_date", { ascending: true });

    if (error) throw new Error(`ReminderModel.getByCategory: ${error.message}`);

    // Transform snake_case to camelCase
    return ((data ?? []) as any[]).map((reminder) => ({
      id: reminder.id,
      userId: reminder.user_id,
      title: reminder.title,
      description: reminder.description,
      dueDate: reminder.due_date,
      dueTime: reminder.due_time,
      status: reminder.status,
      category: reminder.category,
      priority: reminder.priority,
      isRecurring: reminder.is_recurring,
      recurrenceType: reminder.recurrence_type,
      recurrenceEndDate: reminder.recurrence_end_date,
      tags: reminder.tags,
      notificationSent: reminder.notification_sent,
      createdAt: reminder.created_at,
      updatedAt: reminder.updated_at,
    })) as Reminder[];
  },

  // ── Get overdue reminders ──────────────────────────────────────────────

  async getOverdue(userId: string): Promise<Reminder[]> {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", userId)
      .lt("due_date", today)
      .in("status", ["pending", "overdue"])
      .order("due_date", { ascending: true });

    if (error) throw new Error(`ReminderModel.getOverdue: ${error.message}`);

    // Transform snake_case to camelCase
    return ((data ?? []) as any[]).map((reminder) => ({
      id: reminder.id,
      userId: reminder.user_id,
      title: reminder.title,
      description: reminder.description,
      dueDate: reminder.due_date,
      dueTime: reminder.due_time,
      status: reminder.status,
      category: reminder.category,
      priority: reminder.priority,
      isRecurring: reminder.is_recurring,
      recurrenceType: reminder.recurrence_type,
      recurrenceEndDate: reminder.recurrence_end_date,
      tags: reminder.tags,
      notificationSent: reminder.notification_sent,
      createdAt: reminder.created_at,
      updatedAt: reminder.updated_at,
    })) as Reminder[];
  },

  // ── Update a reminder ──────────────────────────────────────────────────

  async update(reminderId: string, payload: UpdateReminderPayload): Promise<Reminder> {
    const updateData: any = {};
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.dueDate !== undefined) updateData.due_date = payload.dueDate;
    if (payload.dueTime !== undefined) updateData.due_time = payload.dueTime;
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.category !== undefined) updateData.category = payload.category;
    if (payload.priority !== undefined) updateData.priority = payload.priority;
    if (payload.isRecurring !== undefined) updateData.is_recurring = payload.isRecurring;
    if (payload.recurrenceType !== undefined) updateData.recurrence_type = payload.recurrenceType;
    if (payload.recurrenceEndDate !== undefined) updateData.recurrence_end_date = payload.recurrenceEndDate;
    if (payload.tags !== undefined) updateData.tags = payload.tags;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("reminders")
      .update(updateData)
      .eq("id", reminderId)
      .select()
      .single();

    if (error) throw new Error(`ReminderModel.update: ${error.message}`);

    // Transform snake_case to camelCase
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      dueDate: data.due_date,
      dueTime: data.due_time,
      status: data.status,
      category: data.category,
      priority: data.priority,
      isRecurring: data.is_recurring,
      recurrenceType: data.recurrence_type,
      recurrenceEndDate: data.recurrence_end_date,
      tags: data.tags,
      notificationSent: data.notification_sent,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Reminder;
  },

  // ── Delete a reminder ──────────────────────────────────────────────────

  async delete(reminderId: string): Promise<void> {
    const { error } = await supabase
      .from("reminders")
      .delete()
      .eq("id", reminderId);

    if (error) throw new Error(`ReminderModel.delete: ${error.message}`);
  },

  // ── Search reminders ───────────────────────────────────────────────────

  async search(userId: string, searchTerm: string): Promise<Reminder[]> {
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", userId)
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order("due_date", { ascending: true });

    if (error) throw new Error(`ReminderModel.search: ${error.message}`);

    // Transform snake_case to camelCase
    return ((data ?? []) as any[]).map((reminder) => ({
      id: reminder.id,
      userId: reminder.user_id,
      title: reminder.title,
      description: reminder.description,
      dueDate: reminder.due_date,
      dueTime: reminder.due_time,
      status: reminder.status,
      category: reminder.category,
      priority: reminder.priority,
      isRecurring: reminder.is_recurring,
      recurrenceType: reminder.recurrence_type,
      recurrenceEndDate: reminder.recurrence_end_date,
      tags: reminder.tags,
      notificationSent: reminder.notification_sent,
      createdAt: reminder.created_at,
      updatedAt: reminder.updated_at,
    })) as Reminder[];
  },

  // ── Mark reminder as completed ─────────────────────────────────────────

  async markCompleted(reminderId: string): Promise<Reminder> {
    return this.update(reminderId, { status: "completed" });
  },

  // ── Get reminders by tag ───────────────────────────────────────────────

  async getByTag(userId: string, tag: string): Promise<Reminder[]> {
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", userId)
      .contains("tags", [tag])
      .order("due_date", { ascending: true });

    if (error) throw new Error(`ReminderModel.getByTag: ${error.message}`);

    // Transform snake_case to camelCase
    return ((data ?? []) as any[]).map((reminder) => ({
      id: reminder.id,
      userId: reminder.user_id,
      title: reminder.title,
      description: reminder.description,
      dueDate: reminder.due_date,
      dueTime: reminder.due_time,
      status: reminder.status,
      category: reminder.category,
      priority: reminder.priority,
      isRecurring: reminder.is_recurring,
      recurrenceType: reminder.recurrence_type,
      recurrenceEndDate: reminder.recurrence_end_date,
      tags: reminder.tags,
      notificationSent: reminder.notification_sent,
      createdAt: reminder.created_at,
      updatedAt: reminder.updated_at,
    })) as Reminder[];
  },
};

export default ReminderModel;
