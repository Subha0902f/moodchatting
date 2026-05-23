// backend/models/modemodel.ts

import { supabaseAdmin as supabase } from "../config/supabase";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type MoodType = "happy" | "sad" | "angry" | "anxious" | "calm" | "excited" | "tired" | "neutral";

export interface Mode {
  id: string;
  name: string;
  type: MoodType;
  description: string | null;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateModePayload {
  name: string;
  type: MoodType;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  isActive?: boolean;
  userId?: string | null;
}

export interface UpdateModePayload {
  name?: string;
  type?: MoodType;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  isActive?: boolean;
  userId?: string | null;
}

// ─── Mode Model ────────────────────────────────────────────────────────────────

const modeModel = {

  // ── Create a new mode ──────────────────────────────────────────────────

  async create(payload: CreateModePayload): Promise<Mode> {
    const { data, error } = await supabase
      .from("modes")
      .insert([
        {
          name: payload.name,
          type: payload.type,
          description: payload.description || null,
          icon: payload.icon || null,
          color: payload.color || null,
          is_active: payload.isActive !== undefined ? payload.isActive : true,
          user_id: payload.userId || null,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(`modeModel.create: ${error.message}`);

    // Transform snake_case to camelCase
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      description: data.description,
      icon: data.icon,
      color: data.color,
      isActive: data.is_active,
      userId: data.user_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Mode;
  },

  // ── Get a single mode by ID ─────────────────────────────────────────────────

  async getById(modeId: string): Promise<Mode | null> {
    const { data, error } = await supabase
      .from("modes")
      .select("*")
      .eq("id", modeId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // not found
      throw new Error(`modeModel.getById: ${error.message}`);
    }

    // Transform snake_case to camelCase
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      description: data.description,
      icon: data.icon,
      color: data.color,
      isActive: data.is_active,
      userId: data.user_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Mode;
  },

  // ── Get all modes ────────────────────────────────────────────────────────

  async getAll(limit = 20, offset = 0): Promise<Mode[]> {
    const { data, error } = await supabase
      .from("modes")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`modeModel.getAll: ${error.message}`);

    // Transform snake_case to camelCase
    return ((data ?? []) as any[]).map((mode) => ({
      id: mode.id,
      name: mode.name,
      type: mode.type,
      description: mode.description,
      icon: mode.icon,
      color: mode.color,
      isActive: mode.is_active,
      userId: mode.user_id,
      createdAt: mode.created_at,
      updatedAt: mode.updated_at,
    })) as Mode[];
  },

  // ── Get modes by user ID ────────────────────────────────────────────────

  async getByUser(userId: string): Promise<Mode[]> {
    const { data, error } = await supabase
      .from("modes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`modeModel.getByUser: ${error.message}`);

    // Transform snake_case to camelCase
    return ((data ?? []) as any[]).map((mode) => ({
      id: mode.id,
      name: mode.name,
      type: mode.type,
      description: mode.description,
      icon: mode.icon,
      color: mode.color,
      isActive: mode.is_active,
      userId: mode.user_id,
      createdAt: mode.created_at,
      updatedAt: mode.updated_at,
    })) as Mode[];
  },

  // ── Get active modes ────────────────────────────────────────────────────

  async getActive(): Promise<Mode[]> {
    const { data, error } = await supabase
      .from("modes")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`modeModel.getActive: ${error.message}`);

    // Transform snake_case to camelCase
    return ((data ?? []) as any[]).map((mode) => ({
      id: mode.id,
      name: mode.name,
      type: mode.type,
      description: mode.description,
      icon: mode.icon,
      color: mode.color,
      isActive: mode.is_active,
      userId: mode.user_id,
      createdAt: mode.created_at,
      updatedAt: mode.updated_at,
    })) as Mode[];
  },

  // ── Update a mode ──────────────────────────────────────────────────────

  async update(modeId: string, payload: UpdateModePayload): Promise<Mode> {
    const updateData: any = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.type !== undefined) updateData.type = payload.type;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.icon !== undefined) updateData.icon = payload.icon;
    if (payload.color !== undefined) updateData.color = payload.color;
    if (payload.isActive !== undefined) updateData.is_active = payload.isActive;
    if (payload.userId !== undefined) updateData.user_id = payload.userId;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("modes")
      .update(updateData)
      .eq("id", modeId)
      .select()
      .single();

    if (error) throw new Error(`modeModel.update: ${error.message}`);

    // Transform snake_case to camelCase
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      description: data.description,
      icon: data.icon,
      color: data.color,
      isActive: data.is_active,
      userId: data.user_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Mode;
  },

  // ── Delete a mode ──────────────────────────────────────────────────────

  async delete(modeId: string): Promise<void> {
    const { error } = await supabase
      .from("modes")
      .delete()
      .eq("id", modeId);

    if (error) throw new Error(`modeModel.delete: ${error.message}`);
  },

  // ── Toggle mode active status ──────────────────────────────────────────

  async toggleActive(modeId: string): Promise<Mode> {
    const currentMode = await this.getById(modeId);
    if (!currentMode) {
      throw new Error("Mode not found");
    }

    return this.update(modeId, { isActive: !currentMode.isActive });
  },
};

export default modeModel;